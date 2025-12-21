/**
 * Calculation API Service
 * 
 * Provides API interface for the v3.0 Calculation Engine.
 * Can be used directly from frontend or deployed as Edge Functions.
 */

import { supabase } from '@/lib/supabase';
import Decimal from 'decimal.js';
import {
    createCalculationStrategy,
    CalculationInputV3,
    CalculationPreviewResult,
    CalculationFullResult,
    CalculationModule,
    PaymentReconciliationEntry,
} from './calculationEngine/index';

// ============================================================================
// Types
// ============================================================================

export interface CreateCalculationRequest {
    module: CalculationModule;

    // Financial data
    amount_financed: number;
    start_date: string;
    first_payment_date: string;
    total_installments: number;

    // Rates
    contract_rate_monthly: number;
    contract_rate_monthly: number;
    contract_rate_yearly: number;
    market_rate_monthly?: number;
    market_rate_monthly?: number;

    // Optional configuration
    capitalization_mode?: 'MONTHLY' | 'DAILY';
    amortization_method?: 'SAC' | 'PRICE' | 'SACRE' | 'GAUSS_SIMPLE';
    use_bacen_average?: boolean;
    use_simple_interest?: boolean;
    double_refund?: boolean;
    exclude_tariffs?: boolean;

    // Module-specific data
    specific_data?: Record<string, unknown>;

    // Payment history for reconciliation
    payment_reconciliation?: PaymentReconciliationEntry[];
}

export interface SaveCalculationRequest {
    calculation_id?: string;  // If updating existing
    client_id?: string;
    module: CalculationModule;
    input: CreateCalculationRequest;
    result: CalculationFullResult;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Calculate Preview - Quick viability check (< 5 seconds)
 * Returns key metrics without full scenario generation
 */
export async function calculatePreview(
    request: CreateCalculationRequest
): Promise<CalculationPreviewResult> {
    const input = convertRequestToInput(request);
    const strategy = createCalculationStrategy(request.module);

    // Determine market rate: explicit > fetched > undefined
    if (request.market_rate_monthly) {
        input.market_rate_monthly = new Decimal(request.market_rate_monthly);
    } else if (request.use_bacen_average !== false) {
        const marketRate = await fetchMarketRate(request.module, request.start_date);
        if (marketRate) {
            input.market_rate_monthly = marketRate;
        }
    }

    return strategy.calculatePreview(input);
}

/**
 * Calculate Full - Complete calculation with all scenarios
 * Returns full amortization tables and appendices
 */
export async function calculateFull(
    request: CreateCalculationRequest
): Promise<CalculationFullResult> {
    const input = convertRequestToInput(request);
    const strategy = createCalculationStrategy(request.module);

    // Determine market rate: explicit > fetched > undefined
    if (request.market_rate_monthly) {
        input.market_rate_monthly = new Decimal(request.market_rate_monthly);
    } else if (request.use_bacen_average !== false) {
        const marketRate = await fetchMarketRate(request.module, request.start_date);
        if (marketRate) {
            input.market_rate_monthly = marketRate;
        }
    }

    return strategy.calculateFull(input);
}

/**
 * Save calculation to database
 */
export async function saveCalculation(
    request: SaveCalculationRequest
): Promise<{ calculation_id: string }> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    if (!userId) {
        throw new Error('User not authenticated');
    }

    // Start transaction
    const { data: calculation, error: calcError } = await supabase
        .from('calculations')
        .upsert({
            id: request.calculation_id,
            user_id: userId,
            client_id: request.client_id,
            calculation_type: request.module.toLowerCase(),
            status: 'completed',
        })
        .select('id')
        .single();

    if (calcError) {
        throw new Error(`Failed to save calculation: ${calcError.message}`);
    }

    // Save inputs
    const { error: inputError } = await supabase
        .from('calculation_inputs')
        .upsert({
            calculation_id: calculation.id,
            amount_financed: request.input.amount_financed,
            start_date: request.input.start_date,
            first_payment_date: request.input.first_payment_date,
            total_installments: request.input.total_installments,
            contract_rate_monthly: request.input.contract_rate_monthly,
            contract_rate_yearly: request.input.contract_rate_yearly,
            capitalization_mode: request.input.capitalization_mode || 'MONTHLY',
            use_simple_interest: request.input.use_simple_interest || false,
            double_refund: request.input.double_refund || false,
            specific_data: request.input.specific_data || {},
            payment_reconciliation: request.input.payment_reconciliation || [],
        });

    if (inputError) {
        throw new Error(`Failed to save inputs: ${inputError.message}`);
    }

