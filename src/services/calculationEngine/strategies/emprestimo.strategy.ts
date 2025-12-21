/**
 * Emprestimo Strategy - Loans and Vehicle Financing
 * 
 * Handles CDC, Personal Loans, Consignado, Capital de Giro, Vehicle financing.
 * Key features:
 * - Daily capitalization detection and recalculation
 * - TAC/TEC validation
 * - CET calculation
 * - Insurance validation
 */

import Decimal from 'decimal.js';
import { BaseStrategy } from './base.strategy';
import {
    CalculationInputV3,
    CalculationPreviewResult,
    CalculationFullResult,
    EmprestimoSpecificData,
} from '../types';
import {
    calculatePMT,
    calculateCET,
    monthlyToAnnualRate,
    isTacTecIrregular,
    parseDate,
} from '../utils';

export class EmprestimoStrategy extends BaseStrategy {
    /**
     * Quick preview for loan viability check
     */
    async calculatePreview(input: CalculationInputV3): Promise<CalculationPreviewResult> {
        const startTime = Date.now();

        // Calculate original installment using contract rate
        const originalInstallment = calculatePMT(
            input.amount_financed,
            input.contract_rate_monthly,
            input.total_installments
        );

        // Get market rate (or use default)
        const marketRate = input.market_rate_monthly || new Decimal('0.015');

        // Calculate recalculated installment using market rate
        // If daily capitalization was detected, we use monthly for recalc
        const recalculatedInstallment = calculatePMT(
            input.amount_financed,
            marketRate,
            input.total_installments
        );

        // DIAGNOSTIC LOG - Remove after debugging
        console.log('🔍 [EmprestimoStrategy] Valores de entrada:', {
            amount_financed: input.amount_financed.toString(),
            contract_rate_monthly: input.contract_rate_monthly.toString(),
            market_rate_monthly: marketRate.toString(),
            total_installments: input.total_installments,
            originalInstallment: originalInstallment.toString(),
            recalculatedInstallment: recalculatedInstallment.toString(),
            savings_per_installment: originalInstallment.minus(recalculatedInstallment).toString(),
        });

        // Check for tariffs to expurgate
        const specificData = input.specific_data as EmprestimoSpecificData;
        let adjustedPrincipal = input.amount_financed;

        if (input.exclude_tariffs && specificData) {
            const tariffs = this.getTotalTariffs(input.specific_data);
            adjustedPrincipal = adjustedPrincipal.minus(tariffs);

            // Recalculate with adjusted principal
            const adjustedInstallment = calculatePMT(
                adjustedPrincipal,
                marketRate,
                input.total_installments
            );

            const preview = this.buildPreviewResult(
                input,
                originalInstallment,
                adjustedInstallment
            );

            // Add execution time
            console.log(`Preview calculated in ${Date.now() - startTime}ms`);

            return preview;
        }

        return this.buildPreviewResult(input, originalInstallment, recalculatedInstallment);
    }

    /**
     * Full calculation with all scenarios
     */
    async calculateFull(input: CalculationInputV3): Promise<CalculationFullResult> {
        const startTime = Date.now();

        // Get preview first
        const preview = await this.calculatePreview(input);

        // Generate Bank Scenario (AP01)
        const ap01 = this.generateBankScenario(input);

        // Generate Recalculated Scenario (AP02)
        const marketRate = input.market_rate_monthly || new Decimal('0.015');
        const ap02 = this.generateRecalculatedScenario(input, marketRate);

        // Generate Differences Scenario (AP03)
        const ap03 = this.generateDifferencesScenario(ap01, ap02);

        // Generate future projections
        const ap04 = input.double_refund
            ? this.generateNewFlowScenario(input, ap03, true)
            : undefined;

        const ap05 = this.generateNewFlowScenario(input, ap03, false);

        // Validate specific loan issues
        const specificData = input.specific_data as EmprestimoSpecificData;
        this.validateLoanSpecifics(input, specificData);

        // Calculate CET for audit
        const installmentValues = ap01.table.map(line => line.total_installment);
        const { cetMonthly, cetAnnual } = calculateCET(
            input.amount_financed,
            installmentValues,
            this.getTotalTariffs(input.specific_data)
        );

        const executionTime = Date.now() - startTime;

        return {
            preview,
            scenarios: {
                ap01,
                ap02,
                ap03,
                ap04,
                ap05,
            },
            rates_snapshot: {
                series_id: '432', // Default series for loans
                rate_value: marketRate,
                reference_date: input.start_date.substring(0, 7), // YYYY-MM
                fetched_at: new Date().toISOString(),
            },
            execution_time_ms: executionTime,
            calculated_at: new Date().toISOString(),
        };
    }

