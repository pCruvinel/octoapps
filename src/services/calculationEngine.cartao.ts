/**
 * Motor de Cálculo Agregado para Cartão de Crédito
 *
 * Implementa análise macro sem histórico mensal de faturas:
 * - Cálculo de sobretaxa (relativa e pontos percentuais)
 * - Simulação de juros compostos (contrato vs. mercado)
 * - Detecção de encargos abusivos
 * - Geração de relatório completo com tabela SAC
 *
 * Base metodológica:
 * - Taxa do contrato vs. Taxa média BACEN
 * - Sobretaxa relativa: (i_contrato / i_bacen) - 1
 * - Sobretaxa em p.p.: i_contrato - i_bacen
 * - Juros compostos: M = P × (1 + i)^n
 * - Sistema SAC para tabela de amortização de referência
 *
 * @module calculationEngine.cartao
 */

import type { AnaliseCartaoResponse } from '@/types/calculation.types';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Taxa BACEN padrão para cartão de crédito rotativo (5% a.m.)
 * Fonte: Taxa média BACEN para operações de crédito rotativo
 * TODO: Substituir por integração com API do Banco Central
 */
const TAXA_BACEN_PADRAO = 0.05;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Converter taxa anual para mensal
 *
 * Fórmula: i_m = (1 + i_a)^(1/12) - 1
 *
 * @param taxa_aa - Taxa anual em decimal (ex: 0.15 = 15% a.a.)
 * @returns Taxa mensal em decimal
 */
function converterTaxaAnualParaMensal(taxa_aa: number): number {
  return Math.pow(1 + taxa_aa, 1 / 12) - 1;
}

/**
 * Calcular número de meses entre duas datas
 *
 * @param inicio - Data inicial
 * @param fim - Data final
 * @returns Número de meses (mínimo 1)
 */
function calcularMesesEntreDatas(inicio: Date, fim: Date): number {
  const diff = fim.getTime() - inicio.getTime();
  const meses = diff / (1000 * 60 * 60 * 24 * 30.44); // 30.44 = média de dias/mês
  return Math.round(Math.max(1, meses));
}

/**
 * Obter taxa média de mercado BACEN
 *
 * TODO: Integrar com API do Banco Central para obter taxa histórica real
 * Por enquanto retorna taxa fixa configurada
 *
 * @param data_inicio - Data de início da análise
 * @param data_fim - Data fim da análise
 * @returns Taxa mensal em decimal
 */
function obterTaxaMediaBacen(data_inicio: Date, data_fim: Date): number {
  // Futuro: consultar API BACEN por período
  // Retornar taxa média ponderada do período
  return TAXA_BACEN_PADRAO;
}

/**
 * Calcular montante com juros compostos
 *
 * Fórmula: M = P × (1 + i)^n
 *
 * @param principal - Capital inicial
 * @param taxa_mensal - Taxa de juros mensal em decimal
 * @param meses - Número de meses
 * @returns Montante final
 */
function calcularMontanteComposto(
  principal: number,
  taxa_mensal: number,
  meses: number
): number {
  return principal * Math.pow(1 + taxa_mensal, meses);
}

// ============================================================================
// TIPOS
// ============================================================================

export interface AnaliseCartaoRequest {
  // Dados básicos
  credor: string;
  devedor: string;
  data_calculo: Date;
  data_inicio_analise: Date;
  data_ultima_fatura: Date;

  // Valores
  saldo_devedor: number;
  valor_principal?: number;

  // Taxas (já em decimal, ex: 0.1299 = 12.99%)
  jurosRotativo: number;
  taxaMercadoMensal?: number; // opcional, usa BACEN se não informado

  // Encargos adicionais (já em decimal, ex: 0.01 = 1%)
  jurosMoraPercentual?: number;
  multaPercentual?: number;
  iofValor?: number;
  anuidade?: number;
  seguros?: number;
  tarifas?: number;

