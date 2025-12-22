/**
 * Utilitários para cálculos financeiros e análise prévia
 */

/**
 * Calcula a prestação fixa (Tabela Price) - Fórmula PMT
 * @param principal Valor presente (PV)
 * @param rate Taxa de juros mensal (em decimal, ex: 0.01 para 1%)
 * @param months Número de meses (n)
 * @returns Valor da prestação
 */
export function calculatePMT(principal: number, rate: number, months: number): number {
    if (rate <= 0) return principal / months;
    return principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
}

/**
 * Calcula a primeira prestação (Sistema SAC)
 * @param principal Valor presente (PV)
 * @param rate Taxa de juros mensal (em decimal)
 * @param months Número de meses (n)
 * @returns Valor da primeira prestação
 */
export function calculateSACFirstInstallment(principal: number, rate: number, months: number): number {
    const amortizacao = principal / months;
    const juros = principal * rate;
    return amortizacao + juros;
}

/**
 * Calcula o total de juros pagos no Sistema SAC
 * Fórmula: Juros Total = (n+1)/2 * P * i
 * Onde: n = prazo, P = principal, i = taxa mensal
 */
export function calculateSACTotalInterest(principal: number, rate: number, months: number): number {
    // Em SAC, os juros diminuem porque o saldo devedor diminui linearmente
    // Juros total = soma de (Saldo Devedor mensal * taxa)
    // = P*i + (P - P/n)*i + (P - 2*P/n)*i + ... 
    // = i * [P + (P - P/n) + (P - 2*P/n) + ... + P/n]
    // = i * P * [1 + (1 - 1/n) + (1 - 2/n) + ... + 1/n]
    // = i * P * n * (1 + 1/n) / 2
    // = i * P * (n + 1) / 2
    return rate * principal * (months + 1) / 2;
}

/**
 * Calcula o total de juros pagos na Tabela Price
 * Fórmula: Juros Total = (PMT * n) - P
 */
export function calculatePRICETotalInterest(principal: number, rate: number, months: number): number {
    const pmt = calculatePMT(principal, rate, months);
    return (pmt * months) - principal;
}

/**
 * Calcula o total pago em um financiamento
 */
export function calculateTotalPaid(principal: number, rate: number, months: number, sistema: 'SAC' | 'PRICE'): number {
    if (sistema === 'SAC') {
        return principal + calculateSACTotalInterest(principal, rate, months);
    } else {
        return principal + calculatePRICETotalInterest(principal, rate, months);
    }
}

/**
 * Calculal a economia real comparando dois cenários
 * @param principal Valor financiado
 * @param taxaContrato Taxa mensal do contrato (em percentual, ex: 2 para 2%)
 * @param taxaMercado Taxa média de mercado (em percentual, ex: 0.95 para 0.95%)
 * @param months Prazo em meses
 * @param sistema Sistema de amortização
 * @returns Economia estimada (diferença entre total pago cobrado vs devido)
 */
export function calculateEconomia(
    principal: number,
    taxaContrato: number, // percentual
    taxaMercado: number,  // percentual
    months: number,
    sistema: 'SAC' | 'PRICE'
): number {
    if (taxaContrato <= taxaMercado) {
        // Contrato já está igual ou abaixo do mercado
        return 0;
    }

    const rateContrato = taxaContrato / 100;
    const rateMercado = taxaMercado / 100;

    const totalCobrado = calculateTotalPaid(principal, rateContrato, months, sistema);
    const totalDevido = calculateTotalPaid(principal, rateMercado, months, sistema);

    return totalCobrado - totalDevido;
}

// ============================================================================
// FUNÇÕES ADICIONAIS PARA MÓDULO GERAL
// ============================================================================

// Precisão: 8 casas decimais para motor de cálculo (à prova de contestações)
const CALC_PRECISION = 8;

/**
 * Arredonda para precisão do motor de cálculo (8 decimais)
 */
export function roundToCalcPrecision(value: number): number {
    const factor = Math.pow(10, CALC_PRECISION);
    return Math.round(value * factor) / factor;
}

/**
 * Arredonda para precisão de exibição (4 decimais)
 */
export function roundToDisplayPrecision(value: number): number {
    return Math.round(value * 10000) / 10000;
}

