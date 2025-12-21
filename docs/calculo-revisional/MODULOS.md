# 📘 Manual de Referência Técnica: Módulos Revisionais (v3.0)

> **Status:** Definitivo | **Versão:** 3.0 | **Referência:** "A Bíblia do Cálculo"
> Este documento consolida a especificação técnica detalhada para implementação dos 3 módulos do motor de cálculo do OctoApps, definindo fluxos de UX (Wizard), extração de dados (OCR), regras de negócio e entregáveis (Apêndices).

---

## 🚗 Módulo 1: Geral (Veículos e Empréstimos)
**Escopo Principal:** Financiamento de Veículos (CDC), Empréstimos Pessoais, Consignados (Privado/Público/INSS) e Capital de Giro.

### 1.1 Fluxo OCR (Extração Inteligente)
O sistema deve processar o PDF do contrato e buscar extrair as seguintes chaves:

| Campo OCR | Descrição / Regex Pattern | Destino no Wizard |
|-----------|---------------------------|-------------------|
| **Valor Financiado** | Valor líquido liberado (`Valor do Crédito`, `Valor Líquido`) | Passo 1 |
| **Valor da Prestação** | Valor pago mensalmente (`Parcela`, `Valor da Prestação`, `PMT`) | Passo 1 |
| **Taxa Mensal** | Percentual (`Taxa de Juros Mensal`, `% a.m.`) | Passo 2 |
| **Taxa Anual** | Percentual (`Taxa de Juros Anual`, `% a.a.`, `CET`) | Passo 2 |
| **Data Contrato** | Data de assinatura/emissão | Passo 1 |
| **Data Liberação** | Data de liberação do crédito (ponto de partida para juros) | Passo 1 |
| **Data 1º Venc.** | Data do primeiro pagamento (define carência) | Passo 1 |
| **Prazo** | Número total de parcelas | Passo 1 |
| **Tarifas (Lista)** | Val. Total de `TAC`, `Seguro Prestamista`, `Registro`, `Avaliação` | Passo 3 |
| **Capitalização** | Keyword search: "Capitalização Mensal" ou "Diária" | Passo 2 (Trigger) |

### 1.2 Análise Prévia (Formato Wizard)
A interface de entrada deve seguir um **Stepper** linear.

#### Passo 1: Dados do Contrato
*   **Identificação:** Nome Credor, Nome Devedor, Nº Contrato.
*   **Modalidade de Contrato:** Select com opções:
    - Aquisição de Veículos - Pessoa Física
    - Empréstimo Pessoal não Consignado
    - Consignado Privado / Público / INSS
    - Capital de Giro
    - Cheque Especial
    *(Define qual série temporal da API do Bacen será consultada)*
*   **Valores:** 
    - Valor Financiado (Principal)
    - Valor da Prestação (valor pago mensalmente)
    - Prazo (Meses)
*   **Datas Importantes:**
    - Data do Contrato (assinatura do documento)
    - Data de Liberação do Crédito (ponto de partida para contagem de juros)
    - Data do 1º Vencimento (define período de carência)

#### Passo 2: Taxas e Encargos
*   **Taxas do Contrato:** Juros Mensal (%) e Anual (%).
*   **Capitalização:** Switch [Mensal | Diária]. *Se OCR detectou diária, vir ativado.*
*   **Sistema de Amortização:** Select [Price (Padrão) | SAC | Constante].
*   **API Check:** *Display automático da Taxa Média Bacen para a data e modalidade informadas.*

#### Passo 3: Tarifas e Expurgo (Ocorrências)
*   **Checkboxes de Expurgo:** Lista de tarifas encontradas. O usuário marca quais deseja **remover** do saldo devedor recalculado.
    *   [ ] TAC / Tarifas Adm. (R$ value)
    *   [ ] Seguro Prestamista (R$ value)
    *   [ ] Avaliação do Bem (R$ value)

#### Passo 4: Resumo e Cálculo
*   Botão "Calcular Viabilidade".

### 1.3 Dicionário de Campos e Regras

