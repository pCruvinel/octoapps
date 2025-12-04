/**
 * Script para buscar todas as taxas históricas do BACEN via API OLINDA
 *
 * API: https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/swagger-ui3
 * Série: Financiamento Imobiliário - Aquisição de Imóveis
 * Modalidade: "Aquisição de imóveis - Operações não referenciadas"
 *
 * Como usar:
 * 1. Instalar Node.js (se não tiver)
 * 2. Executar: node scripts/buscar-taxas-bacen-olinda.js
 * 3. O script vai gerar um arquivo SQL com os INSERTs
 */

const https = require('https');
const fs = require('fs');

// Configuração
const INICIO = '201101'; // Janeiro/2011
const FIM = new Date().toISOString().slice(0, 7).replace('-', ''); // Mês atual (YYYYMM)

console.log('🔍 Buscando taxas do BACEN via API OLINDA...');
console.log(`📅 Período: ${INICIO} até ${FIM}`);

// URL da API OLINDA
// Filtros:
// - Modalidade: Aquisição de imóveis - Operações não referenciadas
// - Período: >= 201101
const url = `https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosMensalPorMes?` +
  `$filter=Modalidade%20eq%20'Aquisi%C3%A7%C3%A3o%20de%20im%C3%B3veis%20-%20Opera%C3%A7%C3%B5es%20n%C3%A3o%20referenciadas'%20and%20AnoMes%20ge%20${INICIO}%20and%20AnoMes%20le%20${FIM}` +
  `&$format=json` +
  `&$orderby=AnoMes`;

console.log('🌐 URL:', url);
console.log('⏳ Aguarde...\n');

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);

      if (!json.value || json.value.length === 0) {
        console.error('❌ Nenhum dado retornado pela API');
        console.log('Resposta:', json);
        return;
      }

      console.log(`✅ ${json.value.length} registros encontrados!\n`);

      // Processar dados
      const registros = json.value.map(item => {
        const anoMes = item.AnoMes.toString();
        const ano = parseInt(anoMes.substring(0, 4));
        const mes = parseInt(anoMes.substring(4, 6));
        const taxaMensalPercent = parseFloat(item.TaxaJurosAoMes);
        const taxaMensalDecimal = taxaMensalPercent / 100;
        const taxaAnualDecimal = Math.pow(1 + taxaMensalDecimal, 12) - 1;

        return {
          anoMes,
          ano,
          mes,
          taxaMensalPercent: taxaMensalPercent.toFixed(6),
          taxaMensalDecimal: taxaMensalDecimal.toFixed(8),
          taxaAnualDecimal: taxaAnualDecimal.toFixed(8)
        };
      });

      // Mostrar primeiros 5 registros
      console.log('📊 Primeiros registros:');
      registros.slice(0, 5).forEach(r => {
        console.log(`  ${r.anoMes}: ${r.taxaMensalPercent}% a.m. (${r.taxaAnualDecimal} a.a.)`);
      });
      console.log('  ...');
      console.log(`  ${registros[registros.length-1].anoMes}: ${registros[registros.length-1].taxaMensalPercent}% a.m.\n`);

      // Gerar SQL
      let sql = `-- =====================================================\n`;
      sql += `-- TAXAS BACEN - Dados Reais da API OLINDA\n`;
      sql += `-- Série 432: Financiamento Imobiliário\n`;
      sql += `-- Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
      sql += `-- Total de registros: ${registros.length}\n`;
      sql += `-- =====================================================\n\n`;

      sql += `INSERT INTO taxas_bacen_historico (ano_mes, ano, mes, taxa_mensal_percent, taxa_mensal_decimal, taxa_anual_decimal) VALUES\n`;

      registros.forEach((r, index) => {
        sql += `('${r.anoMes}', ${r.ano}, ${r.mes}, ${r.taxaMensalPercent}, ${r.taxaMensalDecimal}, ${r.taxaAnualDecimal})`;
        sql += index < registros.length - 1 ? ',\n' : '\n';
      });

      sql += `ON CONFLICT (ano_mes) DO UPDATE SET\n`;
      sql += `  taxa_mensal_percent = EXCLUDED.taxa_mensal_percent,\n`;
      sql += `  taxa_mensal_decimal = EXCLUDED.taxa_mensal_decimal,\n`;
      sql += `  taxa_anual_decimal = EXCLUDED.taxa_anual_decimal,\n`;
      sql += `  data_atualizacao = NOW();\n`;

      // Salvar arquivo
      const filename = `database/taxas_bacen_completo_${new Date().toISOString().slice(0, 10)}.sql`;
      fs.writeFileSync(filename, sql);

      console.log(`✅ Arquivo SQL gerado: ${filename}`);
      console.log(`\n📋 Próximos passos:`);
      console.log(`1. Abra o arquivo: ${filename}`);
      console.log(`2. Copie todo o conteúdo`);
      console.log(`3. Execute no SQL Editor do Supabase`);
      console.log(`4. Verifique: SELECT COUNT(*) FROM taxas_bacen_historico;`);

    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error);
      console.log('Resposta raw:', data);
    }
  });

}).on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
});
