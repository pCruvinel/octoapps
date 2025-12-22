# Documentação Técnica: Integração API BACEN (SGS)

**Versão:** 2.0 (Dezembro 2025)  
**Status:** Produção  
**Responsável:** Equipe de Engenharia OctoApps

---

## 1. Visão Geral

O sistema OctoApps integra-se com o Sistema Gerenciador de Séries Temporais (SGS) do Banco Central do Brasil para obter taxas médias de mercado aplicadas a operações de crédito e índices financeiros (TR, IPCA, etc.).

Esta integração é crítica para os módulos de **Análise Prévia** (Triagem) e **Cálculo Revisional**, servindo como parâmetro de comparação para detectar abusividade nas taxas de juros contratuais.

### Fluxo de Dados

```mermaid
sequenceDiagram
    participant FE as Frontend (React)
    participant EF as Edge Function (Supabase)
    participant DB as Cache (PostgreSQL)
    participant API as API BACEN (SGS)

    FE->>EF: POST /buscar-taxa-bacen { data, codigoSerie }
    EF->>DB: SELECT * FROM taxas_bacen_historico
    alt Cache Hit
        DB-->>EF: Retorna dados cacheados
        EF-->>FE: Retorna JSON (Taxas Mensais/Anuais)
    else Cache Miss
        EF->>API: GET /dados/serie/{codigo}/dados
        API-->>EF: Retorna valor bruto (Anual ou Mensal)
        EF->>EF: Converte para Taxa Mensal/Anual
        EF->>DB: UPSERT (Salva no Cache)
        EF-->>FE: Retorna JSON (Taxas Mensais/Anuais)
    end
```

---

## 2. Componentes do Sistema

### 2.1 Banco de Dados (Cache)

A tabela `public.taxas_bacen_historico` armazena as taxas recuperadas para evitar requisições excessivas ao BACEN e garantir performance.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `serie_bacen` | text | Código da série SGS (ex: '20749') |
| `ano` | int4 | Ano de referência |
| `mes` | int4 | Mês de referência |
| `taxa_mensal_percent` | numeric | Taxa mensal em % (ex: 1.7062) |
| `taxa_mensal_decimal` | numeric | Taxa mensal decimal (ex: 0.017062) |
| `taxa_anual_decimal` | numeric | Taxa anual decimal (ex: 0.2251) |
| `data_atualizacao` | timestamptz | Data da última sincronização |
| `fonte` | text | Origem ('BACEN_SGS_LIVE', 'CACHE_DB') |

> **Nota:** A chave única para UPSERT é composta por `(serie_bacen, ano, mes)`.

### 2.2 Edge Function (`buscar-taxa-bacen`)

Localizada em: `supabase/functions/buscar-taxa-bacen/index.ts`

Esta função é o "cérebro" da integração. Ela resolve um problema crítico: a padronização das taxas. **O BACEN retorna algumas séries em % ao ano e outras em % ao mês.** A função normaliza tudo para entregar ambas as visões ao frontend.

#### Lógica de Conversão (Crítica)

A função mantém uma lista de séries que sabidamente retornam valores anuais.

```typescript
// Lista de séries ANUAIS (Crédito) - v2.0
const seriesAnuais = [
  // Empréstimos PF
  25464, 25463, 25462, 25470, 20742, 25471,
  // Empresarial
  20739, 20722, 20723,
  // Veículos
  20749, 20728,
  // Imobiliário
  20773, 25497, 432,
  // Cartão (Anual)
  25482
];

// Cálculo com Decimal.js (precisão 20 casas)
const decVal = new Decimal(val);
const taxaMensalDec = new Decimal(1)
  .plus(decVal.div(100))
  .pow(new Decimal(1).div(12))
  .minus(1);
```

**Algoritmo:**
1. Busca valor bruto na API.
2. Se `codigoSerie` está na lista `seriesAnuais`:
   * Valor Bruto = Taxa Anual Percentual (ex: 10.24)
   * `Taxa Anual Decimal` = 10.24 / 100 = 0.1024
   * `Taxa Mensal Decimal` = $(1 + 0.1024)^{1/12} - 1$
   * `Taxa Mensal Percent` = Taxa Mensal Decimal * 100
