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

/**
 * Expande encargos da primeira parcela para todas as parcelas
 * Se apenas a primeira parcela tem encargos definidos, replica para as demais
 */
function expandirEncargosRecorrentes(
  datas: string[],
  encargosMensais?: EncargosMensais[]
): EncargosMensais[] {
  if (!encargosMensais || encargosMensais.length === 0) {
    return [];
  }

  // Se já existe um encargo para cada data, retorna como está
  if (encargosMensais.length === datas.length) {
    return encargosMensais;
  }

  // Se existe apenas 1 encargo (primeira parcela), replica para todas
  if (encargosMensais.length === 1) {
    const primeiroEncargo = encargosMensais[0];
    return datas.map(data => ({
      data,
      MIP: primeiroEncargo.MIP,
      DFI: primeiroEncargo.DFI,
      TCA: primeiroEncargo.TCA,
      multa: primeiroEncargo.multa,
      mora: primeiroEncargo.mora,
    }));
  }

  // Caso contrário, mantém como está (encargos específicos por data)
  return encargosMensais;
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

  // Expandir encargos recorrentes (se necessário)
  const encargosExpandidos = expandirEncargosRecorrentes(datas, encargosMensais);

  // Inicializar
  const tabela: LinhaAmortizacao[] = [];
  let saldoDevedor = pv;
  let totalJuros = 0;
  let totalAmortizado = 0;
  let totalMIP = 0;
  let totalDFI = 0;
  let totalTCA = 0;
  let totalMulta = 0;
  let totalMora = 0;

  // Calcular cada parcela
  for (let t = 0; t < numParcelas; t++) {
    const data = datas[t];
    const mes = t + 1;

    // Aplicar TR ao saldo devedor ANTES dos cálculos
    const TR_t = buscarTR(data, trSeries);
    const saldoCorrigido = saldoDevedor * TR_t;

    // Selecionar taxa para esta data
    const i_t = selecionarTaxa(data, faixasTaxa);

    // Calcular juros sobre saldo corrigido: J_t = SD_corrigido × i_t
    const J_t = saldoCorrigido * i_t;

    // Prestação básica: P_t = A + J_t
    const P_t = A + J_t;

    // Buscar encargos para esta parcela (agora expandidos)
    const encargos = buscarEncargos(data, encargosExpandidos);
    const MIP = encargos?.MIP || 0;
    const DFI = encargos?.DFI || 0;
    const TCA = encargos?.TCA || 0;
    const multa = encargos?.multa || 0;
    const mora = encargos?.mora || 0;

    // Total pago: Pago_t = P_t + encargos
    const Pago_t = P_t + MIP + DFI + TCA + multa + mora;

    // Atualizar saldo devedor: SD_t = SD_corrigido - A
    const SD_t = saldoCorrigido - A;

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
    totalAmortizado += A;
    totalMIP += MIP;
    totalDFI += DFI;
    totalTCA += TCA;
    totalMulta += multa;
    totalMora += mora;

    // Atualizar saldo para próxima iteração
    saldoDevedor = SD_t;
  }

  const totalTaxas = totalMIP + totalDFI + totalTCA + totalMulta + totalMora;
  const totalPago = totalAmortizado + totalJuros + totalTaxas;

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
  let totalAmortizado = 0;

  // Calcular cada parcela com taxa de mercado
  for (let t = 0; t < numParcelas; t++) {
    const data = datas[t];
    const mes = t + 1;

    // Aplicar TR ao saldo devedor ANTES dos cálculos
    const TR_t = buscarTR(data, trSeries);
    const saldoCorrigido = saldoDevedor * TR_t;

    // Juros com taxa de mercado: J_t^{mkt} = SD_corrigido × i_mkt
    const J_t_mkt = saldoCorrigido * taxaMercado;

    // Prestação: P_t^{mkt} = A + J_t^{mkt}
    const P_t_mkt = A + J_t_mkt;

    // Atualizar saldo devedor: SD_t = SD_corrigido - A
    const SD_t = saldoCorrigido - A;

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
    totalAmortizado += A;

    // Atualizar saldo para próxima iteração
    saldoDevedor = SD_t;
  }

  const totalDevido = totalAmortizado + totalJuros;

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
    // totalPago deve sempre estar presente em AP01
    if (linhaCobrado.totalPago === undefined) {
      throw new CalculationError(
        `totalPago não encontrado na linha ${i + 1} do cenário AP01`,
        'TOTAL_PAGO_AUSENTE',
        { linha: i + 1, linhaCobrado }
      );
    }
    const D_t = linhaCobrado.totalPago - linhaDevido.valorOriginalParcela;

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
  if (!trSeries || trSeries.length === 0) return;

  const datasVistas = new Set<string>();

  for (let i = 0; i < trSeries.length; i++) {
    const tr = trSeries[i];

    // Validar formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tr.data)) {
      throw new CalculationError(
        'Data da TR deve estar no formato YYYY-MM-DD',
        'TR_DATA_INVALIDA',
        { tr, indice: i }
      );
    }

    // Validar fator positivo
    if (tr.fator <= 0) {
      throw new CalculationError(
        'Fator TR deve ser positivo',
        'TR_INVALIDA',
        { tr, indice: i }
      );
    }

    // Validar datas duplicadas
    if (datasVistas.has(tr.data)) {
      throw new CalculationError(
        `Data TR duplicada: ${tr.data}`,
        'TR_DATA_DUPLICADA',
        { data: tr.data, indice: i }
      );
    }
    datasVistas.add(tr.data);

    // Validar ordem cronológica
    if (i > 0) {
      const trAnterior = trSeries[i - 1];
      if (tr.data <= trAnterior.data) {
        throw new CalculationError(
          `TRs fora de ordem cronológica: ${trAnterior.data} -> ${tr.data}`,
          'TR_FORA_ORDEM',
          { trAnterior, trAtual: tr, indice: i }
        );
      }
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

// ============================================================================
// INTEGRAÇÃO COM API DO BANCO CENTRAL
// ============================================================================

/**
 * Resposta da API do Banco Central para série de TR
 */
interface BacenTRResponse {
  data: string; // DD/MM/YYYY
  valor: string; // Percentual como string
}

/**
 * Busca série histórica de TR na API do Banco Central
 *
 * @param dataInicial Data inicial no formato YYYY-MM-DD
 * @param dataFinal Data final no formato YYYY-MM-DD
 * @returns Array de TRSerie com fatores de correção
 *
 * Endpoint: https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados
 * Série 226: Taxa Referencial - TR (% a.m.)
 */
export async function buscarTRBancoCentral(
  dataInicial: string,
  dataFinal: string
): Promise<TRSerie[]> {
  try {
    // Converter formato YYYY-MM-DD para DD/MM/YYYY (formato da API)
    const [anoIni, mesIni, diaIni] = dataInicial.split('-');
    const [anoFim, mesFim, diaFim] = dataFinal.split('-');

    const dataIniFormatada = `${diaIni}/${mesIni}/${anoIni}`;
    const dataFimFormatada = `${diaFim}/${mesFim}/${anoFim}`;

    // Montar URL da API
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados?formato=json&dataInicial=${dataIniFormatada}&dataFinal=${dataFimFormatada}`;

    // Fazer requisição com timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`API Bacen retornou status ${response.status}. Usando TR neutra.`);
        return [];
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('Timeout ao buscar TR do Banco Central (>30s). Usando TR neutra.');
      } else {
        console.error('Erro ao buscar TR do Banco Central:', fetchError);
      }
      return [];
    }

    const data: BacenTRResponse[] = await response.json();

    // Converter resposta para formato TRSerie
    const trSeries: TRSerie[] = data.map((item) => {
      // Converter DD/MM/YYYY de volta para YYYY-MM-DD
      const [dia, mes, ano] = item.data.split('/');
      const dataFormatada = `${ano}-${mes}-${dia}`;

      // Converter percentual para fator
      // Ex: TR de 0.1195% → fator = 1 + (0.1195 / 100) = 1.001195
      const percentual = parseFloat(item.valor);
      const fator = 1 + (percentual / 100);

      return {
        data: dataFormatada,
        fator,
      };
    });

    return trSeries;
  } catch (error) {
    console.error('Erro ao buscar TR do Banco Central:', error);
    console.warn('Continuando sem correção TR (fator = 1.0)');
    return [];
  }
}

/**
 * Busca TR com cache local para evitar múltiplas chamadas
 */
const trCache = new Map<string, TRSerie[]>();

export async function buscarTRComCache(
  dataInicial: string,
  dataFinal: string
): Promise<TRSerie[]> {
  const chaveCache = `${dataInicial}_${dataFinal}`;

  // Verificar cache
  if (trCache.has(chaveCache)) {
    console.log('TR carregada do cache');
    return trCache.get(chaveCache)!;
  }

  // Buscar da API
  console.log('Buscando TR da API do Banco Central...');
  const trSeries = await buscarTRBancoCentral(dataInicial, dataFinal);

  // Salvar no cache
  if (trSeries.length > 0) {
    trCache.set(chaveCache, trSeries);
  }

  return trSeries;
}