// ============================================================================
// XTIR - TAXA INTERNA DE RETORNO COM DATAS (Newton-Raphson)
// ============================================================================

/**
 * Interface para fluxo de caixa com data
 */
export interface CashFlow {
    date: Date | string;
    value: number; // negativo para saída (empréstimo), positivo para entrada (prestação)
}

/**
 * Calcula o Valor Presente Líquido (VPL) para uma taxa e fluxo de caixa com datas
 * Fórmula: VPL = Σ (CFi / (1 + r)^((di - d0)/365))
 * 
 * @param cashFlows Array de fluxos de caixa com datas
 * @param rate Taxa anual em decimal (ex: 0.30 para 30%)
 * @returns Valor Presente Líquido
 */
export function calculateNPV(cashFlows: CashFlow[], rate: number): number {
    if (cashFlows.length === 0) return 0;

    const baseDate = new Date(cashFlows[0].date);
    let npv = 0;

    for (const cf of cashFlows) {
        const cfDate = new Date(cf.date);
        const days = (cfDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
        const years = days / 365;
        const discountFactor = Math.pow(1 + rate, years);
        npv += cf.value / discountFactor;
    }

    return roundToCalcPrecision(npv);
}

/**
 * Calcula a derivada do VPL em relação à taxa (para Newton-Raphson)
 */
function calculateNPVDerivative(cashFlows: CashFlow[], rate: number): number {
    if (cashFlows.length === 0) return 0;

    const baseDate = new Date(cashFlows[0].date);
    let derivative = 0;

    for (const cf of cashFlows) {
        const cfDate = new Date(cf.date);
        const days = (cfDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
        const years = days / 365;
        const discountFactor = Math.pow(1 + rate, years);
        // d/dr [CF/(1+r)^t] = -t * CF / (1+r)^(t+1)
        derivative -= years * cf.value / (discountFactor * (1 + rate));
    }

    return derivative;
}

/**
 * Calcula XTIR (Taxa Interna de Retorno com datas exatas) usando Newton-Raphson
 * Equivalente à função XTIR/XIRR do Excel
 * 
 * @param cashFlows Array de fluxos de caixa com datas e valores
 * @param guess Chute inicial para taxa anual (default: 0.10 = 10%)
 * @param maxIterations Máximo de iterações (default: 100)
 * @param tolerance Tolerância para convergência (default: 1e-10)
 * @returns Taxa anual em decimal (ex: 0.3456 para 34.56% a.a.) ou null se não convergir
 */
export function calculateXTIR(
    cashFlows: CashFlow[],
    guess: number = 0.10,
    maxIterations: number = 100,
    tolerance: number = 1e-10
): number | null {
    if (cashFlows.length < 2) return null;

    // Verificar se há pelo menos uma saída e uma entrada
    const hasOutflow = cashFlows.some(cf => cf.value < 0);
    const hasInflow = cashFlows.some(cf => cf.value > 0);
    if (!hasOutflow || !hasInflow) return null;

    let rate = guess;

    for (let i = 0; i < maxIterations; i++) {
        const npv = calculateNPV(cashFlows, rate);
        const derivative = calculateNPVDerivative(cashFlows, rate);

        if (Math.abs(derivative) < 1e-15) {
            // Derivada muito pequena, evitar divisão por zero
            break;
        }

        const newRate = rate - npv / derivative;

        if (Math.abs(newRate - rate) < tolerance) {
            return roundToCalcPrecision(newRate);
        }

        rate = newRate;

        // Limitar taxa a valores razoáveis (-0.99 a 10 = -99% a 1000%)
        if (rate < -0.99) rate = -0.99;
        if (rate > 10) rate = 10;
    }

    // Se não convergiu, retorna o último valor
    return roundToCalcPrecision(rate);
}

/**
 * Converte taxa anual para mensal (capitalização composta)
 * Fórmula: im = (1 + ia)^(1/12) - 1
 */
export function annualToMonthlyRate(annualRate: number): number {
    return roundToCalcPrecision(Math.pow(1 + annualRate, 1 / 12) - 1);
}

/**
 * Converte taxa mensal para anual (capitalização composta)
 * Fórmula: ia = (1 + im)^12 - 1
 */
export function monthlyToAnnualRate(monthlyRate: number): number {
    return roundToCalcPrecision(Math.pow(1 + monthlyRate, 12) - 1);
}

// ============================================================================
// CÁLCULO REVERSO DE TAXA (A partir da prestação)
// ============================================================================

/**
 * Calcula a taxa mensal implícita a partir do PMT conhecido (Bissecção)
 * Útil para descobrir a taxa real aplicada pelo banco
 * 
 * @param principal Valor financiado
 * @param pmt Valor da prestação conhecida
 * @param months Prazo em meses
 * @returns Taxa mensal em decimal (ex: 0.02 para 2%)
 */
export function calculateImpliedRate(
    principal: number,
    pmt: number,
    months: number
): number {
    if (pmt <= 0 || principal <= 0 || months <= 0) return 0;

    // Se PMT = principal/n, taxa é zero
    const pmtZero = principal / months;
    if (Math.abs(pmt - pmtZero) < 0.01) return 0;

    // Bissecção para encontrar taxa
    let low = 0.0001;  // 0.01%
    let high = 0.50;   // 50% a.m.
    let mid = 0;

    for (let i = 0; i < 100; i++) {
        mid = (low + high) / 2;
        const calculatedPmt = calculatePMT(principal, mid, months);

        if (Math.abs(calculatedPmt - pmt) < 0.01) {
            return roundToCalcPrecision(mid);
        }

        if (calculatedPmt < pmt) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return roundToCalcPrecision(mid);
}

// ============================================================================
// DETECÇÃO DE CAPITALIZAÇÃO DIÁRIA
// ============================================================================

/**
 * Resultado da detecção de capitalização diária
 */
export interface DailyCapitalizationResult {
    detected: boolean;           // Se foi detectada capitalização diária
    taxaXTIR_mensal: number;     // Taxa descoberta via XTIR (% mensal)
    taxaPactuada_mensal: number; // Taxa informada no contrato (% mensal)
    taxaImplicita_mensal: number; // Taxa descoberta via cálculo reverso (% mensal)
    metodoDeteccao: 'XTIR' | 'REVERSO' | 'NENHUM';
    evidencia: string;           // Explicação da detecção
}

/**
 * Detecta se o banco utilizou capitalização diária (série não periódica)
 * disfarçada de capitalização mensal
 * 
 * Regra: Se a taxa XTIR (convertida para mensal) coincide exatamente com 
 * a taxa pactuada, confirma-se capitalização diária
 * 
 * @param valorFinanciado Valor do empréstimo
 * @param valorPrestacao Valor da parcela mensal
 * @param taxaPactuadaMensal Taxa informada no contrato (% mensal, ex: 2.0 para 2%)
 * @param prazoMeses Prazo em meses
 * @param dataLiberacao Data de liberação do crédito (YYYY-MM-DD)
 * @param dataPrimeiroVencimento Data do primeiro vencimento (YYYY-MM-DD)
 * @returns Resultado da análise de capitalização
 */
export function detectDailyCapitalization(
    valorFinanciado: number,
    valorPrestacao: number,
    taxaPactuadaMensal: number,
    prazoMeses: number,
    dataLiberacao: string,
    dataPrimeiroVencimento: string
): DailyCapitalizationResult {
    // Converter taxa pactuada para decimal
    const taxaPactuadaDecimal = taxaPactuadaMensal / 100;

    // 1. Calcular taxa implícita via cálculo reverso (tabela price simples)
    const taxaImplicitaDecimal = calculateImpliedRate(valorFinanciado, valorPrestacao, prazoMeses);
    const taxaImplicitaPercent = roundToDisplayPrecision(taxaImplicitaDecimal * 100);

    // 2. Montar fluxo de caixa com datas exatas para XTIR
    const cashFlows: CashFlow[] = [];

    // Saída inicial (negativo)
    const libDate = new Date(dataLiberacao);
    cashFlows.push({ date: libDate, value: -valorFinanciado });

    // Entradas (prestações mensais)
    const primVenc = new Date(dataPrimeiroVencimento);
    for (let i = 0; i < prazoMeses; i++) {
        const vencDate = new Date(primVenc);
        vencDate.setMonth(vencDate.getMonth() + i);
        cashFlows.push({ date: vencDate, value: valorPrestacao });
    }

    // 3. Calcular XTIR (taxa anual com datas)
    const xtirAnual = calculateXTIR(cashFlows);

    if (xtirAnual === null) {
        return {
            detected: false,
            taxaXTIR_mensal: 0,
            taxaPactuada_mensal: taxaPactuadaMensal,
            taxaImplicita_mensal: taxaImplicitaPercent,
            metodoDeteccao: 'NENHUM',
            evidencia: 'Não foi possível calcular XTIR (fluxo inválido)'
        };
    }

    // Converter XTIR anual para mensal
    const xtirMensalDecimal = annualToMonthlyRate(xtirAnual);
    const xtirMensalPercent = roundToDisplayPrecision(xtirMensalDecimal * 100);

    // 4. Verificar "bate exato" - se XTIR coincide com taxa pactuada
    // Tolerância: 4 casas decimais (precisão de exibição)
    const tolerancia = 0.0001; // 0.01% de diferença percentual
    const diferencaXTIR = Math.abs(xtirMensalPercent - taxaPactuadaMensal);
    const diferencaImplicita = Math.abs(taxaImplicitaPercent - taxaPactuadaMensal);

    // Capitalização diária detectada se XTIR bate com pactuada
    // E a taxa implícita (via Price simples) seria diferente
    const xtirBate = diferencaXTIR < tolerancia * 100;
    const implicitaDiferente = diferencaImplicita > tolerancia * 100;

    if (xtirBate) {
        return {
            detected: true,
            taxaXTIR_mensal: xtirMensalPercent,
            taxaPactuada_mensal: taxaPactuadaMensal,
            taxaImplicita_mensal: taxaImplicitaPercent,
            metodoDeteccao: 'XTIR',
            evidencia: `Taxa XTIR ${xtirMensalPercent.toFixed(4)}% a.m. coincide com taxa pactuada ${taxaPactuadaMensal.toFixed(4)}% a.m. → Capitalização diária confirmada.`
        };
    }

    // Se XTIR for superior à taxa pactuada, também indica metodologia mais onerosa
    if (xtirMensalPercent > taxaPactuadaMensal * 1.01) {
        return {
            detected: true,
            taxaXTIR_mensal: xtirMensalPercent,
            taxaPactuada_mensal: taxaPactuadaMensal,
            taxaImplicita_mensal: taxaImplicitaPercent,
            metodoDeteccao: 'XTIR',
            evidencia: `Taxa XTIR ${xtirMensalPercent.toFixed(4)}% a.m. é superior à pactuada ${taxaPactuadaMensal.toFixed(4)}% a.m. → Metodologia mais onerosa aplicada.`
        };
    }

    return {
        detected: false,
        taxaXTIR_mensal: xtirMensalPercent,
        taxaPactuada_mensal: taxaPactuadaMensal,
        taxaImplicita_mensal: taxaImplicitaPercent,
        metodoDeteccao: 'NENHUM',
        evidencia: 'Não foram detectadas evidências de capitalização diária oculta.'
    };
}

/**
 * Calcula taxa equivalente para capitalização diária (série não periódica)
 * Fórmula: [(1+i)^(d/30) - 1]
 * @param taxaMensal Taxa mensal em decimal (ex: 0.02 para 2%)
 * @param dias Número de dias entre vencimentos
 * @returns Taxa proporcional para o período
 */
export function calculateDailyCapitalization(taxaMensal: number, dias: number): number {
    return Math.pow(1 + taxaMensal, dias / 30) - 1;
}

/**
 * Calcula juros de carência quando intervalo entre liberação e 1º vencimento ≠ 30 dias
 * Fórmula: VP × TaxaProporcional
 * @param principal Valor principal
 * @param taxaMensal Taxa mensal em decimal
 * @param diasCarencia Número de dias entre liberação e 1º vencimento
 * @returns Valor dos juros de carência a incorporar ao saldo
 */
export function calculateGracePeriodInterest(
    principal: number,
    taxaMensal: number,
    diasCarencia: number
): number {
    if (diasCarencia <= 0) return 0;
    const taxaProporcional = calculateDailyCapitalization(taxaMensal, diasCarencia);
    return principal * taxaProporcional;
}

/**
 * Calcula dias entre duas datas
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
    // Helper para parsear data no formato DD/MM/YYYY ou YYYY-MM-DD
    const parseDate = (dateInput: string | Date): Date => {
        if (dateInput instanceof Date) return dateInput;

        // Se for formato DD/MM/YYYY, converter para Date
        if (typeof dateInput === 'string' && dateInput.includes('/')) {
            const parts = dateInput.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts.map(Number);
                return new Date(year, month - 1, day); // month é 0-indexed
            }
        }

        // Se for formato YYYY-MM-DD ou ISO, usar diretamente
        return new Date(dateInput);
    };

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    // Validar datas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('[daysBetween] Data inválida:', { startDate, endDate, start, end });
        return 30; // Fallback padrão de 1 mês
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Interface para linha de evolução do saldo devedor
 */
export interface AmortizationRow {
    parcela: number;
    dataVencimento: string;
    saldoAnterior: number;
    juros: number;
    amortizacao: number;
    prestacao: number;
    saldoAtual: number;
}

/**
 * Gera a tabela de evolução do saldo devedor (Tabela Price)
 * @param principal Valor financiado
 * @param taxaMensal Taxa mensal em decimal
 * @param prazoMeses Prazo em meses
 * @param dataInicio Data do primeiro vencimento
 * @returns Array com evolução mês a mês
 */
export function generateAmortizationTablePrice(
    principal: number,
    taxaMensal: number,
    prazoMeses: number,
    dataInicio?: string
): AmortizationRow[] {
    const pmt = calculatePMT(principal, taxaMensal, prazoMeses);
    const tabela: AmortizationRow[] = [];
    let saldoDevedor = principal;

    const startDate = dataInicio ? new Date(dataInicio) : new Date();

    for (let i = 1; i <= prazoMeses; i++) {
        const juros = saldoDevedor * taxaMensal;
        const amortizacao = pmt - juros;
        const saldoAnterior = saldoDevedor;
        saldoDevedor = Math.max(0, saldoDevedor - amortizacao);

        const dataVencimento = new Date(startDate);
        dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));

        tabela.push({
            parcela: i,
            dataVencimento: dataVencimento.toISOString().split('T')[0],
            saldoAnterior: Math.round(saldoAnterior * 100) / 100,
            juros: Math.round(juros * 100) / 100,
            amortizacao: Math.round(amortizacao * 100) / 100,
            prestacao: Math.round(pmt * 100) / 100,
            saldoAtual: Math.round(saldoDevedor * 100) / 100,
        });
    }

    return tabela;
}

/**
 * Gera a tabela de evolução do saldo devedor (SAC)
 */
export function generateAmortizationTableSAC(
    principal: number,
    taxaMensal: number,
    prazoMeses: number,
    dataInicio?: string
): AmortizationRow[] {
    const amortizacaoFixa = principal / prazoMeses;
    const tabela: AmortizationRow[] = [];
    let saldoDevedor = principal;

    const startDate = dataInicio ? new Date(dataInicio) : new Date();

    for (let i = 1; i <= prazoMeses; i++) {
        const juros = saldoDevedor * taxaMensal;
        const prestacao = amortizacaoFixa + juros;
        const saldoAnterior = saldoDevedor;
        saldoDevedor = Math.max(0, saldoDevedor - amortizacaoFixa);

        const dataVencimento = new Date(startDate);
        dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));

        tabela.push({
            parcela: i,
            dataVencimento: dataVencimento.toISOString().split('T')[0],
            saldoAnterior: Math.round(saldoAnterior * 100) / 100,
            juros: Math.round(juros * 100) / 100,
            amortizacao: Math.round(amortizacaoFixa * 100) / 100,
            prestacao: Math.round(prestacao * 100) / 100,
            saldoAtual: Math.round(saldoDevedor * 100) / 100,
        });
    }

    return tabela;
}

