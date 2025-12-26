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
  reducaoEstimadaSimples: number; // Redução estimada juros simples
  reducaoEstimadaMedia: number;   // Redução estimada média

  // Informações para projeção
  horizonteMeses?: number;        // Horizonte de meses analisado
  totalParcelas?: number;         // Total de parcelas do contrato (n)

  // Formatados para exibição
  formatted?: {
    taxaContratoAM: string;
    taxaMercadoAM: string;
    sobretaxaPP: string;
    reducaoEstimadaSimples: string;
    reducaoEstimadaMedia: string;
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

// ============================================================================
// TIPOS PARA CARTÃO DE CRÉDITO
// ============================================================================

/**
 * Operação de parcelamento em um cartão
 */
export interface Parcelamento {
  descricao: string;
  valor: number;
  parcelas: number;
  taxa?: number; // Taxa mensal (decimal)
}

/**
 * Operação de saque em espécie
 */
export interface SaqueEspecie {
  data: string; // YYYY-MM-DD
  valor: number;
  taxaSaque?: number; // Taxa da operação
  iof?: number;
}

/**
 * Estorno ou ajuste na fatura
 */
export interface EstornoAjuste {
  data: string; // YYYY-MM-DD
  valor: number;
  tipo: 'Estorno' | 'Ajuste' | 'Crédito' | 'Débito';
  descricao: string;
}

/**
 * Renegociação de dívida do cartão
 */
export interface Renegociacao {
  data: string; // YYYY-MM-DD
  valorOriginal: number;
  valorRenegociado: number;
  novasParcelas: number;
  taxaNegociada?: number;
}

/**
 * Outras tarifas cobradas
 */
export interface OutraTarifa {
  descricao: string;
  valor: number;
}

/**
 * Fatura individual do cartão
 */
export interface CartaoFatura {
  id: string;
  cartaoId: string;

  // Identificação da fatura
  mesReferencia: number; // 1-12
  anoReferencia: number;
  dataVencimento: string; // YYYY-MM-DD
  dataFechamento?: string;

  // Valores
  saldoAnterior: number;
  comprasNacionais: number;
  comprasInternacionais: number;
  saques: number;
  jurosRotativo: number;
  jurosParcelamento: number;
  jurosMora: number;
  multa: number;
  iof: number;
  anuidade: number;
  seguros: number;
  tarifas: number;
  estornos: number;
  pagamentos: number;
  totalFatura: number;
  pagamentoMinimo: number;

  // Status
  statusPagamento: 'Pendente' | 'Pago Integral' | 'Pago Parcial' | 'Não Pago' | 'Em Atraso';
  valorPago?: number;
  dataPagamento?: string;

  criadoEm: string;
}

/**
 * Dados completos de um cartão de crédito
 */
export interface CartaoCredito {
  // Identificação
  id: string;
  contatoId?: string;
  projetoId?: string;
  credor: string;
  devedor: string;
  numeroCartao?: string; // Últimos 4 dígitos
  numeroProcesso?: string;

  // Limites e Saldos
  limiteTotal?: number;
  limiteDisponivel?: number;
  saldoDevedor: number;
  saldoAnterior?: number;
  saldoFinanciado?: number;

  // Datas
  dataInicioAnalise?: string; // YYYY-MM-DD
  dataUltimaFatura?: string;
  dataPagamento?: string;
  diaVencimento?: number; // 1-31
  dataCalculo: string;

  // Valores da Fatura Analisada
  totalFatura?: number;
  pagamentoMinimo?: number;
  consumosDespesas?: number;

  // Operações (JSONB no banco, arrays aqui)
  parcelamentos: Parcelamento[];
  saquesEspecie: SaqueEspecie[];
  estornosAjustes: EstornoAjuste[];
  renegociacoes: Renegociacao[];

  // Taxas de Juros (armazenadas como decimal: 0.1299 = 12.99%)
  jurosRemuneratoriosAtraso?: number;
  jurosRotativo: number;
  taxaJurosParcelamento?: number;
  jurosMora?: number;
  multaInadimplencia?: number;

  // CET
  cetMensal?: number;
  cetAnual?: number;

  // Encargos e Tarifas
  anuidade: number;
  seguro: number;
  iof: number;
  tarifas: number;
  outrasTarifas: OutraTarifa[];

  // Dies de Mora
  diesMora: number;

  // Resultados Calculados
  totalJurosCobrado?: number;
  totalJurosDevido?: number;
  diferencaRestituicao?: number;
  taxaEfetivaMensal?: number;
  taxaEfetivaAnual?: number;
  valorTotalPago?: number;
  valorTotalDevido?: number;
  percentualSobretaxa?: number;

  // Análise de Abusividade
  anatocismoDetectado: boolean;
  encargosAbusivos: string[];

  // Status e Controle
  status: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado';
  observacoes?: string;

  // Auditoria
  criadoPor?: string;
  calculadoPor?: string;
  revisadoPor?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  dataRevisao?: string;

  // Soft Delete
  ativo: boolean;
  excluido: boolean;
  excluidoEm?: string;
  excluidoPor?: string;
}

/**
 * Dados para inserir um novo cartão (campos obrigatórios)
 */
export interface CartaoCreditoInsert {
  credor: string;
  devedor: string;
  saldoDevedor: number;
  jurosRotativo: number;

  // Opcionais mas recomendados
  numeroCartao?: string;
  numeroProcesso?: string;
  limiteTotal?: number;
  limiteDisponivel?: number;
  diaVencimento?: number;
  dataInicioAnalise?: string;
  dataUltimaFatura?: string;
  totalFatura?: number;
  pagamentoMinimo?: number;

  // Arrays (podem ser vazios)
  parcelamentos?: Parcelamento[];
  saquesEspecie?: SaqueEspecie[];
  estornosAjustes?: EstornoAjuste[];
  renegociacoes?: Renegociacao[];

  // Taxas
  jurosRemuneratoriosAtraso?: number;
  taxaJurosParcelamento?: number;
  jurosMora?: number;
  multaInadimplencia?: number;

  // Encargos
  anuidade?: number;
  seguro?: number;
  iof?: number;
  tarifas?: number;
  outrasTarifas?: OutraTarifa[];

  diesMora?: number;
  observacoes?: string;
  criadoPor?: string;
}

/**
 * Dados para atualizar um cartão existente
 */
export interface CartaoCreditoUpdate {
  credor?: string;
  devedor?: string;
  numeroCartao?: string;
  numeroProcesso?: string;

  limiteTotal?: number;
  limiteDisponivel?: number;
  saldoDevedor?: number;
  saldoAnterior?: number;

  dataInicioAnalise?: string;
  dataUltimaFatura?: string;
  dataPagamento?: string;
  diaVencimento?: number;

  totalFatura?: number;
  pagamentoMinimo?: number;
  consumosDespesas?: number;

  parcelamentos?: Parcelamento[];
  saquesEspecie?: SaqueEspecie[];
  estornosAjustes?: EstornoAjuste[];
  renegociacoes?: Renegociacao[];

  jurosRemuneratoriosAtraso?: number;
  jurosRotativo?: number;
  taxaJurosParcelamento?: number;
  jurosMora?: number;
  multaInadimplencia?: number;

  cetMensal?: number;
  cetAnual?: number;

  anuidade?: number;
  seguro?: number;
  iof?: number;
  tarifas?: number;
  outrasTarifas?: OutraTarifa[];

  diesMora?: number;

  // Resultados calculados
  totalJurosCobrado?: number;
  totalJurosDevido?: number;
  diferencaRestituicao?: number;
  taxaEfetivaMensal?: number;
  taxaEfetivaAnual?: number;
  valorTotalPago?: number;
  valorTotalDevido?: number;
  percentualSobretaxa?: number;

  anatocismoDetectado?: boolean;
  encargosAbusivos?: string[];

  status?: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado';
  observacoes?: string;

  calculadoPor?: string;
  revisadoPor?: string;
}

/**
 * Dados para inserir uma fatura
 */
export interface FaturaInsert {
  cartaoId: string;
  mesReferencia: number;
  anoReferencia: number;
  dataVencimento: string;
  dataFechamento?: string;

  saldoAnterior: number;
  comprasNacionais?: number;
  comprasInternacionais?: number;
  saques?: number;
  jurosRotativo?: number;
  jurosParcelamento?: number;
  jurosMora?: number;
  multa?: number;
  iof?: number;
  anuidade?: number;
  seguros?: number;
  tarifas?: number;
  estornos?: number;
  pagamentos?: number;
  totalFatura: number;
  pagamentoMinimo: number;

  statusPagamento: 'Pendente' | 'Pago Integral' | 'Pago Parcial' | 'Não Pago' | 'Em Atraso';
  valorPago?: number;
  dataPagamento?: string;
}

// ============================================================================
// CÁLCULOS PARA CARTÃO DE CRÉDITO
// ============================================================================

/**
 * Request para cálculo de juros rotativos
 */
export interface CalculoJurosRotativosRequest {
  saldoDevedor: number;
  taxaMensalCobrada: number; // Decimal (ex: 0.1299 = 12.99%)
  taxaMensalMercado: number; // Decimal
  numeroParcelas: number; // Número de meses a projetar
  pagamentoMinimoPct?: number; // % do pagamento mínimo (padrão: 0.15 = 15%)
}

/**
 * Linha da tabela de evolução do saldo rotativo
 */
export interface LinhaJurosRotativos {
  mes: number;
  saldoInicial: number;
  juros: number;
  pagamentoMinimo: number;
  saldoFinal: number;
}

/**
 * Response do cálculo de juros rotativos
 */
export interface CalculoJurosRotativosResponse {
  // Cenário Cobrado
  cenarioCobrado: {
    tabela: LinhaJurosRotativos[];
    totalJuros: number;
    totalPago: number;
    saldoFinal: number;
  };

  // Cenário Devido (com taxa de mercado)
  cenarioDevido: {
    tabela: LinhaJurosRotativos[];
    totalJuros: number;
    totalPago: number;
    saldoFinal: number;
  };

  // Comparativo
  comparativo: {
    diferencaJuros: number;
    diferencaTotal: number;
    taxaCobradaMensal: number;
    taxaMercadoMensal: number;
    sobretaxaPP: number;
    percentualAbuso: number; // % de sobretaxa
  };
}

/**
 * Request para cálculo de parcelamento de fatura
 */
export interface CalculoParcelamentoFaturaRequest {
  valorParcelado: number;
  numeroParcelas: number;
  taxaMensalCobrada: number;
  taxaMensalMercado: number;
  dataInicio: string; // YYYY-MM-DD
}

/**
 * Linha da tabela de parcelamento
 */
export interface LinhaParcelamento {
  mes: number;
  data: string;
  valorParcela: number;
  juros: number;
  amortizacao: number;
  saldoDevedor: number;
}

/**
 * Response do cálculo de parcelamento de fatura
 */
export interface CalculoParcelamentoFaturaResponse {
  // Cenário Cobrado
  cenarioCobrado: {
    tabela: LinhaParcelamento[];
    valorParcela: number; // Parcela fixa (PRICE)
    totalJuros: number;
    totalPago: number;
  };

  // Cenário Devido
  cenarioDevido: {
    tabela: LinhaParcelamento[];
    valorParcela: number;
    totalJuros: number;
    totalPago: number;
  };

  // Comparativo
  comparativo: {
    diferencaParcela: number;
    diferencaJuros: number;
    diferencaTotal: number;
    taxaCobradaMensal: number;
    taxaMercadoMensal: number;
    sobretaxaPP: number;
  };
}

/**
 * Request para análise prévia de cartão
 */
export interface AnaliseCartaoRequest {
  saldoDevedor: number;
  jurosRotativo: number;
  taxaMercadoMensal: number;

  // Opcional: análise de parcelamentos
  parcelamentos?: Array<{
    valor: number;
    parcelas: number;
    taxa: number;
  }>;

  // Opcional: encargos extras
  anuidade?: number;
  seguros?: number;
  tarifas?: number;

  // NOVOS: Encargos adicionais (mora, multa, IOF)
  jurosMoraPercentual?: number;  // % de juros de mora (ex: 1 = 1% ou 0.01 = 1%)
  multaPercentual?: number;      // % de multa (ex: 2 = 2% ou 0.02 = 2%)
  iofValor?: number;             // Valor em R$ de IOF cobrado
  consumosDespesas?: number;     // Total de consumos no período
  totalFatura?: number;          // Total da fatura

  // Horizonte de análise
  mesesAnalise?: number; // Default: 12
}

/**
 * Response da análise prévia de cartão
 */
export interface AnaliseCartaoResponse {
  // Resumo
  saldoTotal: number;
  taxaMediaCobrada: number;
  taxaMercado: number;
  sobretaxaPP: number;

  // Valores projetados
  totalJurosCobrado: number;
  totalJurosDevido: number;
  diferencaRestituicao: number;

  // Encargos
  totalEncargos: number;
  encargosAbusivos: string[];

  // NOVOS: Encargos totais discriminados
  totalEncargosCobrados: number;  // Juros + Mora + Multa + IOF
  totalEncargosDevidos: number;   // Apenas juros com taxa BACEN

  // CET
  cetMensal: number;
  cetAnual: number;

  // Indicadores de abusividade
  anatocismoDetectado: boolean;
  percentualAbuso: number; // % acima do mercado

  // Formatados para exibição
  formatted?: {
    saldoTotal: string;
    taxaMediaCobrada: string;
    taxaMercado: string;
    sobretaxaPP: string;
    totalJurosCobrado: string;
    totalJurosDevido: string;
    diferencaRestituicao: string;
    totalEncargosCobrados: string;  // NOVO
    totalEncargosDevidos: string;   // NOVO
    cetMensal: string;
    cetAnual: string;
  };
}

// ============================================================================
// TIPOS PARA EMPRÉSTIMOS E FINANCIAMENTOS
// ============================================================================

/**
 * Tipos de empréstimo
 */
export type TipoEmprestimo =
  | 'Pessoal'
  | 'Consignado'
  | 'Capital de Giro'
  | 'Veículo'
  | 'Imobiliário'
  | 'Outro';

/**
 * Sistema de amortização
 */
export type SistemaAmortizacao =
  | 'PRICE'      // Parcelas fixas
  | 'SAC'        // Amortização constante
  | 'SACRE'      // Sistema misto
  | 'AMERICANO'  // Pagamento único no final
  | 'CUSTOM';    // Personalizado

/**
 * Índice de correção monetária
 */
export type IndiceCorrecao =
  | 'NENHUM'
  | 'TR'
  | 'IPCA'
  | 'INPC'
  | 'IGP-M'
  | 'SELIC'
  | 'CDI';

/**
 * Tipo de cenário na tabela de amortização
 */
export type TipoCenario =
  | 'Cobrado'      // Valores efetivamente cobrados
  | 'Devido'       // Valores que deveriam ter sido cobrados
  | 'Comparativo'; // Diferenças

/**
 * Outras tarifas cobradas
 */
export interface OutraTarifaEmprestimo {
  descricao: string;
  valor: number;
  recorrente?: boolean; // Se é cobrada mensalmente
}

/**
 * Linha da tabela de amortização de empréstimo
 */
export interface LinhaAmortizacaoEmprestimo {
  mes: number;
  dataVencimento: string; // YYYY-MM-DD
  saldoDevedorInicial: number; // Saldo devedor no início do período
  valorParcela: number;
  juros: number;
  amortizacao: number;
  saldoDevedor: number; // Saldo devedor no final do período

  // Correção monetária (se aplicável)
  indiceCorrecao?: number;
  valorCorrigido?: number;

  // Encargos da parcela
  seguroPrestamista?: number;
  iof?: number;
  tarifas?: number;

  // Total
  totalParcela?: number;

  // Para comparativo
  diferenca?: number;
}

/**
 * Dados completos de um empréstimo
 */
export interface Emprestimo {
  // Identificação
  id: string;
  contatoId?: string;
  projetoId?: string;
  credor: string;
  devedor: string;
  contratoNum?: string;
  numeroProcesso?: string;

  // Tipo
  tipoEmprestimo: TipoEmprestimo;

  // Valores principais
  totalFinanciado: number;
  valorParcela?: number;
  quantidadeParcelas: number;

  // Datas
  dataContrato?: string; // YYYY-MM-DD
  dataPrimeiraParcela: string;
  dataLiberacao?: string;
  dataCalculo: string;

  // Sistema
  sistemaAmortizacao: SistemaAmortizacao;

  // Indexadores
  indiceCorrecao: IndiceCorrecao;
  percentualIndexador?: number;

  // Taxas (armazenadas como decimal: 0.01 = 1%)
  taxaMensalContrato: number;
  taxaAnualContrato?: number;
  taxaMensalMercado?: number;
  taxaJurosMora?: number;
  multaAtraso?: number;
  cdi?: number; // Percentual do CDI (ex: 1.00 = 100% CDI)

  // Encargos iniciais
  tac?: number; // VEDADA
  tec?: number; // VEDADA
  tarifaCadastro?: number;
  tarifaAvaliacaoBem?: number;
  tarifaRegistroContrato?: number;
  despesasRegistro?: number;

  // Seguros e comissões
  seguroPrestamista?: number;
  seguroProtecaoFinanceira?: number;
  seguroDesemprego?: number;
  seguros?: number; // Outros seguros não categorizados
  comissaoFlat?: number;
  tarifas?: number; // Outras tarifas não categorizadas
  outrasTarifas: OutraTarifaEmprestimo[];

  // IOF
  iofPrincipal?: number;
  iofAdicional?: number;

  // Outros encargos
  outrosEncargos?: number; // Encargos não categorizados

  // CET
  cetMensal?: number;
  cetAnual?: number;

  // Resultados calculados
  totalJurosCobrado?: number;
  totalJurosDevido?: number;
  totalEncargos?: number;
  valorTotalPago?: number;
  valorTotalDevido?: number;
  diferencaRestituicao?: number;
  sobretaxaPP?: number;

  // Irregularidades
  tacTecIrregular?: boolean;
  segurosIrregulares?: boolean;
  comissaoPermanenciaIrregular?: boolean;
  encargosIrregulares: string[];

  // Observações
  observacoes?: string;

  // Status
  status: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado';

  // Auditoria
  criadoPor?: string;
  calculadoPor?: string;
  revisadoPor?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  dataRevisao?: string;

  // Soft delete
  ativo: boolean;
  excluido: boolean;
  excluidoEm?: string;
  excluidoPor?: string;
}

/**
 * Dados para inserir um novo empréstimo
 */
export interface EmprestimoInsert {
  credor: string;
  devedor: string;
  tipoEmprestimo: TipoEmprestimo;
  totalFinanciado: number;
  quantidadeParcelas: number;
  dataPrimeiraParcela: string;
  taxaMensalContrato: number;
  sistemaAmortizacao?: SistemaAmortizacao;

  // Opcionais
  contratoNum?: string;
  numeroProcesso?: string;
  dataContrato?: string;
  dataLiberacao?: string;
  valorParcela?: number;
  taxaAnualContrato?: number;
  taxaMensalMercado?: number;
  taxaJurosMora?: number;
  multaAtraso?: number;
  cdi?: number;
  indiceCorrecao?: IndiceCorrecao;
  percentualIndexador?: number;

  // Encargos
  tac?: number;
  tec?: number;
  tarifaCadastro?: number;
  tarifaAvaliacaoBem?: number;
  tarifaRegistroContrato?: number;
  despesasRegistro?: number;
  seguroPrestamista?: number;
  seguroProtecaoFinanceira?: number;
  seguroDesemprego?: number;
  seguros?: number;
  comissaoFlat?: number;
  tarifas?: number;
  outrasTarifas?: OutraTarifaEmprestimo[];
  iofPrincipal?: number;
  iofAdicional?: number;
  outrosEncargos?: number;

  observacoes?: string;
  criadoPor?: string;
  dataCalculo?: string;
}

/**
 * Dados para atualizar um empréstimo existente
 */
export interface EmprestimoUpdate {
  credor?: string;
  devedor?: string;
  contratoNum?: string;
  numeroProcesso?: string;
  tipoEmprestimo?: TipoEmprestimo;
  totalFinanciado?: number;
  valorParcela?: number;
  quantidadeParcelas?: number;
  dataContrato?: string;
  dataPrimeiraParcela?: string;
  dataLiberacao?: string;
  sistemaAmortizacao?: SistemaAmortizacao;
  indiceCorrecao?: IndiceCorrecao;
  percentualIndexador?: number;

  taxaMensalContrato?: number;
  taxaAnualContrato?: number;
  taxaMensalMercado?: number;
  taxaJurosMora?: number;
  multaAtraso?: number;
  cdi?: number;
  dataCalculo?: string;

  tac?: number;
  tec?: number;
  tarifaCadastro?: number;
  tarifaAvaliacaoBem?: number;
  tarifaRegistroContrato?: number;
  despesasRegistro?: number;

  seguroPrestamista?: number;
  seguroProtecaoFinanceira?: number;
  seguroDesemprego?: number;
  seguros?: number;
  comissaoFlat?: number;
  tarifas?: number;
  outrasTarifas?: OutraTarifaEmprestimo[];

  iofPrincipal?: number;
  iofAdicional?: number;
  outrosEncargos?: number;

  cetMensal?: number;
  cetAnual?: number;

  totalJurosCobrado?: number;
  totalJurosDevido?: number;
  totalEncargos?: number;
  valorTotalPago?: number;
  valorTotalDevido?: number;
  diferencaRestituicao?: number;
  sobretaxaPP?: number;

  tacTecIrregular?: boolean;
  segurosIrregulares?: boolean;
  comissaoPermanenciaIrregular?: boolean;
  encargosIrregulares?: string[];

  status?: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado';
  observacoes?: string;
  calculadoPor?: string;
  revisadoPor?: string;
}

/**
 * Request para cálculo de empréstimo (Sistema PRICE)
 */
export interface CalculoEmprestimoPRICERequest {
  valorFinanciado: number;
  numeroParcelas: number;
  taxaMensalCobrada: number;
  taxaMensalMercado: number;
  dataInicio: string; // YYYY-MM-DD (data da primeira parcela)
  dataLiberacao?: string; // YYYY-MM-DD (data da liberação do crédito) - para cálculo de carência

  // Encargos opcionais
  encargosIniciais?: {
    tac?: number;
    tec?: number;
    cadastro?: number;
    avaliacao?: number;
    registro?: number;
    iof?: number;
  };

  encargosRecorrentes?: {
    seguroPrestamista?: number; // Por parcela
    tarifas?: number; // Por parcela
  };
}

/**
 * Response do cálculo de empréstimo PRICE
 */
export interface CalculoEmprestimoPRICEResponse {
  // Cenário cobrado
  cenarioCobrado: {
    tabela: LinhaAmortizacaoEmprestimo[];
    valorParcela: number;
    totalJuros: number;
    totalEncargos: number;
    totalPago: number;
  };

  // Cenário devido
  cenarioDevido: {
    tabela: LinhaAmortizacaoEmprestimo[];
    valorParcela: number;
    totalJuros: number;
    totalEncargos: number;
    totalPago: number;
  };

  // Comparativo
  comparativo: {
    diferencaParcela: number;
    diferencaJuros: number;
    diferencaEncargos: number;
    diferencaTotal: number;
    taxaCobradaMensal: number;
    taxaMercadoMensal: number;
    sobretaxaPP: number;
  };

  // CET
  cet: {
    cetMensalCobrado: number;
    cetAnualCobrado: number;
    cetMensalDevido: number;
    cetAnualDevido: number;
  };

  // Carência (opcional - só existe se dataLiberacao foi fornecida)
  carencia?: {
    diasCarencia: number;
    jurosCarencia: number;
    valorFinanciadoAjustado: number;
  };
}

/**
 * Request para análise prévia de empréstimo
 */
export interface AnaliseEmprestimoRequest {
  valorFinanciado: number;
  numeroParcelas: number;
  taxaMensalCobrada?: number;
  taxaMensalMercado?: number;
  // Aliases para compatibilidade com testes
  taxaMensal?: number;
  taxaMercadoMensal?: number;
  sistemaAmortizacao?: SistemaAmortizacao;
  dataContrato?: string;

  // Encargos
  encargosIniciais?: number;
  encargosRecorrentes?: number;

  // Horizonte
  mesesAnalise?: number; // Default: numeroParcelas
}

/**
 * Response da análise prévia de empréstimo
 */
export interface AnaliseEmprestimoResponse {
  valorFinanciado: number;
  numeroParcelas: number;
  sistemaAmortizacao: SistemaAmortizacao;

  // Taxas
  taxaCobradaMensal: number;
  taxaMercadoMensal: number;
  sobretaxaPP: number;
  percentualAbuso: number;

  // Valores
  valorParcela: number;
  totalJurosCobrado: number;
  totalJurosDevido: number;
  totalEncargos: number;
  diferencaRestituicao: number;

  // CET
  cetMensal: number;
  cetAnual: number;

  // Irregularidades
  encargosIrregulares: string[];
  tacTecIrregular: boolean;

  // Formatados
  formatted?: {
    valorFinanciado: string;
    valorParcela: string;
    taxaCobradaMensal: string;
    taxaMercadoMensal: string;
    sobretaxaPP: string;
    totalJurosCobrado: string;
    totalJurosDevido: string;
    diferencaRestituicao: string;
    cetMensal: string;
    cetAnual: string;
  };
}

// ============================================================================
// CÁLCULO DETALHADO (PERÍCIA CONTÁBIL)
// ============================================================================

/**
 * Modalidades de Crédito com mapeamento para séries SGS BACEN
 */
export type ModalidadeCredito =
  | 'AQUISICAO_VEICULOS_PF'
  | 'AQUISICAO_VEICULOS_PJ'
  | 'EMPRESTIMO_PESSOAL'
  | 'CONSIGNADO_PRIVADO'
  | 'CONSIGNADO_PUBLICO'
  | 'CONSIGNADO_INSS'
  | 'CAPITAL_GIRO_ATE_365'
  | 'CAPITAL_GIRO_ACIMA_365'
  | 'CHEQUE_ESPECIAL'
  | 'CARTAO_ROTATIVO'
  | 'IMOBILIARIO_SFH'
  | 'IMOBILIARIO_SFI';

/**
 * Indexadores de correção monetária
 */
export type IndexadorCorrecao = 'TR' | 'IPCA' | 'INPC' | 'IGPM' | 'NENHUM';

/**
 * Regra de defasagem para índices de correção
 * - MES_CHEIO_ANTERIOR: Usa o índice do mês anterior completo (padrão)
 * - DEFASAGEM_2_MESES: Usa o índice de 2 meses atrás
 * - ACUMULADO_12_MESES: Usa o índice acumulado dos últimos 12 meses
 */
export type RegraDefasagemIndice =
  | 'MES_CHEIO_ANTERIOR'
  | 'DEFASAGEM_2_MESES'
  | 'ACUMULADO_12_MESES';

/**
 * Override para edição manual do perito
 * Permite ajustar parcelas específicas (amortização extra, pagamento parcial, renegociação)
 */
export interface OverrideParcela {
  numeroParcela: number;
  tipo: 'AMORTIZACAO_EXTRA' | 'PAGAMENTO_PARCIAL' | 'RENEGOCIACAO' | 'SKIP_PARCELA';
  novoValor?: number;          // Valor efetivamente pago (se diferente do esperado)
  novaData?: string;           // YYYY-MM-DD (se antecipação/atraso)
  amortizacaoExtra?: number;   // Valor de FGTS, 13º, etc.
  observacao?: string;         // Justificativa do perito
}

/**
 * Tarifa individual para expurgo
 */
export interface TarifaExpurgo {
  nome: string;
  valor: number;
  expurgar: boolean;
  justificativa?: string;
}

/**
 * Request para cálculo detalhado (perícia)
 */
export interface CalculoDetalhadoRequest {
  // Identificação do Contrato
  credor: string;
  devedor: string;
  contratoNumero: string;

  // Dados Financeiros (Herança da Triagem)
  valorFinanciado: number;
  prazoMeses: number;
  taxaContratoMensal: number;
  taxaContratoAnual: number;

  /** Valor da parcela cobrada pelo banco (informado pelo cliente) */
  valorParcelaCobrada?: number;

  // Datas
  dataContrato: string;           // YYYY-MM-DD
  dataLiberacao?: string;         // YYYY-MM-DD (para carência)
  dataPrimeiroVencimento: string; // YYYY-MM-DD

  // Sistema e Capitalização
  sistemaAmortizacao: 'SAC' | 'PRICE' | 'SACRE';
  capitalizacao: 'MENSAL' | 'DIARIA';

  // Exclusivos do Cálculo Detalhado
  modalidade: ModalidadeCredito;
  indexador: IndexadorCorrecao;
  regraDefasagem?: RegraDefasagemIndice; // Default: MES_CHEIO_ANTERIOR

  // Seguros (valores mensais ou totais)
  seguroMIP?: number;
  seguroMIPTipo?: 'FIXO' | 'PERCENTUAL_SALDO';
  seguroDFI?: number;
  seguroDFITipo?: 'FIXO' | 'PERCENTUAL_IMOVEL';
  taxaAdministrativa?: number;

  // Tarifas
  tarifaTAC?: number;
  tarifaAvaliacao?: number;
  tarifaRegistro?: number;
  outrasTarifas?: TarifaExpurgo[];

  // Overrides (Edição Manual) - Persistidos em JSONB
  overrides?: OverrideParcela[];

  // Configuração do Cálculo
  usarTaxaBacen: boolean;
  usarJurosSimples: boolean;      // Método Gauss
  expurgarTarifas: boolean;
  restituicaoEmDobro: boolean;    // Art. 42 CDC

  // Empréstimo Pessoal & Veículos
  valorBem?: number;              // Valor do bem (Veículo)
  valorEntrada?: number;          // Valor da entrada (Veículo)

  // Valor do Imóvel (para DFI percentual - Mantido para compatibilidade SFH)
  valorImovel?: number;

  // NEW: Data do cálculo (para classificar PAGA/VENCIDA/VINCENDA)
  dataCalculo?: string;             // YYYY-MM-DD (default: data atual)

  // NEW: Encargos Moratórios (para período de atraso)
  jurosMora?: number;               // Padrão: 1% a.m. (Art. 406 CC)
  multaMoratoria?: number;          // Padrão: 2% (Art. 52 §1º CDC)
  encargosIncidirSobrePrincipalCorrigido?: boolean; // Se true, incide sobre principal + correção

  // NEW: Dados de conciliação (do perito)
  conciliacao?: Array<{
    numeroParcela: number;
    dataPagamento?: string;         // YYYY-MM-DD
    valorPago?: number;
    isPago: boolean;                // Confirmado pelo perito
  }>;
}

/**
 * Situação da parcela baseada na Data do Cálculo
 */
export type SituacaoParcela = 'PAGA' | 'VENCIDA' | 'VINCENDA';

/**
 * Linha da tabela de amortização detalhada (para apêndices)
 */
export interface LinhaAmortizacaoDetalhada {
  mes: number;
  data: string;                    // YYYY-MM-DD

  // Evolução do Saldo
  saldoAbertura: number;
  indiceCorrecao?: number;         // Valor do índice (TR, IPCA, etc.)
  correcaoMonetaria?: number;      // Valor monetário da correção
  saldoCorrigido?: number;         // Saldo após correção

  // Componentes da Parcela
  juros: number;
  amortizacao: number;
  saldoDevedor: number;            // Saldo após amortização

  // Encargos
  seguroMIP?: number;
  seguroDFI?: number;
  taxaAdm?: number;
  multa?: number;
  mora?: number;

  // Totais
  parcelaBase: number;             // Amortização + Juros
  parcelaTotal: number;            // + Seguros + Taxas

  // Comparativo (para AP03)
  jurosMercado?: number;
  parcelaMercado?: number;
  diferenca: number;
  diferencaAcumulada: number;

  // NEW: Campos técnicos XTIR (AP01)
  diasEntreParcelas?: number;      // Dias desde última parcela
  fatorNaoPeriodico?: number;      // Fator NP = (1+i)^(dias/30)
  quocienteXTIR?: number;          // Quociente = parcela / saldoDevedor

  // NEW: Campos específicos para Capitalização Diária (AP01)
  diasAcumulados?: number;         // Dias corridos desde liberação até vencimento
  quocienteDiario?: number;        // Quociente = 1 / (1 + taxa)^(diasAcumulados/30)

  // NEW: Situação da parcela (AP03)
  situacao?: SituacaoParcela;      // PAGA, VENCIDA, VINCENDA
  valorPago?: number;              // Valor efetivamente pago (AP01)
  valorDevido?: number;            // Valor que deveria ser pago (AP02)

  // NEW: Compensação mensal (AP04/AP05)
  amortizacaoCompensada?: number;  // Amortização + diferença absorvida
  saldoDevedorCompensado?: number; // Saldo após compensação
  saldoCredor?: number;            // Saldo credor (quando negativo)
  quitacaoAntecipada?: boolean;    // Flag para linha onde dívida foi quitada

  // Status e Override
  status: 'PAGO' | 'PENDENTE' | 'OVERRIDE' | 'PROJETADO';
  override?: OverrideParcela;
}

/**
 * Totais de um apêndice
 */
export interface ApendiceTotal {
  principal: number;
  totalCorrecao: number;
  totalJuros: number;
  totalSeguros: number;
  totalTarifas: number;
  totalPago: number;
  totalDevido: number;
  totalDiferenca: number;
  totalRestituir: number;
}

/**
 * Resultado de um apêndice individual
 */
export interface ApendiceResult {
  tipo: 'AP01' | 'AP02' | 'AP03' | 'AP04' | 'AP05' | 'AP06' | 'AP07';
  titulo: string;
  descricao: string;
  tabela: LinhaAmortizacaoDetalhada[];
  totais: ApendiceTotal;
}

/**
 * Snapshot da taxa BACEN para auditoria
 */
export interface TaxaSnapshot {
  serieId: string;
  serieCodigo: number;
  valor: number;
  dataReferencia: string;
  fonte: string;
  buscadoEm: string;
}

/**
 * Mapa de índices históricos (bulk fetch)
 * Chave: YYYY-MM (ex: "2024-01")
 */
export type MapaIndicesHistoricos = Map<string, number>;

/**
 * Response do cálculo detalhado (perícia)
 */
export interface CalculoDetalhadoResponse {
  // Metadados
  calculadoEm: string;
  tempoExecucaoMs: number;
  versaoMotor: string;

  // Resumo Executivo
  resumo: {
    valorFinanciado: number;
    valorTotalPago: number;
    valorTotalDevido: number;
    diferencaTotal: number;
    restituicaoSimples: number;
    restituicaoDobro: number;
    economiaEstimada: number;
    taxaContratoAnual: number;
    taxaMercadoAnual: number;
    sobretaxaPercent: number;
    isAbusivo: boolean;
  };

  // Snapshot da Taxa BACEN (para auditoria)
  taxaSnapshot: TaxaSnapshot;

  // 7 Apêndices (AP01-AP07)
  apendices: {
    ap01: ApendiceResult;   // Evolução Original (Cenário Banco)
    ap02: ApendiceResult;   // Recálculo (Cenário Justo)
    ap03: ApendiceResult;   // Diferenças Nominais
    ap04?: ApendiceResult;  // Restituição em Dobro
    ap05?: ApendiceResult;  // Restituição Simples
    ap06?: ApendiceResult;  // Atualização Monetária (INPC)
    ap07?: ApendiceResult;  // Consolidação Final
  };

  // Flags de Análise
  flags: {
    capitalizacaoDiariaDetectada: boolean;
    anatocismoDetectado: boolean;
    tarifasIrregulares: boolean;
    segurosAbusivos: boolean;
    carenciaDetectada: boolean;
    diasCarencia?: number;
    jurosCarencia?: number;
  };

  // Análise XTIR (Capitalização Diária)
  analiseXTIR?: {
    detectada: boolean;
    taxaXTIR_mensal: number;
    taxaPactuada_mensal: number;
    diferenca: number;
    metodoDeteccao: 'XTIR' | 'REVERSO' | 'NENHUM';
    evidencia: string;
  };

  // NOVO: Detecção de renegociação para cadeia de contratos
  renegociacao?: {
    detectada: boolean;
    mesRenegociacao?: number;
    dataRenegociacao?: string;
    saldoFidedigno?: number;
  };

  // Formatados para exibição
  formatted?: {
    valorFinanciado: string;
    valorTotalPago: string;
    valorTotalDevido: string;
    diferencaTotal: string;
    restituicaoSimples: string;
    restituicaoDobro: string;
    taxaContratoAnual: string;
    taxaMercadoAnual: string;
    sobretaxaPercent: string;
  };
}

