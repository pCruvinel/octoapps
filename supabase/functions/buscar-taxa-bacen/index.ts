
// Edge Function para buscar taxa média do BACEN
// Consulta banco local (cache) antes de ir na API externa

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchBacenSeries, formatDateToBacen, parseBacenValue } from "../_shared/bacen-fetcher.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    // Accept both dataContrato and dataReferencia for backwards compatibility
    const dataContrato = body.dataContrato || body.dataReferencia;
    const codigoSerie = body.codigoSerie;

    if (!dataContrato) {
      return new Response(
        JSON.stringify({ error: 'Data do contrato é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default series codes if not provided
    // Imobiliário TR: 226
    // Pessoal PF: 25471
    const serieCode = codigoSerie ? parseInt(codigoSerie) : 25471;

    // Init Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const [anoStr, mesStr, diaStr] = dataContrato.split('-');
    const ano = parseInt(anoStr);
    const mes = parseInt(mesStr);

    console.log(`[BuscarTaxa] Date: ${dataContrato}, Series: ${serieCode}`);

    // 1. Try Cache
    const { data: cachedData, error: cacheError } = await supabase
      .from('taxas_bacen_historico')
      .select('*')
      .eq('serie_bacen', serieCode.toString())
      .eq('ano', ano)
      .eq('mes', mes)
      .single();

    if (cachedData) {
      console.log('[BuscarTaxa] Cache hit');
      return new Response(
        JSON.stringify({
          success: true,
          fonte: 'CACHE_DB',
          data: `${diaStr}/${mesStr}/${anoStr}`,
          taxaMediaMensal: cachedData.taxa_mensal_decimal,
          taxaMediaAnual: cachedData.taxa_anual_decimal,
          taxaMediaMensalPercent: cachedData.taxa_mensal_percent,
          taxaMediaAnualPercent: (cachedData.taxa_anual_decimal * 100).toFixed(2),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch Live (Fallback)
    console.log('[BuscarTaxa] Cache miss, fetching live...');
    const bacenDate = `${diaStr}/${mesStr}/${anoStr}`;
    // Only need 1 point but seriesFetcher returns array
    try {
      const points = await fetchBacenSeries(serieCode, bacenDate, bacenDate);

      if (points.length > 0) {
        const point = points[points.length - 1]; // Last point
        const val = parseBacenValue(point.valor); // Valor bruto retornado pelo BACEN

        // IMPORTANTE: Séries de crédito retornam taxa ANUAL diretamente (% a.a.)
        // Ex: Série 20773 retorna 8.5 = 8.5% ao ano
        // Ex: Série 20749 retorna 25.5 = 25.5% ao ano
        // Séries de índices (TR, IPCA) retornam taxa MENSAL (% a.m.)
        const seriesAnuais = [20742, 20749, 20773, 25497, 25471, 20739, 20718, 20719, 20720, 20752];
        const isSerieAnual = seriesAnuais.includes(serieCode);

        let taxaMensalPercent: number;
        let taxaMensalDecimal: number;
        let taxaAnualPercent: number;
        let taxaAnualDecimal: number;

        if (isSerieAnual) {
          // Série retorna taxa ANUAL em percentual
          // val = 8.5 significa 8.5% a.a.
          taxaAnualPercent = val;
          taxaAnualDecimal = val / 100;
          taxaMensalDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;
          taxaMensalPercent = taxaMensalDecimal * 100;
          console.log(`[BuscarTaxa] Série ${serieCode} (ANUAL): ${taxaAnualPercent}% a.a. → ${taxaMensalPercent.toFixed(4)}% a.m.`);
        } else {
          // Série retorna taxa MENSAL em percentual (ex: TR, IPCA)
          // val = 0.5 significa 0.5% a.m.
          taxaMensalPercent = val;
          taxaMensalDecimal = val / 100;
          taxaAnualDecimal = Math.pow(1 + taxaMensalDecimal, 12) - 1;
          taxaAnualPercent = taxaAnualDecimal * 100;
          console.log(`[BuscarTaxa] Série ${serieCode} (MENSAL): ${taxaMensalPercent}% a.m. → ${taxaAnualPercent.toFixed(4)}% a.a.`);
        }

        // Background insert to cache
        await supabase.from('taxas_bacen_historico').upsert({
          serie_bacen: serieCode.toString(),
          ano: ano,
          mes: mes,
          ano_mes: `${ano}-${mes}`,
          taxa_mensal_percent: taxaMensalPercent,
          taxa_mensal_decimal: taxaMensalDecimal,
          taxa_anual_decimal: taxaAnualDecimal,
          data_atualizacao: new Date().toISOString(),
          modalidade: 'ON_DEMAND',
          fonte: 'BACEN_SGS_LIVE'
        }, { onConflict: 'serie_bacen, ano, mes' });

        return new Response(
          JSON.stringify({
            success: true,
            fonte: 'SGS_LIVE',
            data: point.data,
            taxaMediaMensal: taxaMensalDecimal,
            taxaMediaAnual: taxaAnualDecimal,
            taxaMediaMensalPercent: taxaMensalPercent,
            taxaMediaAnualPercent: taxaAnualPercent.toFixed(2),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (err) {
      console.error('[BuscarTaxa] Fetch error:', err);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Nenhuma taxa encontrada para a data'
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
