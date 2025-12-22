// Edge Function: seed-taxas-bacen
// Realiza carga histórica de 20 anos de taxas BACEN para o cache local
// Execução: POST /seed-taxas-bacen { iniciar: true }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Decimal } from "https://esm.sh/decimal.js@10.4.3";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Séries prioritárias para carga
const SERIES_CONFIG = [
    // Séries Anuais (% a.a.) - Conversão exponencial
    { codigo: 20749, nome: 'Veículos PF', tipo: 'ANUAL' },
    { codigo: 20728, nome: 'Veículos PJ', tipo: 'ANUAL' },
    { codigo: 20773, nome: 'Imobiliário SFH', tipo: 'ANUAL' },
    { codigo: 25497, nome: 'Imobiliário SFI', tipo: 'ANUAL' },
    { codigo: 20742, nome: 'Crédito Pessoal', tipo: 'ANUAL' },
    { codigo: 25471, nome: 'Crédito Pessoal Total', tipo: 'ANUAL' },
    { codigo: 25464, nome: 'Empréstimo PF', tipo: 'ANUAL' },
    { codigo: 20739, nome: 'Capital de Giro', tipo: 'ANUAL' },

    // Séries Mensais (% a.m.) - Divisão simples
    { codigo: 226, nome: 'TR', tipo: 'MENSAL' },
    { codigo: 433, nome: 'IPCA', tipo: 'MENSAL' },
    { codigo: 188, nome: 'INPC', tipo: 'MENSAL' },
    { codigo: 189, nome: 'IGPM', tipo: 'MENSAL' },
];

interface BacenDataPoint {
    data: string;
    valor: string;
}

async function fetchBacenBulk(serieCode: number, startDate: string, endDate: string): Promise<BacenDataPoint[]> {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serieCode}/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;

    console.log(`[Seed] Fetching serie ${serieCode}: ${startDate} → ${endDate}`);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'OctoApps-BulkSync/1.0'
        }
    });

    if (!response.ok) {
        throw new Error(`BACEN API error: ${response.status}`);
    }

    return await response.json();
}

function convertRate(val: number, tipo: 'ANUAL' | 'MENSAL') {
    const decVal = new Decimal(val);

    if (tipo === 'ANUAL') {
        // Taxa anual → converter para mensal
        const taxaAnualDecimal = decVal.div(100);
        const taxaMensalDec = new Decimal(1).plus(taxaAnualDecimal).pow(new Decimal(1).div(12)).minus(1);
        return {
            taxa_mensal_percent: taxaMensalDec.times(100).toNumber(),
            taxa_mensal_decimal: taxaMensalDec.toNumber(),
            taxa_anual_decimal: taxaAnualDecimal.toNumber(),
        };
    } else {
        // Taxa mensal → converter para anual
        const taxaMensalDecimal = decVal.div(100);
        const taxaAnualDec = new Decimal(1).plus(taxaMensalDecimal).pow(12).minus(1);
        return {
            taxa_mensal_percent: val,
            taxa_mensal_decimal: taxaMensalDecimal.toNumber(),
            taxa_anual_decimal: taxaAnualDec.toNumber(),
        };
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Período: 20 anos atrás até hoje
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 20);

        const startStr = `01/01/${startDate.getFullYear()}`;
        const endStr = `${String(endDate.getDate()).padStart(2, '0')}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${endDate.getFullYear()}`;

        const results: { serie: number; nome: string; inserted: number; errors: number }[] = [];

        for (const serie of SERIES_CONFIG) {
            console.log(`\n[Seed] ========== Processando ${serie.nome} (${serie.codigo}) ==========`);

            try {
                const dataPoints = await fetchBacenBulk(serie.codigo, startStr, endStr);
                console.log(`[Seed] Recebidos ${dataPoints.length} pontos`);

                let inserted = 0;
                let errors = 0;

                // Processar em lotes de 100
                const batchSize = 100;
                for (let i = 0; i < dataPoints.length; i += batchSize) {
                    const batch = dataPoints.slice(i, i + batchSize);

                    const records = batch.map(point => {
                        const [dia, mes, ano] = point.data.split('/');
                        const val = parseFloat(point.valor);
                        const converted = convertRate(val, serie.tipo as 'ANUAL' | 'MENSAL');

                        return {
                            serie_bacen: serie.codigo.toString(),
                            ano: parseInt(ano),
                            mes: parseInt(mes),
                            ano_mes: `${ano}-${mes}`,
                            ...converted,
                            data_atualizacao: new Date().toISOString(),
                            modalidade: serie.nome,
                            fonte: 'BACEN_SGS_BULK'
                        };
                    });

                    const { error } = await supabase
                        .from('taxas_bacen_historico')
                        .upsert(records, { onConflict: 'serie_bacen, ano, mes' });

                    if (error) {
                        console.error(`[Seed] Erro no lote: ${error.message}`);
                        errors += batch.length;
                    } else {
                        inserted += batch.length;
                    }
                }

                results.push({ serie: serie.codigo, nome: serie.nome, inserted, errors });
                console.log(`[Seed] ${serie.nome}: ${inserted} inseridos, ${errors} erros`);

                // Delay para não sobrecarregar a API
                await new Promise(r => setTimeout(r, 500));

            } catch (err) {
                console.error(`[Seed] Erro na série ${serie.codigo}:`, err);
                results.push({ serie: serie.codigo, nome: serie.nome, inserted: 0, errors: -1 });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Carga histórica concluída',
                periodo: { inicio: startStr, fim: endStr },
                resultados: results,
                totalInserido: results.reduce((acc, r) => acc + r.inserted, 0)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[Seed] Erro geral:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
