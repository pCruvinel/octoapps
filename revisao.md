## Apresentação dos Cálculos ReVisionais  

Este documento explica, em linguagem simples, **como o sistema realiza a análise revisional** para dois tipos de operações:

- **Revisão de Financiamento Imobiliário (SFH / SAC / TR)**
- **Revisão de Cartão de Crédito (juros rotativos e encargos)**

O objetivo é que você, cliente, entenda **o que está sendo comparado**, **como os valores são calculados** e **de onde vem o valor de possível restituição** apresentado na Análise Prévia e no Relatório Completo.

---

## 1. Revisão de Financiamento Imobiliário

### 1.1. Quais dados do contrato nós usamos

Na tela de “Revisão de Financiamento Imobiliário”, coletamos os principais dados do seu contrato:

- **Credor**: banco ou instituição financeira.
- **Devedor**: nome do cliente.
- **Número do contrato**.
- **Valor do bem**, **entrada** e **valor financiado (PV)**.
- **Número de parcelas (n)** e **data da 1ª parcela**.
- **Data do contrato** e **data do cálculo**.
- **Taxa de juros do contrato (mensal e/ou anual)**.
- **Taxa de juros média de mercado** (para comparação).
- **Sistema de amortização**: aqui usamos **SAC** (Sistema de Amortização Constante).
- **Indexador de correção monetária**: normalmente **TR**.
- **Seguros e encargos da 1ª parcela**: MIP, DFI, TCA, multa e mora.
- **Horizonte de análise**: por exemplo, **12, 24, 36 ou 360 meses**.

Essas informações alimentam o **motor de cálculo revisional**, que calcula o que foi **cobrado** e o que seria **devido** segundo uma **taxa de mercado mais justa**.

---

### 1.2. Metodologia da Análise Prévia (Financiamento)

Na **Análise Prévia**, o foco é responder:

> “Vale a pena aprofundar este caso? Há indícios fortes de cobrança abusiva?”

Para isso, o sistema executa três cenários principais:

- **AP01 – Cenário Cobrando (o que o banco está praticando)**
- **AP05 – Cenário Devido (o que seria razoável com taxa de mercado)**
- **AP03 – Cenário Comparativo (diferença entre cobrado e devido)**

#### (a) Geração da tabela cobrada – AP01

1. **Sistema de Amortização Constante (SAC)**  
   - O valor financiado (PV) é dividido em amortizações **iguais** ao longo do número de parcelas (n).  
   - Fórmula da amortização fixa mensal:  
     \[
     A = \frac{PV}{n}
     \]

2. **Correção pela TR mês a mês**  
   - Antes de calcular os juros de cada parcela, o saldo devedor é corrigido pelo fator da **TR** daquele mês.  
   - Se a TR não estiver disponível, o sistema considera TR **neutra (1,0000)**, apenas para não travar o cálculo.

3. **Cálculo de juros de cada parcela**  
   - Para cada mês, o sistema escolhe a **taxa de juros do contrato** válida para aquela data.  
   - Juros do mês:  
     \[
     J_t = \text{Saldo Corrigido}_t \times i_{\text{contrato}}
     \]

4. **Prestação básica (amortização + juros)**  
   - Prestação sem seguros/encargos:  
     \[
     P_t = A + J_t
     \]

5. **Inclusão de seguros e encargos**  
   - Sobre essa prestação básica, o sistema soma:  
     - **MIP** (seguro de morte e invalidez)  
     - **DFI** (seguro de danos físicos)  
     - **TCA**, multa, mora (quando informados).  
   - Total da parcela:  
     \[
     \text{Total Pago}_t = P_t + \text{MIP} + \text{DFI} + \text{TCA} + \text{Multa} + \text{Mora}
     \]

6. **Saldo devedor após o pagamento**  
   - O saldo devedor é atualizado diminuindo apenas a **amortização** (A), e não os juros:  
     \[
     \text{Saldo Devedor}_{t+1} = \text{Saldo Corrigido}_t - A
     \]

7. **Totais do cenário cobrado (AP01)**  
   - **Total de juros cobrados** ao longo do período analisado.  
   - **Total de seguros e taxas**.  
   - **Total efetivamente pago** (juros + amortização + encargos).

#### (b) Geração da tabela devida – AP05

No **cenário devido**, repetimos o mesmo cálculo, mas trocando a taxa de juros do contrato por uma **taxa de mercado**:

