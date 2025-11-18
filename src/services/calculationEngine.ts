/**
 * Motor de Cálculo Revisional SFH/SAC
 *
 * Implementa cálculos de financiamento imobiliário seguindo:
 * - Sistema de Amortização Constante (SAC)
 * - Correção monetária TR
 * - Faixas de taxa por período
 * - Encargos e seguros
 * - Comparativo cobrado vs. devido
 */

import {
  FaixaTaxa,
  TRSerie,
  EncargosMensais,
  LinhaAmortizacao,
  ParametrosSAC,
  ResultadoSAC,
  CenarioAP01,
  CenarioAP05,
  CenarioAP03,
  CalculationError,
} from '@/types/calculation.types';

// ============================================================================
// CONSTANTES
// ============================================================================

const PRECISAO = 1e-8; // Precisão interna dos cálculos
const CASAS_DECIMAIS = 2; // Casas decimais para exibição

// ============================================================================
// UTILITÁRIOS DE DATA
// ============================================================================

/**
 * Gera array de datas mensais a partir da primeira data
 */
export function gerarRangeMensal(primeiroVenc: string, n: number): string[] {
  const datas: string[] = [];
  const [ano, mes, dia] = primeiroVenc.split('-').map(Number);

  for (let i = 0; i < n; i++) {
    const data = new Date(ano, mes - 1 + i, dia);
    const anoStr = data.getFullYear();
    const mesStr = String(data.getMonth() + 1).padStart(2, '0');
    const diaStr = String(data.getDate()).padStart(2, '0');
    datas.push(`${anoStr}-${mesStr}-${diaStr}`);
  }

  return datas;
}

/**
 * Verifica se uma data está dentro de uma faixa
 */
function dataEmFaixa(data: string, ini: string, fim: string): boolean {
  return data >= ini && data <= fim;
}

/**
 * Seleciona a taxa aplicável para uma data específica
 */
function selecionarTaxa(data: string, faixas: FaixaTaxa[]): number {
  for (const faixa of faixas) {
    if (dataEmFaixa(data, faixa.ini, faixa.fim)) {
      return faixa.i;
    }
  }
  throw new CalculationError(
    `Nenhuma faixa de taxa encontrada para a data ${data}`,
    'TAXA_NAO_ENCONTRADA',
    { data, faixas }
  );
}

/**
 * Busca o fator TR para uma data específica
 */
function buscarTR(data: string, trSeries?: TRSerie[]): number {
  if (!trSeries || trSeries.length === 0) {
    return 1; // TR neutra
  }

  const trEncontrada = trSeries.find(tr => tr.data === data);
  return trEncontrada ? trEncontrada.fator : 1;
}

/**
 * Busca encargos para uma data específica
 */
function buscarEncargos(
  data: string,
  encargosMensais?: EncargosMensais[]
): EncargosMensais | null {
  if (!encargosMensais || encargosMensais.length === 0) {
    return null;
  }

  return encargosMensais.find(e => e.data === data) || null;
}

// ============================================================================
// CONVERSÃO DE TAXAS
// ============================================================================

/**
 * Converte taxa mensal para anual
 * toAnnual(i_m) = (1 + i_m)^12 - 1
 */
export function taxaMensalParaAnual(taxaMensal: number): number {
  return Math.pow(1 + taxaMensal, 12) - 1;
}

/**
 * Converte taxa anual para mensal
 * toMonthly(i_a) = (1 + i_a)^(1/12) - 1
 */
export function taxaAnualParaMensal(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual, 1/12) - 1;
}

// ============================================================================
// FORMATAÇÃO
// ============================================================================

/**
 * Arredonda número para exibição (2 casas decimais)
 */
export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Formata valor como moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata valor como percentual
 */
export function formatarPercent(valor: number, casas: number = 4): string {
  return `${(valor * 100).toFixed(casas)}%`;
}

// ============================================================================
// MOTOR DE CÁLCULO SAC
// ============================================================================

/**
 * Gera cenário AP01 - Cobrado
 * Valores efetivamente cobrados do cliente incluindo todos os encargos
 */
