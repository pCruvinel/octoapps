// Edge Function para buscar taxa média do BACEN
// Resolve problemas de CORS fazendo a requisição no servidor

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dataContrato } = await req.json()

    if (!dataContrato) {
      return new Response(
        JSON.stringify({ error: 'Data do contrato é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const [ano, mes, dia] = dataContrato.split('-')
    const anoMes = `${ano}${mes}`

    console.log('Buscando taxa para:', { dataContrato, ano, mes, dia })

    // Estratégia 1: API OLINDA (mais moderna)
    try {
      console.log('Tentando API OLINDA...')
      const urlOlinda = `https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosMensalPorMes?$filter=Modalidade%20eq%20'Aquisi%C3%A7%C3%A3o%20de%20im%C3%B3veis%20-%20Opera%C3%A7%C3%B5es%20n%C3%A3o%20referenciadas'%20and%20AnoMes%20ge%20${anoMes}&$format=json&$orderby=AnoMes&$top=1`

      const responseOlinda = await fetch(urlOlinda, {
        headers: { 'Accept': 'application/json' }
      })

      if (responseOlinda.ok) {
        const dataOlinda = await responseOlinda.json()

        if (dataOlinda.value && dataOlinda.value.length > 0) {
          const taxaMensalPercent = parseFloat(dataOlinda.value[0].TaxaJurosAoMes)
          const taxaMediaMensal = taxaMensalPercent / 100
          const taxaMediaAnual = Math.pow(1 + taxaMediaMensal, 12) - 1

          console.log('Taxa encontrada via OLINDA:', { taxaMensalPercent, taxaMediaMensal, taxaMediaAnual })

          return new Response(
            JSON.stringify({
              success: true,
              fonte: 'OLINDA',
              data: dataOlinda.value[0].AnoMes,
              taxaMediaMensal,
              taxaMediaAnual,
              taxaMediaMensalPercent: (taxaMediaMensal * 100).toFixed(4),
              taxaMediaAnualPercent: (taxaMediaAnual * 100).toFixed(2),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    } catch (errorOlinda) {
      console.warn('API OLINDA falhou:', errorOlinda)
    }

    // Estratégia 2: API SGS (antiga) - fallback
    try {
      console.log('Tentando API SGS...')
      const dataFormatada = `${dia}/${mes}/${ano}`
      const urlSGS = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=${dataFormatada}&dataFinal=${dataFormatada}`

      const responseSGS = await fetch(urlSGS, {
        headers: { 'Accept': 'application/json' }
      })

      if (responseSGS.ok) {
        const dataSGS = await responseSGS.json()

        if (dataSGS && dataSGS.length > 0) {
          const taxaMensalPercent = parseFloat(dataSGS[dataSGS.length - 1].valor)
          const taxaMediaMensal = taxaMensalPercent / 100
          const taxaMediaAnual = Math.pow(1 + taxaMediaMensal, 12) - 1

          console.log('Taxa encontrada via SGS:', { taxaMensalPercent, taxaMediaMensal, taxaMediaAnual })

          return new Response(
            JSON.stringify({
              success: true,
              fonte: 'SGS',
              data: dataSGS[dataSGS.length - 1].data,
              taxaMediaMensal,
              taxaMediaAnual,
              taxaMediaMensalPercent: (taxaMediaMensal * 100).toFixed(4),
              taxaMediaAnualPercent: (taxaMediaAnual * 100).toFixed(2),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    } catch (errorSGS) {
      console.warn('API SGS falhou:', errorSGS)
    }

    // Se chegou aqui, nenhuma API funcionou
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Nenhuma API do BACEN retornou dados para a data especificada'
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