- Usamos o mesmo PV, o mesmo número de parcelas e as mesmas datas.
- Aplicamos a TR da mesma forma.
- **Não** consideramos seguros/encargos acessórios que não são estritamente necessários.
- A única diferença é a **taxa de juros**: utilizamos a taxa média de mercado (por exemplo, obtida de tabelas do BACEN) como referência mais justa.

Isso produz:

- Uma nova tabela de amortização (AP05).
- O **total de juros que seria devido** nesse cenário mais favorável ao consumidor.

#### (c) Cenário comparativo – AP03

No **AP03**, o sistema compara, mês a mês:

- **Quanto foi pago** no cenário cobrado (incluindo seguros/encargos).
- **Quanto seria razoável pagar** no cenário devido.

Para cada parcela:

\[
\text{Diferença}_t = \text{Total Pago}_t^{\text{cobrado}} - \text{Parcela}_t^{\text{mercado}}
\]

Somando todas as diferenças positivas, obtemos:

- **Valor potencial de restituição** (quanto foi pago a mais).  
- **Sobretaxa em pontos percentuais**: diferença entre a taxa do contrato e a taxa de mercado:
  \[
  \text{Sobretaxa (p.p.)} = i_{\text{contrato}} - i_{\text{mercado}}
  \]

Se essa sobretaxa for **maior que 2 pontos percentuais**, o sistema já qualifica como **forte indício de abusividade**, o que é destacado na Análise Prévia.

---

### 1.3. O que aparece na Análise Prévia (Financiamento)

Na tela de **Análise Prévia**, o cliente visualiza, em cartões-resumo:

- **Taxa do contrato x taxa de mercado** (ao mês).
- **Sobretaxa** em pontos percentuais.
- **Valor total pago** (no horizonte analisado).
- **Valor que deveria ter sido pago**.
- **Diferença / possível restituição**.
- Indicadores de:
  - **Viabilidade da ação** (diferença expressiva ou não).
  - **Existência de sobretaxa significativa**.
  - **Presença de irregularidades em encargos**.

Essa etapa serve como **triagem**: mostrar de forma rápida se o caso **parece forte** para prosseguir para um **laudo detalhado**.

---

### 1.4. Metodologia do Relatório Completo (Financiamento)

Ao gerar o **Relatório Completo**, o sistema:

1. **Refaz todos os cálculos** dos cenários AP01, AP05 e AP03.
2. **Salva as tabelas completas de amortização** (linha a linha) no banco de dados.
3. Monta um relatório com:
   - Identificação completa do contrato (credor, devedor, nº do contrato).  
   - Metodologia utilizada:  
     - **SAC com TR**, comparando **“cobrado” x “devido”**.  
   - **Cards de resumo**:
     - Valor principal.
     - Total de juros.
     - Total de taxas.
     - Valor total devido.
     - Valor total a restituir.
   - **Comparativo de taxas**:
     - Taxa do contrato.
     - Taxa de mercado.
     - Sobretaxa.
   - **Tabela de amortização** completa (quando aplicável ao tipo de cálculo).
   - **Resumo executivo em linguagem jurídica e contábil**, pronto para ser usado em petições.
   - **Base legal e metodologia**, citando:
     - Código Civil.  
     - Código de Defesa do Consumidor.  
     - Resoluções do BACEN / CMN.  
     - Súmulas relevantes do STJ.

No caso de financiamentos imobiliários, o foco é **demonstrar de forma técnica e visual**:

- Como a taxa aplicada se distancia do mercado.
- Quanto isso gerou de **encargos indevidos** ao longo do tempo.
- O **montante que poderia ser restituído** em favor do consumidor.

---

## 2. Revisão de Cartão de Crédito

### 2.1. Quais dados da fatura nós usamos

Na tela de “Revisão de Cartão de Crédito”, são coletados, entre outros:

- **Credor (banco)** e **devedor (titular do cartão)**.
- **Saldo devedor** atual.
- **Limite total e limite disponível**.
- **Saldo anterior e saldo financiado**.
- **Datas importantes**:
  - Início da análise.
  - Data da última fatura.
  - Data de pagamento.
- **Valores da fatura**:
  - Total da fatura.
  - Pagamento mínimo.
  - Consumos/despesas.
  - Saques em espécie.
  - IOF.
  - Anuidade.
  - Seguros.
  - Tarifas.
