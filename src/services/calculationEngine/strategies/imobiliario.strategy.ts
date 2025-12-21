/**
 * Imobiliario Strategy - Real Estate Financing (SFH/SFI)
 * 
 * High complexity module handling:
 * - Monetary correction (TR, IPCA, INPC, IGPM)
 * - SAC/PRICE/SACRE amortization
 * - Insurance MIP/DFI
 * - Grace period handling
 */

import Decimal from 'decimal.js';
import { BaseStrategy } from './base.strategy';
import {
    CalculationInputV3,
    CalculationPreviewResult,
    CalculationFullResult,
    AmortizationLineV3,
    ScenarioResult,
    ImobiliarioSpecificData,
} from '../types';
import {
    calculatePMT,
    calculateMonthlyInterest,
    monthlyToAnnualRate,
    parseDate,
    formatDate,
    addMonths,
    daysBetween,
} from '../utils';

export class ImobiliarioStrategy extends BaseStrategy {
    /**
     * Quick preview for real estate financing
     */
    async calculatePreview(input: CalculationInputV3): Promise<CalculationPreviewResult> {
        // Calculate first installment based on amortization system
        const originalInstallment = this.calculateFirstInstallment(
            input.amount_financed,
            input.contract_rate_monthly,
            input.total_installments,
            input.amortization_method
        );

        const marketRate = input.market_rate_monthly || new Decimal('0.0091'); // ~0.91% for real estate

        const recalculatedInstallment = this.calculateFirstInstallment(
            input.amount_financed,
            marketRate,
            input.total_installments,
            input.amortization_method
        );

        return this.buildPreviewResult(input, originalInstallment, recalculatedInstallment);
    }

    /**
     * Full calculation with monetary correction
     */
    async calculateFull(input: CalculationInputV3): Promise<CalculationFullResult> {
        const startTime = Date.now();

        const preview = await this.calculatePreview(input);

        const specificData = input.specific_data as ImobiliarioSpecificData;

        // Generate scenarios with monetary correction
        const ap01 = await this.generateImobiliarioScenario(input, specificData, 'AP01');

        const marketRate = input.market_rate_monthly || new Decimal('0.0091');
        const ap05 = await this.generateImobiliarioScenario(
            { ...input, contract_rate_monthly: marketRate },
            specificData,
            'AP05'
        );

        // Generate differences (AP02)
        const ap02 = this.generateDifferencesScenario(ap01, ap05);

        // Generate consolidation scenarios (AP06, AP07)
        const ap06 = this.generateConsolidationScenario(ap01, ap02, true); // Double
        const ap07 = this.generateConsolidationScenario(ap01, ap02, false); // Simple

        const executionTime = Date.now() - startTime;

        return {
            preview,
            scenarios: {
                ap01,
                ap02,
                ap05,
                ap06,
                ap07,
            },
            rates_snapshot: {
                series_id: specificData?.indexer === 'TR' ? '226' : '433',
                rate_value: marketRate,
                reference_date: input.start_date.substring(0, 7),
                fetched_at: new Date().toISOString(),
            },
            execution_time_ms: executionTime,
            calculated_at: new Date().toISOString(),
        };
    }

