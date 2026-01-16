/**
 * Base Strategy Class
 * 
 * Abstract base class with common functionality for all calculation strategies.
 */

import Decimal from 'decimal.js';
import {
    ICalculationStrategy,
    CalculationInputV3,
    CalculationPreviewResult,
    CalculationFullResult,
    AmortizationLineV3,
    ScenarioResult,
    AbuseClassification,
    PaymentReconciliationEntry,
} from '../types';
import {
    calculateMonthlyInterest,
    calculateDailyInterest,
    calculatePMT,
    monthlyToAnnualRate,
    formatDate,
    parseDate,
    addMonths,
    daysBetween,
    isRateAbusive,
    classifyAbuse,
    isTacTecIrregular,
} from '../utils';

export abstract class BaseStrategy implements ICalculationStrategy {
    /**
     * Quick preview calculation (must complete in < 5 seconds)
     */
    abstract calculatePreview(input: CalculationInputV3): Promise<CalculationPreviewResult>;

    /**
     * Full calculation with all scenarios
     */
    abstract calculateFull(input: CalculationInputV3): Promise<CalculationFullResult>;

    /**
     * Recalculate from specific installment after reconciliation changes
     */
    async recalculateFromInstallment(
        input: CalculationInputV3,
        _result: CalculationFullResult,
        _fromInstallment: number
    ): Promise<CalculationFullResult> {
        // Default: just recalculate everything
        // Subclasses can optimize this
        return this.calculateFull(input);
    }

    // ============================================================================
    // Momento Zero (t0) - Required for XIRR/TIR Calculations
    // ============================================================================

    /**
     * Create "Momento Zero" line (t0) for the amortization table.
     * 
     * This is MANDATORY for all modules because:
     * 1. XIRR/TIR requires negative cashflow at t0 (loan disbursement)
     * 2. Pro-rata interest calculation depends on days between t0 and t1
     * 3. Mathematical correctness of the flow
     * 
     * Structure:
     * - n: 0
     * - date: Contract/disbursement date
     * - opening_balance: 0 (no balance before loan)
     * - closing_balance: +amount_financed (positive = debt created)
     * - payment: 0 (no payment at t0)
     */
    protected createMomentoZeroLine(input: CalculationInputV3): AmortizationLineV3 {
        return {
            n: 0,
            date: input.start_date,
            opening_balance: new Decimal(0),
            interest: new Decimal(0),
            amortization: new Decimal(0),
            closing_balance: input.amount_financed,
            installment_value: new Decimal(0),
            total_installment: new Decimal(0),
            payment_status: 'PAID', // t0 is always "complete"
        };
    }

    /**
     * Validate that the amortization table ends with balance ≈ 0
     * (Prova Real / Balance Zeroing)
     */
    protected validateBalanceZeroing(table: AmortizationLineV3[], tolerance: Decimal = new Decimal('0.01')): void {
        if (table.length === 0) return;
        
        // Skip t0 line (n=0) when finding last payment line
        const paymentLines = table.filter(line => line.n > 0);
        if (paymentLines.length === 0) return;
        
        const lastLine = paymentLines[paymentLines.length - 1];
        
        if (lastLine.closing_balance.abs().greaterThan(tolerance)) {
            console.warn(
                `[PROVA REAL] Saldo final não zerou: R$ ${lastLine.closing_balance.toFixed(2)}`,
                `Esperado: R$ 0.00 ± ${tolerance.toFixed(2)}.`,
                `Verifique precisão da taxa ou Momento Zero.`
            );
        } else {
            console.log(`[PROVA REAL] ✅ Saldo final zerado corretamente: R$ ${lastLine.closing_balance.toFixed(2)}`);
        }
    }

    // ============================================================================
    // Protected Helper Methods
    // ============================================================================

    /**
     * Calculate interest for a period based on capitalization mode
     */
    protected calculateInterest(
        principal: Decimal,
        monthlyRate: Decimal,
        capitalizationMode: 'MONTHLY' | 'DAILY',
        days: number = 30
    ): Decimal {
        if (capitalizationMode === 'DAILY') {
            return calculateDailyInterest(principal, monthlyRate, days);
        }
        return calculateMonthlyInterest(principal, monthlyRate);
    }

