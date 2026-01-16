# Documentação Técnica do Módulo CRM

> **Versão:** 2.1  
> **Última Atualização:** 2026-01-16  
> **Autor:** Engenharia OctoApps

---

## Visão Geral

O módulo **CRM (Customer Relationship Management)** do OctoApps é responsável pelo gerenciamento completo do ciclo de vida de leads e oportunidades de negócio no contexto jurídico-financeiro. Ele implementa um **funil de vendas visual (Kanban)** com drag-and-drop, visualização em **DataTable**, gestão de contatos, **catálogo de serviços**, agendamentos, tarefas e histórico de atividades.

---

## Novidades da v2.1 (2026-01-16)

| Feature | Descrição |
|---------|-----------|
| **Pipeline DataTable** | Nova visualização em tabela com linha de totais |
| **Catálogo de Serviços** | Página CRUD para gerenciar produtos/serviços (`/crm/services`) |
| **Filtros Multi-select** | Produto e Responsável agora são multi-select com checkboxes |
| **produto_servico_id** | Campo adicionado ao formulário de edição de oportunidade |
| **Linha de Totais** | DataTable exibe contagem e somas de valores |

### Novidades da v2.0

| Feature | Descrição |
|---------|-----------|
| **Header Padronizado** | Todas as páginas (Kanban, Calendário, Contatos) usam layout unificado |
| **Colunas Flexíveis** | Kanban sem scroll horizontal, colunas adaptáveis |
| **Scrollbars Minimalistas** | Estilo personalizado para scrollbars |
| **Arquivar Oportunidade** | Soft-delete com opção de arquivar |
| **Campos Financeiros** | `valor_proposta`, `valor_causa`, `produto_servico` |
| **Menu Hover-Only** | Botão de ações aparece apenas no hover do card |

---

## Índice de Documentação

| Documento | Descrição |
|-----------|-----------|
| [ARQUITETURA.md](./ARQUITETURA.md) | Arquitetura geral, padrões e decisões de design |
| [COMPONENTES.md](./COMPONENTES.md) | Documentação detalhada de todos os componentes React |
| [HOOKS.md](./HOOKS.md) | Hooks customizados e suas responsabilidades |
| [DATABASE.md](./DATABASE.md) | Schema do banco de dados, tabelas e relacionamentos |
| [REGRAS_NEGOCIO.md](./REGRAS_NEGOCIO.md) | Regras de negócio implementadas |
| [FLUXOS.md](./FLUXOS.md) | Fluxos de usuário e casos de uso |

---

## Stack Tecnológica

| Tecnologia | Uso no CRM |
|------------|------------|
| **React 18** | Biblioteca de UI |
| **TypeScript 5.9+** | Tipagem estática |
| **Tanstack Router** | Roteamento SPA |
| **@dnd-kit** | Drag and drop no Kanban |
| **React Hook Form + Zod** | Validação de formulários |
| **Supabase** | Backend (PostgreSQL + Auth + Storage) |
| **Tailwind CSS 4** | Estilização |
| **shadcn/ui** | Componentes de UI |

---

## Estrutura de Arquivos

```
src/
├── components/
│   ├── crm/                             # Componentes do CRM
│   │   ├── CRMKanban.tsx               # Board Kanban + toggle DataTable
│   │   ├── CRMCalendar.tsx             # Calendário de agendamentos
│   │   ├── OpportunityDetails.tsx      # Detalhe da oportunidade
│   │   ├── OpportunityCard.tsx         # Card de oportunidade
│   │   ├── OpportunitiesDataTable.tsx  # Visualização em tabela (NEW v2.1)
│   │   ├── SortableOpportunityCard.tsx # Card com drag support
│   │   ├── DroppableColumn.tsx         # Coluna droppable do Kanban
│   │   ├── NewLeadDialog.tsx           # Modal de nova oportunidade
│   │   ├── KanbanFilters.tsx           # Barra de filtros multi-select (v2.1)
│   │   ├── OpportunityFieldsManager.tsx# Configurador de campos
│   │   └── LogMessageFormatter.tsx     # Formatador de logs
│   │
│   └── contacts/                        # Componentes de Contatos
│       ├── ContactsList.tsx            # Lista de contatos
│       ├── ContactDetails.tsx          # Detalhe do contato
│       └── ContactFormDialog.tsx       # Modal de formulário
│
├── hooks/
│   ├── useContatos.ts                  # CRUD de contatos
│   ├── useEtapasFunil.ts               # Gestão de etapas do funil
│   ├── useKanbanDnd.ts                 # Lógica de drag-and-drop
│   ├── useTasks.ts                     # CRUD de tarefas
│   ├── useAgendamentos.ts              # CRUD de agendamentos
│   ├── useFeriados.ts                  # Gestão de feriados (calendário)
│   └── useProducts.ts                  # Produtos/serviços (CRUD completo)
│
├── routes/_authenticated/crm/
│   ├── oportunidades.tsx               # Página Kanban
│   ├── oportunidade.$id.tsx            # Página de detalhe
│   ├── contatos.tsx                    # Página de contatos
│   ├── calendario.tsx                  # Página de calendário
│   ├── services.tsx                    # Catálogo de Serviços (NEW v2.1)
│   └── campos-oportunidade.tsx         # Configuração de campos
│
└── types/
    ├── opportunity.ts                  # Tipos de oportunidade
    ├── contact.ts                      # Tipos de contato
    ├── funnel.ts                       # Tipos de etapas
    ├── task.ts                         # Tipos de tarefa
    ├── agendamento.ts                  # Tipos de agendamento
    └── activity-log.ts                 # Tipos de log
```

