# Tech Stack - OctoApp

Este documento descreve as principais tecnologias e ferramentas utilizadas no projeto **OctoApp**. O objetivo é fornecer uma visão clara da arquitetura para novos desenvolvedores.

## 1. Core
- **Linguagem:** TypeScript 5.9.3
- **Framework Principal:** React 18.3.1
- **Ferramenta de Build:** Vite 6.3.5
- **Runtime Target:** ESNext (ES2020+)
- **Router:** TanStack Router v1 (file-based routing)

## 1.1 Router (TanStack Router)
- **File-Based Routing:** Rotas em `src/routes/`
- **Auth Guards:** via `beforeLoad` em `_authenticated.tsx`
- **Typesafe Search Params:** Validação com Zod
- **Loaders:** Prefetch de dados antes de renderizar
- **DevTools:** Disponível no canto inferior direito

## 2. Frontend
- **Estilização:** Tailwind CSS 4.1.18
- **Biblioteca de Componentes UI:** 
  - **Shadcn UI:** Baseado em Radix UI (Accordion, Dialog, Select, etc.).
  - **Lucide React:** Conjunto de ícones.
- **Gerenciamento de Formulários:** React Hook Form com Zod (validação).
- **Tabelas e Dados:** TanStack Table (React Table) v8.
- **Gráficos:** Recharts.
- **Animações e Interação:** 
  - Embla Carousel (Scroll infinito/Carrossel).
  - dnd-kit (Drag and Drop).
  - Vaul (Drawer/Modais).
- **Feedback Visual:** Sonner (Toasts).

## 3. Backend / BaaS (Backend as a Service)
- **Plataforma:** Supabase
  - **Banco de Dados:** PostgreSQL (gerenciado pelo Supabase).
  - **Autenticação:** Supabase Auth (JWT).
  - **Serverless Functions:** Supabase Edge Functions (Deno).
  - **Realtime:** Assinaturas de banco de dados em tempo real.
- **Manipulação de Dados:** 
  - `@supabase/supabase-js` v2.
  - Decimal.js (para cálculos financeiros precisos).

## 4. Infraestrutura / DevOps
- **Hospedagem:** Vercel (Configurado via `vercel.json`).
- **CI/CD:** Integração nativa Vercel + GitHub.
- **Linting & Formatação:** 
  - TypeScript (Strict Mode).
  - Configurações estritas no `tsconfig.json`.
- **Testes:** 
  - **Vitest:** Framework de testes (Unitários e Integração).
  - **Testing Library:** React testing utilities.

## 5. Serviços Externos & Utilitários
- **APIs de Terceiros:**
  - **Banco Central (Bacen):** Consumo de taxas de mercado.
- **Geração de Documentos:**
  - **docx:** Geração de arquivos .docx.
  - **jspdf:** Geração de arquivos .pdf.
  - **file-saver:** Gerenciamento de downloads.

---
*Este documento deve ser atualizado sempre que uma nova dependência core ou serviço externo for adicionado ao projeto.*
