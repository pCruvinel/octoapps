/**
 * Converte uma string numérica em número, suportando diferentes formatos
 *
 * Formatos suportados:
 * - Formato BR com centavos: "302.400,50" → 302400.50
 * - Formato BR sem centavos: "302.400,00" → 302400
 * - Formato BR simples: "302.400" → 302400
 * - Formato decimal: "0.005654145387" → 0.005654145387
 * - Formato US: "302,400.50" → 302400.50
 * - Com símbolo de moeda: "R$ 302.400,50" → 302400.50
 * - Número simples: "302400" → 302400
 * - String vazia ou inválida: "" → 0
 *
 * @param value - String contendo o número a ser parseado
 * @returns Número parseado ou 0 se inválido
 */
export const parseNumber = (value: string): number => {
  if (!value) return 0;

  // Remove espaços em branco e símbolos de moeda
  let cleanValue = value.trim().replace(/R\$\s*/g, '');

  // Se tem vírgula seguida de exatamente 2 dígitos no final, é formato BR com centavos
  // Ex: 302.400,50 ou 62,54
  const formatoBRComCentavos = /,\d{2}$/;
  if (formatoBRComCentavos.test(cleanValue)) {
    // Formato BR: 302.400,50 → remover pontos e trocar vírgula por ponto
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  }

  // Se tem vírgula seguida de 00 (ex: 302.400,00), remover a vírgula e os zeros
  if (cleanValue.endsWith(',00')) {
    cleanValue = cleanValue.replace(',00', '');
  }

  // Se ainda tem vírgula (mas não é centavos), trocar por ponto
  if (cleanValue.includes(',')) {
    cleanValue = cleanValue.replace(',', '.');
  }

  // Se não tem vírgula, mas tem ponto:
  // - Se começa com "0." → é decimal (ex: 0.004)
  // - Caso contrário → é separador de milhar (ex: 302.400)
  if (cleanValue.includes('.')) {
    if (cleanValue.startsWith('0.') || cleanValue.startsWith('-0.')) {
      // É decimal puro (ex: 0.005654145387)
      return parseFloat(cleanValue) || 0;
    } else {
      // É separador de milhar (ex: 302.400)
      cleanValue = cleanValue.replace(/\./g, '');
      return parseFloat(cleanValue) || 0;
    }
  }

  // Sem vírgula e sem ponto: número simples
  return parseFloat(cleanValue) || 0;
};
