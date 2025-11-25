# ✅ Verificar se a Migração foi Executada Corretamente

## 🔍 Problema Detectado

Os testes falharam com o erro:
```
Could not find the table 'public.financiamentos' in the schema cache
```

Isso significa que o Supabase não reconhece a tabela. Vamos verificar e corrigir.

---

## 📋 Passo a Passo de Verificação

### 1️⃣ **Verificar se as Tabelas Existem**

No **Supabase Dashboard**:

1. Acesse seu projeto no Supabase
2. Vá em **Table Editor** (menu lateral)
3. Verifique se existem estas 3 tabelas:
   - ✅ `financiamentos`
   - ✅ `financiamentos_amortizacao`
   - ✅ `financiamentos_historico`

**Se as tabelas NÃO aparecem**:
- A migration não foi executada ou deu erro
- Vá para a seção "Executar Migration" abaixo

**Se as tabelas aparecem**:
- A migration foi executada
- O problema é o cache do PostgREST
- Vá para a seção "Atualizar Cache" abaixo

---

### 2️⃣ **Executar/Re-executar a Migration**

#### No Supabase SQL Editor:

1. Vá em **SQL Editor** → **New Query**

2. Cole o conteúdo completo de:
   ```
   migrations/001_create_financiamentos_simplified.sql
   ```

3. **IMPORTANTE**: Role até o final e verifique se o SQL está completo
   - Deve ter ~300 linhas
   - Deve terminar com comentários de verificação

4. Clique em **RUN** (ou Ctrl+Enter)

5. **Aguarde** a execução (pode levar 5-10 segundos)

6. **Verifique o resultado**:
   - ✅ Success: "Success. No rows returned"
   - ❌ Error: Anote a mensagem de erro

#### Erros Comuns:

**Erro: "relation already exists"**
```
ERROR: relation "financiamentos" already exists
```
✅ **Isso é BOM!** Significa que as tabelas já existem.
- Pule para "Atualizar Cache"

**Erro: "permission denied"**
```
ERROR: permission denied for schema public
```
❌ Você não tem permissão de admin no Supabase.
- Verifique se está logado com a conta correta
- Peça acesso de admin ao dono do projeto

---

### 3️⃣ **Atualizar Cache do PostgREST (CRÍTICO)**

O Supabase usa PostgREST que tem um cache do schema. Após criar tabelas, você DEVE recarregar o schema.

#### Método 1: Via Dashboard (Recomendado)

1. No **Supabase Dashboard**, vá em **Settings** (⚙️ no menu lateral)
2. Vá em **API**
3. Role até a seção **"Connection string"** ou **"Schema cache"**
4. Procure o botão **"Reload schema cache"** ou **"Restart PostgREST"**
5. Clique e aguarde (~30 segundos)

#### Método 2: Via SQL (Alternativo)

Execute no **SQL Editor**:
```sql
NOTIFY pgrst, 'reload schema';
```

#### Método 3: Aguardar (Automático)

Se não encontrar o botão, o cache é recarregado automaticamente a cada:
- **3 minutos** (padrão)
- Ao reiniciar o projeto
- Ao fazer deploy

Aguarde 3-5 minutos e tente novamente.

---

### 4️⃣ **Verificar Permissões (RLS)**

Execute no **SQL Editor**:

```sql
-- 1. Verificar se RLS está ativo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'financiamentos%';

-- Resultado esperado:
-- financiamentos                | t (true)
-- financiamentos_amortizacao    | t (true)
-- financiamentos_historico      | t (true)
```

```sql
-- 2. Verificar policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'financiamentos%';

-- Deve retornar ~7 policies:
-- Users can view their own financiamentos
-- Users can insert their own financiamentos
-- Users can update their own financiamentos
-- Users can view related amortizacao
-- Users can insert related amortizacao
-- Users can view related historico
-- Users can insert related historico
```

---

### 5️⃣ **Testar Manualmente no SQL Editor**

Execute para testar se consegue inserir dados:

```sql
-- Teste 1: Inserir um registro
INSERT INTO financiamentos (
  credor,
  devedor,
  valor_financiado,
  quantidade_parcelas,
  data_primeira_parcela,
  sistema_amortizacao,
  indice_correcao,
  taxa_mensal_contrato,
  taxa_mensal_mercado,
  status
) VALUES (
  'Banco Teste',
  'Cliente Teste',
  100000.00,
  360,
  '2024-01-01',
  'SAC',
  'TR',
  0.005,
  0.004,
  'Rascunho'
) RETURNING id, credor, devedor, status;

-- Deve retornar 1 linha com o ID gerado
```

```sql
-- Teste 2: Buscar o registro
SELECT id, credor, devedor, status, excluido
FROM financiamentos
WHERE devedor = 'Cliente Teste';

-- Deve retornar 1 linha
```