/**
 * Calcula o indébito acumulado comparando duas tabelas de amortização
 * @param tabelaCobrado Tabela com valores cobrados pelo banco
 * @param tabelaDevido Tabela com valores que deveriam ter sido cobrados
 * @returns Indébito total (soma das diferenças positivas)
 */
export function calculateIndebito(
    tabelaCobrado: AmortizationRow[],
    tabelaDevido: AmortizationRow[]
): { indebitoMensal: number[]; indebitoTotal: number } {
    const indebitoMensal: number[] = [];
    let indebitoTotal = 0;

    const minLength = Math.min(tabelaCobrado.length, tabelaDevido.length);

    for (let i = 0; i < minLength; i++) {
        const diferenca = tabelaCobrado[i].prestacao - tabelaDevido[i].prestacao;
        const indebito = diferenca > 0 ? diferenca : 0;
        indebitoMensal.push(Math.round(indebito * 100) / 100);
        indebitoTotal += indebito;
    }

    return {
        indebitoMensal,
        indebitoTotal: Math.round(indebitoTotal * 100) / 100,
    };
}

// ============================================================================
// TRACKING DE PAGAMENTOS E MORA
// ============================================================================

/**
 * Interface para registro de pagamento de parcela
 */
export interface PaymentRecord {
    parcela: number;
    valorDevido: number;
    dataVencimento: string;
    status: 'PAGA' | 'ABERTA' | 'ATRASADA' | 'PARCIAL';
    dataPagamento?: string;
    valorPago?: number;
    diasAtraso?: number;
    jurosMora?: number;
    multa?: number;
}

