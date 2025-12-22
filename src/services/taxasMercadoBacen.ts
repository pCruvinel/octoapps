/**
 * Taxas Médias de Mercado do BACEN
 *
 * Fonte: Banco Central do Brasil - Estatísticas Monetárias e de Crédito
 * URL: https://www.bcb.gov.br/estatisticas/txjuros
 *
 * Taxas médias praticadas pelas instituições financeiras (dados de 2024)
 * Atualizadas periodicamente conforme publicação BACEN
 *
 * IMPORTANTE: Este arquivo deve ser atualizado trimestralmente com as taxas
 * mais recentes do BACEN para manter a análise revisional precisa.
 */

import type {
  TipoEmprestimo,
  ModalidadeCredito,
  IndexadorCorrecao,
  MapaIndicesHistoricos,
  TaxaSnapshot,
  RegraDefasagemIndice
} from '@/types/calculation.types';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TAXAS ESTÁTICAS (FALLBACK / ANÁLISE PRÉVIA)
// ============================================================================

/**
 * Taxas médias mensais por tipo de operação de crédito
 *
 * Referência: Séries 20xxx do BACEN - Taxas de Referência
 * Fonte: https://www.bcb.gov.br/estatisticas/txjuros
 *
 * Formato: Taxa mensal em decimal (ex: 0.0171 = 1.71% a.m.)
 * 
 * IMPORTANTE: Estas taxas são usadas como FALLBACK quando a Edge Function falha.
 * São baseadas nas séries anuais 20xxx convertidas para mensal.
 */
export const TAXAS_MERCADO_BACEN: Record<TipoEmprestimo, number> = {
  'Pessoal': 0.0171,         // 1.71% a.m. (~22.52% a.a.) - Série 20718
  'Consignado': 0.0145,      // 1.45% a.m. (~18.8% a.a.) - Série 20744/45/46
  'Capital de Giro': 0.0220, // 2.20% a.m. (~29.8% a.a.) - Série 20755
  'Veículo': 0.0169,         // 1.69% a.m. (~22.3% a.a.) - Série 20749
  'Imobiliário': 0.0091,     // 0.91% a.m. (~11.5% a.a.) - Série 20773
  'Cheque Especial': 0.0450, // 4.50% a.m. (~69.6% a.a.) - Série 20737
};

/**
 * Taxa padrão de fallback (2% a.m. = ~26.8% a.a.)
 * Utilizada quando o tipo de empréstimo não está mapeado
 */
const TAXA_PADRAO_FALLBACK = 0.02;

// ============================================================================
// MAPEAMENTO DE SÉRIES SGS BACEN
// ============================================================================

/**
 * Séries Temporais SGS do Banco Central
 * 
 * Fonte: https://www3.bcb.gov.br/sgspub/consultarvalores
 * 
 * Formato:
 * - mensal: Código da série com taxa mensal
 * - anual: Código da série com taxa anual (quando disponível)
 * - tipo: 'MENSAL' se série já vem mensal, 'ANUAL' se precisa converter
 */
export const SERIES_SGS_BACEN: Record<ModalidadeCredito, {
  mensal: number;
  anual?: number;
  tipo: 'MENSAL' | 'ANUAL';
  descricao: string;
}> = {
  // Veículos - usar séries anuais 20749 (PF) e 20728 (PJ)
  AQUISICAO_VEICULOS_PF: {
    mensal: 20749,   // Taxa anual % a.a.
    anual: 20749,
    tipo: 'ANUAL',   // Retorna taxa ANUAL, converter para mensal
    descricao: 'Aquisição de veículos - Pessoa física'
  },
  AQUISICAO_VEICULOS_PJ: {
    mensal: 20728,   // Taxa anual % a.a.
    anual: 20728,
    tipo: 'ANUAL',   // Retorna taxa ANUAL, converter para mensal
    descricao: 'Aquisição de veículos - Pessoa jurídica'
  },

  // Empréstimo Pessoal - usar série 20718 (alinhado com financialCalculations.ts)
  EMPRESTIMO_PESSOAL: {
    mensal: 20718,   // Tax anual % a.a. - Crédito Pessoal Não Consignado
    anual: 20718,
    tipo: 'ANUAL',   // Retorna taxa ANUAL, converter para mensal
    descricao: 'Crédito pessoal não consignado'
  },

  // Consignado - usar séries anuais
  CONSIGNADO_PRIVADO: {
    mensal: 20744,   // Taxa anual
    anual: 20744,
    tipo: 'ANUAL',
    descricao: 'Consignado setor privado'
  },
  CONSIGNADO_PUBLICO: {
    mensal: 20745,   // Taxa anual
    anual: 20745,
    tipo: 'ANUAL',
    descricao: 'Consignado setor público'
  },
  CONSIGNADO_INSS: {
    mensal: 20746,   // Taxa anual
    anual: 20746,
    tipo: 'ANUAL',
    descricao: 'Consignado INSS'
  },

  // Capital de Giro - usar séries anuais
  CAPITAL_GIRO_ATE_365: {
    mensal: 20755,   // Taxa anual
    anual: 20755,
    tipo: 'ANUAL',
    descricao: 'Capital de giro até 365 dias'
  },
  CAPITAL_GIRO_ACIMA_365: {
    mensal: 20756,   // Taxa anual
    anual: 20756,
    tipo: 'ANUAL',
    descricao: 'Capital de giro acima 365 dias'
  },

  // Cheque Especial - usar série anual
  CHEQUE_ESPECIAL: {
    mensal: 20737,   // Taxa anual
    anual: 20737,
    tipo: 'ANUAL',
    descricao: 'Cheque especial pessoa física'
  },

  // Cartão de Crédito - manter mensal (rotativo é muito volátil)
  CARTAO_ROTATIVO: {
    mensal: 25461,
    anual: 20739,
    tipo: 'MENSAL',
    descricao: 'Cartão de crédito rotativo total'
  },

  // Imobiliário (séries são anuais, precisam conversão)
  IMOBILIARIO_SFH: {
    mensal: 20773,
    tipo: 'ANUAL',
    descricao: 'Financiamento imobiliário regulado (SFH)'
  },
  IMOBILIARIO_SFI: {
    mensal: 25497,
    tipo: 'ANUAL',
    descricao: 'Financiamento imobiliário não regulado (SFI)'
  }
};

