/**
 * Testes Unitários para o Motor de Cálculo Revisional
 * Baseado nos dados do TESTE-REAL.md
 */

import { describe, test, expect } from 'vitest';
import {
  gerarCenarioAP01,
  gerarCenarioAP05,
  gerarCenarioAP03,
  formatarMoeda,
  formatarPercent,
} from '../calculationEngine';
import type { ParametrosSAC, TRSerie, EncargosMensais } from '@/types/calculation.types';

describe('Motor de Cálculo - Cenário AP01 (Cobrado)', () => {
  test('calcula corretamente os totais para 12 meses - TESTE-REAL.md', () => {
    // Dados do TESTE-REAL.md
    const params: ParametrosSAC = {
      pv: 302400, // Valor financiado
      n: 360, // Total de parcelas
      primeiroVenc: '2018-06-21',
      faixasTaxa: [
        {
          ini: '2018-06-21',
          fim: '2099-12-31',
          i: 0.005654145387, // 0.5654% a.m.
        },
      ],
      trSeries: [
        { data: '2018-06-21', fator: 1.001195 }, // TR de 0.1195% apenas no 1º mês
        // Demais meses com TR = 0 (fator 1.0)
      ],
      encargosMensais: [
        {
          data: '2018-06-21',
          MIP: 62.54,
          DFI: 77.66,
          TCA: 25.0,
          multa: 0,
          mora: 0,
        },
      ],
      horizonteMeses: 12,
    };

    const resultado = gerarCenarioAP01(params);

    // Validações básicas
    expect(resultado.tipo).toBe('AP01');
    expect(resultado.tabela).toHaveLength(12);

    // Validar amortização constante
    const amortizacaoConstante = 302400 / 360;
    expect(amortizacaoConstante).toBe(840);
    resultado.tabela.forEach((linha) => {
      expect(linha.amortizacao).toBe(840);
    });

    // Validar primeira parcela (mês 1)
    const linha1 = resultado.tabela[0];
    expect(linha1.mes).toBe(1);
    expect(linha1.data).toBe('2018-06-21');
    expect(linha1.amortizacao).toBe(840);

    // Saldo inicial corrigido pela TR: 302400 × 1.001195 ≈ 302761.32
    const saldoCorrigido1 = 302400 * 1.001195;
    expect(saldoCorrigido1).toBeCloseTo(302761.32, 1); // Tolerância de 1 casa decimal

    // Juros da primeira parcela: 302761.32 × 0.005654145387 ≈ 1711.55
    expect(linha1.juros).toBeCloseTo(1711.55, 0); // Tolerância de 1 real

    // Prestação básica: 840 + 1711.55 ≈ 2551.55
    expect(linha1.valorOriginalParcela).toBeCloseTo(2551.55, 0); // Tolerância de 1 real

    // Encargos da primeira parcela
    expect(linha1.MIP).toBe(62.54);
    expect(linha1.DFI).toBe(77.66);
    expect(linha1.TCA).toBe(25.0);

    // Total pago: 2551.55 + 62.54 + 77.66 + 25 ≈ 2716.75
    expect(linha1.totalPago).toBeCloseTo(2716.75, 0); // Tolerância de 1 real

    // Saldo devedor após amortização: 302761.32 - 840 ≈ 301921.32
    expect(linha1.saldoDevedor).toBeCloseTo(301921.32, 1); // Tolerância de 1 casa decimal

    // Validar totais acumulados (12 meses)
    expect(resultado.totais.valorPrincipal).toBe(302400);

    // Total amortizado em 12 meses: 840 × 12 = 10080
    const totalAmortizado = resultado.tabela.reduce((sum, l) => sum + l.amortizacao, 0);
    expect(totalAmortizado).toBe(10080);

    // Total de juros (aproximado conforme TESTE-REAL.md): ~20325.60
    expect(resultado.totais.totalJuros).toBeGreaterThan(20000);
    expect(resultado.totais.totalJuros).toBeLessThan(21000);

    // Total de encargos: 165.20 × 12 = 1982.40
    expect(resultado.totais.totalTaxas).toBeCloseTo(1982.40, 2);

    // Total pago (conforme TESTE-REAL.md): ~32388.00
    expect(resultado.totais.totalPago).toBeGreaterThan(32000);
    expect(resultado.totais.totalPago).toBeLessThan(33000);
  });

  test('expande corretamente encargos de 1 entrada para todos os meses', () => {
    const params: ParametrosSAC = {
      pv: 100000,
      n: 12,
      primeiroVenc: '2020-01-01',
      faixasTaxa: [{ ini: '2020-01-01', fim: '2099-12-31', i: 0.01 }],
      encargosMensais: [
        {
          data: '2020-01-01',
          MIP: 100,
          DFI: 50,
          TCA: 25,
          multa: 10,
          mora: 5,
        },
      ],
      horizonteMeses: 12,
    };

    const resultado = gerarCenarioAP01(params);

    // Verificar que todos os meses têm os mesmos encargos
    resultado.tabela.forEach((linha) => {
      expect(linha.MIP).toBe(100);
      expect(linha.DFI).toBe(50);
      expect(linha.TCA).toBe(25);
      expect(linha.multa).toBe(10);
      expect(linha.mora).toBe(5);
    });

    // Validar totais
    expect(resultado.totais.totalMIP).toBe(100 * 12);
    expect(resultado.totais.totalDFI).toBe(50 * 12);
    expect(resultado.totais.totalTCA).toBe(25 * 12);
    expect(resultado.totais.totalMulta).toBe(10 * 12);
    expect(resultado.totais.totalMora).toBe(5 * 12);
    expect(resultado.totais.totalTaxas).toBe((100 + 50 + 25 + 10 + 5) * 12);
  });

  test('respeita o horizonte de meses configurado', () => {
    const params: ParametrosSAC = {
      pv: 302400,
      n: 360,
      primeiroVenc: '2018-06-21',
      faixasTaxa: [{ ini: '2018-06-21', fim: '2099-12-31', i: 0.005654145387 }],
      encargosMensais: [],
      horizonteMeses: 24, // Apenas 24 meses
    };

    const resultado = gerarCenarioAP01(params);

    expect(resultado.tabela).toHaveLength(24);
    expect(resultado.tabela[0].mes).toBe(1);
    expect(resultado.tabela[23].mes).toBe(24);
  });
});

