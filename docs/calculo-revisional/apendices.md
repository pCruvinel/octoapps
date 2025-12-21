Para não restar dúvidas, aqui está o **Mapeamento Definitivo dos Apêndices por Módulo**, que deve constar no código do gerador de relatórios:

---

### 🏠 Módulo 1: Financiamento Imobiliário (SFH/SFI)

*Baseado na `PLANILHA AULA - SFH - CASO 02`.*
Este fluxo é mais longo pois envolve correção monetária do indébito e recálculo do saldo devedor.

1. **AP01 - Evolução do Financiamento (Recálculo):**
* Recria a evolução da dívida usando a **Taxa Média de Mercado** e removendo seguros abusivos (MIP/DFI).
* *Output:* Gera a "Prestação Devida".


2. **AP02 - Demonstrativo de Diferenças (Nominal):**
* Confronta `Valor Pago` vs `Valor Devido (AP01)`.
* *Output:* Diferença mensal sem correção.


3. **AP03 - Evolução com Restituição em Dobro:**
* Projeta como ficaria o saldo devedor abatendo o dobro do que foi pago a mais.


4. **AP04 - Evolução com Restituição Simples:**
* Projeta o saldo devedor abatendo o valor simples (sem penalidade).


5. **AP05 - Atualização Monetária (INPC):**
* Pega as diferenças do **AP02** e corrige pelo INPC/IPCA desde a data do pagamento indevido até a data do cálculo.
* *Output:* Valor real a restituir ou compensar.


6. **AP06 - Consolidação do Saldo Devedor (Cenário Dobro):**
* Encontro de Contas Final: `Saldo Devedor Atual` - `Total Crédito Atualizado (Dobro)`.


7. **AP07 - Consolidação do Saldo Devedor (Cenário Simples):**
* Encontro de Contas Final: `Saldo Devedor Atual` - `Total Crédito Atualizado (Simples)`.



---

### 🚗 Módulo 2: Veículos, Giro e Empréstimos (Geral)

*Baseado nas planilhas `BV`, `CREDITAS`, `SANTANDER`.*
A estrutura é ligeiramente diferente, focando na ilegalidade da capitalização e tarifas.

1. **AP01 - Evolução Original (O "Cenário Banco"):**
* Demonstra a evolução da dívida com as taxas abusivas e capitalização diária, chegando ao saldo devedor que o banco alega.


2. **AP02 - Evolução Recalculada (O "Cenário Justo"):**
* Recálculo expurgando a capitalização diária (usando mensal ou simples) e substituindo a taxa pela média Bacen.
* *Output:* Gera a nova parcela e o novo saldo devedor real.


3. **AP03 - Demonstrativo das Diferenças:**
* Tabela de confronto: `Valor da Parcela Paga` - `Valor da Parcela Recalculada (AP02)`.
* Calcula o total a restituir nas parcelas já pagas.


4. **AP04 - Novo Fluxo (Cenário Dobro):**
* Projeção futura do contrato considerando o abatimento do indébito em dobro.


5. **AP05 - Novo Fluxo (Cenário Simples):**
* Projeção futura do contrato considerando o abatimento simples.



---

### 💳 Módulo 3: Cartão de Crédito (RMC)

*Este módulo não possui planilhas "AP" numeradas nos arquivos enviados, mas segue a lógica pericial padrão:*

1. **AP01 - Reconstrução (Consignado Simulado):**
* Transforma a dívida infinita em um empréstimo padrão (ex: 60x a taxa média de consignado).


2. **AP02 - Confronto de Saques e Pagamentos:**
* Lista todos os descontos em folha (RMC) e abate da dívida simulada no AP01.


3. **AP03 - Apuração de Indébito:**
* Mostra o momento em que a dívida deveria ter sido quitada e tudo que foi descontado posteriormente (o valor a devolver).



---

**Esta lista cobre 100% da lógica dos arquivos enviados.** O sistema deve ser capaz de gerar e exportar (PDF/Excel) exatamente essas tabelas.


