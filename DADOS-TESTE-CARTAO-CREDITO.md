# Dados para Teste - Revisão de Cartão de Crédito

Este documento contém cenários de teste realistas para a funcionalidade de Revisão de Cartão de Crédito, com dados de entrada e resultados esperados.

---

## 📋 Cenário 1: Rotativo Simples com Taxas Abusivas

### Dados de Entrada

#### Informações Básicas
- **Credor**: Banco Exemplo S.A.
- **Devedor**: João da Silva Santos
- **Número do Cartão**: **** **** **** 1234
- **Número do Processo**: 0001234-56.2024.8.26.0100
- **Data do Cálculo**: 01/01/2024

#### Dados do Cartão
- **Saldo Devedor**: R$ 5.000,00
- **Limite Total do Cartão**: R$ 10.000,00
- **Limite Disponível**: R$ 5.000,00

#### Dados da Fatura
- **Data de Início de Análise**: 01/01/2023
- **Data da Última Fatura**: 01/12/2023
- **Saldo Anterior**: R$ 4.500,00
- **Saldo Financiado**: R$ 5.000,00
- **Data de Pagamento**: 15/01/2024
- **Dia de Vencimento**: 10
- **Total da Fatura**: R$ 5.850,00
- **Pagamento Mínimo**: R$ 750,00 (15%)
- **Consumos/Despesas**: R$ 1.200,00

#### Encargos
- **Anuidade**: R$ 480,00 (anual)
- **Seguro**: R$ 25,00 (mensal)
- **Tarifas**: R$ 15,00 (mensal)
- **IOF**: R$ 35,00

#### Taxas e Juros
- **Juros do Rotativo**: 10,50% a.m.
- **Juros Remuneratórios de Atraso**: 12,00% a.m.
- **Taxa de Juros de Parcelamento**: 6,99% a.m.
- **Juros de Mora**: 1,00% a.m.
- **Multa de Inadimplência**: 2,00%

### Resultados Esperados (Análise Prévia - 12 meses)

#### Taxas Identificadas
- **Taxa Cobrada Mensal**: 10,50%
- **Taxa de Mercado Referência**: 5,00%
- **Sobretaxa (p.p.)**: 5,50 pontos percentuais
- **Percentual Acima do Mercado**: 110,00%
- **CET Mensal**: ~10,92% (considerando encargos)
- **CET Anual**: ~244,48%

#### Projeção de Juros (12 meses)
- **Total Juros Cobrado**: R$ 8.504,53
- **Total Juros Devido (taxa mercado)**: R$ 4.325,95
- **Diferença (Restituição)**: R$ 4.178,58
- **Total de Encargos**: R$ 520,00 (anuidade + 12×seguro + 12×tarifas)

#### Indicadores de Abusividade
- ✅ **Anatocismo Detectado**: Sim (juros sobre juros mensal)
- ⚠️ **Taxa Abusiva**: Sim (110% acima do mercado)
- ⚠️ **Abusividade Caracterizada**: Taxa cobrada > 150% da taxa de mercado? Não, mas próximo ao limite

#### Observações Esperadas
- Sistema deve alertar sobre cobrança de juros capitalizados mensalmente
- Taxa está 110% acima do mercado, próximo ao limite de 150% para caracterizar abusividade
- Encargos mensais somam R$ 43,33 (seguro + tarifa + anuidade proporcional)

---

## 📋 Cenário 2: Parcelamento de Fatura

### Dados de Entrada

#### Informações Básicas
- **Credor**: Banco Brasil Premium
- **Devedor**: Maria Oliveira Costa
- **Número do Cartão**: **** **** **** 5678
- **Número do Processo**: 0009876-54.2024.8.26.0200
- **Data do Cálculo**: 15/02/2024

#### Dados do Cartão
- **Saldo Devedor**: R$ 8.000,00
- **Limite Total do Cartão**: R$ 15.000,00
- **Limite Disponível**: R$ 7.000,00

#### Dados da Fatura
- **Data de Início de Análise**: 01/06/2023
- **Data da Última Fatura**: 01/02/2024
- **Parcelamentos**: Fatura parcelada em 12x de R$ 742,00
- **Total da Fatura**: R$ 8.904,00
- **Consumos/Despesas**: R$ 2.500,00

