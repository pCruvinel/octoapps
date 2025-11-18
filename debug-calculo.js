/**
 * Script de debug para validar os cálculos SAC
 */

// Simular os dados exatos do formulário
const dadosTeste = {
  pv: 302400,
  n: 360,
  primeiroVenc: "2018-06-21",
  taxaContratoMensal: 0.005654145387,
  taxaMercadoMensal: 0.0062,
  mip: 62.54,
  dfi: 77.66,
  tca: 25,
  horizonteMeses: 12
};

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║          DEBUG DO MOTOR DE CÁLCULO SAC            ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

console.log('📊 DADOS DE ENTRADA:');
console.log('─'.repeat(50));
console.log('PV (Valor Financiado):', dadosTeste.pv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('n (Parcelas):', dadosTeste.n);
console.log('Primeiro Vencimento:', dadosTeste.primeiroVenc);
console.log('Taxa Contrato (mensal):', (dadosTeste.taxaContratoMensal * 100).toFixed(4) + '%');
console.log('Taxa Mercado (mensal):', (dadosTeste.taxaMercadoMensal * 100).toFixed(4) + '%');
console.log('Horizonte:', dadosTeste.horizonteMeses, 'meses');
console.log('─'.repeat(50));

// Calcular manualmente a primeira parcela
console.log('\n🔍 CÁLCULO MANUAL DA PRIMEIRA PARCELA (SAC):');
console.log('─'.repeat(50));

const A = dadosTeste.pv / dadosTeste.n;
console.log('Amortização (A) = PV / n');
console.log(`A = ${dadosTeste.pv} / ${dadosTeste.n}`);
console.log(`A = R$ ${A.toFixed(2)}`);

const SD_0 = dadosTeste.pv;
console.log('\nSaldo Devedor inicial (SD_0) = R$', SD_0.toFixed(2));

const J_1 = SD_0 * dadosTeste.taxaContratoMensal;
console.log('\nJuros da 1ª parcela (J_1) = SD_0 × i');
console.log(`J_1 = ${SD_0} × ${dadosTeste.taxaContratoMensal}`);
console.log(`J_1 = R$ ${J_1.toFixed(2)}`);

const P_1 = A + J_1;
console.log('\nPrestação da 1ª parcela (P_1) = A + J_1');
console.log(`P_1 = ${A.toFixed(2)} + ${J_1.toFixed(2)}`);
console.log(`P_1 = R$ ${P_1.toFixed(2)}`);

const Pago_1 = P_1 + dadosTeste.mip + dadosTeste.dfi + dadosTeste.tca;
console.log('\nTotal Pago na 1ª parcela (Pago_1) = P_1 + MIP + DFI + TCA');
console.log(`Pago_1 = ${P_1.toFixed(2)} + ${dadosTeste.mip} + ${dadosTeste.dfi} + ${dadosTeste.tca}`);
console.log(`Pago_1 = R$ ${Pago_1.toFixed(2)}`);

const SD_1_temp = SD_0 - A;
const TR_1 = 1; // Sem TR na primeira parcela
const SD_1 = SD_1_temp * TR_1;
console.log('\nSaldo Devedor após 1ª parcela (SD_1) = (SD_0 - A) × TR');
console.log(`SD_1 = (${SD_0} - ${A.toFixed(2)}) × ${TR_1}`);
console.log(`SD_1 = R$ ${SD_1.toFixed(2)}`);

console.log('─'.repeat(50));

// Calcular total de 12 parcelas manualmente
console.log('\n📈 CÁLCULO DE 12 PARCELAS (CENÁRIO COBRADO):');
console.log('─'.repeat(50));

let saldoDevedor = dadosTeste.pv;
let totalPago12Meses = 0;
let totalJuros12Meses = 0;

console.log('\n| Mês | Prestação | Encargos | Total Pago | SD |');
console.log('|-----|-----------|----------|------------|------------|');

for (let mes = 1; mes <= dadosTeste.horizonteMeses; mes++) {
  const juros = saldoDevedor * dadosTeste.taxaContratoMensal;
  const prestacao = A + juros;

  // Encargos apenas na primeira parcela
  const encargos = mes === 1 ? (dadosTeste.mip + dadosTeste.dfi + dadosTeste.tca) : 0;
  const totalPago = prestacao + encargos;

  saldoDevedor = saldoDevedor - A; // TR = 1 para simplificar

  totalPago12Meses += totalPago;
  totalJuros12Meses += juros;

  console.log(`| ${mes.toString().padStart(3)} | R$ ${prestacao.toFixed(2).padStart(10)} | R$ ${encargos.toFixed(2).padStart(8)} | R$ ${totalPago.toFixed(2).padStart(10)} | R$ ${saldoDevedor.toFixed(2).padStart(12)} |`);
}

console.log('─'.repeat(50));
console.log('TOTAL PAGO (12 meses):', totalPago12Meses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('TOTAL JUROS (12 meses):', totalJuros12Meses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('─'.repeat(50));

// Calcular cenário devido (taxa de mercado)
console.log('\n📉 CÁLCULO DE 12 PARCELAS (CENÁRIO DEVIDO):');
console.log('─'.repeat(50));

let saldoDevedorMkt = dadosTeste.pv;
let totalDevido12Meses = 0;
let totalJurosMkt12Meses = 0;

for (let mes = 1; mes <= dadosTeste.horizonteMeses; mes++) {
  const juros = saldoDevedorMkt * dadosTeste.taxaMercadoMensal;
  const prestacao = A + juros;

  saldoDevedorMkt = saldoDevedorMkt - A;

  totalDevido12Meses += prestacao;
  totalJurosMkt12Meses += juros;
}

console.log('TOTAL DEVIDO (12 meses):', totalDevido12Meses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('TOTAL JUROS (12 meses):', totalJurosMkt12Meses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('─'.repeat(50));

// Comparativo
console.log('\n💰 COMPARATIVO:');
console.log('─'.repeat(50));
const diferenca = totalPago12Meses - totalDevido12Meses;
console.log('Valor Total Pago (cobrado):', totalPago12Meses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('Valor Total Devido (mercado):', totalDevido12Meses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('Diferença (Restituição):', diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
console.log('─'.repeat(50));

console.log('\n✅ VALORES ESPERADOS DO DOCUMENTO:');
console.log('─'.repeat(50));
console.log('Valor Total Pago: ~R$ 32.579,52');
console.log('Valor Devido: ~R$ 32.467,20');
console.log('Diferença: ~R$ 112,32');
console.log('─'.repeat(50));

console.log('\n🔴 VALORES REPORTADOS PELO USUÁRIO:');
console.log('─'.repeat(50));
console.log('Valor Total Pago: R$ 322.769,50');
console.log('Valor Devido: R$ 324.554,83');
console.log('─'.repeat(50));

const ratio = 322769.50 / totalPago12Meses;
console.log('\n🔬 ANÁLISE DA DISCREPÂNCIA:');
console.log('─'.repeat(50));
console.log('Razão (reportado/calculado):', ratio.toFixed(2) + 'x');
console.log('─'.repeat(50));

if (Math.abs(ratio - 10) < 0.5) {
  console.log('\n⚠️  POSSÍVEL CAUSA: Multiplicação por 10x');
  console.log('Pode estar somando todas as 360 parcelas ao invés de apenas 12.');
} else {
  console.log('\n⚠️  Causa da discrepância não identificada automaticamente.');
}

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║                  FIM DO DEBUG                     ║');
console.log('╚═══════════════════════════════════════════════════╝\n');
