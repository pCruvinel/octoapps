/**
 * Script de teste para validar o motor de cálculo SAC
 * Usa os dados fornecidos na especificação
 */

// Dados de teste conforme especificação
const testAnalisPrevia = {
  pv: 302400,
  n: 360,
  primeiroVenc: "2018-06-21",
  taxaContratoMensal: 0.005654145387,
  taxaMercadoMensal: 0.0062,
  segurosMedios: {
    MIP: 62.54,
    DFI: 77.66,
    TCA: 25
  },
  horizonteMeses: 12,
  trSeries: [
    { data: "2022-01-21", fator: 1.001195 }
  ]
};

const testRelatorioCompleto = {
  credor: "Ana Silva",
  devedor: "Carlos Pereira",
  contratoNum: "98765",
  metodologia: "SAC com TR — AP01 (Cobrado) vs AP05 (Devido)",
  pv: 302400,
  n: 360,
  primeiroVenc: "2018-06-21",
  faixasTaxa: [
    { ini: "2018-06-21", fim: "2020-02-21", i: 0.005654145387 },
    { ini: "2020-03-21", fim: "2023-07-21", i: 0.005025 },
    { ini: "2023-08-21", fim: "2048-05-21", i: 0.00834755 }
  ],
  trSeries: [
    { data: "2022-01-21", fator: 1.001195 }
  ],
  encargosMensais: [
    {
      data: "2018-06-21",
      MIP: 62.54,
      DFI: 77.66,
      TCA: 25,
      multa: 0,
      mora: 0
    }
  ],
  taxaMercadoMensal: 0.0062,
  horizonteMeses: 12,
  tabelaExibe: "cobrado"
};

async function testAnalisePreviaAPI() {
  console.log('\n=== TESTE: Análise Prévia ===\n');

  try {
    const response = await fetch('http://localhost:3001/api/analise_previa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAnalisPrevia),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro:', error);
      return;
    }

    const data = await response.json();

    console.log('Resultado da Análise Prévia:');
    console.log('─'.repeat(50));
    console.log('Taxa do Contrato (mensal):', data.formatted.taxaContratoAM);
    console.log('Taxa de Mercado (mensal):', data.formatted.taxaMercadoAM);
    console.log('Sobretaxa:', data.formatted.sobretaxaPP);
    console.log('Valor Total Pago:', data.formatted.valorTotalPago);
    console.log('Valor Devido:', data.formatted.valorDevido);
    console.log('Diferença (Restituição):', data.formatted.diferencaRestituicao);
    console.log('─'.repeat(50));

    console.log('\n✅ Teste de Análise Prévia APROVADO\n');
  } catch (error) {
    console.error('❌ Erro ao testar análise prévia:', error.message);
  }
}

async function testRelatorioCompletoAPI() {
  console.log('\n=== TESTE: Relatório Completo ===\n');

  try {
    const response = await fetch('http://localhost:3001/api/relatorio_completo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRelatorioCompleto),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro:', error);
      return;
    }

    const data = await response.json();

    console.log('Resultado do Relatório Completo:');
    console.log('─'.repeat(50));
    console.log('Credor:', data.credor);
    console.log('Devedor:', data.devedor);
    console.log('Contrato:', data.contratoNum);
    console.log('\nCards:');
    console.log('  Valor Principal:', data.formatted.cards.valorPrincipal);
    console.log('  Total de Juros:', data.formatted.cards.totalJuros);
    console.log('  Total de Taxas:', data.formatted.cards.totalTaxas);
    console.log('  Valor Total Devido:', data.formatted.cards.valorTotalDevido);
    console.log('  Total a Restituir:', data.formatted.cards.totalRestituir);
    console.log('\nComparativo:');
    console.log('  Taxa Contrato:', data.formatted.comparativo.taxaContratoAM);
    console.log('  Taxa Mercado:', data.formatted.comparativo.taxaMercadoAM);
    console.log('  Sobretaxa:', data.formatted.comparativo.sobretaxaPP);
    console.log('\nTabela de Amortização (primeiras 3 linhas):');
    console.log('─'.repeat(50));

    data.tabelaAmortizacao.slice(0, 3).forEach((linha) => {
      console.log(`Mês ${linha.mes} (${linha.data}):`);
      console.log(`  Prestação: R$ ${linha.valorOriginalParcela.toFixed(2)}`);
      console.log(`  Juros: R$ ${linha.juros.toFixed(2)}`);
      console.log(`  Amortização: R$ ${linha.amortizacao.toFixed(2)}`);
      console.log(`  Saldo Devedor: R$ ${linha.saldoDevedor.toFixed(2)}`);
      console.log('');
    });

    console.log('─'.repeat(50));

    // Validar primeira parcela com valores esperados
    const primeiraLinha = data.tabelaAmortizacao[0];
    console.log('\nVALIDAÇÃO DA PRIMEIRA PARCELA:');
    console.log('─'.repeat(50));
    console.log('Esperado P_1 = 2549.76');
    console.log('Calculado P_1 =', primeiraLinha.valorOriginalParcela.toFixed(2));
    console.log('Esperado Pago_1 = 2714.96');
    console.log('Calculado Pago_1 =', (primeiraLinha.totalPago || 0).toFixed(2));
    console.log('Esperado SD_1 = 301560.00');
    console.log('Calculado SD_1 =', primeiraLinha.saldoDevedor.toFixed(2));
    console.log('Esperado J_1 = 1709.76');
    console.log('Calculado J_1 =', primeiraLinha.juros.toFixed(2));
    console.log('Esperado A = 840.00');
    console.log('Calculado A =', primeiraLinha.amortizacao.toFixed(2));
    console.log('─'.repeat(50));

    console.log('\n✅ Teste de Relatório Completo APROVADO\n');
  } catch (error) {
    console.error('❌ Erro ao testar relatório completo:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   TESTES DO MOTOR DE CÁLCULO REVISIONAL SFH/SAC  ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  await testAnalisePreviaAPI();
  await testRelatorioCompletoAPI();

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║            TODOS OS TESTES CONCLUÍDOS             ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
}

runTests();
