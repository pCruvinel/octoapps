# 🚀 Plano de Evolução CRM V2 e White Label

> **Data:** 2026-01-16 (Atualizado)  
> **Autor:** Product Owner Técnico / Engenheiro Full-Stack  
> **Status:** ✅ Sprint 1-3 Concluído | ⏳ Sprint 4 Pendente

---

## 📋 Sumário Executivo

Este documento apresenta o roadmap técnico para:
1. **Evoluir o CRM** de um pipeline simples para um sistema de gestão comercial com KPIs financeiros
2. **Implementar White Label** com branding dinâmico em PDFs e interface

---

## ✅ Status de Implementação (2026-01-16)

| Feature | Status | Notas |
|---------|--------|-------|
| Tabela `products_services` | ✅ | Criada com RLS |
| Colunas `valor_causa`, `valor_proposta` | ✅ | Migradas |
| Hook `useProducts` | ✅ | CRUD completo |
| Filtros Kanban (multi-select) | ✅ | Data + Produto + Responsável |
| Catálogo de Serviços UI | ✅ | `/crm/services` |
| Card com valores separados | ✅ | Proposta + Causa |
| Header com somatório | ⏳ | Planejado |
| Pipeline DataTable | ✅ | Com linha de totais |
| CurrencyInput limpa zero | ✅ | Facilita digitação |
| White Label PDF | ⏳ | Pendente Sprint 4 |

---

## 🔍 Discovery: Análise de Gaps

> [!NOTE]
> **Verificação realizada via MCP Supabase em 2026-01-15**  
> Projeto: `uyeubtqxwrhpuafcpgtg` | Database: PostgreSQL 17.6.1

### A. CRM & Vendas

| Requisito | Estado Atual (Verificado) | Gap Identificado |
|-----------|---------------------------|------------------|
| **KPIs Financeiros** | ✅ `valor_proposta` + `valor_causa` | ✅ Implementado |
| **Header com Somatório** | ⏳ Apenas count | Próxima sprint |
| **Produtos Comerciais** | ✅ Tabela `products_services` | ✅ Implementado |
| **Filtros Compostos** | ✅ Multi-select | ✅ Implementado |
| **Minhas Tarefas** | `tarefas.responsavel_id` (NOT NULL) ✅ | ⚠️ Hook pendente |

### B. Infraestrutura White Label

| Requisito | Estado Atual (Verificado) | Gap Identificado |
|-----------|---------------------------|------------------|
| **Logo** | `user_document_settings.logo_url` ✅ | ✅ Já existe! |
| **Cores** | `primary_color`, `secondary_color`, etc. ✅ | ✅ Já existe! |
| **Dados Empresa** | **Não existe** colunas cnpj/address | ❌ Pendente Sprint 4 |
| **Multi-Tenancy** | **Não existe** tabela de organização | ⚠️ Sistema é single-tenant |

---

## 📊 Arquivos Analisados (Atualizados)

### Código-Fonte Implementado

- [CRMKanban.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/crm/CRMKanban.tsx) - Componente principal (~740 linhas) com toggle Kanban/DataTable
- [OpportunitiesDataTable.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/crm/OpportunitiesDataTable.tsx) - **NEW** Tabela com totais
- [KanbanFilters.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/crm/KanbanFilters.tsx) - **UPDATED** Multi-select
- [OpportunityCard.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/crm/OpportunityCard.tsx) - Exibe `valor_proposta` + `valor_causa`
- [OpportunityDetails.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/crm/OpportunityDetails.tsx) - Formulário com `produto_servico_id`
- [NewLeadDialog.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/crm/NewLeadDialog.tsx) - Formulário com produtos
- [services.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/routes/_authenticated/crm/services.tsx) - **NEW** Catálogo de Serviços
- [useProducts.ts](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/hooks/useProducts.ts) - **NEW** CRUD completo
- [currency-input.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/ui/currency-input.tsx) - **UPDATED** Limpa zero no focus

### Tipagem
- [opportunity.ts](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/types/opportunity.ts) - `valor_proposta`, `valor_causa`, `produto_servico_id`

### Documentação
- [README.md](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/docs/crm/README.md) - v2.1 atualizado
- [COMPONENTES.md](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/docs/crm/COMPONENTES.md) - Novos componentes documentados

---

## 🗂️ Plano de Execução Técnica

### 1. Banco de Dados (Supabase/SQL)

> [!IMPORTANT]
> **Status:** ✅ Migrations Aplicadas

#### 1.1 Tabela: Catálogo de Produtos/Serviços ✅

```sql
-- Migration: 20260115_create_products_services (APPLIED)
CREATE TABLE public.products_services (...);
```

#### 1.2 Colunas de Valor na Oportunidades ✅

```sql
-- Migration: 20260115_add_value_columns_opportunities (APPLIED)
ALTER TABLE public.oportunidades
    ADD COLUMN valor_causa NUMERIC(15,2),
    ADD COLUMN valor_proposta NUMERIC(15,2),
    ADD COLUMN produto_servico_id UUID REFERENCES public.products_services(id);
```

#### 1.3 Branding (Pendente Sprint 4)

```sql
-- Migration: 20260115_add_company_branding_settings (PENDING)
ALTER TABLE public.user_document_settings
    ADD COLUMN company_name TEXT,
    ADD COLUMN cnpj TEXT,
    ...
```

