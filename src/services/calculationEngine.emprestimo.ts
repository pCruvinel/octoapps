/**
 * Motor de Cálculo para Empréstimos e Financiamentos
 *
 * Implementa cálculos específicos para análise revisional de empréstimos:
 * - Sistema PRICE (parcelas fixas)
 * - Cálculo de CET (Custo Efetivo Total)
 * - Validação de encargos vedados (TAC/TEC)
 * - Detecção de irregularidades
 * - Análise comparativa
 */

import type {
  CalculoEmprestimoPRICERequest,
  CalculoEmprestimoPRICEResponse,
  LinhaAmortizacaoEmprestimo,
  AnaliseEmprestimoRequest,
  AnaliseEmprestimoResponse,
} from '@/types/calculation.types';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Data limite para TAC/TEC (30/04/2008)
 * Resolução CMN 3.518/2007 vedou TAC e TEC
 */
const DATA_VEDACAO_TAC_TEC = new Date('2008-04-30');

/**
 * Taxa de mercado de referência para empréstimos pessoais (mensal)
 * Fonte: Banco Central (média histórica)
 */
const TAXA_MERCADO_REFERENCIA = 0.03; // 3% a.m.

/**
 * Percentual máximo de IOF
 */
const IOF_MAXIMO_DIARIO = 0.000082; // 0.0082% ao dia
const IOF_ADICIONAL = 0.0038; // 0.38%

/**
 * Tolerância para comparações numéricas
 */
const TOLERANCIA = 0.01;

// ============================================================================
// SISTEMA PRICE - PARCELAS FIXAS
// ============================================================================

/**
 * Calcula empréstimo usando Sistema PRICE (parcelas fixas)
 *
 * Sistema PRICE:
 * - Parcelas fixas ao longo do contrato
 * - Juros decrescentes (calculados sobre saldo devedor)
 * - Amortização crescente (diferença entre parcela e juros)
 *
 * Fórmula da Parcela Fixa (PMT):
 * PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
 *
 * Onde:
 * - PV = Valor financiado (presente)
 * - i = Taxa de juros mensal
 * - n = Número de parcelas
 *
 * @param params - Parâmetros do cálculo
 * @returns Cenários cobrado, devido e comparativo
 */
export function calcularEmprestimoPRICE(
  params: CalculoEmprestimoPRICERequest
): CalculoEmprestimoPRICEResponse {
  // Validações
  validarParametrosPRICE(params);

  const {
    valorFinanciado,
    numeroParcelas,
    taxaMensalCobrada,
    taxaMensalMercado,
    dataInicio,
    encargosIniciais = {},
    encargosRecorrentes = {},
  } = params;

  console.log('📊 Calculando empréstimo PRICE...');
  console.log(`  Valor financiado: R$ ${valorFinanciado.toFixed(2)}`);
  console.log(`  Parcelas: ${numeroParcelas}`);
  console.log(`  Taxa cobrada: ${(taxaMensalCobrada * 100).toFixed(2)}%`);
  console.log(`  Taxa mercado: ${(taxaMensalMercado * 100).toFixed(2)}%`);

  // Calcular total de encargos iniciais
  const totalEncargosIniciais = Object.values(encargosIniciais).reduce((sum, val) => sum + (val || 0), 0);

  // Calcular total de encargos recorrentes (por parcela)
  const totalEncargosRecorrentes = Object.values(encargosRecorrentes).reduce((sum, val) => sum + (val || 0), 0);

  // Calcular cenário cobrado
  const cenarioCobrado = gerarTabelaPRICE({
    valorFinanciado,
    numeroParcelas,
    taxaMensal: taxaMensalCobrada,
    dataInicio,
    encargosRecorrentes: totalEncargosRecorrentes,
  });

  // Calcular cenário devido (taxa de mercado)
  const cenarioDevido = gerarTabelaPRICE({
    valorFinanciado,
    numeroParcelas,
    taxaMensal: taxaMensalMercado,
    dataInicio,
    encargosRecorrentes: totalEncargosRecorrentes,
  });

  // Calcular CET cobrado
  const cetCobrado = calcularCET({
    valorFinanciado,
    parcelas: cenarioCobrado.tabela.map(l => l.totalParcela || l.valorParcela),
    encargosIniciais: totalEncargosIniciais,
  });

  // Calcular CET devido
  const cetDevido = calcularCET({
    valorFinanciado,
    parcelas: cenarioDevido.tabela.map(l => l.totalParcela || l.valorParcela),
    encargosIniciais: totalEncargosIniciais,
  });

  // Calcular comparativo
  const comparativo = {
    diferencaParcela: cenarioCobrado.valorParcela - cenarioDevido.valorParcela,
    diferencaJuros: cenarioCobrado.totalJuros - cenarioDevido.totalJuros,
    diferencaEncargos: cenarioCobrado.totalEncargos - cenarioDevido.totalEncargos,
    diferencaTotal: cenarioCobrado.totalPago - cenarioDevido.totalPago,
    taxaCobradaMensal: taxaMensalCobrada,
    taxaMercadoMensal: taxaMensalMercado,
    sobretaxaPP: (taxaMensalCobrada - taxaMensalMercado) * 100,
  };

  console.log('✅ Cálculo PRICE concluído!');
  console.log(`  Parcela cobrada: R$ ${cenarioCobrado.valorParcela.toFixed(2)}`);
  console.log(`  Parcela devida: R$ ${cenarioDevido.valorParcela.toFixed(2)}`);
  console.log(`  Diferença total: R$ ${comparativo.diferencaTotal.toFixed(2)}`);

  return {
    cenarioCobrado,
    cenarioDevido,
    comparativo,
    cet: {
      cetMensalCobrado: cetCobrado.cetMensal,
      cetAnualCobrado: cetCobrado.cetAnual,
      cetMensalDevido: cetDevido.cetMensal,
      cetAnualDevido: cetDevido.cetAnual,
    },
  };
}