  // Parâmetros
  mesesAnalise?: number;
  prazo_meses_simulacao?: number;
}

export interface LinhaAmortizacaoSAC {
  mes: number;
  parcela_original: number; // cenário contrato
  parcela_corrigida: number; // cenário mercado
  juros_contrato: number;
  juros_mercado: number;
  amortizacao: number;
  saldo_devedor: number;
}

export interface RelatorioCompletoCartao {
  linhas_amortizacao: LinhaAmortizacaoSAC[];
  valor_principal: number;
  total_juros_contrato: number;
  total_juros_mercado: number;
  valor_total_contrato: number;
  valor_total_mercado: number;
  valor_a_restituir_simples: number;
  valor_a_restituir_dobro: number;
  resumo_executivo: string;
  base_legal_metodologia: string;
}

// ============================================================================
// ANÁLISE PRÉVIA
// ============================================================================

/**
 * Realizar análise prévia agregada de cartão de crédito
 *
 * Calcula:
 * - Taxa do contrato vs. Taxa média BACEN
 * - Sobretaxa (relativa e em pontos percentuais)
 * - Simulação macro de juros compostos
 * - Encargos adicionais (mora, multa, IOF)
 * - Classificação de abusividade
 * - Detecção de irregularidades
 *
 * @param params - Parâmetros da análise
 * @returns Resultado da análise no formato AnaliseCartaoResponse
 */
