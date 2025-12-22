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
import type { MapaIndicesHistoricos } from '../../../types/calculation.types';
import {
    calculatePMT,
    calculateMonthlyInterest,
    monthlyToAnnualRate,
    parseDate,
    formatDate,
    addMonths,
    daysBetween,
} from '../utils';
import { buscarSerieHistorica, obterIndicePorData } from '../../taxasMercadoBacen';

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
        // AP01: Evolução do Financiamento (Cenário Banco)
        const ap01 = await this.generateImobiliarioScenario(input, specificData, 'AP01');

        // AP02: Recálculo Técnico (Cenário com Taxa Média BACEN)
        const marketRate = input.market_rate_monthly || new Decimal('0.0091');
        const ap02 = await this.generateImobiliarioScenario(
            { ...input, contract_rate_monthly: marketRate },
            specificData,
            'AP02'
        );

        // AP03: Diferenças Nominais (Comparação AP01 vs AP02)
        let ap03 = this.generateDifferencesScenario(ap01, ap02);

        // Apply INPC monetary correction to differences
        ap03 = await this.applyINPCCorrection(ap03, input.start_date);

        // AP04: Consolidação com Restituição Simples (Art. 368)
        const ap04 = this.generateConsolidationScenario(ap01, ap03, false);

        // AP05: Consolidação com Restituição em Dobro (Art. 42 CDC)
        const ap05 = this.generateConsolidationScenario(ap01, ap03, true);

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

        // MOMENTO ZERO: Expurgar tarifas abusivas do saldo inicial
        // Conforme especificação: "Define o saldo devedor inicial subtraindo taxas abusivas"
        if (input.exclude_tariffs && specificData) {
            const totalTarifas = this.getTotalImobiliarioTariffs(specificData);
            if (totalTarifas.greaterThan(0)) {
                balance = balance.minus(totalTarifas);
                console.log(
                    `[ImobiliarioStrategy] Momento Zero: Expurgadas R$ ${totalTarifas.toFixed(2)} em tarifas abusivas`
                );
                console.log(
                    `[ImobiliarioStrategy] Saldo inicial ajustado: R$ ${input.amount_financed.toFixed(2)} → R$ ${balance.toFixed(2)}`
                );
            }
        }

        const dates = this.generatePaymentDates(input);

        // Get insurance values
        const insuranceDFI = specificData?.insurance_dfi || new Decimal(0);
        const adminFee = specificData?.admin_fee || new Decimal(0);

        // MIP: Use age-based calculation if enabled, otherwise use fixed rate
        const useAgeMIP = specificData?.use_age_based_mip && specificData?.borrower_birth_date;
        const fixedMIP = specificData?.insurance_mip || new Decimal(0);

        // OPTIMIZATION: Bulk fetch historical index data ONCE before loop
        // This prevents 420+ sequential API calls for long contracts
        const indexador = specificData?.indexer || 'TR';
        let mapaIndices: MapaIndicesHistoricos = new Map();

        if (indexador) {
            try {
                console.log(`[ImobiliarioStrategy] Fetching ${indexador} historical data...`);
                mapaIndices = await buscarSerieHistorica(
                    indexador,
                    input.start_date,
                    input.total_installments,
                    'MES_CHEIO_ANTERIOR' // TR/IPCA use previous full month
                );
                console.log(`[ImobiliarioStrategy] ✅ Loaded ${mapaIndices.size} index values for ${indexador}`);
            } catch (error) {
                console.warn(`[ImobiliarioStrategy] Failed to fetch ${indexador} data, will use fallback values`, error);
            }
        }

        let totalInterest = new Decimal(0);
        let totalInsurance = new Decimal(0);
        let totalFees = new Decimal(0);
        let totalPaid = new Decimal(0);

        for (let n = 1; n <= input.total_installments; n++) {
            const dueDate = dates[n - 1];

            // 1. MONETARY CORRECTION (TR/IPCA/INPC/IGPM)
            // Uses pre-fetched historical data from BACEN
            const correctionRate = this.getMonetaryCorrectionRate(
                indexador,
                dueDate,
                mapaIndices
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
            // MIP: Calculate based on borrower's age at this payment date if enabled
            let mipRate: Decimal;
            if (useAgeMIP && specificData?.borrower_birth_date) {
                mipRate = this.calculateAgeMIPRate(specificData.borrower_birth_date, dueDate);
            } else {
                mipRate = fixedMIP;
            }

            const mipValue = correctedBalance.times(mipRate.div(100));
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

        // Descriptions based on scenario type
        const descriptions: Record<string, string> = {
            'AP01': 'Evolução do Financiamento (Cenário Banco)',
            'AP02': 'Recálculo Técnico (Taxa Média BACEN)',
        };

        return {
            type: scenarioType,
            description: descriptions[scenarioType] || 'Cenário de Cálculo',
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
     * Generate consolidation scenario (AP04/AP05)
     *
     * AP04: Restituição Simples (Art. 368 CPC - Compensação)
     * AP05: Restituição em Dobro (Art. 42 CDC - Cobrança Indevida)
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

        // Encontro de contas (offsetting)
        const finalBalance = currentBalance.minus(refund);

        return {
            type: doubleRefund ? 'AP05' : 'AP04',
            description: doubleRefund
                ? 'Consolidação com Restituição em Dobro (Art. 42 CDC)'
                : 'Consolidação com Restituição Simples (Art. 368 CPC)',
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
     * Get monetary correction rate from historical index map
     * Falls back to typical values if data not available
     *
     * @param indexer - Indexer type (TR, IPCA, INPC, IGPM)
     * @param date - Payment due date (YYYY-MM-DD)
     * @param mapaIndices - Pre-fetched historical index map
     * @returns Decimal correction rate (e.g., 0.0001 = 0.01%)
     */
    private getMonetaryCorrectionRate(
        indexer: string,
        date: string,
        mapaIndices: MapaIndicesHistoricos
    ): Decimal {
        // If no indexer, no correction
        if (!indexer) {
            return new Decimal(0);
        }

        // Try to get actual historical value
        if (mapaIndices.size > 0) {
            const valorIndice = obterIndicePorData(
                mapaIndices,
                date,
                'MES_CHEIO_ANTERIOR' // Use previous full month (e.g., TR for Feb uses Jan value)
            );

            if (valorIndice > 0) {
                return new Decimal(valorIndice);
            }
        }

        // FALLBACK: Use typical values if historical data not available
        // Based on recent historical averages
        console.warn(`[ImobiliarioStrategy] Using fallback ${indexer} value for ${date}`);
        switch (indexer) {
            case 'TR':
                return new Decimal('0.0001'); // ~0.01% (TR has been very low since 2017)
            case 'IPCA':
                return new Decimal('0.004'); // ~0.4% (typical monthly IPCA)
            case 'INPC':
                return new Decimal('0.0035'); // ~0.35% (typically slightly lower than IPCA)
            case 'IGPM':
                return new Decimal('0.005'); // ~0.5% (more volatile, conservative estimate)
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

    /**
     * Calculate total tariffs for real estate financing
     * These tariffs can be excluded from initial balance ("Momento Zero")
     */
    private getTotalImobiliarioTariffs(specificData: ImobiliarioSpecificData | undefined): Decimal {
        if (!specificData) {
            return new Decimal(0);
        }

        let total = new Decimal(0);

        // Taxa de Avaliação do Imóvel
        if (specificData.taxa_avaliacao) {
            total = total.plus(specificData.taxa_avaliacao);
        }

        // Taxa de Registro de Contrato
        if (specificData.taxa_registro) {
            total = total.plus(specificData.taxa_registro);
        }

        // Taxa de Análise de Garantia/Crédito
        if (specificData.taxa_analise) {
            total = total.plus(specificData.taxa_analise);
        }

        // Outras tarifas
        if (specificData.outras_tarifas) {
            for (const tarifa of specificData.outras_tarifas) {
                total = total.plus(tarifa.value);
            }
        }

        return total;
    }

    /**
     * Apply INPC monetary correction to differences scenario
     *
     * Calculates the inflation-adjusted value of each difference from payment date to today.
     * This shows the real economic value of the refund in current currency.
     *
     * @param differencesScenario - AP03 scenario with nominal differences
     * @param startDate - Contract start date for INPC data fetch
     * @returns Enhanced scenario with INPC-corrected totals
     */
    private async applyINPCCorrection(
        differencesScenario: ScenarioResult,
        startDate: string
    ): Promise<ScenarioResult> {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Fetch INPC historical data from contract start to today
        let mapaINPC: MapaIndicesHistoricos = new Map();

        try {
            console.log(`[ImobiliarioStrategy] Fetching INPC data for monetary correction...`);

            // Calculate total months from start to today
            const startParts = startDate.split('-');
            const todayParts = today.split('-');
            const monthsDiff = (parseInt(todayParts[0]) - parseInt(startParts[0])) * 12 +
                             (parseInt(todayParts[1]) - parseInt(startParts[1]));

            mapaINPC = await buscarSerieHistorica(
                'INPC',
                startDate,
                Math.max(monthsDiff + 1, 1), // At least 1 month
                'MES_CHEIO_ANTERIOR'
            );

            console.log(`[ImobiliarioStrategy] ✅ Loaded ${mapaINPC.size} INPC values`);
        } catch (error) {
            console.warn(`[ImobiliarioStrategy] Failed to fetch INPC data for correction`, error);
            // Continue without correction if INPC data unavailable
            return differencesScenario;
        }

        // Calculate INPC-corrected refund
        let totalRefundCorrected = new Decimal(0);
        let totalINPCFactor = new Decimal(1); // Accumulated INPC multiplier

        for (const line of differencesScenario.table) {
            // Only correct paid installments (those that generated actual differences)
            if (line.payment_status === 'PAID' && line.difference && line.difference.greaterThan(0)) {
                const paymentDate = line.paid_date || line.date;

                // Calculate accumulated INPC from payment date to today
                const inpcFactor = this.calculateAccumulatedINPC(
                    mapaINPC,
                    paymentDate,
                    today
                );

                // Apply INPC correction: corrected_value = nominal_value * (1 + inpc_accumulated)
                const correctedDifference = line.difference.times(new Decimal(1).plus(inpcFactor));
                totalRefundCorrected = totalRefundCorrected.plus(correctedDifference);

                // Track average INPC factor (for reporting)
                totalINPCFactor = totalINPCFactor.plus(inpcFactor);
            }
        }

        // Calculate average INPC factor across all corrections
        const paidCount = differencesScenario.table.filter(
            l => l.payment_status === 'PAID' && l.difference && l.difference.greaterThan(0)
        ).length;

        const avgINPCFactor = paidCount > 0
            ? totalINPCFactor.div(paidCount)
            : new Decimal(0);

        // Enhance scenario with INPC correction data
        return {
            ...differencesScenario,
            description: 'Diferenças Nominais e Atualizadas (INPC)',
            totals: {
                ...differencesScenario.totals,
                total_refund_inpc_corrected: totalRefundCorrected,
                inpc_accumulated: avgINPCFactor,
                correction_reference_date: today,
            },
        };
    }

    /**
     * Calculate accumulated INPC between two dates
     *
     * @param mapaINPC - Historical INPC index map
     * @param fromDate - Start date (YYYY-MM-DD)
     * @param toDate - End date (YYYY-MM-DD)
     * @returns Accumulated INPC factor (e.g., 0.35 = 35% inflation)
     */
    private calculateAccumulatedINPC(
        mapaINPC: MapaIndicesHistoricos,
        fromDate: string,
        toDate: string
    ): Decimal {
        if (mapaINPC.size === 0) {
            return new Decimal(0);
        }

        // Parse dates
        const from = new Date(fromDate);
        const to = new Date(toDate);

        // Calculate months between dates
        const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 +
                          (to.getMonth() - from.getMonth());

        if (monthsDiff <= 0) {
            return new Decimal(0);
        }

        // Accumulate INPC month by month
        let accumulatedFactor = new Decimal(1);

        for (let i = 0; i <= monthsDiff; i++) {
            const currentDate = new Date(from);
            currentDate.setMonth(currentDate.getMonth() + i);

            const dateStr = currentDate.toISOString().split('T')[0];
            const monthlyINPC = obterIndicePorData(
                mapaINPC,
                dateStr,
                'MES_CHEIO_ANTERIOR'
            );

            if (monthlyINPC > 0) {
                // Compound: (1 + i1) * (1 + i2) * ... - 1
                accumulatedFactor = accumulatedFactor.times(new Decimal(1).plus(monthlyINPC));
            }
        }

        // Return accumulated factor minus 1 (e.g., 1.35 becomes 0.35 = 35%)
        return accumulatedFactor.minus(1);
    }

    /**
     * Calculate age-based MIP rate
     *
     * MIP (Morte e Invalidez Permanente) increases with borrower's age.
     * The rate is recalculated for each payment based on current age.
     *
     * Age brackets (typical market values):
     * - 18-29: 0.02% over balance
     * - 30-39: 0.03% over balance
     * - 40-49: 0.05% over balance
     * - 50-59: 0.08% over balance
     * - 60-64: 0.12% over balance
     * - 65-70: 0.15% over balance
     *
     * @param birthDate - Borrower's birth date (YYYY-MM-DD)
     * @param paymentDate - Payment due date (YYYY-MM-DD)
     * @returns MIP rate as percentage (e.g., 0.05 = 0.05%)
     */
    private calculateAgeMIPRate(birthDate: string, paymentDate: string): Decimal {
        // Calculate age at payment date
        const birth = new Date(birthDate);
        const payment = new Date(paymentDate);

        let age = payment.getFullYear() - birth.getFullYear();
        const monthDiff = payment.getMonth() - birth.getMonth();

        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && payment.getDate() < birth.getDate())) {
            age--;
        }

        // Age-based MIP rate table (percentages over corrected balance)
        // Rates based on market averages for real estate financing
        if (age < 30) return new Decimal('0.02');   // 0.02% - Young borrowers
        if (age < 40) return new Decimal('0.03');   // 0.03% - Ages 30-39
        if (age < 50) return new Decimal('0.05');   // 0.05% - Ages 40-49
        if (age < 60) return new Decimal('0.08');   // 0.08% - Ages 50-59
        if (age < 65) return new Decimal('0.12');   // 0.12% - Ages 60-64
        if (age <= 70) return new Decimal('0.15');  // 0.15% - Ages 65-70

        // Age > 70: High risk, typically 0.15% or insurance denial
        // For calculation purposes, use maximum rate
        console.warn(`[ImobiliarioStrategy] MIP for age ${age} (>70) - using maximum rate 0.15%`);
        return new Decimal('0.15');
    }
}