#### Encargos
- **Anuidade**: R$ 0,00 (isenta)
- **Seguro**: R$ 45,00 (mensal)
- **Tarifas**: R$ 0,00

#### Taxas e Juros
- **Taxa de Juros de Parcelamento**: 5,99% a.m.
- **Juros do Rotativo**: 8,50% a.m. (caso não pague parcelamento)

### Resultados Esperados (Análise Prévia - 12 meses)

#### Cálculo do Parcelamento (Sistema PRICE)
- **Valor Parcelado**: R$ 8.000,00
- **Parcelas**: 12
- **Taxa Cobrada**: 5,99% a.m.
- **Taxa de Mercado**: 5,00% a.m.

#### Valores Calculados
- **Parcela Cobrada (PMT)**: R$ 742,00
- **Parcela Devida (taxa mercado)**: R$ 889,20
- **Total Pago**: R$ 8.904,00
- **Total Devido**: R$ 10.670,40
- **Juros Cobrados**: R$ 904,00
- **Juros Devidos**: R$ 2.670,40
- **Diferença**: R$ 1.766,40 (valor a mais pago pelo consumidor)

#### Saldo Devedor Decrescente
| Mês | Saldo Cobrado | Saldo Devido | Diferença |
|-----|---------------|--------------|-----------|
| 1   | R$ 7.737,92   | R$ 7.510,80  | R$ 227,12 |
| 6   | R$ 4.321,56   | R$ 4.089,23  | R$ 232,33 |
| 12  | R$ 0,00       | R$ 0,00      | R$ 0,00   |

#### Indicadores
- **Total de Encargos**: R$ 540,00 (12× seguro)
- **CET Mensal do Parcelamento**: ~6,35%
- **Sobretaxa**: 0,99 p.p.
- **Percentual Acima do Mercado**: 19,80%

---

## 📋 Cenário 3: Rotativo com Pagamento Mínimo

### Dados de Entrada

#### Informações Básicas
- **Credor**: Financeira Crédito Fácil
- **Devedor**: Carlos Eduardo Ferreira
- **Número do Cartão**: **** **** **** 9012
- **Data do Cálculo**: 20/03/2024

#### Dados do Cartão
- **Saldo Devedor**: R$ 2.000,00
- **Limite Total do Cartão**: R$ 5.000,00

#### Dados da Fatura
- **Data de Início de Análise**: 01/09/2023
- **Pagamento Mínimo**: R$ 300,00 (15% do saldo)
- **Total da Fatura**: R$ 2.450,00

#### Taxas e Juros
- **Juros do Rotativo**: 15,00% a.m.
- **Juros de Mora**: 1,00% a.m.
- **Multa de Inadimplência**: 2,00%

### Resultados Esperados (Análise Prévia - 12 meses)

#### Simulação com Pagamento Mínimo (15%)
Com pagamento de apenas 15% mensal, o saldo cresce exponencialmente:

| Mês | Saldo Inicial | Juros 15% | Pag. Mínimo 15% | Saldo Final |
|-----|---------------|-----------|-----------------|-------------|
| 1   | R$ 2.000,00   | R$ 300,00 | R$ 300,00       | R$ 2.000,00 |
| 2   | R$ 2.000,00   | R$ 300,00 | R$ 300,00       | R$ 2.000,00 |
| 12  | R$ 2.000,00   | R$ 300,00 | R$ 300,00       | R$ 2.000,00 |

**Observação**: Com pagamento mínimo de 15% e juros de 15%, o saldo se mantém estável (cenário de "bicicleta" da dívida).

#### Totais (12 meses)
- **Total Pago**: R$ 3.600,00 (12× R$ 300,00)
- **Saldo Ainda Devendo**: R$ 2.000,00
- **Total Juros Pagos**: R$ 3.600,00
- **Total Desembolsado**: R$ 5.600,00 (para quitar dívida de R$ 2.000,00)
- **Juros Devidos (taxa 5%)**: R$ 692,10
- **Diferença para Restituição**: R$ 2.907,90