    /**
     * Calculate installment value based on amortization system
     */
    protected calculateInstallment(
        principal: Decimal,
        monthlyRate: Decimal,
        periods: number,
        amortizationMethod: string
    ): Decimal {
        switch (amortizationMethod) {
            case 'PRICE':
                return calculatePMT(principal, monthlyRate, periods);

            case 'SAC':
                // SAC: First installment (amortization + first month interest)
                const amortization = principal.div(periods);
                const firstInterest = principal.times(monthlyRate);
                return amortization.plus(firstInterest);

            case 'GAUSS_SIMPLE':
                // Gauss: Simple interest distribution
                const totalInterest = principal.times(monthlyRate).times(periods);
                return principal.plus(totalInterest).div(periods);

            default:
                return calculatePMT(principal, monthlyRate, periods);
        }
    }

    /**
     * Detect if daily capitalization is being used (rate discrepancy check)
     * If (1 + monthly)^12 < annual, suggests daily capitalization
     */
    protected detectDailyCapitalization(
        monthlyRate: Decimal,
        annualRate: Decimal,
        tolerance: Decimal = new Decimal('0.01')
    ): boolean {
        const expectedAnnual = monthlyToAnnualRate(monthlyRate);
        const discrepancy = annualRate.minus(expectedAnnual);
        return discrepancy.greaterThan(tolerance);
    }

    /**
     * Build base preview result
     */
    protected buildPreviewResult(
        input: CalculationInputV3,
        originalInstallment: Decimal,
        recalculatedInstallment: Decimal
    ): CalculationPreviewResult {
        const contractRate = input.contract_rate_monthly;
        const marketRate = input.market_rate_monthly || new Decimal('0.015'); // Default 1.5%

        const excessRatePP = contractRate.minus(marketRate);
        const excessRatePercent = marketRate.isZero()
            ? new Decimal(0)
            : contractRate.div(marketRate).minus(1).times(100);

        const savingsPerInstallment = originalInstallment.minus(recalculatedInstallment);
        const estimatedTotalSavings = savingsPerInstallment.times(input.total_installments);

        // Check for daily capitalization
        const dailyCapitalizationDetected = this.detectDailyCapitalization(
            contractRate,
            input.contract_rate_yearly
        ) || input.capitalization_mode === 'DAILY';

        // Check TAC/TEC irregularity
        const contractDate = parseDate(input.start_date);
        const tacTecIrregular = isTacTecIrregular(contractDate) &&
            this.hasTacTec(input.specific_data);

        const abuseClassification = classifyAbuse(contractRate, marketRate);
        const isViable = savingsPerInstallment.greaterThan(0) &&
            abuseClassification !== 'NORMAL';

        return {
            is_viable: isViable,
            abuse_classification: abuseClassification,
            contract_rate_monthly: contractRate,
            market_rate_monthly: marketRate,
            excess_rate_pp: excessRatePP,
            excess_rate_percent: excessRatePercent,
            original_installment: originalInstallment,
            recalculated_installment: recalculatedInstallment,
            savings_per_installment: savingsPerInstallment,
            estimated_total_savings: estimatedTotalSavings,
            estimated_refund_simple: estimatedTotalSavings,
            estimated_refund_double: estimatedTotalSavings.times(2),
            flags: {
                daily_capitalization_detected: dailyCapitalizationDetected,
                abusive_insurance: this.hasAbusiveInsurance(input.specific_data),
                illegal_rate: isRateAbusive(contractRate, marketRate, input.abuse_threshold),
                tac_tec_irregular: tacTecIrregular,
                anatocism_detected: dailyCapitalizationDetected,
            },
        };
    }

