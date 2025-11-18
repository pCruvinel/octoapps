/**
 * Tipos TypeScript para o motor de cálculo revisional SFH/SAC
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

/**
 * Faixa de taxa de juros por período
 */
export interface FaixaTaxa {
  ini: string; // Data inicial (YYYY-MM-DD)
  fim: string; // Data final (YYYY-MM-DD)
  i: number;   // Taxa mensal efetiva (decimal, ex: 0.005654145387)
}

/**
 * Série histórica de TR (Taxa Referencial)
 */
export interface TRSerie {
  data: string;  // Data de competência (YYYY-MM-DD)
  fator: number; // Fator de correção (ex: 1.001195)
}

/**
 * Encargos mensais da parcela
 */
export interface EncargosMensais {
  data: string;   // Data da parcela (YYYY-MM-DD)
  MIP: number;    // Mutuo de Imóvel Próprio
  DFI: number;    // Despesas de Formação e Intermediação
  TCA: number;    // Taxa de Custeio Administrativo
  multa: number;  // Multa moratória
  mora: number;   // Juros de mora
}

/**
 * Seguros médios para análise prévia
 */
export interface SegurosMedios {
  MIP: number;
  DFI: number;
  TCA: number;
}

// ============================================================================
// LINHA DA TABELA DE AMORTIZAÇÃO
// ============================================================================

/**
 * Linha individual da tabela de amortização
 */
export interface LinhaAmortizacao {
  mes: number;                    // Número da parcela (1, 2, 3...)
  data: string;                   // Data de vencimento (YYYY-MM-DD)
  valorOriginalParcela: number;   // Prestação básica (P_t = A + J_t)
  valorCorrigido: number;         // Valor corrigido (geralmente igual ao original no SAC)
  juros: number;                  // Juros do período (J_t)
  amortizacao: number;            // Amortização constante (A)
  saldoDevedor: number;           // Saldo devedor após amortização e TR (SD_t)

  // Campos opcionais para cenário cobrado
  MIP?: number;
  DFI?: number;
  TCA?: number;
  multa?: number;
  mora?: number;
  totalPago?: number;             // Total efetivamente pago (Pago_t)

  // Campos para comparativo
  diferenca?: number;             // D_t = Pago_t - P_t^{mkt}
}

// ============================================================================
// CENÁRIOS DE CÁLCULO
// ============================================================================

/**
 * Cenário AP01 - Cobrado (valores efetivamente cobrados do cliente)
 */
export interface CenarioAP01 {
  tipo: 'AP01';
  tabela: LinhaAmortizacao[];
  totais: {
    valorPrincipal: number;
    totalJuros: number;
    totalMIP: number;
    totalDFI: number;
    totalTCA: number;
    totalMulta: number;
    totalMora: number;
    totalTaxas: number;           // Soma de todos os encargos
    totalPago: number;            // PV + juros + taxas
  };
}

/**
 * Cenário AP05 - Devido (valores que deveriam ter sido cobrados)
 */
export interface CenarioAP05 {
  tipo: 'AP05';
  tabela: LinhaAmortizacao[];
  totais: {
    valorPrincipal: number;
    totalJuros: number;
    totalDevido: number;          // PV + juros (sem seguros)
  };
}

/**
 * Cenário AP03 - Comparativo (diferenças entre cobrado e devido)
 */
export interface CenarioAP03 {
  tipo: 'AP03';
  tabela: LinhaAmortizacao[];     // Contém campo 'diferenca' em cada linha
  totais: {
    totalRestituir: number;       // Soma das diferenças mensais
    taxaContratoAM: number;       // Taxa média do contrato (mensal)
    taxaMercadoAM: number;        // Taxa de mercado (mensal)
    sobretaxaPP: number;          // Diferença em pontos percentuais
  };
}

// ============================================================================
// REQUESTS E RESPONSES
// ============================================================================

/**
 * Request para análise prévia
 */