| Campo | Tipo | Obrigatório | Regra de Negócio |
|---|---|---|---|
| `capitalization_mode` | Enum | Sim | Se `DAILY`, usar fórmula exponencial: `(1+i)^(d/30)-1` para cálculo de juros pro-rata. |
| `abuse_threshold` | Float | Sim | Default 1.5 (50%). Se `(TaxaAnualContrato > TaxaAnualBacen * 1.5)`, flag as abusiva (STJ). |
| `exclude_tariffs` | Array | Não | Somar valores marcados e subtrair do `Valor Financiado` no **Cenário Recalculado**. |
| `valor_prestacao` | Number | Não | Valor pago mensalmente. Usado para comparação visual e cálculo reverso de taxa. |
| `modalidade_contrato` | Enum | Sim | Define qual série temporal do Bacen será consultada (ex: Aquisição de Veículos). |
| `data_liberacao` | Date | Não | Data de liberação do crédito (ponto de partida para juros). |
| `data_primeiro_vencimento` | Date | Não | Data do 1º vencimento (define período de carência). |

### 1.4 Regras de Precisão Decimal

| Contexto | Precisão | Exemplo |
|----------|----------|---------|
| Input do Usuário (UI) | 4 casas decimais | `2.4400%` |
| Motor de Cálculo (Backend) | 8 casas decimais | `0.00565414%` |

> **IMPORTANTE:** Precisão estendida é crucial para evitar erro em cascata em contratos longos (360-420 meses).

### 1.5 Lógica de Carência (Taxa Proporcional Exponencial)

Quando o intervalo entre liberação e 1º vencimento é diferente de 30 dias:

```
diasCarencia = dataPrimeiroVencimento - dataLiberacao
Se diasCarencia > 30:
    taxaProporcional = [(1 + i%)^(dias/30)] - 1
    jurosCarencia = valorFinanciado × taxaProporcional
    pvAjustado = valorFinanciado + jurosCarencia
```

### 1.6 Detecção de Capitalização Diária (XTIR)

O sistema utiliza a função XTIR (Newton-Raphson) para calcular a Taxa Interna de Retorno considerando datas exatas:

**Regra de "Bate Exato":**
- Se `taxaXTIR (mensal) ≈ taxaPactuada (mensal)` → Capitalização diária **confirmada**
- Se `taxaXTIR > taxaPactuada × 1.01` → Metodologia mais onerosa **detectada**

**Fluxo de Caixa:**
```
CashFlow[0] = { date: dataLiberacao, value: -valorFinanciado }
CashFlow[1..n] = { date: dataPrimeiroVencimento + (i-1) meses, value: +valorPrestacao }
```

### 1.4 Lógica de Cálculo da Análise Prévia

> **IMPORTANTE:** A Análise Prévia funciona como um "exame de triagem" para identificar potencial de revisão antes do cálculo pericial completo.

#### 1.4.1 Confronto de Taxas (Sobretaxa)
O sistema compara a **Taxa Efetiva Anual (a.a.)** do contrato com a **Taxa Média de Mercado** do Bacen.

```
// Conversão mensal → anual (capitalização composta)
taxaAnualContrato = ((1 + taxaMensal/100)^12 - 1) * 100
taxaAnualMercado = ((1 + taxaBacen/100)^12 - 1) * 100

// Sobretaxa (%)
sobretaxa = ((taxaAnualContrato - taxaAnualMercado) / taxaAnualMercado) * 100
```

#### 1.4.2 Abusividade Técnica (STJ)
Conforme jurisprudência do STJ, configura-se abusividade quando a taxa é **50% ou mais** acima da média de mercado:
```
isAbusivo = sobretaxa >= 50
```

#### 1.4.3 Economia Estimada
Calculada pela diferença de juros totais entre dois cenários:

**Para PRICE:**
```
jurosTotal = (PMT * prazoMeses) - valorFinanciado
economia = jurosTotalContrato - jurosTotalMercado
```

**Para SAC:**
```
jurosTotal = taxaMensal * valorFinanciado * (prazoMeses + 1) / 2
economia = jurosTotalContrato - jurosTotalMercado
```

#### 1.4.4 Classificação de Viabilidade
| Classificação | Critério |
|---|---|
| **VIÁVEL** | Abusividade >= 50% (STJ) **OU** Economia > R$ 10.000 |
| **ATENÇÃO** | Sobretaxa 20-50% **OU** Economia R$ 3.000 - R$ 10.000 |
| **INVIÁVEL** | Economia insuficiente **OU** Taxa contrato abaixo do mercado |

