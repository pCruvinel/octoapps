# 📊 Como Buscar Todas as Taxas do BACEN

Este guia mostra **3 formas** de buscar todas as taxas históricas do BACEN (Série 432 - Financiamento Imobiliário).

---

## 🎯 Opção 1: Script Python (Mais Fácil) ⭐ RECOMENDADO

### Requisitos
- Python 3 instalado
- Biblioteca `requests`

### Passo a Passo

1. **Instalar biblioteca (se não tiver)**:
```bash
pip install requests
```

2. **Executar script**:
```bash
cd "C:\Users\kassi\OneDrive\Área de Trabalho\DIZEVOLV KASSIO PROJETOS\OctoApp"
python scripts/buscar-taxas-bacen.py
```

3. **Resultado**:
```
🔍 Buscando taxas via API SGS...
✅ 150+ registros encontrados!
✅ Arquivo SQL gerado: database/taxas_bacen_completo_2025-12-03.sql
```

4. **Executar no Supabase**:
- Abra o arquivo SQL gerado
- Copie todo o conteúdo
- Cole no SQL Editor do Supabase
- Clique em **Run**

---

## 🎯 Opção 2: Script Node.js

### Requisitos
- Node.js instalado

### Passo a Passo

1. **Escolha qual API usar**:

**API SGS (recomendada - mais simples)**:
```bash
node scripts/buscar-taxas-bacen-sgs.js
```

**API OLINDA (mais moderna)**:
```bash
node scripts/buscar-taxas-bacen-olinda.js
```

2. **Resultado**:
```
🔍 Buscando taxas do BACEN via API SGS...
✅ 150+ registros encontrados!
✅ Arquivo SQL gerado: database/taxas_bacen_completo_sgs_2025-12-03.sql
```

3. **Executar no Supabase** (mesma forma)

---

## 🎯 Opção 3: Buscar Manualmente (Navegador)

Se preferir fazer manualmente sem scripts:

### API SGS - Mais Fácil

1. **Abra no navegador**:
```
https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json
```

2. **Copie o JSON** (vai ser muito grande)

3. **Use uma ferramenta online** para converter:
   - https://www.convertjson.com/json-to-sql.htm
   - Cole o JSON
   - Configure:
     - Table name: `taxas_bacen_historico`
     - Mapeie campos:
       - `data` → extrair ano e mês
       - `valor` → `taxa_mensal_percent`

4. **OU use o console do navegador**:

Abra o console (F12) e cole este código:

```javascript
fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json')
  .then(res => res.json())
  .then(dados => {
    const registros = {};

    dados.forEach(item => {
      const [dia, mes, ano] = item.data.split('/');
      const anoMes = `${ano}${mes}`;
      const taxaPercent = parseFloat(item.valor);

      if (taxaPercent > 0) {
        const taxaDecimal = taxaPercent / 100;
        const taxaAnual = Math.pow(1 + taxaDecimal, 12) - 1;

        registros[anoMes] = {
          anoMes,
          ano: parseInt(ano),
          mes: parseInt(mes),
          taxaPercent: taxaPercent.toFixed(6),
          taxaDecimal: taxaDecimal.toFixed(8),
          taxaAnual: taxaAnual.toFixed(8)
        };
      }
    });

    const lista = Object.values(registros).sort((a, b) =>
      a.anoMes.localeCompare(b.anoMes)
    );

    let sql = "INSERT INTO taxas_bacen_historico (ano_mes, ano, mes, taxa_mensal_percent, taxa_mensal_decimal, taxa_anual_decimal) VALUES\n";

    lista.forEach((r, i) => {
      sql += `('${r.anoMes}', ${r.ano}, ${r.mes}, ${r.taxaPercent}, ${r.taxaDecimal}, ${r.taxaAnual})`;
      sql += i < lista.length - 1 ? ',\n' : '\n';
    });

    sql += "ON CONFLICT (ano_mes) DO UPDATE SET taxa_mensal_percent = EXCLUDED.taxa_mensal_percent, taxa_mensal_decimal = EXCLUDED.taxa_mensal_decimal, taxa_anual_decimal = EXCLUDED.taxa_anual_decimal, data_atualizacao = NOW();";

    console.log(sql);
    console.log(`\n✅ ${lista.length} registros gerados`);
    console.log('📋 Copie o SQL acima e execute no Supabase');
  });
```

5. **Copie o SQL gerado** e execute no Supabase

---

## 📊 APIs Disponíveis do BACEN