/**
 * Séries de Índices de Correção Monetária
 */
export const SERIES_INDICES_SGS: Record<IndexadorCorrecao, number> = {
  TR: 226,       // Taxa Referencial (% a.m.)
  IPCA: 433,     // IPCA variação mensal
  INPC: 188,     // INPC variação mensal
  IGPM: 189,     // IGP-M variação mensal
  NENHUM: 0
};

// ============================================================================
// FUNÇÕES DE BUSCA DE TAXA (DINÂMICA)
// ============================================================================

/**
 * Busca taxa SGS dinâmica via Edge Function
 * 
 * @param modalidade - Modalidade de crédito
 * @param dataReferencia - Data para buscar a taxa (YYYY-MM-DD)
 * @returns TaxaSnapshot com valor e metadados de auditoria
 */
export async function buscarTaxaSGS(
  modalidade: ModalidadeCredito,
  dataReferencia: string
): Promise<TaxaSnapshot> {
  const config = SERIES_SGS_BACEN[modalidade];
  if (!config) {
    throw new Error(`Modalidade não mapeada: ${modalidade}`);
  }

  try {
    const { data, error } = await supabase.functions.invoke('buscar-taxa-bacen', {
      body: {
        codigoSerie: config.mensal,
        dataReferencia: dataReferencia
      }
    });

    if (error) throw error;

    // taxaMediaMensalPercent sempre vem em percentual (ex: 22.52 para 22.52%)
    const taxaBruta = data.taxaMediaMensalPercent;
    let taxaMensalPercent: number;

    if (config.tipo === 'ANUAL') {
      // Série retorna taxa ANUAL - converter para mensal
      const taxaAnualDecimal = taxaBruta / 100;  // 22.52% -> 0.2252
      const taxaMensalDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;
      taxaMensalPercent = taxaMensalDecimal * 100;  // 0.0171 -> 1.71%
      console.log(`[SGS] Série ${config.mensal}: ${taxaBruta.toFixed(2)}% a.a. → ${taxaMensalPercent.toFixed(4)}% a.m.`);
    } else {
      // Série retorna taxa MENSAL - usar direto
      taxaMensalPercent = taxaBruta;
      console.log(`[SGS] Série ${config.mensal}: ${taxaMensalPercent.toFixed(4)}% a.m.`);
    }

    return {
      serieId: config.descricao,
      serieCodigo: config.mensal,
      valor: taxaMensalPercent, // Já está em percentual (1.71 = 1.71% a.m.)
      dataReferencia: data.dataReferencia || dataReferencia,
      fonte: 'Banco Central do Brasil - SGS',
      buscadoEm: new Date().toISOString()
    };
  } catch (error) {
    console.error('[taxasMercadoBacen] Erro ao buscar taxa SGS:', error);

    // Fallback para taxa estática
    const tipoFallback = mapModalidadeToTipo(modalidade);
    const taxaFallback = TAXAS_MERCADO_BACEN[tipoFallback] || TAXA_PADRAO_FALLBACK;

    return {
      serieId: `${config.descricao} (FALLBACK)`,
      serieCodigo: config.mensal,
      valor: taxaFallback * 100,
      dataReferencia: dataReferencia,
      fonte: 'Fallback Local',
      buscadoEm: new Date().toISOString()
    };
  }
}

