import { describe, it, expect } from 'vitest';
import {
  calcularEmprestimoPRICE,
  calcularCET,
  validarTacTec,
  validarSeguros,
  validarComissaoPermanencia,
  analisarEmprestimoPrevia,
} from '../calculationEngine.emprestimo';
import type {
  CalculoEmprestimoPRICERequest,
  AnaliseEmprestimoRequest,
} from '@/types/calculation.types';

describe('calculationEngine.emprestimo - Sistema PRICE', () => {
  it('deve calcular tabela PRICE completa', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 50000,
      numeroParcelas: 60,
      taxaMensalCobrada: 0.0199, // 1.99% a.m.
      taxaMensalMercado: 0.015, // 1.5% a.m.
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    expect(resultado).toBeDefined();
    expect(resultado.cenarioCobrado.tabela).toHaveLength(60);
    expect(resultado.cenarioDevido.tabela).toHaveLength(60);
    expect(resultado.cenarioCobrado.valorParcela).toBeGreaterThan(0);
    expect(resultado.cenarioCobrado.totalJuros).toBeGreaterThan(0);
    expect(resultado.cenarioDevido.totalJuros).toBeGreaterThan(0);
  });

  it('deve ter parcela fixa no sistema PRICE', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 30000,
      numeroParcelas: 36,
      taxaMensalCobrada: 0.02,
      taxaMensalMercado: 0.015,
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    // Todas as parcelas devem ter o mesmo valor (PRICE)
    const primeiraParcela = resultado.cenarioCobrado.tabela[0].valorParcela;
    const ultimaParcela = resultado.cenarioCobrado.tabela[35].valorParcela;

    expect(primeiraParcela).toBeCloseTo(ultimaParcela, 2);
  });

  it('deve ter saldo devedor decrescente', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 20000,
      numeroParcelas: 24,
      taxaMensalCobrada: 0.015,
      taxaMensalMercado: 0.01,
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    // Saldo devedor deve decrescer mês a mês
    for (let i = 0; i < resultado.cenarioCobrado.tabela.length - 1; i++) {
      expect(resultado.cenarioCobrado.tabela[i].saldoDevedor).toBeGreaterThan(
        resultado.cenarioCobrado.tabela[i + 1].saldoDevedor
      );
    }

    // Último saldo devedor deve ser zero
    expect(resultado.cenarioCobrado.tabela[23].saldoDevedor).toBeCloseTo(0, 0);
  });

  it('deve ter amortização crescente e juros decrescentes', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 10000,
      numeroParcelas: 12,
      taxaMensalCobrada: 0.02,
      taxaMensalMercado: 0.015,
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    // Primeira parcela deve ter menos amortização e mais juros
    const primeira = resultado.cenarioCobrado.tabela[0];
    const ultima = resultado.cenarioCobrado.tabela[11];

    expect(primeira.amortizacao).toBeLessThan(ultima.amortizacao);
    expect(primeira.juros).toBeGreaterThan(ultima.juros);
  });

  it('deve calcular com encargos iniciais', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 10000,
      numeroParcelas: 12,
      taxaMensalCobrada: 0.02,
      taxaMensalMercado: 0.015,
      dataInicio: '2024-01-01',
      encargosIniciais: {
        tac: 300,
        tec: 50,
      },
    };

    const resultado = calcularEmprestimoPRICE(request);

    // Encargos iniciais não afetam o valor da parcela
    expect(resultado.cenarioCobrado.valorParcela).toBeGreaterThan(0);
    expect(resultado.cenarioCobrado.tabela).toHaveLength(12);
  });

  it('deve calcular com seguros recorrentes', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 10000,
      numeroParcelas: 12,
      taxaMensalCobrada: 0.02,
      taxaMensalMercado: 0.015,
      dataInicio: '2024-01-01',
      encargosRecorrentes: {
        seguroVida: 50,
        seguroPrestamista: 30,
      },
    };

    const resultado = calcularEmprestimoPRICE(request);

    // Encargos recorrentes aumentam o valor total das parcelas
    expect(resultado.cenarioCobrado.totalEncargos).toBeGreaterThan(0);
  });

  it('deve comparar cenário cobrado vs devido', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 15000,
      numeroParcelas: 18,
      taxaMensalCobrada: 0.03,
      taxaMensalMercado: 0.02,
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    // Cenário cobrado deve ter mais juros que o devido
    expect(resultado.cenarioCobrado.totalJuros).toBeGreaterThan(resultado.cenarioDevido.totalJuros);
    expect(resultado.comparativo.diferencaJuros).toBeGreaterThan(0);
  });
});

