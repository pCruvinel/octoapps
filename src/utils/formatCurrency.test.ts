import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyInput, formatPercent, formatTaxaInput } from './formatCurrency';

describe('formatCurrency', () => {
  it('deve formatar 432000 como R$ 432.000,00', () => {
    expect(formatCurrency(432000)).toBe('R$ 432.000,00');
  });

  it('deve formatar 302400 como R$ 302.400,00', () => {
    expect(formatCurrency(302400)).toBe('R$ 302.400,00');
  });

  it('deve formatar 129600 como R$ 129.600,00', () => {
    expect(formatCurrency(129600)).toBe('R$ 129.600,00');
  });

  it('deve formatar valores com centavos', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('deve formatar sem símbolo quando solicitado', () => {
    expect(formatCurrency(432000, false)).toBe('432.000,00');
  });

  it('deve formatar 0 como R$ 0,00', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('deve formatar valores decimais pequenos', () => {
    expect(formatCurrency(0.99)).toBe('R$ 0,99');
  });
});

describe('formatCurrencyInput', () => {
  it('deve formatar "432000" enquanto usuário digita', () => {
    expect(formatCurrencyInput('432000')).toBe('R$ 4.320,00');
  });

  it('deve formatar "43200000" como R$ 432.000,00', () => {
    expect(formatCurrencyInput('43200000')).toBe('R$ 432.000,00');
  });

  it('deve formatar "30240000" como R$ 302.400,00', () => {
    expect(formatCurrencyInput('30240000')).toBe('R$ 302.400,00');
  });

  it('deve ignorar caracteres não numéricos', () => {
    expect(formatCurrencyInput('R$ 432.000,00')).toBe('R$ 432.000,00');
  });

  it('deve retornar string vazia para input vazio', () => {
    expect(formatCurrencyInput('')).toBe('');
  });

  it('deve formatar "1" como R$ 0,01', () => {
    expect(formatCurrencyInput('1')).toBe('R$ 0,01');
  });

  it('deve formatar "10" como R$ 0,10', () => {
    expect(formatCurrencyInput('10')).toBe('R$ 0,10');
  });

  it('deve formatar "100" como R$ 1,00', () => {
    expect(formatCurrencyInput('100')).toBe('R$ 1,00');
  });

  it('deve formatar "1000" como R$ 10,00', () => {
    expect(formatCurrencyInput('1000')).toBe('R$ 10,00');
  });
});

describe('formatPercent', () => {
  it('deve formatar 0.004 como 0,4000%', () => {
    expect(formatPercent(0.004)).toBe('0,4000%');
  });

  it('deve formatar 0.005654145387 com 4 casas decimais', () => {
    expect(formatPercent(0.005654145387)).toBe('0,5654%');
  });

  it('deve formatar com número customizado de casas decimais', () => {
    expect(formatPercent(0.005654145387, 8)).toBe('0,56541454%');
  });

  it('deve formatar 0.5 como 50,0000%', () => {
    expect(formatPercent(0.5)).toBe('50,0000%');
  });

  it('deve formatar 1 como 100,0000%', () => {
    expect(formatPercent(1)).toBe('100,0000%');
  });
});

describe('formatTaxaInput', () => {
  it('deve manter formato decimal iniciando com 0.', () => {
    expect(formatTaxaInput('0.004')).toBe('0.004');
  });

  it('deve converter vírgula para ponto em decimais', () => {
    expect(formatTaxaInput('0,004')).toBe('0.004');
  });

  it('deve permitir números sem 0 inicial', () => {
    expect(formatTaxaInput('12')).toBe('12');
  });

  it('deve remover caracteres não numéricos exceto ponto e vírgula', () => {
    expect(formatTaxaInput('abc0.004xyz')).toBe('0.004');
  });

  it('deve retornar vazio para input vazio', () => {
    expect(formatTaxaInput('')).toBe('');
  });
});

describe('Integração formatCurrencyInput + parseNumber', () => {
  it('formatCurrencyInput seguido de parseNumber deve retornar valor correto', async () => {
    const { parseNumber } = await import('./parseNumber');

    // Simula usuário digitando "43200000" (para R$ 432.000,00)
    const formatted = formatCurrencyInput('43200000');
    expect(formatted).toBe('R$ 432.000,00');

    // parseNumber deve converter de volta para 432000
    const parsed = parseNumber(formatted);
    expect(parsed).toBe(432000);
  });

  it('ciclo completo: digitar → formatar → parsear valor do bem', async () => {
    const { parseNumber } = await import('./parseNumber');

    const userInput = '43200000'; // Usuário digitou 432000,00
    const formatted = formatCurrencyInput(userInput); // R$ 432.000,00
    const parsed = parseNumber(formatted); // 432000

    expect(parsed).toBe(432000);
  });

  it('ciclo completo: digitar → formatar → parsear valor financiado', async () => {
    const { parseNumber } = await import('./parseNumber');

    const userInput = '30240000'; // Usuário digitou 302400,00
    const formatted = formatCurrencyInput(userInput); // R$ 302.400,00
    const parsed = parseNumber(formatted); // 302400

    expect(parsed).toBe(302400);
  });
});