/**
 * Calcula juros de mora para parcelas atrasadas
 * @param valorParcela Valor da parcela em atraso
 * @param diasAtraso Número de dias de atraso
 * @param taxaMoraAnual Taxa de mora anual (padrão 12% a.a. = 1% a.m.)
 * @param multaPercentual Multa por atraso (padrão 2%)
 * @returns Objeto com juros de mora e multa
 */
export function calculateLateFees(
    valorParcela: number,
    diasAtraso: number,
    taxaMoraAnual: number = 12,  // 12% a.a. = 1% a.m.
    multaPercentual: number = 2   // 2% de multa
): { jurosMora: number; multa: number; total: number } {
    if (diasAtraso <= 0) {
        return { jurosMora: 0, multa: 0, total: valorParcela };
    }

    // Juros de mora pro-rata die (taxa anual / 365 * dias)
    const taxaDiaria = taxaMoraAnual / 100 / 365;
    const jurosMora = valorParcela * taxaDiaria * diasAtraso;

    // Multa fixa (aplicada uma vez)
    const multa = valorParcela * (multaPercentual / 100);

    return {
        jurosMora: Math.round(jurosMora * 100) / 100,
        multa: Math.round(multa * 100) / 100,
        total: Math.round((valorParcela + jurosMora + multa) * 100) / 100,
    };
}