/**
 * Gera tabela de amortização usando Sistema PRICE
 *
 * @param params - Parâmetros do cálculo
 * @returns Tabela de amortização e totalizadores
 */
function gerarTabelaPRICE(params: {
  valorFinanciado: number;
  numeroParcelas: number;
  taxaMensal: number;
  dataInicio: string;
  encargosRecorrentes?: number;
}): {
  tabela: LinhaAmortizacaoEmprestimo[];
  valorParcela: number;
  totalJuros: number;
  totalEncargos: number;
  totalPago: number;
} {
  const { valorFinanciado, numeroParcelas, taxaMensal, dataInicio, encargosRecorrentes = 0 } = params;

  // Calcular PMT (parcela fixa de principal + juros)
  const PMT = calcularPMT(valorFinanciado, taxaMensal, numeroParcelas);

  const tabela: LinhaAmortizacaoEmprestimo[] = [];
  let saldoDevedor = valorFinanciado;
  let totalJuros = 0;
  let totalEncargos = 0;

  for (let mes = 1; mes <= numeroParcelas; mes++) {
    // Calcular juros do mês (sobre saldo devedor)
    const juros = saldoDevedor * taxaMensal;

    // Calcular amortização (diferença entre PMT e juros)
    const amortizacao = PMT - juros;

    // Atualizar saldo devedor
    saldoDevedor = Math.max(0, saldoDevedor - amortizacao);

    // Calcular data da parcela
    const dataVencimento = calcularDataParcela(dataInicio, mes - 1);

    // Total da parcela (PMT + encargos recorrentes)
    const totalParcela = PMT + encargosRecorrentes;

    // Adicionar linha
    tabela.push({
      mes,
      dataVencimento,
      valorParcela: PMT,
      juros,
      amortizacao,
      saldoDevedor,
      seguroPrestamista: encargosRecorrentes,
      totalParcela,
    });

    // Acumular totais
    totalJuros += juros;
    totalEncargos += encargosRecorrentes;
  }

  return {
    tabela,
    valorParcela: PMT,
    totalJuros,
    totalEncargos: totalEncargos,
    totalPago: (PMT * numeroParcelas) + totalEncargos,
  };
}

/**
 * Calcula o valor da parcela fixa (PMT) usando Sistema PRICE
 *
 * Fórmula: PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
 *
 * @param pv - Valor presente (financiado)
 * @param i - Taxa de juros mensal
 * @param n - Número de parcelas
 * @returns Valor da parcela fixa
 */
function calcularPMT(pv: number, i: number, n: number): number {
  // Caso especial: taxa zero
  if (i === 0) {
    return pv / n;
  }

  // Fórmula PRICE
  const fator = Math.pow(1 + i, n);
  const PMT = pv * (i * fator) / (fator - 1);

  return PMT;
}

/**
 * Calcula a data de uma parcela baseada na data inicial
 *
 * @param dataInicio - Data inicial (YYYY-MM-DD)
 * @param mesesAdicionar - Número de meses a adicionar
 * @returns Data calculada (YYYY-MM-DD)
 */