describe('Motor de Cálculo - Cenário AP05 (Devido)', () => {
  test('calcula corretamente com taxa de mercado - TESTE-REAL.md', () => {
    const params: ParametrosSAC = {
      pv: 302400,
      n: 360,
      primeiroVenc: '2018-06-21',
      faixasTaxa: [
        {
          ini: '2018-06-21',
          fim: '2099-12-31',
          i: 0.004, // Taxa de mercado 0.40% a.m.
        },
      ],
      trSeries: [{ data: '2018-06-21', fator: 1.001195 }],
      horizonteMeses: 12,
    };

    const taxaMercado = 0.004;
    const resultado = gerarCenarioAP05(params, taxaMercado);

    // Validações básicas
    expect(resultado.tipo).toBe('AP05');
    expect(resultado.tabela).toHaveLength(12);

    // Validar primeira parcela com taxa de mercado
    const linha1 = resultado.tabela[0];
    const saldoCorrigido1 = 302400 * 1.001195;

    // Juros com taxa de mercado: 302761.32 × 0.004 ≈ 1211.05
    expect(linha1.juros).toBeCloseTo(1211.05, 2);

    // Prestação: 840 + 1211.05 = 2051.05
    expect(linha1.valorOriginalParcela).toBeCloseTo(2051.05, 2);

    // AP05 NÃO tem encargos (MIP, DFI, TCA)
    expect(linha1.MIP).toBeUndefined();
    expect(linha1.DFI).toBeUndefined();
    expect(linha1.TCA).toBeUndefined();

    // Total devido em 12 meses (conforme TESTE-REAL.md): ~24390.84
    expect(resultado.totais.totalDevido).toBeGreaterThan(24000);
    expect(resultado.totais.totalDevido).toBeLessThan(25000);

    // Total de juros (conforme TESTE-REAL.md): ~14310.84
    expect(resultado.totais.totalJuros).toBeGreaterThan(14000);
    expect(resultado.totais.totalJuros).toBeLessThan(15000);
  });

  test('não inclui encargos no cenário devido', () => {
    const params: ParametrosSAC = {
      pv: 100000,
      n: 12,
      primeiroVenc: '2020-01-01',
      faixasTaxa: [{ ini: '2020-01-01', fim: '2099-12-31', i: 0.005 }],
      horizonteMeses: 12,
    };

    const resultado = gerarCenarioAP05(params, 0.005);

    resultado.tabela.forEach((linha) => {
      expect(linha.MIP).toBeUndefined();
      expect(linha.DFI).toBeUndefined();
      expect(linha.TCA).toBeUndefined();
      expect(linha.multa).toBeUndefined();
      expect(linha.mora).toBeUndefined();
      expect(linha.totalPago).toBeUndefined();
    });
  });
});