#### Indicadores
- ⚠️ **Taxa Extremamente Abusiva**: 200% acima do mercado
- ⚠️ **Anatocismo Grave**: Juros capitalizados mensalmente
- ⚠️ **Armadilha do Pagamento Mínimo**: Cliente pagou R$ 3.600 e ainda deve R$ 2.000

---

## 📋 Cenário 4: Caso com Múltiplos Encargos

### Dados de Entrada

#### Informações Básicas
- **Credor**: Banco Universal Nacional
- **Devedor**: Ana Paula Rodrigues
- **Número do Cartão**: **** **** **** 3456
- **Data do Cálculo**: 10/04/2024

#### Dados do Cartão
- **Saldo Devedor**: R$ 12.000,00
- **Limite Total**: R$ 20.000,00

#### Dados da Fatura
- **Parcelamentos**: Fatura parcelada em 24x
- **Saques em Espécie**: R$ 1.500,00 (08/03/2024)
- **Total da Fatura**: R$ 14.280,00

#### Encargos (Múltiplos)
- **Anuidade**: R$ 720,00 (anual)
- **Seguro Proteção Financeira**: R$ 89,00 (mensal)
- **Seguro Perda e Roubo**: R$ 35,00 (mensal)
- **Tarifa de Avaliação Emergencial**: R$ 49,90 (única)
- **Tarifa de Saque**: R$ 25,00 (por saque)
- **IOF sobre Saque**: R$ 45,00

#### Taxas
- **Juros de Parcelamento de Fatura**: 7,50% a.m.
- **Juros sobre Saque (rotativo)**: 11,99% a.m.

### Resultados Esperados (Análise Prévia - 12 meses)

#### Total de Encargos (12 meses)
- **Anuidade proporcional**: R$ 720,00
- **Seguros**: R$ 1.488,00 (12× R$ 124,00)
- **Tarifas**: R$ 74,90
- **IOF**: R$ 45,00
- **Total de Encargos**: R$ 2.327,90

#### Cálculo do Parcelamento
- **Valor Base**: R$ 12.000,00
- **Parcelas**: 24
- **Taxa**: 7,50% a.m.
- **Parcela Mensal**: R$ 768,00
- **Total a Pagar**: R$ 18.432,00
- **Total Juros**: R$ 6.432,00

#### Alertas Esperados
- ⚠️ **Múltiplos Seguros**: Verificar se foram contratados com anuência expressa
- ⚠️ **Tarifa de Avaliação**: Verificar legalidade (pode ser vedada)
- ⚠️ **Encargos Elevados**: R$ 2.327,90 em 12 meses (19,4% do saldo)
- ⚠️ **CET Elevado**: Considerando todos os encargos, CET > 9% a.m.

---

## 📋 Cenário 5: Rotativo com Taxa no Limite Legal

### Dados de Entrada

#### Informações Básicas
- **Credor**: Banco Consciente S.A.
- **Devedor**: Roberto Almeida Santos
- **Número do Cartão**: **** **** **** 7890
- **Data do Cálculo**: 25/05/2024

#### Dados do Cartão
- **Saldo Devedor**: R$ 3.500,00
- **Limite Total**: R$ 8.000,00

#### Taxas
- **Juros do Rotativo**: 7,50% a.m. (próximo ao limite de 150% do mercado)

### Resultados Esperados

#### Análise de Abusividade
- **Taxa de Mercado**: 5,00% a.m.
- **Taxa Cobrada**: 7,50% a.m.
- **Sobretaxa**: 2,50 p.p.
- **Percentual Acima**: 50,00%
- **Status**: ✅ Dentro do limite (< 150%)

#### Projeção 12 Meses
- **Total Juros Cobrado**: R$ 2.190,55
- **Total Juros Devido**: R$ 1.731,52
- **Diferença**: R$ 459,03
- **Parecer**: Taxa elevada mas não caracteriza abusividade manifesta

---

## 🧪 Testes Automatizados - Casos Extremos

### Teste 1: Valores Mínimos
- **Saldo**: R$ 0,01
- **Taxa**: 0,01% a.m.
- **Esperado**: Sistema deve calcular sem erros, mesmo com valores muito pequenos

### Teste 2: Valores Máximos
- **Saldo**: R$ 1.000.000,00
- **Taxa**: 20,00% a.m.
- **Esperado**: Sistema deve suportar valores grandes e taxas altas

