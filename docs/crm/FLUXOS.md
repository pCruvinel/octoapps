# Fluxos de Usuário do Módulo CRM

> **Última Atualização:** 2026-01-08

---

## Índice de Fluxos

| Fluxo | Descrição |
|-------|-----------|
| FL-001 | Criar Nova Oportunidade |
| FL-002 | Mover Oportunidade no Kanban |
| FL-003 | Gerenciar Detalhes da Oportunidade |
| FL-004 | Agendar Follow-up |
| FL-005 | Anexar Documento |
| FL-006 | Gestão de Contatos |
| FL-007 | Visualização de Calendário |

---

## FL-001: Criar Nova Oportunidade

### Diagrama

```mermaid
sequenceDiagram
    actor U as Usuário
    participant K as CRMKanban
    participant D as NewLeadDialog
    participant S as Supabase

    U->>K: Clica "Nova Oportunidade"
    K->>D: Abre modal
    D->>S: Carrega contatos e profiles
    U->>D: Preenche formulário
    
    alt Novo Contato
        U->>D: Clica "Criar novo"
        D->>S: INSERT contatos
        S-->>D: Retorna ID
    end
    
    U->>D: Clica "Criar"
    D->>D: Valida formulário (Zod)
    D->>S: INSERT oportunidades
    D->>S: INSERT log_atividades
    S-->>D: Sucesso
    D->>K: Callback onSuccess
    K->>S: Recarrega oportunidades
    K->>U: Toast "Oportunidade criada!"
```

### Campos Obrigatórios
- Contato
- Responsável
- Tipo de Operação
- Etapa do Funil

### Campos Opcionais
- Valor Estimado
- Origem
- Observações

---

## FL-002: Mover Oportunidade no Kanban

### Diagrama

```mermaid
sequenceDiagram
    actor U as Usuário
    participant K as CRMKanban
    participant H as useKanbanDnd
    participant S as Supabase

    U->>K: Arrasta card
    K->>H: handleDragStart
    H->>H: setActiveId
    
    U->>K: Solta em nova coluna
    K->>H: handleDragEnd
    H->>H: Atualização Otimista
    H->>S: UPDATE oportunidades.etapa_funil_id
    
    par Logging
        H->>S: INSERT log_atividades
    end
    
    alt Sucesso
        S-->>H: OK
        H->>U: Toast "Oportunidade movida!"
    else Erro
        S-->>H: ERROR
        H->>H: Reverte estado
        H->>U: Toast "Erro ao mover"
    end
```

### Comportamento
1. Feedback visual imediato (optimistic update)
2. Persistência assíncrona no banco
3. Rollback automático em caso de erro
4. Log de atividade registrado

---

## FL-003: Gerenciar Detalhes da Oportunidade

### Diagrama

```mermaid
graph TB
    subgraph "OpportunityDetails"
        Header[Cabeçalho: Título + Valor]
        Tabs[Tabs de Navegação]
        
        Header --> Actions[Ações: Editar / Excluir]
        Header --> Analytics[Análise Prévia]
        
        Tabs --> Timeline[Tab Timeline]
        Tabs --> Comments[Tab Comentários]
        Tabs --> Attachments[Tab Anexos]
        
        Timeline --> Logs[Histórico de Atividades]
        Comments --> PostComment[Postar Comentário]
        Attachments --> Upload[Upload de Arquivo]
    end
    
    subgraph "Sidebar"
        ContactCard[Card do Contato]
        DetailsCard[Card de Detalhes]
        TasksCard[Card de Tarefas]
    end
```

### Funcionalidades por Tab

| Tab | Funcionalidades |
|-----|-----------------|
| Timeline | Visualizar logs paginados, navegar páginas |
| Comentários | Postar, visualizar lista de comentários |
| Anexos | Upload, download, excluir, editar descrição |

---

## FL-004: Agendar Follow-up

### Diagrama

```mermaid
sequenceDiagram
    actor U as Usuário
    participant O as OpportunityDetails
    participant T as useTasks
    participant A as useAgendamentos
    participant S as Supabase

    U->>O: Clica "Agendar"
    O->>O: Abre modal de agendamento
    U->>O: Seleciona tipo (Ligação/Reunião/etc)
    U->>O: Preenche título e data
    U->>O: Clica "Confirmar"
    
    O->>T: createTask(...)
    T->>S: INSERT tarefas
    
    O->>A: createAgendamento(...)
    A->>S: INSERT agendamentos
    
    O->>S: INSERT log_atividades
    
    S-->>O: Sucesso
    O->>U: Toast "Agendado com sucesso!"
```