describe('calculationEngine.emprestimo - CET', () => {
  it('deve calcular CET mensal e anual', () => {
    const resultado = calcularCET({
      valorFinanciado: 10000,
      parcelas: Array(12).fill(900),
      encargosIniciais: 100,
    });

    expect(resultado.cetMensal).toBeGreaterThanOrEqual(0);
    expect(resultado.cetAnual).toBeGreaterThanOrEqual(0);
    expect(resultado.cetAnual).toBeGreaterThan(resultado.cetMensal * 10); // Capitalização
  });

  it('deve calcular CET maior que taxa nominal quando há encargos', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 10000,
      numeroParcelas: 12,
      taxaMensalCobrada: 0.02,
      taxaMensalMercado: 0.015,
      dataInicio: '2024-01-01',
      encargosIniciais: {
        tac: 300,
      },
    };

    const resultado = calcularEmprestimoPRICE(request);

    // CET deve ser maior que a taxa nominal devido aos encargos
    expect(resultado.cet.cetMensalCobrado).toBeGreaterThanOrEqual(0.02);
  });

  it('deve convergir com método Newton-Raphson', () => {
    const resultado = calcularCET({
      valorFinanciado: 50000,
      parcelas: Array(60).fill(1000),
      encargosIniciais: 500,
    });

    // Verificar que a CET é finita e razoável
    expect(Number.isFinite(resultado.cetMensal)).toBe(true);
    expect(resultado.cetMensal).toBeGreaterThan(0);
    expect(resultado.cetMensal).toBeLessThan(1); // Menos de 100% a.m.
  });

  it('deve calcular CET = 0 quando não há juros nem encargos', () => {
    const resultado = calcularCET({
      valorFinanciado: 12000,
      parcelas: Array(12).fill(1000), // 12 x 1000 = 12000 (sem juros)
      encargosIniciais: 0,
    });

    // CET deve ser próxima de zero quando não há juros
    expect(resultado.cetMensal).toBeCloseTo(0, 3);
  });
});

describe('calculationEngine.emprestimo - Validação TAC/TEC', () => {
  it('deve identificar TAC/TEC irregular após 30/04/2008', () => {
    const resultado = validarTacTec({
      dataContrato: '2010-01-01',
      tac: 300,
      tec: 50,
    });

    expect(resultado.tacTecIrregular).toBe(true);
    expect(resultado.motivoIrregularidade).toContain('vedadas');
  });

  it('deve aceitar TAC/TEC antes de 30/04/2008', () => {
    const resultado = validarTacTec({
      dataContrato: '2007-12-01',
      tac: 300,
      tec: 50,
    });

    expect(resultado.tacTecIrregular).toBe(false);
  });

  it('deve aceitar TAC/TEC na data limite (30/04/2008)', () => {
    const resultado = validarTacTec({
      dataContrato: '2008-04-30',
      tac: 200,
      tec: 30,
    });

    expect(resultado.tacTecIrregular).toBe(false);
  });

  it('deve identificar irregular no dia seguinte (01/05/2008)', () => {
    const resultado = validarTacTec({
      dataContrato: '2008-05-01',
      tac: 200,
      tec: 30,
    });

    expect(resultado.tacTecIrregular).toBe(true);
  });

  it('deve aceitar se TAC e TEC forem zero ou undefined', () => {
    const resultado = validarTacTec({
      dataContrato: '2020-01-01',
      tac: 0,
      tec: 0,
    });

    expect(resultado.tacTecIrregular).toBe(false);
  });
});

describe('calculationEngine.emprestimo - Validação Seguros', () => {
  it('deve identificar seguros não consentidos (venda casada)', () => {
    const resultado = validarSeguros({
      seguros: [
        { nome: 'Seguro Vida', valor: 50, consentimento: false },
        { nome: 'Seguro Prestamista', valor: 30, consentimento: true },
      ],
    });

    expect(resultado.segurosIrregulares).toHaveLength(1);
    expect(resultado.segurosIrregulares[0]).toContain('Seguro Vida');
  });

  it('deve aceitar seguros consentidos', () => {
    const resultado = validarSeguros({
      seguros: [
        { nome: 'Seguro Vida', valor: 50, consentimento: true },
        { nome: 'Seguro Prestamista', valor: 30, consentimento: true },
      ],
    });

    expect(resultado.segurosIrregulares).toHaveLength(0);
  });

  it('deve identificar múltiplos seguros irregulares', () => {
    const resultado = validarSeguros({
      seguros: [
        { nome: 'Seguro A', valor: 50, consentimento: false },
        { nome: 'Seguro B', valor: 30, consentimento: false },
        { nome: 'Seguro C', valor: 20, consentimento: true },
      ],
    });

    expect(resultado.segurosIrregulares).toHaveLength(2);
  });

  it('deve aceitar lista vazia de seguros', () => {
    const resultado = validarSeguros({
      seguros: [],
    });

    expect(resultado.segurosIrregulares).toHaveLength(0);
  });
});

