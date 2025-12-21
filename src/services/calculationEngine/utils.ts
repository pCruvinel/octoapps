/**
 * Calculation Engine v3.0 - Utility Functions
 * 
 * Core mathematical utilities using decimal.js for precision.
 * All financial calculations MUST use these functions.
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
    precision: 20,        // High precision for financial math
    rounding: Decimal.ROUND_HALF_UP,
    toExpNeg: -9,
    toExpPos: 9,
});

// ============================================================================
// Constants
// ============================================================================

export const DAYS_IN_MONTH = 30;
export const MONTHS_IN_YEAR = 12;
export const MAX_NEWTON_ITERATIONS = 100;
export const NEWTON_TOLERANCE = new Decimal('0.00000001');

// Legal limits
export const MAX_MORA_RATE = new Decimal('0.01');      // 1% a.m.
export const MAX_FINE_PERCENT = new Decimal('0.02');   // 2%
export const IOF_DAILY_RATE = new Decimal('0.000082'); // 0.0082% per day
export const IOF_ADDITIONAL = new Decimal('0.0038');   // 0.38%

// TAC/TEC prohibition date (Resolução CMN 3.518/2007)
export const TAC_TEC_PROHIBITION_DATE = new Date('2008-04-30');

// ============================================================================
// Rate Conversions
// ============================================================================

/**
 * Convert monthly rate to annual rate (compound)
 * Formula: (1 + i_m)^12 - 1
 */
export function monthlyToAnnualRate(monthlyRate: Decimal): Decimal {
    return new Decimal(1).plus(monthlyRate).pow(12).minus(1);
}

/**
 * Convert annual rate to monthly rate (compound)
 * Formula: (1 + i_a)^(1/12) - 1
 */
export function annualToMonthlyRate(annualRate: Decimal): Decimal {
    return new Decimal(1).plus(annualRate).pow(new Decimal(1).div(12)).minus(1);
}

/**
 * Convert monthly rate to daily rate (for daily capitalization)
 * Formula: (1 + i_m)^(1/30) - 1
 */
export function monthlyToDailyRate(monthlyRate: Decimal): Decimal {
    return new Decimal(1).plus(monthlyRate).pow(new Decimal(1).div(30)).minus(1);
}

// ============================================================================
// Interest Calculations
// ============================================================================

/**
 * Calculate interest for a period using MONTHLY capitalization
 * Simple: Principal × Rate
 */
export function calculateMonthlyInterest(
    principal: Decimal,
    monthlyRate: Decimal
): Decimal {
    return principal.times(monthlyRate);
}

/**
 * Calculate interest for a period using DAILY capitalization (EXPONENTIAL)
 * Formula: Principal × [(1 + i_m)^(d/30) - 1]
 * This is the REQUIRED formula per v3.0 specs.
 */
export function calculateDailyInterest(
    principal: Decimal,
    monthlyRate: Decimal,
    days: number
): Decimal {
    const exponent = new Decimal(days).div(DAYS_IN_MONTH);
    const factor = new Decimal(1).plus(monthlyRate).pow(exponent);
    return principal.times(factor.minus(1));
}

/**
 * Calculate compound amount after n periods
 * Formula: P × (1 + i)^n
 */
export function calculateCompoundAmount(
    principal: Decimal,
    rate: Decimal,
    periods: number
): Decimal {
    return principal.times(new Decimal(1).plus(rate).pow(periods));
}

// ============================================================================
// PMT Calculations (Price System)
// ============================================================================

/**
 * Calculate PMT (fixed installment) using Price system
 * Formula: PV × [i × (1+i)^n] / [(1+i)^n - 1]
 */
export function calculatePMT(
    presentValue: Decimal,
    monthlyRate: Decimal,
    periods: number
): Decimal {
    if (monthlyRate.isZero()) {
        return presentValue.div(periods);
    }

    const onePlusRate = new Decimal(1).plus(monthlyRate);
    const factor = onePlusRate.pow(periods);

    const numerator = monthlyRate.times(factor);
    const denominator = factor.minus(1);

    return presentValue.times(numerator.div(denominator));
}