```sql
-- Teste 3: Deletar o teste
DELETE FROM financiamentos
WHERE devedor = 'Cliente Teste';

-- Success. 1 row(s) affected
```

**Se todos os testes passaram**: ✅ O banco está funcionando!

---

### 6️⃣ **Atualizar Types do TypeScript (Opcional mas Recomendado)**

Se você tem a CLI do Supabase instalada:

```bash
# Gerar types atualizados
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/lib/database.types.ts
```

Ou manualmente, verifique se o arquivo `src/lib/database.types.ts` tem as definições das 3 tabelas.

---

## 🧪 Testar Novamente

Após seguir os passos acima:

### Teste 1: Via Interface (Recomendado)

1. Abra o frontend: `npm run dev`
2. Navegue para **Cálculo Revisional**
3. Clique em **Revisão de Financiamento Imobiliário**
4. Preencha o formulário com dados de teste
5. Clique em **Salvar Dados**

**Resultado esperado**:
- ✅ Toast: "Caso salvo com sucesso!"
- ✅ Sem erros no console (F12)

### Teste 2: Via Testes Unitários

```bash
npm test -- src/services/__tests__/financiamentos.service.test.ts
```

**Resultado esperado**:
- ✅ A maioria dos testes passa
- ✅ Apenas 1-2 podem falhar (relacionados a dados específicos)

---

## 🚨 Troubleshooting

### Erro Persiste: "Could not find the table"

1. **Feche e reabra o Supabase Dashboard**
   - Às vezes o cache fica preso no navegador

2. **Verifique se você está no projeto correto**
   - No canto superior, confirme o nome do projeto

3. **Tente criar uma tabela de teste manualmente**
   ```sql
   CREATE TABLE teste_conexao (id SERIAL PRIMARY KEY, nome TEXT);
   SELECT * FROM teste_conexao;
   DROP TABLE teste_conexao;
   ```
   - Se isso falhar, há um problema de conexão/permissão

4. **Reinicie o projeto Supabase** (última opção)
   - Settings → General → Pause project
   - Aguarde 1 minuto
   - Resume project
   - Aguarde 2-3 minutos

### Erro: "null value in column violates not-null constraint"

- Você está tentando inserir sem campos obrigatórios
- Verifique quais campos são `NOT NULL` na migration
- Campos obrigatórios mínimos:
  - credor
  - devedor
  - valor_financiado
  - quantidade_parcelas
  - data_primeira_parcela
  - sistema_amortizacao
  - indice_correcao
  - taxa_mensal_contrato
  - taxa_mensal_mercado

### Erro: "new row violates row-level security policy"

- RLS está bloqueando sua operação
- Verifique se você está autenticado
- Execute no SQL Editor (que bypassa RLS):
  ```sql
  SELECT auth.uid(); -- Deve retornar seu UUID
  ```
- Se retornar NULL, você não está autenticado como usuário

---

## ✅ Checklist de Verificação

Marque conforme for verificando:

- [ ] Executei a migration SQL sem erros
- [ ] As 3 tabelas aparecem no Table Editor
- [ ] Recarreguei o schema cache do PostgREST
- [ ] Aguardei 3-5 minutos após recarregar
- [ ] RLS está ativo nas 3 tabelas
- [ ] 7 policies foram criadas
- [ ] Consigo inserir dados manualmente no SQL Editor
- [ ] Consigo buscar dados manualmente
- [ ] Frontend carrega sem erros
- [ ] Consegui salvar um caso de teste pelo formulário

---

## 🎯 Resultado Esperado

Quando tudo estiver correto:

✅ **No Supabase Table Editor**:
- 3 tabelas visíveis
- Estrutura completa com ~30 colunas cada

✅ **No Frontend**:
- Formulário salva sem erros
- Lista de casos carrega
- Busca funciona

✅ **Nos Testes**:
- Pelo menos 20/24 testes passam
- Apenas alguns edge cases podem falhar

---

## 📞 Se Nada Funcionar

Verifique estas informações e reporte:

1. **Versão do Supabase**:
   - Dashboard → Settings → General
   - Anote a versão do Postgres

2. **Logs de Erro**:
   - Dashboard → Logs
   - Procure por erros relacionados a "financiamentos"

3. **Ambiente**:
   ```bash
   node --version  # >= 18
   npm --version   # >= 9
   ```

4. **Variáveis de Ambiente**:
   - Verifique se `.env.local` tem:
     - VITE_SUPABASE_URL
     - VITE_SUPABASE_ANON_KEY

---

## 🚀 Próximos Passos

Depois que tudo estiver funcionando:

1. ✅ Execute os testes unitários novamente
2. ✅ Siga o **GUIA-TESTES-FINANCIAMENTO.md** para testes manuais
3. ✅ Teste com dados reais do TESTE-REAL.md
4. ✅ Valide os cálculos

---

Boa sorte! 🍀
