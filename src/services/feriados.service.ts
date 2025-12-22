import { supabase } from '../lib/supabase';
import type { Feriado, BrasilAPIFeriado } from '../types/feriado';

const BRASIL_API_URL = 'https://brasilapi.com.br/api/feriados/v1';

/**
 * Fetch holidays from Brasil API
 */
async function fetchFromBrasilAPI(ano: number): Promise<BrasilAPIFeriado[]> {
    const response = await fetch(`${BRASIL_API_URL}/${ano}`);

    if (!response.ok) {
        throw new Error(`Brasil API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Get holidays for a year - checks cache first, fetches from API if needed
 */
export async function getFeriadosPorAno(ano: number): Promise<Feriado[]> {
    // 1. Check cache in Supabase
    const { data: cached, error: cacheError } = await supabase
        .from('feriados_nacionais')
        .select('*')
        .eq('ano', ano);

    if (cacheError) {
        console.error('Error checking feriados cache:', cacheError);
    }

    // If we have cached data, return it
    if (cached && cached.length > 0) {
        return cached;
    }

    // 2. Fetch from Brasil API
    try {
        const apiData = await fetchFromBrasilAPI(ano);

        // 3. Transform and insert into cache
        const feriados: Feriado[] = apiData.map(f => ({
            data: f.date,
            nome: f.name,
            tipo: f.type,
            ano: ano
        }));

        // Insert into Supabase (ignore conflicts)
        const { error: insertError } = await supabase
            .from('feriados_nacionais')
            .upsert(feriados, { onConflict: 'data', ignoreDuplicates: true });

        if (insertError) {
            console.error('Error caching feriados:', insertError);
        }

        return feriados;
    } catch (error) {
        console.error('Error fetching from Brasil API:', error);
        return [];
    }
}

/**
 * Get holidays for a date range (may span multiple years)
 */
export async function getFeriadosPorRange(startDate: Date, endDate: Date): Promise<Feriado[]> {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    const allFeriados: Feriado[] = [];

    for (let year = startYear; year <= endYear; year++) {
        const yearFeriados = await getFeriadosPorAno(year);
        allFeriados.push(...yearFeriados);
    }

    // Filter to only include holidays within the date range
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    return allFeriados.filter(f => f.data >= startStr && f.data <= endStr);
}

/**
 * Check if a specific date is a holiday
 */
export async function isFeriado(date: Date): Promise<boolean> {
    const dateStr = date.toISOString().split('T')[0];
    const feriados = await getFeriadosPorAno(date.getFullYear());
    return feriados.some(f => f.data === dateStr);
}