3. Se não está na lista (ex: TR, IPCA):
   * Valor Bruto = Taxa Mensal Percentual
   * `Taxa Mensal Decimal` = Valor Bruto / 100
   * `Taxa Anual Decimal` = $(1 + Taxa Mensal Decimal)^{12} - 1$

---

## 3. Mapeamento de Séries SGS

As seguintes séries são utilizadas pelo sistema:

### Séries Anuais (% a.a.) - Conversão Exponencial

| Módulo | Série SGS | Descrição |
|--------|-----------|-----------|
| **Empréstimos** | `25464` | Crédito Pessoal PF |
| **Empréstimos** | `25463` | Consignado Privado |
| **Empréstimos** | `25462` | Consignado Público |
| **Empréstimos** | `25470` | Consignado INSS |
| **Empréstimos** | `20742` | Crédito Pessoal Não Consignado |
| **Empréstimos** | `25471` | Crédito Pessoal Total |
| **Empresarial** | `20739` | Capital de Giro até 365d |
| **Empresarial** | `20722` | Capital de Giro até 365d (alt) |
| **Empresarial** | `20723` | Capital de Giro > 365d |
| **Veículos** | `20749` | Aquisição de Veículos PF |
| **Veículos** | `20728` | Aquisição de Veículos PJ |
| **Imobiliário** | `20773` | Financiamento SFH |
| **Imobiliário** | `25497` | Financiamento SFI |
| **Imobiliário** | `432` | Mercado não referenciadas |
| **Cartão** | `25482` | Rotativo PF (Anual) |

### Séries Mensais (% a.m.) - Divisão Simples

| Módulo | Série SGS | Descrição |
|--------|-----------|-----------|
| **Índice** | `226` | TR (Taxa Referencial) |
| **Índice** | `433` | IPCA |
| **Índice** | `188` | INPC (Correção de Indébito) |
| **Índice** | `189` | IGP-M |
| **Cartão** | `25455` | Rotativo PF (Mensal) |

---

## 4. Consumo no Frontend

O arquivo centralizador é `src/utils/financialCalculations.ts`.

### Função `fetchMarketRate`

Responsável por chamar a Edge Function. **Importante:** Desde a versão 2.0, esta função **não realiza conversão de taxas**. Ela confia que a Edge Function já retorna o valor mensal correto no campo `taxaMediaMensalPercent`.

```typescript
// Exemplo de uso simplificado
const taxaMensal = await fetchMarketRate('IMOBILIARIO_SFH', '2025-04-01');
// Retorna number: ex 0.8157 (representando 0.8157% a.m.)
```

### Fallback

Se a API falhar ou não houver dados para a data (ex: feriado/futuro), o frontend utiliza taxas estáticas definidas em `getStaticFallbackRate`:
* Veículos: 1.69% a.m.
* Geral: 1.71% a.m.
* Imobiliário: 0.91% a.m.

---

## 5. Troubleshooting e Manutenção

### Problema: Taxas vindo com valor incorreto (ex: 0.08% a.m. em vez de 0.8%)

**Causa Provável:** Cache poluído com dados de uma versão antiga da Edge Function que fazia conversão errada (dividia taxa anual por 100 achando que era mensal).

**Solução:** Limpar o cache para a série afetada. No Dashboard Supabase -> SQL Editor:

```sql
-- Exemplo para limpar série Imobiliária SFH (20773)
DELETE FROM taxas_bacen_historico WHERE serie_bacen = '20773';
```

### Problema: API BACEN fora do ar

O sistema automaticamente usará o fallback estático e registrará um aviso no console (`console.warn`). Nenhuma ação imediata é necessária, o sistema tentará buscar novamente na próxima consulta.

### Como Adicionar Nova Série

1. Identifique o código SGS no site do BACEN.
2. Verifique se o retorno é % a.a. ou % a.m.
3. Se for % a.a., adicione o código ao array `seriesAnuais` em `supabase/functions/buscar-taxa-bacen/index.ts`.
4. Faça deploy da função: `npx supabase functions deploy buscar-taxa-bacen`.
5. Adicione o mapeamento no `financialCalculations.ts` para permitir o uso pelo nome do módulo.

---

## 6. Pontos de Consumo na Aplicação