/**
 * Mapeia ModalidadeCredito para TipoEmprestimo (para fallback)
 */
function mapModalidadeToTipo(modalidade: ModalidadeCredito): TipoEmprestimo {
  const mapa: Record<ModalidadeCredito, TipoEmprestimo> = {
    AQUISICAO_VEICULOS_PF: 'Veículo',
    AQUISICAO_VEICULOS_PJ: 'Veículo',
    EMPRESTIMO_PESSOAL: 'Pessoal',
    CONSIGNADO_PRIVADO: 'Consignado',
    CONSIGNADO_PUBLICO: 'Consignado',
    CONSIGNADO_INSS: 'Consignado',
    CAPITAL_GIRO_ATE_365: 'Capital de Giro',
    CAPITAL_GIRO_ACIMA_365: 'Capital de Giro',
    CHEQUE_ESPECIAL: 'Cheque Especial',
    CARTAO_ROTATIVO: 'Cheque Especial', // Fallback mais próximo
    IMOBILIARIO_SFH: 'Imobiliário',
    IMOBILIARIO_SFI: 'Imobiliário'
  };
  return mapa[modalidade] || 'Pessoal';
}

// ============================================================================
// BULK FETCH: SÉRIES HISTÓRICAS (OTIMIZAÇÃO)
// ============================================================================

/**
 * Busca série histórica completa de um índice (TR, IPCA, etc.)
 * 
 * IMPORTANTE: Usar esta função ANTES do loop de cálculo para evitar
 * 420 chamadas sequenciais em contratos imobiliários longos.
 * 
 * @param indexador - Tipo de índice (TR, IPCA, INPC, IGPM)
 * @param dataInicio - Data inicial (YYYY-MM-DD)
 * @param prazoMeses - Número de meses a buscar
 * @param regraDefasagem - Regra de defasagem (default: MES_CHEIO_ANTERIOR)
 * @returns Map<YYYY-MM, valor> com índices históricos
 */
export async function buscarSerieHistorica(
  indexador: IndexadorCorrecao,
  dataInicio: string,
  prazoMeses: number,
  regraDefasagem: RegraDefasagemIndice = 'MES_CHEIO_ANTERIOR'
): Promise<MapaIndicesHistoricos> {
  const mapa: MapaIndicesHistoricos = new Map();

  // Para SEM indexador ou NENHUM, retornar mapa vazio
  if (!indexador || indexador === 'NENHUM') {
    console.log('[buscarSerieHistorica] Sem indexador, retornando mapa vazio');
    return mapa;
  }

  const codigoSerie = SERIES_INDICES_SGS[indexador];
  if (!codigoSerie) {
    console.warn(`[buscarSerieHistorica] Indexador não mapeado: ${indexador}`);
    return mapa;
  }

  // Calcular range de datas com margem
  const dataInicioObj = new Date(dataInicio);
  const margemMeses = regraDefasagem === 'ACUMULADO_12_MESES' ? 12 : 2;
  dataInicioObj.setMonth(dataInicioObj.getMonth() - margemMeses);

  const dataFimObj = new Date(dataInicio);
  dataFimObj.setMonth(dataFimObj.getMonth() + prazoMeses + 1);

  // Formatar datas para API BACEN (DD/MM/YYYY)
  const formatBacenDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const dataInicioStr = formatBacenDate(dataInicioObj);
  const dataFimStr = formatBacenDate(dataFimObj);

  try {
    console.log(`[buscarSerieHistorica] Buscando ${indexador} (série ${codigoSerie}) de ${dataInicioStr} a ${dataFimStr}`);

    // Chamar API BACEN diretamente (CORS ok em produção)
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigoSerie}/dados?formato=json&dataInicial=${dataInicioStr}&dataFinal=${dataFimStr}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.warn(`[buscarSerieHistorica] API BACEN retornou ${response.status}`);
      return mapa;
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      for (const item of data) {
        // item.data = "DD/MM/YYYY", item.valor = "0.1234"
        const [dia, mes, ano] = item.data.split('/');
        const chave = `${ano}-${mes}`;
        const valor = parseFloat(item.valor) / 100; // Converter para decimal
        mapa.set(chave, valor);
      }
    }

    console.log(`[buscarSerieHistorica] ✅ Carregados ${mapa.size} índices para ${indexador}`);
    return mapa;

  } catch (error) {
    console.warn(`[buscarSerieHistorica] Erro ao buscar ${indexador}:`, error);
    console.log('[buscarSerieHistorica] Cálculo prosseguirá sem correção monetária');
    // Retornar mapa vazio - cálculo continua sem correção
    return mapa;
  }
}