---

### 2. Backend & Hooks

#### 2.1 Hook `useProducts` ✅

**Arquivo:** `src/hooks/useProducts.ts`

- [x] Criar hook com state management
- [x] Implementar CRUD (create, update, soft-delete)
- [x] Filtrar por `user_id` do usuário logado
- [x] Exportar `activeProducts` para filtros

#### 2.2 Atualizar useOpportunities ⏳

**Pendente para Sprint 4**

#### 2.3 Atualizar useTasks ⏳

**Pendente para Sprint 4**

---

### 3. Frontend - CRM

#### 3.1 Refatoração do Card ✅

**Arquivo:** [OpportunityCard.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/crm/OpportunityCard.tsx)

- [x] Exibir "Valor Proposta" como destaque principal
- [x] Exibir "Valor Dívida" como secundário
- [x] Atualizar `formatCurrency()` para suportar ambos valores

#### 3.2 Header da Coluna com Somatório ⏳

**Pendente para próxima sprint**

#### 3.3 Barra de Filtros Avançados ✅

**Arquivo:** `src/components/crm/KanbanFilters.tsx`

- [x] DateRangePicker para período
- [x] **Multi-select** para Produto (Popover + Checkbox)
- [x] **Multi-select** para Responsável (Popover + Checkbox)
- [x] Botão "Limpar Filtros"

#### 3.4 Dropdown de Produtos Dinâmico ✅

**Arquivo:** [NewLeadDialog.tsx](file:///c:/Users/Usuario/OneDrive/Documentos/Antigravity/Octoapps/OctoApp/src/components/crm/NewLeadDialog.tsx)

- [x] Substituir `TipoOperacaoSelect` por select de `products_services`
- [x] Buscar produtos de `products_services`
- [x] Manter `tipo_operacao` como legado opcional

#### 3.5 Pipeline DataTable ✅ (NEW)

**Arquivo:** `src/components/crm/OpportunitiesDataTable.tsx`

- [x] Toggle Kanban/Tabela no header
- [x] Colunas: Oportunidade, Contato, Etapa, Valores, Responsável, Data
- [x] Linha de totais com contagem e somas
- [x] Mesmos filtros do Kanban

#### 3.6 CurrencyInput Melhoria ✅ (NEW)

**Arquivo:** `src/components/ui/currency-input.tsx`

- [x] Limpar campo quando valor é 0 ao receber foco
- [x] Facilita digitação sem precisar apagar R$ 0,00

---

### 4. Frontend - Settings & Branding

#### 4.1 Tela de Catálogo de Serviços ✅

**Arquivo:** `src/routes/_authenticated/crm/services.tsx`

- [x] Listar produtos com tabela
- [x] Modal de criação/edição
- [x] Toggle de ativo/inativo
- [x] Estados de loading, vazio, erro
- [x] Link no Sidebar CRM

#### 4.2 White Label PDF (Pendente Sprint 4) ⏳

---

## ✅ Verificação

### Testes Manuais Realizados

1. **CRM - Valores Separados:** ✅
   - [x] Criar oportunidade com `valor_causa` e `valor_proposta`
   - [x] Verificar que o Card exibe ambos valores
   - [ ] Verificar Header com somatório (pendente)

2. **CRM - Filtros:** ✅
   - [x] Aplicar filtro de Data
   - [x] Aplicar filtro de Produto (multi-select)
   - [x] Aplicar filtro de Responsável (multi-select)
   - [x] Verificar que Kanban e DataTable atualizam corretamente

3. **CRM - DataTable:** ✅
   - [x] Toggle entre Kanban e Tabela
   - [x] Linha de totais com contagem
   - [x] Ações de Arquivar e Excluir

4. **CurrencyInput:** ✅
   - [x] Campo com R$ 0,00 limpa ao clicar
   - [x] Facilita digitação de valores

5. **White Label:** ⏳
   - [ ] Upload de logo em Settings
   - [ ] PDF com branding personalizado

---

## 📅 Cronograma Atualizado

| Sprint | Entregável | Status |
|--------|------------|--------|
| **Sprint 1** | Migrações de banco + Hook `useProducts` | ✅ Concluído |
| **Sprint 2** | Refatoração Card + Filtros | ✅ Concluído |
| **Sprint 3** | Catálogo de Serviços + DataTable | ✅ Concluído |
| **Sprint 4** | White Label completo (Settings + PDF) | ⏳ Pendente |

---

## 🚨 Riscos e Decisões

> [!WARNING]  
> **Decisões Confirmadas:**
> 1. ✅ **Single-Tenant:** Sistema não tem tabela de organização. Tabelas usam `user_id`.
> 2. ✅ **Migração de dados:** `valor_estimado` sincronizado com `valor_proposta`.
> 3. ✅ **`tipo_acao` legado:** Mantido para compatibilidade. Novo campo `produto_servico_id` é preferido.

> [!CAUTION]
> **Breaking Changes Evitados:**
> - Frontend trata ambos `valor_estimado` (legado) e `valor_proposta` (novo)
> - `valor_estimado` mantido em sync com `valor_proposta` durante transição

---

*Documento atualizado - OctoApps CRM v2.1 Planning*
