# Módulo de Cálculo Revisional - Veículos

> **Documentação Técnica para Validação**  
> Versão: 3.3.0 | Data: 2026-01-15
> 🆕 **v3.3.0**: XIRR para engenharia reversa de taxa, Momento Zero obrigatório

---

## 📋 Índice
1. [Campos de Entrada (Step 1)](#1-campos-de-entrada-step-1)
2. [Conciliação de Pagamentos (Step 2)](#2-conciliação-de-pagamentos-step-2)
3. [Fórmulas de Cálculo](#3-fórmulas-de-cálculo)
4. [Estrutura dos Apêndices](#4-estrutura-dos-apêndices)
5. [Fluxo de Validação](#5-fluxo-de-validação)

---

## 1. Campos de Entrada (Step 1)

### 1.1 Dados do Contrato

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `credor` | string | ✅ | Nome do banco/financeira |
| `devedor` | string | ✅ | Nome do cliente |
| `contratoNumero` | string | ✅ | Número do contrato |
| `tipoContrato` | enum | ✅ | `VEICULO` |

### 1.2 Dados Financeiros

| Campo | Tipo | Obrigatório | Exemplo | Descrição |
|-------|------|-------------|---------|-----------|
| `valorFinanciado` | number | ✅ | 50000.00 | Valor total financiado (PV) |
| `valorBem` | number | ⚪ | 65000.00 | Valor de mercado do veículo |
| `valorEntrada` | number | ⚪ | 15000.00 | Valor da entrada |
| `prazoMeses` | number | ✅ | 48 | Prazo total em meses (n) |
| `taxaContratoMensal` | number | ✅ | 2.49 | Taxa de juros mensal (%) |
| `taxaContratoAnual` | number | ⚪ | | Calculado se não informado |
| `valorParcelaCobrada` | number | ⚪ | 1350.00 | Valor da parcela informado no contrato |

### 1.3 Datas

| Campo | Tipo | Obrigatório | Formato | Descrição |
|-------|------|-------------|---------|-----------|
| `dataContrato` | string | ✅ | YYYY-MM-DD | Data de assinatura |
| `dataLiberacao` | string | ⚪ | YYYY-MM-DD | Data da liberação do crédito |
| `dataPrimeiroVencimento` | string | ✅ | YYYY-MM-DD | Data do 1º vencimento |

### 1.4 Sistema de Amortização

| Campo | Tipo | Padrão | Opções |
|-------|------|--------|--------|
| `sistemaAmortizacao` | enum | `PRICE` | `SAC`, `PRICE`, `SACRE` |
| `capitalizacao` | enum | `MENSAL` | `MENSAL`, `DIARIA` |
| `indexador` | enum | `NENHUM` | `NENHUM`, `TR`, `IPCA`, `IGP-M` |

### 1.5 Tarifas e Seguros

| Campo | Tipo | Base Legal | Descrição |
|-------|------|------------|-----------|
| `tarifaTAC` | number | CMN 3.518/2007 | Tarifa de Abertura de Crédito |
| `tarifaAvaliacao` | number | | Tarifa de avaliação do bem |
| `tarifaRegistro` | number | | Registro do contrato |
| `seguroMIP` | number | | Seguro Morte/Invalidez |
| `seguroDFI` | number | | Seguro Danos Físicos (se houver) |
| `taxaAdministrativa` | number | | Taxa mensal de administração |

### 1.6 Opções de Cálculo

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `usarTaxaBacen` | boolean | `true` | Usar taxa de mercado BACEN SGS |
| `usarJurosSimples` | boolean | `false` | Método Gauss (juros simples) |
| `expurgarTarifas` | boolean | `true` | Remover tarifas abusivas do recálculo |
| `restituicaoEmDobro` | boolean | `true` | Art. 42 CDC (gera AP04) |

### 1.7 Encargos Moratórios (Período de Atraso)

| Campo | Tipo | Padrão | Base Legal | Descrição |
|-------|------|--------|------------|-----------|
| `jurosMora` | number | **1%** | Art. 406 CC | Juros de mora ao mês |
| `multaMoratoria` | number | **2%** | Art. 52 §1º CDC | Multa moratória única |
| `encargosIncidirSobrePrincipalCorrigido` | boolean | `false` | - | Se `true`, mora incide sobre principal + correção; se `false`, só sobre o principal |

> ⚠️ **Importante**: Estes parâmetros são usados quando uma parcela é classificada como "VENCIDA" ou "Paga em Atraso" na conciliação. Servem para calcular o que o banco **deveria** ter cobrado de encargos vs. o que **cobrou** efetivamente.

---

## 2. Conciliação de Pagamentos (Step 2)

### 2.1 Estrutura da Grade

A tabela de conciliação é gerada automaticamente após Step 1.

| Coluna | Tipo | Editável | Descrição |
|--------|------|----------|-----------|
| `Nº` | number | ❌ | Número da parcela |
| `Vencimento` | date | ❌ | Data de vencimento original |
| `Parcela (Contrato)` | currency | ❌ | Valor previsto no contrato |
| `Data Pgto Real` | date | ✅ | Data do pagamento efetivo |
| **`Dias Atraso`** | number | ❌ | Dias entre vencimento e pagamento |
| **`Juros/Multa`** | currency | ❌ | Encargos moratórios apurados |
| `Valor Pago Real` | currency | ✅ | Valor efetivamente pago |
| `Amort. Extra` | currency | ✅ | Amortização extraordinária |
| `Status` | select | ✅ | `Pago`, `Em Aberto`, `Atraso`, `Renegociado` |

> **Colunas de Transparência**: `Dias Atraso` e `Juros/Multa` são calculadas automaticamente pelo sistema para que o usuário veja como os encargos estão sendo separados do principal.

### 2.2 Classificação de Situação (Data do Cálculo)

```
PAGA      = Parcela com dados de pagamento confirmados pelo perito
VENCIDA   = Vencimento < Data do Cálculo E sem registro de pagamento
VINCENDA  = Vencimento >= Data do Cálculo
```

### 2.3 Dados Enviados ao Motor

```typescript
conciliacao?: Array<{
    numeroParcela: number;      // 1, 2, 3...
    dataPagamento?: string;     // YYYY-MM-DD
    valorPago?: number;         // Valor efetivo
    isPago: boolean;            // Confirmado pelo perito
}>;
dataCalculo?: string;           // YYYY-MM-DD (default: data atual)
```

### 2.4 Como a Conciliação Influencia os Apêndices

> ⚠️ **Crítico**: A Tabela de Conciliação é o **coração do comportamento "Realizado"** do cliente. Ela fornece os dados fáticos (datas e valores reais) que são confrontados com os dados pactuados.

#### 🎯 AP03 – Demonstrativo das Diferenças (Influência DIRETA e TOTAL)

**Mais impactado** - sua existência depende inteiramente da conciliação.

```
Diferença[k] = Valor Pago Real[k] - Valor Devido[k]
              └─ Conciliação      └─ AP02 (Recálculo)
```

- **Atualização instantânea**: Alterar um valor na conciliação recalcula diferenças imediatamente
- **Total nominal**: Soma de todas as diferenças positivas (indébito)

#### 🕐 AP01 – Evolução Original (Influência nos ENCARGOS DE MORA)

Embora retrate o cenário do banco, a conciliação dita o **"período de anormalidade"**.

- **Encargos moratórios**: `Data Pgto Real` vs `Vencimento` → Calcula juros de mora e multa
- **Separação**: Sistema separa encargos moratórios do pagamento do principal
- **Fator NP (Capitalização Diária)**: 
  ```
  Fator NP[k] = (1+i)^(dias/30) - 1
                     └─ Data Pgto - Data Vencimento (da conciliação)
  ```

#### 💰 AP02 – Recálculo Técnico (Influência via AMORTIZAÇÃO EXTRA)

Define o "Valor Devido" justo considerando eventos extraordinários.

- **Amort. Extra**: Campo na conciliação que reduz diretamente o Saldo Devedor
- **Exemplo**: Aporte de R$ 50.000,00 → Reduz saldo → Diminui juros futuros
- **Recálculo em cascata**: Todas as linhas subsequentes são reprocessadas com novo saldo

#### ⚖️ AP04 e AP05 – Restituição (Influência na COMPENSAÇÃO)

Aplicam o crédito do AP03 para abater a dívida mensalmente.

- **Data Pagamento**: Define quando aplicar o desconto no saldo devedor
- **Situação**: `PAGA`/`VENCIDA` determina se compensa ou não
- **AP04 (Dobro)**: `Crédito = Diferença[k] × 2` (Art. 42 CDC)
- **AP05 (Simples)**: `Crédito = Diferença[k] × 1` (Art. 368 CC)
- **Aceleração**: Compensação mensal acelera quitação antecipada

#### 🔄 Lógica de "RENEGOCIADO" (Influência no Novo PV)

Status `RENEGOCIADO` na conciliação interrompe o cálculo atual.

```
Saldo Fidedigno[k] → Novo PV do próximo contrato
     └─ Ignora saldo imposto pelo banco na renegociação abusiva
```

- **Cadeia de contratos**: Sistema usa saldo fidedigno como base, não o saldo do banco
- **Detecção de abuso**: Compara PV da renegociação com saldo técnico real

---

## 3. Fórmulas de Cálculo

### 3.1 Sistema PRICE (Parcelas Fixas)

#### PMT (Valor da Parcela)
```
PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]

Onde:
  PV = Valor Financiado (Principal)
  i  = Taxa mensal (decimal, ex: 0.0249 para 2.49%)
  n  = Prazo em meses
```

#### Exemplo Numérico
```
PV = R$ 50.000,00
i  = 2.49% = 0.0249
n  = 48 meses

PMT = 50000 × [0.0249 × (1.0249)^48] / [(1.0249)^48 - 1]
PMT = 50000 × [0.0249 × 3.2476] / [3.2476 - 1]
PMT = 50000 × 0.08087 / 2.2476
PMT = 50000 × 0.03598
PMT = R$ 1.799,00
```

#### Decomposição Mensal
```
Juros[k]        = Saldo[k-1] × i
Amortização[k]  = PMT - Juros[k]
Saldo[k]        = Saldo[k-1] - Amortização[k]
```

### 3.2 Taxa de Mercado BACEN

Série SGS utilizada para Veículos: **20749** (Aquisição de Veículos - PF)

```
Taxa Mercado Mensal = Valor SGS / 100
Taxa Mercado Anual = ((1 + Taxa Mensal)^12 - 1) × 100
```

### 3.3 Sobretaxa

```
Sobretaxa (%) = ((Taxa Contrato - Taxa Mercado) / Taxa Mercado) × 100

Exemplo:
  Taxa Contrato = 2.49% a.m. → 34.06% a.a.
  Taxa Mercado  = 1.69% a.m. → 22.27% a.a.
  Sobretaxa = ((34.06 - 22.27) / 22.27) × 100 = 52.9%
```

### 3.4 Diferença por Parcela

```
Diferença[k] = Parcela Cobrada[k] - Parcela Devida[k]
Diferença Acumulada[k] = Σ Diferença[1..k]  (só positivas)
```

### 3.5 Compensação AP04 (Art. 42 CDC - Dobro)

```
Para cada parcela k:
  Juros Devidos[k] = Saldo Compensado[k-1] × Taxa Mercado
  Amort. Normal[k] = max(0, Prestação Paga[k] - Juros Devidos[k])
  Crédito Dobro[k] = Diferença[k] × 2
  Amort. Compensada[k] = Amort. Normal[k] + Crédito Dobro[k]
  Saldo Compensado[k] = Saldo Compensado[k-1] - Amort. Compensada[k]

Se Saldo Compensado < 0:
  Saldo Credor = |Saldo Compensado|
  → Quitação Antecipada detectada
```

### 3.6 Compensação AP05 (Art. 368 CC - Simples)

```
Igual ao AP04, mas:
  Crédito Simples[k] = Diferença[k] × 1

Para VINCENDAS:
  Recalcular PMT com Saldo Fidedigno:
  Nova Prestação = Saldo Atual × [i × (1+i)^restante] / [(1+i)^restante - 1]
```

### 3.7 XIRR - Engenharia Reversa da Taxa (Novo v3.3.0)

> 🆕 **Funcionalidade Crítica**: Descobrir a taxa REAL efetiva do contrato

O XIRR (Extended Internal Rate of Return) permite calcular a taxa real cobrada,
ignorandoa taxa nominal escrita no contrato.

```typescript
// Estrutura do fluxo de caixa para XIRR:
cashflows = [
    { date: data_liberacao, value: -valor_financiado }, // t0: banco empresta (negativo)
    { date: vencimento_1, value: +parcela },           // t1: cliente paga (positivo)
    { date: vencimento_2, value: +parcela },           // t2: cliente paga
    // ... até tn
];

// Resultado:
const result = calculateXIRR(cashflows);
// result.rateMonthly = taxa real mensal
// result.rateAnnual = taxa real anual

// Detecção de anatocismo:
if (taxa_real > taxa_contrato * 1.05) {
    // Há capitalização oculta!
    flags.anatocism_detected = true;
}
```

**Momento Zero (t0) Obrigatório:**
- Linha 0: Data do Contrato | Saldo = +Valor Financiado | Pagamento = 0
- Sem t0, o algoritmo Newton-Raphson não converge

---

## 4. Estrutura dos Apêndices

### AP01 - Evolução Original (Cenário Banco)

Reproduz exatamente o que o banco cobrou.

| Coluna | Descrição |
|--------|-----------|
| Nº | Número da parcela |
| Vencimento | Data de vencimento |
| Saldo Anterior | Saldo devedor antes da parcela |
| Juros | Juros do mês (taxa contrato) |
| Amortização | Parcela - Juros |
| Parcela | Valor total da parcela |
| Saldo Devedor | Após amortização |
| Dias | Dias entre parcelas (XTIR) |
| Fator NP | Fator não periódico (XTIR) |

**Totais:**
- Total Juros (Banco)
- Total Pago (Banco)

---

### AP02 - Recálculo (Cenário Justo)

Valores que deveriam ter sido cobrados.

| Coluna | Descrição |
|--------|-----------|
| Nº | Número da parcela |
| Vencimento | Data de vencimento |
| Saldo Anterior | Saldo devedor |
| Juros | Juros (taxa mercado BACEN) |
| Amortização | Amortização recalculada |
| Prestação Devida | PMT recalculado |
| Saldo Devedor | Após amortização |

**Totais:**
- Total Juros (Justo)
- Total Devido

---

### AP03 - Diferenças Excedentes

Comparativo mês a mês.

| Coluna | Descrição |
|--------|-----------|
| Nº | Número da parcela |
| Vencimento | Data de vencimento |
| Situação | `PAGA` / `VENCIDA` / `VINCENDA` |
| Valor Pago | Parcela efetivamente paga |
| Valor Devido | Parcela recalculada |
| Diferença | Pago - Devido |
| Dif. Acumulada | Soma das diferenças |

**Totais:**
- Indébito Nominal
- Indébito Corrigido (INPC) - se aplicável

---

### AP04 - Restituição em Dobro (Art. 42 CDC)

Compensação mensal com crédito em dobro.

| Coluna | Descrição |
|--------|-----------|
| Nº | Número da parcela |
| Situação | `PAGA` / `VENCIDA` / `VINCENDA` |
| Pago | Valor efetivamente pago |
| Devido | Valor recalculado |
| Dif. (2x) | Diferença × 2 |
| Juros | Juros sobre saldo corrente |
| Amort. Comp. | Amortização + Crédito Dobro |
| Saldo | Saldo após compensação ou `CR` (credor) |

**Destaques visuais:**
- 🔹 Linha de quitação antecipada (fundo verde)
- 💰 Saldo Credor (texto verde com ícone)

---

### AP05 - Restituição Simples (Art. 368 CC)

Compensação mensal simples.

| Coluna | Descrição |
|--------|-----------|
| Nº | Número da parcela |
| Situação | Classificação |
| Pago | Valor efetivamente pago |
| Devido | Valor devido (vincendas recalculadas) |
| Diferença | Diferença simples |
| Juros | Juros sobre saldo |
| Amort. Comp. | Amortização compensada |
| Saldo | Real Saldo Devedor |

**Resultado Final:**
- Real Saldo Devedor ou Saldo Credor ao cliente

---

## 5. Fluxo de Validação

### Checklist de Testes

```
□ 1. ENTRADA DE DADOS
  □ Valor financiado = exatamente o do contrato
  □ Taxa mensal = verificar se anual/mensal confunde
  □ Prazo = confirmado no contrato
  □ Datas consistentes (liberação < 1º vencimento)

□ 2. TAXA BACEN
  □ Série correta (20749 para veículos)
  □ Taxa mensal coerente (~1.5% - 2.0%)
  □ Data de referência próxima ao contrato

□ 3. PMT CALCULADO
  □ Comparar com valor informado pelo banco
  □ Diferença < 1% é aceitável (arredondamentos)

□ 4. SOBRETAXA
  □ > 50% = certamente abusivo
  □ > 30% = provavelmente abusivo
  □ Verificar se % faz sentido

□ 5. AP01 (BANCO)
  □ Primeira linha: Saldo = Valor Financiado
  □ Última linha: Saldo ≈ 0
  □ Juros decrescentes no PRICE

□ 6. AP02 (JUSTO)
  □ PMT menor que AP01
  □ Mesma estrutura, taxa diferente

□ 7. AP03 (DIFERENÇAS)
  □ Situação correta por data
  □ Diferença = AP01.parcela - AP02.parcela
  □ Acumulada crescente

□ 8. AP04 (DOBRO)
  □ Diferença multiplicada por 2
  □ Saldo diminui mais rápido
  □ Procurar linha de quitação

□ 9. AP05 (SIMPLES)
  □ Diferença simples (1:1)
  □ Vincendas recalculadas
  □ Real Saldo Devedor final
```

---

## Referências Legais

| Artigo | Fundamento |
|--------|------------|
| Art. 42 CDC | Restituição em dobro do indébito |
| Art. 368 CC | Compensação de débitos |
| Art. 389 CC | Atualização monetária |
| Súmula 472 STJ | Não cumulação de encargos |
| CMN 3.518/2007 | Vedação de TAC/TEC |
| Série SGS 20749 | Taxa média veículos PF |

---

> **Documento gerado para validação técnica do motor de cálculo v3.1.0**