/**
 * Obtém índice do mapa histórico aplicando regra de defasagem
 * 
 * @param mapa - Mapa de índices históricos
 * @param dataVencimento - Data do vencimento da parcela
 * @param regra - Regra de defasagem
 * @returns Valor do índice ou 0 se não encontrado
 */
export function obterIndicePorData(
  mapa: MapaIndicesHistoricos,
  dataVencimento: string,
  regra: RegraDefasagemIndice = 'MES_CHEIO_ANTERIOR'
): number {
  const dataObj = new Date(dataVencimento);

  switch (regra) {
    case 'MES_CHEIO_ANTERIOR':
      dataObj.setMonth(dataObj.getMonth() - 1);
      break;
    case 'DEFASAGEM_2_MESES':
      dataObj.setMonth(dataObj.getMonth() - 2);
      break;
    case 'ACUMULADO_12_MESES':
      // Para acumulado, calcular soma dos últimos 12 meses
      let acumulado = 0;
      for (let i = 1; i <= 12; i++) {
        const dataAcum = new Date(dataVencimento);
        dataAcum.setMonth(dataAcum.getMonth() - i);
        const chave = `${dataAcum.getFullYear()}-${String(dataAcum.getMonth() + 1).padStart(2, '0')}`;
        acumulado += mapa.get(chave) || 0;
      }
      return acumulado;
  }

  const chave = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`;
  return mapa.get(chave) || 0;
}

// ============================================================================
// FUNÇÕES LEGACY (MANTIDAS PARA COMPATIBILIDADE)
// ============================================================================

/**
 * Obtém a taxa de mercado para um tipo específico de empréstimo
 *
 * @param tipoEmprestimo - Tipo de operação de crédito
 * @returns Taxa mensal em decimal (ex: 0.0389 = 3.89%)
 *
 * @example
 * const taxaPessoal = obterTaxaMercado('Pessoal');
 * // Retorna: 0.0389 (3.89% a.m.)
 */
export function obterTaxaMercado(tipoEmprestimo: TipoEmprestimo): number {
  return TAXAS_MERCADO_BACEN[tipoEmprestimo] || TAXA_PADRAO_FALLBACK;
}

/**
 * Obtém descrição detalhada da taxa de mercado
 *
 * @param tipoEmprestimo - Tipo de operação de crédito
 * @returns Objeto com taxa mensal, anual e formatações
 */
export function obterDetalheTaxaMercado(tipoEmprestimo: TipoEmprestimo): {
  taxaMensal: number;
  taxaAnual: number;
  taxaMensalFormatada: string;
  taxaAnualFormatada: string;
} {
  const taxaMensal = obterTaxaMercado(tipoEmprestimo);
  const taxaAnual = Math.pow(1 + taxaMensal, 12) - 1;

  return {
    taxaMensal,
    taxaAnual,
    taxaMensalFormatada: `${(taxaMensal * 100).toFixed(2)}% a.m.`,
    taxaAnualFormatada: `${(taxaAnual * 100).toFixed(1)}% a.a.`,
  };
}

/**
 * Verifica se a taxa cobrada é abusiva comparada ao mercado
 *
 * @param taxaCobrada - Taxa mensal cobrada (decimal)
 * @param tipoEmprestimo - Tipo de operação
 * @returns Objeto indicando se há abuso e percentual de sobretaxa
 */
export function verificarAbusividade(
  taxaCobrada: number,
  tipoEmprestimo: TipoEmprestimo
): {
  abusiva: boolean;
  sobretaxaPP: number;
  percentualAbuso: number;
} {
  const taxaMercado = obterTaxaMercado(tipoEmprestimo);
  const sobretaxaPP = (taxaCobrada - taxaMercado) * 100;
  const percentualAbuso = taxaMercado > 0 ? ((taxaCobrada - taxaMercado) / taxaMercado) * 100 : 0;

  // Considera abusivo se a sobretaxa for maior que 2 pontos percentuais
  // OU se o percentual de abuso for maior que 50%
  const abusiva = sobretaxaPP > 2 || percentualAbuso > 50;

  return {
    abusiva,
    sobretaxaPP,
    percentualAbuso,
  };
}

/**
 * Data da última atualização das taxas
 * IMPORTANTE: Atualizar esta data sempre que as taxas forem atualizadas
 */
export const DATA_ATUALIZACAO_TAXAS = '2025-01-26';

/**
 * Fonte oficial dos dados
 */
export const FONTE_DADOS = 'Banco Central do Brasil - Sistema Gerenciador de Séries Temporais (SGS)';

