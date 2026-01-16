# Database Schema

> **Auto-generated:** 2025-12-20T09:43:48-03:00  
> **Project:** OctoApp (uyeubtqxwrhpuafcpgtg) | **Region:** sa-east-1  
> **PostgreSQL:** 17.6.1 (GA)

---

## Extensions

| Name | Version | Schema | Description |
| :--- | :--- | :--- | :--- |
| `plpgsql` | 1.0 | pg_catalog | PL/pgSQL procedural language |
| `pg_stat_statements` | 1.11 | extensions | Track planning and execution statistics of SQL statements |
| `uuid-ossp` | 1.1 | extensions | Generate universally unique identifiers (UUIDs) |
| `pgcrypto` | 1.3 | extensions | Cryptographic functions |
| `supabase_vault` | 0.3.1 | vault | Supabase Vault Extension |
| `pg_graphql` | 1.5.11 | graphql | GraphQL support |
| `pg_cron` | 1.6.4 | pg_catalog | Job scheduler for PostgreSQL |
| `pgjwt` | 0.2.0 | extensions | JSON Web Token API |

---

## Enums

### `amortization_system`
| Value |
| :--- |
| `SAC` |
| `PRICE` |
| `SACRE` |
| `GAUSS_SIMPLES` |

### `calculation_status_enum`
| Value |
| :--- |
| `DRAFT` |
| `PRELIMINARY` |
| `COMPLETE` |
| `ARCHIVED` |

### `calculation_type_enum`
| Value |
| :--- |
| `REAL_ESTATE_SFH` |
| `PERSONAL_LOAN` |
| `VEHICLE_LOAN` |
| `CAPITAL_GIRO` |
| `CREDIT_CARD_RMC` |

### `capitalization_type`
| Value |
| :--- |
| `MONTHLY` |
| `DAILY` |

### `classificacao_viabilidade`
| Value |
| :--- |
| `VIAVEL` |
| `ATENCAO` |
| `INVIAVEL` |

### `fine_base_type`
| Value |
| :--- |
| `PRINCIPAL` |
| `TOTAL_INSTALLMENT` |

### `fluxo_tipo`
| Value |
| :--- |
| `original` |
| `revisado` |

### `modulo_calculo`
| Value |
| :--- |
| `GERAL` |
| `IMOBILIARIO` |
| `CARTAO` |

### `ocr_category`
| Value |
| :--- |
| `EMPRESTIMOS_VEICULOS` |
| `IMOBILIARIO` |
| `CARTAO_CREDITO` |

### `ocr_provider`
| Value |
| :--- |
| `GEMINI` |
| `MISTRAL` |
| `N8N` |

### `ocr_status`
| Value |
| :--- |
| `SUCCESS` |
| `PARTIAL` |
| `FAILED` |
| `TIMEOUT` |

### `status_contrato`
| Value |
| :--- |
| `RASCUNHO` |
| `ANALISE_PREVIA` |
| `ANALISE_DETALHADA` |
| `ARQUIVADO` |

---

## Functions

| Name | Return Type | Description |
| :--- | :--- | :--- |
| `atualizar_data_atualizacao` | `trigger` | Trigger: updates `data_atualizacao` on row update |
| `atualizar_etapa_funil_timestamp` | `trigger` | Trigger: updates timestamp on funnel stage changes |
| `auto_concluir_tarefa` | `trigger` | Trigger: auto-completes related tasks |
| `buscar_taxa_bacen` | `record` | Fetches BACEN rate by date range and type |
| `create_user_with_role` | `uuid` | Creates a user with a specific role |
| `criar_financiamento_e_analise` | `json` | Creates financing record and preliminary analysis |
| `delete_user_by_id` | `void` | Deletes a user by ID |
| `fn_analise_viabilidade` | `uuid` | Generates viability analysis |
| `fn_calcular_diferencas` | `numeric` | Calculates differences between original and revised flows |
| `fn_gerar_fluxo_pago` | `void` | Generates paid flow records |
| `fn_pmt` | `numeric` | PMT (Payment) calculation |
| `fn_prestacao_price` | `numeric` | Calculates PRICE system installment |
| `gerar_analise_completa` | `uuid` | Generates complete analysis with all calculations |
| `gerar_relatorio_completo` | `uuid` | Generates complete PDF report |
| `gerar_tabelas_amortizacao` | `json` | Generates amortization tables (SAC/PRICE) |
| `get_user_effective_permissions` | `record` | Gets effective permissions for a user |
| `is_admin` | `boolean` | Checks if user is admin |
| `notificar_atribuicao_tarefa` | `trigger` | Trigger: notifies on task assignment |
| `notificar_audiencias_proximas` | `void` | Notifies about upcoming hearings |
| `notificar_prazos_proximos` | `void` | Notifies about upcoming deadlines |
| `registrar_log_atividade` | `trigger` | Trigger: logs activity |
| `reordenar_etapas_funil` | `void` | Reorders funnel stages |
| `save_user_permissions_batch` | `void` | Saves user permissions in batch |
| `sincronizar_etapa_oportunidade` | `trigger` | Trigger: syncs opportunity stage |
| `sync_oportunidade_estagio` | `trigger` | Trigger: syncs opportunity stage |
| `update_cartoes_timestamp` | `trigger` | Trigger: updates cards timestamp |
| `update_contratos_revisionais_timestamp` | `trigger` | Trigger: updates review contracts timestamp |
| `update_emprestimos_timestamp` | `trigger` | Trigger: updates loans timestamp |
| `update_financiamentos_timestamp` | `trigger` | Trigger: updates financing timestamp |
| `update_updated_at_column` | `trigger` | Generic trigger: updates `updated_at` |
| `update_user_email` | `void` | Updates user email in auth and profiles |
| `update_user_permissions_updated_at` | `trigger` | Trigger: updates user permissions timestamp |

