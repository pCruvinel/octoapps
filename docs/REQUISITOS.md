
# 📘 DOCUMENTO FINAL DE REQUISITOS E REGRAS DE NEGÓCIO | OCTO APPS

**Versão:** 2.0 (Consolidada Pós-Review Dezembro)
**Status:** Validado para Desenvolvimento

## 1. VISÃO GERAL

O **OctoApps** é uma plataforma SaaS jurídico-financeira que centraliza a gestão de clientes (CRM) e automatiza cálculos periciais complexos (Revisionais Bancárias). O diferencial crítico é a precisão matemática (equivalente a perícias contábeis) e a agilidade na extração de dados de contratos bancários via IA para gerar uma "Análise Prévia" de viabilidade jurídica em minutos.

---

## 2. EXTRAÇÃO AUTOMÁTICA DE DADOS VIA IA (OCR/LLM)

*Módulo Crítico: Entrada de Dados*

Conforme solicitado e validado nas reuniões de revisão, a IA deve processar contratos (PDF/Imagem) e extrair estruturadamente os seguintes dados para popular o motor de cálculo.

### 2.1 Dados de Identificação (Metadados)

* **Nome do Credor (Banco):** Essencial para petições.
* **Nome do Devedor (Cliente):** Essencial para petições.
* **Número do Contrato:** Identificação única (para o cálculo em si não é variável matemática, mas é vital para o relatório).
* **Tipo do Contrato:** (Ex: CCB, Financiamento de Veículo, Capital de Giro, Financiamento Imobiliário - SFH/SFI).
* *Regra:* Este campo define quais "Códigos de Série" do BACEN serão consultados.



### 2.2 Variáveis Matemáticas (Core do Cálculo)

* **Valor Financiado (Principal):** Montante original do crédito.
* **Datas Relevantes:**
* **Data da Contratação:** *Fundamental* (Define a data base para busca da Taxa Média de Mercado no Bacen).
* **Data de Liberação do Crédito:** Para contagem de juros pro-rata (se aplicável).
* **Data da Primeira Parcela:** Início do fluxo de amortização.
* **Data de Vencimento da Primeira Parcela:** Para cálculo de dias de carência.


* **Taxas de Juros Pactuadas:**
* **Taxa Mensal (% a.m.):** *Fundamental*.
* **Taxa Anual (% a.a.):** *Fundamental* (Usada para comparação de abusividade e spread).


* **Fluxo de Pagamento:**
* **Valor da Parcela (PMT):** Valor fixo ou inicial.
* **Quantidade de Parcelas (Prazo):** Número total de meses.
* **Sistema de Amortização:** Identificar se é **Price** (Parcelas fixas), **SAC** (Amortização constante) ou **SACRE**. *Requisito explícito do cliente.*



### 2.3 Custos Acessórios e Abusividades (Vendas Casadas)

* **Tarifas Administrativas:** Extrair valores de TAC, Taxa de Abertura, Avaliação do Bem.
* **Seguros:** Extrair valores de Seguro Prestamista ou outros embutidos.
* **Capitalização:** Extrair valores de Títulos de Capitalização embutidos.
* *Regra de Negócio:* O sistema deve permitir ao usuário marcar "Excluir Tarifas" no cálculo, subtraindo esses valores do montante financiado para recalcular a parcela "justa" (Expurgo).



### 2.4 Condições Especiais

* **Carência:**
* Existência de carência (Sim/Não).
* Duração (em meses ou dias).
* **Análise Semântica (IA):** Identificar se o texto do contrato menciona *expressamente* a cobrança de juros durante o período de carência e em qual cláusula isso ocorre.


* **Garantias:** Identificação e descrição do bem (ex: Veículo Marca/Modelo, Matrícula do Imóvel).

---

## 3. REGRAS DE NEGÓCIO (CÁLCULO E FLUXO)

### RN-001: Integração com BACEN (Taxa Média de Mercado)

* **Lógica:** O sistema deve consumir a API do Banco Central (SGS - Sistema Gerenciador de Séries Temporais).
* **Gatilho:** Ao inserir a **Data do Contrato** e o **Tipo de Operação**, o sistema deve buscar automaticamente a taxa média daquela época.
* **Seleção de Série:** O usuário (ou a IA) deve classificar o contrato (Ex: "Aquisição de Bens - Pessoa Física" ou "Capital de Giro - PJ") para buscar o código de série correto (ex: Série 20749, 25464).
* **Exibição:** Mostrar lado a lado: Taxa Contrato vs. Taxa Média Bacen.

### RN-002: Precisão Matemática e Bibliotecas

