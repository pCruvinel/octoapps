# 🔧 Plano de Refatoração - Motor de Cálculo OctoApps

> **Versão:** 1.0.0  
> **Data:** 2026-01-15  
> **Status:** Aguardando Aprovação

---

## 1. Diagnóstico Atual

### 1.1 Resumo da Auditoria

Após análise completa dos arquivos em `src/services/calculationEngine/strategies/`:

| Arquivo | Linhas | Status |
|---------|--------|--------|
| `base.strategy.ts` | 465 | ⚠️ Parcialmente Correto |
| `imobiliario.strategy.ts` | 622 | ⚠️ Gaps Identificados |
| `emprestimo.strategy.ts` | 252 | 🔴 Faltando XIRR |
| `cartao-rmc.strategy.ts` | 269 | ✅ Adequado |

### 1.2 Gaps Críticos Identificados

#### 🔴 GAP-001: Amortização SAC com Saldo Fixo (Imobiliário)

**Localização:** `imobiliario.strategy.ts:197`

```typescript
// ATUAL (ERRADO):
if (input.amortization_method === 'SAC') {
    amortization = input.amount_financed.div(input.total_installments);
    // ❌ Amortização FIXA, não considera correção monetária
}
```

**CORRETO (Target State):**
```typescript
// A amortização deve ser recalculada sobre o saldo CORRIGIDO dividido pelo prazo REMANESCENTE
amortization = correctedBalance.div(input.total_installments - n + 1);
```

**Impacto:** Erro de ~R$ 5.000 - R$ 15.000 em financiamentos de 30 anos com TR.

---

#### 🔴 GAP-002: Ausência do "Momento Zero" (t0) no Array de Fluxo

> ⚠️ **CRÍTICO:** Aplica-se a TODOS os módulos (Imobiliário, Veículos, Empréstimos)

**Localização:** 
- `base.strategy.ts:generateBankScenario()` e `generateRecalculatedScenario()`
- `imobiliario.strategy.ts:generateImobiliarioScenario()`
- `emprestimo.strategy.ts:generateBankScenario()` (herda de base)

**ATUAL:** O fluxo inicia em `n=1` (primeira parcela).

```typescript
// ATUAL (ERRADO):
for (let n = 1; n <= input.total_installments; n++) {
    // Parcela 1 é o primeiro registro - SEM t0!
}
```

**REGRA MATEMÁTICA:**
- **Linha 0 (t0):** Data do Contrato | Saldo = +Valor Financiado | Pagamento = 0
- **Linha 1 (t1):** Data 1º Vencimento | Saldo = (Anterior - Amort) | Pagamento = Parcela
- **Linha n (tn):** Data nº Vencimento | Saldo = 0 | Pagamento = Última Parcela

**Target State:**

```typescript
// CORRETO (TODOS OS MÓDULOS):
// Linha 0: Momento Zero (liberação do crédito)
table.push({
    n: 0,
    date: input.start_date,                    // Data do contrato/liberação
    opening_balance: new Decimal(0),           // Antes não havia saldo
    payment: new Decimal(0),                   // Sem pagamento no t0
    closing_balance: input.amount_financed,    // Saldo = +Valor Financiado
    // Para XIRR: cashflow = -amount_financed (banco empresta = saída)
});

// Linhas 1..n: Parcelas normais
for (let n = 1; n <= input.total_installments; n++) {
    // ... cálculo normal ...
}
```

**POR QUE É OBRIGATÓRIO:**
- **XIRR/TIR** exige fluxo negativo em t0 (liberação) e positivos em t1..tn (pagamentos)
- Sem t0, o algoritmo Newton-Raphson não converge
- Juros pro-rata da 1ª parcela dependem dos dias entre t0 e t1

**Impacto:** Sem Momento Zero, o cálculo da "Taxa Real" via XIRR **FALHARÁ** em todos os módulos.

---

