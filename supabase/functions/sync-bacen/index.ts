
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchBacenSeries, formatDateToBacen, parseBacenValue } from "../_shared/bacen-fetcher.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Init Supabase with Service Role for admin access
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Get Active Series from Metadata
        const { data: seriesList, error: seriesError } = await supabase
            .from('bacen_series_metadata')
            .select('*')
            .eq('active', true);

        if (seriesError) throw seriesError;
        if (!seriesList || seriesList.length === 0) {
            return new Response(JSON.stringify({ message: 'No active series found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const results = [];
        const today = new Date();
        const endDateStr = formatDateToBacen(today.toISOString().split('T')[0]);

        // 3. Loop through series
        for (const serie of seriesList) {
            // Find last update date for this series
            const { data: lastEntry } = await supabase
                .from('taxas_bacen_historico')
                .select('ano, mes')
                .eq('serie_bacen', serie.code.toString())
                .order('ano', { ascending: false })
                .order('mes', { ascending: false })
                .limit(1)
                .single();

            let startDateStr = '01/01/2000'; // Default start if empty

            if (lastEntry) {
                // Start from next month of last entry? 
                // Or just re-fetch recent to be safe/update corrections?
                // Let's fetch from the last known date + 1 day equivalent logic, or just overlapping month
                // Simplifying: Fetch from last entry's year-month-01
                // Actually, Bacen API accepts dataInicial.
                // Let's retry from 3 months ago to cover corrections, or just last month.
                // If lastEntry exists: 2024-12. We want to check 2024-12 again (in case it was partial) and forward.
                // Date: 01/{mes}/{ano}
                startDateStr = `01/${lastEntry.mes.toString().padStart(2, '0')}/${lastEntry.ano}`;
            } else {
                // If no data, fetch last 5 years? Or all? 
                // For production, maybe all. For dev, last 5 years.
                // Let's utilize a "full_sync" param if provided, else last 5 years.
                const fiveYearsAgo = new Date();
                fiveYearsAgo.setFullYear(today.getFullYear() - 5);
                startDateStr = formatDateToBacen(fiveYearsAgo.toISOString().split('T')[0]);
            }

            console.log(`Processing Series ${serie.code} (${serie.name}) from ${startDateStr} to ${endDateStr}`);

            try {
                const points = await fetchBacenSeries(serie.code, startDateStr, endDateStr);

                if (points.length > 0) {
                    const upsertData = points.map(p => {
                        // p.data format DD/MM/YYYY
                        const [d, m, y] = p.data.split('/');
                        const val = parseBacenValue(p.valor);
                        const taxaDecimal = val / 100;

                        // Calculate annual (assuming monthly rate)
                        // (1 + i)^12 - 1
                        const taxaAnual = Math.pow(1 + taxaDecimal, 12) - 1;

                        return {
                            serie_bacen: serie.code.toString(),
                            ano: parseInt(y),
                            mes: parseInt(m),
                            ano_mes: `${y}-${m}`, // Simple format YYYY-M or YYYY-MM
                            taxa_mensal_percent: val,
                            taxa_mensal_decimal: taxaDecimal,
                            taxa_anual_decimal: taxaAnual,
                            data_atualizacao: new Date().toISOString(),
                            modalidade: serie.calculation_type_target || 'GENERAL',
                            fonte: 'BACEN_SGS'
                        };
                    });

                    // Batch Upsert
                    const { error: upsertError } = await supabase
                        .from('taxas_bacen_historico')
                        .upsert(upsertData, {
                            onConflict: 'serie_bacen, ano, mes',
                            ignoreDuplicates: false
                        });

                    if (upsertError) {
                        console.error('Upsert Error:', upsertError);
                        results.push({ serie: serie.code, status: 'error', error: upsertError.message });
                    } else {
                        results.push({ serie: serie.code, status: 'success', count: upsertData.length });
                    }
                } else {
                    results.push({ serie: serie.code, status: 'no_data' });
                }

            } catch (err) {
                console.error('Fetch Error:', err);
                results.push({ serie: serie.code, status: 'fetch_error', error: err.message });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
