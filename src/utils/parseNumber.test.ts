import { describe, it, expect } from 'vitest';
import { parseNumber } from './parseNumber';

describe('parseNumber', () => {
  describe('Formato BR com centavos (vírgula + 2 dígitos)', () => {
    it('deve parsear 302.400,50 como 302400.50', () => {
      expect(parseNumber('302.400,50')).toBe(302400.50);
    });

    it('deve parsear 62,54 como 62.54', () => {
      expect(parseNumber('62,54')).toBe(62.54);
    });

    it('deve parsear 1.234.567,89 como 1234567.89', () => {
      expect(parseNumber('1.234.567,89')).toBe(1234567.89);
    });

    it('deve parsear 0,99 como 0.99', () => {
      expect(parseNumber('0,99')).toBe(0.99);
    });
  });

  describe('Formato BR sem centavos (vírgula + 00)', () => {
    it('deve parsear 302.400,00 como 302400', () => {
      expect(parseNumber('302.400,00')).toBe(302400);
    });

    it('deve parsear 1.000,00 como 1000', () => {
      expect(parseNumber('1.000,00')).toBe(1000);
    });

    it('deve parsear 500,00 como 500', () => {
      expect(parseNumber('500,00')).toBe(500);
    });
  });

  describe('Formato BR simples (apenas ponto como separador de milhar)', () => {
    it('deve parsear 302.400 como 302400', () => {
      expect(parseNumber('302.400')).toBe(302400);
    });

    it('deve parsear 1.000.000 como 1000000', () => {
      expect(parseNumber('1.000.000')).toBe(1000000);
    });

    it('deve parsear 5.000 como 5000', () => {
      expect(parseNumber('5.000')).toBe(5000);
    });
  });

  describe('Formato decimal (começando com 0.)', () => {
    it('deve parsear 0.005654145387 como decimal', () => {
      expect(parseNumber('0.005654145387')).toBeCloseTo(0.005654145387, 12);
    });

    it('deve parsear 0.004 como 0.004', () => {
      expect(parseNumber('0.004')).toBe(0.004);
    });

    it('deve parsear 0.5 como 0.5', () => {
      expect(parseNumber('0.5')).toBe(0.5);
    });

    it('deve parsear 0.12345678901234 como decimal preciso', () => {
      expect(parseNumber('0.12345678901234')).toBeCloseTo(0.12345678901234, 14);
    });
  });

  describe('Formato com símbolo de moeda', () => {
    it('deve parsear R$ 302.400,50 como 302400.50', () => {
      expect(parseNumber('R$ 302.400,50')).toBe(302400.50);
    });

    it('deve parsear R$ 1.000 como 1000', () => {
      expect(parseNumber('R$ 1.000')).toBe(1000);
    });

    it('deve parsear R$500,00 como 500', () => {
      expect(parseNumber('R$500,00')).toBe(500);
    });
  });

  describe('Números simples (sem separadores)', () => {
    it('deve parsear 302400 como 302400', () => {
      expect(parseNumber('302400')).toBe(302400);
    });

    it('deve parsear 100 como 100', () => {
      expect(parseNumber('100')).toBe(100);
    });

    it('deve parsear 0 como 0', () => {
      expect(parseNumber('0')).toBe(0);
    });

    it('deve parsear 12 como 12', () => {
      expect(parseNumber('12')).toBe(12);
    });

    it('deve parsear 360 como 360', () => {
      expect(parseNumber('360')).toBe(360);
    });
  });

  describe('Valores inválidos ou vazios', () => {
    it('deve retornar 0 para string vazia', () => {
      expect(parseNumber('')).toBe(0);
    });

    it('deve retornar 0 para string com apenas espaços', () => {
      expect(parseNumber('   ')).toBe(0);
    });

    it('deve retornar 0 para texto inválido', () => {
      expect(parseNumber('abc')).toBe(0);
    });
  });

  describe('Casos especiais e edge cases', () => {
    it('deve parsear números com espaços', () => {
      expect(parseNumber('  302400  ')).toBe(302400);
    });

    it('deve parsear números negativos', () => {
      expect(parseNumber('-302400')).toBe(-302400);
    });

    it('deve parsear decimais negativos', () => {
      expect(parseNumber('-0.004')).toBe(-0.004);
    });

    it('deve parsear formato BR negativo', () => {
      expect(parseNumber('-302.400,50')).toBe(-302400.50);
    });
  });

  describe('Casos de uso reais do sistema', () => {
    it('deve parsear Valor do Imóvel: 302.400', () => {
      expect(parseNumber('302.400')).toBe(302400);
    });

    it('deve parsear Taxa de Juros: 0.005654145387', () => {
      expect(parseNumber('0.005654145387')).toBeCloseTo(0.005654145387, 12);
    });

    it('deve parsear Prazo em meses: 360', () => {
      expect(parseNumber('360')).toBe(360);
    });

    it('deve parsear Taxa de Mercado: 0.004', () => {
      expect(parseNumber('0.004')).toBe(0.004);
    });

    it('deve parsear Horizonte de Análise: 12', () => {
      expect(parseNumber('12')).toBe(12);
    });

    it('deve parsear valores do relatório com centavos', () => {
      expect(parseNumber('3.226.669,70')).toBe(3226669.70);
    });

    it('CASO REAL: Valor Financiado 302.400 deve resultar em 302400 (NÃO 30240000)', () => {
      const resultado = parseNumber('302.400');
      expect(resultado).toBe(302400);
      expect(resultado).not.toBe(30240000);
    });

    it('CASO REAL: Taxa 0.005654145387 deve manter precisão', () => {
      const resultado = parseNumber('0.005654145387');
      expect(resultado).toBeCloseTo(0.005654145387, 12);
      // Verifica que não está sendo multiplicado por 100
      expect(resultado).toBeLessThan(0.01);
    });
  });
});
