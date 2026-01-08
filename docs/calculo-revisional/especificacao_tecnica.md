Aqui está a **Documentação Técnica Completa e Definitiva (v3.0)** do Hub de Perícia Financeira OctoApps. Este documento consolida a arquitetura, as regras de negócio detalhadas, os novos requisitos matemáticos e a estrutura de dados atualizada.

---

# 📘 Especificação Técnica: Hub de Perícia Financeira OctoApps (v3.0)

**Projeto:** OctoApps - Módulo Revisional Avançado

**Versão:** 3.0 (Definitiva)

**Data:** 17/12/2025

**Status:** Pronto para Desenvolvimento

**Stack:** React (Vite), TypeScript, Supabase (PostgreSQL), Python (Bacen Crawler), shadcn/ui.

---
# CAMPOS DE ATENÇÃO
. Log de Auditoria Matemática
Como provar que o cálculo foi feito naquele dia com aquela taxa?

Requisito: Na tabela calculation_results, salvar um "Snapshot" das taxas usadas.

Exemplo: "Este cálculo usou a Série Bacen 25471, valor de 1.55% referente a Jan/2020, consultada em 17/12/2025". Se o Bacen corrigir a taxa histórica depois (acontece), seu laudo está protegido.

[ ] Math Engine: Instalar decimal.js. Proibido usar float.

[ ] Bacen: Criar Worker noturno para sincronizar taxas no banco local.
Solução (Proxy): O seu Backend deve ter um "Cron Job" (tarefa agendada) que roda 1x por dia, baixa as taxas novas e salva no seu banco (taxas_bacen_historico). O Frontend nunca deve chamar o Bacen diretamente; deve consultar o seu Supabase.

[ ] Feriados: Implementar tabela de feriados nacionais (2000-2030) para cálculo de dias úteis.

[ ] PDF: Utilizar functions no supabase

## 1. Visão Geral do Produto

O sistema OctoApps atua como um **"Raio-X Financeiro"**. Enquanto o contrato bancário apresenta a estrutura superficial da dívida (parcelas e taxas nominais), o OctoApps penetra essa estrutura para revelar o "esqueleto interno" de juros, amortização e capitalização.

O objetivo é identificar "fraturas" (abusividades) através de recálculos matemáticos de alta precisão, permitindo:

1. **Análise Prévia (< 5 min):** Triagem rápida de viabilidade.
2. **Laudo Pericial Completo:** Recálculo detalhado, mês a mês, considerando pagamentos reais, seguros e índices de correção.

O sistema é dividido em três módulos verticais, suportados por uma arquitetura comum de *Calculation Engine*.

---

## 2. Módulo A: Geral, Veículos e Empréstimos (Core)

Este módulo trata de operações de CDC (Crédito Direto ao Consumidor), Empréstimos Pessoais e Financiamento de Veículos. O foco é identificar a capitalização diária disfarçada e comparar taxas com o mercado.

### 2.1. Campos e Inputs (Dicionário de Dados)

| Campo | Tipo | Obrigatório | Regra de Negócio / Descrição |
| --- | --- | --- | --- |
| **Valor Financiado** | Numeric | Sim | Principal líquido liberado ao cliente. (Input Currency: trata 0 como vazio). |
| **Data do Contrato** | String/Date | Sim | Data base para buscar a Taxa Média Bacen. (Input DD/MM/AAAA formatado). |
| **Data 1º Vencimento** | String/Date | Sim | Define o período de carência inicial. (Input DD/MM/AAAA formatado). |
| **Prazo** | Integer | Sim | Número de meses (parcelas). |
| **Taxa de Juros (a.m.)** | Numeric(12,8) | Sim | Taxa contratual mensal. |
| **Taxa de Juros (a.a.)** | Numeric(12,8) | Sim | Taxa contratual anual. |
| **Tipo Capitalização** | Enum | Sim | `MENSAL` ou `DIARIA`. |
| **Tarifas (Expurgo)** | Array<Object> | Não | Lista de itens a expurgar: TAC, Seguro Prestamista, Avaliação do Bem, Registro. |
| **Config. Inadimplência** | JSON | Sim | Define Multa (2%), Juros Mora (1%) e Base da Multa (`PRINCIPAL` ou `TOTAL`). |

