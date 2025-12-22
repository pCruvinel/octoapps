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
import type {
    CalculoDetalhadoRequest,
    ModalidadeCredito,
    IndexadorCorrecao,
    TarifaExpurgo,
} from '@/types/calculation.types';

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

/**
 * Map frontend contract type to ModalidadeCredito for SGS series selection
 * Uses schema enum values (tipoContratoGeralEnum)
 */
export function mapTipoContratoToModalidade(tipo: string): ModalidadeCredito {
    const map: Record<string, ModalidadeCredito> = {
        // Schema values (from tipoContratoGeralEnum)
        'FINANCIAMENTO_VEICULO': 'AQUISICAO_VEICULOS_PF',
        'FINANCIAMENTO_VEICULO_PJ': 'AQUISICAO_VEICULOS_PJ',
        'EMPRESTIMO_PESSOAL': 'EMPRESTIMO_PESSOAL',
        'CONSIGNADO_PRIVADO': 'CONSIGNADO_PRIVADO',
        'CONSIGNADO_PUBLICO': 'CONSIGNADO_PUBLICO',
        'CONSIGNADO_INSS': 'CONSIGNADO_INSS',
        'CAPITAL_GIRO': 'CAPITAL_GIRO_ATE_365',
        'CHEQUE_ESPECIAL': 'CHEQUE_ESPECIAL',
        // Legacy/alternative values
        'VEICULO': 'AQUISICAO_VEICULOS_PF',
        'PESSOAL': 'EMPRESTIMO_PESSOAL',
        'CARTAO': 'CARTAO_ROTATIVO',
        'IMOBILIARIO_SFH': 'IMOBILIARIO_SFH',
        'IMOBILIARIO_SFI': 'IMOBILIARIO_SFI',
        'IMOBILIARIO': 'IMOBILIARIO_SFH',
    };
    return map[tipo] || 'EMPRESTIMO_PESSOAL';
}

/**
 * Map frontend indexador string to IndexadorCorrecao enum
 */
export function mapIndexador(indexador?: string): IndexadorCorrecao {
    const map: Record<string, IndexadorCorrecao> = {
        'TR': 'TR',
        'IPCA': 'IPCA',
        'INPC': 'INPC',
        'IGPM': 'IGPM',
        'IGP-M': 'IGPM',
        'NENHUM': 'NENHUM',
    };
    return map[indexador || 'NENHUM'] || 'NENHUM';
}

/**
 * Convert WizardData to CalculoDetalhadoRequest for detailed calculation engine
 * 
 * This adapter creates the request for the detailed pericial calculation,
 * which generates AP01-AP07 appendices with month-by-month evolution.
 */
