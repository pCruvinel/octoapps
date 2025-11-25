/**
 * Formata um número para o formato de moeda brasileira
 *
 * @param value - Número a ser formatado
 * @param includeSymbol - Se deve incluir o símbolo R$ (padrão: true)
 * @returns String formatada no padrão brasileiro (ex: "R$ 432.000,00")
 */
export const formatCurrency = (value: number, includeSymbol: boolean = true): string => {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return includeSymbol ? `R$ ${formatted}` : formatted;
};

/**
 * Formata uma string de input enquanto o usuário digita
 * Remove caracteres não numéricos e aplica máscara de moeda brasileira
 *
 * @param value - String do input
 * @returns String formatada (ex: "R$ 432.000,00")
 */
export const formatCurrencyInput = (value: string): string => {
  if (!value) return '';

  // Remove tudo exceto dígitos
  const digitsOnly = value.replace(/\D/g, '');

  if (!digitsOnly) return '';

  // Converte para número (centavos)
  const numberValue = parseInt(digitsOnly, 10) / 100;

  // Formata como moeda
  return formatCurrency(numberValue);
};

/**
 * Formata porcentagem para exibição
 *
 * @param value - Valor decimal (ex: 0.004 para 0.4%)
 * @param decimalPlaces - Número de casas decimais (padrão: 4)
 * @returns String formatada (ex: "0,4000%")
 */
export const formatPercent = (value: number, decimalPlaces: number = 4): string => {
  const percentValue = value * 100;

  return percentValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }) + '%';
};

/**
 * Formata taxa mensal para input (formato decimal)
 *
 * @param value - String do input
 * @returns String formatada mantendo o formato decimal (ex: "0.004")
 */
export const formatTaxaInput = (value: string): string => {
  if (!value) return '';

  // Permite apenas números, ponto e vírgula
  const cleaned = value.replace(/[^\d.,]/g, '');

  // Se começa com "0." ou "0,", mantém o formato decimal
  if (cleaned.startsWith('0.') || cleaned.startsWith('0,')) {
    // Substitui vírgula por ponto para manter consistência
    return cleaned.replace(',', '.');
  }

  return cleaned;
};
