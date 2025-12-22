# Análise de Viabilidade - Empréstimos & Veículos (Triagem Rápida)

> **Documentação Técnica do Motor de Cálculo Prévia**
> Versão: 1.0.0 | Data: 2024-12-22
> Módulo: GERAL (Veículos, Empréstimo Pessoal, Consignado)

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Campos de Entrada](#2-campos-de-entrada)
3. [Integração BACEN (Taxa de Mercado)](#3-integração-bacen-taxa-de-mercado)
4. [Algoritmos de Verificação](#4-algoritmos-de-verificação)
5. [Cálculo de Economia](#5-cálculo-de-economia)
6. [Classificação e Score](#6-classificação-e-score)

---

## 1. Visão Geral

O módulo de **Análise de Viabilidade** (conhecido como "Triagem Rápida") tem como objetivo fornecer um diagnóstico instantâneo sobre a abusividade de um contrato bancário. Diferente do cálculo pericial completo, ele foca em identificar **indícios fortes** de irregularidades para justificar a contratação de uma perícia completa.

**Escopo:**
- Financiamento de Veículos (CDC)
- Empréstimo Pessoal
- Crédito Consignado (Privado/Público/INSS)
- Capital de Giro

---

## 2. Campos de Entrada

A interface simplificada coleta apenas os dados essenciais para recriar o fluxo financeiro do contrato.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `valorFinanciado` | moeda | ✅ | Valor líquido liberado + Tarifas financiadas |
| `valorPrestacao` | moeda | ✅ | Valor da parcela mensal (PMT) |
| `prazoMeses` | numero | ✅ | Prazo total do contrato |
| `taxaAnualContrato`| percent | ✅ | Taxa de juros anual (CET ou Nominal) |
| `dataContrato` | data | ✅ | Data da assinatura (ref. para BACEN) |
| `modalidade` | enum | ✅ | Tipo de contrato (define a série BACEN) |

### 2.1 Tarifas (Expurgo)
Opcionalmente, o usuário pode informar tarifas para simular a "venda casada" ou cobrança indevida.

- **TAC** (Tarifa de Abertura de Crédito)
- **Seguro Prestamista**
- **Tarifa de Avaliação**
- **Tarifa de Registro**

---

## 3. Integração BACEN (Taxa de Mercado)

O sistema consulta a API do Banco Central (SGS) para obter a taxa média de juros praticada no mercado na data da contratação.

### 3.1 Mapeamento de Séries

| Modalidade | Série SGS | Descrição |
|------------|-----------|-----------|
| `AQUISICAO_VEICULOS` | **20749** | Taxa média de juros - Pessoas Físicas - Aquisição de veículos |
| `EMPRESTIMO_PESSOAL` | **25442** | Taxa média de juros - Pessoas Físicas - Crédito pessoal não consignado |
| `CONSIGNADO_PUBLICO` | **20719** | Crédito pessoal consignado - Setor público |
| `CONSIGNADO_INSS` | **20720** | Crédito pessoal consignado - Aposentados/Pensionistas INSS |
| `CONSIGNADO_PRIVADO` | **20718** | Crédito pessoal consignado - Setor privado |
| `CAPITAL_GIRO` | **20752** | Capital de giro com prazo superior a 365 dias |
| `CHEQUE_ESPECIAL` | **20742** | Cheque especial - Pessoas Físicas |

### 3.2 Lógica de Busca
1. Busca a taxa exata na `dataContrato`.
2. Se não houver cotação no dia, busca a cotação imediatamente anterior (fallback).
3. Converte a taxa anual retornada para mensal.

```typescript
Taxa Mensal = ((1 + (Taxa Anual / 100))^(1/12) - 1) * 100
```

---

## 4. Algoritmos de Verificação

### 4.1 Detecção de Capitalização Diária (XTIR)

Verifica se o banco utilizou capitalização diária (mais onerosa) disfarçada de mensal, prática condenada pelo STJ se não expressa claramente.

**Algoritmo:**
1. Calcula a **Taxa Implícita Mensal** baseada no Fluxo (PV, PMT, n) usando método Newton-Raphson.
2. Calcula a **Taxa XTIR** (Taxa Interna de Retorno Estendida) considerando dias corridos de 30 dias.
3. Compara Taxa Implícita com Taxa Pactuada.

```typescript
criterioAbusividade = Taxa Implícita > (Taxa Pactuada * 1.05) // Margem de 5%
```

> ⚠️ **Alerta**: Se detectado, retorna `capitalizacaoDiariaDetectada = true`.

### 4.2 Indicador de Sobretaxa

Compara a taxa do contrato com a taxa média de mercado.

```typescript
Sobretaxa (%) = (Taxa Contrato - Taxa Mercado) / Taxa Mercado
```

**Critérios:**
- **> 50%**: Abusividade Excessiva (Vermelho) - Alta probabilidade de êxito.
- **20% a 50%**: Atenção (Amarelo) - Avaliar caso a caso.
- **< 20%**: Dentro da média (Verde) - Risco alto de improcedência.

---

## 5. Cálculo de Economia

A estimativa de economia é composta por dois fatores: **Redução de Juros** e **Restituição de Tarifas**.

### 5.1 Metodologia de Cálculo

1. **Expurgo de Tarifas (Momento Zero)**:
   Subtrai as tarifas abusivas do valor financiado.
   ```typescript
   PV_Liquido = ValorFinanciado - TarifasExpurgadas
   ```

2. **Recálculo da Prestação (PMT Revisada)**:
   Calcula a nova parcela usando o `PV_Liquido` e a `Taxa de Mercado` (ou a do contrato, o que for menor, mas geralmente usa-se a de mercado para revisional).
   ```typescript
   PMT_Revisada = PRICE(PV_Liquido, TaxaMercado, Prazo)
   ```

3. **Cálculo da Economia Final**:
   A economia é a diferença total no fluxo de pagamento + o valor nominal das tarifas (que foi abatido do principal).

   ```typescript
   // 1. Diferença mensal
   DiferencaMensal = PMT_Original - PMT_Revisada

   // 2. Economia Total Projetada
   EconomiaTotal = DiferencaMensal * PrazoMeses
   
   // 3. Decomposição para Relatório (Sem duplicação)
   EconomiaTarifas = TarifasExpurgadas
   EconomiaJuros = EconomiaTotal - EconomiaTarifas
   ```

> 💡 **Nota Importante**: A `EconomiaTotal` representa o benefício financeiro total para o cliente ao final do contrato. A decomposição serve apenas para mostrar a origem do ganho (juros vs tarifas).

---

## 6. Classificação e Score

O sistema atribui um **Score de Viabilidade (0-100)** para orientar o advogado ou comercial.

### Regras de Pontuação:

| Condição | Pontos | Classificação |
|----------|--------|---------------|
| `capitalizacaoDiaria == true` | 90 | **VIÁVEL** 🟢 |
| `sobretaxa > 50%` | 90 | **VIÁVEL** 🟢 |
| `sobretaxa > 20%` | 70 | **ATENÇÃO** 🟡 |
| `sobretaxa <= 20%` | 30 | **INVIÁVEL** 🔴 |
| `economiaTotal < R$ 1.000` | 0 | **INVIÁVEL** 🔴 |

### Recomendações Automáticas

- **VIÁVEL**: "Potencial abusividade detectada. Recomendamos perícia completa."
- **ATENÇÃO**: "Taxa acima da média, mas risco moderado. Avaliar perfil do cliente."
- **INVIÁVEL**: "Juros dentro da média de mercado. Ação revisional não recomendada."

---

> **Documento gerado para validação técnica da Triagem Rápida v1.0.0**