export function wizardToDetalhadoRequest(data: WizardData): CalculoDetalhadoRequest {
    const { step1, step2, step3 } = data;

    if (!step1) {
        throw new Error('Dados do contrato (Passo 1) não preenchidos');
    }
    if (!step2) {
        throw new Error('Configuração de taxas (Passo 2) não preenchida');
    }

    const s1 = step1 as any;
    const s2 = step2 as any;

    // Convert tarifas to TarifaExpurgo array
    // Support both array format (tarifasArray) and object format (tarifas)
    const tarifasData = step3?.tarifasArray || step3?.tarifas;
    let outrasTarifas: TarifaExpurgo[] = [];

    if (Array.isArray(tarifasData)) {
        outrasTarifas = tarifasData.map((t: any) => ({
            nome: t.nome || t.tipo || 'Tarifa',
            valor: t.valor || 0,
            expurgar: t.expurgar !== false, // default to true
            justificativa: t.justificativa,
        }));
    } else if (tarifasData && typeof tarifasData === 'object') {
        // Convert object format { tac: 500, iof: 200 } to array
        outrasTarifas = Object.entries(tarifasData)
            .filter(([, value]) => value && (value as number) > 0)
            .map(([key, value]) => ({
                nome: key,
                valor: value as number,
                expurgar: true,
                justificativa: undefined,
            }));
    }

    // Determine dates
    const dataContrato = s1.dataContrato || new Date().toISOString().split('T')[0];
    const dataPrimeiroVencimento = s1.dataPrimeiroVencimento || dataContrato;
    const dataLiberacao = s1.dataLiberacao || dataContrato;

    // Convert percentage to decimal for rates
    const taxaMensal = s2.taxaMensalContrato || s2.taxaJurosMensal || 0;
    const taxaAnual = s2.taxaAnualContrato || s2.taxaJurosNominal || 0;

    // Valor da parcela informado pelo cliente (Step1)
    const valorParcela = s1.valorPrestacao || s1.valorParcela || 0;

    return {
        // Identificação
        credor: typeof s1.credor === 'object' ? s1.credor?.nome || '' : s1.credor || '',
        devedor: typeof s1.devedor === 'object' ? s1.devedor?.nome || '' : s1.devedor || '',
        contratoNumero: s1.numeroContrato || s1.contratoNum || '',

        // Dados Financeiros
        valorFinanciado: s1.valorFinanciado || s1.limiteCredito || 0,
        prazoMeses: s1.prazoMeses || 12,
        taxaContratoMensal: taxaMensal, // Keep as percentage
        taxaContratoAnual: taxaAnual,
        valorParcelaCobrada: valorParcela, // Parcela informada pelo cliente

        // Dados de Veículos/Imóveis
        valorBem: s1.valorBem,
        valorEntrada: s1.valorEntrada,
        valorImovel: s1.valorImovel || s1.valorCompraVenda,

        // Datas
        dataContrato,
        dataLiberacao,
        dataPrimeiroVencimento,

        // Sistema e Capitalização
        sistemaAmortizacao: (s2.sistemaAmortizacao || s1.sistemaAmortizacao || 'PRICE') as 'SAC' | 'PRICE' | 'SACRE',
        capitalizacao: s2.capitalizacao === 'DIARIA' ? 'DIARIA' : 'MENSAL',

        // Exclusivos do Detalhado
        modalidade: mapTipoContratoToModalidade(s1.tipoContrato || 'PESSOAL'),
        indexador: mapIndexador(s2.indexador),

        // Seguros (Imobiliário)
        seguroMIP: s2.seguroMIP || s1.seguroMIP,
        seguroMIPTipo: s2.seguroMIPTipo || 'FIXO',
        seguroDFI: s2.seguroDFI || s1.seguroDFI,
        seguroDFITipo: s2.seguroDFITipo || 'FIXO',
        taxaAdministrativa: s2.taxaAdministrativa || s1.taxaAdministrativa,

        // Tarifas (extract from already-converted outrasTarifas array or from object)
        tarifaTAC: outrasTarifas.find(t => t.nome.toLowerCase().includes('tac'))?.valor
            || (typeof step3?.tarifas === 'object' && !Array.isArray(step3?.tarifas) ? step3?.tarifas?.tac : undefined),
        tarifaAvaliacao: outrasTarifas.find(t => t.nome.toLowerCase().includes('avalia'))?.valor
            || (typeof step3?.tarifas === 'object' && !Array.isArray(step3?.tarifas) ? step3?.tarifas?.avaliacao : undefined),
        tarifaRegistro: outrasTarifas.find(t => t.nome.toLowerCase().includes('registro'))?.valor
            || (typeof step3?.tarifas === 'object' && !Array.isArray(step3?.tarifas) ? step3?.tarifas?.registro : undefined),
        outrasTarifas,

        // Overrides (vem do Step3 se houver edição manual)
        overrides: step3?.overrides,

        // Configuração
        usarTaxaBacen: s2.usarTaxaBacen || true,
        usarJurosSimples: s2.sistemaAmortizacao === 'GAUSS',
        expurgarTarifas: outrasTarifas.some(t => t.expurgar),
        restituicaoEmDobro: s2.repetirEmDobro || false,

        // Valor do Imóvel (para DFI percentual)
        valorImovel: s1.valorImovel || s1.valorCompraVenda,
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

// ============================================================================
// Detailed Calculation → ResultsDashboard Adapter
// ============================================================================

/**
 * Convert CalculoDetalhadoResponse to ResultsDashboardData
 * 
 * This adapter allows reusing the existing ResultsDashboard, KPICards,
 * EvolutionChart, and AppendicesTabs components with the new detailed
 * calculation engine output.
 */
export function detalhadoToResultsDashboard(
    result: import('@/types/calculation.types').CalculoDetalhadoResponse,
    request?: import('@/types/calculation.types').CalculoDetalhadoRequest
): ResultsDashboardData {
    const { resumo, apendices, taxaSnapshot } = result;

    // Map KPI data
    // Use valorParcelaCobrada from request if available (user input), otherwise fall back to calculated value
    const parcelaOriginal = request?.valorParcelaCobrada && request.valorParcelaCobrada > 0
        ? request.valorParcelaCobrada
        : apendices.ap01?.tabela?.[0]?.parcelaTotal ?? 0;

    const kpis: KPIData = {
        economiaTotal: resumo.diferencaTotal,
        parcelaOriginalValor: parcelaOriginal,
        novaParcelaValor: apendices.ap02?.tabela?.[0]?.parcelaTotal ?? 0,
        taxaPraticada: resumo.taxaContratoAnual / 12, // Convert to monthly
        taxaMercado: resumo.taxaMercadoAnual / 12,
        restituicaoSimples: resumo.restituicaoSimples,
        restituicaoEmDobro: resumo.restituicaoDobro,
        classificacaoAbuso: resumo.isAbusivo
            ? (resumo.sobretaxaPercent >= 100 ? 'CRITICA' : 'ALTA')
            : (resumo.sobretaxaPercent >= 30 ? 'MEDIA' : 'BAIXA'),
    };

    // Map evolution data from AP01 and AP02 tables
    const evolucao: EvolutionDataPoint[] = (apendices.ap01?.tabela || []).map((linha, index) => ({
        mes: linha.mes,
        saldoBanco: linha.saldoDevedor,
        saldoRecalculado: apendices.ap02?.tabela?.[index]?.saldoDevedor ?? 0,
        diferenca: (apendices.ap03?.tabela?.[index]?.diferenca ?? 0),
    }));

    // Map conciliation data (all rows from AP01)
    const isFixedSystem = request?.sistemaAmortizacao === 'PRICE' || request?.sistemaAmortizacao === 'GAUSS';
    const fixedParcela = request?.valorParcelaCobrada && request.valorParcelaCobrada > 0 ? request.valorParcelaCobrada : null;

    const conciliacao: PaymentRow[] = (apendices.ap01?.tabela || []).map(linha => {
        const valorContrato = (isFixedSystem && fixedParcela) ? fixedParcela : linha.parcelaTotal;
        return {
            n: linha.mes,
            vencimento: linha.data,
            valorContrato: valorContrato,
            dataPagamentoReal: linha.data,
            valorPagoReal: valorContrato, // Default to contract value
            amortizacaoExtra: linha.override?.amortizacaoExtra || 0,
            status: (linha.status === 'PAGO' ? 'PAGO' : 'EM_ABERTO') as 'PAGO' | 'EM_ABERTO' | 'PARCIAL',
            isEdited: !!linha.override,
        };
    });

    // Map appendices
    const appendices = {
        ap01: apendices.ap01?.tabela?.map(l => ({
            n: l.mes,
            vencimento: l.data,
            saldoAnterior: l.saldoAbertura,
            juros: l.juros,
            amortizacao: l.amortizacao,
            parcela: l.parcelaTotal,
            saldoDevedor: l.saldoDevedor,
        })),
        ap02: apendices.ap02?.tabela?.map(l => ({
            n: l.mes,
            vencimento: l.data,
            saldoAnterior: l.saldoAbertura,
            juros: l.juros,
            amortizacao: l.amortizacao,
            parcela: l.parcelaTotal,
            saldoDevedor: l.saldoDevedor,
        })),
        ap03: apendices.ap03?.tabela?.map(l => ({
            n: l.mes,
            vencimento: l.data,
            diferencaParcela: l.diferenca,
            diferencaAcumulada: l.diferencaAcumulada,
        })),
        parametros: {
            serieBacen: taxaSnapshot.serieId,
            taxaUsada: taxaSnapshot.valor,
            dataConsulta: taxaSnapshot.buscadoEm,
            metodologia: request?.sistemaAmortizacao || 'N/A',
        },
    };

    return {
        kpis,
        evolucao,
        conciliacao,
        appendices,
        cliente: {
            nome: request?.devedor || 'Cliente',
            contrato: request?.contratoNumero || 'N/A',
        },
        // Totais for ComparisonSummaryTable
        // Note: resumo.valorTotalPago = AP01 total, resumo.valorTotalDevido = AP02 total
        totais: {
            totalPagoBanco: resumo.valorTotalPago || apendices.ap01?.totais?.totalPago || 0,
            totalJurosBanco: apendices.ap01?.totais?.totalJuros || 0,
            parcelaBanco: parcelaOriginal,
            taxaContrato: resumo.taxaContratoAnual / 12 || 0, // Convert to monthly
            totalPagoRecalculado: resumo.valorTotalDevido || apendices.ap02?.totais?.totalPago || 0,
            totalJurosRecalculado: apendices.ap02?.totais?.totalJuros || 0,
            parcelaRecalculada: apendices.ap02?.tabela?.[0]?.parcelaTotal ?? 0,
            taxaMercado: resumo.taxaMercadoAnual / 12 || 0, // Convert to monthly
            economiaTotal: resumo.diferencaTotal || 0,
            economiaJuros: (apendices.ap01?.totais?.totalJuros || 0) - (apendices.ap02?.totais?.totalJuros || 0),
            economiaParcela: parcelaOriginal - (apendices.ap02?.tabela?.[0]?.parcelaTotal ?? 0),
            sobretaxaPercentual: resumo.sobretaxaPercent || 0,
        },
    };
}