export function analisarCartaoPrevia(
  params: AnaliseCartaoRequest
): AnaliseCartaoResponse {

  // ========================================================================
  // 1. DETERMINAR TAXA DO CONTRATO (mensal)
  // ========================================================================

  const taxa_contrato_am = params.jurosRotativo; // já vem em decimal


  // ========================================================================
  // 2. TAXA MÉDIA DE MERCADO (BACEN)
  // ========================================================================

  const taxa_bacen_am =
    params.taxaMercadoMensal ||
    obterTaxaMediaBacen(params.data_inicio_analise, params.data_calculo);


  // ========================================================================
  // 3. CÁLCULO DE SOBRETAXA
  // ========================================================================

  // Sobretaxa relativa: quanto maior é a taxa do contrato em relação à média
  // Fórmula: (i_contrato / i_bacen) - 1
  // Exemplo: 20% / 10% - 1 = 1 = 100% acima da média
  const sobretaxa_relativa = taxa_bacen_am > 0 ? taxa_contrato_am / taxa_bacen_am - 1 : 0;
  const sobretaxa_percentual = sobretaxa_relativa * 100;

  // Sobretaxa em pontos percentuais: diferença absoluta
  // Fórmula: i_contrato - i_bacen
  // Exemplo: 20% - 10% = 10 pontos percentuais
  const sobretaxa_pp = taxa_contrato_am - taxa_bacen_am; // em decimal

  // ========================================================================
  // 4. SIMULAÇÃO MACRO DE JUROS COM PAGAMENTO MÍNIMO
  // ========================================================================

  // Capital base: usa valor_principal se disponível, senão saldo_devedor
  const P = params.valor_principal || params.saldo_devedor;

  // Número de meses a analisar
  const n =
    params.mesesAnalise ||
    calcularMesesEntreDatas(params.data_inicio_analise, params.data_calculo);


  // Simulação com pagamento mínimo (15% do saldo + juros)
  // Mês a mês: Saldo_novo = Saldo_antigo + Juros - Pagamento_mínimo
  const PAGAMENTO_MINIMO_PCT = 0.15; // 15% padrão cartão de crédito

  let saldo_contrato = P;
  let total_juros_contrato = 0;

  for (let mes = 0; mes < n; mes++) {
    const juros_mes = saldo_contrato * taxa_contrato_am;
    total_juros_contrato += juros_mes;
    saldo_contrato = saldo_contrato + juros_mes;

    // Pagamento mínimo: 15% do (saldo + juros)
    const pagamento = saldo_contrato * PAGAMENTO_MINIMO_PCT;
    saldo_contrato = saldo_contrato - pagamento;
  }

  // Mesma simulação com taxa BACEN
  let saldo_bacen = P;
  let total_juros_bacen = 0;

  for (let mes = 0; mes < n; mes++) {
    const juros_mes = saldo_bacen * taxa_bacen_am;
    total_juros_bacen += juros_mes;
    saldo_bacen = saldo_bacen + juros_mes;

    // Pagamento mínimo: 15% do (saldo + juros)
    const pagamento = saldo_bacen * PAGAMENTO_MINIMO_PCT;
    saldo_bacen = saldo_bacen - pagamento;
  }

  const juros_contrato = total_juros_contrato;
  const juros_bacen = total_juros_bacen;
  const delta_juros = Math.max(0, juros_contrato - juros_bacen);


  // ========================================================================
  // 5. ENCARGOS ADICIONAIS (Mora, Multa, IOF)
  // ========================================================================

  // 5.1. Juros de Mora (aplicado mensalmente sobre o saldo)
  // Fórmula: Mora_total = Saldo × Taxa_mora × Meses
  let totalJurosMoraCobrado = 0;
  if (params.jurosMoraPercentual && params.jurosMoraPercentual > 0) {
    totalJurosMoraCobrado = P * params.jurosMoraPercentual * n;
  }

  // 5.2. Multa de Inadimplência (aplicada uma vez sobre o saldo)
  // Fórmula: Multa = Saldo × Taxa_multa
  let totalMultaCobrada = 0;
  if (params.multaPercentual && params.multaPercentual > 0) {
    totalMultaCobrada = P * params.multaPercentual;
  }

  // 5.3. IOF (valor mensal informado, multiplicado pelo período)
  const totalIOFCobrado = (params.iofValor || 0) * n;


  // ========================================================================
  // 6. TOTAIS DE ENCARGOS
  // ========================================================================

  // Total cobrado = Juros + Mora + Multa + IOF
  const totalEncargosCobrados =
    juros_contrato + totalJurosMoraCobrado + totalMultaCobrada + totalIOFCobrado;

  // Total devido = Apenas juros com taxa BACEN
  // (Mora, Multa e IOF são considerados abusivos/indevidos)
  const totalEncargosDevidos = juros_bacen;

  // Diferença = Quanto a mais foi cobrado
  const diferencaRestituicao = totalEncargosCobrados - totalEncargosDevidos;


  // ========================================================================
  // 7. CLASSIFICAÇÃO DE ABUSIVIDADE
  // ========================================================================

  let classificacao: string;
  if (sobretaxa_relativa <= 0.2) {
    // Até 20% acima da média
    classificacao = 'Dentro ou levemente acima da média de mercado';
  } else if (sobretaxa_relativa <= 1.0) {
    // De 20% a 100% acima da média
    classificacao = 'Significativamente acima da média de mercado';
  } else {
    // Mais de 100% acima da média
    classificacao = 'Extremamente acima da média de mercado';
  }


  // ========================================================================
  // 8. DETECTAR ENCARGOS ABUSIVOS
  // ========================================================================

  const encargosAbusivos: string[] = [];

  if (totalJurosMoraCobrado > 0) {
    encargosAbusivos.push(
      `Juros de Mora: R$ ${totalJurosMoraCobrado.toFixed(2)} (${(
        (params.jurosMoraPercentual! * 100)
      ).toFixed(2)}%)`
    );
  }

  if (totalMultaCobrada > 0) {
    encargosAbusivos.push(
      `Multa: R$ ${totalMultaCobrada.toFixed(2)} (${(params.multaPercentual! * 100).toFixed(2)}%)`
    );
  }

  if (totalIOFCobrado > 0) {
    encargosAbusivos.push(`IOF: R$ ${totalIOFCobrado.toFixed(2)}`);
  }

  if (params.anuidade && params.anuidade > 500) {
    encargosAbusivos.push(`Anuidade elevada: R$ ${params.anuidade.toFixed(2)}`);
  }

  if (sobretaxa_relativa > 0.5) {
    encargosAbusivos.push(
      `Sobretaxa abusiva de ${sobretaxa_percentual.toFixed(0)}% acima da média`
    );
  }

  // Anatocismo: sempre detectado quando usamos juros compostos
  encargosAbusivos.push('Anatocismo provável (juros compostos sobre juros)');

  // ========================================================================
  // 9. CET (Custo Efetivo Total) simplificado
  // ========================================================================

  // Encargos fixos mensais
  const totalEncargosFixos =
    ((params.anuidade || 0) + (params.seguros || 0) + (params.tarifas || 0)) * n;

  // CET mensal = Taxa + (Encargos fixos / Principal / Meses)
  const cetMensal = taxa_contrato_am + totalEncargosFixos / P / n;

  // CET anual = (1 + CET_mensal)^12 - 1
  const cetAnual = Math.pow(1 + cetMensal, 12) - 1;



  // ========================================================================
  // 10. RETORNAR RESULTADO (formato esperado pela UI)
  // ========================================================================

  return {
    saldoTotal: P,
    taxaMediaCobrada: taxa_contrato_am,
    taxaMercado: taxa_bacen_am,
    sobretaxaPP: sobretaxa_pp,
    totalJurosCobrado: juros_contrato,
    totalJurosDevido: juros_bacen,
    diferencaRestituicao,
    totalEncargos: totalEncargosFixos,
    totalEncargosCobrados,
    totalEncargosDevidos,
    encargosAbusivos,
    cetMensal,
    cetAnual,
    anatocismoDetectado: true, // sempre true para juros compostos
    percentualAbuso: sobretaxa_percentual,
    mesesAnalise: n,
    formatted: {
      saldoTotal: `R$ ${P.toFixed(2)}`,
      taxaMediaCobrada: `${(taxa_contrato_am * 100).toFixed(4)}%`,
      taxaMercado: `${(taxa_bacen_am * 100).toFixed(4)}%`,
      sobretaxaPP: `${(sobretaxa_pp * 100).toFixed(2)} p.p.`,
      totalJurosCobrado: `R$ ${juros_contrato.toFixed(2)}`,
      totalJurosDevido: `R$ ${juros_bacen.toFixed(2)}`,
      diferencaRestituicao: `R$ ${diferencaRestituicao.toFixed(2)}`,
      totalEncargosCobrados: `R$ ${totalEncargosCobrados.toFixed(2)}`,
      totalEncargosDevidos: `R$ ${totalEncargosDevidos.toFixed(2)}`,
      cetMensal: `${(cetMensal * 100).toFixed(2)}%`,
      cetAnual: `${(cetAnual * 100).toFixed(2)}%`,
    },
  };
}