    /**
     * Generate real estate scenario with monetary correction
     * Follows strict order: 1. Correction, 2. Interest, 3. Amortization, 4. Insurance, 5. Installment
     */
    private async generateImobiliarioScenario(
        input: CalculationInputV3,
        specificData: ImobiliarioSpecificData | undefined,
        scenarioType: string
    ): Promise<ScenarioResult> {
        const table: AmortizationLineV3[] = [];
        let balance = input.amount_financed;
        const dates = this.generatePaymentDates(input);

        // Get insurance values
        const insuranceMIP = specificData?.insurance_mip || new Decimal(0);
        const insuranceDFI = specificData?.insurance_dfi || new Decimal(0);
        const adminFee = specificData?.admin_fee || new Decimal(0);

        let totalInterest = new Decimal(0);
        let totalInsurance = new Decimal(0);
        let totalFees = new Decimal(0);
        let totalPaid = new Decimal(0);

        for (let n = 1; n <= input.total_installments; n++) {
            const dueDate = dates[n - 1];

            // 1. MONETARY CORRECTION (TR/IPCA/INPC/IGPM)
            // TODO: Fetch actual index from taxas_bacen_historico
            const correctionRate = await this.getMonetaryCorrectionRate(
                specificData?.indexer || 'TR',
                dueDate
            );
            const monetaryCorrection = balance.times(correctionRate);
            const correctedBalance = balance.plus(monetaryCorrection);

            // 2. INTEREST CALCULATION
            const interest = calculateMonthlyInterest(correctedBalance, input.contract_rate_monthly);

            // 3. AMORTIZATION
            let amortization: Decimal;
            let installmentBase: Decimal;

            if (input.amortization_method === 'SAC') {
                amortization = input.amount_financed.div(input.total_installments);
                installmentBase = amortization.plus(interest);
            } else if (input.amortization_method === 'SACRE') {
                // SACRE: Amortization increases over time
                const factor = new Decimal(n).div(input.total_installments);
                amortization = input.amount_financed.div(input.total_installments).times(
                    new Decimal(1).plus(factor)
                );
                installmentBase = amortization.plus(interest);
            } else {
                // PRICE
                installmentBase = calculatePMT(
                    correctedBalance,
                    input.contract_rate_monthly,
                    input.total_installments - n + 1
                );
                amortization = installmentBase.minus(interest);
            }

            // 4. INSURANCE (MIP on balance, DFI on property value)
            const mipValue = correctedBalance.times(insuranceMIP.div(100));
            const dfiValue = (specificData?.property_value || input.amount_financed)
                .times(insuranceDFI.div(100));
            const totalMonthlyInsurance = mipValue.plus(dfiValue);

            // 5. COMPOSE INSTALLMENT
            const totalInstallment = installmentBase.plus(totalMonthlyInsurance).plus(adminFee);

            // Get reconciliation
            const reconciliation = this.getReconciliationForInstallment(
                input.payment_reconciliation,
                n
            );

            const line: AmortizationLineV3 = {
                n,
                date: dueDate,
                opening_balance: balance,
                monetary_correction: monetaryCorrection,
                corrected_balance: correctedBalance,
                interest,
                amortization,
                closing_balance: correctedBalance.minus(amortization),
                installment_value: installmentBase,
                insurance: totalMonthlyInsurance,
                admin_fee: adminFee,
                total_installment: totalInstallment,
                payment_status: reconciliation?.status || 'PENDING',
                paid_date: reconciliation?.paid_date,
                paid_value: reconciliation?.paid_value,
                extra_amortization: reconciliation?.extra_amortization,
            };

            table.push(line);

            // Update balance
            balance = line.closing_balance;
            if (reconciliation?.extra_amortization) {
                balance = balance.minus(reconciliation.extra_amortization);
            }

            totalInterest = totalInterest.plus(interest);
            totalInsurance = totalInsurance.plus(totalMonthlyInsurance);
            totalFees = totalFees.plus(adminFee);
            totalPaid = totalPaid.plus(totalInstallment);
        }

        return {
            type: scenarioType,
            description: scenarioType === 'AP01'
                ? 'Evolução do Financiamento (Recálculo)'
                : 'Valores Devidos (Taxa Média)',
            table,
            totals: {
                principal: input.amount_financed,
                total_interest: totalInterest,
                total_insurance: totalInsurance,
                total_fees: totalFees,
                total_paid: totalPaid,
            },
        };
    }

    /**
     * Generate consolidation scenario (AP06/AP07)
     */
    private generateConsolidationScenario(
        bankScenario: ScenarioResult,
        differencesScenario: ScenarioResult,
        doubleRefund: boolean
    ): ScenarioResult {
        const refund = doubleRefund
            ? differencesScenario.totals.total_refund?.times(2) || new Decimal(0)
            : differencesScenario.totals.total_refund || new Decimal(0);

        // Last balance from bank scenario
        const lastLine = bankScenario.table[bankScenario.table.length - 1];
        const currentBalance = lastLine?.closing_balance || new Decimal(0);

        // Encontro de contas
        const finalBalance = currentBalance.minus(refund);

        return {
            type: doubleRefund ? 'AP06' : 'AP07',
            description: doubleRefund
                ? 'Consolidação Saldo Devedor (Restituição Dobro)'
                : 'Consolidação Saldo Devedor (Restituição Simples)',
            table: [],
            totals: {
                principal: currentBalance,
                total_interest: new Decimal(0),
                total_insurance: new Decimal(0),
                total_fees: new Decimal(0),
                total_paid: new Decimal(0),
                total_refund: refund,
                total_due: finalBalance.greaterThan(0) ? finalBalance : new Decimal(0),
            },
        };
    }

    /**
     * Get monetary correction rate from cache/API
     */
    private async getMonetaryCorrectionRate(
        indexer: string,
        date: string
    ): Promise<Decimal> {
        // TODO: Fetch from taxas_bacen_historico table
        // For now, return typical TR value
        switch (indexer) {
            case 'TR':
                return new Decimal('0.0001'); // ~0.01% (TR has been very low)
            case 'IPCA':
                return new Decimal('0.004'); // ~0.4%
            case 'INPC':
                return new Decimal('0.0035'); // ~0.35%
            case 'IGPM':
                return new Decimal('0.005'); // ~0.5%
            default:
                return new Decimal(0);
        }
    }

    /**
     * Calculate first installment based on system
     */
    private calculateFirstInstallment(
        principal: Decimal,
        rate: Decimal,
        periods: number,
        system: string
    ): Decimal {
        if (system === 'SAC' || system === 'SACRE') {
            const amortization = principal.div(periods);
            const interest = principal.times(rate);
            return amortization.plus(interest);
        }
        return calculatePMT(principal, rate, periods);
    }
}