---

## Entidades Principais

### 1. Contato (Lead/Cliente)
Pessoa física ou jurídica que pode ser um prospect (lead), cliente ativo ou ex-cliente.

### 2. Oportunidade
Representa uma negociação em andamento, vinculada a um contato e posicionada em uma etapa do funil.

**Campos Financeiros v2.1:**
- `valor_proposta`: Valor de honorários propostos
- `valor_causa`: Valor estimado da causa
- `produto_servico_id`: ID do produto/serviço vinculado (v2.1)

### 3. Etapa do Funil
Estágio no pipeline de vendas (ex: Lead, Qualificação, Proposta, Negociação, Ganho, Perdido).

### 4. Produto/Serviço (v2.1)
Representa um serviço oferecido pelo escritório (ex: Revisional de Veículo, Revisional Imobiliário).

**Tabela:** `products_services`
- `id`: UUID
- `name`: Nome do serviço
- `description`: Descrição opcional
- `default_fee_percentage`: % de honorários padrão
- `active`: Status ativo/inativo
- `ordem`: Ordenação para display

### 5. Tarefa/Interação
Atividades agendadas vinculadas a oportunidades (follow-ups, reuniões, ligações).

### 6. Agendamento
Eventos de calendário vinculados a oportunidades ou contatos.

---

## Relacionamentos do Banco

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  contatos   │────<│  oportunidades  │>────│ etapas_funil │
└─────────────┘     └─────────────────┘     └──────────────┘
                           │    │
          ┌────────────────┼────┼─────────────────┐
          │                │    │                 │
          v                v    │                 v
    ┌──────────┐    ┌────────────┐    ┌────────────────┐
    │ tarefas  │    │ comentarios│    │anexos_oportunid│
    └──────────┘    └────────────┘    └────────────────┘
          │                │                   │
          v                v                   v
    ┌────────────┐  ┌──────────────┐   ┌──────────────────┐
    │agendamentos│  │log_atividades│   │products_services │
    └────────────┘  └──────────────┘   └──────────────────┘
```

---

## Padrões de UI (v2.1)

Ver [UI_STANDARD.md](../UI_STANDARD.md) para:
- **Header padronizado** com título à esquerda e ações à direita
- **Toggle Kanban/Tabela** para alternar visualizações
- **Scrollbars personalizados** (`.custom-scrollbar`)
- **Colunas flexíveis** do Kanban
- **Cards com menu hover-only**
- **Multi-select com Popover+Checkbox**
- **DataTable com linha de totais**

---

## Funcionalidades do Pipeline v2.1

### Visualização Kanban
- Drag-and-drop entre etapas
- Filtros por data, produto (multi), responsável (multi)
- Cards com ações hover-only

### Visualização DataTable
- Toggle via tabs no header
- Colunas: Oportunidade, Contato, Etapa, Valor Proposta, Valor Causa, Responsável, Data
- **Linha de totais** com:
  - Contagem de oportunidades
  - Soma total de Valor Proposta
  - Soma total de Valor Causa
- Mesmos filtros do Kanban aplicados

---

## Próximos Passos

1. Consultar [COMPONENTES.md](./COMPONENTES.md) para detalhes de implementação
2. Ver [REGRAS_NEGOCIO.md](./REGRAS_NEGOCIO.md) para lógica de negócio
3. Verificar [DATABASE.md](./DATABASE.md) para schema completo

---

*Documentação técnica - OctoApps CRM v2.1*