describe('Motor de Cálculo - Cenário AP03 (Comparativo)', () => {
  test('calcula diferenças corretamente - TESTE-REAL.md', () => {
    // Gerar AP01 (cobrado)
    const paramsAP01: ParametrosSAC = {
      pv: 302400,
      n: 360,
      primeiroVenc: '2018-06-21',
      faixasTaxa: [{ ini: '2018-06-21', fim: '2099-12-31', i: 0.005654145387 }],
      trSeries: [{ data: '2018-06-21', fator: 1.001195 }],
      encargosMensais: [{
        data: '2018-06-21',
        MIP: 62.54,
        DFI: 77.66,
        TCA: 25.0,
        multa: 0,
        mora: 0,
      }],
      horizonteMeses: 12,
    };
    const ap01 = gerarCenarioAP01(paramsAP01);

    // Gerar AP05 (devido)
    const paramsAP05: ParametrosSAC = {
      pv: 302400,
      n: 360,
      primeiroVenc: '2018-06-21',
      faixasTaxa: [{ ini: '2018-06-21', fim: '2099-12-31', i: 0.004 }],
      trSeries: [{ data: '2018-06-21', fator: 1.001195 }],
      horizonteMeses: 12,
    };
    const ap05 = gerarCenarioAP05(paramsAP05, 0.004);

    // Gerar comparativo
    const taxaContrato = 0.005654145387;
    const taxaMercado = 0.004;
    const ap03 = gerarCenarioAP03(ap01, ap05, taxaContrato, taxaMercado);

    // Validações básicas
    expect(ap03.tipo).toBe('AP03');
    expect(ap03.tabela).toHaveLength(12);

    // Validar sobretaxa
    const sobretaxaEsperada = taxaContrato - taxaMercado;
    expect(ap03.totais.sobretaxaPP).toBeCloseTo(sobretaxaEsperada, 10);
    expect(ap03.totais.sobretaxaPP).toBeCloseTo(0.001654145387, 10);

    // Validar taxas
    expect(ap03.totais.taxaContratoAM).toBe(taxaContrato);
    expect(ap03.totais.taxaMercadoAM).toBe(taxaMercado);

    // Validar diferença da primeira parcela
    const linha1 = ap03.tabela[0];
    const diferencaEsperada1 = ap01.tabela[0].totalPago! - ap05.tabela[0].valorOriginalParcela;
    expect(linha1.diferenca).toBeCloseTo(diferencaEsperada1, 2);

    // Diferença da 1ª parcela (conforme TESTE-REAL.md): 2716.75 - 2051.05 ≈ 665.70
    expect(linha1.diferenca).toBeCloseTo(665.70, 0); // Tolerância de 1 real

    // Total a restituir em 12 meses (conforme TESTE-REAL.md): ~7997.16
    expect(ap03.totais.totalRestituir).toBeGreaterThan(7900);
    expect(ap03.totais.totalRestituir).toBeLessThan(8100);
  });

  test('diferença linha a linha é coerente', () => {
    const paramsBase: ParametrosSAC = {
      pv: 100000,
      n: 12,
      primeiroVenc: '2020-01-01',
      faixasTaxa: [{ ini: '2020-01-01', fim: '2099-12-31', i: 0.01 }],
      encargosMensais: [{
        data: '2020-01-01',
        MIP: 50,
        DFI: 30,
        TCA: 20,
        multa: 0,
        mora: 0,
      }],
      horizonteMeses: 12,
    };

    const ap01 = gerarCenarioAP01(paramsBase);
    const ap05 = gerarCenarioAP05(
      { ...paramsBase, faixasTaxa: [{ ini: '2020-01-01', fim: '2099-12-31', i: 0.008 }] },
      0.008
    );
    const ap03 = gerarCenarioAP03(ap01, ap05, 0.01, 0.008);

    // Verificar cada linha
    ap03.tabela.forEach((linha, i) => {
      const pagoAP01 = ap01.tabela[i].totalPago!;
      const devidoAP05 = ap05.tabela[i].valorOriginalParcela;
      const diferencaCalculada = pagoAP01 - devidoAP05;

      expect(linha.diferenca).toBeCloseTo(diferencaCalculada, 2);
    });

    // Soma das diferenças deve ser igual ao total a restituir
    const somaDiferencas = ap03.tabela.reduce((sum, l) => sum + (l.diferenca || 0), 0);
    expect(ap03.totais.totalRestituir).toBeCloseTo(somaDiferencas, 2);
  });
});