    /**
     * Generate amortization table (AP01 - Bank Scenario)
     */
    protected generateBankScenario(
        input: CalculationInputV3
    ): ScenarioResult {
        const table: AmortizationLineV3[] = [];
        
        // MOMENTO ZERO (t0): Add disbursement line
        table.push(this.createMomentoZeroLine(input));
        
        let balance = input.amount_financed;
        const dates = this.generatePaymentDates(input);

        const pmt = this.calculateInstallment(
            input.amount_financed,
            input.contract_rate_monthly,
            input.total_installments,
            input.amortization_method
        );

        let totalInterest = new Decimal(0);
        let totalPaid = new Decimal(0);

        for (let n = 1; n <= input.total_installments; n++) {
            const dueDate = dates[n - 1];
            const prevDate = n === 1 ? input.first_payment_date : dates[n - 2];
            const days = daysBetween(parseDate(prevDate), parseDate(dueDate));

            const interest = this.calculateInterest(
                balance,
                input.contract_rate_monthly,
                input.capitalization_mode,
                days
            );

            let amortization: Decimal;
            let installment: Decimal;

            if (input.amortization_method === 'SAC') {
                amortization = input.amount_financed.div(input.total_installments);
                installment = amortization.plus(interest);
            } else {
                installment = pmt;
                amortization = installment.minus(interest);
            }

            // Get reconciliation data if available
            const reconciliation = this.getReconciliationForInstallment(
                input.payment_reconciliation,
                n
            );

            const line: AmortizationLineV3 = {
                n,
                date: dueDate,
                opening_balance: balance,
                interest,
                amortization,
                closing_balance: balance.minus(amortization),
                installment_value: installment,
                total_installment: installment,
                payment_status: reconciliation?.status || 'PENDING',
                paid_date: reconciliation?.paid_date,
                paid_value: reconciliation?.paid_value,
                extra_amortization: reconciliation?.extra_amortization,
            };

            table.push(line);

            // Update for next iteration
            balance = line.closing_balance;
            if (reconciliation?.extra_amortization) {
                balance = balance.minus(reconciliation.extra_amortization);
            }

            totalInterest = totalInterest.plus(interest);
            totalPaid = totalPaid.plus(installment);
        }

        return {
            type: 'AP01',
            description: 'Evolução Original (Cenário Banco)',
            table,
            totals: {
                principal: input.amount_financed,
                total_interest: totalInterest,
                total_insurance: new Decimal(0),
                total_fees: new Decimal(0),
                total_paid: totalPaid,
            },
        };
    }

    /**
     * Generate recalculated scenario (AP02)
     */
    protected generateRecalculatedScenario(
        input: CalculationInputV3,
        marketRate: Decimal
    ): ScenarioResult {
        const table: AmortizationLineV3[] = [];
        let balance = input.amount_financed;

        // Remove excluded tariffs from principal if configured
        if (input.exclude_tariffs && input.specific_data) {
            const tariffs = this.getTotalTariffs(input.specific_data);
            balance = balance.minus(tariffs);
        }
        
        // MOMENTO ZERO (t0): Add disbursement line with adjusted balance
        const t0Line = this.createMomentoZeroLine(input);
        t0Line.closing_balance = balance; // Use adjusted balance if tariffs excluded
        table.push(t0Line);

        const dates = this.generatePaymentDates(input);

        const pmt = this.calculateInstallment(
            balance,
            marketRate,
            input.total_installments,
            input.use_simple_interest ? 'GAUSS_SIMPLE' : input.amortization_method
        );

        let totalInterest = new Decimal(0);
        let totalPaid = new Decimal(0);

        for (let n = 1; n <= input.total_installments; n++) {
            const dueDate = dates[n - 1];

            // Use MONTHLY capitalization for recalculation (expurgando capitalização diária)
            const interest = calculateMonthlyInterest(balance, marketRate);

            let amortization: Decimal;
            let installment: Decimal;

            if (input.amortization_method === 'SAC' || input.use_simple_interest) {
                amortization = balance.div(input.total_installments - n + 1);
                installment = amortization.plus(interest);
            } else {
                installment = pmt;
                amortization = installment.minus(interest);
            }

            const line: AmortizationLineV3 = {
                n,
                date: dueDate,
                opening_balance: balance,
                interest,
                amortization,
                closing_balance: balance.minus(amortization),
                installment_value: installment,
                total_installment: installment,
                payment_status: 'PENDING',
            };

            table.push(line);

            balance = line.closing_balance;
            totalInterest = totalInterest.plus(interest);
            totalPaid = totalPaid.plus(installment);
        }

        return {
            type: 'AP02',
            description: 'Evolução Recalculada (Cenário Justo)',
            table,
            totals: {
                principal: input.amount_financed,
                total_interest: totalInterest,
                total_insurance: new Decimal(0),
                total_fees: new Decimal(0),
                total_paid: totalPaid,
                total_due: totalPaid,
            },
        };
    }

