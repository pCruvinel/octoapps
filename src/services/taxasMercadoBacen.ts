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

import type { TipoEmprestimo } from '@/types/calculation.types';

/**
 * Taxas médias mensais por tipo de operação de crédito
 *
 * Referência: Janeiro 2025
 *
 * Formato: Taxa mensal em decimal (ex: 0.0389 = 3.89% a.m.)
 */
export const TAXAS_MERCADO_BACEN: Record<TipoEmprestimo, number> = {
  'Pessoal': 0.0389,         // 3.89% a.m. (46.7% a.a.)
  'Consignado': 0.0193,      // 1.93% a.m. (23.2% a.a.)
  'Capital de Giro': 0.0428, // 4.28% a.m. (51.4% a.a.)
  'Veículo': 0.0169,         // 1.69% a.m. (20.3% a.a.)
  'Imobiliário': 0.0091,     // 0.91% a.m. (10.9% a.a.)
  'Cheque Especial': 0.0799, // 7.99% a.m. (95.9% a.a.)
};

/**
 * Taxa padrão de fallback (3% a.m.)
 * Utilizada quando o tipo de empréstimo não está mapeado
 */
const TAXA_PADRAO_FALLBACK = 0.03;

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
