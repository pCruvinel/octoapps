/**
 * Calculation Engine v3.0 - Types and Interfaces
 * 
 * Central type definitions for the refactored calculation module.
 * Supports daily capitalization, payment reconciliation, and contract chaining.
 */

import Decimal from 'decimal.js';

// ============================================================================
// Enums
// ============================================================================

export type CapitalizationMode = 'MONTHLY' | 'DAILY';
export type AmortizationSystem = 'SAC' | 'PRICE' | 'SACRE' | 'GAUSS_SIMPLE';
export type FineBaseType = 'PRINCIPAL' | 'TOTAL_INSTALLMENT';
export type CalculationModule = 'EMPRESTIMO' | 'IMOBILIARIO' | 'CARTAO_RMC';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'RENEGOTIATED';
export type AbuseClassification = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

// ============================================================================
// Payment Reconciliation
// ============================================================================

export interface PaymentReconciliationEntry {
    n: number;                      // Installment number
    due_date: string;               // Original due date (YYYY-MM-DD)
    contract_value: Decimal;        // Expected value per contract
    paid_date?: string;             // Actual payment date
    paid_value?: Decimal;           // Actual paid value
    extra_amortization?: Decimal;   // Additional amortization (e.g., FGTS)
    status: PaymentStatus;
}

// ============================================================================
// Calculation Input (from database)
// ============================================================================

export interface CalculationInputV3 {
    id: string;
    calculation_id: string;

    // Financial data
    amount_financed: Decimal;
    start_date: string;
    first_payment_date: string;
    total_installments: number;

    // Rates
    contract_rate_monthly: Decimal;
    contract_rate_yearly: Decimal;
    market_rate_monthly?: Decimal;

    // v3.0 Configuration
    capitalization_mode: CapitalizationMode;
    amortization_method: AmortizationSystem;
    use_bacen_average: boolean;
    use_simple_interest: boolean;
    abuse_threshold: Decimal;

    // Default configuration
    default_fine_percent: Decimal;
    default_interest_percent: Decimal;
    default_fine_base: FineBaseType;

    // Flexible JSONB
    specific_data: Record<string, unknown>;
    payment_reconciliation: PaymentReconciliationEntry[];

    // Double refund
    double_refund: boolean;
    exclude_tariffs: boolean;
}

// ============================================================================
// Specific Data Types per Module
// ============================================================================

export interface EmprestimoSpecificData {
    loan_type: 'PESSOAL' | 'CONSIGNADO' | 'CAPITAL_GIRO' | 'VEICULO' | 'OUTRO';
    tac?: Decimal;
    tec?: Decimal;
    iof_value?: Decimal;
    insurance_prestamista?: Decimal;
    insurance_protection?: Decimal;
    other_tariffs?: Array<{ name: string; value: Decimal; }>;
}

export interface ImobiliarioSpecificData {
    indexer: 'TR' | 'IPCA' | 'INPC' | 'IGPM';
    insurance_mip?: Decimal;      // Morte e Invalidez Permanente
    insurance_dfi?: Decimal;      // Danos Físicos ao Imóvel
    admin_fee?: Decimal;          // Taxa administrativa mensal
    property_value?: Decimal;
}

export interface CartaoRMCSpecificData {
    credit_limit?: Decimal;
    revolving_rate?: Decimal;
    installment_rate?: Decimal;
    annual_fee?: Decimal;
    insurance?: Decimal;
}

// ============================================================================
// Amortization Line
// ============================================================================

export interface AmortizationLineV3 {
    n: number;                      // Installment number
    date: string;                   // Due date

    // Calculation components
    opening_balance: Decimal;       // Balance at start of period
    monetary_correction?: Decimal;  // TR/IPCA/INPC correction
    corrected_balance?: Decimal;    // Balance after correction
    interest: Decimal;              // Interest for the period
    amortization: Decimal;          // Principal reduction
    closing_balance: Decimal;       // Balance at end of period

    // Installment components
    installment_value: Decimal;     // Base installment
    insurance?: Decimal;            // MIP + DFI or Prestamista
    admin_fee?: Decimal;            // Administrative fees
    total_installment: Decimal;     // Total to pay

    // For comparisons
    market_interest?: Decimal;      // Interest using market rate
    market_installment?: Decimal;   // Installment using market rate
    difference?: Decimal;           // Difference (charged - due)

    // Reconciliation data
    paid_date?: string;
    paid_value?: Decimal;
    extra_amortization?: Decimal;
    payment_status: PaymentStatus;
}

// ============================================================================
// Scenario Results (AP01, AP02, etc.)
// ============================================================================

export interface ScenarioTotals {
    principal: Decimal;
    total_interest: Decimal;
    total_insurance: Decimal;
    total_fees: Decimal;
    total_paid: Decimal;
    total_due?: Decimal;
    total_refund?: Decimal;
}

export interface ScenarioResult {
    type: string;                   // 'AP01', 'AP02', etc.
    description: string;            // Human-readable description
    table: AmortizationLineV3[];    // Amortization table
    totals: ScenarioTotals;
}

// ============================================================================
// Calculation Result
// ============================================================================

export interface CalculationPreviewResult {
    is_viable: boolean;
    abuse_classification: AbuseClassification;

    // Key metrics
    contract_rate_monthly: Decimal;
    market_rate_monthly: Decimal;
    excess_rate_pp: Decimal;        // Excess in percentage points
    excess_rate_percent: Decimal;   // Excess as percentage of market rate

    // Installment comparison
    original_installment: Decimal;
    recalculated_installment: Decimal;
    savings_per_installment: Decimal;

    // Totals
    estimated_total_savings: Decimal;
    estimated_refund_simple: Decimal;
    estimated_refund_double: Decimal;

    // Flags
    flags: {
        daily_capitalization_detected: boolean;
        abusive_insurance: boolean;
        illegal_rate: boolean;
        tac_tec_irregular: boolean;
        anatocism_detected: boolean;
    };
}

export interface CalculationFullResult {
    preview: CalculationPreviewResult;

    // Scenarios
    scenarios: {
        ap01?: ScenarioResult;  // Evolution Original (Bank Scenario)
        ap02?: ScenarioResult;  // Evolution Recalculated
        ap03?: ScenarioResult;  // Differences
        ap04?: ScenarioResult;  // New Flow (Double)
        ap05?: ScenarioResult;  // New Flow (Simple) or Monetary Correction
        ap06?: ScenarioResult;  // Consolidation (Double)
        ap07?: ScenarioResult;  // Consolidation (Simple)
    };

    // Audit snapshot
    rates_snapshot: {
        series_id: string;
        rate_value: Decimal;
        reference_date: string;
        fetched_at: string;
    };

    // Execution metadata
    execution_time_ms: number;
    calculated_at: string;
}

// ============================================================================
// Strategy Interface
// ============================================================================

export interface ICalculationStrategy {
    /**
     * Quick analysis for viability check (< 5 seconds)
     */
    calculatePreview(input: CalculationInputV3): Promise<CalculationPreviewResult>;

    /**
     * Full calculation with all scenarios
     */
    calculateFull(input: CalculationInputV3): Promise<CalculationFullResult>;

    /**
     * Recalculate after payment reconciliation changes
     */
    recalculateFromInstallment(
        input: CalculationInputV3,
        result: CalculationFullResult,
        fromInstallment: number
    ): Promise<CalculationFullResult>;
}

// ============================================================================
// Factory Interface
// ============================================================================

export interface ICalculationFactory {
    create(module: CalculationModule): ICalculationStrategy;
}