    /**
     * Generate differences scenario (AP03)
     */
    protected generateDifferencesScenario(
        bankScenario: ScenarioResult,
        recalculatedScenario: ScenarioResult
    ): ScenarioResult {
        const table: AmortizationLineV3[] = [];
        let totalRefund = new Decimal(0);

        for (let i = 0; i < bankScenario.table.length; i++) {
            const bankLine = bankScenario.table[i];
            const recalcLine = recalculatedScenario.table[i];

            const difference = bankLine.total_installment.minus(recalcLine.total_installment);

            const line: AmortizationLineV3 = {
                n: bankLine.n,
                date: bankLine.date,
                opening_balance: bankLine.opening_balance,
                interest: bankLine.interest.minus(recalcLine.interest),
                amortization: bankLine.amortization,
                closing_balance: bankLine.closing_balance,
                installment_value: bankLine.installment_value,
                market_interest: recalcLine.interest,
                market_installment: recalcLine.total_installment,
                total_installment: bankLine.total_installment,
                difference,
                payment_status: bankLine.payment_status,
                paid_date: bankLine.paid_date,
                paid_value: bankLine.paid_value,
            };

            table.push(line);

            // Only count difference for paid installments
            if (bankLine.payment_status === 'PAID') {
                totalRefund = totalRefund.plus(difference);
            }
        }

        return {
            type: 'AP03',
            description: 'Demonstrativo das Diferenças',
            table,
            totals: {
                principal: bankScenario.totals.principal,
                total_interest: bankScenario.totals.total_interest.minus(
                    recalculatedScenario.totals.total_interest
                ),
                total_insurance: new Decimal(0),
                total_fees: new Decimal(0),
                total_paid: bankScenario.totals.total_paid,
                total_refund: totalRefund,
            },
        };
    }

    // ============================================================================
    // Private Helpers
    // ============================================================================

    protected generatePaymentDates(input: CalculationInputV3): string[] {
        const dates: string[] = [];
        const start = parseDate(input.first_payment_date);

        for (let i = 0; i < input.total_installments; i++) {
            dates.push(formatDate(addMonths(start, i)));
        }

        return dates;
    }

    protected getReconciliationForInstallment(
        reconciliation: PaymentReconciliationEntry[],
        installmentNumber: number
    ): PaymentReconciliationEntry | undefined {
        return reconciliation.find(r => r.n === installmentNumber);
    }

    protected hasTacTec(specificData: Record<string, unknown>): boolean {
        const tac = specificData?.tac as number | undefined;
        const tec = specificData?.tec as number | undefined;
        return (tac !== undefined && tac > 0) || (tec !== undefined && tec > 0);
    }

    protected hasAbusiveInsurance(specificData: Record<string, unknown>): boolean {
        // Check for insurance without consent flag
        const insurances = specificData?.insurances as Array<{
            consent?: boolean;
            value?: number;
        }> | undefined;

        if (!insurances) return false;

        return insurances.some(ins => ins.consent === false && (ins.value || 0) > 0);
    }

    protected getTotalTariffs(specificData: Record<string, unknown>): Decimal {
        let total = new Decimal(0);

        const tariffsToExclude = specificData?.tariffs_to_exclude as Array<{
            value?: number;
        }> | undefined;

        if (tariffsToExclude) {
            for (const tariff of tariffsToExclude) {
                total = total.plus(tariff.value || 0);
            }
        }

        // Add TAC/TEC if present
        const tac = specificData?.tac as number | undefined;
        const tec = specificData?.tec as number | undefined;

        if (tac) total = total.plus(tac);
        if (tec) total = total.plus(tec);

        return total;
    }
}
