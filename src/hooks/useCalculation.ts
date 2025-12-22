/**
 * useCalculation Hook
 * 
 * React hook for calculation module v3.0
 * Provides state management and API integration for the calculation wizard
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Decimal from 'decimal.js';
import {
    calculationAPI,
    CreateCalculationRequest,
} from '../services/calculationAPI.service';
import { calcularEvolucaoDetalhada } from '../services/calculoDetalhado.service';
import type {
    CalculationPreviewResult,
    CalculationFullResult,
    PaymentReconciliationEntry,
    CalculationModule,
} from '../services/calculationEngine';
import type {
    CalculoDetalhadoRequest,
    CalculoDetalhadoResponse,
} from '@/types/calculation.types';

// ============================================================================
// Types
// ============================================================================

export interface UseCalculationState {
    isLoading: boolean;
    isPreviewLoading: boolean;
    isCalculating: boolean;
    isSaving: boolean;

    preview: CalculationPreviewResult | null;
    result: CalculationFullResult | null;
    resultDetalhado: CalculoDetalhadoResponse | null;
    calculationId: string | null;

    error: string | null;
}

export interface UseCalculationActions {
    calculatePreview: (request: CreateCalculationRequest) => Promise<CalculationPreviewResult | null>;
    calculateFull: (request: CreateCalculationRequest) => Promise<CalculationFullResult | null>;
    calculateDetalhado: (request: CalculoDetalhadoRequest) => Promise<CalculoDetalhadoResponse | null>;
    saveCalculation: (clientId?: string) => Promise<string | null>;
    updateReconciliation: (reconciliation: PaymentReconciliationEntry[]) => Promise<void>;
    reset: () => void;
}

export type UseCalculationReturn = UseCalculationState & UseCalculationActions;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCalculation(): UseCalculationReturn {
    // State
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [preview, setPreview] = useState<CalculationPreviewResult | null>(null);
    const [result, setResult] = useState<CalculationFullResult | null>(null);
    const [resultDetalhado, setResultDetalhado] = useState<CalculoDetalhadoResponse | null>(null);
    const [calculationId, setCalculationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRequest, setLastRequest] = useState<CreateCalculationRequest | null>(null);

    const isLoading = isPreviewLoading || isCalculating || isSaving;

    // Actions
    const calculatePreview = useCallback(async (
        request: CreateCalculationRequest
    ): Promise<CalculationPreviewResult | null> => {
        setIsPreviewLoading(true);
        setError(null);

        try {
            const previewResult = await calculationAPI.calculatePreview(request);
            setPreview(previewResult);
            setLastRequest(request);

            // Show toast based on viability
            if (previewResult.is_viable) {
                toast.success('Análise prévia concluída - Caso VIÁVEL', {
                    description: `Economia estimada: ${formatCurrency(previewResult.estimated_total_savings)}`,
                });
            } else {
                toast.info('Análise prévia concluída - Caso INVIÁVEL', {
                    description: 'Taxa contratual dentro da média de mercado',
                });
            }

            return previewResult;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao calcular prévia';
            setError(message);
            toast.error('Erro na análise prévia', { description: message });
            return null;
        } finally {
            setIsPreviewLoading(false);
        }
    }, []);

    const calculateFull = useCallback(async (
        request: CreateCalculationRequest
    ): Promise<CalculationFullResult | null> => {
        setIsCalculating(true);
        setError(null);

        try {
            const fullResult = await calculationAPI.calculateFull(request);
            setResult(fullResult);
            setPreview(fullResult.preview);
            setLastRequest(request);

            toast.success('Cálculo completo finalizado', {
                description: `Tempo de execução: ${fullResult.execution_time_ms}ms`,
            });

            return fullResult;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao calcular';
            setError(message);
            toast.error('Erro no cálculo', { description: message });
            return null;
        } finally {
            setIsCalculating(false);
        }
    }, []);

    /**
     * Calculate detailed forensic report with AP01-AP07 appendices
     */
    const calculateDetalhado = useCallback(async (
        request: CalculoDetalhadoRequest
    ): Promise<CalculoDetalhadoResponse | null> => {
        setIsCalculating(true);
        setError(null);

        try {
            toast.loading('Calculando análise detalhada...', { id: 'calc-detalhado' });

            const detalhadoResult = await calcularEvolucaoDetalhada(request);
            setResultDetalhado(detalhadoResult);

            toast.dismiss('calc-detalhado');
            toast.success('Cálculo detalhado finalizado', {
                description: `${detalhadoResult.apendices.ap03?.tabela?.length || 0} parcelas • Diferença: ${detalhadoResult.formatted?.diferencaTotal}`,
            });

            return detalhadoResult;
        } catch (err) {
            toast.dismiss('calc-detalhado');
            const message = err instanceof Error ? err.message : 'Erro no cálculo detalhado';
            setError(message);
            toast.error('Erro no cálculo detalhado', { description: message });
            return null;
        } finally {
            setIsCalculating(false);
        }
    }, []);

    const saveCalculation = useCallback(async (
        clientId?: string
    ): Promise<string | null> => {
        if (!result || !lastRequest) {
            toast.error('Nenhum cálculo para salvar');
            return null;
        }

        setIsSaving(true);
        setError(null);

        try {
            const { calculation_id } = await calculationAPI.saveCalculation({
                calculation_id: calculationId || undefined,
                client_id: clientId,
                module: lastRequest.module,
                input: lastRequest,
                result,
            });

            setCalculationId(calculation_id);
            toast.success('Cálculo salvo com sucesso');
            return calculation_id;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao salvar';
            setError(message);
            toast.error('Erro ao salvar', { description: message });
            return null;
        } finally {
            setIsSaving(false);
        }
    }, [result, lastRequest, calculationId]);

    const updateReconciliation = useCallback(async (
        reconciliation: PaymentReconciliationEntry[]
    ): Promise<void> => {
        if (!calculationId) {
            toast.error('Salve o cálculo antes de editar a conciliação');
            return;
        }

        setIsCalculating(true);
        setError(null);

        try {
            const updatedResult = await calculationAPI.syncReconciliation(
                calculationId,
                reconciliation
            );

            setResult(updatedResult);
            setPreview(updatedResult.preview);

            toast.success('Conciliação atualizada');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar';
            setError(message);
            toast.error('Erro na conciliação', { description: message });
        } finally {
            setIsCalculating(false);
        }
    }, [calculationId]);

    const reset = useCallback(() => {
        setPreview(null);
        setResult(null);
        setResultDetalhado(null);
        setCalculationId(null);
        setError(null);
        setLastRequest(null);
    }, []);

    return {
        // State
        isLoading,
        isPreviewLoading,
        isCalculating,
        isSaving,
        preview,
        result,
        resultDetalhado,
        calculationId,
        error,

        // Actions
        calculatePreview,
        calculateFull,
        calculateDetalhado,
        saveCalculation,
        updateReconciliation,
        reset,
    };
}

// ============================================================================
// Helper
// ============================================================================

function formatCurrency(value: Decimal): string {
    return value.toNumber().toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

export default useCalculation;
