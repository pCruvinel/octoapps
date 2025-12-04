/**
 * Script para buscar todas as taxas históricas do BACEN via API SGS
 *
 * API: https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados
 * Série 432: Taxa de juros - Pessoa física - Financiamento imobiliário - Aquisição de imóveis
 *
 * Como usar:
 * 1. Executar: node scripts/buscar-taxas-bacen-sgs.js
 * 2. O script vai gerar um arquivo SQL com os INSERTs
 */

const https = require('https');
const fs = require('fs');

console.log('🔍 Buscando taxas do BACEN via API SGS (Série 432)...');
console.log('📅 Período: Todos os dados disponíveis\n');

// URL da API SGS - Série 432
// Sem datas = retorna TODOS os dados históricos
const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json';

console.log('🌐 URL:', url);
console.log('⏳ Aguarde (pode demorar alguns segundos)...\n');

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);

      if (!json || json.length === 0) {
        console.error('❌ Nenhum dado retornado pela API');
        return;
      }

      console.log(`✅ ${json.length} registros encontrados!\n`);

      // Processar dados
      const registros = json
        .map(item => {
          // Data vem como "DD/MM/YYYY"
          const [dia, mes, ano] = item.data.split('/');
          const anoMes = `${ano}${mes.padStart(2, '0')}`;
          const taxaMensalPercent = parseFloat(item.valor);

          // Ignorar valores inválidos
          if (isNaN(taxaMensalPercent) || taxaMensalPercent <= 0) {
            return null;
          }

          const taxaMensalDecimal = taxaMensalPercent / 100;
          const taxaAnualDecimal = Math.pow(1 + taxaMensalDecimal, 12) - 1;

          return {
            anoMes,
            ano: parseInt(ano),
            mes: parseInt(mes),
            taxaMensalPercent: taxaMensalPercent.toFixed(6),
            taxaMensalDecimal: taxaMensalDecimal.toFixed(8),
            taxaAnualDecimal: taxaAnualDecimal.toFixed(8),
            dataOriginal: item.data
          };
        })
        .filter(r => r !== null); // Remover nulos

      // Agrupar por mês (pegar última taxa do mês)
      const porMes = {};
      registros.forEach(r => {
        porMes[r.anoMes] = r;
      });

      const registrosUnicos = Object.values(porMes).sort((a, b) =>
        a.anoMes.localeCompare(b.anoMes)
      );

      console.log(`📊 ${registrosUnicos.length} meses únicos encontrados\n`);

      // Mostrar primeiros e últimos registros
      console.log('📅 Período coberto:');
      console.log(`  Início: ${registrosUnicos[0].anoMes} (${registrosUnicos[0].dataOriginal}) - ${registrosUnicos[0].taxaMensalPercent}% a.m.`);
      console.log(`  Fim: ${registrosUnicos[registrosUnicos.length-1].anoMes} (${registrosUnicos[registrosUnicos.length-1].dataOriginal}) - ${registrosUnicos[registrosUnicos.length-1].taxaMensalPercent}% a.m.\n`);

      // Verificar se tem julho/2012
      const julho2012 = registrosUnicos.find(r => r.anoMes === '201207');
      if (julho2012) {
        console.log('✅ Julho/2012 encontrado:', julho2012.taxaMensalPercent + '% a.m.\n');
      }

      // Gerar SQL
      let sql = `-- =====================================================\n`;
      sql += `-- TAXAS BACEN - Dados Reais da API SGS\n`;
      sql += `-- Série 432: Financiamento Imobiliário - Aquisição de Imóveis\n`;
      sql += `-- Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
      sql += `-- Total de registros: ${registrosUnicos.length}\n`;
      sql += `-- Período: ${registrosUnicos[0].anoMes} até ${registrosUnicos[registrosUnicos.length-1].anoMes}\n`;
      sql += `-- =====================================================\n\n`;

      sql += `INSERT INTO taxas_bacen_historico (ano_mes, ano, mes, taxa_mensal_percent, taxa_mensal_decimal, taxa_anual_decimal) VALUES\n`;

      registrosUnicos.forEach((r, index) => {
        sql += `('${r.anoMes}', ${r.ano}, ${r.mes}, ${r.taxaMensalPercent}, ${r.taxaMensalDecimal}, ${r.taxaAnualDecimal})`;
        sql += index < registrosUnicos.length - 1 ? ',\n' : '\n';
      });

      sql += `ON CONFLICT (ano_mes) DO UPDATE SET\n`;
      sql += `  taxa_mensal_percent = EXCLUDED.taxa_mensal_percent,\n`;
      sql += `  taxa_mensal_decimal = EXCLUDED.taxa_mensal_decimal,\n`;
      sql += `  taxa_anual_decimal = EXCLUDED.taxa_anual_decimal,\n`;
      sql += `  data_atualizacao = NOW();\n\n`;

      sql += `-- Verificar inserção\n`;
      sql += `SELECT COUNT(*) as total FROM taxas_bacen_historico;\n`;
      sql += `SELECT * FROM taxas_bacen_historico WHERE ano_mes = '201207'; -- Julho/2012\n`;

      // Salvar arquivo
      const filename = `database/taxas_bacen_completo_sgs_${new Date().toISOString().slice(0, 10)}.sql`;
      fs.writeFileSync(filename, sql);

      console.log(`✅ Arquivo SQL gerado: ${filename}`);
      console.log(`\n📋 Próximos passos:`);
      console.log(`1. Abra o arquivo: ${filename}`);
      console.log(`2. Copie todo o conteúdo`);
      console.log(`3. Execute no SQL Editor do Supabase`);
      console.log(`4. Verifique: SELECT COUNT(*) FROM taxas_bacen_historico;`);
      console.log(`\n💡 Dica: O script usa ON CONFLICT, então você pode executar múltiplas vezes sem duplicar dados`);

    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error);
      console.log('Resposta raw (primeiros 500 chars):', data.substring(0, 500));
    }
  });

}).on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
});