- **Taxas de juros**:
  - Juros do rotativo.
  - Juros de mora (%).
  - Multa de inadimplência (%).
  - Taxa de parcelamento (quando informada).

Com esses dados, o sistema realiza uma **análise macro** do comportamento do rotativo, **sem precisar de todas as faturas mês a mês**, ideal para **triagem inicial**.

---

### 2.2. Metodologia da Análise Prévia (Cartão)

Aqui o objetivo é responder:

> “O banco está cobrando juros muito acima da média do mercado? Há encargos abusivos (mora, multa, IOF, anuidade etc.)?”

#### (a) Taxa do contrato x taxa BACEN

1. **Taxa do contrato (juros do rotativo)**  
   - A taxa informada na fatura é convertida para **juros mensais em formato decimal**.  
   - Exemplo: 12,99% a.m. → 0,1299.

2. **Taxa média de mercado (BACEN)**  
   - O sistema utiliza uma **taxa média de referência** para cartão de crédito rotativo (por exemplo, 5% a.m.), baseada em dados do Banco Central.
   - Essa taxa pode ser ajustada periodicamente conforme novas estatísticas.

3. **Cálculo da sobretaxa**  
   - **Sobretaxa relativa**: quanto a taxa do contrato supera a taxa média:
     \[
     \text{Sobretaxa Relativa} = \frac{i_{\text{contrato}}}{i_{\text{BACEN}}} - 1
     \]
   - **Sobretaxa em pontos percentuais** (p.p.):
     \[
     \text{Sobretaxa (p.p.)} = i_{\text{contrato}} - i_{\text{BACEN}}
     \]

Quando a sobretaxa é muito alta (por exemplo, **acima de 50% da média de mercado**), o sistema destaca como **forte indício de abusividade**.

#### (b) Simulação macro do rotativo (juros compostos)

1. **Capital analisado**  
   - Utilizamos como base o **saldo devedor** ou o **valor principal financiado** informado.

2. **Período de análise**  
   - Em geral, são simulados **12 ou 24 meses** de operação no rotativo.

3. **Pagamento mínimo (15%)**  
   - O modelo considera a regra padrão de mercado: pagamento mínimo em torno de **15% do saldo**.
   - A cada mês:
     - Calculam-se os juros do período.
     - Soma-se ao saldo.
     - Aplica-se um pagamento mínimo de 15%, restando saldo para o próximo mês.

4. **Cenário com taxa do contrato x cenário com taxa BACEN**  
   - O sistema faz duas simulações paralelas:
     - Uma com a **taxa da fatura (contrato)**.
     - Outra com a **taxa média BACEN (mercado)**.
   - Em cada cenário calculamos:
     - **Total de juros cobrados**.
     - **Evolução do saldo**.

5. **Diferença de juros (possível restituição)**  
   - A diferença entre os juros cobrados no cenário do contrato e os juros que seriam devidos com taxa BACEN fornece um **valor estimado de excesso de cobrança**:
     \[
     \text{Diferença de juros} = J_{\text{contrato}} - J_{\text{BACEN}}
     \]

#### (c) Encargos adicionais: mora, multa, IOF, anuidade, seguros, tarifas

Além dos juros, o sistema calcula o impacto dos **encargos adicionais**:

- **Juros de mora**: aplicados sobre o saldo em atraso, multiplicados pelo número de meses em atraso.  
- **Multa de inadimplência**: percentual único sobre o saldo.  
- **IOF**: somado mês a mês, conforme valor informado.  
- **Anuidade, seguros e tarifas**: somados ao longo do período analisado.

O total desses encargos é comparado com o que seria considerado **estritamente necessário** em um cenário de mercado, destacando **excessos ou cobranças desproporcionais**.

#### (d) Classificação de abusividade

Com base nos números apurados, o sistema:

- Classifica a operação como:
  - “Dentro ou levemente acima da média de mercado”.
  - “Significativamente acima da média”.
  - “Extremamente acima da média”.
- Lista **encargos abusivos** encontrados, como:
  - Juros de mora muito elevados.
  - Multas em patamar exagerado.
  - Anuidade excessiva.
  - IOF e tarifas que, no conjunto, aumentam demais o CET.
- Indica **anatocismo provável** (juros sobre juros), característica típica de rotativo de cartão.

---

### 2.3. O que aparece na Análise Prévia (Cartão)

Na tela de **Análise Prévia de Cartão**, o cliente vê:

