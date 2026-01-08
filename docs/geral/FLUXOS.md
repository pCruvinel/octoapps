# Fluxos de Navegação - OctoApps

> **Última Atualização:** 2026-01-08

---

## Índice

1. [Fluxo de Autenticação](#fluxo-de-autenticação)
2. [Jornada do Administrador](#jornada-do-administrador)
3. [Jornada do Colaborador](#jornada-do-colaborador)
4. [Jornada do Perito](#jornada-do-perito)
5. [Fluxo de Cálculo Revisional](#fluxo-de-cálculo-revisional)

---

## Fluxo de Autenticação

### Login

```mermaid
graph TD
    Start[Acessa Sistema] --> Check{Tem Sessão?}
    Check -->|Não| Login[Tela de Login]
    Check -->|Sim| Dashboard[Dashboard]
    
    Login --> Credentials[Email + Senha]
    Credentials --> Validate{Válido?}
    Validate -->|Sim| CreateSession[Cria Sessão]
    Validate -->|Não| Error[Erro: Credenciais inválidas]
    Error --> Login
    
    CreateSession --> LoadProfile[Carrega Profile]
    LoadProfile --> LoadPerms[Carrega Permissões]
    LoadPerms --> Dashboard
```

### Convite de Usuário

```mermaid
sequenceDiagram
    participant Admin
    participant Sistema
    participant Email as E-mail (Resend)
    participant Novo as Novo Usuário
    
    Admin->>Sistema: Clica "Convidar Usuário"
    Admin->>Sistema: Preenche email + role
    Sistema->>Sistema: Cria registro em auth.users
    Sistema->>Email: Envia convite
    Email->>Novo: Link de ativação
    Novo->>Sistema: Clica no link
    Sistema->>Novo: Tela de setup de senha
    Novo->>Sistema: Define senha
    Sistema->>Sistema: Ativa conta
    Novo->>Sistema: Primeiro login
```

---

## Jornada do Administrador

### Dashboard → Configurações

```mermaid
graph LR
    Dashboard[Dashboard Executivo] --> Users[Gestão de Usuários]
    Dashboard --> Perms[Permissões]
    Dashboard --> Funil[Config. Funil]
    
    Users --> Invite[Convidar]
    Users --> Edit[Editar]
    Users --> Deactivate[Inativar]
    
    Perms --> Matrix[Matriz de Permissões]
    Matrix --> Save[Salvar Alterações]
    
    Funil --> AddStage[Adicionar Etapa]
    Funil --> Reorder[Reordenar]
    Funil --> DeleteStage[Excluir Etapa]
```

### Configuração de Funil

```mermaid
sequenceDiagram
    participant Admin
    participant UI as Tela Config
    participant DB as Supabase
    
    Admin->>UI: Acessa Configurações > Funil
    UI->>DB: Carrega etapas_funil
    DB-->>UI: Lista de etapas
    
    Admin->>UI: Arrasta "Negociação" para posição 2
    UI->>UI: Reordena localmente
    UI->>DB: UPDATE order_index
    DB-->>UI: Sucesso
    UI-->>Admin: Toast "Ordem atualizada"
    
    Admin->>UI: Tenta excluir "Venda"
    UI->>DB: SELECT COUNT(*) WHERE etapa_funil_id = X
    DB-->>UI: count = 15
    UI-->>Admin: Erro "Mova os cards antes de excluir"
```

---

## Jornada do Colaborador

### Do Lead à Análise de Viabilidade

```mermaid
graph TD
    CRM[CRM Kanban] --> NewOpp[+ Nova Oportunidade]
    NewOpp --> FormBasic[Formulário Básico]
    FormBasic --> SaveLead[Salva Lead]
    
    SaveLead --> Details[Detalhes do Cliente]
    Details --> TabCalc[Aba Cálculos]
    TabCalc --> NewCalc[+ Novo Cálculo]
    
    NewCalc --> SelectType{Tipo de Contrato}
    SelectType -->|Veículo| FormVeiculo[Form Veículo]
    SelectType -->|Imóvel| FormImovel[Form Imobiliário]
    SelectType -->|Cartão| FormCartao[Form Cartão]
    
    FormVeiculo --> Upload[Upload PDF]
    FormImovel --> Upload
    
    Upload --> OCR[Processamento OCR]
    OCR --> AutoFill[Preenchimento Automático]
    AutoFill --> Review[Revisão Humana]
    
    Review --> Calculate[Calcular Viabilidade]
    Calculate --> Result[Tela de Resultado]
    
    Result --> ExportPDF[Exportar PDF]
    Result --> SaveCRM[Salvar no CRM]
    Result --> GenPetition[Gerar Petição]
```

### Movimentação no Kanban

```mermaid
sequenceDiagram
    participant Advogado
    participant Kanban as CRM Kanban
    participant DB as Supabase
    
    Advogado->>Kanban: Arrasta card para "Negociação"
    Kanban->>Kanban: Atualização Otimista
    
    Kanban->>DB: UPDATE oportunidades SET etapa_funil_id = ?
    
    alt Sucesso
        DB-->>Kanban: OK
        Kanban-->>Advogado: Card na nova posição
    else Erro
        DB-->>Kanban: Erro
        Kanban->>Kanban: Reverte posição
        Kanban-->>Advogado: Toast de erro
    end
```

---

## Jornada do Perito

### Auditoria e Validação

```mermaid
graph TD
    Central[Central de Perícia] --> Filter[Filtrar por Tipo/Status]
    Filter --> List[Lista de Cálculos]
    
    List --> Select[Seleciona Cálculo]
    Select --> View[Visualiza Resumo]
    
    View --> Advanced[Modo Edição Avançada]
    Advanced --> Grid[Grid de Parcelas]
    
    Grid --> EditCell[Edita Célula]
    EditCell --> Recalc[Recálculo em Cascata]
    Recalc --> Grid
    
    Grid --> Expurge[Marca Expurgos]
    Expurge --> Recalc
    
    Grid --> Validate[Validar Cálculo]
    Validate --> Lock[Trava para Outros]
    Lock --> Report[Gera Parecer Técnico]
```

### Reconstrução de Cartão de Crédito

```mermaid
sequenceDiagram
    participant Perito
    participant Grid as Grid de Faturas
    participant Engine as Motor de Cálculo
    participant DB as Supabase
    
    Perito->>Grid: Acessa módulo Cartão
    Perito->>Grid: Define data inicial (Jan/2023)
    
    loop Para cada mês
        Perito->>Grid: Insere dados da fatura
        Grid->>Engine: Calcula saldo com Taxa Média
        Engine-->>Grid: Novo saldo projetado
    end
    
    Perito->>Grid: Clica "Finalizar"
    Grid->>Engine: Gera relatório comparativo
    Engine-->>Grid: Indébito total calculado
    
    Grid->>DB: Salva cálculo completo
    DB-->>Perito: Cálculo disponível para relatório
```

---

## Fluxo de Cálculo Revisional

### Wizard Completo

```mermaid
graph TD
    subgraph "Step 1: Identificação"
        S1[Seleciona Módulo] --> S1a{Módulo}
        S1a -->|GERAL| FormGeral[Form Empréstimo/Veículo]
        S1a -->|IMOBILIARIO| FormImob[Form SFH/SFI]
        S1a -->|CARTAO| FormCard[Form Cartão]
    end
    
    subgraph "Step 2: Dados do Contrato"
        FormGeral --> Upload[Upload PDF]
        FormImob --> Upload
        Upload --> OCR{OCR?}
        OCR -->|Sim| AutoFill[Preenchimento Automático]
        OCR -->|Não| Manual[Preenchimento Manual]
        AutoFill --> Validation[Validação de Dados]
        Manual --> Validation
    end
    
    subgraph "Step 3: Análise BACEN"
        Validation --> FetchTaxa[Busca Taxa Média]
        FetchTaxa --> Compare[Comparativo]
        Compare --> Viability{Viabilidade?}
        Viability -->|VIAVEL| Green[Badge Verde]
        Viability -->|ATENCAO| Yellow[Badge Amarelo]
        Viability -->|INVIAVEL| Red[Badge Vermelho]
    end
    
    subgraph "Step 4: Resultado"
        Green --> Result[Tela de Resultado]
        Yellow --> Result
        Red --> Result
        
        Result --> Actions{Ações}
        Actions --> PDF[Exportar PDF]
        Actions --> Link[Vincular ao CRM]
        Actions --> Petition[Gerar Petição]
    end
```

### Integração com BACEN

```mermaid
sequenceDiagram
    participant UI as Formulário
    participant Hook as useBacenTaxas
    participant API as API Bacen
    participant Cache as taxas_bacen
    
    UI->>Hook: Data contrato + Tipo operação
    
    Hook->>Cache: Verifica cache local
    alt Cache hit
        Cache-->>Hook: Taxa existente
    else Cache miss
        Hook->>API: Consulta série SGS
        API-->>Hook: Taxa histórica
        Hook->>Cache: Salva no banco
    end
    
    Hook-->>UI: { taxa_mensal, taxa_anual }
    UI->>UI: Exibe comparativo
```

---

## Diagrama de Rotas

```
/
├── /login                    # Autenticação
├── /setup-password           # Primeiro acesso
│
├── /_authenticated/          # Rotas protegidas
│   ├── /dashboard            # Dashboard principal
│   │   └── /executivo        # Dashboard executivo (Admin)
│   │
│   ├── /crm/
│   │   ├── /oportunidades    # Pipeline Kanban
│   │   ├── /oportunidade/:id # Detalhes
│   │   └── /contatos         # Lista de contatos
│   │
│   ├── /calc/
│   │   ├── /wizard           # Novo cálculo
│   │   ├── /:id              # Detalhes do cálculo
│   │   ├── /pericia          # Central do Perito
│   │   └── /lista            # Lista de cálculos
│   │
│   ├── /configuracoes/
│   │   ├── /usuarios         # Gestão de usuários
│   │   ├── /permissoes       # Matriz de permissões
│   │   ├── /funil            # Etapas do pipeline
│   │   └── /minha-conta      # Perfil pessoal
│   │
│   └── /peticoes/            # Gerador de petições
│       ├── /templates        # Gestão de templates
│       └── /nova             # Gerar petição
```

---

*Documentação de Fluxos - OctoApps*