### 2.2. Regras de Negócio e Lógica de Cálculo

#### **2.2.1. Detecção de Abusividade (Taxa Média)**

* **Regra:** O sistema consulta a API do SGS (Bacen) para a data do contrato e tipo de operação.
* **Threshold:** A taxa do contrato é considerada abusiva se:


* Se abusiva, o recálculo substitui a taxa contratual pela Taxa Média exata.

#### **2.2.2. Capitalização Diária (Fórmula Exponencial)**

* Se o seletor **Capitalização** for `DIARIA`, o sistema **NÃO** deve usar regra de três simples.
* **Fórmula Obrigatória:** O juro proporcional aos dias corridos (d) deve ser calculado como:


* Isso corrige distorções de meses com 28, 29 ou 31 dias.

#### **2.2.3. Sistemas de Amortização e Teses**

* **Price / CDC:** Método padrão bancário.
* **Juros Simples (Tese):** O sistema deve permitir recalcular utilizando o **Método de Gauss** ou **MAGIS** (Equivalência a Juros Simples), onde os juros não incidem sobre juros acumulados.

#### **2.2.4. Antecipação e Liquidação**

* Ao calcular o saldo para quitação em uma data X, o sistema deve expurgar todos os juros vincendos (futuros), trazendo o Valor Presente (VP) das parcelas restantes descontadas pela taxa de juros original (ou recalculada, dependendo da tese).

---

## 3. Módulo B: Revisão de Financiamento Imobiliário (SFH/SFI)

Módulo de Alta Complexidade. Envolve correção monetária do saldo devedor (antes da amortização) e recálculo de seguros habitacionais.

### 3.1. Campos e Inputs Específicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| **Sistema Amortização** | Enum | `SAC` (Decrescente), `PRICE` (Constante), `SACRE`. |
| **Indexador Correção** | Enum | **Obrigatório.** `TR`, `IPCA`, `INPC`, `IGPM`. |
| **Seguro MIP** | Numeric/Percent | Morte e Invalidez Permanente. |
| **Seguro DFI** | Numeric/Percent | Danos Físicos ao Imóvel. |
| **Expurgos** | Boolean | Opção para remover Taxas Administrativas (ex: R$ 25,00/mês). |

### 3.2. Fluxo de Cálculo Mensal (Algoritmo)

Para cada mês n, o sistema deve executar estritamente nesta ordem:

1. **Atualização Monetária:**



*(O Indexador corrige todo o saldo antes de cobrar juros)*
2. **Cálculo de Juros:**


3. **Cálculo da Amortização:**
* Se **SAC:** Amortizacao = Saldo_{Inicial} / Prazo_{Restante}
* Se **Price:** Amortizacao = PMT_{Calculada} - Juros_{n}


4. **Cálculo de Seguros:**
Aplicar alíquota sobre o Saldo Devedor (MIP) e Valor do Imóvel (DFI), se for o caso.
5. **Composição da Parcela:**



### 3.3. Tratamento de Carência

Se houver diferimento (tempo entre liberação e 1ª parcela):

* Calculam-se os juros deste período.
* Esses juros **não são cobrados à vista**, mas incorporados à **Base de Cálculo das Prestações** (Saldo Devedor Teórico), elevando o valor base para a amortização futura.

---

## 4. Módulo C: Revisão Geral e Renegociações (Cadeia de Contratos)

Focado em "limpar" a dívida desde a origem. Fundamental para Capital de Giro e Cheque Especial convertido em empréstimo.

### 4.1. Inputs Cruciais

* **Especificidade da Taxa Média:** O seletor de tipo de contrato deve ser granular:
* *Pessoa Física:* Consignado Privado vs. Público vs. INSS.
* *Pessoa Jurídica:* Capital de Giro > 365 dias vs. < 365 dias.


* **Cadeia de Contratos:**
* Possibilidade de vincular um "Contrato Pai" a um "Contrato Filho" (Renegociação).



### 4.2. Lógica de Renegociação (Chain Reaction)

