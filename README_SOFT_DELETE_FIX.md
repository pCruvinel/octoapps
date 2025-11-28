# Correção do Soft Delete para Petições

## Problema
O soft delete está implementado no código, mas as políticas RLS (Row Level Security) do Supabase estão bloqueando a atualização dos campos de exclusão (`excluido`, `excluido_em`, `excluido_por`).

Erro: `new row violates row-level security policy for table "peticoes"`

## Solução
Execute os comandos SQL no arquivo `supabase_rls_policies.sql` no SQL Editor do Supabase.

## Passos para Resolver

### 🔧 Opção 1: Solução Simplificada (Recomendada)
Execute o script `supabase_rls_simple.sql`:

1. Abra o **SQL Editor** no Supabase
2. Execute todo o conteúdo do arquivo `supabase_rls_simple.sql`
3. Teste a exclusão de uma petição
4. Deve funcionar imediatamente

### 🔧 Opção 2: Diagnóstico Passo-a-Passo

#### 2.1 Debug Temporário
Execute `supabase_rls_debug.sql` para desabilitar RLS temporariamente:
- Se funcionar, o problema é das políticas RLS
- Depois reabilite com `supabase_rls_policies.sql`

#### 2.2 Políticas Detalhadas
Se preferir controle mais granular, use `supabase_rls_policies.sql`

### 🔍 Verificar Políticas
No painel do Supabase:
- **Database** > **Tables** > **peticoes** > **RLS Policies**
- Verifique se as políticas foram aplicadas

### ✅ Testar Funcionalidade
Após aplicar qualquer solução:
1. Tente excluir uma petição pela tabela
2. Verifique se desaparece da lista
3. Confirme que permanece no banco (soft delete)

## Políticas Implementadas

- **SELECT**: Usuários podem ver apenas suas próprias petições ativas (não excluídas)
- **INSERT**: Usuários podem criar petições
- **UPDATE**: Usuários podem atualizar suas próprias petições (incluindo soft delete)
- **DELETE**: Mantido para casos especiais, mas soft delete é preferido

## Verificação
Para verificar se o soft delete está funcionando:

```sql
-- Verificar petições excluídas
SELECT id, nome, excluido, excluido_em, excluido_por
FROM peticoes
WHERE excluido = true;

-- Verificar se a listagem filtra excluídas
SELECT COUNT(*) FROM peticoes WHERE excluido = false;
```

## Considerações
- As políticas assumem que `criado_por` contém o ID do usuário autenticado
- Se você usa um sistema de roles, pode ser necessário ajustar as políticas
- Para admins verem todas as petições, descomente a política adicional no arquivo SQL