### 1.5 Lógica de Cálculo Pericial (Engine)
1.  **Cenário Banco (Original):** Recriar a evolução da dívida usando os parâmetros do contrato (incluindo tarifas e capitalização capitalizada se houver) para chegar ao saldo devedor "oficial".
2.  **Cenário Recalculado (Justo):**
    *   **Principal:** Valor Financiado - Tarifas Expurgadas.
    *   **Taxa:** Se (Taxa Contrato > Média Bacen), usar Média Bacen. Caso contrário, manter original.
    *   **Método:** Juros Simples (Gauss) ou Price Linear (sem capitalização sobre juros).
3.  **Comparação:** Mês a mês, `ValorPago - ValorNovo`. A diferença positiva é indébito.

### 1.6 Apêndices (Entregáveis)
Conforme definido em `apendices.md`:
*   **AP01:** Evolução da Dívida (Cenário Banco).
*   **AP02:** Evolução Recalculada (Cenário Justo/Média).
*   **AP03:** Demonstrativo de Diferenças (Pagou X, Devia Y, Diferença Z).
*   **AP04:** Restituição em Dobro (Diferenças * 2).
*   **AP05:** Restituição Simples.

---

## 🏠 Módulo 2: Financiamento Imobiliário (SFH/SFI)
**Escopo Principal:** Crédito Imobiliário, Longo Prazo, Correção Monetária (TR/IPCA).

### 2.1 Fluxo OCR
Campos adicionais críticos para este módulo:
*   **Sistema de Amortização:** SAC, Price, SACRE.
*   **Indexador:** TR, IPCA, INPC, IGPM.
*   **Seguros:** MIP (Morte/Invalidez) e DFI (Danos Físicos).

### 2.2 Análise Prévia (Wizard)

#### Passo 1: Configuração do Financiamento
*   **Valores:** Valor de Compra e Venda, Valor da Avaliação, Valor Financiado.
*   **Sistema:** Select [SAC | Price | SACRE].
*   **Indexador:** Select [TR | IPCA | INPC | IGPM]. *Obrigatório conectar com série histórica.*

#### Passo 2: Seguros Habitacionais
*   **MIP:** Input numérico + Tipo [Valor Fixo ou % sobre Saldo Devedor].
*   **DFI:** Input numérico + Tipo [Valor Fixo ou % sobre Valor Imóvel].
*   **Taxa Adm:** Valor fixo mensal (ex: R$ 25,00).

#### Passo 3: Dados de Evolução
*   **Datas:** Data Assinatura, Data Liberação, Data 1ª Parcela.
*   **Prazo:** Meses (ex: 360, 420).

### 2.3 Lógica de Cálculo da Análise Prévia

> A Análise Prévia do Imobiliário identifica o potencial de redução da dívida antes do cálculo pericial completo.

#### 2.3.1 Confronto de Taxas (Abusividade)
O sistema compara a **Taxa Efetiva Anual (a.a.)** do contrato com a **Taxa Média de Mercado** do Bacen para o período e modalidade (SFH ou SFI). O uso da taxa **anual** evidencia melhor o excesso de juros.

#### 2.3.2 Cálculo da Sobretaxa (Excesso)
Apura-se o percentual de excesso sobre a média de mercado:
```
sobretaxa = ((taxaAnualContrato - taxaAnualMercado) / taxaAnualMercado) * 100
```
Se a taxa do contrato for **50% superior** à média, configura-se abusividade técnica (STJ).

#### 2.3.3 Simulação de Redução Estimada
O sistema calcula o valor que o cliente economizaria:

**Para SAC:**
```
jurosTotal = taxaMensal * principal * (prazoMeses + 1) / 2
economia = jurosTotalContrato - jurosTotalMercado
```

**Para PRICE:**
```
jurosTotal = (PMT * prazoMeses) - principal
economia = jurosTotalContrato - jurosTotalMercado
```

#### 2.3.4 Classificação de Viabilidade (Scorecard)
| Indicador | VIÁVEL | ATENÇÃO | INVIÁVEL |
|---|---|---|---|
| Sobretaxa (STJ) | >= 50% | 20% - 49% | < 20% |
| Economia Estimada | > R$ 10.000 | R$ 3.000 - 10.000 | < R$ 3.000 |
| Taxa vs Mercado | Acima | Acima | Abaixo |

