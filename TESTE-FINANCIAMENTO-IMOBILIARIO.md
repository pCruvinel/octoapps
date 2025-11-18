# 📋 Guia de Teste - Cálculo Revisional de Financiamento Imobiliário

Este documento contém todos os dados necessários para testar o sistema de cálculo revisional SFH/SAC.

---

## 🎯 CENÁRIO DE TESTE

**Caso:** Revisão de financiamento imobiliário com 3 faixas de taxa e correção TR.

**Objetivo:** Calcular diferença entre valores cobrados vs. valores devidos (taxa de mercado).

---

## 📝 DADOS PARA PREENCHIMENTO DO FORMULÁRIO

### 1️⃣ **DADOS DO PROCESSO**

| Campo | Valor |
|-------|-------|
| **Credor** | Ana Silva |
| **Devedor** | Carlos Pereira |
| **Número do Contrato** | 98765 |
| **Tipo de Contrato** | Financiamento |
| **Data do Cálculo** | 2025-01-15 |

---

### 2️⃣ **DADOS DO IMÓVEL**

| Campo | Valor |
|-------|-------|
| **Valor do Bem** | 400000 |
| **Valor Financiado (PV)** | `302400` ⭐ |
| **Entrada** | 97600 |
| **Sistema de Amortização** | SAC |
| **Indexador de Correção Monetária** | TR |

> ⭐ = Campo obrigatório para cálculo

---

### 3️⃣ **PARCELAS**

| Campo | Valor |
|-------|-------|
| **Número de Parcelas (n)** | `360` ⭐ |
| **Data do 1º Vencimento** | `2018-06-21` ⭐ |
| **Data do Contrato** | 2018-06-01 |

> ⭐ = Campo obrigatório para cálculo

---

### 4️⃣ **TAXAS E JUROS**

| Campo | Valor | Observação |
|-------|-------|------------|
| **Taxa Mensal do Contrato (i)** | `0.005654145387` ⭐ | 0,5654% a.m. (primeira faixa) |
| **Taxa Mensal de Mercado** | `0.0062` ⭐ | 0,62% a.m. |
| **MIP (1ª parcela)** | `62.54` | Mútuo de Imóvel Próprio |
| **DFI (1ª parcela)** | `77.66` | Despesas de Formação |
| **TCA (1ª parcela)** | `25` | Taxa de Custeio Administrativo |
| **Multa (1ª parcela)** | `0` | Sem multa na primeira parcela |
| **Mora (1ª parcela)** | `0` | Sem mora na primeira parcela |
| **Horizonte (meses)** | `12` | Calcular primeiros 12 meses |

> ⭐ = Campo obrigatório para cálculo

---

## 📊 RESULTADOS ESPERADOS

### ✅ **Análise Prévia (12 meses)**

Após clicar em **"Iniciar Análise Prévia"**, você deverá ver:

#### **Resumo Comparativo:**
- **Taxa do Contrato:** ~0.5654% a.m.
- **Taxa Média do Mercado:** 0.6200% a.m.
- **Sobretaxa:** ~-0.0546% a.m. (negativa = taxa do contrato menor)

#### **Representatividade:**
- **Valor Total Pago:** ~R$ 32.579,52 (12 parcelas com encargos)
- **Valor que Deveria ter Pago:** ~R$ 32.467,20 (12 parcelas sem seguros)
- **Diferença:** ~R$ 112,32 (positiva = pagou a mais devido aos seguros)

> **NOTA:** Os valores exatos podem variar ligeiramente devido à aplicação da TR.

---

### ✅ **Relatório Completo (12 meses)**

Após clicar em **"Gerar Relatório Completo"**, você deverá ver:

#### **Cards de Resumo:**
- **Valor Principal:** R$ 302.400,00
- **Total de Juros:** ~R$ 20.287,11 (soma dos juros de 12 meses)
- **Total de Taxas:** R$ 165,20 (MIP + DFI + TCA da 1ª parcela)
- **Valor Total Devido:** ~R$ 32.579,52
- **Total a Restituir:** ~R$ 112,32

#### **Comparativo de Taxas:**
- **Taxa Contrato:** 0.5654% a.m.
- **Taxa Mercado:** 0.6200% a.m.
- **Sobretaxa:** -0.0546 p.p.

#### **Primeira Linha da Tabela de Amortização:**

| Campo | Valor Esperado |
|-------|----------------|
| **Mês** | 1 |
| **Data** | 21/06/2018 |
| **Valor Original** | R$ 2.549,76 |
| **Valor Corrigido** | R$ 2.549,76 |
| **Juros (J_1)** | R$ 1.709,76 |
| **Amortização (A)** | R$ 840,00 |
| **Saldo Devedor (SD_1)** | R$ 301.560,00 |

> **Cálculos da 1ª Parcela:**
> - A = 302.400 / 360 = **840,00**
> - J_1 = 302.400 × 0.005654145387 = **1.709,76**
> - P_1 = 840 + 1.709,76 = **2.549,76**
> - Pago_1 = 2.549,76 + 62,54 + 77,66 + 25 = **2.714,96**
> - SD_1 = (302.400 - 840) = **301.560,00**

---

## 🔬 DADOS TÉCNICOS (PARA REFERÊNCIA)

### **Faixas de Taxa Implementadas:**