/**
 * Processa histórico de pagamentos e calcula situação de cada parcela
 */
export function processPaymentHistory(
    tabelaAmortizacao: AmortizationRow[],
    pagamentos: Array<{ parcela: number; dataPagamento: string; valorPago: number }>,
    taxaMoraAnual: number = 12,
    multaPercentual: number = 2
): PaymentRecord[] {
    const today = new Date();

    return tabelaAmortizacao.map((row) => {
        const pagamento = pagamentos.find((p) => p.parcela === row.parcela);
        const dataVenc = new Date(row.dataVencimento);

        if (pagamento) {
            const dataPag = new Date(pagamento.dataPagamento);
            const diasAtraso = Math.max(0, Math.ceil((dataPag.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24)));
            const fees = calculateLateFees(row.prestacao, diasAtraso, taxaMoraAnual, multaPercentual);

            return {
                parcela: row.parcela,
                valorDevido: row.prestacao,
                dataVencimento: row.dataVencimento,
                status: pagamento.valorPago >= row.prestacao ? 'PAGA' : 'PARCIAL',
                dataPagamento: pagamento.dataPagamento,
                valorPago: pagamento.valorPago,
                diasAtraso,
                jurosMora: fees.jurosMora,
                multa: fees.multa,
            } as PaymentRecord;
        } else {
            // Parcela não paga
            const diasAtraso = Math.max(0, Math.ceil((today.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24)));
            const isAtrasada = today > dataVenc;

            return {
                parcela: row.parcela,
                valorDevido: row.prestacao,
                dataVencimento: row.dataVencimento,
                status: isAtrasada ? 'ATRASADA' : 'ABERTA',
                diasAtraso: isAtrasada ? diasAtraso : 0,
            } as PaymentRecord;
        }
    });
}

