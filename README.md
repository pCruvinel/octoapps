# 🐙 Octoapps

> **Plataforma Jurídica de Cálculos Revisionais e Gestão de Clientes**

Sistema web completo para escritórios de advocacia especializados em direito bancário, oferecendo cálculos revisionais de contratos, gestão de clientes via CRM e geração de petições.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Módulos do Sistema](#-módulos-do-sistema)
- [Configuração e Instalação](#-configuração-e-instalação)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Banco de Dados](#-banco-de-dados)
- [Documentação](#-documentação)

---

## 🎯 Visão Geral

O Octoapps é uma aplicação SPA (Single Page Application) desenvolvida para simplificar o trabalho de advogados que atuam com revisão de contratos bancários. O sistema permite:

- **Cálculos Revisionais**: Análise de empréstimos, financiamentos, cartões de crédito e financiamentos imobiliários
- **CRM Jurídico**: Kanban para gestão de oportunidades e funil de vendas
- **Gestão de Contatos**: Cadastro completo de clientes e leads
- **Geração de Petições**: Editor de documentos jurídicos com templates
- **Exportação de Laudos**: Geração de relatórios em PDF/DOCX

---

## 🛠 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React** | 18.3.1 | Biblioteca de UI |
| **TypeScript** | - | Tipagem estática |
| **Vite** | 6.3.5 | Build tool e dev server |
| **TailwindCSS** | - | Framework CSS utilitário |

### UI Components
| Biblioteca | Descrição |
|------------|-----------|
| **Radix UI** | 25+ componentes headless (Dialog, Select, Tabs, etc.) |
| **Lucide React** | ^0.487.0 - Ícones SVG |
| **Recharts** | ^2.15.2 - Gráficos e visualizações |
| **Sonner** | ^2.0.3 - Sistema de toasts |
| **React Hook Form** | ^7.55.0 - Gerenciamento de formulários |
| **Zod** | ^4.2.1 - Validação de schemas |

### Backend & Data
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Supabase** | ^2.47.0 | Backend as a Service (Auth, Database, Realtime) |
| **PostgreSQL** | - | Banco de dados (via Supabase) |

### Cálculos & Documentos
| Biblioteca | Descrição |
|------------|-----------|
| **Decimal.js** | ^10.6.0 - Precisão matemática para cálculos financeiros |
| **date-fns** | ^4.1.0 - Manipulação de datas |
| **jsPDF** | ^3.0.4 - Geração de PDFs |
| **docx** | ^9.5.1 - Geração de documentos Word |
| **file-saver** | ^2.0.5 - Download de arquivos |

### Testes
| Ferramenta | Versão | Descrição |
|------------|--------|-----------|
| **Vitest** | ^4.0.10 | Framework de testes |
| **Testing Library** | - | React Testing Library |

---

## 📁 Estrutura de Pastas

```
OctoApp/
├── 📁 docs/                          # Documentação do projeto
│   ├── 📁 calculo-revisional/        # Docs do módulo de cálculos
│   │   ├── MODULO_CALCULO_REVISIONAL.md
│   │   ├── especificacao_tecnica.md
│   │   ├── ux.md
│   │   └── apendices.md
│   ├── DATABASE_SCHEMA.MD
│   └── funcionalidades-mockadas-e-incompletas.md
│
├── 📁 scripts/                       # Scripts utilitários
│   ├── buscar-taxas-bacen-olinda.js  # Busca taxas via API Olinda
│   ├── buscar-taxas-bacen-sgs.js     # Busca taxas via API SGS
│   ├── buscar-taxas-bacen.py         # Script Python alternativo
│   ├── migrate-v3-calculations.ts    # Migração de cálculos
│   └── seed-bacen-rates.ts           # Seed de taxas BACEN
│
├── 📁 supabase/                      # Configuração Supabase
│   ├── config.toml
│   └── 📁 functions/                 # Edge Functions
│       └── 📁 buscar-taxa-bacen/     # Função de busca de taxas
│
├── 📁 src/                           # Código fonte
│   ├── 📄 App.tsx                    # Componente raiz e rotas
│   ├── 📄 main.tsx                   # Entry point
│   ├── 📄 index.css                  # Estilos globais (72KB)
│   │
│   ├── 📁 components/                # Componentes React
│   │   ├── 📁 auth/                  # Autenticação (5 arquivos)
│   │   │   ├── AuthPage.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── OctoAppsLogo.tsx
│   │   │   └── SignupForm.tsx
│   │   │
│   │   ├── 📁 calculations/          # Módulo de Cálculos (22 arquivos)
│   │   │   ├── CalculationsList.tsx  # Lista de cálculos
│   │   │   ├── CartaoCredito.tsx     # Cálculo de cartão
│   │   │   ├── EmprestimosFinanciamentos.tsx
│   │   │   ├── FinanciamentoImobiliario.tsx
│   │   │   ├── AnalisePrevia.tsx     # Análise rápida
│   │   │   ├── RelatorioCompleto.tsx # Relatório detalhado
│   │   │   ├── UploadContratos.tsx   # Upload de docs
│   │   │   ├── 📁 wizard/            # Wizard de cálculo (5 arquivos)
│   │   │   ├── 📁 results/           # Dashboard de resultados (5 arquivos)
│   │   │   └── 📁 reconciliation/    # Conciliação (2 arquivos)
│   │   │
│   │   ├── 📁 contacts/              # Gestão de Contatos (2 arquivos)
│   │   │   ├── ContactsList.tsx
│   │   │   └── ContactDetails.tsx
│   │   │
│   │   ├── 📁 crm/                   # CRM Kanban (2 arquivos)
│   │   │   ├── CRMKanban.tsx
│   │   │   └── OpportunityDetails.tsx
│   │   │
│   │   ├── 📁 dashboard/             # Dashboard principal
│   │   │   └── Dashboard.tsx
│   │   │
│   │   ├── 📁 layout/                # Layout (2 arquivos)
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   │
│   │   ├── 📁 peticoes/              # Gerador de Petições (2 arquivos)
│   │   │   ├── PeticoesList.tsx
│   │   │   └── PeticoesEditor.tsx
│   │   │
│   │   ├── 📁 settings/              # Configurações (2 arquivos)
│   │   │   ├── GeneralSettings.tsx
│   │   │   └── FunnelSettings.tsx
│   │   │
│   │   ├── 📁 users/                 # Gestão de Usuários (2 arquivos)
│   │   │   ├── UserManagement.tsx
│   │   │   └── PermissionsManagement.tsx
│   │   │
│   │   └── 📁 ui/                    # Componentes UI (51 arquivos)
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── chart.tsx
│   │       ├── currency-input.tsx    # Input monetário customizado
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── percent-input.tsx     # Input percentual customizado
│   │       ├── select.tsx
│   │       ├── sidebar.tsx
│   │       ├── stepper.tsx           # Stepper para wizards
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── ... (+ 35 componentes)
│   │
│   ├── 📁 hooks/                     # Custom Hooks (6 arquivos)
│   │   ├── useAuth.ts                # Autenticação Supabase
│   │   ├── useCalculation.ts         # Estado de cálculos
│   │   ├── useCalculationWizard.ts   # Estado do wizard
│   │   ├── useEtapasFunil.ts         # Etapas CRM
│   │   ├── usePermissions.ts         # Sistema de permissões
│   │   └── useTasks.ts               # Gestão de tarefas
│   │
│   ├── 📁 services/                  # Camada de Serviços (15+ arquivos)
│   │   ├── calculationAPI.service.ts # API de cálculos
│   │   ├── calculationEngine.ts      # Motor de cálculo genérico
│   │   ├── calculationEngine.cartao.ts    # Motor: Cartão de crédito
│   │   ├── calculationEngine.emprestimo.ts # Motor: Empréstimos
│   │   ├── 📁 calculationEngine/     # Engines modulares (8 arquivos)
│   │   ├── cartoes.service.ts        # CRUD cartões
│   │   ├── emprestimos.service.ts    # CRUD empréstimos
│   │   ├── financiamentos.service.ts # CRUD financiamentos
│   │   ├── documentExtractor.service.ts  # Extração de dados
│   │   ├── export.service.ts         # Exportação genérica
│   │   ├── laudoExport.service.ts    # Exportação de laudos
│   │   ├── peticoes.service.ts       # Serviço de petições
│   │   ├── permissions.service.ts    # Serviço de permissões
│   │   ├── taxasMercadoBacen.ts      # Taxas BACEN de referência
│   │   ├── users.service.ts          # Serviço de usuários
│   │   └── 📁 __tests__/             # Testes de serviços (5 arquivos)
│   │
│   ├── 📁 types/                     # Definições TypeScript (8 arquivos)
│   │   ├── calculation.types.ts      # Tipos de cálculo (31KB)
│   │   ├── contact.ts
│   │   ├── funnel.ts
│   │   ├── opportunity.ts
│   │   ├── permissions.ts
│   │   ├── peticoes.types.ts
│   │   ├── relatorio.types.ts
│   │   └── task.ts
│   │
│   ├── 📁 lib/                       # Bibliotecas e Utilitários
│   │   ├── supabase.ts               # Cliente Supabase
│   │   ├── database.types.ts         # Tipos do DB (28KB)
│   │   └── calculationAdapters.ts    # Adaptadores de dados
│   │
│   ├── 📁 utils/                     # Funções Utilitárias (4 arquivos)
│   │   ├── formatCurrency.ts         # Formatação monetária
│   │   ├── formatCurrency.test.ts
│   │   ├── parseNumber.ts            # Parse de números
│   │   └── parseNumber.test.ts
│   │
│   ├── 📁 constants/                 # Constantes
│   │   └── (1 arquivo)
│   │
│   ├── 📁 imports/                   # Módulos de importação (7 arquivos)
│   │
│   └── 📁 schemas/                   # Schemas Zod (1 arquivo)
│
├── 📁 coverage/                      # Cobertura de testes
├── 📁 build/                         # Build de produção
│
├── 📄 package.json                   # Dependências (84 linhas)
├── 📄 vite.config.ts                 # Configuração Vite
├── 📄 tsconfig.json                  # Configuração TypeScript
├── 📄 vitest.config.ts               # Configuração Vitest
├── 📄 vercel.json                    # Deploy Vercel
└── 📄 index.html                     # Entry HTML
```

---

## 🧩 Módulos do Sistema

### 1. **Autenticação** (`/auth`)
- Login/Signup com Supabase Auth
- Gerenciamento de sessão
- Recuperação de senha

### 2. **Dashboard** (`/dashboard`)
- Visão geral de métricas
- Widgets de resumo
- Gráficos com Recharts

### 3. **Cálculos Revisionais** (`/calculations`)
O módulo mais robusto do sistema, oferecendo:

| Tipo de Cálculo | Arquivo | Descrição |
|-----------------|---------|-----------|
| Cartão de Crédito | `CartaoCredito.tsx` | Revisão de faturas e IOF |
| Empréstimos | `EmprestimosFinanciamentos.tsx` | Pessoal, consignado, veículos |
| Financiamento Imobiliário | `FinanciamentoImobiliario.tsx` | SAC, PRICE, amortização |

#### Fluxo de Cálculo (Wizard)
```
Upload Contrato → Extração de Dados → Configuração → Processamento → Resultados → Laudo
```

### 4. **CRM Kanban** (`/crm`)
- Gestão visual de oportunidades
- Drag & drop de cards
- Etapas personalizáveis

### 5. **Gestão de Contatos** (`/contacts`)
- Cadastro de clientes e leads
- Histórico de interações
- Vinculação com cálculos

### 6. **Petições** (`/peticoes`)
- Editor de documentos
- Templates jurídicos
- Exportação DOCX

### 7. **Configurações** (`/settings`)
- Configurações gerais
- Personalização do funil CRM
- Gestão de usuários e permissões

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase (para backend)

### Instalação

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd OctoApp

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# Criar arquivo .env.local com:
# VITE_SUPABASE_URL=sua_url_supabase
# VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

---

## 📜 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento (Vite)
npm run build        # Gera build de produção em /build
npm run test         # Executa testes com Vitest
npm run test:ui      # Testes com interface visual
npm run test:coverage # Relatório de cobertura de testes
```

---

## 🗄 Banco de Dados

O sistema utiliza **Supabase** (PostgreSQL) com as seguintes tabelas principais:

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuários |
| `contatos` | Cadastro de contatos/clientes |
| `oportunidades` | Oportunidades do CRM |
| `etapas_funil` | Etapas do funil de vendas |
| `calculos` | Registros de cálculos |
| `emprestimos` | Dados de empréstimos |
| `cartoes` | Dados de cartões de crédito |
| `financiamentos` | Dados de financiamentos |
| `peticoes` | Documentos jurídicos |
| `taxas_bacen` | Cache de taxas do Banco Central |

> Documentação completa do schema em [`docs/DATABASE_SCHEMA.MD`](./docs/DATABASE_SCHEMA.MD)

---

## 📚 Documentação

### Documentação Principal

| Documento | Descrição |
|-----------|-----------|
| [PRD.md](./docs/PRD.md) | Product Requirements Document - Visão de produto |
| [REQUISITOS.md](./docs/REQUISITOS.md) | Requisitos funcionais e regras de negócio |
| [TECH_STACK.md](./docs/TECH_STACK.md) | Stack tecnológica e dependências |
| [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) | Estrutura de pastas e organização |
| [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | Schema completo do banco de dados (auto-gerado) |

### Módulo de Cálculos Revisionais

| Documento | Descrição |
|-----------|-----------|
| [MODULOS.md](./docs/calculo-revisional/MODULOS.md) | Visão geral dos 3 módulos (Geral, Imobiliário, Cartão) |
| [MODULO_CALCULO_REVISIONAL.md](./docs/calculo-revisional/MODULO_CALCULO_REVISIONAL.md) | Especificação detalhada do motor de cálculo |
| [especificacao_tecnica.md](./docs/calculo-revisional/especificacao_tecnica.md) | Fórmulas financeiras, SAC/PRICE, capitalização |
| [ux.md](./docs/calculo-revisional/ux.md) | Especificações de UX/UI do wizard |
| [apendices.md](./docs/calculo-revisional/apendices.md) | Apêndices técnicos e referências |

### OCR e Migrações

| Documento | Descrição |
|-----------|-----------|
| [OCR.md](./docs/OCR.md) | Documentação do sistema de OCR (Gemini/Mistral/N8N) |
| [OCR_MIGRATION.md](./docs/OCR_MIGRATION.md) | Guia de migração do sistema OCR |
| [MIGRATION_CONTRATOS_REVISIONAIS.md](./docs/MIGRATION_CONTRATOS_REVISIONAIS.md) | Migração para nova arquitetura de contratos |

---

## 🔗 Links Úteis

- **Design (Figma):** https://www.figma.com/design/ruHUbwHKCgRu2Mh4ln0g1w/Octoapps
- **Supabase Dashboard:** https://supabase.com/dashboard
- **API BACEN (Taxas):** https://www3.bcb.gov.br/sgspub/

---

## 📊 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| **Componentes UI** | 51 |
| **Services** | 15+ |
| **Custom Hooks** | 6 |
| **Tipos TypeScript** | 8 arquivos |
| **Total de Arquivos** | ~160 no `/src` |
| **Tamanho index.css** | 72KB |
| **Dependências** | 55 pacotes |

---

## 📝 Licença

Projeto privado - Todos os direitos reservados.

---

Desenvolvido por: Pedro Cruvinel pedrocruvi@gmail.com
*Última atualização: Dezembro 2025*