* **Restrição Técnica:** Não utilizar a biblioteca matemática padrão do JavaScript (problemas de ponto flutuante/arredondamento). Utilizar bibliotecas específicas para cálculo financeiro de alta precisão (ex: `decimal.js` ou similar) para garantir exatidão nos centavos.
* **Comparativo:** O cálculo deve bater com as planilhas de referência (JCCalc/Planilhas do Perito) e não apenas com a lógica visual.

### RN-003: Edição de Fluxo de Pagamento (Amortização/Antecipação)

* **Cenário:** O cliente pode ter pago parcelas adiantadas, dado um lance (consórcio/financiamento) ou pago valores diferentes.
* **Funcionalidade:** O sistema deve gerar a tabela de parcelas (1 a N), mas permitir que o usuário edite linhas específicas para dizer "Nesta data, foi pago X valor" (diferente do pactuado). O recálculo do saldo devedor deve considerar esses eventos extraordinários.
* **Colapsar Parcelas:** Para financiamentos longos (ex: Imobiliário 360 meses), a interface deve colapsar a lista visualmente (ex: mostrar 1-12, esconder 13-350, mostrar finais) para não travar o navegador, mas manter o cálculo completo no backend.

### RN-004: Diferenciação de Módulos

1. **Financiamento Geral/Veículos:** Foco em Tabela Price, Capitalização de Juros (Anatocismo) e Expurgo de Tarifas.
2. **Financiamento Imobiliário:**
* Suporte obrigatório a **SAC** e **Price**.
* Variáveis extras: Indexadores de Correção Monetária (TR, IPCA, INPC).
* Seguros específicos (MIP/DFI) devem ser tratados.


3. **Cartão de Crédito:**
* Não segue a lógica de parcelas fixas.
* Requer entrada de faturas mês a mês (recomposição de saldo).
* Deve tratar: Rotativo, Compras, Pagamentos Parciais e Multas.



### RN-005: Análise Prévia vs. Processo

* **Análise Prévia:** É um cálculo rápido para vendas. **Não** deve exigir dados burocráticos como "Número do Processo", "Vara", "Comarca". Focar apenas nos dados financeiros extraídos do contrato.
* **Relatório/Petição:** Apenas nesta etapa os dados burocráticos (Foro, Vara) são necessários.

---

## 4. REQUISITOS FUNCIONAIS (SISTEMA)

### RF-001: Upload e OCR Inteligente

* O sistema deve ter uma área de "Novo Cálculo" onde o primeiro passo é o upload do PDF.
* O OCR processa o arquivo e apresenta um formulário pré-preenchido (staging) para validação do usuário antes de rodar o cálculo.

### RF-002: Dashboard e CRM (Kanban)

* Visualização de leads em etapas (Funil).
* Possibilidade de mover cards (Drag-and-drop).
* O cálculo realizado deve ficar vinculado ao Card do Cliente no CRM.

### RF-003: Gestão de Relatórios e Branding

* **White Label:** O sistema deve permitir que o escritório configure sua logomarca.
* **Marca D'água:** Os relatórios gerados (PDF) devem conter a marca d'água/logo do escritório do usuário, e não do desenvolvedor (OctoApps).

### RF-004: Perfis de Acesso

* **Admin:** Configurações globais, gestão de usuários.
* **Advogado/Comercial:** Acesso ao CRM, Upload de Contratos, Visualização de Análise Prévia.
* **Perito:** Acesso profundo aos parâmetros de cálculo, ajustes manuais de taxas e fluxo de pagamentos.

---

## 5. LISTA DE VERIFICAÇÃO FINAL (CHECKLIST DA IA)

*Para uso na configuração do Prompt do Extrator:*

1. [ ] **Identificação:** Credor, Devedor, Nº Contrato.
2. [ ] **Classificação:** Tipo de Contrato (Veículo, Imóvel, Pessoal, Giro).
3. [ ] **Financeiro:** Valor Total, Valor Parcela, Prazo (Meses).
4. [ ] **Taxas:** Juros Mensal, Juros Anual, CET (se disponível).
5. [ ] **Cronologia:** Data Assinatura, Data 1º Pagamento.
6. [ ] **Sistema:** Amortização (Price/SAC).
7. [ ] **Adicionais:** Lista de Tarifas (Descrição + Valor), Seguros (Descrição + Valor).
8. [ ] **Cláusulas Específicas:** Texto sobre Juros de Carência (Extrair trecho), Garantia (Descrição do bem).

Este documento consolida as necessidades técnicas e de negócio para a entrega final do produto.