export interface AnalisePreviaRequest {
  pv: number;                     // Valor presente (principal)
  n: number;                      // Número de parcelas
  primeiroVenc: string;           // Data do primeiro vencimento (YYYY-MM-DD)
  taxaContratoMensal: number;     // Taxa mensal do contrato (decimal)
  taxaMercadoMensal: number;      // Taxa mensal de mercado (decimal)
  segurosMedios: SegurosMedios;   // Valores médios de seguros
  horizonteMeses?: number;        // Horizonte de análise (default: 12)
  trSeries?: TRSerie[];           // Série histórica de TR (opcional)
}

/**
 * Response da análise prévia
 */
export interface AnalisePreviaResponse {
  taxaContratoAM: number;         // Taxa mensal do contrato
  taxaMercadoAM: number;          // Taxa mensal de mercado
  sobretaxaPP: number;            // Sobretaxa em pontos percentuais
  valorTotalPago: number;         // Total pago no período analisado
  valorDevido: number;            // Total devido no período analisado
  diferencaRestituicao: number;   // Diferença (possível restituição)

  // Formatados para exibição
  formatted?: {
    taxaContratoAM: string;
    taxaMercadoAM: string;
    sobretaxaPP: string;
    valorTotalPago: string;
    valorDevido: string;
    diferencaRestituicao: string;
  };
}

/**
 * Request para relatório completo
 */
export interface RelatorioCompletoRequest {
  // Identificação
  credor: string;
  devedor: string;
  contratoNum: string;
  metodologia: string;

  // Parâmetros do financiamento
  pv: number;
  n: number;
  primeiroVenc: string;

  // Taxas e correção
  faixasTaxa: FaixaTaxa[];
  trSeries?: TRSerie[];
  taxaMercadoMensal: number;

  // Encargos
  encargosMensais?: EncargosMensais[];

  // Configuração do relatório
  horizonteMeses?: number;        // Número de meses a calcular (default: n)
  tabelaExibe: 'cobrado' | 'devido' | 'comparativo';
}

/**
 * Response do relatório completo
 */
export interface RelatorioCompletoResponse {
  // Identificação
  credor: string;
  devedor: string;
  contratoNum: string;
  metodologia: string;

  // Cards de resumo
  cards: {
    valorPrincipal: number;
    totalJuros: number;
    totalTaxas: number;
    valorTotalDevido: number;
    totalRestituir: number;
  };

  // Comparativo de taxas
  comparativo: {
    taxaContratoAM: number;
    taxaMercadoAM: number;
    sobretaxaPP: number;
  };

  // Tabela de amortização (conforme solicitado)
  tabelaAmortizacao: LinhaAmortizacao[];

  // Formatados para exibição
  formatted?: {
    cards: {
      valorPrincipal: string;
      totalJuros: string;
      totalTaxas: string;
      valorTotalDevido: string;
      totalRestituir: string;
    };
    comparativo: {
      taxaContratoAM: string;
      taxaMercadoAM: string;
      sobretaxaPP: string;
    };
  };
}

// ============================================================================
// PARÂMETROS INTERNOS DO MOTOR DE CÁLCULO
// ============================================================================

/**
 * Parâmetros para geração de cenário SAC
 */
export interface ParametrosSAC {
  pv: number;                     // Valor presente
  n: number;                      // Número de parcelas
  primeiroVenc: string;           // Data da primeira parcela
  faixasTaxa: FaixaTaxa[];        // Faixas de taxa por período
  trSeries?: TRSerie[];           // Série de TR (opcional)
  encargosMensais?: EncargosMensais[]; // Encargos por mês (opcional)
  horizonteMeses?: number;        // Limite de meses a calcular
}

/**
 * Resultado interno do cálculo SAC
 */
export interface ResultadoSAC {
  tabela: LinhaAmortizacao[];
  amortizacaoConstante: number;   // Valor de A
  totalJuros: number;
  totalPrincipal: number;
  saldoFinal: number;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Formatação de valores
 */
export interface FormatOptions {
  locale?: string;
  currency?: string;
  decimals?: number;
}

/**
 * Erro customizado para validações
 */
export class CalculationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CalculationError';
  }
}