describe('calculationEngine.emprestimo - Validação Comissão de Permanência', () => {
  it('deve identificar cumulação irregular (Súmula 472 STJ)', () => {
    const resultado = validarComissaoPermanencia({
      comissaoPermanencia: true,
      jurosMora: 0.01,
      multa: 0.02,
    });

    expect(resultado.cumulacaoIrregular).toBe(true);
    expect(resultado.motivoIrregularidade).toContain('Súmula 472');
  });

  it('deve aceitar comissão de permanência isolada', () => {
    const resultado = validarComissaoPermanencia({
      comissaoPermanencia: true,
      jurosMora: 0,
      multa: 0,
    });

    expect(resultado.cumulacaoIrregular).toBe(false);
  });

  it('deve aceitar juros de mora e multa sem comissão', () => {
    const resultado = validarComissaoPermanencia({
      comissaoPermanencia: false,
      jurosMora: 0.01,
      multa: 0.02,
    });

    expect(resultado.cumulacaoIrregular).toBe(false);
  });

  it('deve identificar cumulação apenas com juros de mora', () => {
    const resultado = validarComissaoPermanencia({
      comissaoPermanencia: true,
      jurosMora: 0.01,
      multa: 0,
    });

    expect(resultado.cumulacaoIrregular).toBe(true);
  });

  it('deve identificar cumulação apenas com multa', () => {
    const resultado = validarComissaoPermanencia({
      comissaoPermanencia: true,
      jurosMora: 0,
      multa: 0.02,
    });

    expect(resultado.cumulacaoIrregular).toBe(true);
  });
});

describe('calculationEngine.emprestimo - Análise Prévia', () => {
  it('deve analisar empréstimo PRICE completo', () => {
    const request: AnaliseEmprestimoRequest = {
      valorFinanciado: 30000,
      numeroParcelas: 48,
      taxaMensal: 0.0299, // 2.99% a.m.
      taxaMercadoMensal: 0.02, // 2% a.m.
      dataContrato: '2022-01-01',
    };

    const resultado = analisarEmprestimoPrevia(request);

    expect(resultado).toBeDefined();
    expect(resultado.totalJurosCobrado).toBeGreaterThan(0);
    expect(resultado.totalJurosDevido).toBeGreaterThan(0);
    expect(resultado.diferencaRestituicao).toBeGreaterThan(0);
    expect(resultado.sobretaxaPP).toBeGreaterThan(0);
  });

  it('deve calcular CET do empréstimo', () => {
    const request: AnaliseEmprestimoRequest = {
      valorFinanciado: 10000,
      numeroParcelas: 12,
      taxaMensal: 0.03,
      taxaMercadoMensal: 0.02,
      dataContrato: '2023-01-01',
    };

    const resultado = analisarEmprestimoPrevia(request);

    expect(resultado.cetMensal).toBeGreaterThan(0);
    expect(resultado.cetAnual).toBeGreaterThan(0);
  });

  it('deve identificar percentual de abuso', () => {
    const request: AnaliseEmprestimoRequest = {
      valorFinanciado: 5000,
      numeroParcelas: 12,
      taxaMensal: 0.10, // 10% a.m. (alta)
      taxaMercadoMensal: 0.03, // 3% a.m.
      dataContrato: '2023-01-01',
    };

    const resultado = analisarEmprestimoPrevia(request);

    expect(resultado.percentualAbuso).toBeGreaterThan(100); // Mais de 100% de abuso
  });

  it('deve formatar valores para exibição', () => {
    const request: AnaliseEmprestimoRequest = {
      valorFinanciado: 15000,
      numeroParcelas: 24,
      taxaMensal: 0.025,
      taxaMercadoMensal: 0.015,
      dataContrato: '2023-01-01',
    };

    const resultado = analisarEmprestimoPrevia(request);

    expect(resultado.formatted).toBeDefined();
    expect(resultado.formatted?.valorFinanciado).toMatch(/R\$/);
    expect(resultado.formatted?.taxaCobradaMensal).toMatch(/%/);
  });
});

describe('calculationEngine.emprestimo - Casos Extremos', () => {
  it('deve lidar com valores muito pequenos', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 100,
      numeroParcelas: 6,
      taxaMensalCobrada: 0.02,
      taxaMensalMercado: 0.015,
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    expect(resultado.cenarioCobrado.valorParcela).toBeGreaterThan(0);
    expect(Number.isFinite(resultado.cenarioCobrado.totalJuros)).toBe(true);
  });

  it('deve lidar com valores muito grandes', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 10000000,
      numeroParcelas: 240,
      taxaMensalCobrada: 0.01,
      taxaMensalMercado: 0.008,
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    expect(Number.isFinite(resultado.cenarioCobrado.valorParcela)).toBe(true);
    expect(resultado.cenarioCobrado.totalJuros).toBeGreaterThan(0);
  });

  it('deve lidar com parcelas longas (até 600)', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 500000,
      numeroParcelas: 600,
      taxaMensalCobrada: 0.008,
      taxaMensalMercado: 0.006,
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    expect(resultado.cenarioCobrado.tabela).toHaveLength(600);
    expect(resultado.cenarioCobrado.tabela[599].saldoDevedor).toBeCloseTo(0, 0);
  });

  it('deve lidar com taxa muito baixa', () => {
    const request: CalculoEmprestimoPRICERequest = {
      valorFinanciado: 10000,
      numeroParcelas: 12,
      taxaMensalCobrada: 0.001, // 0.1% a.m.
      taxaMensalMercado: 0.0005,
      dataInicio: '2024-01-01',
    };

    const resultado = calcularEmprestimoPRICE(request);

    expect(resultado.cenarioCobrado.valorParcela).toBeGreaterThan(833.33); // 10000/12
    expect(resultado.cenarioCobrado.totalJuros).toBeGreaterThan(0);
  });
});