---

## Tables

### `profiles`
> Perfis de usuários do sistema - vinculados ao auth.users do Supabase

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | — |
| `email` | `text` | NO | — |
| `nome_completo` | `text` | NO | — |
| `cpf` | `varchar` | YES | — |
| `telefone` | `varchar` | YES | — |
| `cargo` | `text` | YES | — |
| `persona` | `text` | YES | — |
| `avatar_url` | `text` | YES | — |
| `ativo` | `boolean` | YES | `true` |
| `data_criacao` | `timestamptz` | YES | `now()` |
| `data_atualizacao` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `contratos_revisionais`
> Contratos sob revisão - armazena dados do wizard e status da análise

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `contato_id` | `uuid` | YES | — |
| `oportunidade_id` | `uuid` | YES | — |
| `lead_id` | `uuid` | YES | — |
| `modulo` | `modulo_calculo` | NO | — |
| `status` | `status_contrato` | YES | `RASCUNHO` |
| `dados_step1` | `jsonb` | YES | — |
| `dados_step2` | `jsonb` | YES | — |
| `dados_step3` | `jsonb` | YES | — |
| `nome_referencia` | `text` | YES | — |
| `origem` | `text` | YES | `TRIAGEM` |
| `lead_nome` | `text` | YES | — |
| `valor_contrato` | `numeric` | YES | — |
| `data_contrato` | `date` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled  
**Foreign Keys:**
- `contratos_revisionais_user_id_fkey` → `auth.users.id`
- `contratos_revisionais_contato_id_fkey` → `contatos.id`
- `contratos_revisionais_oportunidade_id_fkey` → `oportunidades.id`

---