- **Saldo devedor analisado**.
- **Taxa cobrada** x **taxa de mercado (BACEN)**.
- **Sobretaxa** em pontos percentuais e em percentual sobre o mercado.
- **Total de juros cobrados** x **total que seria devido**.
- **Diferença de juros (possível restituição)**.
- **Total de encargos cobrados** x **total de encargos devidos**.
- Destaque de:
  - **Anatocismo detectado**.
  - **Encargos abusivos identificados**.
  - **Percentual acima do mercado**.

Além disso, há indicadores visuais que sinalizam:

- Se há **forte viabilidade** para revisão judicial.
- Se o **potencial de restituição é relevante** ou pequeno.

---

### 2.4. Metodologia do Relatório Completo (Cartão)

Ao gerar o **Relatório Completo de Cartão de Crédito**, o sistema:

1. **Reaproveita o resultado da Análise Prévia**, garantindo consistência entre as telas.
2. Monta um **resumo executivo** específico para cartão, com:
   - Valor principal analisado.
   - Período de análise (ex.: 24 meses).
   - Taxa do contrato x taxa BACEN.
   - Sobretaxa e percentual de abusividade.
   - Total de juros cobrados x devidos.
   - Valor de restituição **simples** e **em dobro** (art. 42 do CDC, quando aplicável).
3. Inclui uma **seção de irregularidades detectadas**, listando de forma clara cada encargo abusivo.
4. Apresenta a **base legal e metodologia**, citando:
   - Código de Defesa do Consumidor.
   - Código Civil.
   - Resoluções do Conselho Monetário Nacional.
   - Súmulas do STJ sobre anatocismo e juros.
5. Estrutura o texto de forma que possa ser:
   - Entregue ao cliente como **parecer técnico**.
   - Utilizado pelo advogado como **anexo de laudo contábil** em ações judiciais.

---

## 3. Diferença entre Análise Prévia e Relatório Completo

- **Análise Prévia**  
  - Foco em **agilidade** e **visão executiva**.  
  - Mostra se existe **indício forte** de abuso e qual o **potencial aproximado de restituição**.  
  - Ideal para **triagem de casos** no escritório.

- **Relatório Completo**  
  - Foco em **detalhamento técnico e jurídico**.  
  - Traz **tabelas, fórmulas, comparativos e base legal**.  
  - Serve como **documento de suporte** para ações judiciais e perícias.

Em resumo: **a Análise Prévia responde “vale a pena entrar com ação?”; o Relatório Completo responde “quanto, por quê e com qual fundamentação”**.

---

## 4. Como este material pode ser apresentado ao cliente

Este texto foi pensado para ser utilizado em:

- **Reuniões de apresentação** do resultado da análise revisional.
- **Propostas comerciais**, explicando o diferencial técnico do seu escritório.
- **Anexos explicativos** enviados junto com o laudo em PDF.

Você pode adaptar a linguagem para o perfil do cliente, mas a lógica de cálculo permanecerá a mesma:  
**comparar o que foi efetivamente cobrado com o que seria razoável e demonstrar, de forma clara, o caminho até o valor de restituição estimado.**

---

## 5. Exemplos práticos de fórmulas e resultados

Abaixo, alguns **exemplos numéricos simples**, exatamente no formato que você pode explicar ao cliente: “**usamos esta fórmula para chegar neste valor**”.

### 5.1. Exemplo – Financiamento Imobiliário (SAC)

Suponha:

- Valor financiado (**PV**) = R$ 300.000,00  
- Número de parcelas (**n**) = 360  
- Taxa de juros do contrato (**i\_contrato**) = 0,60% a.m. (0,0060)  
- Taxa de mercado (**i\_mercado**) = 0,50% a.m. (0,0050)  
- Sem considerar TR e seguros neste exemplo simplificado.

#### (a) Amortização mensal (A)

**Fórmula usada:**

\[
A = \frac{PV}{n}
\]

**Aplicando:**

\[
A = \frac{300.000}{360} \approx 833{,}33
\]

**Como explicamos ao cliente:**  
“Dividimos o valor financiado pelo número de parcelas. Assim chegamos em uma amortização fixa mensal de **R$ 833,33**. Esta é a parte da parcela que realmente reduz a dívida.”

#### (b) Juros da 1ª parcela no cenário cobrado (AP01)

**Fórmula usada:**

\[
J_1^{\text{contrato}} = PV \times i_{\text{contrato}}
\]

**Aplicando:**