### 6.1 `src/components/triagem/ModuloGeralForm.tsx` (Veículos e Empréstimos)
*   **Gatilho:** `useEffect` monitorando alterações em `watchDataContrato` ou `watchTipoContrato`.
*   **Parâmetros:**
    *   `dataContrato`: Input do usuário.
    *   `modulo`: Determinado por `getModuloParaBacen()` ('VEICULOS' ou 'GERAL').
*   **Uso do Dado:**
    *   Atualiza estado `taxaMercado` (State React).
    *   Exibe no formulário: "Taxa média na época: X % a.m.".
    *   Utilizado no cálculo de `economiabacen` ao submeter a análise.

### 6.2 `src/components/triagem/ModuloImobiliarioForm.tsx` (Financiamento Imobiliário)
*   **Gatilho:** `useEffect` monitorando `watchDataContrato` ou `watchTipoFinanciamento`.
*   **Parâmetros:**
    *   `dataContrato`: Input do usuário.
    *   `modulo`: 'IMOBILIARIO_SFH' ou 'IMOBILIARIO_SFI' (baseado no select).
*   **Uso do Dado:**
    *   Atualiza estado `taxaMercado`.
    *   Crucial para o **Cenário B (Taxa Média BACEN)** na comparação de viabilidade.
    *   Define se o contrato é considerado abusivo (se `taxaContrato` > `taxaMercado` + tolerância).

---

## 7. Carga Histórica (Bulk Fetch)

### Edge Function: `seed-taxas-bacen`

Localizada em: `supabase/functions/seed-taxas-bacen/index.ts`

Esta função realiza a carga em massa de 20 anos de dados históricos de taxas BACEN para popular o cache local.

**Execução:**
```bash
# Deploy
npx supabase functions deploy seed-taxas-bacen

# Invocar via Dashboard Supabase ou curl
curl -X POST https://<project>.supabase.co/functions/v1/seed-taxas-bacen \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"iniciar": true}'
```

### Séries Processadas

| Série | Nome | Tipo | Registros (~) |
|-------|------|------|---------------|
| 20749 | Veículos PF | Anual | 250+ |
| 20728 | Veículos PJ | Anual | 176+ |
| 20773 | Imobiliário SFH | Anual | 250+ |
| 25497 | Imobiliário SFI | Anual | 200+ |
| 226 | TR | Mensal | 250+ |
| 433 | IPCA | Mensal | 250+ |
| 188 | INPC | Mensal | 250+ |
| 189 | IGP-M | Mensal | 250+ |

### Características

- **Período:** 01/01/2005 → Data Atual
- **Processamento em Lotes:** 100 registros por lote
- **Delay entre Séries:** 500ms para não sobrecarregar API BACEN
- **Conflitos:** UPSERT com `onConflict: 'serie_bacen, ano, mes'`
- **Fonte no Banco:** `BACEN_SGS_BULK`

---

## 8. Precisão Financeira (Decimal.js)

Para evitar divergência de centavos em cálculos de longo prazo, toda a aritmética de taxas utiliza a biblioteca **Decimal.js** com precisão de 20 casas decimais.

```typescript
import { Decimal } from "https://esm.sh/decimal.js@10.4.3";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// Conversão Anual → Mensal
const taxaMensalDec = new Decimal(1)
  .plus(decVal.div(100))
  .pow(new Decimal(1).div(12))
  .minus(1);
```

> [!IMPORTANT]
> Nunca use `Math.pow()` para cálculos financeiros. O objeto `Math` nativo do JavaScript introduz erros de arredondamento que se acumulam ao longo de 360 parcelas.

---

## 9. Priorização de Consulta

O fluxo de priorização segue esta ordem:

1. **Busca Local (Cache):** Verifica `taxas_bacen_historico` por `(serie, ano, mes)`.
2. **Busca Remota (Fallback):** Se não existe, chama API BACEN em tempo real.
3. **Atualização de Cache:** Salva resultado com `fonte: BACEN_SGS_LIVE`.
4. **Fallback Estático:** Se tudo falhar, usa taxas hardcoded de segurança.

```mermaid
flowchart LR
    A[Requisição] --> B{Cache?}
    B -->|Sim| C[Retorna Cache]
    B -->|Não| D[Chama BACEN]
    D -->|OK| E[Salva Cache + Retorna]
    D -->|Erro| F[Fallback Estático]
```

