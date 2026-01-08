# Componentes do Módulo CRM

> **Última Atualização:** 2026-01-08

---

## Índice de Componentes

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| CRMKanban | `CRMKanban.tsx` | Board Kanban principal com drag-and-drop |
| CRMCalendar | `CRMCalendar.tsx` | Calendário de tarefas e agendamentos |
| OpportunityDetails | `OpportunityDetails.tsx` | Página de detalhes da oportunidade |
| OpportunityCard | `OpportunityCard.tsx` | Card visual de oportunidade |
| SortableOpportunityCard | `SortableOpportunityCard.tsx` | Wrapper com suporte a drag |
| DroppableColumn | `DroppableColumn.tsx` | Coluna droppable do Kanban |
| NewLeadDialog | `NewLeadDialog.tsx` | Modal de criação de oportunidade |
| LogMessageFormatter | `LogMessageFormatter.tsx` | Formatador de mensagens de log |
| ContactsList | `ContactsList.tsx` | Lista de contatos com CRUD |
| ContactDetails | `ContactDetails.tsx` | Página de detalhes do contato |

---

## CRMKanban

**Arquivo:** `src/components/crm/CRMKanban.tsx`  
**Linhas:** 568  
**Responsabilidade:** Renderizar o board Kanban com todas as etapas do funil e oportunidades

### Props

```typescript
interface CRMKanbanProps {
  onNavigate: (route: string, id?: string) => void;
}
```

### Hooks Utilizados

| Hook | Propósito |
|------|-----------|
| `useAuth` | Obter usuário autenticado |
| `usePermissions` | Verificar permissões CRUD |
| `useEtapasFunil` | Carregar etapas do funil |
| `useKanbanDnd` | Lógica de drag-and-drop |

### Funções Principais

| Função | Descrição |
|--------|-----------|
| `loadOpportunities()` | Carrega oportunidades do usuário via Supabase |
| `loadCounts(oppIds)` | Carrega contagem de comentários e anexos |
| `loadContacts()` | Carrega contatos ativos |
| `loadProfiles()` | Carrega perfis de usuários |
| `handleOpenEdit(opp)` | Abre modal de edição |
| `handleEditOpportunity()` | Salva edição da oportunidade |
| `handleOpenDelete(opp)` | Abre dialog de confirmação de exclusão |
| `handleConfirmDelete()` | Executa exclusão da oportunidade |
| `getStageOpportunities(etapaId)` | Filtra oportunidades por etapa |

### Queries Supabase

```typescript
// Carregar oportunidades com JOINs
const { data } = await supabase
  .from('oportunidades')
  .select(`
    *,
    contatos:contato_id (...),
    responsavel:responsavel_id (...)
  `)
  .eq('ativo', true)
  .or(`criado_por.eq.${user.id},responsavel_id.eq.${user.id}`)
  .order('ordem', { ascending: true });
```

---

## CRMCalendar

**Arquivo:** `src/components/crm/CRMCalendar.tsx`  
**Linhas:** 609  
**Responsabilidade:** Calendário visual com tarefas e agendamentos

### Props

```typescript
interface CRMCalendarProps {
  onNavigate: (route: string, id?: string) => void;
}
```

### Tipos Internos

```typescript
type ViewMode = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  type: 'tarefa' | 'agendamento';
  original: Task | Agendamento;
}
```

### Funções Principais

| Função | Descrição |
|--------|-----------|
| `loadContacts()` | Carrega contatos para seleção |
| `fetchEvents()` | Busca tarefas e agendamentos no período |
| `handleCreateEvent()` | Cria novo agendamento |
| `handleDeleteEvent()` | Remove agendamento |
| `next()` / `prev()` / `today()` | Navegação do calendário |
| `renderMonthCell(day)` | Renderiza célula do mês |
| `MonthView()` | Componente de visualização mensal |
| `ListView()` | Componente de visualização em lista |

---

## OpportunityDetails

**Arquivo:** `src/components/crm/OpportunityDetails.tsx`  
**Linhas:** 1159  
**Responsabilidade:** Página completa de detalhes da oportunidade

### Props

```typescript
interface OpportunityDetailsProps {
  opportunityId: string | null;
  onNavigate: (route: string, id?: string) => void;
  onBack?: () => void;
}
```

### Tabs Disponíveis

| Tab | Conteúdo |
|-----|----------|
| `timeline` | Histórico de atividades (logs) |
| `comments` | Comentários da equipe |
| `attachments` | Arquivos anexados |

### Funções Principais

| Função | Descrição |
|--------|-----------|
| `loadOpportunity()` | Carrega dados da oportunidade |
| `loadLogs(id, page)` | Carrega logs com paginação |
| `loadComments(id)` | Carrega comentários |
| `loadAttachments(id)` | Carrega anexos |
| `onSubmitEdit(values)` | Salva edição |
| `handlePostComment()` | Posta novo comentário |
| `handleConfirmDelete()` | Exclui oportunidade |
| `handleSchedule()` | Agenda nova tarefa/interação |
| `handleFileUpload(event)` | Upload de arquivo |
| `handleDeleteAttachment(att)` | Remove anexo |
| `handleUpdateDescription()` | Atualiza descrição do anexo |

### Validação do Formulário

