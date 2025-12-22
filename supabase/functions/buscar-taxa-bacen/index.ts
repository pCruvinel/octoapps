
// Edge Function para buscar taxa média do BACEN
// Consulta banco local (cache) antes de ir na API externa

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Decimal } from "https://esm.sh/decimal.js@10.4.3";
import { fetchBacenSeries, formatDateToBacen, parseBacenValue } from "../_shared/bacen-fetcher.ts";

// Configurar Decimal.js para precisão de 20 casas decimais
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

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
        // Séries de índices (TR, IPCA, INPC, IGP-M) retornam taxa MENSAL (% a.m.)
        // 
        // SÉRIES ANUAIS (% a.a.) - Aplicar conversão exponencial:
        // Empréstimos PF:
        //   25464 - Crédito Pessoal PF
        //   25463 - Consignado Privado
        //   25462 - Consignado Público
        //   25470 - Consignado INSS
        //   20742 - Crédito Pessoal Não Consignado
        //   25471 - Crédito Pessoal Total
        // Empresarial:
        //   20739 - Capital de Giro até 365d
        //   20722 - Capital de Giro até 365d (alternativo)
        //   20723 - Capital de Giro > 365d
        // Veículos:
        //   20749 - Aquisição de Veículos PF
        //   20728 - Aquisição de Veículos PJ
        // Imobiliário:
        //   20773 - Financiamento Imobiliário SFH
        //   25497 - Financiamento Imobiliário SFI
        //   432   - Mercado não referenciadas
        // Cartão:
        //   25482 - Cartão Rotativo PF (Anual)
        //
        // SÉRIES MENSAIS (% a.m.) - Apenas divisão por 100:
        //   226   - TR (Taxa Referencial)
        //   433   - IPCA
        //   188   - INPC
        //   189   - IGP-M
        //   25455 - Cartão Rotativo PF (Mensal)

        const seriesAnuais = [
          // Empréstimos PF
          25464, 25463, 25462, 25470, 20742, 25471,
          // Empresarial
          20739, 20722, 20723,
          // Veículos
          20749, 20728,
          // Imobiliário
          20773, 25497, 432,
          // Cartão (Anual)
          25482
        ];
        const isSerieAnual = seriesAnuais.includes(serieCode);

        let taxaMensalPercent: number;
        let taxaMensalDecimal: number;
        let taxaAnualPercent: number;
        let taxaAnualDecimal: number;

        if (isSerieAnual) {
          // Série retorna taxa ANUAL em percentual
          // val = 8.5 significa 8.5% a.a.
          // Usando Decimal.js para precisão de 20 casas decimais
          const decVal = new Decimal(val);
          taxaAnualPercent = val;
          taxaAnualDecimal = decVal.div(100).toNumber();
          // Conversão exponencial: (1 + i_anual)^(1/12) - 1
          const taxaMensalDec = new Decimal(1).plus(decVal.div(100)).pow(new Decimal(1).div(12)).minus(1);
          taxaMensalDecimal = taxaMensalDec.toNumber();
          taxaMensalPercent = taxaMensalDec.times(100).toNumber();
          console.log(`[BuscarTaxa] Série ${serieCode} (ANUAL): ${taxaAnualPercent}% a.a. → ${taxaMensalPercent.toFixed(6)}% a.m.`);
        } else {
          // Série retorna taxa MENSAL em percentual (ex: TR, IPCA, Cartão Mensal 25455)
          // val = 0.5 significa 0.5% a.m. - Apenas divisão simples por 100
          const decVal = new Decimal(val);
          taxaMensalPercent = val;
          taxaMensalDecimal = decVal.div(100).toNumber();
          // Conversão para anual: (1 + i_mensal)^12 - 1
          const taxaAnualDec = new Decimal(1).plus(decVal.div(100)).pow(12).minus(1);
          taxaAnualDecimal = taxaAnualDec.toNumber();
          taxaAnualPercent = taxaAnualDec.times(100).toNumber();
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