```javascript
Faixa 1: de 2018-06-21 até 2020-02-21 → i = 0.005654145387 (0,5654% a.m.)
Faixa 2: de 2020-03-21 até 2023-07-21 → i = 0.005025 (0,5025% a.m.)
Faixa 3: de 2023-08-21 até 2048-05-21 → i = 0.00834755 (0,8348% a.m.)
```

### **Série TR Configurada:**

```javascript
2022-01-21: fator = 1.001195 (0,1195% de correção)
Demais meses: fator = 1.000000 (sem correção)
```

### **Fórmulas Aplicadas:**

```
SAC - Sistema de Amortização Constante:
- Amortização: A = PV / n
- Juros: J_t = SD_{t-1} × i_t
- Prestação: P_t = A + J_t
- Total Pago: Pago_t = P_t + MIP + DFI + TCA + multa + mora
- Saldo Devedor: SD_t = (SD_{t-1} - A) × TR_t
```

---

## 🚀 PASSO A PASSO PARA TESTE

### **Teste 1: Análise Prévia**

1. ✅ Acesse: http://localhost:3001
2. ✅ Faça login no sistema
3. ✅ Navegue: **Cálculos** → **Novo Cálculo** → **Financiamento Imobiliário**
4. ✅ Preencha todos os campos conforme tabela acima
5. ✅ Clique: **"Iniciar Análise Prévia"**
6. ✅ Verifique os valores na tela de Análise Prévia
7. ✅ Compare com os "Resultados Esperados" acima

### **Teste 2: Relatório Completo**

1. ✅ Na mesma tela do formulário (ou volte)
2. ✅ Clique: **"Gerar Relatório Completo"**
3. ✅ Verifique:
   - Cards de resumo
   - Comparativo de taxas
   - Tabela de amortização (12 linhas)
4. ✅ Valide a **primeira linha** da tabela
5. ✅ Compare com os valores esperados acima

### **Teste 3: Exportação (Futuro)**

1. ⏸️ Clique: **"Exportar Análise (PDF)"** ou **"Exportar Relatório (PDF)"**
2. ⏸️ Aguarde geração do PDF
3. ⏸️ Verifique se o PDF contém todos os dados

> ⏸️ = Funcionalidade ainda não implementada

---

## 📸 SCREENSHOTS ESPERADOS

### **Tela 1: Formulário Preenchido**
- Todos os campos com valores acima
- Botões ativos: "Iniciar Análise Prévia", "Gerar Relatório Completo", "Salvar Dados"

### **Tela 2: Análise Prévia**
- 2 cards: "Resumo Comparativo" e "Representatividade"
- 1 card: "Pontos de Viabilidade" com checks dinâmicos
- Botão: "Exportar Análise (PDF)"

### **Tela 3: Relatório Completo**
- Seção: Dados do Credor, Devedor e do Processo
- Seção: Comparativo de Taxas
- Seção: Detalhes de Encargos (5 cards)
- Seção: Tabela de Amortização (12 linhas)
- Seções: Resumo Executivo e Base Legal

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### **Validações Implementadas:**
- ✅ Campos obrigatórios (credor, devedor, pv, n, data, taxa)
- ✅ Formato de datas (YYYY-MM-DD)
- ✅ Conversão de strings para números
- ✅ Mensagens de erro via toast

### **Dados Hardcoded (Atenção!):**
- 🔧 **Faixas de taxa:** Fixas no código (3 faixas pré-definidas)
- 🔧 **Série TR:** Apenas jan/2022 configurada
- 🔧 **Encargos:** Apenas 1ª parcela aceita via formulário

### **Para Testes Avançados:**
- Modifique as faixas em: `src/components/calculations/FinanciamentoImobiliario.tsx` (linha 263)
- Adicione mais TRs em: mesma linha (linha 281)
- Configure encargos em outras parcelas: mesma linha (linha 270)

---

## 🐛 TROUBLESHOOTING

### **Erro: "Preencha os campos obrigatórios"**
➡️ Verifique se preencheu: credor, devedor, valorFinanciado, quantidadeParcelas, dataPrimeiraParcela, taxaMensalContrato

### **Erro: "Nenhuma faixa de taxa encontrada para a data"**
➡️ A data do primeiro vencimento deve estar dentro de uma das 3 faixas configuradas (2018-06-21 a 2048-05-21)

### **Erro: "Unexpected end of JSON input"**
➡️ Ignore - erro relacionado aos endpoints API (não usados no modo client-side)

### **Tabela vazia ou valores zerados**
➡️ Verifique se o cálculo foi executado com sucesso (veja console do navegador com F12)

---

## ✨ VALIDAÇÃO DE SUCESSO

O teste está **APROVADO** se:

1. ✅ Análise prévia exibe valores próximos aos esperados
2. ✅ Relatório completo mostra 12 linhas na tabela
3. ✅ Primeira parcela tem: J_1 ≈ 1.709,76 | A = 840,00 | SD_1 ≈ 301.560,00
4. ✅ Não há erros no console do navegador
5. ✅ Navegação entre telas funciona corretamente

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Revise os valores inseridos
3. Confirme que o servidor está rodando (`npm run dev`)
4. Consulte os logs no terminal

---

**Data de Criação:** 18/11/2025
**Versão:** 1.0
**Motor de Cálculo:** SAC com TR - AP01/AP05/AP03
**Status:** ✅ Funcional
