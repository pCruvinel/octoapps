# Scripts de Manutenção - OctoApps

## 📊 seed-bacen-rates.ts

Script para popular o cache local de taxas históricas do BACEN.

### Funcionalidade

- Busca 10 anos de dados históricos da API do BACEN
- Popula a tabela `taxas_bacen_historico` no Supabase
- Inclui taxas de financiamento E indexadores (TR, IPCA, INPC, IGPM)

### Séries Sincronizadas

**Taxas de Financiamento:**
- 432: Aquisição de imóveis - Não referenciadas
- 25471: Empréstimo consignado - INSS
- 20714: Empréstimo pessoal não consignado
- 20773: Financiamento imobiliário SFH
- 25497: Financiamento imobiliário SFI

**Indexadores (Correção Monetária):**
- 226: Taxa Referencial (TR)
- 433: IPCA - Índice de Preços ao Consumidor Amplo
- 188: INPC - Índice Nacional de Preços ao Consumidor
- 189: IGP-M - Índice Geral de Preços do Mercado

### Como Executar

**Opção 1: Usando Node diretamente**
```bash
node scripts/seed-bacen-rates.ts
```

**Opção 2: Usando Deno (se disponível)**
```bash
deno run --allow-net --allow-env scripts/seed-bacen-rates.ts
```

**Opção 3: Converter para JavaScript primeiro**
```bash
npx tsc scripts/seed-bacen-rates.ts --target ES2020
node scripts/seed-bacen-rates.js
```

### Configuração

O script usa as credenciais hardcoded do Supabase por padrão. Se necessário alterar:

1. Edite `SUPABASE_URL` e `SUPABASE_ANON_KEY` no topo do arquivo
2. Ou configure variáveis de ambiente antes de executar

### Período de Dados

- **Padrão**: 120 meses (10 anos)
- **Motivo**: Contratos imobiliários podem ter 30 anos de duração
- **Customização**: Edite `startDate.setMonth(startDate.getMonth() - 120)` no código

### Performance

- **Tempo estimado**: 2-3 minutos (9 séries × ~120 meses = ~1.080 registros)
- **Rate limiting**: 500ms de delay entre séries para não sobrecarregar API BACEN
- **Upsert**: Usa `resolution=merge-duplicates` para evitar duplicatas

### Output Esperado

```
🚀 Iniciando seed de taxas Bacen...
🔧 Conectando ao Supabase: https://uyeubtqxwrhpuafcpgtg.supabase.co

📅 Período: 22/12/2014 até 22/12/2024
📦 Total de séries: 9

📊 Processando: Aquisição de imóveis - Não referenciadas
   Série: 432 | Categoria: TAXA_FINANCIAMENTO
   ✓ 120 registros encontrados
   📝 120 registros mensais únicos
   ✅ Inseridos/atualizados: 120

[... mais séries ...]

============================================================
✅ SEED CONCLUÍDO!

📊 Estatísticas:
   Total de registros inseridos/atualizados: 1080
   Séries processadas com sucesso: 9/9

📋 Séries sincronizadas:

   TAXAS DE FINANCIAMENTO:
   ✓ 432    - Aquisição de imóveis - Não referenciadas
   ✓ 25471  - Empréstimo consignado - INSS
   ✓ 20714  - Empréstimo pessoal não consignado
   ✓ 20773  - Financiamento imobiliário SFH
   ✓ 25497  - Financiamento imobiliário SFI

   INDEXADORES (Correção Monetária):
   ✓ 226    - Taxa Referencial (TR)
   ✓ 433    - IPCA - Índice de Preços ao Consumidor Amplo
   ✓ 188    - INPC - Índice Nacional de Preços ao Consumidor
   ✓ 189    - IGP-M - Índice Geral de Preços do Mercado

============================================================
```

### Frequência Recomendada

- **Primeira execução**: Imediatamente após deploy
- **Atualizações**: Mensal (BACEN atualiza dados mensalmente)
- **Automação futura**: Configurar pg_cron para sync automático

### Troubleshooting

**Erro de CORS:**
- Normal em ambiente local (navegador bloqueia)
- Execute em servidor ou use proxy

**Erro 429 (Too Many Requests):**
- API BACEN tem rate limit
- Aumente o delay entre séries (linha 168)

**Registros não aparecem:**
- Verifique `ano_mes` + `serie_bacen` (chave composta única)
- Use `resolution=merge-duplicates` para upsert

**Timeout:**
- API BACEN pode estar lenta
- Execute em horários de menor carga (madrugada)

### Estrutura da Tabela

```sql
CREATE TABLE taxas_bacen_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ano_mes TEXT NOT NULL,           -- Format: "YYYY-MM"
  serie_bacen TEXT NOT NULL,       -- BACEN series code (e.g., "226", "433")
  taxa_mensal_percent NUMERIC,     -- Monthly rate in percentage (e.g., 0.45 = 0.45%)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ano_mes, serie_bacen)
);
```

### Integração com o Sistema

O cache é consultado por:
- `src/services/taxasMercadoBacen.ts` - Funções `buscarSerieHistorica()` e `obterIndicePorData()`
- Estratégias de cálculo - Para correção monetária (TR, IPCA, INPC, IGPM)
- Edge functions - Para consultas otimizadas

**Fallback**: Se cache vazio, sistema busca diretamente da API BACEN (online).