export function gerarCenarioAP01(params: ParametrosSAC): CenarioAP01 {
  const {
    pv,
    n,
    primeiroVenc,
    faixasTaxa,
    trSeries,
    encargosMensais,
    horizonteMeses,
  } = params;

  // Determinar quantas parcelas calcular
  const numParcelas = horizonteMeses ? Math.min(horizonteMeses, n) : n;

  // Amortização constante
  const A = pv / n;

  // Gerar datas
  const datas = gerarRangeMensal(primeiroVenc, numParcelas);

  // Inicializar
  const tabela: LinhaAmortizacao[] = [];
  let saldoDevedor = pv;
  let totalJuros = 0;
  let totalMIP = 0;
  let totalDFI = 0;
  let totalTCA = 0;
  let totalMulta = 0;
  let totalMora = 0;

  // Calcular cada parcela
  for (let t = 0; t < numParcelas; t++) {
    const data = datas[t];
    const mes = t + 1;

    // Selecionar taxa para esta data
    const i_t = selecionarTaxa(data, faixasTaxa);

    // Calcular juros: J_t = SD_{t-1} × i_t
    const J_t = saldoDevedor * i_t;

    // Prestação básica: P_t = A + J_t
    const P_t = A + J_t;

    // Buscar encargos para esta parcela
    const encargos = buscarEncargos(data, encargosMensais);
    const MIP = encargos?.MIP || 0;
    const DFI = encargos?.DFI || 0;
    const TCA = encargos?.TCA || 0;
    const multa = encargos?.multa || 0;
    const mora = encargos?.mora || 0;

    // Total pago: Pago_t = P_t + encargos
    const Pago_t = P_t + MIP + DFI + TCA + multa + mora;

    // Atualizar saldo devedor
    // SD'_t = SD_{t-1} - A
    let SD_t_temp = saldoDevedor - A;

    // Aplicar TR: SD_t = SD'_t × TR_t
    const TR_t = buscarTR(data, trSeries);
    const SD_t = SD_t_temp * TR_t;

    // Adicionar linha à tabela
    tabela.push({
      mes,
      data,
      valorOriginalParcela: P_t,
      valorCorrigido: P_t, // No SAC geralmente é igual
      juros: J_t,
      amortizacao: A,
      saldoDevedor: SD_t,
      MIP,
      DFI,
      TCA,
      multa,
      mora,
      totalPago: Pago_t,
    });

    // Acumular totais
    totalJuros += J_t;
    totalMIP += MIP;
    totalDFI += DFI;
    totalTCA += TCA;
    totalMulta += multa;
    totalMora += mora;

    // Atualizar saldo para próxima iteração
    saldoDevedor = SD_t;
  }

  const totalTaxas = totalMIP + totalDFI + totalTCA + totalMulta + totalMora;
  const totalPago = pv + totalJuros + totalTaxas;

  return {
    tipo: 'AP01',
    tabela,
    totais: {
      valorPrincipal: pv,
      totalJuros,
      totalMIP,
      totalDFI,
      totalTCA,
      totalMulta,
      totalMora,
      totalTaxas,
      totalPago,
    },
  };
}

/**
 * Gera cenário AP05 - Devido
 * Valores que deveriam ter sido cobrados (taxa de mercado, sem seguros)
 */
export function gerarCenarioAP05(
  params: ParametrosSAC,
  taxaMercado: number
): CenarioAP05 {
  const {
    pv,
    n,
    primeiroVenc,
    trSeries,
    horizonteMeses,
  } = params;

  // Determinar quantas parcelas calcular
  const numParcelas = horizonteMeses ? Math.min(horizonteMeses, n) : n;

  // Amortização constante (igual ao cobrado)
  const A = pv / n;

  // Gerar datas
  const datas = gerarRangeMensal(primeiroVenc, numParcelas);

  // Inicializar
  const tabela: LinhaAmortizacao[] = [];
  let saldoDevedor = pv;
  let totalJuros = 0;

  // Calcular cada parcela com taxa de mercado fixa
  for (let t = 0; t < numParcelas; t++) {
    const data = datas[t];
    const mes = t + 1;

    // Juros com taxa de mercado: J_t^{mkt} = SD_{t-1}^{mkt} × i_mkt
    const J_t_mkt = saldoDevedor * taxaMercado;

    // Prestação: P_t^{mkt} = A + J_t^{mkt}
    const P_t_mkt = A + J_t_mkt;

    // Atualizar saldo devedor
    let SD_t_temp = saldoDevedor - A;

    // Aplicar TR (mesma do cenário cobrado)
    const TR_t = buscarTR(data, trSeries);
    const SD_t = SD_t_temp * TR_t;

    // Adicionar linha à tabela
    tabela.push({
      mes,
      data,
      valorOriginalParcela: P_t_mkt,
      valorCorrigido: P_t_mkt,
      juros: J_t_mkt,
      amortizacao: A,
      saldoDevedor: SD_t,
    });

    // Acumular totais
    totalJuros += J_t_mkt;

    // Atualizar saldo para próxima iteração
    saldoDevedor = SD_t;
  }

  const totalDevido = pv + totalJuros;

  return {
    tipo: 'AP05',
    tabela,
    totais: {
      valorPrincipal: pv,
      totalJuros,
      totalDevido,
    },
  };
}