// ============================================================================
// CORREÇÃO MONETÁRIA
// ============================================================================

/**
 * Índices de correção monetária suportados
 */
export type IndiceCorrecao = 'INPC' | 'IPCA' | 'IGPM' | 'TR' | 'SELIC';

/**
 * Aplica correção monetária simples sobre um valor
 * @param valor Valor a corrigir
 * @param indiceAcumulado Índice acumulado no período (ex: 0.05 para 5%)
 * @returns Valor corrigido
 */
export function applyMonetaryCorrection(valor: number, indiceAcumulado: number): number {
    return Math.round(valor * (1 + indiceAcumulado) * 100) / 100;
}

/**
 * Calcula indébito corrigido monetariamente
 * @param indebitosMensais Array de valores de indébito mês a mês
 * @param indicesMensais Array de índices mensais de correção
 * @returns Indébito total corrigido
 */
export function calculateCorrectedIndebito(
    indebitosMensais: number[],
    indicesMensais: number[]
): { indebitoCorrigido: number[]; totalCorrigido: number } {
    const indebitoCorrigido: number[] = [];
    let totalCorrigido = 0;

    for (let i = 0; i < indebitosMensais.length; i++) {
        // Acumula índices desde o mês do indébito até hoje
        let fatorCorrecao = 1;
        for (let j = i; j < indicesMensais.length; j++) {
            fatorCorrecao *= (1 + (indicesMensais[j] || 0));
        }

        const valorCorrigido = indebitosMensais[i] * fatorCorrecao;
        indebitoCorrigido.push(Math.round(valorCorrigido * 100) / 100);
        totalCorrigido += valorCorrigido;
    }

    return {
        indebitoCorrigido,
        totalCorrigido: Math.round(totalCorrigido * 100) / 100,
    };
}

