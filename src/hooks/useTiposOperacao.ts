import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TipoOperacaoBacen {
    id: string;
    codigo: string;
    nome: string;
    categoria: 'EMPRESTIMO' | 'VEICULO' | 'IMOBILIARIO' | 'CARTAO' | 'EMPRESARIAL' | 'INDICE';
    serie_bacen: number;
    tipo_taxa: 'ANUAL' | 'MENSAL';
    ativo: boolean;
    ordem: number;
}

interface UseTiposOperacaoOptions {
    categoria?: string | string[];  // Aceita uma categoria ou array
    apenasAtivos?: boolean;
}

/**
 * Hook para buscar tipos de operação BACEN da tabela de referência.
 * Permite filtrar por categoria e status ativo.
 * 
 * @example
 * // Buscar todas as operações de veículos
 * const { tiposOperacao, loading } = useTiposOperacao({ categoria: 'VEICULO' });
 * 
 * // Buscar empréstimos E veículos (para módulo combinado)
 * const { tiposOperacao } = useTiposOperacao({ categoria: ['EMPRESTIMO', 'VEICULO'] });
 * 
 * // Buscar todas as operações
 * const { tiposOperacao } = useTiposOperacao();
 */
export function useTiposOperacao(options: UseTiposOperacaoOptions = {}) {
    const { categoria, apenasAtivos = true } = options;
    const [tiposOperacao, setTiposOperacao] = useState<TipoOperacaoBacen[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTipos = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from('tipos_operacao_bacen')
                    .select('*')
                    .order('ordem', { ascending: true });

                if (categoria) {
                    if (Array.isArray(categoria)) {
                        query = query.in('categoria', categoria);
                    } else {
                        query = query.eq('categoria', categoria);
                    }
                }

                if (apenasAtivos) {
                    query = query.eq('ativo', true);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) throw fetchError;
                setTiposOperacao(data || []);
            } catch (err) {
                console.error('[useTiposOperacao] Erro:', err);
                setError(err instanceof Error ? err.message : 'Erro ao buscar tipos de operação');
            } finally {
                setLoading(false);
            }
        };

        fetchTipos();
    }, [categoria, apenasAtivos]);

    /**
     * Busca a série BACEN para um código de operação específico.
     */
    const getSeriePorCodigo = (codigo: string): number | null => {
        const tipo = tiposOperacao.find(t => t.codigo === codigo);
        return tipo?.serie_bacen ?? null;
    };

    /**
     * Verifica se a série é anual (precisa conversão exponencial).
     */
    const isSerieAnual = (codigo: string): boolean => {
        const tipo = tiposOperacao.find(t => t.codigo === codigo);
        return tipo?.tipo_taxa === 'ANUAL';
    };

    return {
        tiposOperacao,
        loading,
        error,
        getSeriePorCodigo,
        isSerieAnual,
    };
}

/**
 * Busca um tipo de operação específico por código.
 * Útil para validações e consultas pontuais.
 */
export async function getTipoOperacaoPorCodigo(codigo: string): Promise<TipoOperacaoBacen | null> {
    const { data, error } = await supabase
        .from('tipos_operacao_bacen')
        .select('*')
        .eq('codigo', codigo)
        .single();

    if (error) {
        console.error('[getTipoOperacaoPorCodigo] Erro:', error);
        return null;
    }

    return data;
}

/**
 * Busca tipos de operação por categoria (para uso sem hook).
 */
export async function getTiposOperacaoPorCategoria(
    categoria: TipoOperacaoBacen['categoria']
): Promise<TipoOperacaoBacen[]> {
    const { data, error } = await supabase
        .from('tipos_operacao_bacen')
        .select('*')
        .eq('categoria', categoria)
        .eq('ativo', true)
        .order('ordem');

    if (error) {
        console.error('[getTiposOperacaoPorCategoria] Erro:', error);
        return [];
    }

    return data || [];
}
