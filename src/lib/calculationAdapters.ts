/**
 * Calculation Adapters
 * 
 * Converts between Frontend wizard data and Backend API types.
 */

import type { WizardData, WizardCompleteResult } from '@/components/calculations/wizard';
import type { CreateCalculationRequest } from '@/services/calculationAPI.service';
import type { ResultsDashboardData, KPIData, EvolutionDataPoint } from '@/components/calculations/results';
import type { PaymentRow } from '@/components/calculations/reconciliation/PaymentReconciliationGrid';
import type { LaudoExportData } from '@/services/laudoExport.service';
import type {
    CalculationInputV3,
    CalculationModule,
    CalculationPreviewResult,
    CalculationFullResult,
    AmortizationLineV3,
} from '@/services/calculationEngine/types';

// Re-export types for convenience
export type { KPIData, EvolutionDataPoint };

// ============================================================================
// Wizard → Backend Adapters
// ============================================================================

/**
 * Map frontend contract type to backend module
 */
export function mapTipoContratoToModule(tipo: string): CalculationModule {
    const emprestimosTypes = [
        'PESSOAL', 'CONSIGNADO_PRIVADO', 'CONSIGNADO_PUBLICO',
        'CONSIGNADO_INSS', 'CAPITAL_GIRO', 'VEICULO', 'CHEQUE_ESPECIAL'
    ];

    if (emprestimosTypes.includes(tipo)) {
        return 'EMPRESTIMO';
    }

    if (tipo.includes('IMOBILIARIO') || tipo.includes('CASA') || tipo.includes('SFH')) {
        return 'IMOBILIARIO';
    }

    if (tipo.includes('CARTAO') || tipo.includes('RMC')) {
        return 'CARTAO_RMC';
    }

    return 'EMPRESTIMO';
}

/**
 * Convert WizardData to CreateCalculationRequest for API call
 */
export function wizardToRequest(data: WizardData): CreateCalculationRequest {
    const { step1, step2, step3 } = data;

    // Validate required fields
    if (!step1) {
        throw new Error('Dados do contrato (Passo 1) não preenchidos');
    }
    if (!step2) {
        throw new Error('Configuração de taxas (Passo 2) não preenchida');
    }

    // Cast to any for flexible property access across different module types
    const s1 = step1 as any;
    const s2 = step2 as any;

    // Calculate total tariffs to exclude
    const tarifas = step3?.tarifas || [];
    const tarifasToExclude = tarifas
        .filter((t: { expurgar: boolean }) => t.expurgar)
        .reduce((sum: number, t: { valor: number }) => sum + (t.valor || 0), 0);

    // Ensure dates are present, use contract date as fallback for first payment
    const dataContrato = s1.dataContrato || s1.dataInicioAnalise || new Date().toISOString().split('T')[0];
    const dataPrimeiroVencimento = s1.dataPrimeiroVencimento || dataContrato;

    return {
        module: mapTipoContratoToModule(s1.tipoContrato || 'PESSOAL'),

        // Financial data from Step 1
        amount_financed: s1.valorFinanciado || s1.limiteCredito || 0,
        start_date: dataContrato,
        first_payment_date: dataPrimeiroVencimento,
        total_installments: s1.prazoMeses || 12,

        // Rates from Step 2 (convert from percentage to decimal)
        // Note: Different modules have different field names
        // Geral: taxaMensalContrato, taxaAnualContrato
        // Imobiliário: taxaJurosMensal, taxaJurosNominal (annual), taxaJurosEfetiva (CET)
        // Cartão: taxaRotativoMensal, taxaRotativoAnual
        contract_rate_monthly: (s2.taxaMensalContrato || s2.taxaJurosMensal || s2.taxaRotativoMensal || 0) / 100,
        contract_rate_yearly: (s2.taxaAnualContrato || s2.taxaJurosNominal || s2.taxaRotativoAnual || s2.taxaJurosEfetiva || 0) / 100,
        market_rate_monthly: s2.taxaMediaBacen ? s2.taxaMediaBacen / 100 : undefined,

        // Configuration from Step 2
        capitalization_mode: s2.capitalizacao === 'DIARIA' ? 'DAILY' : 'MONTHLY',
        amortization_method: s2.sistemaAmortizacao === 'GAUSS'
            ? 'GAUSS_SIMPLE'
            : (s2.sistemaAmortizacao || s1.sistemaAmortizacao || 'PRICE') as 'SAC' | 'PRICE' | 'SACRE',
        use_bacen_average: s2.usarTaxaBacen || false,
        use_simple_interest: s2.sistemaAmortizacao === 'GAUSS',
        double_refund: s2.repetirEmDobro || false,

        // Specific data from all steps
        specific_data: {
            tipo_emprestimo: s1.tipoContrato || 'PESSOAL',
            credor: typeof s1.credor === 'object' ? s1.credor?.nome || '' : s1.credor || '',
            devedor: typeof s1.devedor === 'object' ? s1.devedor?.nome || '' : s1.devedor || '',
            contrato_num: s1.contratoNum || '',
            tarifas: tarifas,
            tarifas_expurgadas_total: tarifasToExclude,
            multa_percent: step3?.multaPercent || 2,
            mora_percent: step3?.moraPercent || 1,
            base_multa: step3?.baseMulta || 'PRINCIPAL',
            observacoes: step3?.observacoes || '',
        },

        exclude_tariffs: tarifasToExclude > 0,
    };
}