/**
 * Calculate PMT using Gauss method (simple interest)
 * Used as alternative thesis for recalculation
 */
export function calculatePMTGauss(
    presentValue: Decimal,
    monthlyRate: Decimal,
    periods: number
): Decimal {
    // Gauss formula: PMT = PV × (1 + n×i) / n
    const totalRate = monthlyRate.times(periods);
    return presentValue.times(new Decimal(1).plus(totalRate)).div(periods);
}

// ============================================================================
// CET Calculation (Newton-Raphson)
// ============================================================================

/**
 * Calculate CET (Total Effective Cost) using Newton-Raphson method
 * Finds the rate that equates: PV - Fees = Σ(PMT_k / (1 + CET)^k)
 */
export function calculateCET(
    amountFinanced: Decimal,
    installments: Decimal[],
    initialFees: Decimal = new Decimal(0)
): { cetMonthly: Decimal; cetAnnual: Decimal } {
    const netAmount = amountFinanced.minus(initialFees);
    let rate = new Decimal('0.01'); // Initial guess: 1% a.m.

    for (let i = 0; i < MAX_NEWTON_ITERATIONS; i++) {
        let npv = new Decimal(0);
        let derivative = new Decimal(0);

        for (let k = 0; k < installments.length; k++) {
            const period = k + 1;
            const discountFactor = new Decimal(1).plus(rate).pow(period);
            npv = npv.plus(installments[k].div(discountFactor));
            derivative = derivative.minus(
                installments[k].times(period).div(discountFactor.times(new Decimal(1).plus(rate)))
            );
        }

        const fValue = npv.minus(netAmount);

        if (fValue.abs().lessThan(NEWTON_TOLERANCE)) {
            break;
        }

        rate = rate.minus(fValue.div(derivative));

        // Safety bounds
        if (rate.lessThan(0) || rate.greaterThan(1)) {
            rate = new Decimal('0.05'); // Reset to 5%
        }
    }

    return {
        cetMonthly: rate,
        cetAnnual: monthlyToAnnualRate(rate),
    };
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate: Date, endDate: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Generate array of monthly dates
 */
export function generateMonthlyDates(startDate: string, count: number): string[] {
    const dates: string[] = [];
    const start = parseDate(startDate);

    for (let i = 0; i < count; i++) {
        dates.push(formatDate(addMonths(start, i)));
    }

    return dates;
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format Decimal as Brazilian currency
 */
export function formatCurrency(value: Decimal): string {
    return value.toNumber().toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

/**
 * Format Decimal as percentage
 */
export function formatPercent(value: Decimal, decimals: number = 4): string {
    return `${value.times(100).toFixed(decimals)}%`;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if TAC/TEC is irregular (after prohibition date)
 */
export function isTacTecIrregular(contractDate: Date): boolean {
    return contractDate > TAC_TEC_PROHIBITION_DATE;
}

/**
 * Check if rate is abusive compared to market
 */
export function isRateAbusive(
    contractRate: Decimal,
    marketRate: Decimal,
    threshold: Decimal = new Decimal('1.5')
): boolean {
    if (marketRate.isZero()) return false;
    return contractRate.div(marketRate).greaterThan(threshold);
}

/**
 * Classify abuse level
 */
export function classifyAbuse(
    contractRate: Decimal,
    marketRate: Decimal
): 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    if (marketRate.isZero()) return 'NORMAL';

    const ratio = contractRate.div(marketRate);

    if (ratio.lessThanOrEqualTo(1.1)) return 'NORMAL';
    if (ratio.lessThanOrEqualTo(1.3)) return 'LOW';
    if (ratio.lessThanOrEqualTo(1.5)) return 'MEDIUM';
    if (ratio.lessThanOrEqualTo(2.0)) return 'HIGH';
    return 'EXTREME';
}