### 1. API SGS (Sistema Gerenciador de Séries Temporais)
- **URL**: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json`
- **Série**: 432 (Financiamento Imobiliário - Aquisição de Imóveis)
- **Formato**: JSON
- **Dados**: Diários (agrupar por mês)
- **Vantagem**: Simples, retorna todos os dados históricos
- **Desvantagem**: API antiga, pode ser descontinuada

### 2. API OLINDA (Mais Moderna)
- **URL Base**: `https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/swagger-ui3`
- **Endpoint**: `/TaxasJurosMensalPorMes`
- **Filtro**: `Modalidade eq 'Aquisição de imóveis - Operações não referenciadas'`
- **Formato**: JSON (OData)
- **Dados**: Mensais (já agrupados)
- **Vantagem**: API oficial mais recente
- **Desvantagem**: Sintaxe mais complexa

---

## 🔍 Exemplo de Resposta das APIs

### API SGS
```json
[
  {
    "data": "06/07/2012",
    "valor": "0.59"
  },
  {
    "data": "07/07/2012",
    "valor": "0.59"
  }
]
```

### API OLINDA
```json
{
  "value": [
    {
      "AnoMes": "201207",
      "Modalidade": "Aquisição de imóveis - Operações não referenciadas",
      "TaxaJurosAoMes": "0.59",
      "TaxaJurosAoAno": "7.35"
    }
  ]
}
```

---

## ✅ Verificar Dados Inseridos

Após executar o INSERT no Supabase, verifique:

```sql
-- 1. Contar total de registros
SELECT COUNT(*) as total FROM taxas_bacen_historico;

-- 2. Ver primeiros registros
SELECT * FROM taxas_bacen_historico ORDER BY ano_mes LIMIT 10;

-- 3. Ver últimos registros
SELECT * FROM taxas_bacen_historico ORDER BY ano_mes DESC LIMIT 10;

-- 4. Verificar julho/2012 (taxa do contrato exemplo)
SELECT * FROM taxas_bacen_historico WHERE ano_mes = '201207';

-- 5. Ver estatísticas por ano
SELECT
  ano,
  COUNT(*) as meses,
  MIN(taxa_mensal_percent) as min_taxa,
  MAX(taxa_mensal_percent) as max_taxa,
  AVG(taxa_mensal_percent) as media_taxa
FROM taxas_bacen_historico
GROUP BY ano
ORDER BY ano DESC;
```

---

## 📅 Atualização Mensal

Para manter os dados atualizados, você pode:

### Opção 1: Script Automatizado (Recomendado)

Criar um cron job ou GitHub Action que roda mensalmente:

```yaml
# .github/workflows/atualizar-taxas.yml
name: Atualizar Taxas BACEN

on:
  schedule:
    - cron: '0 0 1 * *'  # Todo dia 1º do mês
  workflow_dispatch:  # Permitir execução manual

jobs:
  atualizar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.x'
      - run: pip install requests
      - run: python scripts/buscar-taxas-bacen.py
      # Aqui você executaria o SQL gerado no Supabase
```

### Opção 2: Manual

Todo mês:
1. Execute novamente o script Python ou Node.js
2. Copie o SQL gerado
3. Execute no Supabase

Como usamos `ON CONFLICT DO UPDATE`, não vai duplicar dados!

---

## 🆘 Troubleshooting

### Erro: "requests module not found"
```bash
pip install requests
```

### Erro: "node: command not found"
Instale Node.js: https://nodejs.org/

### API retorna vazio
- Verifique sua conexão com internet
- Tente a API alternativa (SGS ou OLINDA)
- Aguarde alguns minutos e tente novamente

### SQL muito grande
Se o SQL gerado for muito grande para colar no Supabase:
1. Divida em partes (ex: por ano)
2. OU use a CLI do Supabase:
```bash
supabase db push --file database/taxas_bacen_completo.sql
```

---

## 📚 Referências

- **BACEN API SGS**: https://api.bcb.gov.br/
- **BACEN API OLINDA**: https://olinda.bcb.gov.br/
- **Documentação Série 432**: https://www3.bcb.gov.br/sgspub/localizarseries/localizarSeries.do?method=prepararTelaLocalizarSeries
- **Supabase Docs**: https://supabase.com/docs

---

## 🎯 Resultado Final Esperado

Após executar qualquer uma das opções:

```sql
SELECT COUNT(*) FROM taxas_bacen_historico;
-- Resultado esperado: 150+ registros (2011 até hoje)

SELECT * FROM buscar_taxa_bacen('2012-07-06');
-- Resultado: 0.59% a.m. (taxa de julho/2012)
```

E no aplicativo:
- Busca automática funcionando ✅
- Campos preenchidos automaticamente ✅
- Taxa sempre correta e atualizada ✅
