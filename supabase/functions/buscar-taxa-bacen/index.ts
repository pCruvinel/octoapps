
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
    const { dataContrato, codigoSerie } = await req.json()

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
    // Fetch specifically for this date/month
    // Only need 1 point but seriesFetcher returns array
    try {
      const points = await fetchBacenSeries(serieCode, bacenDate, bacenDate);

      if (points.length > 0) {
        const point = points[points.length - 1]; // Last point
        const val = parseBacenValue(point.valor);
        const taxaDecimal = val / 100;
        const taxaAnual = Math.pow(1 + taxaDecimal, 12) - 1;

        // Background insert to cache
        // We don't await this to speed up response? Or we do?
        // Better to await to ensure data integrity for next time
        await supabase.from('taxas_bacen_historico').upsert({
          serie_bacen: serieCode.toString(),
          ano: ano,
          mes: mes,
          ano_mes: `${ano}-${mes}`,
          taxa_mensal_percent: val,
          taxa_mensal_decimal: taxaDecimal,
          taxa_anual_decimal: taxaAnual,
          data_atualizacao: new Date().toISOString(),
          modalidade: 'ON_DEMAND',
          fonte: 'BACEN_SGS_LIVE'
        }, { onConflict: 'serie_bacen, ano, mes' });

        return new Response(
          JSON.stringify({
            success: true,
            fonte: 'SGS_LIVE',
            data: point.data,
            taxaMediaMensal: taxaDecimal,
            taxaMediaAnual: taxaAnual,
            taxaMediaMensalPercent: val,
            taxaMediaAnualPercent: (taxaAnual * 100).toFixed(2),
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
