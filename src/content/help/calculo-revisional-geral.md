# Metodologia do Cálculo Revisional (Pericial)

O **Cálculo Revisional Completo** é uma reconstrução matemática e jurídica do contrato, mês a mês, confrontando o que foi cobrado pelo banco com o que deveria ter sido cobrado segundo a lei e a média de mercado.

---

## 1. Estrutura dos Apêndices (Relatórios)

O laudo é dividido em planilhas técnicas chamadas Apêndices:

### 📄 AP-01: Evolução Original (Cenário Banco)
Reproduzimos exatamente a evolução da dívida conforme os parâmetros do banco. O objetivo é chegar a um saldo devedor igual ao informado pelo credor, validando a integridade dos dados inseridos.

### ⚖️ AP-02: Recálculo Técnico (Cenário Justo)
Recriamos a dívida aplicando os parâmetros revisionais:
- **Taxa de Juros**: Média de Mercado BACEN (se menor que a contratada).
- **Saldo Inicial**: Valor Financiado (-) Tarifas Abusivas (TAC, Seguros, etc).
- **Método**: Amortização contábil linear (evitando juros sobre juros / anatocismo).

### 💰 AP-03/04/05: Demonstrativo de Diferenças
Confrontamos as parcelas pagas mês a mês:
- **Coluna "Pago"**: Valor que saiu do seu bolso.
- **Coluna "Devido"**: Valor que deveria ter sido pago (do AP-02).
- **Diferença**: Valor pago a maior (Indébito).

Se a diferença é positiva, você tem crédito a receber ou compensar.

---

## 2. Teses Jurídicas Aplicadas

### Taxa Média de Mercado (STJ)
Utilizamos as séries temporais do Banco Central para limitar os juros à média praticada na época da contratação, conforme jurisprudência pacificada do STJ.

### Restituição em Dobro (CDC Art. 42 / STJ)
Para pagamentos indevidos (como tarifas abusivas declaradas ilegais), o sistema calcula a devolução em dobro, penalidade prevista no Código de Defesa do Consumidor para cobranças injustificáveis.

### Afastamento da Capitalização Diária
Removemos o efeito exponencial diário dos juros quando não pactuado expressamente, recalculando a dívida com capitalização mensal ou juros simples, conforme a tese selecionada.
