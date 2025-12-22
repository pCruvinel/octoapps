import { useState, useCallback } from 'react';
import { getFeriadosPorAno, getFeriadosPorRange } from '../services/feriados.service';
import type { Feriado } from '../types/feriado';

/**
 * Hook para gerenciar feriados nacionais
 */
export function useFeriados() {
    const [feriados, setFeriados] = useState<Feriado[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Carregar feriados de um ano específico
     */
    const loadFeriadosPorAno = useCallback(async (ano: number) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getFeriadosPorAno(ano);
            setFeriados(data);
            return data;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro ao carregar feriados';
            setError(msg);
            console.error(msg, err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Carregar feriados de um intervalo de datas
     */
    const loadFeriadosPorRange = useCallback(async (startDate: Date, endDate: Date) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getFeriadosPorRange(startDate, endDate);
            setFeriados(data);
            return data;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro ao carregar feriados';
            setError(msg);
            console.error(msg, err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Verificar se uma data é feriado (baseado nos feriados já carregados)
     */
    const checkIsFeriado = useCallback((date: Date): Feriado | undefined => {
        const dateStr = date.toISOString().split('T')[0];
        return feriados.find(f => f.data === dateStr);
    }, [feriados]);

    return {
        feriados,
        loading,
        error,
        loadFeriadosPorAno,
        loadFeriadosPorRange,
        checkIsFeriado
    };
}