1. **Passo 1:** O sistema recalcula o **Contrato A** (Original) expurgando abusividades.
2. **Passo 2:** Na data da renegociação, apura-se o **Saldo Devedor Recalculado** do Contrato A.
3. **Passo 3:** O **Contrato B** (Renegociação) é inserido, mas o valor financiado inicial dele é substituído automaticamente pelo Saldo Final do Passo 2 (e não o valor que o banco alegou ser a dívida).
4. **Resultado:** A diferença exponencial entre a "Dívida Bancária Renegociada" e a "Dívida Real Renegociada" gera o indébito.

---

## 5. Funcionalidades Transversais

### 5.1. Análise Prévia (O Raio-X Rápido)

* **Performance:** Deve retornar em < 5 segundos após input.
* **Automação:** Ao inserir Data e Tipo, o backend busca a Taxa Bacen imediatamente.
* **Saída (KPIs):**
* Comparativo: Valor Parcela Atual vs. Valor Parcela Justa.
* **Sobretaxa:** Exibe o percentual excedente (ex: *"A taxa cobrada é 210% da média de mercado"*).
* Flags Visuais: [Capitalização Diária Detectada], [Seguro Abusivo], [Taxa Ilegal].



### 5.2. Editor Avançado de Pagamentos (Conciliação Pericial)

Recurso acessível na tela de detalhes do cálculo ("Modo Perito").

* **Interface:** Uma Grid (Tabela) editável de todas as parcelas geradas (TanStack Table).
* **Capacidades de Edição:**
  1. **Alterar Data/Valor Pago:** O cliente pagou a parcela 10 com 15 dias de atraso e multa? O perito insere o valor exato do comprovante.
  2. **Amortização Extraordinária:** Inserir um aporte (ex: uso de FGTS na parcela 20).
  3. **Status com Ícones Coloridos:** Seletor visual com 4 ícones clicáveis:
     - ✅ **PAGO** → Verde (Emerald) - Parcela quitada
     - ⏳ **EM_ABERTO** → Amarelo (Amber) - Aguardando pagamento
     - 🔄 **RENEGOCIADO** → Roxo (Purple) - Incluída em renegociação
     - ❌ **ATRASO** → Vermelho (Red) - Parcela vencida

* **Feedback Visual:**
  * **Row Coloring:** Ao selecionar um status, a linha inteira recebe um tom suave da cor correspondente para facilitar visualização rápida.
  * **Edited Indicator:** Linhas editadas recebem borda esquerda amarela.
  * **Pré-preenchimento:** A coluna "Valor Pago Real" é automaticamente preenchida com o valor da parcela contratual.

* **Recálculo em Cascata (Trigger):**
  * Ao editar a parcela N, o sistema deve **reprocessar instantaneamente** o Saldo Devedor de todas as parcelas N+1 até o final.
  * A diferença entre o valor exigido pelo banco e o valor pago editado gera o saldo de indébito/crédito atualizado.
* **Mapeamento de Dados (Adapters):** O `calculationAdapters.ts` garante que campos como `valorContrato`, `valorPago` e `status` sejam mapeados corretamente da base de dados para a interface do perito, evitando valores `NaN`.



### 5.3. Compensação (Art. 42 CDC)

* Configuração global para apuração: **Devolução Simples** ou **Em Dobro**.
* O sistema soma as diferenças mensais (Valor Pago - Valor Recalculado). Se o resultado for positivo (cliente pagou a mais), aplica-se a regra de dobro se selecionada.

---

## 6. Estrutura de Banco de Dados (Schema Atualizado)

Atualização das tabelas para suportar os novos inputs de carência, expurgos específicos e configuração de mora.