// ============================================================================
// Backend → Frontend Adapters
// ============================================================================

/**
 * Map abuse classification from backend type to frontend union type
 */
function mapAbuseClassification(
    classification: string
): 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' {
    const map: Record<string, 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'> = {
        'NORMAL': 'BAIXA',
        'BAIXA': 'BAIXA',
        'MEDIA': 'MEDIA',
        'MODERADA': 'MEDIA',
        'ALTA': 'ALTA',
        'CRITICA': 'CRITICA',
        'CRITICAL': 'CRITICA',
    };
    return map[classification] || 'MEDIA';
}

/**
 * Convert CalculationPreviewResult to KPIData for dashboard
 */
export function previewToKPIs(preview: CalculationPreviewResult): KPIData {
    return {
        taxaPraticada: preview.contract_rate_monthly.toNumber() * 100,
        taxaMercado: preview.market_rate_monthly.toNumber() * 100,
        economiaTotal: preview.estimated_total_savings.toNumber(),
        parcelaOriginalValor: preview.original_installment.toNumber(),
        novaParcelaValor: preview.recalculated_installment.toNumber(),
        classificacaoAbuso: mapAbuseClassification(preview.abuse_classification),
        restituicaoSimples: preview.estimated_refund_simple.toNumber(),
        restituicaoEmDobro: preview.estimated_refund_double.toNumber(),
    };
}

/**
 * Convert calculation result to evolution data for charts
 * Uses saldoBanco (as expected by EvolutionChart component)
 */
export function resultToEvolution(result: CalculationFullResult): EvolutionDataPoint[] {
    const ap01 = result.scenarios.ap01?.table || [];
    const ap02 = result.scenarios.ap02?.table || [];

    return ap01.map((line: AmortizationLineV3, index: number) => ({
        mes: line.n,
        saldoBanco: line.closing_balance.toNumber(),
        saldoRecalculado: ap02[index]?.closing_balance.toNumber() || 0,
        diferenca: line.closing_balance.minus(ap02[index]?.closing_balance || 0).toNumber(),
    }));
}

/**
 * Full dashboard data combining KPIs and evolution
 */
export interface DashboardData {
    kpis: KPIData;
    evolucao: EvolutionDataPoint[];
    isViable: boolean;
    flags: {
        capitalizacaoDiaria: boolean;
        seguroAbusivo: boolean;
        taxaIlegal: boolean;
        tacTecIrregular: boolean;
    };
}

/**
 * Convert full calculation result to dashboard data
 */
export function resultToDashboard(result: CalculationFullResult): DashboardData {
    return {
        kpis: previewToKPIs(result.preview),
        evolucao: resultToEvolution(result),
        isViable: result.preview.is_viable,
        flags: {
            capitalizacaoDiaria: result.preview.flags.daily_capitalization_detected,
            seguroAbusivo: result.preview.flags.abusive_insurance,
            taxaIlegal: result.preview.flags.illegal_rate,
            tacTecIrregular: result.preview.flags.tac_tec_irregular,
        },
    };
}

// ============================================================================
// ResultsDashboard Adapter
// ============================================================================

/**
 * Convert WizardCompleteResult to ResultsDashboardData for the dashboard component
 */
export function wizardResultToResultsDashboard(
    wizardResult: WizardCompleteResult
): ResultsDashboardData {
    const { wizardData, result } = wizardResult;
    const { step1 } = wizardData;

    // Convert amortization tables to payment rows for reconciliation grid
    // PaymentRow interface expects: n, vencimento, valorContrato, dataPagamentoReal, valorPagoReal, amortizacaoExtra, status, isEdited
    const conciliacao: PaymentRow[] = (result.scenarios.ap01?.table || []).map(
        (line: AmortizationLineV3) => ({
            n: line.n,
            vencimento: line.date,
            valorContrato: line.total_installment.toNumber(),
            dataPagamentoReal: line.date, // Default: mesma data do vencimento
            valorPagoReal: line.total_installment.toNumber(), // Default: valor do contrato
            amortizacaoExtra: 0,
            status: 'EM_ABERTO' as const,
            isEdited: false,
        })
    );

    return {
        kpis: previewToKPIs(result.preview),
        evolucao: resultToEvolution(result),
        conciliacao,
        appendices: {
            ap01: result.scenarios.ap01?.table.map((l: AmortizationLineV3) => ({
                n: l.n,
                vencimento: l.date,
                saldoAnterior: l.opening_balance.toNumber(),
                juros: l.interest.toNumber(),
                amortizacao: l.amortization.toNumber(),
                parcela: l.total_installment.toNumber(),
                saldoDevedor: l.closing_balance.toNumber(),
            })),
            ap02: result.scenarios.ap02?.table.map((l: AmortizationLineV3) => ({
                n: l.n,
                vencimento: l.date,
                saldoAnterior: l.opening_balance.toNumber(),
                juros: l.interest.toNumber(),
                amortizacao: l.amortization.toNumber(),
                parcela: l.total_installment.toNumber(),
                saldoDevedor: l.closing_balance.toNumber(),
            })),
            ap03: result.scenarios.ap03?.table.map((l: AmortizationLineV3) => ({
                n: l.n,
                vencimento: l.date,
                diferencaParcela: l.total_installment.toNumber(),
                diferencaAcumulada: 0,
            })),
            parametros: {
                serieBacen: result.rates_snapshot.series_id,
                taxaUsada: result.rates_snapshot.rate_value.toNumber() * 100,
                dataConsulta: result.rates_snapshot.fetched_at,
                metodologia: step1.tipoContrato,
            },
        },
        cliente: {
            nome: step1.devedor,
            contrato: step1.contratoNum || 'Não informado',
        },
    };
}

