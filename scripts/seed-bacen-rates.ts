/**
 * Seed Bacen Rates - Popular cache de taxas do Banco Central
 * 
 * Este script busca as taxas históricas da API do Bacen e popula
 * a tabela taxas_bacen_historico no Supabase.
 * 
 * Uso: npx vite-node scripts/seed-bacen-rates.ts
 */

// Configuração do Supabase
const SUPABASE_URL = 'https://uyeubtqxwrhpuafcpgtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5ZXVidHF4d3JocHVhZmNwZ3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjYwOTIsImV4cCI6MjA3ODkwMjA5Mn0.Qz1xjbBqDOpkOslxbxH7gOApFQb7heR455M9Dk15bK8';

const BACEN_API_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

// Séries a sincronizar
const SERIES = [
    { id: '432', name: 'Aquisição de imóveis - Não referenciadas' },
    { id: '25471', name: 'Empréstimo consignado - INSS' },
    { id: '20714', name: 'Empréstimo pessoal não consignado' },
    { id: '226', name: 'Taxa Referencial (TR)' },
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

    // Definir período: últimos 36 meses
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 36);

    console.log(`📅 Período: ${formatDateBacen(startDate)} até ${formatDateBacen(endDate)}\n`);

    let totalInserted = 0;

    for (const serie of SERIES) {
        console.log(`\n📊 Processando: ${serie.name} (${serie.id})`);

        const data = await fetchSeries(serie.id, startDate, endDate);

        if (data.length === 0) continue;

        // Transformar para formato do banco
        const records = data.map(item => {
            const [day, month, year] = item.data.split('/');
            const anoMes = `${year}-${month}`;
            const taxaMensalPercent = parseFloat(item.valor);
            const taxaMensalDecimal = taxaMensalPercent / 100;
            const taxaAnualDecimal = Math.pow(1 + taxaMensalDecimal, 12) - 1;

            return {
                ano_mes: anoMes,
                ano: parseInt(year),
                mes: parseInt(month),
                taxa_mensal_percent: taxaMensalPercent,
                taxa_mensal_decimal: taxaMensalDecimal,
                taxa_anual_decimal: taxaAnualDecimal,
                serie_bacen: serie.id,
                modalidade: serie.name,
                fonte: 'BACEN - API SGS/OLINDA',
                data_atualizacao: new Date().toISOString(),
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
    }

    console.log(`\n✅ Seed concluído! Total de registros: ${totalInserted}`);
    console.log('\n📊 Resumo das séries:');
    for (const serie of SERIES) {
        console.log(`   - ${serie.id}: ${serie.name}`);
    }
}

// Executar
seedBacenRates().catch(console.error);