```sql
-- ENUMS
CREATE TYPE capitalization_type AS ENUM ('MONTHLY', 'DAILY');
CREATE TYPE amortization_system AS ENUM ('SAC', 'PRICE', 'SACRE', 'GAUSS_SIMPLE');
CREATE TYPE fine_base_type AS ENUM ('PRINCIPAL', 'TOTAL_INSTALLMENT');

-- TABELA DE INPUTS (Expandida)
CREATE TABLE public.calculation_inputs (
    id uuid PRIMARY KEY,
    calculation_id uuid REFERENCES public.calculations(id) ON DELETE CASCADE,
    
    -- Dados Financeiros Base
    amount_financed numeric NOT NULL,
    contract_date date NOT NULL,
    first_payment_date date NOT NULL, -- Essencial para carência
    term_months integer NOT NULL,
    
    -- Taxas
    contract_rate_monthly numeric NOT NULL,
    contract_rate_yearly numeric NOT NULL,
    
    -- Configurações de Tese
    capitalization_mode capitalization_type DEFAULT 'MONTHLY',
    amortization_method amortization_system DEFAULT 'PRICE',
    use_bacen_average boolean DEFAULT true,
    abuse_threshold numeric DEFAULT 1.5, -- 1.5x a média
    
    -- Configurações de Inadimplência (Novo)
    default_fine_percent numeric DEFAULT 2.0, -- Multa 2%
    default_interest_percent numeric DEFAULT 1.0, -- Mora 1%
    default_fine_base fine_base_type DEFAULT 'PRINCIPAL',
    
    -- Dados Específicos (JSONB Flexível)
    -- Imobiliário: { indexer: 'TR', insurance_mip: 50.00, insurance_dfi: 20.00 }
    -- Geral: { tariffs_to_exclude: [{name: 'TAC', value: 900}, {name: 'Seguro', value: 1200}] }
    -- Renegociação: { previous_contract_id: "uuid...", paid_amount_on_settlement: 5000 }
    specific_data jsonb DEFAULT '{}'::jsonb,
    
    -- Histórico de Pagamentos Reais (Conciliação)
    -- Array de objetos: [{n: 1, paid_date: '...', paid_value: 1200, extra_amortization: 0}]
    payment_reconciliation jsonb DEFAULT '[]'::jsonb
);

```

---

## 7. Interfaces e UX (Diretrizes)

### 7.1. Upload e OCR (Motor de Extração Inteligente)

* **Botão "Analisar Contrato":** Aciona o fluxo de extração de dados via AI/LLM a partir do PDF carregado.
* **Extração Automática:** O sistema deve tentar extrair e preencher automaticamente: Banco, Valor Financiado, Taxas, Datas e Sistema de Amortização.
* **Alerta de Capitalização:** Se o OCR detectar "Capitalização Diária" no texto do contrato, o switch de capitalização deve vir pré-ativado como `DIARIA`.

### 7.2. Dashboard de Resultados

* **Comparativo Lado a Lado:** Tabela com duas colunas principais: "Cenário Banco" vs "Cenário Recalculado".
* **Destaque de Economia:** Card em verde vibrante mostrando a economia total + valores a restituir.
* **Gráfico de Evolução:** Linha do Saldo Devedor Original vs. Recalculado. A distância entre as linhas representa visualmente o "Indébito".

---

## 8. Algoritmos Críticos (Snippets de Lógica)

### A. Cálculo Exponencial (Capitalização Diária)

```typescript
function calculateDailyInterest(principal: number, monthlyRate: number, days: number): number {
    // Regra: (1 + i)^(d/30) - 1
    // monthlyRate deve entrar como decimal (ex: 1.5% = 0.015)
    const factor = Math.pow(1 + monthlyRate, days / 30);
    return principal * (factor - 1);
}

```

### B. Lógica de Recálculo Imobiliário (Loop Mensal)

```typescript
let saldoDevedor = valorFinanciado;
let trData = seriesTR; // Array com taxas históricas

for (let n = 1; n <= prazo; n++) {
    // 1. Atualização Monetária (TR/IPCA)
    const indiceCorrecao = trData.find(d => d.date === dataParcela)?.value || 0;
    saldoDevedor = saldoDevedor * (1 + indiceCorrecao);
    
    // 2. Juros
    const juros = saldoDevedor * taxaJurosMensal;
    
    // 3. Amortização (Ex: SAC)
    const amortizacao = valorFinanciadoInicial / prazo;
    
    // 4. Saldo Final
    saldoDevedor -= amortizacao;
    
    // 5. Parcela
    const pmt = amortizacao + juros + seguroMIP + seguroDFI + taxaAdm;
    
    report.push({ n, pmt, juros, amortizacao, saldoDevedor });
}

```

Este documento cobre integralmente os novos requisitos de complexidade matemática, regras de negócio bancárias e fluxos de renegociação solicitados.