/**
 * Gera cenário AP03 - Comparativo
 * Diferenças mensais entre cobrado e devido
 */
export function gerarCenarioAP03(
  ap01: CenarioAP01,
  ap05: CenarioAP05,
  taxaContrato: number,
  taxaMercado: number
): CenarioAP03 {
  const tabela: LinhaAmortizacao[] = [];
  let totalRestituir = 0;

  // Comparar linha a linha
  const numLinhas = Math.min(ap01.tabela.length, ap05.tabela.length);

  for (let i = 0; i < numLinhas; i++) {
    const linhaCobrado = ap01.tabela[i];
    const linhaDevido = ap05.tabela[i];

    // Diferença mensal: D_t = Pago_t - P_t^{mkt}
    const D_t = (linhaCobrado.totalPago || 0) - linhaDevido.valorOriginalParcela;

    tabela.push({
      mes: linhaCobrado.mes,
      data: linhaCobrado.data,
      valorOriginalParcela: linhaCobrado.totalPago || 0,
      valorCorrigido: linhaDevido.valorOriginalParcela,
      juros: linhaCobrado.juros,
      amortizacao: linhaCobrado.amortizacao,
      saldoDevedor: linhaCobrado.saldoDevedor,
      diferenca: D_t,
    });

    totalRestituir += D_t;
  }

  // Sobretaxa em pontos percentuais
  const sobretaxaPP = taxaContrato - taxaMercado;

  return {
    tipo: 'AP03',
    tabela,
    totais: {
      totalRestituir,
      taxaContratoAM: taxaContrato,
      taxaMercadoAM: taxaMercado,
      sobretaxaPP,
    },
  };
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida parâmetros básicos do financiamento
 */
export function validarParametros(params: ParametrosSAC): void {
  const { pv, n, primeiroVenc, faixasTaxa } = params;

  if (pv <= 0) {
    throw new CalculationError(
      'Valor presente (PV) deve ser maior que zero',
      'PV_INVALIDO',
      { pv }
    );
  }

  if (n <= 0 || !Number.isInteger(n)) {
    throw new CalculationError(
      'Número de parcelas (n) deve ser um inteiro positivo',
      'N_INVALIDO',
      { n }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(primeiroVenc)) {
    throw new CalculationError(
      'Data do primeiro vencimento deve estar no formato YYYY-MM-DD',
      'DATA_INVALIDA',
      { primeiroVenc }
    );
  }

  if (!faixasTaxa || faixasTaxa.length === 0) {
    throw new CalculationError(
      'Pelo menos uma faixa de taxa deve ser fornecida',
      'FAIXAS_VAZIAS',
      { faixasTaxa }
    );
  }

  // Validar cada faixa de taxa
  for (const faixa of faixasTaxa) {
    if (faixa.i < 0 || faixa.i > 1) {
      throw new CalculationError(
        'Taxa de juros deve estar entre 0 e 1 (formato decimal)',
        'TAXA_FORA_LIMITE',
        { faixa }
      );
    }
  }
}

/**
 * Valida série de TR
 */
export function validarTRSeries(trSeries?: TRSerie[]): void {
  if (!trSeries) return;

  for (const tr of trSeries) {
    if (tr.fator <= 0) {
      throw new CalculationError(
        'Fator TR deve ser positivo',
        'TR_INVALIDA',
        { tr }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(tr.data)) {
      throw new CalculationError(
        'Data da TR deve estar no formato YYYY-MM-DD',
        'TR_DATA_INVALIDA',
        { tr }
      );
    }
  }
}

/**
 * Valida encargos mensais
 */
export function validarEncargos(encargosMensais?: EncargosMensais[]): void {
  if (!encargosMensais) return;

  for (const encargo of encargosMensais) {
    const { MIP, DFI, TCA, multa, mora } = encargo;

    if (MIP < 0 || DFI < 0 || TCA < 0 || multa < 0 || mora < 0) {
      throw new CalculationError(
        'Encargos não podem ser negativos',
        'ENCARGO_NEGATIVO',
        { encargo }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(encargo.data)) {
      throw new CalculationError(
        'Data do encargo deve estar no formato YYYY-MM-DD',
        'ENCARGO_DATA_INVALIDA',
        { encargo }
      );
    }
  }
}