    // Save results
    const { error: resultError } = await supabase
        .from('calculation_results')
        .upsert({
            calculation_id: calculation.id,
            total_charged: request.result.scenarios.ap01?.totals.total_paid.toNumber() || 0,
            total_refund_simple: request.result.preview.estimated_refund_simple.toNumber(),
            total_refund_double: request.result.preview.estimated_refund_double.toNumber(),
            abuse_classification: request.result.preview.abuse_classification,
            scenarios: {
                ap01: request.result.scenarios.ap01,
                ap02: request.result.scenarios.ap02,
                ap03: request.result.scenarios.ap03,
                ap04: request.result.scenarios.ap04,
                ap05: request.result.scenarios.ap05,
                ap06: request.result.scenarios.ap06,
                ap07: request.result.scenarios.ap07,
            },
            rates_snapshot: request.result.rates_snapshot,
        });

    if (resultError) {
        throw new Error(`Failed to save results: ${resultError.message}`);
    }

    return { calculation_id: calculation.id };
}

/**
 * Update reconciliation and recalculate from specific installment
 */
export async function syncReconciliation(
    calculationId: string,
    reconciliation: PaymentReconciliationEntry[],
    fromInstallment?: number
): Promise<CalculationFullResult> {
    // Get existing calculation
    const { data: calcData, error: fetchError } = await supabase
        .from('calculations')
        .select(`
      id,
      calculation_type,
      calculation_inputs(*),
      calculation_results(*)
    `)
        .eq('id', calculationId)
        .single();

    if (fetchError || !calcData) {
        throw new Error(`Calculation not found: ${fetchError?.message}`);
    }

    // Update reconciliation in inputs
    const { error: updateError } = await supabase
        .from('calculation_inputs')
        .update({ payment_reconciliation: reconciliation })
        .eq('calculation_id', calculationId);

    if (updateError) {
        throw new Error(`Failed to update reconciliation: ${updateError.message}`);
    }

    // Recalculate
    const input = convertDbToInput(calcData);
    input.payment_reconciliation = reconciliation.map(r => ({
        ...r,
        contract_value: new Decimal(r.contract_value || 0),
        paid_value: r.paid_value ? new Decimal(r.paid_value) : undefined,
        extra_amortization: r.extra_amortization ? new Decimal(r.extra_amortization) : undefined,
    }));

    const strategy = createCalculationStrategy(
        calcData.calculation_type.toUpperCase() as CalculationModule
    );

    // Use optimized recalculation if from_installment provided
    if (fromInstallment && calcData.calculation_results?.[0]) {
        const previousResult = calcData.calculation_results[0];
        return strategy.recalculateFromInstallment(
            input,
            previousResult as unknown as CalculationFullResult,
            fromInstallment
        );
    }

    return strategy.calculateFull(input);
}

/**
 * Sync Bacen rates - Called daily by cron
 */
