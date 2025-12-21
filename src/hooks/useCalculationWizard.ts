'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { calculationAPI } from '@/services/calculationAPI.service';
import {
    CalculationModule,
    CalculationInputV3,
    CalculationPreviewResult,
    CalculationFullResult,
    PaymentReconciliationEntry
} from '@/services/calculationEngine';
import type { WizardData } from '@/components/calculations/wizard';
import type { PaymentRow } from '@/components/calculations/reconciliation';

/**
 * Hook para integração do wizard com o backend de cálculo
 */
export function useCalculationWizard() {
    const [isLoading, setIsLoading] = useState(false);
    const [previewResult, setPreviewResult] = useState<CalculationPreviewResult | null>(null);
    const [fullResult, setFullResult] = useState<CalculationFullResult | null>(null);
    const [calculationId, setCalculationId] = useState<string | null>(null);

    /**
     * Converte dados do wizard para o formato da API
     */
    const convertWizardToRequest = useCallback((data: WizardData) => {
        const { step1, step2, step3 } = data;

        // Mapeia tipo de contrato para módulo
        const moduleMap: Record<string, CalculationModule> = {
            'PESSOAL': 'EMPRESTIMO',
            'CONSIGNADO_PRIVADO': 'EMPRESTIMO',
            'CONSIGNADO_PUBLICO': 'EMPRESTIMO',
            'CONSIGNADO_INSS': 'EMPRESTIMO',
            'CAPITAL_GIRO': 'EMPRESTIMO',
            'VEICULO': 'EMPRESTIMO',
            'CHEQUE_ESPECIAL': 'EMPRESTIMO',
            'IMOBILIARIO_SFH': 'IMOBILIARIO',
            'IMOBILIARIO_SFI': 'IMOBILIARIO',
        };

        // Mapeia sistema de amortização
        const amortizationMap: Record<string, 'PRICE' | 'SAC' | 'SACRE' | 'GAUSS'> = {
            'PRICE': 'PRICE',
            'SAC': 'SAC',
            'SACRE': 'SACRE',
            'GAUSS': 'GAUSS',
        };

        return {
            module: moduleMap[step1.tipoContrato] || 'EMPRESTIMO',
            amount_financed: step1.valorFinanciado,
            start_date: step1.dataContrato,
            first_payment_date: step1.dataPrimeiroVencimento,
            total_installments: step1.prazoMeses,
            contract_rate_monthly: step2.taxaMensalContrato / 100, // Converte % para decimal
            contract_rate_yearly: step2.taxaAnualContrato / 100,
            capitalization_mode: step2.capitalizacao === 'DIARIA' ? 'DAILY' : 'MONTHLY',
            amortization_method: amortizationMap[step2.sistemaAmortizacao] || 'PRICE',
            use_bacen_average: step2.usarTaxaBacen,
            use_simple_interest: step2.sistemaAmortizacao === 'GAUSS',
            double_refund: step2.repetirEmDobro,
            abuse_threshold: step2.thresholdAbuso,
            exclude_tariffs: step3.tarifas.some(t => t.expurgar),
            specific_data: {
                credor: step1.credor,
                devedor: step1.devedor,
                contrato_num: step1.contratoNum,
                tipo_contrato: step1.tipoContrato,
                tarifas_expurgar: step3.tarifas.filter(t => t.expurgar),
                multa_percent: step3.multaPercent,
                mora_percent: step3.moraPercent,
                base_multa: step3.baseMulta,
                observacoes: step3.observacoes,
            },
        };
    }, []);

    /**
     * Executa análise prévia (retorno rápido < 5s)
     */
    const calculatePreview = useCallback(async (data: WizardData) => {
        setIsLoading(true);
        try {
            const request = convertWizardToRequest(data);
            const result = await calculationAPI.calculatePreview(request);
            setPreviewResult(result);
            return result;
        } catch (error: any) {
            toast.error('Erro na análise prévia: ' + error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [convertWizardToRequest]);

    /**
     * Executa cálculo completo com todos os cenários
     */
    const calculateFull = useCallback(async (data: WizardData) => {
        setIsLoading(true);
        try {
            const request = convertWizardToRequest(data);
            const result = await calculationAPI.calculateFull(request);
            setFullResult(result);

            // Salva no banco se sucesso
            const savedCalc = await calculationAPI.saveCalculation({
                module: request.module as CalculationModule,
                input: request,
                result,
            });

            setCalculationId(savedCalc.calculation_id);
            toast.success('Cálculo completo realizado com sucesso!');

            return { result, calculation_id: savedCalc.calculation_id };
        } catch (error: any) {
            toast.error('Erro no cálculo completo: ' + error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [convertWizardToRequest]);

    /**
     * Atualiza conciliação e recalcula
     */
    const updateReconciliation = useCallback(async (
        payments: PaymentRow[],
        fromInstallment?: number
    ) => {
        if (!calculationId) {
            toast.error('Nenhum cálculo carregado');
            return;
        }

        setIsLoading(true);
        try {
            // Converte PaymentRow para PaymentReconciliationEntry
            const reconciliation: PaymentReconciliationEntry[] = payments
                .filter(p => p.isEdited)
                .map(p => ({
                    installment_number: p.n,
                    paid_date: p.dataPagamentoReal,
                    paid_amount: p.valorPagoReal,
                    extra_amortization: p.amortizacaoExtra,
                    status: p.status,
                }));

            const result = await calculationAPI.syncReconciliation(
                calculationId,
                reconciliation,
                fromInstallment
            );

            setFullResult(result);
            toast.success('Conciliação atualizada e recalculada!');
            return result;
        } catch (error: any) {
            toast.error('Erro ao atualizar conciliação: ' + error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [calculationId]);

    /**
     * Reseta o estado do hook
     */
    const reset = useCallback(() => {
        setPreviewResult(null);
        setFullResult(null);
        setCalculationId(null);
        setIsLoading(false);
    }, []);

    return {
        isLoading,
        previewResult,
        fullResult,
        calculationId,
        calculatePreview,
        calculateFull,
        updateReconciliation,
        reset,
    };
}
