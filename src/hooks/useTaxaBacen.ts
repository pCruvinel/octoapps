'use client';

import { useState, useEffect, useRef } from 'react';
import { useTiposOperacao } from './useTiposOperacao';

/**
 * Opções para o hook useTaxaBacen
 */
interface UseTaxaBacenOptions {
    /** Data do contrato no formato YYYY-MM-DD */
    dataContrato: string;
    /** Código do tipo de contrato (ex: 'VEICULOS_PF', 'CONSIGNADO_INSS') */
    tipoContrato?: string;
    /** Código do tipo de financiamento imobiliário (ex: 'IMOBILIARIO_SFH') */
    tipoFinanciamento?: string;
    /** Módulo do cálculo */
    module: 'GERAL' | 'IMOBILIARIO' | 'CARTAO';
    /** Se true, desabilita a busca automática */
    disabled?: boolean;
}

/**
 * Retorno do hook useTaxaBacen
 */
interface UseTaxaBacenReturn {
    /** Taxa mensal em percentual (ex: 1.5 = 1.5% a.m.) */
    taxaMensal: number | null;
    /** Taxa anual em percentual (ex: 19.56 = 19.56% a.a.) */
    taxaAnual: number | null;
    /** Se está carregando a taxa */
    loading: boolean;
    /** Mensagem de erro, se houver */
    error: string | null;
    /** Série BACEN utilizada na busca */
    serieUtilizada: number | null;
    /** Força uma nova busca */
    refetch: () => void;
}

/**
 * Hook para buscar taxa de mercado do BACEN de forma reativa.
 * 
 * Encapsula toda a lógica de:
 * 1. Determinar a série BACEN correta baseada no tipo de operação
 * 2. Fazer a requisição à API
 * 3. Gerenciar estados de loading/error
 * 4. Debounce para evitar requisições excessivas
 * 5. Cache para evitar requisições duplicadas
 * 
 * @example
 * ```tsx
 * const { taxaMensal, taxaAnual, loading } = useTaxaBacen({
 *     dataContrato: '2024-01-15',
 *     tipoContrato: 'VEICULOS_PF',
 *     module: 'GERAL',
 * });
 * ```
 */
export function useTaxaBacen({
    dataContrato,
    tipoContrato,
    tipoFinanciamento,
    module,
    disabled = false,
}: UseTaxaBacenOptions): UseTaxaBacenReturn {
    const [taxaMensal, setTaxaMensal] = useState<number | null>(null);
    const [taxaAnual, setTaxaAnual] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serieUtilizada, setSerieUtilizada] = useState<number | null>(null);

    // Ref para controlar cache de requisições
    const lastFetchRef = useRef<string | null>(null);
    // Ref para forçar refetch
    const refetchCounterRef = useRef(0);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // Hook para obter séries BACEN dinâmicas
    const { tiposOperacao, getSeriePorCodigo } = useTiposOperacao({
        categoria: module === 'IMOBILIARIO'
            ? 'IMOBILIARIO'
            : ['EMPRESTIMO', 'VEICULO', 'EMPRESARIAL', 'CARTAO'],
    });

    // Função para forçar nova busca
    const refetch = () => {
        refetchCounterRef.current += 1;
        lastFetchRef.current = null; // Limpa cache
        setRefetchTrigger(refetchCounterRef.current);
    };

    useEffect(() => {
        // Guards básicos
        if (disabled) return;
        if (!dataContrato || dataContrato.length < 10) {
            console.log('[useTaxaBacen] Data do contrato inválida ou ausente');
            return;
        }
        if (tiposOperacao.length === 0) {
            console.log('[useTaxaBacen] Aguardando carregamento dos tipos de operação...');
            return;
        }

        // Determinar tipo ativo (prioriza tipoContrato, depois tipoFinanciamento)
        const tipoAtivo = tipoContrato || tipoFinanciamento;

        // Chave de cache para evitar requisições duplicadas
        const fetchKey = `${dataContrato}-${tipoAtivo || 'default'}-${module}`;
        if (lastFetchRef.current === fetchKey) {
            console.log('[useTaxaBacen] Cache hit, ignorando busca duplicada');
            return;
        }

        const buscarTaxa = async () => {
            lastFetchRef.current = fetchKey;
            setLoading(true);
            setError(null);

            console.log('[useTaxaBacen] Iniciando busca:', {
                dataContrato,
                tipoAtivo,
                module,
                tiposDisponiveis: tiposOperacao.length,
            });

            try {
                // Import dinâmico para evitar dependência circular
                const { fetchMarketRate, getEstimatedMarketRate } = await import('@/utils/financialCalculations');

                let rate: number | null = null;
                let serieUsada: number | null = null;

                // 1. Tentar série específica do tipo de operação
                if (tipoAtivo) {
                    const serie = getSeriePorCodigo(tipoAtivo);
                    if (serie) {
                        console.log(`[useTaxaBacen] Buscando série ${serie} para ${tipoAtivo}`);
                        rate = await fetchMarketRate(serie, dataContrato);
                        if (rate) {
                            serieUsada = serie;
                        }
                    } else {
                        console.warn(`[useTaxaBacen] Série não encontrada para ${tipoAtivo}`);
                    }
                }

                // 2. Fallback para módulo genérico
                if (rate === null) {
                    console.log(`[useTaxaBacen] Usando fallback para módulo ${module}`);
                    rate = await fetchMarketRate(module, dataContrato);
                }

                // 3. Fallback estático se API falhar
                if (rate === null) {
                    console.warn('[useTaxaBacen] API indisponível, usando estimativa estática');
                    rate = getEstimatedMarketRate(module === 'IMOBILIARIO' ? 'IMOBILIARIO' : 'GERAL', dataContrato);
                }

                // Atualizar estados
                if (rate && rate > 0) {
                    setTaxaMensal(rate);
                    const anual = (Math.pow(1 + rate / 100, 12) - 1) * 100;
                    setTaxaAnual(parseFloat(anual.toFixed(2)));
                    setSerieUtilizada(serieUsada);
                    console.log(`[useTaxaBacen] Taxa encontrada: ${rate.toFixed(4)}% a.m. (${anual.toFixed(2)}% a.a.)`);
                } else {
                    setError('Taxa não encontrada');
                }
            } catch (err) {
                console.error('[useTaxaBacen] Erro na busca:', err);
                setError('Erro ao buscar taxa BACEN');
            } finally {
                setLoading(false);
            }
        };

        // Debounce de 500ms para evitar requisições excessivas
        const timer = setTimeout(buscarTaxa, 500);
        return () => clearTimeout(timer);

    }, [dataContrato, tipoContrato, tipoFinanciamento, module, tiposOperacao, disabled, refetchTrigger]);
    // ↑ tiposOperacao é um array estável que só muda quando carrega do banco

    return {
        taxaMensal,
        taxaAnual,
        loading,
        error,
        serieUtilizada,
        refetch,
    };
}
