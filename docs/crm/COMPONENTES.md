# Componentes do Módulo CRM

> **Última Atualização:** 2026-01-16

---

## Índice de Componentes

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| SalesDashboard | `SalesDashboard.tsx` | Dashboard comercial com KPIs e gráficos (NEW v2.2) |
| CRMKanban | `CRMKanban.tsx` | Board Kanban + DataTable com toggle |
| OpportunitiesDataTable | `OpportunitiesDataTable.tsx` | Visualização em tabela com totais (NEW v2.1) |
| CRMCalendar | `CRMCalendar.tsx` | Calendário de tarefas e agendamentos |
| OpportunityDetails | `OpportunityDetails.tsx` | Página de detalhes da oportunidade |
| OpportunityCard | `OpportunityCard.tsx` | Card visual de oportunidade |
| SortableOpportunityCard | `SortableOpportunityCard.tsx` | Wrapper com suporte a drag |
| DroppableColumn | `DroppableColumn.tsx` | Coluna droppable do Kanban |
| NewLeadDialog | `NewLeadDialog.tsx` | Modal de criação de oportunidade |
| KanbanFilters | `KanbanFilters.tsx` | Barra de filtros multi-select (v2.1) |
| OpportunityFieldsManager | `OpportunityFieldsManager.tsx` | Configurador de campos visíveis |
| LogMessageFormatter | `LogMessageFormatter.tsx` | Formatador de mensagens de log |
| ContactsList | `ContactsList.tsx` | Lista de contatos com CRUD |
| ContactDetails | `ContactDetails.tsx` | Página de detalhes do contato |

---

## SalesDashboard (NEW v2.2)

**Arquivo:** `src/components/crm/SalesDashboard.tsx`  
**Linhas:** ~340  
**Responsabilidade:** Dashboard comercial com KPIs, gráficos e listas de ação interativas.

### Props

```typescript
// Componente sem props - utiliza dados mockados
// Futuro: receberá dados reais via hooks
```

### Funcionalidades
1. **Filtro de Período:** Seletor de intervalo de datas (similar ao KanbanFilters).
2. **KPIs Animados:** 4 Cards com contadores animados (Valor em Pipeline, Vendas Confirmadas, Ticket Médio, Taxa de Conversão).
3. **Gráficos:**
    - *Receita por Produto:* BarChart Vertical (Recharts).
    - *Volume por Etapa:* BarChart Horizontal (funil).
4. **Listas de Ação:**
    - *Atividades Atrasadas:* Lista scrollável com alertas visuais.
    - *Últimas Vendas:* Ticker animado em loop infinito.
5. **Animações:** Utiliza `framer-motion` para entrada suave de elementos.

### Dependências

- `recharts` (v2.15.4)
- `framer-motion`
- `date-fns` & `react-day-picker`
- `@/components/ui/chart`
- `@/components/ui/card`
- `lucide-react`

### Cores e Temas
Segue o padrão **Deep Ocean** definido no Design System, utilizando variáveis CSS (`--primary`, `--chart-1`, etc).


---

## CRMKanban

**Arquivo:** `src/components/crm/CRMKanban.tsx`  
**Linhas:** ~740  
**Responsabilidade:** Renderizar o Pipeline com toggle Kanban/DataTable

### Props

```typescript
interface CRMKanbanProps {
  onNavigate: (route: string, id?: string) => void;
}
```

### State Principal (v2.1)

| State | Tipo | Descrição |
|-------|------|-----------|
| `viewMode` | `'kanban' \| 'table'` | Modo de visualização atual |
| `kanbanFilters` | `KanbanFilters` | Filtros aplicados |
| `opportunities` | `Opportunity[]` | Lista de oportunidades |

### Hooks Utilizados

| Hook | Propósito |
|------|-----------|
| `useAuth` | Obter usuário autenticado |
| `usePermissions` | Verificar permissões CRUD |
| `useEtapasFunil` | Carregar etapas do funil |
| `useKanbanDnd` | Lógica de drag-and-drop |
| `useProducts` | Produtos para filtros |

### Funções Principais

| Função | Descrição |
|--------|-----------|
| `loadOpportunities()` | Carrega oportunidades ativas (ativo=true) via Supabase |
| `loadCounts(oppIds)` | Carrega contagem de comentários e anexos |
| `loadContacts()` | Carrega contatos ativos |
| `loadProfiles()` | Carrega perfis de usuários |
| `handleOpenEdit(opp)` | Abre modal de edição |
| `handleEditOpportunity()` | Salva edição da oportunidade |
| `handleOpenDelete(opp)` | Abre dialog de confirmação de exclusão |
| `handleConfirmDelete()` | Executa exclusão em cascata (tarefas, anexos, logs, comentários) |
| `handleArchiveOpportunity(opp)` | Arquiva oportunidade (soft-delete, ativo=false) |
| `getStageOpportunities(etapaId)` | Filtra oportunidades por etapa (com filtros aplicados) |
| `getFilteredOpportunitiesForTable()` | **NEW v2.1:** Filtra oportunidades para DataTable |

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

### Validação do Formulário (v2.1)

```typescript
const editFormSchema = z.object({
  contato_id: z.string().min(1, 'Selecione um contato'),
  produto_servico_id: z.string().optional(), // v2.1: produto do catálogo
  tipo_operacao: z.string().optional(), // legado - mantido para compatibilidade
  valor_proposta: z.number().optional().default(0),
  valor_causa: z.number().optional().default(0),
  valor_estimado: z.number().optional().default(0),
  responsavel_id: z.string().min(1, 'Selecione um responsável'),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
});
```

---

## OpportunityCard