\[
J_1^{\text{contrato}} = 300.000 \times 0{,}006 = 1.800{,}00
\]

Então, a **parcela 1** no cenário cobrado é:

\[
P_1^{\text{contrato}} = A + J_1^{\text{contrato}} = 833{,}33 + 1.800{,}00 = 2.633{,}33
\]

**Como explicamos ao cliente:**  
“Na primeira parcela, aplicamos a taxa do seu contrato de 0,60% sobre o saldo devedor. Isso gera **R$ 1.800,00 de juros**, que somados à amortização de R$ 833,33 resultam em uma parcela de **R$ 2.633,33**.”

#### (c) Juros da 1ª parcela no cenário de mercado (AP05)

**Mesma fórmula, com taxa de mercado:**

\[
J_1^{\text{mercado}} = PV \times i_{\text{mercado}} = 300.000 \times 0{,}005 = 1.500{,}00
\]

Parcela 1 cenário mercado:

\[
P_1^{\text{mercado}} = A + J_1^{\text{mercado}} = 833{,}33 + 1.500{,}00 = 2.333{,}33
\]

#### (d) Diferença da 1ª parcela (base da restituição)

\[
\text{Diferença}_1 = P_1^{\text{contrato}} - P_1^{\text{mercado}} = 2.633{,}33 - 2.333{,}33 = 300{,}00
\]

**Como explicamos ao cliente:**  
“Só na primeira parcela, você pagou **R$ 300,00 a mais** do que pagaria se o banco tivesse usado uma taxa de mercado.  
Repetimos este cálculo **mês a mês** e somamos todas essas diferenças para chegar ao **valor total de restituição**.”

---

### 5.2. Exemplo – Cartão de Crédito (Rotativo)

Suponha:

- Saldo devedor analisado (**P**) = R$ 5.000,00  
- Taxa de juros do contrato (**i\_contrato**) = 12,00% a.m. (0,12)  
- Taxa média BACEN (**i\_BACEN**) = 8,00% a.m. (0,08)  
- Período de análise = 12 meses  
- Para simplificar o exemplo, vamos comparar o **montante final** usando juros compostos, sem pagamentos intermediários.

#### (a) Montante com a taxa do contrato

**Fórmula usada (juros compostos):**

\[
M = P \times (1 + i)^n
\]

**Aplicando para a taxa do contrato (12% a.m.):**

\[
M_{\text{contrato}} = 5.000 \times (1 + 0{,}12)^{12}
\]

\[
(1{,}12)^{12} \approx 3{,}895
\]

\[
M_{\text{contrato}} \approx 5.000 \times 3{,}895 \approx 19.475{,}00
\]

**Juros com a taxa do contrato:**

\[
J_{\text{contrato}} = M_{\text{contrato}} - P \approx 19.475{,}00 - 5.000{,}00 = 14.475{,}00
\]

#### (b) Montante com a taxa BACEN (8% a.m.)

**Mesma fórmula, com 8% a.m.:**

\[
M_{\text{BACEN}} = 5.000 \times (1 + 0{,}08)^{12}
\]

\[
(1{,}08)^{12} \approx 2{,}518
\]

\[
M_{\text{BACEN}} \approx 5.000 \times 2{,}518 \approx 12.590{,}00
\]

**Juros devidos com taxa BACEN:**

\[
J_{\text{BACEN}} = M_{\text{BACEN}} - P \approx 12.590{,}00 - 5.000{,}00 = 7.590{,}00
\]

#### (c) Diferença de juros (base da restituição)

\[
\text{Diferença de Juros} = J_{\text{contrato}} - J_{\text{BACEN}} \approx 14.475{,}00 - 7.590{,}00 = 6.885{,}00
\]

**Como explicamos ao cliente:**  
“Usando a taxa de 12% ao mês que o banco te cobrou, em 12 meses seus juros chegariam a cerca de **R$ 14.475,00**.  
Se tivesse sido aplicada a taxa média de mercado de 8% ao mês, os juros seriam em torno de **R$ 7.590,00**.  
A **diferença de aproximadamente R$ 6.885,00** é justamente o **excesso que identificamos** e que pode servir de base para pedido de restituição.”

Esses exemplos são simplificados para fins didáticos, mas utilizam as **mesmas fórmulas** que o sistema aplica de forma automatizada, mês a mês, considerando também pagamentos mínimos, IOF, anuidade, seguros e demais encargos quando estão informados no caso real.


