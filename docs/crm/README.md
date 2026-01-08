# Documentação Técnica do Módulo CRM

> **Versão:** 1.0  
> **Última Atualização:** 2026-01-08  
> **Autor:** Engenharia Reversa Automatizada

---

## Visão Geral

O módulo **CRM (Customer Relationship Management)** do OctoApps é responsável pelo gerenciamento completo do ciclo de vida de leads e oportunidades de negócio no contexto jurídico-financeiro. Ele implementa um **funil de vendas visual (Kanban)** com drag-and-drop, gestão de contatos, agendamentos, tarefas e histórico de atividades.

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
│   ├── crm/                        # Componentes do CRM
│   │   ├── CRMKanban.tsx          # Board Kanban principal
│   │   ├── CRMCalendar.tsx        # Calendário de agendamentos
│   │   ├── OpportunityDetails.tsx # Detalhe da oportunidade
│   │   ├── OpportunityCard.tsx    # Card de oportunidade
│   │   ├── SortableOpportunityCard.tsx # Card com drag support
│   │   ├── DroppableColumn.tsx    # Coluna droppable do Kanban
│   │   ├── NewLeadDialog.tsx      # Modal de nova oportunidade
│   │   └── LogMessageFormatter.tsx # Formatador de logs
│   │
│   └── contacts/                   # Componentes de Contatos
│       ├── ContactsList.tsx       # Lista de contatos
│       └── ContactDetails.tsx     # Detalhe do contato
│
├── hooks/
│   ├── useContatos.ts             # CRUD de contatos
│   ├── useEtapasFunil.ts          # Gestão de etapas do funil
│   ├── useKanbanDnd.ts            # Lógica de drag-and-drop
│   ├── useTasks.ts                # CRUD de tarefas
│   └── useAgendamentos.ts         # CRUD de agendamentos
│
├── routes/_authenticated/crm/
│   ├── oportunidades.tsx          # Página Kanban
│   ├── oportunidade.$id.tsx       # Página de detalhe
│   ├── contatos.tsx               # Página de contatos
│   └── calendario.tsx             # Página de calendário
│
└── types/
    ├── opportunity.ts             # Tipos de oportunidade
    ├── contact.ts                 # Tipos de contato
    ├── funnel.ts                  # Tipos de etapas
    ├── task.ts                    # Tipos de tarefa
    ├── agendamento.ts             # Tipos de agendamento
    └── activity-log.ts            # Tipos de log
```

---

## Entidades Principais

### 1. Contato (Lead/Cliente)
Pessoa física ou jurídica que pode ser um prospect (lead), cliente ativo ou ex-cliente.

### 2. Oportunidade
Representa uma negociação em andamento, vinculada a um contato e posicionada em uma etapa do funil.

### 3. Etapa do Funil
Estágio no pipeline de vendas (ex: Lead, Qualificação, Proposta, Negociação, Ganho, Perdido).

### 4. Tarefa/Interação
Atividades agendadas vinculadas a oportunidades (follow-ups, reuniões, ligações).

### 5. Agendamento
Eventos de calendário vinculados a oportunidades ou contatos.

---

## Relacionamentos do Banco

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  contatos   │────<│  oportunidades  │>────│ etapas_funil │
└─────────────┘     └─────────────────┘     └──────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          v                v                v
    ┌──────────┐    ┌────────────┐   ┌────────────────┐
    │ tarefas  │    │ comentarios│   │anexos_oportunid│
    └──────────┘    └────────────┘   └────────────────┘
          │                                   │
          v                                   v
    ┌────────────┐                    ┌──────────────┐
    │agendamentos│                    │log_atividades│
    └────────────┘                    └──────────────┘
```

---

## Próximos Passos

1. Consultar [COMPONENTES.md](./COMPONENTES.md) para detalhes de implementação
2. Ver [REGRAS_NEGOCIO.md](./REGRAS_NEGOCIO.md) para lógica de negócio
3. Verificar [DATABASE.md](./DATABASE.md) para schema completo

---

*Documentação gerada automaticamente por engenharia reversa do código-fonte.*