### 2.4 Ciclo de Amortização Mensal (Particularidades)
*   **Correção Monetária:** A correção (TR/IPCA) incide sobre o Saldo Devedor **ANTES** da amortização do mês.
    *   `SaldoAtualizado = SaldoAnterior * (1 + IndiceMes)`
*   **Juros de Carência/Obra:** Se houver atraso entre liberação e 1ª parcela, calcular juros pró-rata e somar ao saldo devedor inicial.
*   **Seguros (MIP e DFI):** Somados para compor o encargo mensal final.
*   **Venda Casada:** Permitir recalcular seguros usando "Taxa de Mercado" de seguradoras independentes se configurado.

### 2.5 Apêndices
*   **AP01:** Evolução do Financiamento (Recálculo da Prestação Devida).
*   **AP02:** Diferenças Mensais (Nominal).
*   **AP03:** Evolução com Restituição em Dobro (Abatimento no Saldo).
*   **AP04:** Evolução com Restituição Simples.
*   **AP05:** Atualização Monetária (INPC) sobre as diferenças encontradas no AP02.
*   **AP06/07:** Consolidação Final (Encontro de Contas).

---

## 💳 Módulo 3: Cartão de Crédito (RMC)
**Escopo Principal:** Dívidas de Cartão, Empréstimo em Cartão (RMC), Superendividamento. Módulo de Alta Complexidade de Dados.

### 3.1 Fluxo OCR (Grid Extraction)
O desafio aqui não são campos únicos, mas tabelas.
*   **Header da Fatura:** Data Vencimento, Valor Total, Pagamento Mínimo, Encargos do Ciclo.
*   **Lançamentos:** Extrair linhas de débitos e créditos.

### 3.2 Wizard de Reconstrução

#### Passo 1: Parâmetros do Cartão
*   **Identificação:** Bandeira/Banco.
*   **Datas:** Data de Início do Problema (Primeira Fatura contestada).
*   **Limite:** Limite de Crédito Concedido.

#### Passo 2: Importação de Faturas (Grid Editável)
Interface estilo planilha para input de dados variáveis mês a mês.
*   Colunas Obrigatórias: `Mês/Ano`, `Saldo Anterior`, `Compras/Gastos`, `Pagamentos Realizados`, `Juros Cobrados`, `Multa Cobrada`.
*   *Feature:* Upload em lote de PDFs de faturas.

### 3.3 Dicionário e Particularidades
| Campo | Regra |
|---|---|
| `rotativo_cobrado` | Valor monetário dos juros na fatura. Será confrontado com o calculado. |
| `taxa_media_nao_consignado` | Série Bacen específica para Cartão de Crédito Rotativo. |

### 3.4 Lógica de Cálculo (Recomposição)
1.  **Simulação de Empréstimo (Tese RMC):** Tratar a dívida inicial como um empréstimo consignado padrão (taxa média de consignado, prazo fixo de ex: 60x).
2.  **Confronto:** Abater os descontos em folha (RMC) mês a mês deste "Empréstimo Simulado".
3.  **Indébito:** Quando o total de descontos RMC superar o valor que seria devido no empréstimo simulado, o excedente é indébito.
4.  **Tese de Cartão Comum:** Recalcular o saldo devedor mês a mês substituindo a taxa de juros rotativos (ex: 14% a.m.) pela taxa média de mercado (ex: 6% a.m.) e expurgando anatocismo.

### 3.5 Apêndices
*   **AP01:** Reconstrução (Consignado Simulado).
*   **AP02:** Confronto de Saques/Compras vs Pagamentos (RMC).
*   **AP03:** Apuração de Indébito acumulado.

---

## 🔗 Integrações e APIs Comuns

### 1. Banco Central (SGS)
Integração obrigatória para obter:
*   **Taxas Médias de Juros:** Por modalidade (PF/PJ, Veículo, Imobiliário, Pessoal).
*   **Índices Financeiros:** TR, INPC, IPCA, IGPM (Séries temporais).

### 2. Tabela FIPE (Opcional)
Para validar "Valor de Avaliação do Bem" no módulo de Veículos.

### 3. Worker de Sincronização
O backend deve manter uma tabela `taxas_bacen_cache` atualizada diariamente para evitar latência na Análise Prévia.