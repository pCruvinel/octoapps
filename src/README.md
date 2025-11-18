# Octoapps - Plataforma de Gestão Jurídica

## 🚀 Tecnologias

- **Next.js 15** - Framework React com App Router
- **React 18** - Biblioteca para interfaces
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4.0** - Estilização
- **Shadcn/ui** - Componentes UI
- **Supabase** - Backend e banco de dados

## 📦 Instalação

```bash
npm install
```

## 🏃‍♂️ Executar em Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📁 Estrutura do Projeto

```
/app                      # App Router do Next.js
  /layout.tsx            # Layout raiz
  /page.tsx              # Página inicial (Dashboard)
  /providers.tsx         # Contextos globais (tema, usuário)
  /(dashboard)           # Grupo de rotas protegidas
    /layout.tsx          # Layout com Sidebar/Topbar
    /contacts            # Módulo de contatos
    /crm                 # Pipeline Kanban
    /calculations        # Cálculos revisionais
    /peticoes            # Geração de petições
    /users               # Gestão de usuários
    /permissions         # Gerenciamento de permissões
    /settings-general    # Configurações gerais
    /settings-funnel     # Configurações do funil

/components              # Componentes React
  /calculations         # Componentes de cálculos
  /contacts            # Componentes de contatos
  /crm                 # Componentes do Pipeline
  /dashboard           # Dashboard principal
  /layout              # Sidebar e Topbar
  /peticoes            # Geração de petições
  /settings            # Configurações
  /ui                  # Componentes Shadcn/ui
  /users               # Gestão de usuários

/styles                 # Estilos globais
  /globals.css         # CSS global com Tailwind

/public                # Arquivos estáticos
```

## 🎨 Design System

### Cores
- **Primária**: `#3D96FF` (Azul)
- **Sidebar**: `#DDDDDD` (Cinza claro)
- **Background**: Branco / Cinza escuro (tema escuro)

### Scrollbar
- **Tema Claro**: Cinza `#c0c0c0` sobre `#f5f5f5`
- **Tema Escuro**: Cinza `#4a4a4a` sobre `#1a1a1a`

## 👥 Personas de Usuário

1. **Ana Admin** (Administrador)
   - Acesso completo ao sistema
   - Gerencia usuários e permissões
   - Configura funil e sistema

2. **Diego Perito** (Colaborador)
   - Acesso a cálculos e análises
   - Visualiza contatos e pipeline
   - Sem acesso administrativo

3. **Maria Advogada** (Colaborador)
   - Foco em petições e casos jurídicos
   - Gerencia contatos e oportunidades
   - Sem acesso administrativo

## 📱 Módulos Principais

### 1. Dashboard
- Visão geral com métricas
- Gráficos e estatísticas
- Atividades recentes

### 2. Pipeline (CRM)
- Kanban de oportunidades
- Gestão do funil de vendas
- Histórico de interações

### 3. Contatos
- Cadastro de clientes e leads
- Histórico de interações
- Vínculos com oportunidades

### 4. Cálculo Revisional
- Financiamento Imobiliário
- Cartão de Crédito
- Empréstimos
- Upload de contratos com OCR

### 5. Geração de Petições
- Templates personalizáveis
- Editor de texto rico
- Exportação em DOCX/PDF

### 6. Gestão de Usuários
- Cadastro e edição
- Controle de permissões
- Auditoria de ações

### 7. Configurações
- Opções gerais do sistema
- Personalização do funil
- Campos customizáveis

## 🌐 Rotas Principais

- `/` - Dashboard
- `/crm` - Pipeline Kanban
- `/contacts` - Lista de contatos
- `/contact-details/[id]` - Detalhes do contato
- `/calculations` - Lista de cálculos
- `/calc-financiamento` - Calculadora de financiamento
- `/calc-cartao` - Calculadora de cartão de crédito
- `/calc-emprestimos` - Calculadora de empréstimos
- `/upload-contratos` - Upload de contratos
- `/peticoes` - Geração de petições
- `/users` - Gestão de usuários (Admin)
- `/permissions` - Gerenciamento de permissões (Admin)
- `/settings-general` - Configurações gerais (Admin)
- `/settings-funnel` - Configurações do funil (Admin)

## 🎯 Padrões Brasileiros

- **Data**: `dd/MM/yyyy`
- **Moeda**: `R$` (Real brasileiro)
- **CPF**: `000.000.000-00`
- **CNPJ**: `00.000.000/0000-00`
- **CEP**: `00000-000`
- **Telefone**: `(00) 00000-0000`

## 🔐 Supabase Integration

Ver `GUIA-IMPLEMENTACAO-SUPABASE.md` para instruções detalhadas de configuração do banco de dados.

## 📝 Build para Produção

```bash
npm run build
npm start
```

## 🎨 Tema Claro/Escuro

O sistema possui suporte completo a tema claro e escuro, controlado pelo toggle no Topbar (ícone Sol/Lua).

## 📄 Licença

Todos os direitos reservados - Octoapps © 2025
