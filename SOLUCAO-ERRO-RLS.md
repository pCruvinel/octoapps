# 🔧 Solução para Erro 403 Forbidden - Row Level Security

## 🎯 Problema Identificado

**Erro:**
```
Error: new row violates row-level security policy (USING expression) for table "financiamentos_amortizacao"
```

**Causa Raiz:**
As políticas RLS da tabela `financiamentos_amortizacao` estão **incompletas**. Faltam permissões para **UPDATE** e **DELETE**.

**Políticas Atuais:**
- ✅ SELECT (visualizar)
- ✅ INSERT (inserir)
- ❌ **UPDATE (atualizar) - FALTANDO**
- ❌ **DELETE (deletar) - FALTANDO**

**Impacto:**
- DELETE retorna 0 linhas (bloqueado pelo RLS)
- INSERT falha com erro de chave duplicada (porque DELETE não funcionou)
- UPSERT falha com 403 Forbidden (precisa de permissão UPDATE)

---

## 🛠️ Solução (2 Opções)

### Opção 1: Executar SQL Direto no Supabase (RECOMENDADO)

**Passo 1:** Abra o Supabase SQL Editor
```
https://supabase.com/dashboard/project/uyeubtqxwrhpuafcpgtg/sql
```

**Passo 2:** Copie e execute o conteúdo do arquivo `FIX-RLS-POLICIES.sql`

**Passo 3:** Verifique se as políticas foram criadas
Execute esta query:
```sql
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'financiamentos_amortizacao'
ORDER BY cmd, policyname;
```

**Resultado Esperado:**
```
tablename                    | policyname                               | cmd
-----------------------------|------------------------------------------|--------
financiamentos_amortizacao   | Users can delete related amortizacao     | DELETE
financiamentos_amortizacao   | Users can insert related amortizacao     | INSERT
financiamentos_amortizacao   | Users can view related amortizacao       | SELECT
financiamentos_amortizacao   | Users can update related amortizacao     | UPDATE
```

### Opção 2: Via Interface do Supabase

**Passo 1:** Acesse Authentication > Policies

**Passo 2:** Selecione a tabela `financiamentos_amortizacao`

**Passo 3:** Crie política para UPDATE:
- Nome: `Users can update related amortizacao`
- Comando: `UPDATE`
- USING expression:
  ```sql
  EXISTS (
    SELECT 1 FROM financiamentos f
    WHERE f.id = financiamento_id
    AND (f.criado_por = auth.uid() OR f.calculado_por = auth.uid())
  )
  ```
- WITH CHECK expression: (mesmo que USING)

**Passo 4:** Crie política para DELETE:
- Nome: `Users can delete related amortizacao`
- Comando: `DELETE`
- USING expression:
  ```sql
  EXISTS (
    SELECT 1 FROM financiamentos f
    WHERE f.id = financiamento_id
    AND (f.criado_por = auth.uid() OR f.calculado_por = auth.uid())
  )
  ```

---

## ✅ Verificação

Após executar o SQL, teste no console do navegador:

1. Abra o DevTools (F12) → Console
2. Tente gerar o relatório novamente
3. Os logs devem mostrar:

```
✅ Deleted 12 rows  ← DELETE funcionou!
💾 Inserting 12 rows...
✅ Batch 1 inserted successfully  ← INSERT funcionou!
```

**OU** (se ainda houver algum problema menor):

```
✅ Deleted 0 rows
❌ Insert error (duplicate key)
⚠️  Switching to UPSERT...
✅ Batch 1 saved via UPSERT  ← UPSERT funcionou!
```

Ambos os cenários são **aceitáveis**. O importante é não ver mais o erro **403 Forbidden**.

---

## 🔍 Diagnóstico Detalhado

### Log Atual (COM ERRO):
```
🗑️ Deleting old AP01 rows...
✅ Deleted 0 rows  ← RLS bloqueou DELETE
💾 Inserting 12 rows...
❌ Error: duplicate key  ← Falhou porque DELETE não deletou
⚠️ Trying UPSERT...
❌ Error 403 Forbidden  ← RLS bloqueou UPSERT (precisa UPDATE)
```

### Log Esperado (SEM ERRO):
```
🗑️ Deleting old AP01 rows...
✅ Deleted 12 rows  ← DELETE funcionou!
💾 Inserting 12 rows...
✅ Batch 1 inserted successfully  ← INSERT funcionou!
```

**OU** (cenário alternativo aceitável):
```
🗑️ Deleting old AP01 rows...
✅ Deleted 12 rows  ← DELETE funcionou!
💾 Inserting 12 rows...
❌ Error: duplicate key  ← Pode acontecer em race condition
⚠️ Trying UPSERT...
✅ Batch 1 saved via UPSERT  ← UPSERT funcionou! (agora tem permissão)
```

---

## 📊 Fluxo Corrigido

```
┌─────────────────────────────────────┐
│ Usuário clica "Gerar Relatório"    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Validação de formulário             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Calcular AP01, AP05, AP03           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Validar dados calculados            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ DELETE linhas antigas (AP01)        │
│ ✅ RLS permite (nova política)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ INSERT novas linhas (AP01)          │
│ ✅ Funciona (sem duplicatas)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Repetir para AP05 e AP03            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Atualizar status "Concluído"        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Navegar para tela de relatório      │
└─────────────────────────────────────┘
```

---

## 🎓 Por que isso aconteceu?

1. **RLS foi ativado** (linha 114-116 do CRIAR-TABELAS-AGORA.sql)
2. **Políticas foram criadas** mas apenas para SELECT e INSERT
3. **UPDATE e DELETE foram esquecidos** na criação inicial
4. **Código funcionou** na primeira vez (INSERT sem duplicatas)
5. **Falhou** na segunda vez (precisa DELETE/UPDATE para re-gerar)

---

## 🔄 Próximos Passos

**Imediatamente:**
1. ✅ Executar FIX-RLS-POLICIES.sql no Supabase
2. ✅ Verificar políticas criadas
3. ✅ Testar geração de relatório

**Opcional (melhorias futuras):**
1. Criar política para DELETE em `financiamentos` (soft delete)
2. Adicionar política para super admin (bypass RLS)
3. Criar função SQL com SECURITY DEFINER para operações complexas

---

## 📞 Precisa de Ajuda?

Se o erro persistir após executar o SQL:

1. **Verifique se você está logado** no Supabase
   - O RLS valida `auth.uid()`
   - Se não houver usuário logado, todas as políticas falham

2. **Verifique se o financiamento pertence a você**
   - Políticas verificam `criado_por = auth.uid()`
   - Se o registro foi criado por outro usuário, você não tem acesso

3. **Verifique os logs do Supabase**
   - Supabase Dashboard → Logs
   - Procure por erros de RLS

4. **Teste direto no SQL Editor**
   - Execute os comandos de TEST no final do FIX-RLS-POLICIES.sql
   - Veja se retornam erro ou sucesso

---

## 📄 Arquivos Relacionados

- `FIX-RLS-POLICIES.sql` - SQL para corrigir as políticas
- `CRIAR-TABELAS-AGORA.sql` - Schema original (incompleto)
- `ANALISE-PROBLEMA-RELATORIO.md` - Análise técnica completa
- `CORRECOES-IMPLEMENTADAS.md` - Todas as correções de código

---

**Data:** 2025-01-20
**Status:** ⚠️ Aguardando execução do SQL
**Prioridade:** 🔴 ALTA (bloqueia geração de relatórios)
