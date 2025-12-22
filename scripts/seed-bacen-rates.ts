/**
 * Seed Bacen Rates - Popular cache de taxas do Banco Central
 *
 * Este script busca as taxas históricas da API do Bacen e popula
 * a tabela taxas_bacen_historico no Supabase.
 *
 * Uso: node --loader tsx scripts/seed-bacen-rates.ts
 * Ou:  npm run seed:bacen (se configurado no package.json)
 *
 * Período: Últimos 120 meses (10 anos) - adequado para contratos imobiliários
 * Séries: Taxas de financiamento + Indexadores (TR, IPCA, INPC, IGPM)
 *
 * IMPORTANTE: Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 * nas variáveis de ambiente ou edite diretamente abaixo.
 */

// Configuração do Supabase (pode ser sobrescrita por variáveis de ambiente)
const SUPABASE_URL = 'https://uyeubtqxwrhpuafcpgtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXVidHF4d3JocHVhZmNwZ3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjYwOTIsImV4cCI6MjA3ODkwMjA5Mn0.Qz1xjbBqDOpkOslxbxH7gOApFQb7heR455M9Dk15bK8';

const BACEN_API_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

// Séries a sincronizar
const SERIES = [
    // === TAXAS DE FINANCIAMENTO ===
    { id: '432', name: 'Aquisição de imóveis - Não referenciadas', category: 'TAXA_FINANCIAMENTO' },
    { id: '25471', name: 'Empréstimo consignado - INSS', category: 'TAXA_FINANCIAMENTO' },
    { id: '20714', name: 'Empréstimo pessoal não consignado', category: 'TAXA_FINANCIAMENTO' },
    { id: '20773', name: 'Financiamento imobiliário SFH', category: 'TAXA_FINANCIAMENTO' },
    { id: '25497', name: 'Financiamento imobiliário SFI', category: 'TAXA_FINANCIAMENTO' },

    // === INDEXADORES (Correção Monetária) ===
    { id: '226', name: 'Taxa Referencial (TR)', category: 'INDEXADOR' },
    { id: '433', name: 'IPCA - Índice de Preços ao Consumidor Amplo', category: 'INDEXADOR' },
    { id: '188', name: 'INPC - Índice Nacional de Preços ao Consumidor', category: 'INDEXADOR' },
    { id: '189', name: 'IGP-M - Índice Geral de Preços do Mercado', category: 'INDEXADOR' },
];

// Helper para formatar data para Bacen API (DD/MM/YYYY)
function formatDateBacen(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Buscar dados de uma série
async function fetchSeries(serieId: string, startDate: Date, endDate: Date): Promise<Array<{ data: string, valor: string }>> {
    const url = `${BACEN_API_URL}.${serieId}/dados?formato=json&dataInicial=${formatDateBacen(startDate)}&dataFinal=${formatDateBacen(endDate)}`;

    console.log(`📡 Buscando série ${serieId}...`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`❌ Erro ao buscar série ${serieId}: ${response.status}`);
            return [];
        }

        const data = await response.json();
        console.log(`   ✓ ${data.length} registros encontrados`);
        return data;
    } catch (error) {
        console.error(`❌ Erro de rede para série ${serieId}:`, error);
        return [];
    }
}

// Inserir dados no Supabase
async function upsertToSupabase(records: any[]): Promise<number> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/taxas_bacen_historico`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(records),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao inserir no Supabase:', error);
        return 0;
    }

    return records.length;
}

// Função principal
async function seedBacenRates() {
    console.log('🚀 Iniciando seed de taxas Bacen...\n');
    console.log(`🔧 Conectando ao Supabase: ${SUPABASE_URL}\n`);

    // Definir período: últimos 120 meses (10 anos)
    // Adequado para contratos imobiliários de longo prazo
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 120);

    console.log(`📅 Período: ${formatDateBacen(startDate)} até ${formatDateBacen(endDate)}`);
    console.log(`📦 Total de séries: ${SERIES.length}\n`);

    let totalInserted = 0;
    let totalErrors = 0;

    for (const serie of SERIES) {
        console.log(`\n📊 Processando: ${serie.name}`);
        console.log(`   Série: ${serie.id} | Categoria: ${serie.category}`);

        const data = await fetchSeries(serie.id, startDate, endDate);

        if (data.length === 0) {
            console.log('   ⚠️  Nenhum dado retornado');
            totalErrors++;
            continue;
        }

        // Transformar para formato do banco (schema simplificado)
        const records = data.map(item => {
            const [day, month, year] = item.data.split('/');
            const anoMes = `${year}-${month}`;
            const valorStr = item.valor.replace(',', '.');
            const taxaMensalPercent = parseFloat(valorStr);

            // Schema atual da tabela taxas_bacen_historico:
            // - ano_mes: string (YYYY-MM)
            // - serie_bacen: string (código da série)
            // - taxa_mensal_percent: number (valor percentual)
            // - created_at: timestamp (auto)
            // - id: uuid (auto)

            return {
                ano_mes: anoMes,
                serie_bacen: serie.id,
                taxa_mensal_percent: taxaMensalPercent,
            };
        });

        // Agrupar por mês (pegar último valor do mês)
        const monthlyRecords = new Map<string, typeof records[0]>();
        for (const record of records) {
            monthlyRecords.set(`${record.ano_mes}-${record.serie_bacen}`, record);
        }

        const uniqueRecords = Array.from(monthlyRecords.values());
        console.log(`   📝 ${uniqueRecords.length} registros mensais únicos`);

        // Inserir em lotes de 50
        for (let i = 0; i < uniqueRecords.length; i += 50) {
            const batch = uniqueRecords.slice(i, i + 50);
            const inserted = await upsertToSupabase(batch);
            totalInserted += inserted;
        }

        console.log(`   ✅ Inseridos/atualizados: ${uniqueRecords.length}`);

        // Aguardar 500ms entre séries para não sobrecarregar API do BACEN
        if (serie !== SERIES[SERIES.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ SEED CONCLUÍDO!\n');
    console.log(`📊 Estatísticas:`);
    console.log(`   Total de registros inseridos/atualizados: ${totalInserted}`);
    console.log(`   Séries processadas com sucesso: ${SERIES.length - totalErrors}/${SERIES.length}`);
    if (totalErrors > 0) {
        console.log(`   ⚠️  Erros encontrados: ${totalErrors}`);
    }
    console.log(`\n📋 Séries sincronizadas:`);
    console.log(`\n   TAXAS DE FINANCIAMENTO:`);
    SERIES.filter(s => s.category === 'TAXA_FINANCIAMENTO').forEach(s => {
        console.log(`   ✓ ${s.id.padEnd(6)} - ${s.name}`);
    });
    console.log(`\n   INDEXADORES (Correção Monetária):`);
    SERIES.filter(s => s.category === 'INDEXADOR').forEach(s => {
        console.log(`   ✓ ${s.id.padEnd(6)} - ${s.name}`);
    });
    console.log(`\n${'='.repeat(60)}\n`);
}

// Executar
seedBacenRates().catch(console.error);