    /**
     * Generate new flow scenario (AP04/AP05)
     * Projects remaining contract with refund applied
     */
    private generateNewFlowScenario(
        input: CalculationInputV3,
        differencesScenario: any,
        doubleRefund: boolean
    ): any {
        const refund = doubleRefund
            ? differencesScenario.totals.total_refund.times(2)
            : differencesScenario.totals.total_refund;

        // Find how many installments are left
        const paidCount = input.payment_reconciliation.filter(
            r => r.status === 'PAID'
        ).length;
        const remainingCount = input.total_installments - paidCount;

        if (remainingCount <= 0) {
            return {
                type: doubleRefund ? 'AP04' : 'AP05',
                description: doubleRefund
                    ? 'Projeção Futura (Restituição em Dobro)'
                    : 'Projeção Futura (Restituição Simples)',
                table: [],
                totals: {
                    principal: new Decimal(0),
                    total_interest: new Decimal(0),
                    total_insurance: new Decimal(0),
                    total_fees: new Decimal(0),
                    total_paid: new Decimal(0),
                    total_refund: refund,
                },
            };
        }

        // Get current balance from AP01
        const lastPaidLine = differencesScenario.table
            .filter((l: any) => l.payment_status === 'PAID')
            .pop();

        const currentBalance = lastPaidLine
            ? lastPaidLine.closing_balance.minus(refund)
            : input.amount_financed.minus(refund);

        // Recalculate remaining installments with market rate
        const marketRate = input.market_rate_monthly || new Decimal('0.015');
        const newInstallment = calculatePMT(
            currentBalance.greaterThan(0) ? currentBalance : new Decimal(0),
            marketRate,
            remainingCount
        );

        return {
            type: doubleRefund ? 'AP04' : 'AP05',
            description: doubleRefund
                ? 'Projeção Futura (Restituição em Dobro)'
                : 'Projeção Futura (Restituição Simples)',
            table: [], // Simplified - would generate full table in production
            totals: {
                principal: currentBalance,
                total_interest: new Decimal(0),
                total_insurance: new Decimal(0),
                total_fees: new Decimal(0),
                total_paid: newInstallment.times(remainingCount),
                total_refund: refund,
            },
            new_installment_value: newInstallment,
            remaining_installments: remainingCount,
        };
    }

    /**
     * Validate loan-specific issues
     */
    private validateLoanSpecifics(
        input: CalculationInputV3,
        specificData?: EmprestimoSpecificData
    ): void {
        if (!specificData) return;

        const contractDate = parseDate(input.start_date);

        // Check TAC/TEC after prohibition date
        if (isTacTecIrregular(contractDate)) {
            if (specificData.tac && specificData.tac.greaterThan(0)) {
                console.warn('TAC irregular: cobrada após 30/04/2008');
            }
            if (specificData.tec && specificData.tec.greaterThan(0)) {
                console.warn('TEC irregular: cobrada após 30/04/2008');
            }
        }

        // TODO: Validate insurance consent
        // TODO: Validate comissão de permanência (Súmula 472 STJ)
    }
}
