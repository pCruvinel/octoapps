/**
 * Cartao RMC Strategy - Credit Card and RMC Debt
 * 
 * Handles credit card revolving debt analysis:
 * - Macro analysis without monthly statement history
 * - Compound interest simulation
 * - Consignado simulation for debt restructuring
 */

import Decimal from 'decimal.js';
import { BaseStrategy } from './base.strategy';
import {
    CalculationInputV3,
    CalculationPreviewResult,
    CalculationFullResult,
    ScenarioResult,
    AmortizationLineV3,
    CartaoRMCSpecificData,
} from '../types';
import {
    calculatePMT,
    calculateCompoundAmount,
    monthlyToAnnualRate,
    calculateMonthlyInterest,
} from '../utils';

export class CartaoRMCStrategy extends BaseStrategy {
    // Default consignado simulation period
    private readonly DEFAULT_SIMULATION_MONTHS = 60;

    /**
     * Quick preview for credit card debt
     */
    async calculatePreview(input: CalculationInputV3): Promise<CalculationPreviewResult> {
        const specificData = input.specific_data as CartaoRMCSpecificData;
        const revolvingRate = specificData?.revolving_rate || input.contract_rate_monthly;

        // Market rate for consignado (much lower than revolving)
        const marketRate = input.market_rate_monthly || new Decimal('0.0193'); // ~1.93%

        // Calculate what the debt would be with market rate
        const periods = input.total_installments || this.DEFAULT_SIMULATION_MONTHS;

        // Simulate monthly payment if converted to consignado
        const simulatedInstallment = calculatePMT(
            input.amount_financed,
            marketRate,
            periods
        );

        // Current revolving payment (interest only typically)
        const revolvingPayment = calculateMonthlyInterest(
            input.amount_financed,
            revolvingRate
        );

        return this.buildPreviewResult(input, revolvingPayment, simulatedInstallment);
    }

    /**
     * Full calculation with consignado simulation
     */
    async calculateFull(input: CalculationInputV3): Promise<CalculationFullResult> {
        const startTime = Date.now();

        const preview = await this.calculatePreview(input);
        const specificData = input.specific_data as CartaoRMCSpecificData;

        const periods = input.total_installments || this.DEFAULT_SIMULATION_MONTHS;
        const marketRate = input.market_rate_monthly || new Decimal('0.0193');

        // AP01: Reconstruct as simulated consignado
        const ap01 = this.generateConsignadoSimulation(input, marketRate, periods);

        // AP02: Payment history confrontation
        const ap02 = this.generatePaymentConfrontation(input);

        // AP03: Indebtedness calculation
        const ap03 = this.generateIndebtnessScenario(ap01, ap02);

        const executionTime = Date.now() - startTime;

        return {
            preview,
            scenarios: {
                ap01,
                ap02,
                ap03,
            },
            rates_snapshot: {
                series_id: '25471', // Consignado series
                rate_value: marketRate,
                reference_date: input.start_date.substring(0, 7),
                fetched_at: new Date().toISOString(),
            },
            execution_time_ms: executionTime,
            calculated_at: new Date().toISOString(),
        };
    }

    /**
     * AP01: Convert infinite revolving debt to structured consignado loan
     */
    private generateConsignadoSimulation(
        input: CalculationInputV3,
        rate: Decimal,
        periods: number
    ): ScenarioResult {
        const table: AmortizationLineV3[] = [];
        let balance = input.amount_financed;
        const installment = calculatePMT(input.amount_financed, rate, periods);

        let totalInterest = new Decimal(0);
        let totalPaid = new Decimal(0);

        const startDate = new Date(input.first_payment_date);

        for (let n = 1; n <= periods; n++) {
            const interest = calculateMonthlyInterest(balance, rate);
            const amortization = installment.minus(interest);

            const date = new Date(startDate);
            date.setMonth(date.getMonth() + n - 1);

            const line: AmortizationLineV3 = {
                n,
                date: date.toISOString().split('T')[0],
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
            type: 'AP01',
            description: 'Reconstrução como Consignado Simulado',
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
     * AP02: Confrontation of withdrawals and payments (RMC discounts)
     */
    private generatePaymentConfrontation(input: CalculationInputV3): ScenarioResult {
        const table: AmortizationLineV3[] = [];
        let totalPaid = new Decimal(0);

        // Process payment reconciliation as RMC discounts
        for (const payment of input.payment_reconciliation) {
            if (payment.status === 'PAID' && payment.paid_value) {
                const line: AmortizationLineV3 = {
                    n: payment.n,
                    date: payment.paid_date || payment.due_date,
                    opening_balance: new Decimal(0),
                    interest: new Decimal(0),
                    amortization: payment.paid_value,
                    closing_balance: new Decimal(0),
                    installment_value: payment.paid_value,
                    total_installment: payment.paid_value,
                    payment_status: 'PAID',
                    paid_date: payment.paid_date,
                    paid_value: payment.paid_value,
                };

                table.push(line);
                totalPaid = totalPaid.plus(payment.paid_value);
            }
        }

        return {
            type: 'AP02',
            description: 'Confronto de Saques e Pagamentos (RMC)',
            table,
            totals: {
                principal: new Decimal(0),
                total_interest: new Decimal(0),
                total_insurance: new Decimal(0),
                total_fees: new Decimal(0),
                total_paid: totalPaid,
            },
        };
    }

    /**
     * AP03: Calculate when debt should have been settled
     * And how much was paid after that point (indébito)
     */
    private generateIndebtnessScenario(
        simulationScenario: ScenarioResult,
        paymentsScenario: ScenarioResult
    ): ScenarioResult {
        // Find the installment where cumulative payments >= simulated total
        const totalSimulated = simulationScenario.totals.total_paid;
        const totalActuallyPaid = paymentsScenario.totals.total_paid;

        // Everything paid beyond the simulated payment is indébito
        const refund = totalActuallyPaid.minus(totalSimulated);
        const actualRefund = refund.greaterThan(0) ? refund : new Decimal(0);

        // Find settlement point
        let cumulativePaid = new Decimal(0);
        let settlementMonth = 0;

        for (const line of simulationScenario.table) {
            cumulativePaid = cumulativePaid.plus(line.total_installment);
            if (cumulativePaid.greaterThanOrEqualTo(totalActuallyPaid)) {
                settlementMonth = line.n;
                break;
            }
        }

        return {
            type: 'AP03',
            description: 'Apuração de Indébito',
            table: [],
            totals: {
                principal: totalActuallyPaid,
                total_interest: new Decimal(0),
                total_insurance: new Decimal(0),
                total_fees: new Decimal(0),
                total_paid: totalActuallyPaid,
                total_refund: actualRefund,
                total_due: new Decimal(0),
            },
        };
    }
}