#### 🔴 GAP-003: Ausência de XIRR/XTIR (Engenharia Reversa de Taxa)

**Localização:** `emprestimo.strategy.ts` (não existe)

**ATUAL:** O sistema usa a taxa informada no contrato diretamente.

```typescript
// ATUAL:
const originalInstallment = calculatePMT(
    input.amount_financed,
    input.contract_rate_monthly, // ❌ Assume que a taxa informada é a real
    input.total_installments
);
```

**Target State:** Implementar Newton-Raphson (XIRR) para descobrir a taxa real efetiva:

```typescript
// CORRETO:
// Dado: PV líquido (após tarifas), PMT informada → Encontrar taxa real
const realRate = calculateXIRR(
    input.amount_financed.minus(totalTariffs), // t0 negativo
    input.valorParcelaCobrada,                  // PMT fixo
    input.total_installments
);

// Se realRate > taxa_informada → Há capitalização oculta
```

**Impacto:** Fundamental para detectar capitalização diária e anatocismo.

---

#### 🟡 GAP-004: Fator NP (Correção Pro-Rata) da 1ª Parcela

**Localização:** `imobiliario.strategy.ts:176-269`

**ATUAL:** O sistema aplica correção monetária "cheia" em todas as parcelas.

**Target State:** A primeira parcela deve ter correção PROPORCIONAL aos dias decorridos entre liberação e 1º vencimento.

```typescript
// CORRETO:
const diasPrimeiraParcela = daysBetween(
    parseDate(input.start_date), 
    parseDate(input.first_payment_date)
);

// Se assinou dia 13 e vence dia 10, são 27 dias, não 30
const fatorNP = new Decimal(diasPrimeiraParcela).div(30);

// Correção da 1ª parcela:
if (n === 1) {
    correctionRate = correctionRate.times(fatorNP);
}
```

**Impacto:** Pequeno, mas afeta precisão pericial (~R$ 50 - R$ 200).

---

#### 🟡 GAP-005: Validação de Zeramento do Saldo (Prova Real)

**Localização:** Não existe em nenhum arquivo.

**Target State:** Após gerar a tabela, validar que `saldo_final ≈ 0`.

```typescript
// CORRETO:
function validateBalanceZeroing(table: AmortizationLineV3[]): void {
    const lastLine = table[table.length - 1];
    const tolerance = new Decimal('0.01'); // 1 centavo

    if (lastLine.closing_balance.abs().greaterThan(tolerance)) {
        console.warn(
            `[PROVA REAL FALHOU] Saldo final: R$ ${lastLine.closing_balance.toFixed(2)}`,
            `Esperado: R$ 0.00. Verifique precisão da taxa ou Momento Zero.`
        );
    }
}
```

**Impacto:** Ferramenta de QA para detectar erros de cálculo.

---

## 2. Plano de Refatoração - Imobiliário

### Tarefa 1: Implementar "Momento Zero" (t0) em TODOS os Módulos

> ⚠️ **Pré-requisito para XIRR funcionar**

**Arquivos:**
- `base.strategy.ts:generateBankScenario()` - Cenário AP01
- `base.strategy.ts:generateRecalculatedScenario()` - Cenário AP02
- `imobiliario.strategy.ts:generateImobiliarioScenario()` - Override específico

**Implementação:**
- [ ] Criar método `createMomentoZeroLine(input)` na `BaseStrategy`
- [ ] Adicionar linha n=0 em `generateBankScenario()` (afeta Veículos/Empréstimos)
- [ ] Adicionar linha n=0 em `generateRecalculatedScenario()` (afeta todos)
- [ ] Adicionar linha n=0 em `generateImobiliarioScenario()` (Imobiliário)
- [ ] Estrutura da linha:
  ```typescript
  { n: 0, date: start_date, opening_balance: 0, closing_balance: +amount_financed, payment: 0 }
  ```

**Estimativa:** 3h (todos os módulos)

