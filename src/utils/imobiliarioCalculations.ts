import { generateAmortizationTableSAC, generateAmortizationTablePrice, AmortizationRow } from './financialCalculations';

export interface FluxoResumo {
    totalPago: number;
    totalJuros: number;
    primeiraParcela: number;
    ultimaParcela: number;
    parcelaMedia: number;
    tabela: AmortizationRow[];
    diferencaTotal: number;
}

function summarizeTable(tabela: AmortizationRow[]): FluxoResumo {
    const totalPago = tabela.reduce((sum, row) => sum + row.prestacao, 0);
    const totalJuros = tabela.reduce((sum, row) => sum + row.juros, 0);
    const months = tabela.length;

    return {
        totalPago,
        totalJuros,
        primeiraParcela: tabela[0]?.prestacao || 0,
        ultimaParcela: tabela[months - 1]?.prestacao || 0,
        parcelaMedia: months > 0 ? totalPago / months : 0,
        tabela,
        diferencaTotal: 0 // Default, calculated later if needed
    };
}

/**
 * Calcula fluxo de caixa pelo Sistema de Amortização Constante (SAC)
 * Retorna resumo do cenário
 */
export function calcularFluxoSAC(
    principal: number,
    rateDecimal: number,
    months: number,
    label: string
): FluxoResumo {
    const tabela = generateAmortizationTableSAC(principal, rateDecimal, months);
    return summarizeTable(tabela);
}

/**
 * Calcula fluxo de caixa pela Tabela Price (Amortização Francesa)
 * Retorna resumo do cenário
 */
export function calcularFluxoPRICE(
    principal: number,
    rateDecimal: number,
    months: number,
    label: string
): FluxoResumo {
    const tabela = generateAmortizationTablePrice(principal, rateDecimal, months);
    return summarizeTable(tabela);
}

/**
 * Calcula cenário detalhado de Juros Simples (Tese Gauss/MAGIS)
 * Utiliza amortização linear (similar ao SAC) com taxas reduzidas/expurgadas
 */
export function calcularJurosSimplesDetalhado(
    principal: number,
    rateDecimal: number,
    months: number,
    sistemaOriginal: string,
    valorParcelaOriginal: number,
    label: string
): FluxoResumo {
    // Na tese de Juros Simples (Método de Gauss), a amortização é linear.
    // O recálculo comportase como um SAC puro, removendo o anatocismo da Price.
    const tabela = generateAmortizationTableSAC(principal, rateDecimal, months);
    const summary = summarizeTable(tabela);

    // Calcular diferença total estimada
    // Comparando o total pago neste cenário vs o total pago estimado original
    // Nota: valorParcelaOriginal é apenas uma referência. 
    // Se o sistema original for SAC, o valorParcelaOriginal é apenas a primeira ou atual.
    // Se for Price, é constante.

    let totalOriginalEstimado = 0;
    if (sistemaOriginal === 'PRICE') {
        totalOriginalEstimado = valorParcelaOriginal * months;
    } else {
        // Se era SAC, o "valorParcelaOriginal" passado pelo form é geralmente a parcela ATUAL.
        // Difícil estimar o total sem saber a evolução exata anterior.
        // Vamos assumir projeção linear para fins de estimativa de economia simples
        totalOriginalEstimado = valorParcelaOriginal * months; // Fallback conservador (ou otimista dep. da parcela)
    }

    const diferencaTotal = Math.max(0, totalOriginalEstimado - summary.totalPago);

    return {
        ...summary,
        diferencaTotal
    };
}