// ============================================================================
// RELATÓRIO COMPLETO (com tabela SAC)
// ============================================================================

/**
 * Gerar relatório completo com tabela de amortização SAC
 *
 * Sistema de Amortização Constante (SAC):
 * - Amortização fixa em cada mês: A = Principal / Meses
 * - Juros decrescentes sobre saldo devedor
 * - Parcela = Amortização + Juros
 *
 * Gera duas tabelas:
 * - Cenário contrato (com taxa cobrada)
 * - Cenário mercado (com taxa BACEN)
 *
 * @param params - Parâmetros da análise
 * @param analisePrevia - Resultado da análise prévia
 * @returns Relatório completo com tabela SAC e textos explicativos
 */
export function gerarRelatorioCompleto(
  params: AnaliseCartaoRequest,
  analisePrevia: AnaliseCartaoResponse
): RelatorioCompletoCartao {

  const P = params.valor_principal || params.saldo_devedor;
  const n_tabela = params.prazo_meses_simulacao || 24;
  const i_contrato = analisePrevia.taxaMediaCobrada;
  const i_bacen = analisePrevia.taxaMercado;


  // ========================================================================
  // SISTEMA SAC: Amortização Constante
  // ========================================================================

  // Amortização mensal fixa
  const A = P / n_tabela;

  const linhas: LinhaAmortizacaoSAC[] = [];
  let total_juros_contrato = 0;
  let total_juros_mercado = 0;

  // Gerar tabela mês a mês
  for (let k = 1; k <= n_tabela; k++) {
    // Saldo devedor inicial do mês k
    // Fórmula: SD_k = P - A × (k - 1)
    const SD_k = P - A * (k - 1);

    // Juros no cenário contrato
    // Fórmula: J_k_c = SD_k × i_contrato
    const J_k_c = SD_k * i_contrato;

    // Juros no cenário mercado (BACEN)
    // Fórmula: J_k_m = SD_k × i_bacen
    const J_k_m = SD_k * i_bacen;

    // Parcela no cenário contrato
    // Fórmula: Parcela_c = Amortização + Juros_contrato
    const parcela_original = A + J_k_c;

    // Parcela no cenário mercado
    // Fórmula: Parcela_m = Amortização + Juros_mercado
    const parcela_corrigida = A + J_k_m;

    // Saldo devedor final do mês (após pagar amortização)
    // Fórmula: SD_final = SD_k - A
    const SD_k_final = Math.max(0, SD_k - A);

    linhas.push({
      mes: k,
      parcela_original,
      parcela_corrigida,
      juros_contrato: J_k_c,
      juros_mercado: J_k_m,
      amortizacao: A,
      saldo_devedor: SD_k_final,
    });

    total_juros_contrato += J_k_c;
    total_juros_mercado += J_k_m;
  }


  // ========================================================================
  // CÁLCULO DE VALORES TOTAIS
  // ========================================================================

  const valor_total_contrato = P + total_juros_contrato;
  const valor_total_mercado = P + total_juros_mercado;
  const valor_a_restituir_simples = Math.max(0, total_juros_contrato - total_juros_mercado);
  const valor_a_restituir_dobro = 2 * valor_a_restituir_simples;


  // ========================================================================
  // GERAR TEXTOS EXPLICATIVOS
  // ========================================================================

  const resumo_executivo = `
ANÁLISE REVISIONAL DE CARTÃO DE CRÉDITO

Credor: ${params.credor}
Devedor: ${params.devedor}

VALORES ANALISADOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Valor principal analisado: R$ ${P.toFixed(2)}
Período de análise: ${analisePrevia.mesesAnalise} meses
Método: Sistema de Amortização Constante (SAC) - ${n_tabela} parcelas

TAXAS APLICADAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Taxa do contrato: ${(i_contrato * 100).toFixed(2)}% a.m.
Taxa média BACEN: ${(i_bacen * 100).toFixed(2)}% a.m.
Sobretaxa identificada: ${(analisePrevia.sobretaxaPP * 100).toFixed(2)} pontos percentuais
Percentual de abusividade: ${analisePrevia.percentualAbuso.toFixed(2)}%

CLASSIFICAÇÃO:
${analisePrevia.formatted?.sobretaxaPP && analisePrevia.sobretaxaPP > 0.001 ? '✓' : '○'} ${
    analisePrevia.sobretaxaPP > 0.001
      ? `Sobretaxa caracterizada (${(analisePrevia.sobretaxaPP * 100).toFixed(2)} p.p.)`
      : 'Nenhuma sobretaxa significativa'
  }

COMPARATIVO DE JUROS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de juros cobrado: R$ ${total_juros_contrato.toFixed(2)}
Total de juros devido (BACEN): R$ ${total_juros_mercado.toFixed(2)}
Diferença (cobrança indevida): R$ ${valor_a_restituir_simples.toFixed(2)}

VALORES DE RESTITUIÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Restituição simples: R$ ${valor_a_restituir_simples.toFixed(2)}
Restituição em dobro (CDC art. 42): R$ ${valor_a_restituir_dobro.toFixed(2)}

${
  analisePrevia.encargosAbusivos && analisePrevia.encargosAbusivos.length > 0
    ? `
IRREGULARIDADES DETECTADAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analisePrevia.encargosAbusivos.map((enc) => `• ${enc}`).join('\n')}
`
    : ''
}

OBSERVAÇÃO METODOLÓGICA:
Esta análise utiliza método macro agregado, sem reconstrução fatura a fatura.
Taxa BACEN fixa de ${(i_bacen * 100).toFixed(2)}% a.m. utilizada como referência de mercado.
Para análise mais precisa, recomenda-se reconstrução detalhada com histórico mensal completo.
  `.trim();

  const base_legal_metodologia = `
BASE LEGAL E METODOLOGIA

METODOLOGIA APLICADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Análise macro agregada de cartão de crédito
• Sistema de Amortização Constante (SAC) como modelo de referência
• Comparativo: Taxa contratual vs. Taxa média de mercado (BACEN)
• Período analisado: ${analisePrevia.mesesAnalise} meses
• Tabela de amortização: ${n_tabela} parcelas

CÁLCULO DE SOBRETAXA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Sobretaxa relativa: (Taxa_contrato / Taxa_BACEN) - 1
  Resultado: ${(analisePrevia.sobretaxaPP / i_bacen).toFixed(4)} = ${(
    (analisePrevia.sobretaxaPP / i_bacen) * 100
  ).toFixed(2)}%

• Sobretaxa em pontos percentuais: Taxa_contrato - Taxa_BACEN
  Resultado: ${(analisePrevia.sobretaxaPP * 100).toFixed(2)} p.p.

TAXA MÉDIA DE MERCADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Taxa BACEN utilizada: ${(i_bacen * 100).toFixed(2)}% a.m.
• Fonte: Banco Central do Brasil (valor de referência)
• Modalidade: Cartão de crédito rotativo

FÓRMULAS APLICADAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sistema SAC (Amortização Constante):
• Amortização mensal: A = Principal / Meses
• Juros no mês k: J_k = Saldo_k × Taxa
• Parcela no mês k: P_k = A + J_k
• Saldo final mês k: Saldo_k+1 = Saldo_k - A

Juros Compostos (análise macro):
• Montante = Principal × (1 + Taxa)^Meses
• Juros = Montante - Principal

BASE LEGAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Código de Defesa do Consumidor (Lei 8.078/90)
  Art. 42: Repetição de indébito em dobro

• Código Civil (Lei 10.406/02)
  Art. 591: Juros moratórios
  Art. 406: Taxa de juros
  Art. 884-886: Repetição do indébito

• Resolução CMN sobre taxas de mercado
  Banco Central - Taxas médias de operações de crédito

• Súmula 381 STJ: Anatocismo

LIMITAÇÕES DESTA ANÁLISE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ Análise macro agregada, sem histórico mensal detalhado de faturas
⚠ Taxa BACEN fixa utilizada como referência (não considera variações mensais)
⚠ Não inclui correção monetária (INPC/IPCA)
⚠ Valores aproximados para fins de triagem inicial

RECOMENDAÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para ação judicial, recomenda-se:
• Reconstrução fatura a fatura com extratos completos
• Aplicação de correção monetária (INPC) desde cada cobrança indevida
• Análise detalhada de cada encargo cobrado
• Perícia contábil para validação dos cálculos
  `.trim();


  return {
    linhas_amortizacao: linhas,
    valor_principal: P,
    total_juros_contrato,
    total_juros_mercado,
    valor_total_contrato,
    valor_total_mercado,
    valor_a_restituir_simples,
    valor_a_restituir_dobro,
    resumo_executivo,
    base_legal_metodologia,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  analisarCartaoPrevia,
  gerarRelatorioCompleto,
};