---

### Tarefa 2: Corrigir Amortização SAC (Saldo Corrigido / Prazo Remanescente)

**Arquivo:** `imobiliario.strategy.ts:196-198`

- [ ] Alterar fórmula de amortização SAC:
  ```typescript
  // DE:
  amortization = input.amount_financed.div(input.total_installments);
  
  // PARA:
  amortization = correctedBalance.div(input.total_installments - n + 1);
  ```
- [ ] Testar com planilha CEF de referência

**Estimativa:** 1h

---

### Tarefa 3: Implementar Fator NP (Pro-rata 1ª Parcela)

**Arquivo:** `imobiliario.strategy.ts`

- [ ] Calcular dias entre `start_date` e `first_payment_date`
- [ ] Aplicar fator proporcional na correção da parcela 1
- [ ] Adicionar flag `use_prorata_correction`

**Estimativa:** 1h

---

### Tarefa 4: Adicionar Colunas de Índice na Tabela

**Arquivo:** `types.ts` (AmortizationLineV3)

- [ ] Adicionar campo `indexer_value?: Decimal` (valor do índice no mês)
- [ ] Adicionar campo `indexer_name?: string` ('TR', 'IPCA', etc.)
- [ ] Popular nos cenários AP01/AP02

**Estimativa:** 30min

---

## 3. Plano de Refatoração - Veículos/Empréstimos

### Tarefa 5: Criar Utilitário `calculateXIRR(cashflow)`

> **Dependência:** Tarefa 1 (Momento Zero) DEVE estar completa antes de testar XIRR

**Arquivo:** `src/services/calculationEngine/utils.ts`

- [ ] Implementar Newton-Raphson para XIRR
- [ ] Input: array de `{ date: string, value: Decimal }` onde:
  - `t0`: value = -amount_financed (negativo = banco empresta)
  - `t1..tn`: value = +payment (positivo = cliente paga)
- [ ] Output: `{ rateMonthly: Decimal, rateAnnual: Decimal }`
- [ ] Tolerance: 1e-8, max 100 iterações

**Código Base:**
```typescript
export function calculateXIRR(
    cashflows: Array<{ date: string; value: Decimal }>
): { rateMonthly: Decimal; rateAnnual: Decimal } {
    let rate = new Decimal('0.01'); // Initial guess: 1% a.m.
    
    for (let i = 0; i < MAX_NEWTON_ITERATIONS; i++) {
        let npv = new Decimal(0);
        let derivative = new Decimal(0);
        
        const baseDate = parseDate(cashflows[0].date);
        
        for (const cf of cashflows) {
            const days = daysBetween(baseDate, parseDate(cf.date));
            const t = new Decimal(days).div(30); // Meses fracionários
            
            const discountFactor = new Decimal(1).plus(rate).pow(t);
            npv = npv.plus(cf.value.div(discountFactor));
            derivative = derivative.minus(
                cf.value.times(t).div(discountFactor.times(new Decimal(1).plus(rate)))
            );
        }
        
        if (npv.abs().lessThan(NEWTON_TOLERANCE)) {
            break;
        }
        
        rate = rate.minus(npv.div(derivative));
    }
    
    return {
        rateMonthly: rate,
        rateAnnual: monthlyToAnnualRate(rate),
    };
}
```

**Estimativa:** 3h

---

### Tarefa 6: Integrar XIRR no EmprestimoStrategy

**Arquivo:** `emprestimo.strategy.ts`

- [ ] No `calculatePreview()`, calcular taxa real via XIRR:
  ```typescript
  const cashflows = [
      { date: input.start_date, value: input.amount_financed.negated() },
      ...Array(input.total_installments).fill(null).map((_, i) => ({
          date: addMonths(parseDate(input.first_payment_date), i),
          value: input.valorParcelaCobrada,
      })),
  ];
  
  const realRate = calculateXIRR(cashflows);
  
  // Flag de anatocismo:
  if (realRate.rateMonthly.greaterThan(input.contract_rate_monthly.times(1.05))) {
      preview.flags.anatocism_detected = true;
  }
  ```