### Tipos de Interação

| Tipo | Ícone | Cor |
|------|-------|-----|
| Tarefa | 📋 | Azul |
| Follow-up | 🔄 | Roxo |
| Reunião | 👥 | Verde |
| Ligação | 📞 | Amarelo |
| E-mail | 📧 | Rosa |
| Documento | 📄 | Índigo |
| Prazo Judicial | ⚖️ | Vermelho |
| Audiência | 🏛️ | Laranja |

---

## FL-005: Anexar Documento

### Diagrama

```mermaid
sequenceDiagram
    actor U as Usuário
    participant O as OpportunityDetails
    participant St as Supabase Storage
    participant DB as Supabase DB

    U->>O: Clica "Upload"
    O->>O: Abre file picker
    U->>O: Seleciona arquivo
    
    O->>O: Valida tamanho (< 10MB)
    
    alt Arquivo válido
        O->>St: Upload para bucket
        St-->>O: URL pública
        O->>DB: INSERT anexos_oportunidade
        O->>DB: INSERT log_atividades
        O->>U: Toast "Arquivo anexado!"
    else Arquivo maior que 10MB
        O->>U: Toast "Arquivo muito grande"
    end
```

### Limite de Arquivo
- **Máximo:** 10MB
- **Bucket:** `oportunidades-anexos`
- **Estrutura:** `{oportunidade_id}/{timestamp}_{filename}`

---

## FL-006: Gestão de Contatos

### Diagrama de Estados

```mermaid
stateDiagram-v2
    [*] --> LEAD: Novo contato
    LEAD --> CLIENTE: Fechou negócio
    CLIENTE --> EX_CLIENTE: Encerrou relação
    EX_CLIENTE --> CLIENTE: Reativou
    
    LEAD --> LEAD: Update
    CLIENTE --> CLIENTE: Update
    EX_CLIENTE --> EX_CLIENTE: Update
    
    note right of LEAD: categoria_contato = 'LEAD'
    note right of CLIENTE: categoria_contato = 'CLIENTE'
    note right of EX_CLIENTE: categoria_contato = 'EX_CLIENTE'
```

### Status de Atividade (Calculado)

```mermaid
stateDiagram-v2
    [*] --> ATIVO: < 90 dias
    ATIVO --> INATIVO: 90-180 dias
    INATIVO --> ARQUIVADO: > 180 dias
    
    ARQUIVADO --> ATIVO: Atualização
    INATIVO --> ATIVO: Atualização
```

---

## FL-007: Visualização de Calendário

### Diagrama

```mermaid
graph TB
    subgraph "CRMCalendar"
        Nav[Navegação: Anterior / Hoje / Próximo]
        View[Seletor de View: Mês / Semana / Dia]
        
        Nav --> Grid[Grade de Dias]
        View --> Grid
        
        Grid --> Events[Eventos do Período]
        Events --> Tasks[Tarefas]
        Events --> Schedules[Agendamentos]
    end
    
    subgraph "Evento"
        Click[Clique em evento]
        Click --> Modal[Modal de detalhes]
        Modal --> Edit[Editar]
        Modal --> Delete[Excluir]
    end
```

### Modos de Visualização

| Modo | Descrição |
|------|-----------|
| Mês | Grade mensal completa |
| Semana | 7 dias em detalhe |
| Dia | Linha do tempo de 24h |
| Lista | Lista ordenada de eventos |

### Cores de Eventos

| Tipo | Cor Default |
|------|-------------|
| Tarefa | Cor por tipo (ver FL-004) |
| Agendamento | `#3D96FF` (personalizável) |

---

## Rotas do Módulo

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/crm/oportunidades` | CRMKanban | Board Kanban |
| `/crm/oportunidade/$id` | OpportunityDetails | Detalhe |
| `/crm/contatos` | ContactsList | Lista de contatos |
| `/crm/calendario` | CRMCalendar | Calendário |
| `/contatos/$id` | ContactDetails | Detalhe do contato |

---

## Navegação entre Fluxos

```mermaid
graph LR
    Kanban[Kanban] --> Detail[Detalhes Oportunidade]
    Detail --> Contact[Detalhes Contato]
    Detail --> Triagem[Análise Prévia]
    
    Calendar[Calendário] --> Detail
    ContactsList[Lista Contatos] --> Contact
    Contact --> Detail
    
    subgraph "CRM"
        Kanban
        Detail
        Calendar
    end
    
    subgraph "Contatos"
        ContactsList
        Contact
    end
    
    subgraph "Cálculos"
        Triagem
    end
```

---

*Documentação de fluxos de usuário - OctoApps CRM*