### `user_document_settings`
> Configurações White Label: Logo, Cores, Marca d'água

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `logo_url` | `text` | YES | — |
| `primary_color` | `text` | YES | — |
| `secondary_color` | `text` | YES | — |
| `watermark_text` | `text` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`
**RLS:** Enabled
**Foreign Keys:**
- `user_document_settings_user_id_fkey` → `auth.users.id`

---

### `resultado_analise_previa`
> Resultados da análise prévia para cada contrato

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `contrato_id` | `uuid` | NO | — |
| `taxa_contrato` | `numeric` | YES | — |
| `taxa_media_bacen` | `numeric` | YES | — |
| `sobretaxa_percentual` | `numeric` | YES | — |
| `economia_estimada` | `numeric` | YES | — |
| `nova_parcela_estimada` | `numeric` | YES | — |
| `classificacao` | `classificacao_viabilidade` | YES | — |
| `detalhes_calculo` | `jsonb` | YES | — |
| `is_current` | `boolean` | YES | `true` |
| `versao` | `integer` | YES | `1` |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled  
**Foreign Keys:**
- `resultado_analise_previa_contrato_id_fkey` → `contratos_revisionais.id`

---

### `taxas_bacen`
> Taxas de juros históricas do Banco Central (API SGS)

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `modalidade` | `text` | NO | — |
| `data` | `date` | NO | — |
| `taxa_mensal` | `numeric` | YES | — |
| `taxa_anual` | `numeric` | YES | — |
| `codigo_sgs` | `integer` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**Unique:** `(modalidade, data)`  
**RLS:** Enabled

---

### `ocr_logs`
> Logs de processamento OCR de documentos

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `category` | `ocr_category` | NO | — |
| `provider` | `ocr_provider` | NO | — |
| `status` | `ocr_status` | NO | — |
| `file_name` | `text` | YES | — |
| `file_size_bytes` | `integer` | YES | — |
| `processing_time_ms` | `integer` | YES | — |
| `extracted_fields` | `jsonb` | YES | — |
| `error_message` | `text` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `analises_previas`
> Análises prévias de viabilidade (legacy)

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | — |
| `financiamento_id` | `uuid` | YES | — |
| `taxa_contrato` | `numeric` | YES | — |
| `taxa_media` | `numeric` | YES | — |
| `sobretaxa` | `numeric` | YES | — |
| `valor_total_pago` | `numeric` | YES | — |
| `valor_total_devido` | `numeric` | YES | — |
| `diferenca_total` | `numeric` | YES | — |
| `pontos_viabilidade` | `jsonb` | YES | — |
| `viavel` | `boolean` | YES | — |
| `created_at` | `timestamp` | YES | — |
| `valor_total_devido_simples` | `numeric` | YES | — |
| `diferenca_total_simples` | `numeric` | YES | — |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `viabilidade_parcelas`
> Parcelas detalhadas para análise de viabilidade

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | — |
| `analise_id` | `uuid` | NO | — |
| `parcela` | `integer` | NO | — |
| `pmt_banco` | `numeric` | NO | — |
| `juros_banco` | `numeric` | NO | — |
| `saldo_banco` | `numeric` | NO | — |
| `pmt_media` | `numeric` | NO | — |
| `juros_media` | `numeric` | NO | — |
| `saldo_media` | `numeric` | NO | — |
| `diferenca_acum_media` | `numeric` | NO | — |
| `pmt_simples` | `numeric` | NO | — |
| `juros_simples` | `numeric` | NO | — |
| `diferenca_acum_simples` | `numeric` | NO | — |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `fluxo_caixa`
> Fluxos de caixa originais e revisados

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `financiamento_id` | `uuid` | NO | — |
| `tipo` | `fluxo_tipo` | NO | — |
| `parcela` | `integer` | NO | — |
| `data_vencimento` | `date` | YES | — |
| `saldo_devedor` | `numeric` | YES | — |
| `amortizacao` | `numeric` | YES | — |
| `juros` | `numeric` | YES | — |
| `prestacao` | `numeric` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `financiamentos`
> Financiamentos imobiliários (legacy)

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `nome_contrato` | `text` | YES | — |
| `banco` | `text` | YES | — |
| `valor_financiado` | `numeric` | YES | — |
| `prazo_meses` | `integer` | YES | — |
| `data_contrato` | `date` | YES | — |
| `taxa_contrato_mensal` | `numeric` | YES | — |
| `sistema_amortizacao` | `amortization_system` | YES | — |
| `status` | `calculation_status_enum` | YES | `DRAFT` |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `casos`
> Casos jurídicos principais

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `titulo` | `text` | NO | — |
| `numero_processo` | `text` | YES | — |
| `cliente_id` | `uuid` | YES | — |
| `responsavel_id` | `uuid` | YES | — |
| `status` | `text` | YES | `ativo` |
| `tipo` | `text` | YES | — |
| `observacoes` | `text` | YES | — |
| `valor_causa` | `numeric` | YES | — |
| `data_abertura` | `date` | YES | `now()` |
| `data_fechamento` | `date` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `contatos`
> Contatos (clientes/leads) do CRM - Pessoa Física ou Jurídica

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `nome_completo` | `text` | NO | — |
| `email` | `text` | YES | — |
| `telefone_principal` | `text` | YES | — |
| `cpf_cnpj` | `text` | YES | — |
| `tipo` | `text` | YES | `Pessoa Física` |
| `categoria_contato` | `text` | YES | `LEAD` |
| `endereco` | `jsonb` | YES | — |
| `observacoes` | `text` | YES | — |
| `responsavel_id` | `uuid` | YES | — |
| `ativo` | `boolean` | YES | `true` |
| `data_criacao` | `timestamptz` | YES | `now()` |
| `data_atualizacao` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled  
**CHECK Constraints:**
- `categoria_contato IN ('LEAD', 'CLIENTE', 'EX_CLIENTE')`

---

### `tarefas`
> Tarefas do sistema

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `titulo` | `text` | NO | — |
| `descricao` | `text` | YES | — |
| `caso_id` | `uuid` | YES | — |
| `responsavel_id` | `uuid` | YES | — |
| `criado_por` | `uuid` | YES | — |
| `status` | `text` | YES | `pendente` |
| `prioridade` | `text` | YES | `media` |
| `data_prazo` | `date` | YES | — |
| `data_conclusao` | `date` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `arquivos`
> Arquivos anexados a casos/tarefas

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `nome` | `text` | NO | — |
| `url` | `text` | NO | — |
| `tipo` | `text` | YES | — |
| `tamanho` | `integer` | YES | — |
| `caso_id` | `uuid` | YES | — |
| `tarefa_id` | `uuid` | YES | — |
| `enviado_por` | `uuid` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `user_roles`
> Papéis de usuários (admin, perito, advogado)

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `role` | `text` | NO | — |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**Unique:** `(user_id, role)`  
**RLS:** Enabled

---

### `user_permissions`
> Permissões granulares por usuário

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `permission` | `text` | NO | — |
| `granted` | `boolean` | YES | `true` |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**Unique:** `(user_id, permission)`  
**RLS:** Enabled

---

### `oportunidades`
> Oportunidades do CRM (funil de vendas)

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `titulo` | `text` | NO | — |
| `contato_id` | `uuid` | YES | — |
| `responsavel_id` | `uuid` | YES | — |
| `estagio` | `text` | YES | — |
| `etapa_funil_id` | `uuid` | YES | — |
| `valor_estimado` | `numeric` | YES | — |
| `valor_causa` | `numeric` | YES | — |
| `valor_proposta` | `numeric` | YES | — |
| `produto_servico_id` | `uuid` | YES | — |
| `probabilidade` | `integer` | YES | `50` |
| `data_previsao` | `date` | YES | — |
| `observacoes` | `text` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled
**Foreign Keys:**
- `oportunidades_produto_servico_id_fkey` → `products_services.id`

---

### `products_services`
> Catálogo de produtos e serviços

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `name` | `text` | NO | — |
| `description` | `text` | YES | — |
| `default_fee_percentage` | `numeric` | YES | — |
| `active` | `boolean` | YES | `true` |
| `ordem` | `integer` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`
**RLS:** Enabled
**Foreign Keys:**
- `products_services_user_id_fkey` → `auth.users.id`