export async function syncBacenRates(): Promise<{ synced_count: number }> {
    const BACEN_API_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

    // Series to sync
    const series = [
        { id: '432', name: 'Aquisição de imóveis - Não referenciadas' },
        { id: '25471', name: 'Empréstimo consignado - INSS' },
        { id: '20714', name: 'Empréstimo pessoal não consignado' },
    ];

    let syncedCount = 0;

    for (const serie of series) {
        try {
            // Fetch last 24 months
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 24);

            const formatDate = (d: Date) =>
                `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

            const url = `${BACEN_API_URL}.${serie.id}/dados?formato=json&dataInicial=${formatDate(startDate)}&dataFinal=${formatDate(endDate)}`;

            const response = await fetch(url);
            if (!response.ok) continue;

            const data = await response.json();

            // Upsert into taxas_bacen_historico
            for (const item of data) {
                const [day, month, year] = item.data.split('/');
                const anoMes = `${year}-${month}`;
                const taxaMensal = parseFloat(item.valor) / 100;
                const taxaAnual = Math.pow(1 + taxaMensal, 12) - 1;

                const { error } = await supabase
                    .from('taxas_bacen_historico')
                    .upsert({
                        ano_mes: anoMes,
                        ano: parseInt(year),
                        mes: parseInt(month),
                        taxa_mensal_percent: parseFloat(item.valor),
                        taxa_mensal_decimal: taxaMensal,
                        taxa_anual_decimal: taxaAnual,
                        serie_bacen: serie.id,
                        modalidade: serie.name,
                        data_atualizacao: new Date().toISOString(),
                    }, {
                        onConflict: 'ano_mes',
                    });

                if (!error) syncedCount++;
            }
        } catch (err) {
            console.error(`Failed to sync serie ${serie.id}:`, err);
        }
    }

    return { synced_count: syncedCount };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch market rate from cache or Edge Function
 */
async function fetchMarketRate(
    module: CalculationModule,
    contractDate: string
): Promise<Decimal | null> {
    // Parse date: expects YYYY-MM-DD or YYYY-MM format
    const parts = contractDate.split('-');
    const ano = parseInt(parts[0]);
    const mes = parseInt(parts[1]);

    // Determine series based on module
    // 432: Taxa de juros - Pessoa física - Aquisição de imóveis - Taxas de mercado (Imobiliário)
    // 25471: Taxa média de juros - Pessoas físicas - Crédito pessoal consignado INSS - Total (Geral/Consignado)
    // 20749: Taxa média de juros - Pessoas físicas - Aquisição de veículos (Geral/Veículos)
    // 25464: Capital de Giro (PJ)

    let serieBacen = '432'; // Default: Imobiliário
    if (module === 'EMPRESTIMO') {
        serieBacen = '25471';
    } else if (module === 'CARTAO_RMC') {
        serieBacen = '25471';
    }

    try {
        // 1. Try Local Cache First - query by ano and mes columns
        const { data, error } = await supabase
            .from('taxas_bacen_historico')
            .select('taxa_mensal_decimal')
            .eq('ano', ano)
            .eq('mes', mes)
            .eq('serie_bacen', serieBacen)
            .maybeSingle();

        if (data && !error) {
            return new Decimal(data.taxa_mensal_decimal);
        }

        // 2. Local Cache Miss - Call Edge Function
        const { data: funcData, error: funcError } = await supabase.functions.invoke('buscar-taxa-bacen', {
            body: {
                dataContrato: contractDate,
                codigoSerie: serieBacen
            }
        });

        if (funcError || !funcData || !funcData.success) {
            console.warn('Edge Function fetch failed:', funcError || funcData?.error);
            // Fallback: get latest available in local DB as last resort
            const { data: latestData } = await supabase
                .from('taxas_bacen_historico')
                .select('taxa_mensal_decimal')
                .eq('serie_bacen', serieBacen)
                .order('ano', { ascending: false })
                .order('mes', { ascending: false })
                .limit(1)
                .maybeSingle();

            return latestData ? new Decimal(latestData.taxa_mensal_decimal) : null;
        }

        return new Decimal(funcData.taxaMediaMensal);

    } catch (err) {
        console.error('Error in fetchMarketRate:', err);
        return null;
    }
}

/**
 * Convert API request to engine input
 */
function convertRequestToInput(request: CreateCalculationRequest): CalculationInputV3 {
    return {
        id: crypto.randomUUID(),
        calculation_id: '',

        amount_financed: new Decimal(request.amount_financed),
        start_date: request.start_date,
        first_payment_date: request.first_payment_date,
        total_installments: request.total_installments,

        contract_rate_monthly: new Decimal(request.contract_rate_monthly),
        contract_rate_yearly: new Decimal(request.contract_rate_yearly),
        market_rate_monthly: undefined,

        capitalization_mode: request.capitalization_mode || 'MONTHLY',
        amortization_method: request.amortization_method || 'PRICE',
        use_bacen_average: request.use_bacen_average !== false,
        use_simple_interest: request.use_simple_interest || false,
        abuse_threshold: new Decimal(1.5),

        default_fine_percent: new Decimal(0.02),
        default_interest_percent: new Decimal(0.01),
        default_fine_base: 'PRINCIPAL',

        specific_data: request.specific_data || {},
        payment_reconciliation: (request.payment_reconciliation || []).map(p => ({
            ...p,
            contract_value: new Decimal(p.contract_value || 0),
            paid_value: p.paid_value ? new Decimal(p.paid_value) : undefined,
            extra_amortization: p.extra_amortization ? new Decimal(p.extra_amortization) : undefined,
        })),

        double_refund: request.double_refund || false,
        exclude_tariffs: request.exclude_tariffs || false,
    };
}

/**
 * Convert database record to engine input
 */
function convertDbToInput(dbRecord: any): CalculationInputV3 {
    const input = dbRecord.calculation_inputs[0];

    return {
        id: input.id,
        calculation_id: dbRecord.id,

        amount_financed: new Decimal(input.amount_financed || 0),
        start_date: input.start_date,
        first_payment_date: input.first_payment_date,
        total_installments: input.total_installments,

        contract_rate_monthly: new Decimal(input.contract_rate_monthly || 0),
        contract_rate_yearly: new Decimal(input.contract_rate_yearly || 0),
        market_rate_monthly: undefined,

        capitalization_mode: input.capitalization_mode || 'MONTHLY',
        amortization_method: input.amortization_method || 'PRICE',
        use_bacen_average: input.use_bacen_average ?? true,
        use_simple_interest: input.use_simple_interest || false,
        abuse_threshold: new Decimal(input.abuse_threshold || 1.5),

        default_fine_percent: new Decimal(input.default_fine_percent || 0.02),
        default_interest_percent: new Decimal(input.default_interest_percent || 0.01),
        default_fine_base: input.default_fine_base || 'PRINCIPAL',

        specific_data: input.specific_data || {},
        payment_reconciliation: [],

        double_refund: input.double_refund || false,
        exclude_tariffs: input.exclude_tariffs || false,
    };
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const calculationAPI = {
    calculatePreview,
    calculateFull,
    saveCalculation,
    syncReconciliation,
    syncBacenRates,
    getBacenRate: fetchMarketRate,
};
