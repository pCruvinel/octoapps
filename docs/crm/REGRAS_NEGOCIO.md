# Regras de Negócio do Módulo CRM

> **Última Atualização:** 2026-01-08

---

## Índice

| ID | Regra | Componente |
|----|-------|------------|
| RN-CRM-001 | Categorias de Contato | Contatos |
| RN-CRM-002 | Status de Atividade Calculado | Contatos |
| RN-CRM-003 | Visibilidade de Dados | Geral |
| RN-CRM-004 | Soft Delete | Geral |
| RN-CRM-005 | Título Automático de Oportunidade | Oportunidades |
| RN-CRM-006 | Bloqueio de Exclusão de Etapa | Funil |
| RN-CRM-007 | Ordem Automática de Etapa | Funil |
| RN-CRM-008 | Log de Atividades | Geral |
| RN-CRM-009 | Filtro de Contatos Inativos | Kanban |
| RN-CRM-010 | Validação de Arquivos | Anexos |
| RN-CRM-011 | Catálogo de Produtos e Serviços | Oportunidades |

---

## RN-CRM-011: Catálogo de Produtos e Serviços

### Descrição
Oportunidades devem ser vinculadas a um **Produto ou Serviço** do catálogo para padronizar nomenclaturas e percentuais de honorários.

### Regras
1. A vinculação é opcional, mas recomendada.
2. Ao selecionar um serviço, o `% Honorários` é preenchido automaticamente (se definido).
3. Serviços inativos não aparecem para seleção em novas oportunidades.

### Implementação

```typescript
// useProducts.ts
const { data } = await supabase
  .from('products_services')
  .select('*')
  .eq('active', true)
  .order('ordem');
```

### Banco de Dados

```sql
ALTER TABLE oportunidades 
ADD COLUMN produto_servico_id UUID REFERENCES products_services(id);
```

## RN-CRM-001: Categorias de Contato

### Descrição
Todo contato deve ter uma **categoria manual** que indica sua situação no ciclo de vendas.

### Valores Permitidos

| Categoria | Descrição |
|-----------|-----------|
| `LEAD` | Prospect ainda não qualificado |
| `CLIENTE` | Cliente ativo com negócio fechado |
| `EX_CLIENTE` | Cliente que encerrou relacionamento |

### Implementação

```typescript
// types/contact.ts
categoria_contato: 'LEAD' | 'CLIENTE' | 'EX_CLIENTE';

// Default na criação
categoria_contato: 'LEAD'
```

### Regra de Banco

```sql
CHECK (categoria_contato IN ('LEAD', 'CLIENTE', 'EX_CLIENTE'))
```

---

## RN-CRM-002: Status de Atividade Calculado

### Descrição
O status de atividade de um contato é **calculado automaticamente** com base na última atualização.

### Cálculo

| Status | Critério de Tempo |
|--------|-------------------|
| `ATIVO` | Atualizado há < 90 dias |
| `INATIVO` | Atualizado entre 90-180 dias |
| `ARQUIVADO` | Atualizado há > 180 dias |

### Implementação (View)

```sql
CREATE VIEW v_contatos_status AS
SELECT 
    c.*,
    CASE 
        WHEN c.data_atualizacao >= NOW() - INTERVAL '90 days' THEN 'ATIVO'
        WHEN c.data_atualizacao >= NOW() - INTERVAL '180 days' THEN 'INATIVO'
        ELSE 'ARQUIVADO'
    END AS status_atividade
FROM public.contatos c;
```

### Implementação (Frontend)

```typescript
// components/contacts/ContactsList.tsx
function getStatusAtividade(dataAtualizacao: string) {
  const diffMs = Date.now() - new Date(dataAtualizacao).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays < 90) return 'ATIVO';
  if (diffDays < 180) return 'INATIVO';
  return 'ARQUIVADO';
}
```

---

## RN-CRM-003: Visibilidade de Dados

### Descrição
Usuários só podem ver e editar dados que **criaram** ou dos quais são **responsáveis**.

### Implementação

```typescript
// CRMKanban.tsx - Query de oportunidades
.or(`criado_por.eq.${user.id},responsavel_id.eq.${user.id}`)

// CRMKanban.tsx - Query de contatos
.or(`criado_por.eq.${user.id},responsavel_id.eq.${user.id}`)
```

### RLS (Row Level Security)

```sql
CREATE POLICY "Users view own opportunities" ON oportunidades
FOR SELECT USING (
    criado_por = auth.uid() OR responsavel_id = auth.uid()
);
```

### Exceção
Administradores têm acesso total via função `is_admin()`.

---

## RN-CRM-004: Soft Delete

### Descrição
Registros **nunca são excluídos fisicamente** do banco. São marcados como `ativo = false`.

### Tabelas Afetadas
- `contatos`
- `oportunidades`
- `etapas_funil`
- `tarefas`

### Implementação

```typescript
// useEtapasFunil.ts - deleteEtapa
const { error } = await supabase
  .from('etapas_funil')
  .update({ ativo: false })
  .eq('id', id);
```