// ============================================================================
// Laudo Export Adapter
// ============================================================================

/**
 * Convert calculation result + wizard data to laudo export format
 */
export function resultToLaudoData(
    wizardData: WizardData,
    result: CalculationFullResult
): LaudoExportData {
    const { step1, step2 } = wizardData;

    if (!step1) {
        throw new Error("Dados da Etapa 1 ausentes para geração do laudo.");
    }

    // Type assertion to access common properties safely across union types
    const s1Any = step1 as any;

    return {
        credor: typeof step1.credor === 'object' ? step1.credor?.nome || '' : step1.credor || '',
        devedor: typeof step1.devedor === 'object' ? step1.devedor?.nome || '' : step1.devedor || '',
        contratoNum: s1Any.contratoNum || '',

        kpis: previewToKPIs(result.preview),
        evolucao: resultToEvolution(result),

        parametros: {
            serieBacen: result.rates_snapshot.series_id,
            taxaUsada: result.rates_snapshot.rate_value.toNumber() * 100,
            dataConsulta: result.rates_snapshot.fetched_at,
            metodologia: s1Any.tipoContrato || 'N/A', // tipoContrato might be specific to some types
            sistemaAmortizacao: step2?.sistemaAmortizacao || 'N/A',
            capitalizacao: step2?.capitalizacao || 'MENSAL',
        },

        ap01: result.scenarios.ap01?.table.map((l: AmortizationLineV3) => ({
            n: l.n,
            vencimento: l.date,
            saldoAnterior: l.opening_balance.toNumber(),
            juros: l.interest.toNumber(),
            amortizacao: l.amortization.toNumber(),
            parcela: l.total_installment.toNumber(),
            saldoDevedor: l.closing_balance.toNumber(),
        })),

        ap02: result.scenarios.ap02?.table.map((l: AmortizationLineV3) => ({
            n: l.n,
            vencimento: l.date,
            saldoAnterior: l.opening_balance.toNumber(),
            juros: l.interest.toNumber(),
            amortizacao: l.amortization.toNumber(),
            parcela: l.total_installment.toNumber(),
            saldoDevedor: l.closing_balance.toNumber(),
        })),

        tipo: 'LAUDO_COMPLETO',
    };
}

/**
 * Convert RelatorioCompletoResponse to LaudoExportData
 * Used when valid data is already fetched from server
 */
export function relatorioToLaudoData(
    data: import('@/types/calculation.types').RelatorioCompletoResponse
): LaudoExportData {
    return {
        credor: data.credor,
        devedor: data.devedor,
        contratoNum: data.contratoNum,

        kpis: {
            taxaPraticada: data.comparativo.taxaContratoAM,
            taxaMercado: data.comparativo.taxaMercadoAM,
            economiaTotal: data.cards.totalRestituir, // Usando Restituir como proxy de economia se não tiver campo específico
            parcelaOriginalValor: 0, // Não disponível no payload resumido
            novaParcelaValor: 0,
            classificacaoAbuso: data.comparativo.sobretaxaPP > 2 ? 'ALTA' : 'MEDIA', // Inferência básica
            restituicaoSimples: data.cards.totalRestituir,
            restituicaoEmDobro: data.cards.totalRestituir * 2,
        },

        evolucao: [], // Gráfico não suportado no adapter simples

        parametros: {
            serieBacen: 'N/A', // Não vem no response resumido
            taxaUsada: data.comparativo.taxaMercadoAM,
            dataConsulta: new Date().toISOString(),
            metodologia: data.metodologia,
            sistemaAmortizacao: 'N/A',
            capitalizacao: 'MENSAL',
        },

        // Mapeia tabela existente para AP01 (Cenário Cobrado/Atual)
        ap01: data.tabelaAmortizacao.map(row => ({
            n: row.mes,
            vencimento: row.data,
            saldoAnterior: 0, // Nem sempre disponível
            juros: row.juros,
            amortizacao: row.amortizacao,
            parcela: row.valorOriginalParcela,
            saldoDevedor: row.saldoDevedor
        })),

        tipo: 'LAUDO_COMPLETO'
    };
}