describe('Funções de Formatação', () => {
  test('formatarMoeda formata corretamente valores em reais', () => {
    // Aceita tanto vírgula quanto ponto como separador decimal dependendo do ambiente
    expect(formatarMoeda(1234.56)).toMatch(/R\$\s*1[.,]234[.,]56/);
    expect(formatarMoeda(10000)).toMatch(/R\$\s*10[.,]000[.,]00/);
    expect(formatarMoeda(0.5)).toMatch(/R\$\s*0[.,]50/);
    expect(formatarMoeda(302400)).toMatch(/R\$\s*302[.,]400[.,]00/);

    // Verifica que tem o símbolo R$
    expect(formatarMoeda(1234.56)).toContain('R$');
  });

  test('formatarPercent formata corretamente valores em percentual', () => {
    // Aceita tanto vírgula quanto ponto como separador decimal dependendo do ambiente
    expect(formatarPercent(0.005654145387)).toMatch(/0[.,]5654%/);
    expect(formatarPercent(0.004)).toMatch(/0[.,]4000%/);
    expect(formatarPercent(0.01)).toMatch(/1[.,]0000%/);
    expect(formatarPercent(0.1)).toMatch(/10[.,]0000%/);

    // Verifica que tem o símbolo %
    expect(formatarPercent(0.01)).toContain('%');
  });
});

describe('Validações de Integridade', () => {
  test('saldo devedor decresce corretamente ao longo do tempo', () => {
    const params: ParametrosSAC = {
      pv: 100000,
      n: 12,
      primeiroVenc: '2020-01-01',
      faixasTaxa: [{ ini: '2020-01-01', fim: '2099-12-31', i: 0.01 }],
      horizonteMeses: 12,
    };

    const resultado = gerarCenarioAP01(params);

    for (let i = 0; i < resultado.tabela.length - 1; i++) {
      const saldoAtual = resultado.tabela[i].saldoDevedor;
      const saldoProximo = resultado.tabela[i + 1].saldoDevedor;

      // Saldo devedor deve sempre diminuir (ou ser igual se amortização = 0)
      expect(saldoProximo).toBeLessThanOrEqual(saldoAtual);
    }
  });

  test('amortização constante no SAC', () => {
    const pv = 302400;
    const n = 360;
    const amortizacaoEsperada = pv / n;

    const params: ParametrosSAC = {
      pv,
      n,
      primeiroVenc: '2018-06-21',
      faixasTaxa: [{ ini: '2018-06-21', fim: '2099-12-31', i: 0.005654145387 }],
      horizonteMeses: 12,
    };

    const resultado = gerarCenarioAP01(params);

    resultado.tabela.forEach((linha) => {
      expect(linha.amortizacao).toBe(amortizacaoEsperada);
    });
  });

  test('total pago = valor original + encargos', () => {
    const params: ParametrosSAC = {
      pv: 100000,
      n: 12,
      primeiroVenc: '2020-01-01',
      faixasTaxa: [{ ini: '2020-01-01', fim: '2099-12-31', i: 0.01 }],
      encargosMensais: [{
        data: '2020-01-01',
        MIP: 50,
        DFI: 30,
        TCA: 20,
        multa: 5,
        mora: 10,
      }],
      horizonteMeses: 12,
    };

    const resultado = gerarCenarioAP01(params);

    resultado.tabela.forEach((linha) => {
      const somaEncargos = (linha.MIP || 0) + (linha.DFI || 0) + (linha.TCA || 0) +
                          (linha.multa || 0) + (linha.mora || 0);
      const totalEsperado = linha.valorOriginalParcela + somaEncargos;

      expect(linha.totalPago).toBeCloseTo(totalEsperado, 2);
    });
  });
});
