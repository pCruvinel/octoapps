# 🔍 Debug - Erro "data_contratual specified more than once"

## ❌ Erro Encontrado

```
Error calling criar_financiamento_e_analise:
{
  code: '42701',
  details: null,
  hint: null,
  message: 'column "data_contratual" specified more than once'
}
```

## 📋 Análise

O código de erro **42701** do PostgreSQL significa: **"duplicate_column"**

Isso indica que a função SQL `criar_financiamento_e_analise` está tentando inserir ou referenciar a coluna `data_contratual` mais de uma vez em um statement SQL.

## 🔍 Possíveis Causas

### 1. INSERT com coluna duplicada
```sql
-- ERRADO ❌
INSERT INTO financiamentos_calculo (
  data_contratual,
  valor_financiado,
  data_contratual  -- DUPLICADO!
) VALUES (...)
```

### 2. Parâmetro da função duplicado
```sql
-- ERRADO ❌
CREATE FUNCTION criar_financiamento_e_analise(
  p_data_contratual TEXT,
  p_valor_financiado NUMERIC,
  p_data_contratual TEXT  -- DUPLICADO!
) ...
```

### 3. Alias duplicado em SELECT
```sql
-- ERRADO ❌
SELECT
  data_contratual,
  data_contrato AS data_contratual  -- DUPLICADO!
FROM ...
```

## 🛠️ Como Resolver no Supabase

### Opção 1: Verificar a Função no SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Vá em: **SQL Editor**
3. Execute:
```sql
-- Ver código da função
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'criar_financiamento_e_analise';
```

4. Procure por:
   - `data_contratual` aparece 2+ vezes na lista de colunas do INSERT?
   - Há algum alias que cria conflito?
   - Parâmetros duplicados?

### Opção 2: Verificar Tabela financiamentos_calculo

```sql
-- Ver estrutura da tabela
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'financiamentos_calculo'
  AND column_name LIKE '%contrat%'
ORDER BY ordinal_position;
```

Pode haver duas colunas similares:
- `data_contratual`
- `data_contrato`

### Opção 3: Testar RPC Manualmente

Execute no SQL Editor:
```sql
SELECT criar_financiamento_e_analise(
  p_valor_financiado := 300000,
  p_taxa_juros_mensal_contrato := 0.0072,
  p_taxa_juros_anual_contrato := 0.09,
  p_taxa_media_mensal := 0.0059,  -- CORRIGIDO: 0.59% = 0.0059
  p_taxa_media_anual := 0.0731,
  p_qtd_parcelas_contrato := 360,
  p_qtd_parcelas_analise := 360,
  p_seguros_mensais := 107.58,
  p_sistema_amortizacao := 'SAC',
  p_indexador_cm := 'TR',
  p_data_contratual := '2012-07-06',
  p_primeiro_vencimento := '2012-08-06',
  p_credor := 'SANTANDER',
  p_devedor := 'EDVANIA CRISTINA DA SILVA',
  p_tipo_contrato := 'Financiamento Imobiliário SFH',
  p_data_calculo := '2025-12-03',
  p_valor_bem := 350000,
  p_valor_entrada := 50000,
  p_valor_parcela_contrato := 2326.53,
  p_multa_moratoria_percent := 0.02,
  p_juros_mora_percent := 0.01,
  p_outros_encargos := 0,
  p_tarifa_avaliacao_bem := 800
);
```

Se retornar o mesmo erro, o problema está na função SQL.

## 🔧 Solução Temporária (Frontend)

Se não puder editar a função SQL imediatamente, tente:

### 1. Remover parâmetro conflitante

Remova temporariamente `p_data_contratual` ou `p_primeiro_vencimento` e veja qual resolve.

### 2. Usar data_contrato ao invés de data_contratual

```typescript
const params = {
  // ...
  p_data_contrato: dataContrato,  // Tente este nome
  // OU
  p_data_contratual: dataContrato,
  // ...
};
```

## 📝 Checklist de Debug

- [ ] Executar query para ver código da função
- [ ] Identificar onde `data_contratual` aparece duplicado
- [ ] Verificar se há colunas `data_contratual` E `data_contrato` na tabela
- [ ] Testar RPC manualmente com SQL direto
- [ ] Copiar código da função e procurar por duplicatas
- [ ] Corrigir definição da função no Supabase
- [ ] Re-testar no frontend

## 🎯 Ação Imediata Recomendada

1. **Acesse o Supabase Dashboard**
2. **SQL Editor → New Query**
3. **Execute:**
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'criar_financiamento_e_analise';
```
4. **Cole o resultado aqui** para análise

---

**Problema identificado em**: 03/12/2025 22:43
**Status**: 🔴 Bloqueando análise prévia
**Prioridade**: 🔥 ALTA