- [ ] Exibir taxa real vs taxa informada no preview

**Estimativa:** 2h

---

### Tarefa 7: Ocultar Campos de Capitalização Diária (UI)

**Arquivo:** `src/components/calculations/` (wizard)

- [ ] Se `capitalization_mode === 'MENSAL'`, esconder campos:
  - "Dias Acumulados"
  - "Fator NP"
- [ ] Mostrar apenas quando `capitalization_mode === 'DIARIA'`

**Estimativa:** 1h

---

### Tarefa 8: Implementar Validação de Zeramento

**Arquivo:** `base.strategy.ts`

- [ ] Criar método `validateBalanceZeroing(table)`
- [ ] Chamar ao final de `generateBankScenario()` e `generateRecalculatedScenario()`
- [ ] Logar warning se saldo final != 0

**Estimativa:** 30min

---

## 4. Casos de Teste (Golden Samples)

### Caso 1: Financiamento Imobiliário SAC com TR

**Input:**
```json
{
  "amount_financed": 250000,
  "start_date": "2020-01-15",
  "first_payment_date": "2020-02-10",
  "total_installments": 360,
  "contract_rate_monthly": 0.008,
  "indexer": "TR",
  "amortization_method": "SAC"
}
```

**Validações:**
- [ ] Linha 0 (t0) existe com valor negativo de R$ 250.000
- [ ] Correção primeira parcela é pro-rata (26 dias)
- [ ] Amortização parcela 1 ≠ parcela 180 (recalculada)
- [ ] Saldo devedor final = R$ 0,00 ± 0,01

---

### Caso 2: Empréstimo Veículo PRICE com Detectção XIRR

**Input:**
```json
{
  "amount_financed": 50000,
  "start_date": "2023-06-01",
  "first_payment_date": "2023-07-01",
  "total_installments": 48,
  "contract_rate_monthly": 0.0249,
  "valorParcelaCobrada": 1799,
  "capitalization_mode": "MENSAL"
}
```

**Validações:**
- [ ] XIRR calculado retorna ~2.49% (confirma taxa informada)
- [ ] Se PMT=1900 (diferente do calculado), XIRR mostra taxa real > 2.49%
- [ ] Flag `anatocism_detected = true` se taxa real > taxa informada × 1.05
- [ ] Saldo devedor final = R$ 0,00 ± 0,01

---

## 5. Cronograma Sugerido

| Fase | Tarefas | Estimativa |
|------|---------|------------|
| Sprint 1 | Tarefas 1, 2, 3, 4 (Imobiliário) | 4.5h |
| Sprint 2 | Tarefas 5, 6 (XIRR) | 5h |
| Sprint 3 | Tarefas 7, 8 (UI + Validação) | 1.5h |
| **Total** | | **11h** |

---

## 6. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `types.ts` | Adicionar campos `indexer_value`, `indexer_name` |
| `utils.ts` | Adicionar função `calculateXIRR()` |
| `base.strategy.ts` | Adicionar `validateBalanceZeroing()` |
| `imobiliario.strategy.ts` | Momento Zero, SAC corrigido, Fator NP |
| `emprestimo.strategy.ts` | Integrar XIRR no preview |

---

## 7. Documentação a Atualizar

| Arquivo | Alteração |
|---------|-----------|
| `MODULO_IMOBILIARIO_TECNICO.md` | Adicionar seção "Momento Zero (t0)" e corrigir fórmula SAC |
| `MODULO_VEICULOS_TECNICO.md` | Adicionar seção "Engenharia Reversa de Taxa (XIRR)" |

---

*Documento gerado em 2026-01-15 | Motor de Cálculo v3.3.0 (Target)*
