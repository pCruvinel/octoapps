/**
 * Testes Unitários - Motor de Cálculo de Cartão de Crédito (Agregado)
 *
 * Suite completa de testes para validar automaticamente todos os cálculos
 * sem necessidade de testes manuais pela interface.
 *
 * Executar: npm test calculationEngine.cartao.test.ts
 */

import { describe, it, expect } from 'vitest';
import { analisarCartaoPrevia, gerarRelatorioCompleto } from '../calculationEngine.cartao';
import type { AnaliseCartaoRequest } from '../calculationEngine.cartao';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Cria dados base para testes
 */
function createBaseRequest(overrides?: Partial<AnaliseCartaoRequest>): AnaliseCartaoRequest {
  return {
    credor: 'Banco Itaú S.A.',
    devedor: 'Maria da Silva Santos',
    data_calculo: new Date('2025-01-15'),
    data_inicio_analise: new Date('2023-01-01'),
    data_ultima_fatura: new Date('2024-12-01'),

    saldo_devedor: 5000,
    valor_principal: 5000,

    jurosRotativo: 0.105, // 10.5% a.m.
    taxaMercadoMensal: 0.05, // 5% a.m. (BACEN)

    jurosMoraPercentual: 0.01, // 1% a.m.
    multaPercentual: 0.02, // 2%
    iofValor: 35, // R$ 35/mês
    anuidade: -480, // R$ -480 (crédito)
    seguros: 25, // R$ 25/mês
    tarifas: 15, // R$ 15/mês

    mesesAnalise: 24,
    prazo_meses_simulacao: 24,

    ...overrides,
  };
}

/**
 * Calcula montante com juros compostos manualmente
 * M = P × (1 + i)^n
 */
function calcularMontanteManual(principal: number, taxa: number, meses: number): number {
  return principal * Math.pow(1 + taxa, meses);
}

/**
 * Compara valores com tolerância (para lidar com erros de ponto flutuante)
 */