```typescript
const editFormSchema = z.object({
  contato_id: z.string().min(1, 'Selecione um contato'),
  tipo_operacao: z.string().min(1, 'Selecione o tipo'),
  valor_estimado: z.number().optional().default(0),
  responsavel_id: z.string().min(1, 'Selecione um responsável'),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
});
```

---

## OpportunityCard

**Arquivo:** `src/components/crm/OpportunityCard.tsx`  
**Linhas:** 152  
**Responsabilidade:** Card visual de oportunidade no Kanban

### Props

```typescript
interface OpportunityCardProps {
  opportunity: Opportunity;
  onNavigate: (route: string, id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
  commentCount?: number;
  attachmentCount?: number;
}
```

### Informações Exibidas

- **Header:** Badge do tipo de ação + dropdown de ações
- **Centro:** Nome do contato, valor estimado, data de criação
- **Footer:** Avatar do responsável + contadores (comentários, anexos)

---

## SortableOpportunityCard

**Arquivo:** `src/components/crm/SortableOpportunityCard.tsx`  
**Linhas:** 58  
**Responsabilidade:** Wrapper para OpportunityCard com suporte a drag-and-drop

### Implementação

Utiliza `useSortable` do @dnd-kit para:
- Gerar atributos de acessibilidade
- Aplicar transformações CSS durante drag
- Controlar opacidade durante movimento

---

## DroppableColumn

**Arquivo:** `src/components/crm/DroppableColumn.tsx`  
**Linhas:** 68  
**Responsabilidade:** Coluna droppable do Kanban que representa uma etapa

### Props

```typescript
interface DroppableColumnProps {
  etapa: EtapaFunil;
  opportunities: Opportunity[];
  children: React.ReactNode;
}
```

### Estilização Dinâmica

A cor de fundo é derivada da cor da etapa com opacidade:

```typescript
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

---

## NewLeadDialog

**Arquivo:** `src/components/crm/NewLeadDialog.tsx`  
**Linhas:** 408  
**Responsabilidade:** Modal para criação de nova oportunidade

### Props

```typescript
interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contacts: any[];
  profiles: any[];
}
```

### Campos do Formulário

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `contato_id` | Sim | Contato vinculado |
| `responsavel_id` | Sim | Usuário responsável |
| `etapa_funil_id` | Sim | Etapa inicial do funil |
| `tipo_operacao` | Sim | Tipo de produto/serviço |
| `valor_estimado` | Não | Valor em R$ |
| `origem` | Não | Origem do lead |
| `observacoes` | Não | Anotações livres |

### Opções de Origem

```typescript
const ORIGEM_OPTIONS = [
  { value: 'Indicação', label: 'Indicação' },
  { value: 'Ads', label: 'Ads' },
  { value: 'Meta', label: 'Meta' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Google', label: 'Google' },
  { value: 'Outro', label: 'Outro' },
];
```

---

## LogMessageFormatter

**Arquivo:** `src/components/crm/LogMessageFormatter.tsx`  
**Linhas:** 145  
**Responsabilidade:** Formatar mensagens de log de atividades

### Ações Suportadas

| Ação | Renderização |
|------|--------------|
| `CRIAR_OPORTUNIDADE` | Exibe valor inicial, etapa e origem |
| `EDITAR_OPORTUNIDADE` | Mostra campos alterados (antes → depois) |
| `MOVER_OPORTUNIDADE` | Exibe etapa anterior e nova |
| `ADICIONAR_COMENTARIO` | Mostra preview do texto |
| `AGENDAR_INTERACAO` | Exibe tipo, título e data |
| `ANEXAR_ARQUIVO` | Mostra nome e tamanho do arquivo |
| `EXCLUIR_ANEXO` | Mostra nome do arquivo removido |

---

## ContactsList

**Arquivo:** `src/components/contacts/ContactsList.tsx`  
**Linhas:** 796  
**Responsabilidade:** Lista paginada de contatos com CRUD

### Funções Principais

| Função | Descrição |
|--------|-----------|
| `loadContacts()` | Carrega contatos com paginação |
| `handleCreateContact()` | Cria novo contato |
| `handleEditContact()` | Atualiza contato existente |
| `handleDeleteContact()` | Soft delete de contato |
| `getStatusAtividade(data)` | Calcula status baseado na data |
| `getCategoriaLabel(cat)` | Retorna label da categoria |

### Helpers de Status

```typescript
function getStatusAtividade(dataAtualizacao: string) {
  const diffDays = /* cálculo de dias desde atualização */;
  if (diffDays < 90) return 'ATIVO';
  if (diffDays < 180) return 'INATIVO';
  return 'ARQUIVADO';
}
```

---

## ContactDetails

**Arquivo:** `src/components/contacts/ContactDetails.tsx`  
**Linhas:** 884  
**Responsabilidade:** Página de detalhes do contato com oportunidades vinculadas

### Funções Principais

| Função | Descrição |
|--------|-----------|
| `loadContact()` | Carrega dados do contato |
| `loadOpportunities()` | Carrega oportunidades vinculadas |
| `handleEditContact()` | Abre modal de edição |
| `handleDeleteContact()` | Soft delete do contato |
| `handleCreateOpportunity()` | Cria oportunidade vinculada |
| `handleDeleteOpportunity()` | Remove oportunidade |
| `formatAddress()` | Formata endereço completo |

---

*Documentação de componentes - OctoApps CRM*