function calcularDataParcela(dataInicio: string, mesesAdicionar: number): string {
  const data = new Date(dataInicio + 'T00:00:00');
  data.setMonth(data.getMonth() + mesesAdicionar);

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

// ============================================================================
// CÁLCULO DE CET (CUSTO EFETIVO TOTAL)
// ============================================================================

/**
 * Calcula o CET (Custo Efetivo Total) de um empréstimo
 *
 * CET é a taxa que iguala o valor líquido disponibilizado ao valor presente
 * dos pagamentos, incluindo TODOS os encargos.
 *
 * Equação do CET:
 * PV_líquido = Σ [PMT_t / (1 + CET)^t]
 *
 * Onde:
 * - PV_líquido = Valor efetivamente disponibilizado (valor financiado - encargos iniciais)
 * - PMT_t = Parcela total do período t (incluindo todos os encargos)
 * - CET = Taxa que iguala ambos os lados
 *
 * Método de resolução: Newton-Raphson (iterativo)
 *
 * @param params - Parâmetros do cálculo
 * @returns CET mensal e anual
 */
export function calcularCET(params: {
  valorFinanciado: number;
  parcelas: number[];
  encargosIniciais?: number;
  maxIteracoes?: number;
  tolerancia?: number;
}): {
  cetMensal: number;
  cetAnual: number;
} {
  const {
    valorFinanciado,
    parcelas,
    encargosIniciais = 0,
    maxIteracoes = 100,
    tolerancia = 0.000001,
  } = params;

  // Validações
  if (valorFinanciado <= 0) {
    throw new Error('Valor financiado deve ser maior que zero');
  }

  if (parcelas.length === 0) {
    throw new Error('Deve haver pelo menos uma parcela');
  }

  // Valor líquido disponibilizado
  const pvLiquido = valorFinanciado - encargosIniciais;

  if (pvLiquido <= 0) {
    throw new Error('Valor líquido deve ser positivo');
  }

  // Chute inicial: taxa média aproximada
  const totalPago = parcelas.reduce((sum, p) => sum + p, 0);
  let cet = (totalPago / pvLiquido - 1) / parcelas.length;

  // Método Newton-Raphson
  for (let iter = 0; iter < maxIteracoes; iter++) {
    // Calcular f(CET) = PV_líquido - Σ[PMT_t / (1+CET)^t]
    let f = pvLiquido;
    let fDerivada = 0;

    for (let t = 1; t <= parcelas.length; t++) {
      const pmt = parcelas[t - 1];
      const denominador = Math.pow(1 + cet, t);

      f -= pmt / denominador;
      fDerivada += (t * pmt) / Math.pow(1 + cet, t + 1);
    }

    // Verificar convergência
    if (Math.abs(f) < tolerancia) {
      break;
    }

    // Atualizar CET
    const novoCet = cet - f / fDerivada;

    // Limitar valores extremos
    if (novoCet < -0.99) {
      cet = -0.99;
    } else if (novoCet > 10) {
      cet = 10;
    } else {
      cet = novoCet;
    }
  }

  // Calcular CET anual: (1 + CET_mensal)^12 - 1
  const cetAnual = Math.pow(1 + cet, 12) - 1;

  return {
    cetMensal: cet,
    cetAnual,
  };
}

// ============================================================================
// VALIDAÇÃO DE ENCARGOS VEDADOS
// ============================================================================

/**
 * Valida se TAC/TEC foram cobradas após a data de vedação
 *
 * TAC (Tarifa de Abertura de Crédito) e TEC (Tarifa de Emissão de Carnê)
 * foram vedadas pela Resolução CMN 3.518/2007, em vigor desde 30/04/2008.
 *
 * @param dataContrato - Data do contrato
 * @param tac - Valor cobrado de TAC
 * @param tec - Valor cobrado de TEC
 * @returns Indicação se há irregularidade
 */
export function validarTacTec(params: {
  dataContrato: string;
  tac?: number;
  tec?: number;
}): {
  tacTecIrregular: boolean;
  motivoIrregularidade: string;
} {
  const { dataContrato, tac, tec } = params;
  const mensagens: string[] = [];
  let irregular = false;

  const dataContratoDate = new Date(dataContrato);

  // Verificar se contrato é posterior à vedação
  if (dataContratoDate > DATA_VEDACAO_TAC_TEC) {
    if (tac && tac > 0) {
      irregular = true;
      mensagens.push(
        `TAC cobrada indevidamente (R$ ${tac.toFixed(2)}). ` +
        `Vedada pela Resolução CMN 3.518/2007 desde 30/04/2008.`
      );
    }

    if (tec && tec > 0) {
      irregular = true;
      mensagens.push(
        `TEC cobrada indevidamente (R$ ${tec.toFixed(2)}). ` +
        `Vedada pela Resolução CMN 3.518/2007 desde 30/04/2008.`
      );
    }
  }

  return {
    tacTecIrregular: irregular,
    motivoIrregularidade: mensagens.join(' ')
  };
}

/**
 * Valida seguros cobrados no empréstimo
 *
 * Seguros devem ter anuência expressa do consumidor e não podem ser
 * venda casada (art. 39, I do CDC).
 *
 * @param params - Parâmetros contendo array de seguros
 * @returns Objeto com lista de seguros irregulares
 */
export function validarSeguros(params: {
  seguros: Array<{
    nome: string;
    valor: number;
    consentimento: boolean;
  }>;
}): {
  segurosIrregulares: string[];
} {
  const { seguros } = params;
  const segurosIrregulares: string[] = [];

  seguros.forEach((seguro) => {
    if (!seguro.consentimento && seguro.valor > 0) {
      segurosIrregulares.push(
        `${seguro.nome} (R$ ${seguro.valor.toFixed(2)}) cobrado sem consentimento expresso. ` +
        `Venda casada é proibida (CDC art. 39, I).`
      );
    }
  });

  return { segurosIrregulares };
}

/**
 * Valida comissão de permanência
 *
 * Súmula 472 STJ: Comissão de permanência não pode ser cumulada com
 * juros de mora, multa moratória ou correção monetária.
 *
 * @param params - Parâmetros com comissão, juros de mora e multa
 * @returns Indicação se há irregularidade
 */
export function validarComissaoPermanencia(params: {
  comissaoPermanencia?: boolean | number;
  jurosMora?: number;
  multa?: number;
}): {
  cumulacaoIrregular: boolean;
  motivoIrregularidade: string;
} {
  const { comissaoPermanencia, jurosMora, multa } = params;

  // Considera que há comissão se for true ou maior que 0
  const temComissao = typeof comissaoPermanencia === 'boolean'
    ? comissaoPermanencia
    : (comissaoPermanencia && comissaoPermanencia > 0);

  if (temComissao) {
    if ((jurosMora && jurosMora > 0) || (multa && multa > 0)) {
      return {
        cumulacaoIrregular: true,
        motivoIrregularidade:
          'Comissão de permanência não pode ser cumulada com juros de mora ou multa moratória (Súmula 472 STJ).',
      };
    }
  }

  return {
    cumulacaoIrregular: false,
    motivoIrregularidade: ''
  };
}

// ============================================================================
// ANÁLISE PRÉVIA DE EMPRÉSTIMO
// ============================================================================

/**
 * Realiza análise prévia de empréstimo
 *
 * Executa cálculos rápidos e identifica irregularidades.
 *
 * @param params - Parâmetros da análise
 * @returns Resumo da análise
 */
export function analisarEmprestimoPrevia(
  params: AnaliseEmprestimoRequest
): AnaliseEmprestimoResponse {
  const {
    valorFinanciado,
    numeroParcelas,
    taxaMensalCobrada,
    taxaMensalMercado,
    taxaMensal,
    taxaMercadoMensal,
    sistemaAmortizacao = 'PRICE',
    encargosIniciais = 0,
    encargosRecorrentes = 0,
    mesesAnalise,
  } = params;

  // Suporte para aliases (compatibilidade com testes)
  const taxaCobrada = taxaMensalCobrada ?? taxaMensal;
  const taxaMercado = taxaMensalMercado ?? taxaMercadoMensal;

  if (!taxaCobrada || !taxaMercado) {
    throw new Error('Taxa mensal cobrada e taxa de mercado são obrigatórias');
  }

  console.log('🔍 Realizando análise prévia de empréstimo...');

  // Calcular usando PRICE (único sistema implementado por ora)
  const meses = mesesAnalise || numeroParcelas;

  const resultado = calcularEmprestimoPRICE({
    valorFinanciado,
    numeroParcelas: meses,
    taxaMensalCobrada: taxaCobrada,
    taxaMensalMercado: taxaMercado,
    dataInicio: new Date().toISOString().split('T')[0],
    encargosIniciais: { tac: encargosIniciais },
    encargosRecorrentes: { seguroPrestamista: encargosRecorrentes },
  });

  // Calcular totais
  const totalJurosCobrado = resultado.cenarioCobrado.totalJuros;
  const totalJurosDevido = resultado.cenarioDevido.totalJuros;
  const totalEncargos = resultado.cenarioCobrado.totalEncargos + encargosIniciais;
  const diferencaRestituicao = totalJurosCobrado - totalJurosDevido;

  // Calcular percentuais
  const sobretaxaPP = resultado.comparativo.sobretaxaPP;
  const percentualAbuso = taxaMensalMercado > 0
    ? ((taxaMensalCobrada - taxaMensalMercado) / taxaMensalMercado) * 100
    : 0;

  // Identificar irregularidades
  const encargosIrregulares: string[] = [];
  let tacTecIrregular = false;

  // Verificar TAC/TEC (assumindo que encargosIniciais pode incluir TAC/TEC)
  if (encargosIniciais > 0) {
    encargosIrregulares.push('Verificar se há cobrança de TAC/TEC (vedadas desde 30/04/2008).');
    tacTecIrregular = true;
  }

  // Verificar seguros
  if (encargosRecorrentes > 0) {
    encargosIrregulares.push('Verificar se seguros foram contratados com anuência expressa.');
  }

  // Verificar sobretaxa abusiva
  if (sobretaxaPP > 2) {
    encargosIrregulares.push(`Sobretaxa elevada: ${sobretaxaPP.toFixed(2)} p.p. acima do mercado.`);
  }

  console.log('✅ Análise prévia concluída!');
  console.log(`  Diferença (restituição): R$ ${diferencaRestituicao.toFixed(2)}`);
  console.log(`  CET cobrado: ${(resultado.cet.cetMensalCobrado * 100).toFixed(2)}% a.m.`);

  return {
    valorFinanciado,
    numeroParcelas,
    sistemaAmortizacao,
    taxaCobradaMensal: taxaMensalCobrada,
    taxaMercadoMensal: taxaMensalMercado,
    sobretaxaPP,
    percentualAbuso,
    valorParcela: resultado.cenarioCobrado.valorParcela,
    totalJurosCobrado,
    totalJurosDevido,
    totalEncargos,
    diferencaRestituicao,
    cetMensal: resultado.cet.cetMensalCobrado,
    cetAnual: resultado.cet.cetAnualCobrado,
    encargosIrregulares,
    tacTecIrregular,
    formatted: {
      valorFinanciado: `R$ ${valorFinanciado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      valorParcela: `R$ ${resultado.cenarioCobrado.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      taxaCobradaMensal: `${(taxaMensalCobrada * 100).toFixed(2)}%`,
      taxaMercadoMensal: `${(taxaMensalMercado * 100).toFixed(2)}%`,
      sobretaxaPP: `${sobretaxaPP.toFixed(2)} p.p.`,
      totalJurosCobrado: `R$ ${totalJurosCobrado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalJurosDevido: `R$ ${totalJurosDevido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      diferencaRestituicao: `R$ ${diferencaRestituicao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      cetMensal: `${(resultado.cet.cetMensalCobrado * 100).toFixed(2)}%`,
      cetAnual: `${(resultado.cet.cetAnualCobrado * 100).toFixed(2)}%`,
    },
  };
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida os parâmetros de entrada para cálculo PRICE
 */
function validarParametrosPRICE(params: CalculoEmprestimoPRICERequest): void {
  const {
    valorFinanciado,
    numeroParcelas,
    taxaMensalCobrada,
    taxaMensalMercado,
    dataInicio,
  } = params;

  if (!valorFinanciado || valorFinanciado <= 0) {
    throw new Error('Valor financiado deve ser maior que zero');
  }

  if (!numeroParcelas || numeroParcelas <= 0 || numeroParcelas > 600) {
    throw new Error('Número de parcelas deve estar entre 1 e 600');
  }

  if (!taxaMensalCobrada || taxaMensalCobrada < 0) {
    throw new Error('Taxa mensal cobrada deve ser maior ou igual a zero');
  }

  if (taxaMensalCobrada > 0.5) {
    throw new Error('Taxa mensal cobrada parece inválida (>50%)');
  }

  if (!taxaMensalMercado || taxaMensalMercado < 0) {
    throw new Error('Taxa mensal de mercado deve ser maior ou igual a zero');
  }

  if (!dataInicio) {
    throw new Error('Data de início é obrigatória');
  }

  // Validar formato de data
  const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dataRegex.test(dataInicio)) {
    throw new Error('Data de início deve estar no formato YYYY-MM-DD');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calcularEmprestimoPRICE,
  calcularCET,
  validarTacTec,
  validarSeguros,
  validarComissaoPermanencia,
  analisarEmprestimoPrevia,
};