/**
 * Calcula restituição em dobro (Art. 42 CDC)
 * @param indebitoTotal Valor total do indébito apurado
 * @returns Valor em dobro para restituição
 */
export function calculateDoubleRestitution(indebitoTotal: number): number {
    return Math.round(indebitoTotal * 2 * 100) / 100;
}

/**
 * Retorna uma taxa de mercado estimada (backup se API falhar)
 * Baseada nas séries 20xxx do BACEN - Taxas de Referência
 * 
 * IMPORTANTE: Estes valores devem ser consistentes com TAXAS_MERCADO_BACEN
 * em taxasMercadoBacen.ts
 */
export function getEstimatedMarketRate(module: 'GERAL' | 'IMOBILIARIO' | 'CARTAO' | 'VEICULOS', date?: string): number {
    // TODO: Idealmente buscar de uma tabela histórica baseada na data

    switch (module) {
        case 'IMOBILIARIO':
            // Série 20773 SFH: ~11.5% a.a. -> 0.91% a.m.
            return 0.91;
        case 'CARTAO':
            // Rotativo cartão - série 25461: muito alto, usar ~4.5% a.m.
            return 4.50;
        case 'VEICULOS':
            // Série 20749: ~22.3% a.a. -> 1.69% a.m.
            return 1.69;
        case 'GERAL':
        default:
            // Série 20718: ~22.52% a.a. -> 1.71% a.m.
            // Este valor deve corresponder ao fallback de TAXAS_MERCADO_BACEN['Pessoal']
            return 1.71;
    }
}

import { supabase } from '@/lib/supabase';

/**
 * Busca a taxa de mercado real via Edge Function (integrada ao Bacen)
 * Retorna null se não encontrar ou erro
 * 
 * Séries BACEN para Imobiliário:
 * - SFH (taxas reguladas): 20773 - Financiamento imobiliário com taxas reguladas
 * - SFI (taxas de mercado): 25497 - Financiamento imobiliário com taxas de mercado
 */