### Teste 3: Taxa Zero
- **Saldo**: R$ 5.000,00
- **Taxa**: 0,00% a.m.
- **Esperado**: Juros = 0, diferença = 0

### Teste 4: Período Longo
- **Meses**: 60 (5 anos)
- **Esperado**: Tabela completa com 60 linhas

---

## 📊 Validações do Sistema

### Validações de Entrada
- [ ] Credor e Devedor são obrigatórios
- [ ] Saldo Devedor deve ser > 0
- [ ] Taxa de Juros deve estar entre 0% e 100% a.m.
- [ ] Número de parcelas deve estar entre 1 e 60

### Validações de Cálculo
- [ ] PMT (parcela) calculada corretamente pela fórmula PRICE
- [ ] Saldo devedor decresce a cada mês
- [ ] Amortização cresce e juros decrescem ao longo do tempo
- [ ] Soma de todas as parcelas = principal + total de juros

### Validações Jurídicas
- [ ] Detectar anatocismo (capitalização mensal)
- [ ] Alertar quando taxa > 150% da taxa de mercado
- [ ] Calcular CET incluindo todos os encargos
- [ ] Identificar seguros sem consentimento expresso

### Validações de Interface
- [ ] Botão "Salvar" ativa após preencher campos obrigatórios
- [ ] Botão "Análise Prévia" ativa somente após salvar
- [ ] Botão "Gerar Relatório" ativa somente após salvar
- [ ] Navegação entre telas funciona corretamente
- [ ] Dados salvos são carregados corretamente ao editar

---

## 🎯 Checklist de Teste Manual

### Fluxo Completo
1. [ ] Abrir tela de Revisão de Cartão de Crédito
2. [ ] Preencher todos os campos obrigatórios (Cenário 1)
3. [ ] Clicar em "Salvar Dados"
   - [ ] Toast de sucesso aparece
   - [ ] ID do cartão é gerado
4. [ ] Clicar em "Análise Prévia"
   - [ ] Cálculo é executado (loading)
   - [ ] Navega para tela de análise
   - [ ] Dados são exibidos corretamente
   - [ ] Cards mostram valores calculados
   - [ ] Gráfico de projeção é renderizado
5. [ ] Voltar e clicar em "Gerar Relatório"
   - [ ] Cálculo completo é executado (24 meses)
   - [ ] Navega para tela de relatório
   - [ ] Relatório PDF pode ser gerado
6. [ ] Voltar e editar dados salvos
   - [ ] Dados são carregados do banco
   - [ ] Alterações podem ser salvas
   - [ ] Recálculo funciona com novos dados

### Testes de Edge Cases
7. [ ] Tentar salvar sem preencher campos obrigatórios
   - [ ] Validação impede salvamento
   - [ ] Mensagem de erro é clara
8. [ ] Preencher com valores inválidos (letras em campos numéricos)
   - [ ] Sistema formata ou rejeita entrada
9. [ ] Testar com saldo R$ 0,00
   - [ ] Sistema alerta sobre valor inválido
10. [ ] Testar com 60 parcelas (máximo)
    - [ ] Cálculo funciona
    - [ ] Tabela é gerada completamente

---

## 📝 Observações Importantes

### Taxas de Referência (2024)
- **Taxa Selic**: ~10,75% a.a. (~0,86% a.m.)
- **Taxa de Mercado Cartão (referência)**: ~5,00% a.m. (~79,59% a.a.)
- **Limite STJ para abusividade**: Taxa > 150% da taxa média de mercado
- **Capitalização**: Anatocismo (juros sobre juros) é vedado, exceto se previsto em lei

### Legislação Aplicável
- **CDC (Código de Defesa do Consumidor)**: Arts. 39, 51
- **Súmula 297 STJ**: Código de Defesa do Consumidor aplicável às instituições financeiras
- **Súmula 381 STJ**: Admite-se capitalização de juros com periodicidade inferior a um ano (controvérsia)
- **Resolução CMN**: Limites e regras para cartões de crédito

---

**Documento gerado para suporte aos testes de Revisão de Cartão de Crédito**
**Versão**: 1.0
**Data**: 2024
**Octoapps - Sistema de Cálculos Jurídicos**