### Consultas

Todas as queries filtram por `ativo = true`:

```typescript
.eq('ativo', true)
```

---

## RN-CRM-005: Título Automático de Oportunidade

### Descrição
Ao criar uma oportunidade, o **título é gerado automaticamente** com base no nome do contato.

### Implementação

```typescript
// NewLeadDialog.tsx - onSubmit
const contactName = showNewContactForm
  ? newContact.nome_completo
  : contacts.find(c => c.id === contactId)?.nome_completo || 'Sem Nome';

const currentTitle = `${contactName}`;
```

### Exemplo
- Contato: "João da Silva"
- Título gerado: "João da Silva"

---

## RN-CRM-006: Bloqueio de Exclusão de Etapa

### Descrição
Não é possível excluir uma etapa do funil que tenha **oportunidades vinculadas**.

### Implementação

```typescript
// useEtapasFunil.ts - deleteEtapa
const { count } = await supabase
  .from('oportunidades')
  .select('id', { count: 'exact', head: true })
  .eq('etapa_funil_id', id)
  .eq('ativo', true);

if (count && count > 0) {
  throw new Error(
    `Não é possível excluir: ${count} oportunidade(s) vinculada(s). ` +
    'Mova as oportunidades antes de excluir.'
  );
}
```

### Ação Necessária
Usuário deve mover todas as oportunidades para outra etapa antes de excluir.

---

## RN-CRM-007: Ordem Automática de Etapa

### Descrição
Ao criar uma nova etapa, a **ordem é calculada automaticamente** como última posição + 1.

### Implementação

```typescript
// useEtapasFunil.ts - createEtapa
const { data: ultimaEtapa } = await supabase
  .from('etapas_funil')
  .select('ordem')
  .eq('ativo', true)
  .order('ordem', { ascending: false })
  .limit(1)
  .single();

const novaOrdem = ultimaEtapa ? ultimaEtapa.ordem + 1 : 1;
```

---

## RN-CRM-008: Log de Atividades

### Descrição
Todas as ações significativas são registradas em `log_atividades` de forma **não-bloqueante**.

### Ações Logadas

| Ação | Dados Registrados |
|------|-------------------|
| `CRIAR_OPORTUNIDADE` | Título, contato, valor, etapa, responsável, origem |
| `EDITAR_OPORTUNIDADE` | Campos alterados (antes/depois) |
| `MOVER_OPORTUNIDADE` | Etapa anterior e nova |
| `EXCLUIR_OPORTUNIDADE` | Dados da oportunidade excluída |
| `ADICIONAR_COMENTARIO` | Preview do texto |
| `AGENDAR_INTERACAO` | Tipo, título, data |
| `ANEXAR_ARQUIVO` | Nome, tipo, tamanho |
| `EXCLUIR_ANEXO` | Nome do arquivo |

### Implementação

```typescript
// Logging não-bloqueante (fire-and-forget)
supabase.from('log_atividades').insert({
  user_id: user?.id,
  acao: 'CRIAR_OPORTUNIDADE',
  entidade: 'oportunidades',
  entidade_id: createdOpp.id,
  dados_anteriores: null,
  dados_novos: { ... }
}).then(() => { }).catch(e => console.warn('Log failed:', e));
```

---

## RN-CRM-009: Filtro de Contatos Inativos

### Descrição
Oportunidades vinculadas a contatos **inativos** são automaticamente filtradas do Kanban.

### Implementação

```typescript
// CRMKanban.tsx - loadOpportunities
const activeOpportunities = (data || [])
  .map((opp: any) => ({
    ...opp,
    contatos: opp.contatos 
      ? { ...opp.contatos, ativo: opp.contatos.ativo ?? true } 
      : null
  }))
  .filter((opp: any) => {
    // Se não tem contato, mantém a oportunidade
    if (!opp.contatos) return true;
    // Se tem contato, só mantém se estiver ativo
    return opp.contatos.ativo === true;
  });
```

---

## RN-CRM-010: Validação de Arquivos

### Descrição
Arquivos anexados às oportunidades devem respeitar o **limite de 10MB**.

### Implementação

```typescript
// OpportunityDetails.tsx - handleFileUpload
if (file.size > 10 * 1024 * 1024) {
  toast.error('Arquivo muito grande (máximo 10MB)');
  return;
}
```

### Estrutura de Armazenamento

```
oportunidades-anexos/
└── {oportunidade_id}/
    └── {timestamp}_{filename}
```

---

## Matriz de Permissões

| Ação | Permissão Necessária |
|------|----------------------|
| Criar oportunidade | `canCreate('crm')` |
| Editar oportunidade | `canUpdate('crm')` |
| Excluir oportunidade | `canDelete('crm')` |
| Criar contato | `canCreate('crm')` |
| Editar contato | `canUpdate('crm')` |
| Excluir contato | `canDelete('crm')` |
| Gerenciar etapas | Apenas Admin |

---

*Documentação de regras de negócio - OctoApps CRM*