**Arquivo:** `src/components/crm/OpportunityCard.tsx`  
**Linhas:** ~210  
**Responsabilidade:** Card visual de oportunidade no Kanban

### Props

```typescript
interface OpportunityCardProps {
  opportunity: Opportunity;
  onNavigate: (route: string, id: string) => void;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void; // NEW: Arquivar oportunidade
  canUpdate: boolean;
  canDelete: boolean;
  commentCount?: number;
  attachmentCount?: number;
}
```

### Informações Exibidas

- **Header:** Badge do tipo de ação + menu de ações (hover-only, absolute positioned)
- **Centro:** Nome do contato, produto/serviço (badge), valores financeiros
- **Footer:** Avatar do responsável + contadores (comentários, anexos)

### Campos Financeiros (v2.0)

| Campo | Descrição | Visibilidade Configurável |
|-------|-----------|---------------------------|
| `valor_proposta` | Valor de honorários propostos | Sim |
| `valor_causa` | Valor estimado da causa | Sim |
| `produto_servico` | Produto/serviço vinculado (badge) | Sim |

### Ações do Menu (Hover)

| Ação | Ícone | Descrição |
|------|-------|-----------|
| Arquivar | `Archive` | Soft-delete (ativo=false) |
| Excluir | `Trash2` | Hard-delete com confirmação |

### Estilização do Menu

O botão de menu é **posicionado absolutamente** e aparece apenas no hover:

```tsx
<button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/50 backdrop-blur-sm ..." />
```

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
**Linhas:** ~70  
**Responsabilidade:** Coluna droppable do Kanban que representa uma etapa

### Props

```typescript
interface DroppableColumnProps {
  etapa: EtapaFunil;
  opportunities: Opportunity[];
  children: React.ReactNode;
}
```

### Layout Flexível (v2.0)

As colunas agora usam **layout flexível** para evitar scroll horizontal:

```tsx
<div className="flex-1 min-w-[280px] max-w-[350px] flex flex-col h-full">
  {/* Header */}
  <div className="...">...</div>
  
  {/* Content with custom scrollbar */}
  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
    {children}
  </div>
</div>
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

## OpportunitiesDataTable (NEW v2.1)

**Arquivo:** `src/components/crm/OpportunitiesDataTable.tsx`  
**Linhas:** ~230  
**Responsabilidade:** Visualização de oportunidades em formato de tabela com linha de totais

### Props

```typescript
interface OpportunitiesDataTableProps {
  opportunities: Opportunity[];
  loading?: boolean;
  onNavigate: (route: string, id?: string) => void;
  onEdit?: (opp: Opportunity) => void;
  onDelete?: (opp: Opportunity) => void;
  onArchive?: (opp: Opportunity) => void;
  etapas?: Array<{ id: string; nome: string; cor: string }>;
}
```

### Colunas da Tabela

| Coluna | Largura | Descrição |
|--------|---------|-----------|
| Oportunidade | 25% | Nome + Produto/Serviço |
| Contato | 15% | Nome do contato vinculado |
| Etapa | 12% | Badge colorido com nome da etapa |
| Valor Proposta | 12% | Formatado em R$ |
| Valor Causa | 12% | Formatado em R$ |
| Responsável | 10% | Nome do responsável |
| Criado em | 10% | Data formatada dd/MM/yyyy |
| Ações | 12 | Menu dropdown |

### Linha de Totais

A tabela inclui um `TableFooter` com:
- **Contagem** de oportunidades (ex: "15 oportunidades")
- **Soma total** de Valor Proposta
- **Soma total** de Valor Causa

### Ordenação

Por padrão, ordena por data de criação (mais recentes primeiro).

---

## KanbanFilters (v2.1 - Multi-Select)

**Arquivo:** `src/components/crm/KanbanFilters.tsx`  
**Linhas:** ~260  
**Responsabilidade:** Barra de filtros com suporte a multi-select

### Interface de Filtros

```typescript
export interface KanbanFilters {
  dateRange?: DateRange;
  productIds?: string[];      // v2.1: Agora é array
  responsibleIds?: string[];  // v2.1: Agora é array
}
```

### Props

```typescript
interface KanbanFiltersBarProps {
  filters: KanbanFilters;
  onFiltersChange: (filters: KanbanFilters) => void;
  responsibles?: Array<{ id: string; nome_completo: string }>;
}
```

### Componentes de Filtro

| Filtro | Tipo | Componente |
|--------|------|------------|
| Período | Date Range | `Popover` + `Calendar` |
| Produto | Multi-select | `Popover` + `Checkbox[]` |
| Responsável | Multi-select | `Popover` + `Checkbox[]` |

### Labels Dinâmicos

Os labels dos botões multi-select mostram:
- "Produto" ou "Responsável" quando vazio
- Nome do item quando apenas 1 selecionado
- "N produtos" ou "N responsáveis" quando múltiplos

---

## Services Page (NEW v2.1)

**Arquivo:** `src/routes/_authenticated/crm/services.tsx`  
**Linhas:** ~320  
**Responsabilidade:** Catálogo de Serviços com CRUD completo

### Funcionalidades

- **Tabela** com lista de serviços
- **Formulário** (Dialog) para criar/editar serviços
- **Estados** de loading (Skeletons), vazio e erro
- **Exclusão** com confirmação (AlertDialog)

### Campos do Formulário

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome do serviço (obrigatório) |
| `description` | string | Descrição opcional |
| `default_fee_percentage` | number | % de honorários padrão |
| `active` | boolean | Status ativo/inativo |

### Hook Utilizado

Utiliza `useProducts` hook para operações CRUD na tabela `products_services`.

---

*Documentação de componentes - OctoApps CRM v2.1*
