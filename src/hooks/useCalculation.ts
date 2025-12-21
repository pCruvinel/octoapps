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
import type {
    CalculationPreviewResult,
    CalculationFullResult,
    PaymentReconciliationEntry,
    CalculationModule,
} from '../services/calculationEngine';

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
    calculationId: string | null;

    error: string | null;
}

export interface UseCalculationActions {
    calculatePreview: (request: CreateCalculationRequest) => Promise<CalculationPreviewResult | null>;
    calculateFull: (request: CreateCalculationRequest) => Promise<CalculationFullResult | null>;
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
        calculationId,
        error,

        // Actions
        calculatePreview,
        calculateFull,
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