export async function fetchMarketRate(
    module: 'GERAL' | 'VEICULOS' | 'IMOBILIARIO' | 'IMOBILIARIO_SFH' | 'IMOBILIARIO_SFI' | 'CARTAO',
    date: string
): Promise<number | null> {
    let serieCode = 25471; // Default: Crédito Pessoal Total

    // Mapeamento de Séries Bacen (SGS) - TODAS para Pessoas Físicas (PF)
    // 25471: PF - Crédito Total (Recursos Livres)
    // 25478: Cartão de Crédito - Rotativo Total
    // 20742: PF - Crédito Pessoal Não Consignado (CORRETO - ~22% a.a.)
    // 20749: PF - Aquisição de Veículos (Taxa Média ANUAL % a.a.)
    // 20773: PF - Financiamento Imobiliário SFH (Taxas Reguladas - até 12% a.a. + TR)
    // 25497: PF - Financiamento Imobiliário SFI (Taxas de Mercado - livre negociação)
    // NOTA: 20718 é para PJ (Pessoas Jurídicas), NÃO usar para PF!
    switch (module) {
        case 'VEICULOS':
            serieCode = 20749; // Aquisição de Veículos - PF (% a.a.)
            break;
        case 'IMOBILIARIO_SFH':
            serieCode = 20773; // SFH: Taxas reguladas
            break;
        case 'IMOBILIARIO_SFI':
            serieCode = 25497; // SFI: Taxas de mercado
            break;
        case 'IMOBILIARIO':
            serieCode = 20773; // Default para Imobiliário: SFH (mais conservador)
            break;
        case 'CARTAO':
            serieCode = 20739; // Cartão de Crédito Rotativo Total - Anual
            break;
        case 'GERAL':
        default:
            serieCode = 20742; // CORRETO: Crédito Pessoal Não Consignado - PF (~22% a.a.)
            break;
    }


    try {
        console.log(`[Financial] Fetching rate for ${module} (series: ${serieCode}) at ${date}`);
        const { data, error } = await (supabase as any).functions.invoke('buscar-taxa-bacen', {
            body: {
                dataReferencia: date,  // Changed from dataContrato
                codigoSerie: serieCode
            }
        });

        if (error) {
            console.warn('[Financial] Edge Function invoke error:', error.message || error);
            // Fallback to RPC if Edge Function fails
            const rpcResult = await fetchFromRPC(date);
            if (rpcResult !== null) return rpcResult;
            // Use static fallback
            return getStaticFallbackRate(module);
        }

        if (data && data.success && data.taxaMediaMensalPercent) {
            // A Edge Function já retorna a taxa MENSAL corretamente convertida
            // No campo taxaMediaMensalPercent (% a.m.)
            const taxaMensalPercent = Number(data.taxaMediaMensalPercent);
            const taxaAnualPercent = data.taxaMediaAnualPercent ? Number(data.taxaMediaAnualPercent) : 0;

            console.log(`[Financial] BACEN (série ${serieCode}): ${taxaAnualPercent.toFixed(2)}% a.a. → ${taxaMensalPercent.toFixed(4)}% a.m.`);
            return taxaMensalPercent;
        }

        console.warn('[Financial] BACEN data empty or invalid, using fallback');
        return getStaticFallbackRate(module);
    } catch (err) {
        console.warn('[Financial] Error fetching market rate, using fallback:', err);
        return getStaticFallbackRate(module);
    }
}

/**
 * Returns static fallback rate (monthly %) when API calls fail
 */
function getStaticFallbackRate(module: string): number {
    // Taxas médias de mercado (% mensal) - Referência BACEN 2024
    const fallbacks: Record<string, number> = {
        'GERAL': 1.71,        // 22.5% a.a.
        'VEICULOS': 1.69,     // 22.3% a.a.
        'IMOBILIARIO': 0.91,  // 11.5% a.a.
        'IMOBILIARIO_SFH': 0.91,
        'IMOBILIARIO_SFI': 1.05,
        'CARTAO': 4.50,       // 69.6% a.a.
    };
    const rate = fallbacks[module] || 1.71;
    console.log(`[Financial] Using static fallback rate for ${module}: ${rate}% a.m.`);
    return rate;
}

async function fetchFromRPC(date: string): Promise<number | null> {
    try {
        const { data, error } = await (supabase as any).rpc('buscar_taxa_bacen', {
            p_data_contrato: date
        });

        if (error || !data || data.length === 0) return null;

        // RPC returns array of { taxa_mensal_percent: number, ... }
        return Number((data as any)[0].taxa_mensal_percent);
    } catch (e) {
        return null;
    }
}