function expectCloseTo(actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

// ============================================================================
// TESTES - CENÁRIO PADRÃO
// ============================================================================

describe('Motor de Cálculo de Cartão de Crédito - Cenário Padrão', () => {

  it('deve calcular corretamente o cenário padrão completo', () => {
    const params = createBaseRequest();
    const resultado = analisarCartaoPrevia(params);

    console.log('\n🧪 TESTE: Cenário Padrão');
    console.log('  Saldo: R$', params.saldo_devedor);
    console.log('  Taxa contrato:', (params.jurosRotativo * 100).toFixed(2), '%');
    console.log('  Taxa BACEN:', (params.taxaMercadoMensal! * 100).toFixed(2), '%');
    console.log('  Período:', params.mesesAnalise, 'meses');
    console.log('  Juros cobrado: R$', resultado.totalJurosCobrado.toFixed(2));
    console.log('  Juros devido: R$', resultado.totalJurosDevido.toFixed(2));
    console.log('  Diferença: R$', resultado.diferencaRestituicao.toFixed(2));

    // Validações básicas
    expect(resultado.saldoTotal).toBe(5000);
    expect(resultado.taxaMediaCobrada).toBe(0.105);
    expect(resultado.taxaMercado).toBe(0.05);

    // Sobretaxa
    expectCloseTo(resultado.sobretaxaPP, 0.055, 0.001); // 5.5 p.p.
    expectCloseTo(resultado.sobretaxaPercentual, 110, 1); // 110%

    // Juros rotativo (M = 5000 × (1.105)^24)
    const montanteContrato = calcularMontanteManual(5000, 0.105, 24);
    const jurosContratoEsperado = montanteContrato - 5000;
    expectCloseTo(resultado.totalJurosCobrado, jurosContratoEsperado, 1);

    // Juros BACEN (M = 5000 × (1.05)^24)
    const montanteBacen = calcularMontanteManual(5000, 0.05, 24);
    const jurosDevidoEsperado = montanteBacen - 5000;
    expectCloseTo(resultado.totalJurosDevido, jurosDevidoEsperado, 1);

    // Diferença
    const diferencaEsperada = jurosContratoEsperado - jurosDevidoEsperado;
    expectCloseTo(resultado.diferencaRestituicao, diferencaEsperada, 1);

    // Encargos abusivos detectados
    expect(resultado.encargosAbusivos.length).toBeGreaterThan(0);
    expect(resultado.anatocismoDetectado).toBe(true);
  });

  it('deve calcular juros de mora corretamente', () => {
    const params = createBaseRequest();
    const resultado = analisarCartaoPrevia(params);

    // Juros de Mora = 5000 × 1% × 24 meses = R$ 1.200
    const moraEsperada = 5000 * 0.01 * 24;
    expectCloseTo(resultado.totalJurosMoraCobrado, moraEsperada, 0.01);

    // Deve estar na lista de encargos abusivos
    const encargoMora = resultado.encargosAbusivos.find(e =>
      e.tipo.toLowerCase().includes('mora')
    );
    expect(encargoMora).toBeDefined();
    if (encargoMora) {
      expectCloseTo(encargoMora.valor, moraEsperada, 0.01);
    }
  });

  it('deve calcular multa corretamente', () => {
    const params = createBaseRequest();
    const resultado = analisarCartaoPrevia(params);

    // Multa = 5000 × 2% = R$ 100
    const multaEsperada = 5000 * 0.02;
    expectCloseTo(resultado.totalMultaCobrada, multaEsperada, 0.01);

    // Deve estar na lista de encargos abusivos
    const encargoMulta = resultado.encargosAbusivos.find(e =>
      e.tipo.toLowerCase().includes('multa')
    );
    expect(encargoMulta).toBeDefined();
    if (encargoMulta) {
      expectCloseTo(encargoMulta.valor, multaEsperada, 0.01);
    }
  });

  it('deve calcular IOF corretamente', () => {
    const params = createBaseRequest();
    const resultado = analisarCartaoPrevia(params);

    // IOF = R$ 35 × 24 meses = R$ 840
    const iofEsperado = 35 * 24;
    expectCloseTo(resultado.totalIOFCobrado, iofEsperado, 0.01);

    // Deve estar na lista de encargos abusivos
    const encargoIOF = resultado.encargosAbusivos.find(e =>
      e.tipo.toLowerCase().includes('iof')
    );
    expect(encargoIOF).toBeDefined();
    if (encargoIOF) {
      expectCloseTo(encargoIOF.valor, iofEsperado, 0.01);
    }
  });

  it('deve calcular CET corretamente', () => {
    const params = createBaseRequest();
    const resultado = analisarCartaoPrevia(params);

    // CET deve ser maior que taxa de rotativo (inclui outros encargos)
    expect(resultado.cetMensal).toBeGreaterThan(params.jurosRotativo);

    // CET anual deve ser muito maior (efeito exponencial)
    expect(resultado.cetAnual).toBeGreaterThan(resultado.cetMensal * 12);

    // CET mensal deve estar na ordem de 10-15% a.m.
    expect(resultado.cetMensal).toBeGreaterThan(0.10);
    expect(resultado.cetMensal).toBeLessThan(0.20);
  });
});

// ============================================================================
// TESTES - VALORES ESPERADOS EXATOS (Do documento TESTE-REAL.md)
// ============================================================================

describe('Validação contra documento TESTE-REAL.md', () => {

  it('deve bater com os valores esperados do documento', () => {
    const params = createBaseRequest();
    const resultado = analisarCartaoPrevia(params);

    console.log('\n🧪 TESTE: Validação documento TESTE-REAL.md');
    console.log('  Expected Total Encargos Cobrados: R$ 10.644,53');
    console.log('  Actual:', resultado.totalEncargosCobrados.toFixed(2));
    console.log('  Expected Total Encargos Devidos: R$ 4.325,95');
    console.log('  Actual:', resultado.totalEncargosDevidos.toFixed(2));
    console.log('  Expected Diferença: R$ 6.318,58');
    console.log('  Actual:', resultado.diferencaRestituicao.toFixed(2));

    // Composição esperada:
    // Juros rotativo cobrado: R$ 8.504,53
    // Juros de mora: R$ 1.200,00
    // Multa: R$ 100,00
    // IOF: R$ 840,00
    // Total cobrado: R$ 10.644,53

    const jurosEsperado = 8504.53;
    const moraEsperada = 1200.00;
    const multaEsperada = 100.00;
    const iofEsperado = 840.00;
    const totalCobradoEsperado = 10644.53;

    // Juros devido: R$ 4.325,95
    const jurosDevidoEsperado = 4325.95;

    // Diferença: R$ 6.318,58
    const diferencaEsperada = 6318.58;

    // Validações (tolerância de R$ 5 para arredondamentos)
    expectCloseTo(resultado.totalJurosCobrado, jurosEsperado, 5);
    expectCloseTo(resultado.totalJurosMoraCobrado, moraEsperada, 0.01);
    expectCloseTo(resultado.totalMultaCobrada, multaEsperada, 0.01);
    expectCloseTo(resultado.totalIOFCobrado, iofEsperado, 0.01);
    expectCloseTo(resultado.totalEncargosCobrados, totalCobradoEsperado, 5);
    expectCloseTo(resultado.totalJurosDevido, jurosDevidoEsperado, 5);
    expectCloseTo(resultado.diferencaRestituicao, diferencaEsperada, 5);
  });
});

// ============================================================================
// TESTES - CENÁRIO SEM ENCARGOS ADICIONAIS
// ============================================================================

describe('Cenário sem encargos adicionais (mora, multa, IOF)', () => {

  it('deve calcular corretamente sem mora, multa e IOF', () => {
    const params = createBaseRequest({
      jurosMoraPercentual: 0,
      multaPercentual: 0,
      iofValor: 0,
    });

    const resultado = analisarCartaoPrevia(params);

    console.log('\n🧪 TESTE: Sem Encargos Adicionais');
    console.log('  Total cobrado: R$', resultado.totalEncargosCobrados.toFixed(2));
    console.log('  Total devido: R$', resultado.totalEncargosDevidos.toFixed(2));
    console.log('  Diferença: R$', resultado.diferencaRestituicao.toFixed(2));

    // Sem encargos extras
    expect(resultado.totalJurosMoraCobrado).toBe(0);
    expect(resultado.totalMultaCobrada).toBe(0);
    expect(resultado.totalIOFCobrado).toBe(0);

    // Total cobrado = apenas juros rotativo
    expectCloseTo(resultado.totalEncargosCobrados, resultado.totalJurosCobrado, 0.01);

    // Diferença = juros cobrado - juros devido
    const diferencaEsperada = resultado.totalJurosCobrado - resultado.totalJurosDevido;
    expectCloseTo(resultado.diferencaRestituicao, diferencaEsperada, 0.01);

    // Lista de encargos abusivos deve ter apenas anatocismo
    const encargosAbuSemZeros = resultado.encargosAbusivos.filter(e => e.valor > 0);
    expect(encargosAbuSemZeros.length).toBeLessThanOrEqual(1); // Apenas anatocismo
  });
});

// ============================================================================
// TESTES - VALORES DIFERENTES
// ============================================================================

describe('Teste com valores diferentes', () => {

  it('deve calcular corretamente com R$ 10.000 e 12% a.m.', () => {
    const params = createBaseRequest({
      saldo_devedor: 10000,
      valor_principal: 10000,
      jurosRotativo: 0.12, // 12% a.m.
      jurosMoraPercentual: 0.015, // 1.5% a.m.
      multaPercentual: 0.025, // 2.5%
    });

    const resultado = analisarCartaoPrevia(params);

    console.log('\n🧪 TESTE: Valores Diferentes (R$ 10.000, 12%)');
    console.log('  Juros cobrado: R$', resultado.totalJurosCobrado.toFixed(2));
    console.log('  Juros devido: R$', resultado.totalJurosDevido.toFixed(2));
    console.log('  Diferença: R$', resultado.diferencaRestituicao.toFixed(2));

    // Juros rotativo (M = 10000 × (1.12)^24)
    const montanteContrato = calcularMontanteManual(10000, 0.12, 24);
    const jurosContratoEsperado = montanteContrato - 10000;
    expectCloseTo(resultado.totalJurosCobrado, jurosContratoEsperado, 5);

    // Juros de Mora = 10000 × 1.5% × 24 = R$ 3.600
    const moraEsperada = 10000 * 0.015 * 24;
    expectCloseTo(resultado.totalJurosMoraCobrado, moraEsperada, 0.01);

    // Multa = 10000 × 2.5% = R$ 250
    const multaEsperada = 10000 * 0.025;
    expectCloseTo(resultado.totalMultaCobrada, multaEsperada, 0.01);

    // Sobretaxa: 12% - 5% = 7 p.p.
    expectCloseTo(resultado.sobretaxaPP, 0.07, 0.001);

    // Sobretaxa %: (12 / 5) - 1 = 140%
    expectCloseTo(resultado.sobretaxaPercentual, 140, 1);
  });
});

// ============================================================================
// TESTES - EDGE CASES
// ============================================================================

describe('Edge Cases', () => {

  it('deve lidar com taxa zero', () => {
    const params = createBaseRequest({
      jurosRotativo: 0,
      jurosMoraPercentual: 0,
      multaPercentual: 0,
      iofValor: 0,
    });

    const resultado = analisarCartaoPrevia(params);

    expect(resultado.totalJurosCobrado).toBe(0);
    expect(resultado.totalEncargosCobrados).toBe(0);
    expect(resultado.sobretaxaPP).toBeLessThan(0); // Negativa (BACEN > contrato)
  });

  it('deve lidar com período curto (1 mês)', () => {
    const params = createBaseRequest({
      mesesAnalise: 1,
      prazo_meses_simulacao: 1,
    });

    const resultado = analisarCartaoPrevia(params);

    // Juros de 1 mês = 5000 × 10.5% = R$ 525
    const jurosEsperado1Mes = 5000 * 0.105;
    expectCloseTo(resultado.totalJurosCobrado, jurosEsperado1Mes, 1);

    // Mora de 1 mês = 5000 × 1% × 1 = R$ 50
    const moraEsperada1Mes = 5000 * 0.01 * 1;
    expectCloseTo(resultado.totalJurosMoraCobrado, moraEsperada1Mes, 0.01);
  });

  it('deve lidar com período longo (60 meses)', () => {
    const params = createBaseRequest({
      mesesAnalise: 60,
      prazo_meses_simulacao: 60,
    });

    const resultado = analisarCartaoPrevia(params);

    // Com 60 meses, juros compostos devem ser muito altos
    const montante60Meses = calcularMontanteManual(5000, 0.105, 60);
    const jurosEsperado60Meses = montante60Meses - 5000;

    expectCloseTo(resultado.totalJurosCobrado, jurosEsperado60Meses, 50);
    expect(resultado.totalJurosCobrado).toBeGreaterThan(50000); // Muito maior que principal
  });

  it('deve lidar com taxa contrato menor que BACEN', () => {
    const params = createBaseRequest({
      jurosRotativo: 0.03, // 3% a.m. (menor que BACEN 5%)
    });

    const resultado = analisarCartaoPrevia(params);

    // Sobretaxa deve ser negativa
    expect(resultado.sobretaxaPP).toBeLessThan(0);

    // Diferença deve ser negativa (pagou menos que deveria)
    expect(resultado.diferencaRestituicao).toBeLessThan(0);

    // Classificação deve ser "Dentro ou levemente acima"
    expect(resultado.classificacaoAbuso).toContain('Dentro');
  });
});

// ============================================================================
// TESTES - CLASSIFICAÇÃO DE ABUSO
// ============================================================================

describe('Classificação de Abuso', () => {

  it('deve classificar como "Dentro ou levemente acima" se sobretaxa <= 20%', () => {
    const params = createBaseRequest({
      jurosRotativo: 0.055, // 5.5% (10% acima de 5% BACEN)
    });

    const resultado = analisarCartaoPrevia(params);

    expect(resultado.sobretaxaPercentual).toBeLessThanOrEqual(20);
    expect(resultado.classificacaoAbuso).toContain('Dentro');
  });

  it('deve classificar como "Significativamente acima" se 20% < sobretaxa <= 100%', () => {
    const params = createBaseRequest({
      jurosRotativo: 0.08, // 8% (60% acima de 5% BACEN)
    });

    const resultado = analisarCartaoPrevia(params);

    expect(resultado.sobretaxaPercentual).toBeGreaterThan(20);
    expect(resultado.sobretaxaPercentual).toBeLessThanOrEqual(100);
    expect(resultado.classificacaoAbuso).toContain('Significativamente');
  });

  it('deve classificar como "Extremamente acima" se sobretaxa > 100%', () => {
    const params = createBaseRequest({
      jurosRotativo: 0.105, // 10.5% (110% acima de 5% BACEN)
    });

    const resultado = analisarCartaoPrevia(params);

    expect(resultado.sobretaxaPercentual).toBeGreaterThan(100);
    expect(resultado.classificacaoAbuso).toContain('Extremamente');
  });
});

// ============================================================================
// TESTES - RELATÓRIO COMPLETO
// ============================================================================

describe('Relatório Completo', () => {

  it('deve gerar relatório completo com tabela SAC', () => {
    const params = createBaseRequest();
    const analisePrevia = analisarCartaoPrevia(params);
    const relatorio = gerarRelatorioCompleto(params, analisePrevia);

    console.log('\n🧪 TESTE: Relatório Completo');
    console.log('  Linhas tabela SAC:', relatorio.linhas_amortizacao.length);
    console.log('  Valor principal: R$', relatorio.valor_principal.toFixed(2));
    console.log('  Total juros contrato: R$', relatorio.total_juros_contrato.toFixed(2));
    console.log('  Total juros mercado: R$', relatorio.total_juros_mercado.toFixed(2));

    // Tabela SAC deve ter 24 linhas
    expect(relatorio.linhas_amortizacao.length).toBe(24);

    // Primeira linha
    const linha1 = relatorio.linhas_amortizacao[0];
    expect(linha1.mes).toBe(1);
    expect(linha1.saldo_devedor).toBeCloseTo(5000, 0.01);

    // Última linha
    const linha24 = relatorio.linhas_amortizacao[23];
    expect(linha24.mes).toBe(24);
    expect(linha24.saldo_devedor).toBeCloseTo(0, 50); // Próximo de zero

    // Valor principal
    expect(relatorio.valor_principal).toBe(5000);

    // Resumo executivo e base legal devem estar preenchidos
    expect(relatorio.resumo_executivo).toBeTruthy();
    expect(relatorio.resumo_executivo.length).toBeGreaterThan(100);
    expect(relatorio.base_legal_metodologia).toBeTruthy();
    expect(relatorio.base_legal_metodologia.length).toBeGreaterThan(100);
  });

  it('deve calcular amortização constante no SAC', () => {
    const params = createBaseRequest();
    const analisePrevia = analisarCartaoPrevia(params);
    const relatorio = gerarRelatorioCompleto(params, analisePrevia);

    // No SAC, amortização é constante
    const A = 5000 / 24; // R$ 208,33

    relatorio.linhas_amortizacao.forEach((linha, index) => {
      expectCloseTo(linha.amortizacao, A, 0.01);

      // Juros devem diminuir ao longo do tempo (saldo diminui)
      if (index > 0) {
        const linhaAnterior = relatorio.linhas_amortizacao[index - 1];
        expect(linha.juros_contrato).toBeLessThan(linhaAnterior.juros_contrato);
        expect(linha.juros_mercado).toBeLessThan(linhaAnterior.juros_mercado);
      }
    });
  });
});

// ============================================================================
// TESTES - FORMATAÇÃO
// ============================================================================

describe('Formatação de Valores', () => {

  it('deve formatar valores corretamente em pt-BR', () => {
    const params = createBaseRequest();
    const resultado = analisarCartaoPrevia(params);

    // Valores formatados devem usar vírgula e ponto brasileiro
    expect(resultado.formatted.saldoTotal).toMatch(/R\$\s*\d{1,3}(\.\d{3})*,\d{2}/);
    expect(resultado.formatted.taxaMediaCobrada).toMatch(/\d+,\d+%/);
    expect(resultado.formatted.diferencaRestituicao).toMatch(/R\$\s*\d{1,3}(\.\d{3})*,\d{2}/);

    // Exemplo: "R$ 5.000,00"
    expect(resultado.formatted.saldoTotal).toBe('R$ 5.000,00');

    // Exemplo: "10,5000%"
    expect(resultado.formatted.taxaMediaCobrada).toMatch(/10,50/);
  });
});

// ============================================================================
// TESTE FINAL - RESUMO
// ============================================================================

describe('Resumo de Validação', () => {

  it('deve passar em todos os critérios de validação', () => {
    const params = createBaseRequest();
    const resultado = analisarCartaoPrevia(params);

    console.log('\n✅ RESUMO DE VALIDAÇÃO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Saldo Devedor:          R$', resultado.saldoTotal.toFixed(2));
    console.log('Taxa Cobrada:          ', (resultado.taxaMediaCobrada * 100).toFixed(2), '%');
    console.log('Taxa BACEN:            ', (resultado.taxaMercado * 100).toFixed(2), '%');
    console.log('Sobretaxa (p.p.):      ', (resultado.sobretaxaPP * 100).toFixed(2), 'p.p.');
    console.log('Sobretaxa (%):         ', resultado.sobretaxaPercentual.toFixed(2), '%');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Juros Rotativo:         R$', resultado.totalJurosCobrado.toFixed(2));
    console.log('Juros de Mora:          R$', resultado.totalJurosMoraCobrado.toFixed(2));
    console.log('Multa:                  R$', resultado.totalMultaCobrada.toFixed(2));
    console.log('IOF:                    R$', resultado.totalIOFCobrado.toFixed(2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total Encargos Cobrados: R$', resultado.totalEncargosCobrados.toFixed(2));
    console.log('Total Encargos Devidos:  R$', resultado.totalEncargosDevidos.toFixed(2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DIFERENÇA (Restituição): R$', resultado.diferencaRestituicao.toFixed(2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CET Mensal:            ', (resultado.cetMensal * 100).toFixed(2), '%');
    console.log('CET Anual:             ', (resultado.cetAnual * 100).toFixed(2), '%');
    console.log('Anatocismo:            ', resultado.anatocismoDetectado ? 'SIM' : 'NÃO');
    console.log('Classificação:         ', resultado.classificacaoAbuso);
    console.log('Encargos Abusivos:     ', resultado.encargosAbusivos.length, 'detectados');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Checklist completo
    expect(resultado.saldoTotal).toBe(5000);
    expect(resultado.taxaMediaCobrada).toBe(0.105);
    expect(resultado.taxaMercado).toBe(0.05);
    expect(resultado.anatocismoDetectado).toBe(true);
    expect(resultado.encargosAbusivos.length).toBeGreaterThan(0);
    expect(resultado.diferencaRestituicao).toBeGreaterThan(0);
    expect(resultado.totalEncargosCobrados).toBeGreaterThan(resultado.totalEncargosDevidos);
  });
});