---

### `etapas_funil`
> Etapas do funil de vendas

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `nome` | `text` | NO | — |
| `ordem` | `integer` | NO | — |
| `cor` | `text` | YES | `#6366f1` |
| `ativo` | `boolean` | YES | `true` |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `honorarios`
> Honorários de casos

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `caso_id` | `uuid` | NO | — |
| `tipo` | `text` | YES | — |
| `valor` | `numeric` | NO | — |
| `data_vencimento` | `date` | YES | — |
| `data_pagamento` | `date` | YES | — |
| `status` | `text` | YES | `pendente` |
| `observacoes` | `text` | YES | — |
| `criado_por` | `uuid` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `audiencias`
> Audiências de casos

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `caso_id` | `uuid` | NO | — |
| `data_audiencia` | `timestamptz` | NO | — |
| `tipo` | `text` | YES | — |
| `local` | `text` | YES | — |
| `observacoes` | `text` | YES | — |
| `status` | `text` | YES | `agendada` |
| `created_at` | `timestamptz` | YES | `now()` |
| `updated_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `historico_mensagens`
> Histórico de chat com IA

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `role` | `text` | NO | — |
| `content` | `text` | NO | — |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `logs_atividades`
> Logs de atividades do sistema

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | YES | — |
| `acao` | `text` | NO | — |
| `tabela` | `text` | YES | — |
| `registro_id` | `uuid` | YES | — |
| `dados_anteriores` | `jsonb` | YES | — |
| `dados_novos` | `jsonb` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

### `notificacoes`
> Notificações de usuários

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | — |
| `titulo` | `text` | NO | — |
| `mensagem` | `text` | YES | — |
| `tipo` | `text` | YES | `info` |
| `lida` | `boolean` | YES | `false` |
| `link` | `text` | YES | — |
| `created_at` | `timestamptz` | YES | `now()` |

**Primary Key:** `id`  
**RLS:** Enabled

---

## Views

### `v_tarefas_completas`
> View consolidada de tarefas com informações adicionais

| Column | Type |
| :--- | :--- |
| `total_anexos` | `bigint` |
| `atrasada` | `boolean` |

---

### `v_contatos_status`
> View que calcula status de atividade automaticamente baseado em data_atualizacao

| Column | Type | Description |
| :--- | :--- | :--- |
| (todas as colunas de contatos) | — | — |
| `status_atividade` | `text` | `ATIVO` (<90d), `INATIVO` (90-180d), `ARQUIVADO` (>180d) |

---

*Document synced from Supabase MCP on 2025-12-23*
