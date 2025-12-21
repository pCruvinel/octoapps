## 1. Arquitetura do Fluxo de OCR

Para garantir que o "autopreenchimento" funcione bem, o motor de OCR deve retornar um **JSON estruturado**.

1. **Entrada:** O usuário faz o upload do PDF/Imagem no botão "Inserir Contrato".
2. **Processamento Primário (Gemini):** O sistema envia o arquivo para a API do Gemini (ex: 1.5 Flash ou Pro) com um prompt de extração.
3. **Lógica de Fallback:** Se o Gemini retornar erro (limite de taxa ou falha de leitura), o sistema aciona automaticamente a API do **Mistral (Pixtal)**.
4. **Normalização:** Os dados extraídos são validados em relação aos campos configurados nas "Configurações de OCR".
5. **Saída:** O frontend recebe o JSON e preenche os inputs do formulário de "Novo Cálculo".

---

## 2. Configurações do Sistema (Painel Adm)

Dentro de `Configurações > Sistema > OCR`, a interface deve ser intuitiva para permitir que o sistema evolua sem precisar mexer no código.

### Configuração de APIs

* **Gemini API Key:** Campo de input + Seletor de Modelo.
* **Mistral API Key:** Campo de input + Seletor de Modelo.
* **Status do Serviço:** Indicador visual se as chaves estão ativas.

### Tabs de Configuração de Campos

Cada tab representará o **Schema de Extração** enviado para a IA.

| Tab | Exemplos de Campos Sugeridos para Extração |
| --- | --- |
| **Empréstimos & Veículos** | Valor das Parcelas, Taxa de Juros Mensal, CET Anual, Data do Contrato, Placa/Renavam. |
| **Imobiliário** | Sistema de Amortização (SAC/PRICE), Valor do Imóvel, Índice de Reajuste (IPCA/IGPM), Prazo. |
| **Cartão de Crédito** | Taxa de Juros Rotativo, Valor da Fatura, Encargos de Atraso, Limite Total. |

> **Dica Pro:** Em cada campo, adicione um toggle de **"Campo Obrigatório para OCR"**. Se a IA não encontrar esse dado, o sistema pode emitir um alerta amigável ao usuário.

---

## 3. Experiência do Usuário (UX) no "Novo Cálculo"

O fluxo deve ser fluido para não interromper o raciocínio do usuário.

1. **Botão de Ação:** Posicione o botão "Inserir Contrato" de forma proeminente (ex: no topo do formulário ou em uma dropzone).
2. **Estado de Carregamento:** Exibir um overlay ou skeleton screen com frases como *"A IA está analisando as cláusulas do contrato..."*.
3. **Feedback de Sucesso:** Após a extração, os campos preenchidos automaticamente podem ganhar um **highlight visual temporário** (ex: borda azul ou ícone de faísca ✨) para indicar que foram gerados por IA.
4. **Edição Manual:** Todos os campos permanecem editáveis. É importante ter um botão "Limpar Campos" caso o documento enviado esteja errado.

---

## 4. Sugestão de Prompt Estruturado (System Prompt)

Para que o Gemini/Mistral entreguem o que você precisa, o prompt interno deve ser rígido:

> "Você é um especialista em análise de contratos bancários e imobiliários. Sua tarefa é extrair dados específicos do documento em anexo. Retorne **apenas** um objeto JSON plano. Se não encontrar um dado, retorne 'null'. Não invente dados. Campos a extrair: [LISTA_DE_CAMPOS_DA_TAB]"

---
