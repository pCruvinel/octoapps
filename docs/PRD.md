# One Pager

# **PRD 000: Visão Geral e Contexto do Produto**

**Metadados do Documento:**

* ID do Documento: PRD 000  
* Título: Visão Geral e Contexto do Produto \- OctoApps  
* Status: Em Desenvolvimento  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[Manuela](mailto:manuela.dizevolv@gmail.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Data de Criação: 15/09/2025  
* Última Atualização: 05/12/2025  
* Versão: 1.1

## **1\. Visão Geral do Projeto**

### **1.1 O Produto**

O **OctoApps** (anteriormente referido como OctoBox/Octo Veritus) é uma plataforma SaaS (Software as a Service) jurídico-financeira integrada, desenvolvida inicialmente para uso interno do escritório Guedes & Ramos e com arquitetura preparada para comercialização futura. O sistema centraliza a gestão de relacionamento com clientes (CRM) e a execução de cálculos periciais complexos para ações revisionais bancárias.

A solução automatiza o fluxo de trabalho de advogados e peritos, desde a captação do lead até a geração de relatórios técnicos e petições. O *core* do produto é um motor de cálculo de alta precisão que compara taxas contratuais de financiamentos (imobiliário, veículos, empréstimos e cartão de crédito) com as Taxas Médias de Mercado divulgadas pelo Banco Central (Bacen), identificando abusividades e viabilidade jurídica da ação.

**1.2 Problema de Negócio**

O processo atual de revisão contratual é fragmentado, manual e propenso a erros humanos. Advogados e peritos perdem horas extraindo dados de contratos PDF e imputando-os em planilhas Excel complexas e "engessadas", que não comportam todas as variações de cenários bancários (ex: feriados, pro-rata die, expurgo de seguros específicos).

**Dores Identificadas:**

* **Dor 1: Ineficiência Operacional:** Tempo excessivo gasto na digitação manual de dados contratuais e manutenção de planilhas desconectadas do sistema de gestão de clientes.  
* **Dor 2: Risco de Erro no Cálculo:** Planilhas Excel tradicionais falham em capturar nuances como capitalização diária disfarçada de mensal ou regras específicas de recálculo de cartão de crédito (rotativo, IOF, multa), comprometendo a tese jurídica.  
* **Dor 3: Falta de Rastreabilidade:** Dados do cliente, contratos e resultados dos cálculos ficam dispersos, dificultando o acompanhamento do histórico e a geração rápida de peças jurídicas.

### **1.3 Contexto da Empresa/Cliente**

* **Segmento:** Advocacia Bancária e Perícia Contábil/Financeira.  
* **Tamanho:** Escritório em expansão (Guedes & Ramos), com parceiros técnicos (Peritos).  
* **Escala do Problema:** Volume crescente de contratos para análise de viabilidade; necessidade de padronizar a metodologia de cálculo entre advogados e o perito técnico.  
* **Ferramentas Atuais:** Planilhas Excel complexas (desenvolvidas pelo perito Diego Nascimento), sistemas legados engessados (ex: JCCalc \- apenas referência), e gestão manual de leads.

## **2\. Escopo do MVP (Produto Mínimo Viável)**

### **2.1 Objetivos do MVP**

1. **Centralização:** Consolidar 100% do fluxo de cliente (Lead \-\> Cálculo \-\> Contrato) em uma única plataforma web.  
2. **Precisão Matemática:** Garantir que o motor de cálculo replique com exatidão as metodologias das planilhas periciais (Price, SAC, Juros Simples, Capitalização Diária), validado pelo perito técnico.  
3. **Automação de Input:** Reduzir o tempo de *input* de dados através de OCR (Leitura de PDF) para extração de variáveis-chave do contrato.  
4. **Análise de Viabilidade Rápida:** Permitir que o usuário gere uma "Análise Prévia" (comparativo Taxa Contrato vs. Taxa Média Bacen) em menos de 5 minutos.  
5. **Integração de Dados:** Conectar resultados dos cálculos diretamente à geração de minutas de petição (templates).

### **2.2 Módulos Principais**

**Módulo 1: CRM (Gestão de Relacionamento)**

* **Descrição:** Sistema Kanban para gestão de Leads e Clientes, com funil de vendas editável (Pré-venda, Venda, Pós-venda).  
* **Objetivo:** Gerenciar o ciclo de vida do cliente, armazenar documentos (contratos) e registrar histórico de interações (agendamentos, tarefas, follow-ups).  
* **Funcionalidades Chave:** Cadastro de Leads/Oportunidades, Upload de Documentos, Pipeline visual, Integração com Google Agenda (interna).

**Módulo 2: Cálculo Revisional (Core)**

* **Descrição:** Motor de cálculo financeiro que processa dados contratuais e gera relatórios de viabilidade e planilhas revisionais completas.  
* **Objetivo:** Identificar abusividades (juros acima da média, capitalização indevida, venda casada) e recalcular o saldo devedor.  
* **Sub-módulos:**  
  1. **Financiamento de Veículos/Empréstimos:** Suporte a Tabela Price, Capitalização Diária/Mensal, Expurgo de tarifas (TAC, Seguros).  
  2. **Financiamento Imobiliário:** Suporte a SAC/Price, correção por TR/INPC/IPCA, Seguros (MIP/DFI).  
  3. **Cartão de Crédito:** Recomposição de saldo fatura a fatura (compras, rotativo, pagamentos parciais).  
  4. **Análise Prévia:** Comparativo simplificado com API do Bacen.

**Módulo 3: Gerador de Petições (Básico)**

* **Descrição:** Sistema de geração de documentos baseados em templates (modelos).  
* **Objetivo:** Criar peças jurídicas (ex: Petição Inicial) preenchidas automaticamente com os dados do CRM e os resultados do Cálculo Revisional.

## **3\. Perfis de Usuários**

### **Perfil 1: Administrador (Sócio/Gestor)**

* **Descrição:** Sócios do escritório (ex: Paulo Guedes).  
* **Nível de Acesso:** Completo (CRUD total).  
* **Responsabilidade Principal:** Gerenciar usuários, configurar funis do CRM, visualizar dashboards gerais, definir permissões.  
* **Principais Necessidades:** Controle de acesso, visão macro do pipeline de vendas, gestão de assinaturas (futuro).

### **Perfil 2: Colaborador/Advogado (Operacional)**

* **Descrição:** Advogados e assistentes jurídicos.  
* **Nível de Acesso:** Operacional (Leitura/Escrita em CRM e Cálculos, sem acesso a configs globais).  
* **Responsabilidade Principal:** Atendimento ao cliente, *upload* de contratos, execução de análises prévias e geração de petições.  
* **Principais Necessidades:** Interface ágil para cadastro, facilidade na busca de processos, automação no preenchimento de peças.

### **Perfil 3: Perito Técnico (Validador)**

* **Descrição:** Especialista financeiro (ex: Diego Nascimento).  
* **Nível de Acesso:** Foco no Módulo de Cálculo.  
* **Responsabilidade Principal:** Validar metodologias, ajustar parâmetros complexos de cálculo, analisar casos de Cartão de Crédito (alta complexidade).  
* **Principais Necessidades:** Acesso granular aos parâmetros da fórmula (taxas, datas, expurgos, índices de correção).

## **4\. Requisitos Funcionais Globais (RF)**

**RF-001 \- Autenticação e Gestão de Sessão** O sistema deve possuir login seguro (e-mail/senha), recuperação de senha e suporte a múltiplos perfis de acesso (Admin, Colaborador).

**RF-002 \- Integração com API do Banco Central (SGS)** O sistema deve consumir a API de Séries Temporais do Bacen para obter automaticamente as Taxas Médias de Mercado (a.m. e a.a.) baseadas na data do contrato e tipo de operação (PF/PJ, Veículo, Imobiliário, etc.).

**RF-003 \- OCR para Extração de Dados (PDF)** O sistema deve permitir o upload de contratos em PDF e utilizar OCR para sugerir o preenchimento automático de campos chave (Valor Financiado, Taxa de Juros, Data Contrato, Prazo).

**RF-004 \- Exportação de Relatórios** O sistema deve gerar relatórios de cálculo (Parecer Técnico) e Petições em formatos PDF e Word (.docx) editáveis.

**RF-005 \- Dashboards e Kanban** O sistema deve apresentar os processos em formato de cartões (Kanban) com funcionalidade *drag-and-drop* para mudança de status no funil.

**RF-006 \- Responsividade (Mobile/Desktop)** O sistema deve ser totalmente responsivo, permitindo acesso via desktop e dispositivos móveis, com adaptação de menus e tabelas (Light e Dark Mode).

## **5\. Requisitos Não Funcionais (RNF)**

### **5.1 Tecnologia**

**RNF-001 \- Stack Tecnológico (High-Code)**

* **Frontend:** Vue.js (migrado do WeWeb para garantir performance e customização de UI).  
* **Backend/Database:** Supabase (PostgreSQL) para gestão de dados, auth e *serverless functions*.  
* **Hospedagem:** Vercel ou Cloudflare.  
* **Justificativa:** A complexidade matemática dos cálculos (iterações de arrays para cartões de crédito e séries não periódicas) exigiu sair do Low-Code para garantir estabilidade e precisão.

### **5.2 Usabilidade**

**RNF-002 \- Padrões de UX**

* Interface limpa e moderna ("Soft UI"), inspirada em Conta Azul/Astréa.  
* Suporte nativo a **Dark Mode** e **Light Mode**.  
* Feedback visual imediato durante o processamento de cálculos.

### **5.3 Performance**

**RNF-003 \- Processamento de Cálculos**

* Cálculos complexos (ex: evolução de financiamento imobiliário de 360 meses) devem ser processados e exibidos em menos de 3 segundos.

### **5.4 Segurança**

**RNF-004 \- Proteção de Dados**

* Dados sensíveis (CPF, valores financeiros) devem ser trafegados via HTTPS.  
* O banco de dados deve ter RLS (Row Level Security) configurado no Supabase para isolamento de dados entre *tenants* (preparo para SaaS).

### **5.5 Escalabilidade**

**RNF-005 \- Estrutura SaaS**

* A arquitetura do banco de dados deve suportar múltiplos escritórios (multi-tenancy) desde o dia 1, mesmo que o MVP seja uso interno.

## **6\. Fora do Escopo (Versão Futura/V2)**

As seguintes funcionalidades NÃO farão parte do MVP inicial:

* **Integração VoIP:** Ligações telefônicas direto do navegador (previsto para V2).  
* **IA Generativa Avançada:** Criação de teses jurídicas complexas via IA (o MVP usará templates pré-definidos com preenchimento de variáveis).  
* **API Pública para Terceiros:** Integração aberta para outros softwares jurídicos consumirem o motor de cálculo (previsto para fase SaaS comercial).  
* **Gateway de Pagamentos:** Gestão de cobrança de assinaturas do software (necessário apenas quando virar produto comercial externo).

## **7\. Cronograma Macro**

### **7.1 Prazos Estimados**

* **Fase Atual:** Desenvolvimento High-Code (Back-end de Cálculos e Integração Front-end).  
* **Data de Entrega do MVP (Ambiente de Teste):** Previsão para \[Data a definir com Erisson/Cássio \- Próximas Semanas\].  
* **Testes de Estresse (Cálculos):** Período crítico onde o Perito validará a precisão matemática.

### **7.2 Marcos Principais**

**Marco 1: Deploy em VPS**

* Publicação do ambiente Vue.js \+ Supabase para acesso do cliente (já iniciado).

**Marco 2: Validação do Módulo de Cartão de Crédito**

* Entrega do módulo mais complexo (input de faturas variáveis) para homologação do perito.

## **8\. Riscos e Dependências**

### **8.1 Riscos Identificados**

**R01 \- Precisão Matemática (Alto Impacto)**

* Risco de divergência de centavos entre o sistema e as planilhas Excel devido a arredondamentos ou lógica de juros compostos (dias úteis vs. corridos).  
* **Mitigação:** Bateria de testes comparativos exaustivos com as planilhas fornecidas (`ANÁLISE DE VIABILIDADE - VEÍCULO.xlsx`, `PLANILHA - CÁLCULOS PRICE.xlsx`, etc.).

**R02 \- Complexidade do Módulo de Cartão (Alto Impacto)**

* A lógica de recomposição de saldo devedor com inputs variáveis mês a mês é complexa de modelar em banco de dados relacional.  
* **Mitigação:** Definição rígida dos campos de entrada (conforme reunião de 24/09) e validação passo-a-passo.

### **8.2 Dependências Críticas**

* **Definição de Domínio:** Compra/Definição do domínio final (OctoApps, OctoVeritus, etc.) para configuração de e-mails transacionais (Resend) e DNS.  
* **Validação de Campos do CRM:** Aprovação final da lista de campos customizáveis pelo cliente.

## **9\. Equipe do Projeto**

### **9.1 Equipe Dizevolv**

* **Account Manager:** Leonora Renck.  
* **Líder de Produto:** Danilo Marcello.  
* **Desenvolvedor (High-Code/Fullstack):** Cássio Borralho (Substituto/Sucessor na fase High-Code).  
* **Desenvolvedor (Front-end/Ex-WeWeb):** Diego Alves.  
* **Designer:** Ian Tavares (Fase de prototipação concluída).

### **9.2 Equipe Cliente (Guedes & Ramos)**

* **Stakeholder Principal:** Paulo Roberto Guedes.  
* **Especialista Técnico (Perito):** Diego Nascimento (Validação de Fórmulas).  
* **Infraestrutura/TI:** Erisson Lucas (VPS, Domínios).

## **10\. Critérios de Sucesso**

O projeto será considerado bem-sucedido quando:

1. O sistema realizar cálculos de Financiamento Imobiliário (SAC/Price) e Veículos com precisão igual ou superior às planilhas Excel atuais.  
2. O tempo de geração de uma "Análise Prévia" for reduzido drasticamente (meta: \< 5 min).  
3. O fluxo de CRM permitir a gestão completa do cliente sem necessidade de planilhas paralelas.  
4. O sistema estiver estável em ambiente de produção (High-Code), sem os bugs de plataforma observados no Low-Code.

## **11\. Glossário**

* **SAC:** Sistema de Amortização Constante.  
* **Tabela Price:** Sistema de amortização com prestações constantes.  
* **Capitalização Diária:** Método de cálculo de juros exponencial baseado em dias corridos/úteis.  
* **Taxa Média de Mercado:** Indicador do Bacen usado como parâmetro de abusividade.  
* **High-Code:** Desenvolvimento através de programação tradicional (código fonte), oferecendo maior controle que plataformas visuais (Low-Code).

## **12\. Anexos e Referências**

* Planilhas de Cálculo Base (Veículo, Imobiliário, Cartão).  
* Documento "FÓRMULAS.docx" (Especificação matemática).  
* Protótipo Figma (Layout aprovado).  
* Gravações das reuniões de *Review* e *ZipCalls*.

# PRD 001: Jornada do Administrador

# **PRD 001: Jornada do Administrador**

**Metadados do Documento:**

* ID do Documento: PRD 001  
* Título: Jornada do Administrador (Sócio/Gestor)  
* Status: Em Desenvolvimento  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[Manuela](mailto:manuela.dizevolv@gmail.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Data de Criação: 15/09/2025  
* Última Atualização: 05/12/2025  
* PRD Pai: PRD 000 \- Visão Geral e Contexto do Produto

## **1\. Resumo**

**Quem é este perfil:** Este documento detalha as funcionalidades para o perfil de **Administrador**, que abrange os sócios e gestores do escritório (ex: Paulo Guedes). O Administrador é responsável pela configuração estratégica do sistema OctoApps, gestão da equipe (advogados, peritos e assistentes), definição das etapas do processo comercial (CRM) e monitoramento macro da operação. Ele possui acesso irrestrito a todos os módulos e dados.

**Dores atuais:** Atualmente, este usuário enfrenta desafios como a falta de controle centralizado sobre os acessos e permissões da equipe, a dificuldade em padronizar o funil de vendas (que hoje varia entre planilhas e anotações manuais) e a ausência de uma visão consolidada da produtividade do escritório. Isso resulta na perda de dados críticos quando um colaborador sai, inconsistência no tratamento de leads e risco de segurança da informação.

**Objetivo deste módulo:** O objetivo é fornecer ao Administrador um painel de controle robusto e centralizado que permita o gerenciamento total de usuários (CRUD e Permissões) e a personalização das etapas do CRM (Kanban), substituindo controles manuais descentralizados. O sistema deve garantir que as regras de negócio do escritório sejam refletidas na ferramenta, assegurando a integridade dos dados e a segurança da operação.

**Diferencial:** Isso permitirá que o gestor adapte o fluxo de trabalho (funil de vendas) em tempo real conforme a estratégia do escritório evolui, sem depender de intervenção técnica para mudanças de processo (etapas), resultando em maior agilidade na gestão e controle total sobre quem acessa quais informações sensíveis dos clientes.

## **2\. Histórias de Usuário (User Stories)**

### **Categoria: Visualização/Dashboard**

**História 1:** Como um **Administrador**, eu quero visualizar um dashboard com métricas consolidadas (Total de Oportunidades, Valor em Pipeline, Cálculos Realizados), para que eu possa monitorar a saúde do negócio e a produtividade da equipe em tempo real.

### **Categoria: Gestão de Usuários**

**História 2:** Como um **Administrador**, eu quero cadastrar novos usuários (Advogados, Peritos) enviando convites por e-mail, para que eu possa expandir a equipe de forma autônoma e rápida.

**História 3:** Como um **Administrador**, eu quero editar ou inativar contas de usuários existentes, para que eu possa revogar acessos de ex-colaboradores imediatamente e proteger os dados do escritório.

### **Categoria: Controle de Permissões**

**História 4:** Como um **Administrador**, eu quero definir níveis de permissão granulares (Criar, Ler, Editar, Excluir) para cada módulo, para que eu possa restringir ações sensíveis (como excluir um cliente) apenas a pessoas de confiança.

### **Categoria: Configuração do CRM**

**História 5:** Como um **Administrador**, eu quero criar, editar, excluir e reordenar as etapas do funil de vendas (colunas do Kanban), para que o sistema reflita exatamente o processo comercial atual do escritório (ex: adicionar uma etapa de "Aguardando Documentos").

### **Categoria: Segurança/Auditoria**

**História 6:** Como um **Administrador**, eu quero ter a garantia de que apenas os campos pré-definidos no banco de dados estão disponíveis para preenchimento, para que não haja poluição de dados com campos criados desordenadamente pela equipe operacional (Restrição Técnica R01 do PRD 000).

## **3\. Requisitos Funcionais e Telas**

### **3.1. Dashboard Administrativo (Home)**

**Tela:** "Visão Geral \- Dashboard"

**Acesso:** Primeira tela exibida após o login com credenciais de perfil "Administrador".

**Componentes de Visualização:**

* **Cards de Resumo (KPIs):**  
  * "Oportunidades Ativas": Contador numérico.  
  * "Valor em Pipeline": Soma monetária dos valores das oportunidades.  
  * "Cálculos do Mês": Quantidade de cálculos gerados no período.  
  * "Petições Geradas": Quantidade de documentos criados.  
* **Gráfico de Pipeline:** Visualização de barras ou funil mostrando a distribuição de oportunidades por etapa.  
* **Lista de Atividades Recentes:** Log simplificado das últimas ações no sistema (ex: "Diego criou um novo cálculo").

**Componentes de Interação:** **Menu Lateral (Sidebar):**

* Navegação para: CRM, Cálculos, Petições, Usuários, Configurações.

**Requisitos Técnicos:**

* Os dados devem ser carregados via *queries* otimizadas no Supabase para garantir performance (\< 2s).  
* O dashboard deve respeitar o tema escolhido (Dark/Light Mode).

**Estados da Tela:**

* **Carregando:** Skeleton loader nos cards e gráficos.  
* **Com Dados:** Exibição padrão dos números e gráficos.  
* **Erro:** Mensagem "Não foi possível carregar os indicadores. Tente novamente." com botão de *retry*.

**Responsividade:**

* **Desktop:** Grid de 4 colunas para cards.  
* **Mobile:** Cards empilhados verticalmente em coluna única.

### **3.2. Gerenciamento de Usuários**

**Tela:** "Usuários e Permissões"

**Acesso:** Menu Lateral \> Usuários.

**Componentes de Visualização:**

* **Tabela de Usuários:** Listagem contendo: Nome, E-mail, Perfil (Cargo), Status (Ativo/Inativo), Último Acesso.  
* **Badge de Status:** Verde para Ativo, Cinza/Vermelho para Inativo.

**Componentes de Interação:** **Botões:**

* "Novo Usuário": Abre modal de cadastro.  
* Ações na linha (ícones): "Editar", "Redefinir Senha", "Inativar/Excluir".

**Formulários (Modal de Cadastro/Edição):**

* Nome Completo: Texto \- Obrigatório.  
* E-mail: Email \- Validação de formato e unicidade \- Obrigatório.  
* Perfil: Select (Administrador, Advogado, Perito) \- Obrigatório.  
* Senha Inicial: Password (apenas na criação, se não for convite por link).

**Requisitos Técnicos:**

* Integração com Supabase Auth para criação da credencial.  
* Disparo de e-mail transacional (via Resend) com credenciais ou link de definição de senha (dependência de domínio configurado).

**Estados da Tela:**

* **Vazio:** Mensagem "Nenhum usuário cadastrado além de você." (Raro, pois sempre haverá o admin).  
* **Com Dados:** Lista paginada (10, 20, 50 itens).

**Responsividade:**

* **Mobile:** A tabela se transforma em lista de cards ou permite scroll horizontal.

### **3.3. Configuração de Funil do CRM**

**Tela:** "Configurações \> Etapas do Funil"

**Acesso:** Menu Lateral \> Configurações \> Aba "Funil de Vendas".

**Componentes de Visualização:**

* **Lista Ordenável de Etapas:** Representação visual das colunas do Kanban (ex: Pré-venda, Venda, Pós-venda).  
* **Indicadores:** Ícone de "drag" (arrastar) ao lado de cada nome.

**Componentes de Interação:** **Botões:**

* "Adicionar Etapa": Cria uma nova linha/card na lista.  
* "Salvar Ordem": Persiste a nova ordenação no banco.  
* Ícone "Lixeira": Exclui a etapa (com validação).  
* Ícone "Lápis": Edita o nome da etapa.

**Interação Drag-and-Drop:**

* O usuário clica, segura e arrasta uma etapa para mudar sua posição no funil.

**Requisitos Técnicos:**

* **Validação de Exclusão:** O sistema **NÃO** deve permitir excluir uma etapa que contenha oportunidades vinculadas (Regra de Negócio Crítica). Deve exibir alerta: "Mova os cards desta etapa antes de excluí-la".  
* A alteração deve refletir imediatamente no Módulo de CRM para todos os usuários.

**Estados da Tela:**

* **Erro:** Toast de erro caso tente excluir etapa com dados.  
* **Sucesso:** Toast "Funil atualizado com sucesso".

## **4\. Fluxos de Navegação**

### **4.1 Fluxo Principal: Cadastro de Novo Usuário**

1. Administrador acessa a tela "Usuários" via menu lateral.  
2. Clica no botão "Novo Usuário".  
3. Sistema exibe modal com campos (Nome, E-mail, Perfil).  
4. Administrador preenche os dados e clica em "Salvar/Convidar".  
5. Sistema valida se o e-mail já existe no Supabase Auth.  
6. Sistema cria o registro na tabela `users` e na tabela de autenticação.  
7. Sistema dispara e-mail de boas-vindas (via Resend).  
8. Modal fecha e a tabela atualiza exibindo o novo usuário.  
9. Toast de sucesso: "Usuário cadastrado com sucesso".

### **4.2 Fluxo Alternativo: Reordenação de Etapas do Funil**

1. Administrador acessa "Configurações \> Funil de Vendas".  
2. Identifica a etapa "Negociação" e a arrasta para depois de "Proposta".  
3. Solta o elemento.  
4. Sistema salva automaticamente a nova ordem (index) no banco de dados.  
5. Toast de sucesso: "Ordem atualizada".

### **4.3 Fluxo de Erro: Exclusão de Etapa com Dados**

1. Administrador tenta excluir a etapa "Venda".  
2. Sistema verifica no backend se existem oportunidades com `status_id` vinculado a essa etapa.  
3. Backend retorna erro de integridade (Foreign Key constraint ou validação lógica).  
4. Frontend exibe Modal de Alerta: "Não é possível excluir esta etapa pois existem 15 oportunidades nela. Por favor, mova-as para outra etapa antes de excluir."

## **5\. Regras de Negócio Específicas**

**RN-001: Imutabilidade do Admin Principal**

* **Contexto:** Gestão de Usuários.  
* **Comportamento:** O sistema não deve permitir que o usuário logado exclua ou inative a si mesmo, nem que altere seu próprio perfil para um nível inferior, garantindo que sempre exista pelo menos um Administrador ativo.

**RN-002: Integridade do Funil de Vendas**

* **Contexto:** Configuração do CRM.  
* **Comportamento:** Etapas do funil só podem ser excluídas se estiverem vazias (sem oportunidades ativas, perdidas ou ganhas vinculadas).  
* **Exceção:** Nenhuma. A integridade dos dados históricos é prioritária.

**RN-003: Campos Estáticos (Limitação Técnica)**

* **Contexto:** Configuração de Campos do CRM.  
* **Comportamento:** O Administrador **NÃO** tem permissão para criar novos campos de dados (colunas no banco) via interface. Ele pode apenas editar os rótulos (labels) de campos pré-existentes se a funcionalidade for disponibilizada, ou solicitar alterações à equipe de desenvolvimento (High-Code).

## **6\. Permissões e Controles de Acesso**

### **6.1 O que este perfil PODE fazer:**

* **Gestão Total de Usuários:** Criar, Editar, Inativar qualquer usuário.  
* **Configuração de Negócio:** Alterar etapas do funil, definir metas (futuro).  
* **Visualização Irrestrita:** Ver todos os leads, cálculos e petições de todos os usuários.  
* **Operação Completa:** Executar todas as funções operacionais (criar cálculos, mover cards, gerar petições).

### **6.2 O que este perfil NÃO PODE fazer:**

* **Alteração Estrutural de Banco:** Criar novas colunas ou tabelas dinamicamente (Restrição da arquitetura Supabase/Vue.js atual).  
* **Auto-Exclusão:** Se for o único admin, não pode se excluir.

### **6.3 Visualização de Dados:**

* **Acesso Total a:** Todos os módulos e registros do sistema.

## **7\. Critérios de Aceite**

### **7.1 Funcionalidade**

* O CRUD de usuários funciona corretamente, refletindo no acesso real ao sistema.  
* A reordenação das etapas do funil atualiza a visualização do Kanban no módulo de CRM instantaneamente.  
* A validação que impede exclusão de etapas com dados está funcional.

### **7.2 Usabilidade**

* O *drag-and-drop* das etapas é fluido e funciona em desktop e tablet.  
* O feedback de ações (sucesso/erro) é claro e visível (Toasts).

### **7.3 Performance**

* A listagem de usuários carrega em menos de 1 segundo.  
* A atualização do funil não gera *flicker* excessivo na tela.

### **7.4 Segurança**

* Apenas usuários com `role: admin` conseguem acessar as rotas `/settings` e `/users`. Tentativas de acesso direto via URL por outros perfis redirecionam para a Home ou 403\.

### **7.5 Validação**

* Teste realizado com o cliente (Paulo) criando uma conta para o perito (Diego) e alterando uma etapa do funil.

## **8\. Fora do Escopo para esta Etapa**

As seguintes funcionalidades NÃO serão desenvolvidas para este perfil no MVP:

* **Funcionalidade 1:** Criação de Campos Personalizados.  
  * **Justificativa:** Limitação técnica da arquitetura High-Code/Supabase escolhida para garantir estabilidade; campos devem ser solicitados ao time de dev.  
* **Funcionalidade 2:** Logs de Auditoria Detalhados (Audit Trail completo).  
  * **Justificativa:** Recurso avançado para V2; MVP terá apenas logs básicos de "quem criou/editou" no registro.  
* **Funcionalidade 3:** Gestão de Assinatura/Faturamento do SaaS.  
  * **Justificativa:** Uso inicial é interno, sem necessidade de gateway de pagamento no sistema.

## **9\. Dependências**

### **9.1 Módulos do Sistema**

Este perfil depende dos seguintes módulos estarem funcionais:

* **Módulo de Autenticação (Supabase Auth):** Para gerenciar o login e criação de credenciais.  
* **Módulo de CRM:** Para refletir as configurações de etapas do funil.

### **9.2 Integrações Externas**

* **Serviço de E-mail (Resend):** Para envio de convites de novos usuários e recuperação de senha.

### **9.3 Dados e Entidades**

* **Entidade Usuários:** Deve estar criada no Supabase com campo de `role` ou `profile`.  
* **Tabela de Etapas:** Deve estar populada com o padrão inicial (Lead, Qualificação, Proposta, Negociação, Fechamento).

### **9.4 Dependências do Cliente**

* **Compra do Domínio:** Para configuração correta dos e-mails transacionais de convite de usuário (conforme reunião de 10/10 e 31/10).  
* **Lista de Campos do CRM:** Definição final dos campos estáticos a serem implementados pelos desenvolvedores (Input de Erisson).

## **10\. Entidades de Dados Relacionadas**

### **Entidade 1: Users (Usuários)**

**Descrição:** Armazena dados de login e perfil. **Campos principais:**

* `id`: UUID (PK).  
* `email`: String \- Login.  
* `role`: String/Enum \- Define o nível de acesso (admin, user, perito).  
* `status`: Boolean \- Ativo/Inativo. **Ações permitidas:** Criar, Ler, Atualizar, Deletar (Lógica soft-delete ou inativação).

### **Entidade 2: Funnel\_Stages (Etapas do Funil)**

**Descrição:** Define as colunas do Kanban. **Campos principais:**

* `id`: UUID (PK).  
* `name`: String \- Nome da etapa (ex: "Negociação").  
* `order_index`: Integer \- Posição visual no Kanban.  
* `tenant_id`: UUID \- Identificador do escritório (preparo para SaaS). **Ações permitidas:** Criar, Ler, Atualizar (Nome/Ordem), Deletar (se vazia).

## **11\. Casos de Uso Detalhados**

### **Caso de Uso 1: Alterar Processo Comercial**

**Ator:** Administrador **Pré-condições:** Estar logado. **Fluxo Principal:**

1. Admin acessa Configurações \> Funil.  
2. Percebe que falta uma etapa de "Validação de Documentos".  
3. Clica em "Adicionar Etapa".  
4. Digita "Validação Docs" e salva.  
5. A etapa aparece no final da lista.  
6. Admin arrasta a etapa para a posição 2 (após "Lead").  
7. Sistema salva a nova ordem. **Pós-condições:** O Kanban do CRM exibe a nova coluna na posição correta para todos os usuários.

## **12\. Mensagens e Notificações**

### **12.1 Mensagens de Sucesso**

* **Ação:** Criação de Usuário.  
  * **Mensagem:** "Convite enviado para \[email\] com sucesso."  
  * **Tipo:** Toast Verde.  
* **Ação:** Salvar Ordem do Funil.  
  * **Mensagem:** "Fluxo de vendas atualizado."  
  * **Tipo:** Toast Verde.

### **12.2 Mensagens de Erro**

* **Erro:** Exclusão de etapa com dados.  
  * **Mensagem:** "Esta etapa contém oportunidades ativas. Mova-as antes de excluir."  
  * **Tipo:** Modal de Alerta.  
* **Erro:** E-mail duplicado.  
  * **Mensagem:** "Este e-mail já está cadastrado no sistema."  
  * **Tipo:** Inline no formulário.

## **13\. Anexos e Referências**

* Planilhas de Cálculo Base (Veículo, Imobiliário, Cartão).  
* Documento "FÓRMULAS.docx" (Especificação matemática).  
* Protótipo Figma (Layout aprovado).  
* Gravações das reuniões de *Review* e *ZipCalls*.

## **14\. Histórico de Versões**

**Versão 1.0**

* Data: 15/09/2025  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Mudanças: Criação inicial baseada no PRD 000 e transcrições.

**Versão 1.1**

* Data: 05/12/2025  
* Autor: [Manuela](mailto:manuela.dizevolv@gmail.com)  
* Mudanças: Atualização baseada nas novas transcrições de zipcalls.

# PRD 002: Jornada do Colaborador

# **PRD 002: Jornada do Colaborador (Advogado/Assistente)**

## **Metadados do Documento:**

* ## ID do Documento: PRD 002 (Sequencial ao Admin)

* ## Título: Jornada do Colaborador (Advogado/Assistente)

* Status: Em Desenvolvimento  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[Manuela](mailto:manuela.dizevolv@gmail.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Data de Criação: 15/09/2025  
* Última Atualização: 05/12/2025

* ## PRD Pai: PRD 000 \- Visão Geral e Contexto do Produto

## **1\. Resumo**

## **Quem é este perfil:** Este documento detalha as funcionalidades para o perfil de **Colaborador**, que abrange Advogados, Assistentes Jurídicos e estagiários. O Colaborador é o motor operacional do escritório, responsável pelo atendimento inicial ao cliente, cadastro de oportunidades no CRM, inserção de dados contratuais (manual ou via OCR), execução das análises de viabilidade financeira e geração das minutas de petição.

## **Dores atuais:** Atualmente, este usuário enfrenta desafios como a necessidade de alternar entre múltiplas planilhas Excel complexas para realizar cálculos (Imobiliário, Veículo, Cartão), o risco elevado de erro na digitação de taxas e datas, e a perda de tempo na formatação manual de documentos word para cada cliente. Isso resulta em um tempo médio de atendimento muito alto (horas por cliente), gargalos na produção jurídica e dificuldade em rastrear o histórico do que foi ofertado.

## **Objetivo deste módulo:** O objetivo é fornecer a este perfil uma ferramenta operacional ágil e integrada que permita realizar uma **Análise Prévia de Viabilidade em menos de 5 minutos**, substituindo o uso direto das planilhas "engessadas" por um formulário web inteligente e garantindo que todos os dados do cliente (Lead) até o documento final (Petição) estejam centralizados e seguros.

## **Diferencial:** Isso permitirá a padronização técnica dos cálculos (garantindo que um advogado júnior chegue ao mesmo resultado matemático que o perito sênior) e transformará o processo de "análise artesanal" em uma esteira de produção eficiente, resultando em um aumento mensurável na capacidade de atendimento do escritório.

## **2\. Histórias de Usuário (User Stories)**

### **Categoria: Visualização/Dashboard (CRM)**

## **História 1:** Como um **Advogado**, eu quero visualizar minhas oportunidades em um quadro Kanban (Funil), para que eu possa saber exatamente quais clientes preciso contatar hoje (Follow-up) e em qual etapa da negociação eles estão.

### **Categoria: Criação de Recursos (Cálculo)**

## **História 2:** Como um **Advogado**, eu quero realizar o upload de um contrato (PDF) e ter os dados preenchidos automaticamente (OCR), para que eu reduza o tempo de digitação e minimize erros de input (ex: digitar 0,87% ao invés de 0,087%).

## **História 3:** Como um **Advogado**, eu quero selecionar o tipo específico de cálculo (Imobiliário, Veículo, Cartão) e ter os campos adequados exibidos (ex: Indexador TR para Imobiliário, Capitalização Diária para Veículos), para que o cálculo respeite as particularidades matemáticas de cada produto bancário.

### **Categoria: Gestão/Edição**

## **História 4:** Como um **Advogado**, eu quero editar os dados extraídos ou inserir informações manuais (ex: Taxa pactuada vs Taxa aplicada), para refinar a análise caso o contrato físico esteja ilegível ou contenha aditivos não padronizados.

### **Categoria: Relatórios**

## **História 5:** Como um **Advogado**, eu quero gerar e exportar um relatório de "Análise Prévia" em PDF com o comparativo visual (Gráfico/Tabela) entre a Taxa do Contrato e a Taxa Média do Bacen, para que eu possa apresentar a viabilidade da ação ao cliente de forma comercial e convincente.

### **Categoria: Geração de Documentos**

## **História 6:** Como um **Advogado**, eu quero gerar uma minuta de Petição (Word) que já venha preenchida com os dados do cliente e os resultados do cálculo (Valor da Causa, Valor Incontroverso), para que eu não precise copiar e colar dados manualmente entre sistemas.

## **3\. Requisitos Funcionais e Telas**

### **3.1. Tela Operacional do CRM (Kanban)**

## **Tela:** "Gestão de Oportunidades (CRM)"

## **Acesso:** Menu Lateral \> CRM (Tela inicial padrão do perfil Colaborador).

## **Componentes de Visualização:**

* ## **Quadro Kanban:** Colunas representando as etapas (ex: Lead, Qualificação, Cálculo, Negociação, Fechamento) \- definidas pelo Admin.

* ## **Cards de Oportunidade:** Exibindo Nome do Cliente, Valor da Proposta, Data da última interação, Tag de Tipo (Veículo/Imóvel).

* ## **Filtros Rápidos:** "Meus Leads", "Todos os Leads", "Atrasados".

## **Componentes de Interação:**

* ## **Drag-and-Drop:** Arrastar cards entre colunas para mudar o status.

* ## **Botão "Nova Oportunidade":** Abre modal de cadastro simplificado.

* ## **Clique no Card:** Abre a tela de "Detalhes do Processo/Cliente".

## **Requisitos Técnicos:**

* ## Atualização em tempo real (se outro advogado mover um card, eu vejo).

* ## Paginação ou "Infinite Scroll" dentro das colunas do Kanban se houver muitos leads.

## **Estados da Tela:**

* ## **Vazio:** "Você não possui oportunidades ativas. Clique em \+ para adicionar."

* ## **Com Dados:** Visualização padrão das colunas.

## **Responsividade:**

* ## **Mobile:** As colunas do Kanban viram abas horizontais ou carrossel; visualização em lista vertical disponível.

### **3.2. Cadastro/Execução de Cálculo Revisional**

## **Tela:** "Novo Cálculo Revisional"

## **Acesso:** Dentro do Detalhe do Cliente \> Aba Cálculos \> Botão "Novo Cálculo".

## **Componentes de Visualização:**

* ## **Seletor de Tipo:** Botões grandes para "Financiamento de Veículo", "Imobiliário (SFH/SFI)", "Cartão de Crédito", "Empréstimo Pessoal".

* ## **Área de Upload:** Zona para arrastar PDF do contrato (OCR).

## **Componentes de Interação:** **Formulário Dinâmico (Muda conforme o tipo):** *Se Imobiliário:*

* ## Sistema de Amortização: Select \[SAC, Price, SACRE\].

* ## Indexador: Select \[TR, IPCA, INPC, IGPM\].

* ## Taxa de Juros (a.a. e a.m.): Numérico.

* ## Seguros (MIP/DFI): Numérico. *Se Veículo:*

* ## Capitalização: Select \[Mensal, Diária\].

* ## Tarifas (TAC, Avaliação, Registro): Campos monetários específicos para expurgo. *Comum a todos:*

* ## Valor Financiado, Data Contrato, Prazo (Meses), Data 1º Vencimento.

## **Botões:**

* ## "Processar OCR" (se PDF anexado).

* ## "Calcular Viabilidade".

## **Requisitos Técnicos:**

* ## **API Bacen:** Ao inserir a "Data do Contrato", o sistema deve buscar automaticamente a Taxa Média de Mercado correspondente àquele tipo de operação e preencher o campo "Taxa de Mercado" (editável).

* ## **Validação:** Não permitir datas futuras ou prazos negativos.

## **Estados da Tela:**

* ## **Loading:** "Processando contrato com IA..." durante o OCR.

* ## **Erro:** "Não foi possível ler o PDF. Por favor, preencha manualmente."

### **3.3. Resultado da Análise (Viabilidade)**

## **Tela:** "Dashboard do Cálculo/Análise Prévia"

## **Acesso:** Após clicar em "Calcular Viabilidade".

## **Componentes de Visualização:**

* ## **Resumo Comparativo:** Cards lado a lado: "Cenário Atual (Banco)" vs "Cenário Revisado (Perícia)".

* ## **Indicadores de Abusividade:**

  * ## "Sobretaxa Identificada": % acima da média.

  * ## "Economia Estimada": Valor monetário total (R$).

  * ## "Novo Valor de Parcela": Valor sugerido para consignação.

* ## **Gráfico de Evolução:** Linha do tempo mostrando o Saldo Devedor Banco vs. Saldo Devedor Justo.

* ## **Tabela de Amortização (Preview):** Primeiras 12 parcelas.

## **Componentes de Interação:**

* ## **Botão "Exportar Relatório":** Gera PDF da Análise Prévia (Layout comercial).

* ## **Botão "Salvar no CRM":** Grava o cálculo no histórico do cliente.

* ## **Botão "Gerar Petição":** Leva para o módulo de documentos.

## **Requisitos Técnicos:**

* ## Cálculo deve ser executado no backend (High-Code) para garantir precisão de centavos e performance.

* ## Geração de PDF deve ser rápida (\< 5s).

## **4\. Fluxos de Navegação**

### **4.1 Fluxo Principal: Do Lead à Análise de Viabilidade**

1. ## Advogado acessa o **CRM** e clica em "Nova Oportunidade".

2. ## Preenche dados básicos (Nome: João Silva, Tipo: Financiamento Veículo).

3. ## Entra no detalhe do cliente e vai para a aba **Cálculos**.

4. ## Clica em "Novo Cálculo" \> Seleciona "Veículo".

5. ## Faz upload do contrato PDF. O sistema preenche: Valor 50k, Taxa 2.5% a.m., 48x.

6. ## Advogado confere os dados e clica em "Calcular".

7. ## Sistema consulta API Bacen (Taxa média na data era 1.8%) e roda o algoritmo de Price/Capitalização Diária.

8. ## Tela de Resultado exibe: "Viabilidade Alta \- Economia de R$ 12.000,00".

9. ## Advogado clica em "Exportar PDF" para enviar ao cliente via WhatsApp.

### **4.2 Fluxo Alternativo: Geração de Petição**

1. ## Após o cliente aceitar a proposta, Advogado acessa a aba **Petições**.

2. ## Clica em "Nova Petição" \> Seleciona Modelo "Inicial Revisional Veículo".

3. ## Sistema cruza os dados do cadastro \+ resultado do cálculo salvo.

4. ## Editor de texto abre com a minuta preenchida.

5. ## Advogado revisa, faz ajustes pontuais e baixa o .DOCX final.

## **5\. Regras de Negócio Específicas**

## **RN-001: Bloqueio de Edição de Fórmulas**

* ## **Contexto:** Execução de Cálculos.

* ## **Comportamento:** O Colaborador pode editar os **parâmetros de entrada** (taxas, datas, valores), mas **NUNCA** a lógica da fórmula (ex: como o sistema calcula a Tabela Price ou Juros Compostos). Isso garante a integridade pericial.

## **RN-002: Obrigatoriedade de Indexador (Imobiliário)**

* ## **Contexto:** Cálculo Imobiliário.

* ## **Comportamento:** Para cálculos do tipo Imobiliário, o campo "Indexador" (TR, IPCA, etc.) é obrigatório. O sistema não pode calcular sem essa definição, pois impacta drasticamente o saldo devedor (conforme planilhas SFH).

## **RN-003: Restrição de Exclusão**

* ## **Contexto:** Gestão de Dados.

* ## **Comportamento:** O Colaborador pode excluir cálculos ou rascunhos de petição, mas **NÃO** pode excluir um Cliente/Oportunidade do CRM que já tenha avançado para etapas de "Fechamento" ou "Venda", garantindo histórico para o Administrador.

## **6\. Permissões e Controles de Acesso**

### **6.1 O que este perfil PODE fazer:**

* ## **CRM:** Criar, Editar e Mover leads; Agendar tarefas e reuniões.

* ## **Cálculos:** Criar ilimitados cálculos, Editar inputs, Exportar relatórios.

* ## **Petições:** Gerar documentos a partir de templates, Editar texto final.

* ## **Visualização:** Ver todos os leads (ou apenas os seus, dependendo da config do Admin).

### **6.2 O que este perfil NÃO PODE fazer:**

* ## **Configuração:** Alterar etapas do funil de vendas, criar novos usuários.

* ## **Estrutura:** Criar novos campos personalizados no banco de dados.

* ## **Exclusão Crítica:** Deletar histórico de vendas ganhas.

### **6.3 Visualização de Dados:**

* ## **Acesso Total a:** Dados operacionais dos clientes e processos.

## **7\. Critérios de Aceite**

### **7.1 Funcionalidade**

* ## O upload de PDF deve identificar corretamente campos chave (Valor, Prazo, Taxa) em pelo menos 80% dos contratos bancários padrão.

* ## O cálculo deve retornar o mesmo resultado ("Diferença Total") que a planilha Excel de validação fornecida pelo perito.

### **7.2 Usabilidade**

* ## O formulário de cálculo deve reagir ao tipo de contrato (ex: esconder campo "TR" se for Veículo).

* ## A exportação de PDF deve manter a formatação visual (Logo, Cores) definida no Moodboard.

### **7.3 Performance**

* ## A transição entre a tela de input e o resultado do cálculo deve levar menos de 3 segundos.

### **7.4 Segurança**

* ## O advogado só visualiza os dados do *tenant* (escritório) ao qual pertence (preparo para SaaS).

## **8\. Fora do Escopo para esta Etapa**

* ## **Funcionalidade 1:** Edição colaborativa em tempo real da petição (estilo Google Docs).

  * ## **Justificativa:** Complexidade técnica alta para o MVP; edição será via download e Word local ou editor simples.

* ## **Funcionalidade 2:** VoIP Integrado (Chamada de voz no navegador).

  * ## **Justificativa:** Apenas ícone de atalho ("Click to Call" via app externo/celular) será entregue no MVP.

* ## **Funcionalidade 3:** Extração de dados complexos de faturas de cartão de crédito (várias páginas).

  * ## **Justificativa:** OCR inicial foca em contratos de empréstimo/financiamento (estruturados). Cartão será input manual assistido no MVP.

## **9\. Dependências**

### **9.1 Módulos do Sistema**

* ## **Módulo de Cálculo (Backend):** As fórmulas (Price, SAC, Juros Proporcionais) devem estar 100% implementadas e testadas no Supabase/Code.

* ## **Módulo de Templates:** Os modelos de petição (.docx) devem estar carregados no sistema.

### **9.2 Integrações Externas**

* ## **API OCR (Google Document AI ou similar):** Para leitura dos contratos.

* ## **API Bacen:** Para consulta automática de taxas médias.

### **9.3 Dados e Entidades**

* ## **Tabela de Clientes/Oportunidades:** Deve permitir campos nulos para dados que ainda não foram capturados (ex: número do processo).

## **10\. Entidades de Dados Relacionadas**

### **Entidade 1: Opportunities (Oportunidades/Leads)**

## **Descrição:** O "dossiê" do cliente. **Campos principais:**

* ## `id`: UUID.

* ## `client_name`: Texto.

* ## `contract_type`: Enum (Veículo, Imóvel, Pessoal, Cartão).

* ## `status_id`: FK (Etapa do Funil). **Ações:** Criar, Ler, Atualizar.

### **Entidade 2: Calculations (Cálculos)**

## **Descrição:** Registro de uma simulação financeira. **Campos principais:**

* ## `opportunity_id`: FK.

* ## `input_data`: JSON (contém valor financiado, taxas, datas).

* ## `result_summary`: JSON (valor da causa, economia, abusividade).

* ## `created_at`: Data. **Ações:** Criar, Ler, Atualizar (cria nova versão ou sobrescreve, a definir).

## **11\. Casos de Uso Detalhados**

### **Caso de Uso 1: Análise de Viabilidade Imobiliária (Fluxo Feliz)**

## **Ator:** Colaborador **Pré-condições:** Ter o contrato PDF em mãos. **Fluxo Principal:**

1. ## Acessa oportunidade e clica em "Novo Cálculo \> Imobiliário".

2. ## Faz upload do PDF. Sistema preenche: R$ 300.000,00, 360 meses, SAC, Taxa 9% a.a.

3. ## Colaborador verifica que o sistema não identificou o Indexador. Seleciona "TR" manualmente.

4. ## Clica em "Calcular".

5. ## Sistema retorna: "Taxa Média na época era 7.5%. Sobretaxa identificada. Economia potencial de R$ 70.000,00".

6. ## Colaborador gera PDF e anexa ao CRM.

### **Caso de Uso 2: Análise de Veículo com Capitalização Diária**

## **Ator:** Colaborador **Fluxo Principal:**

1. ## Seleciona "Cálculo \> Veículo".

2. ## Preenche dados manualmente (sem PDF).

3. ## Seleciona checkbox "Verificar Capitalização Diária".

4. ## Sistema compara a taxa mensal nominal vs efetiva e identifica divergência.

5. ## Resultado exibe alerta: "Capitalização Diária detectada mas não prevista em contrato".

## **12\. Mensagens e Notificações**

### **12.1 Mensagens de Sucesso**

* ## **Ação:** Salvar Cálculo.

  * ## **Mensagem:** "Cálculo salvo no histórico do cliente." (Toast Verde)

* ## **Ação:** OCR Concluído.

  * ## **Mensagem:** "Dados extraídos com sucesso. Por favor, confira os campos." (Toast Azul)

### **12.2 Mensagens de Erro**

* ## **Erro:** Falha no OCR.

  * ## **Mensagem:** "Não foi possível ler o arquivo. Certifique-se que é um PDF válido ou preencha manualmente." (Modal)

* ## **Erro:** Dados Inconsistentes.

  * ## **Mensagem:** "A Data do Primeiro Vencimento não pode ser anterior à Data do Contrato." (Inline no campo)

## **13\. Anexos e Referências**

* Planilhas de Cálculo Base (Veículo, Imobiliário, Cartão).  
* Documento "FÓRMULAS.docx" (Especificação matemática).  
* Protótipo Figma (Layout aprovado).  
* Gravações das reuniões de *Review* e *ZipCalls*.

## **14\. Histórico de Versões**

**Versão 1.0**

* Data: 15/09/2025  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Mudanças: Criação inicial baseada no PRD 000 e transcrições.

**Versão 1.1**

* Data: 05/12/2025  
* Autor: [Manuela](mailto:manuela.dizevolv@gmail.com)  
* Mudanças: Atualização baseada nas novas transcrições de zipcalls.

## 

# PRD 003: Jornada do Perito Técnico

# **PRD 003: Jornada do Perito Técnico**

**Metadados do Documento:**

* ID do Documento: PRD 003 (Sequencial ao Colaborador)  
* Título: Jornada do Perito Técnico  
* Status: Em Desenvolvimento  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[Manuela](mailto:manuela.dizevolv@gmail.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Data de Criação: 15/09/2025  
* Última Atualização: 05/12/2025  
* PRD Pai: PRD 000 \- Visão Geral e Contexto do Produto

## **1\. Resumo**

**Quem é este perfil:** Este documento detalha as funcionalidades para o perfil de **Perito Técnico**, representado pela figura do especialista financeiro (ex: Diego Nascimento). O Perito é a autoridade matemática do sistema, responsável por validar a metodologia dos cálculos, configurar parâmetros avançados (índices de correção, expurgo de taxas específicas) e, crucialmente, executar a **recomposição de dívidas complexas**, como as de Cartão de Crédito, que exigem análise fatura a fatura.

**Dores atuais:** Atualmente, este usuário depende exclusivamente de planilhas Excel extremamente pesadas e complexas, que, embora precisas, são difíceis de manter, não possuem integração com o banco de dados de clientes e exigem "retrabalho" manual para gerar relatórios visuais. Além disso, a validação de cálculos feitos por advogados júnior é demorada, pois exige a conferência célula a célula no Excel.

**Objetivo deste módulo:** O objetivo é fornecer ao Perito uma interface de "Cálculo Avançado" (High-Code) que ofereça a mesma flexibilidade matemática do Excel (edição de parcelas individuais, ajuste de datas, seleção de séries não periódicas), mas com a segurança e integridade de um banco de dados relacional. O sistema deve permitir que o Perito audite e refine os cálculos iniciados pelos advogados.

**Diferencial:** Isso permitirá a **centralização da inteligência pericial** no software, garantindo que casos complexos (ex: pagamentos parciais fora de data, recálculo de rotativo com taxas médias variáveis) sejam tratados com rigor técnico, resultando em Pareceres Técnicos padronizados e à prova de contestações bancárias superficiais.

## **2\. Histórias de Usuário (User Stories)**

### **Categoria: Visualização/Dashboard**

**História 1:** Como um **Perito**, eu quero visualizar uma lista filtrada de "Cálculos Pendentes de Validação" ou "Casos Complexos", para que eu possa focar minha atenção apenas nos processos que exigem expertise técnica avançada, sem me perder no fluxo comercial do CRM.

### **Categoria: Edição Avançada de Cálculo**

**História 2:** Como um **Perito**, eu quero poder editar manualmente os valores de uma parcela específica (ex: parcela 16 paga parcialmente em data diferente), para que o recálculo do saldo devedor reflita a realidade fática dos pagamentos realizados pelo cliente (comportamento "Realizado" vs "Pactuado").

**História 3:** Como um **Perito**, eu quero selecionar ou alterar o **Indexador de Correção Monetária** (TR, INPC, IPCA) e o regime de capitalização (Juros Simples vs Compostos) em um cálculo já existente, para simular diferentes cenários jurídicos e encontrar a tese mais vantajosa.

### **Categoria: Módulo de Cartão de Crédito (Complexo)**

**História 4:** Como um **Perito**, eu quero uma interface de grid (tabela editável) para imputar os dados variáveis de cada fatura mensal (Saldo Anterior, Compras, Pagamentos, Juros Cobrados), para que eu possa reconstruir a evolução da dívida do cartão de crédito mês a mês, expurgando encargos indevidos.

### **Categoria: Relatórios Técnicos**

**História 5:** Como um **Perito**, eu quero gerar o "Parecer Técnico Pericial" completo, contendo as 5 tabelas de apêndice (Evolução Banco, Recálculo Média, Diferenças, Repetição de Indébito), para que este documento sirva como prova robusta no processo judicial.

### **Categoria: Auditoria**

**História 6:** Como um **Perito**, eu quero visualizar lado a lado a "Taxa Contratual" e a "Taxa Média Bacen" aplicada pelo sistema, com a possibilidade de *override* (sobreposição manual), para casos onde a série temporal automática do Banco Central precise de ajuste específico (ex: taxa média de cheque especial vs crédito pessoal).

## **3\. Requisitos Funcionais e Telas**

### **3.1. Dashboard do Perito**

**Tela:** "Central de Perícia"

**Acesso:** Menu Lateral \> Cálculos (Visão diferenciada para o perfil Perito).

**Componentes de Visualização:**

* **Tabela de Casos:** Lista de cálculos com colunas: Cliente, Tipo (Veículo/Cartão/Imóvel), Data Criação, Status (Rascunho/Validado), Responsável.  
* **Filtros Avançados:** Filtrar por "Tipo de Contrato", "Margem de Abusividade (\>20%)", "Aguardando Parecer".

**Componentes de Interação:**

* **Botão "Validar":** Marca o cálculo como revisado tecnicamente (selo de qualidade).  
* **Botão "Editar Avançado":** Abre a interface de manipulação de parâmetros.

**Requisitos Técnicos:**

* Performance para carregar listas grandes de cálculos.

**Estados da Tela:**

* **Vazio:** "Nenhum cálculo aguardando revisão técnica."

### **3.2. Editor Avançado de Financiamento (Imóvel/Veículo)**

**Tela:** "Detalhamento e Ajuste de Cálculo"

**Acesso:** Clicar em um cálculo na lista \> Botão "Modo de Edição Avançada".

**Componentes de Visualização:**

* **Grid de Evolução (Tabela Price/SAC):** Tabela com todas as parcelas (0 a N). Colunas: Nº, Data Vencimento, Valor Parcela, Juros, Amortização, Saldo Devedor.  
* **Painel de Parâmetros Globais:** Taxa Juros, Sistema Amortização, Capitalização (Diária/Mensal), Tarifas a Expurgar.

**Componentes de Interação:**

* **Edição Inline na Grid:** O Perito pode clicar na célula "Valor Pago" ou "Data Pagamento" de qualquer linha e alterar o valor. O sistema deve recalcular automaticamente as linhas subsequentes (saldo devedor).  
* **Checkboxes de Expurgo:** Lista de tarifas (TAC, Seguros, Avaliação) com checkbox para ativar/desativar sua inclusão no saldo devedor inicial.

**Requisitos Técnicos:**

* **Recálculo em Cadeia:** Ao alterar a parcela 10, o sistema (backend high-code) deve reprocessar instantaneamente o saldo devedor da parcela 10 até a 360\.  
* **Precisão:** Casas decimais de taxas devem suportar até 8 dígitos (ex: 0,00565414% a.m.).

**Estados da Tela:**

* **Processando:** Indicador visual de recálculo ao alterar uma célula.

### **3.3. Reconstrutor de Cartão de Crédito**

**Tela:** "Revisão de Cartão de Crédito (Evolução Mensal)"

**Acesso:** Novo Cálculo \> Tipo "Cartão de Crédito".

**Componentes de Visualização:**

* **Grid de Faturas (Horizontal/Mensal):** Linhas representando os meses. Colunas representando os componentes da fatura (conforme planilha `PLANILHA NOVA - CARTÃO`):  
  * Saldo Anterior  
  * Compras/Despesas  
  * Pagamentos/Créditos  
  * Juros Cobrados (Banco)  
  * Multa/Mora  
  * **Encargos Recalculados (Sistema)**  
  * Novo Saldo Devedor

**Componentes de Interação:**

* **Botão "Adicionar Fatura":** Cria uma nova linha na sequência cronológica.  
* **Inputs Monetários:** Campos para digitar os valores extraídos do PDF da fatura.  
* **Seletor de Data Base:** Para buscar a taxa média correta daquele mês específico.

**Requisitos Técnicos:**

* **Lógica de Rotativo:** O sistema deve identificar se o "Pagamento" foi menor que o "Total da Fatura" e aplicar automaticamente os juros (Média de Mercado) sobre o residual para o mês seguinte.  
* **Complexidade:** Esta é a tela mais complexa do sistema, exigindo manipulação de *arrays* de objetos no Vue.js e persistência JSON no Supabase.

## **4\. Fluxos de Navegação**

### **4.1 Fluxo Principal: Auditoria e Ajuste Fino**

1. Perito acessa "Central de Perícia".  
2. Seleciona um cálculo de Financiamento Imobiliário feito por um advogado.  
3. Entra no "Modo de Edição Avançada".  
4. Verifica que o advogado esqueceu de marcar o expurgo do "Seguro Venda Casada".  
5. Perito marca o checkbox "Expurgar Seguros".  
6. O sistema recalcula toda a evolução da dívida.  
7. Perito nota que na parcela 12 houve uma amortização extraordinária de R$ 10.000,00 (observada no extrato).  
8. Perito vai na linha 12, coluna "Amortização Extra", e insere 10.000,00.  
9. Sistema ajusta o saldo final.  
10. Perito clica em "Salvar e Validar".

### **4.2 Fluxo: Reconstrução de Cartão de Crédito**

1. Perito inicia cálculo de Cartão.  
2. Define data inicial (ex: Jan/2020).  
3. Insere dados da Fatura 1: Compras R$ 1.000, Pagamento R$ 200 (Mínimo).  
4. Sistema projeta saldo para Fatura 2 aplicando Taxa Média (não a do banco).  
5. Perito insere dados da Fatura 2: Compras R$ 500, Pagamento R$ 0\.  
6. Sistema acumula e projeta Fatura 3\.  
7. Repete até a data atual.  
8. Gera relatório comparando "Dívida Cobrada pelo Banco" vs "Dívida Real Recalculada".

## **5\. Regras de Negócio Específicas**

**RN-001: Precedência da Edição Manual**

* **Contexto:** Grid de Evolução.  
* **Comportamento:** Se o Perito inserir um valor manual em uma célula de pagamento, este valor sobrescreve a lógica de cálculo padrão para aquele mês específico, e o saldo devedor subsequente deve respeitar esse *input* manual (evento fático).

**RN-002: Taxa Proporcional (Dias Corridos)**

* **Contexto:** Cálculos de Veículo/Empréstimo com atraso ou carência.  
* **Comportamento:** O sistema deve aplicar a fórmula de taxa proporcional exponencial `[(1+i)^(d/30) - 1]` e não regra de três simples, conforme exigência técnica do perito (Documento FÓRMULAS.docx).

**RN-003: Imutabilidade do Parecer Emitido**

* **Contexto:** Relatórios.  
* **Comportamento:** Após o Perito marcar um cálculo como "Validado/Emitido", ele é travado para edição por outros perfis (Advogados). Apenas o Perito ou Admin podem destravá-lo, garantindo que a peça jurídica não use um cálculo alterado acidentalmente.

## **6\. Permissões e Controles de Acesso**

### **6.1 O que este perfil PODE fazer:**

* **Edição Profunda:** Alterar qualquer parâmetro de cálculo (taxas, datas, valores, índices).  
* **Validação:** Alterar status do cálculo para "Validado".  
* **Gestão de Modelos:** Criar/Salvar *presets* de cálculo (ex: "Modelo Santander Veículo 2024").

### **6.2 O que este perfil NÃO PODE fazer:**

* **Gestão Administrativa:** Excluir usuários, alterar configurações de faturamento.  
* **Exclusão de Logs:** Apagar o histórico de quem criou o cálculo originalmente.

### **6.3 Visualização de Dados:**

* **Acesso Total a:** Módulo de Cálculos e documentos vinculados (Contratos).  
* **Acesso Parcial a:** CRM (apenas leitura para contexto, sem necessidade de mover cards de vendas).

## **7\. Critérios de Aceite**

### **7.1 Funcionalidade**

* A edição manual de uma parcela intermediária deve atualizar corretamente o saldo devedor final (Lógica de Recálculo em Cascata).  
* O módulo de Cartão de Crédito deve permitir a inserção de pelo menos 60 meses (60 linhas) de faturas sem travar o navegador.

### **7.2 Usabilidade**

* A grid de edição deve suportar navegação via teclado (Tab/Enter) para agilizar a digitação de dados (UX similar ao Excel).  
* Visualização clara das diferenças (Delta) entre o valor original e o recalculado.

### **7.3 Performance**

* Recálculo de 360 parcelas após edição de parâmetro deve ocorrer em \< 1 segundo (feedback instantâneo).

### **7.4 Segurança**

* Logs de alteração: O sistema deve registrar "Valor da parcela 10 alterado manualmente por \[Nome do Perito\]".

## **8\. Fora do Escopo para esta Etapa**

* **Funcionalidade 1:** Importação automática de extratos bancários (OFX/PDF não padronizado).  
  * **Justificativa:** Complexidade de *parser* muito alta; input será manual ou via OCR assistido no futuro.  
* **Funcionalidade 2:** Edição de Fórmulas Matemáticas (Código).  
  * **Justificativa:** O Perito não edita o código Vue.js; ele edita os parâmetros. Se a fórmula estiver errada (bug), requer intervenção do desenvolvedor.

## **9\. Dependências**

### **9.1 Módulos do Sistema**

* **Backend de Cálculo:** Endpoints que aceitem *arrays* de pagamentos customizados (overrides) e retornem a evolução recalculada.

### **9.2 Integrações Externas**

* **API Bacen:** Para buscar séries históricas de taxas para cada mês inputado no módulo de cartão.

### **9.3 Dados e Entidades**

* **Tabela `calculation_overrides`:** Estrutura no banco para armazenar as exceções manuais inseridas pelo perito (ex: Parcela 10 \= R$ 500,00).

## **10\. Entidades de Dados Relacionadas**

### **Entidade 1: Calculation\_Details (Detalhes do Cálculo)**

**Descrição:** Armazena o estado detalhado de cada cálculo. **Campos principais:**

* `id`: UUID.  
* `calculation_id`: FK.  
* `overrides`: JSONB (Armazena as edições manuais: `{ "installment_10": { "paid_amount": 500, "date": "2023-01-01" } }`).  
* `verified_by`: FK (ID do Perito).  
* `verified_at`: Timestamp.

### **Entidade 2: Credit\_Card\_Invoices (Faturas de Cartão)**

**Descrição:** Armazena os dados mensais para cálculos de cartão. **Campos principais:**

* `calculation_id`: FK.  
* `month_ref`: Date.  
* `total_bill`: Decimal.  
* `paid_amount`: Decimal.  
* `purchases`: Decimal.  
* `fees`: Decimal.

## **11\. Casos de Uso Detalhados**

### **Caso de Uso 1: Ajuste de Amortização Extraordinária**

**Ator:** Perito **Pré-condições:** Cálculo Imobiliário gerado. **Fluxo Principal:**

1. Perito acessa o cálculo.  
2. Identifica que o cliente usou FGTS para amortizar 20 mil na parcela 24\.  
3. Entra na Grid de Edição.  
4. Localiza a linha 24\.  
5. No campo "Amortização Extra", digita 20.000,00.  
6. O sistema recalcula o Saldo Devedor a partir da linha 24, reduzindo os juros das parcelas 25 em diante.  
7. Perito confere o novo saldo final e salva.

### **Caso de Uso 2: Reconstrução de Dívida de Cartão**

**Ator:** Perito **Fluxo Principal:**

1. Cria cálculo tipo "Cartão".  
2. Insere dados de Jan/2023: Fatura R$ 5.000, Pagou R$ 1.000.  
3. Sistema aplica juros de mercado sobre os R$ 4.000 restantes para Fev/2023.  
4. Insere dados de Fev/2023: Compras R$ 2.000, Pagou R$ 0\.  
5. Sistema soma (Saldo Anterior Corrigido \+ Compras) e aplica juros sobre o total.  
6. Perito repete até o mês atual e gera o relatório de "Indébito" (Diferença entre o cobrado pelo banco e o calculado).

## **12\. Mensagens e Notificações**

### **12.1 Mensagens de Sucesso**

* **Ação:** Validação.  
  * **Mensagem:** "Cálculo validado com sucesso. Disponível para geração de petição."  
* **Ação:** Recálculo.  
  * **Mensagem:** "Evolução recalculada com base nos ajustes manuais."

### **12.2 Mensagens de Erro**

* **Erro:** Data Inválida.  
  * **Mensagem:** "A data de pagamento não pode ser anterior ao vencimento da fatura anterior."

## **13\. Anexos e Referências**

* Planilhas de Cálculo Base (Veículo, Imobiliário, Cartão).  
* Documento "FÓRMULAS.docx" (Especificação matemática).  
* Protótipo Figma (Layout aprovado).  
* Gravações das reuniões de *Review* e *ZipCalls*.

## **14\. Histórico de Versões**

**Versão 1.0**

* Data: 15/09/2025  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Mudanças: Criação inicial baseada no PRD 000 e transcrições.

**Versão 1.1**

* Data: 05/12/2025  
* Autor: [Manuela](mailto:manuela.dizevolv@gmail.com)  
* Mudanças: Atualização baseada nas novas transcrições de zipcalls.

# PRD 004: Jornada da IA Integrada

# **PRD 004: Jornada da IA Integrada**

**Metadados do Documento:**

* ID do Documento: PRD 004 (Sequencial ao Perito)  
* Título: Jornada da IA Integrada (Automação e OCR)  
* Status: Em Desenvolvimento  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[Manuela](mailto:manuela.dizevolv@gmail.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Data de Criação: 15/09/2025  
* Última Atualização: 05/12/2025  
* PRD Pai: PRD 000 \- Visão Geral e Contexto do Produto

## **1\. Resumo**

**Quem é este perfil:** A "IA Integrada" não é um usuário humano, mas um agente de software autônomo que interage com o sistema. Ela atua como um assistente virtual ultra-rápido, responsável por ler documentos PDF (contratos bancários e faturas), extrair dados estruturados (valores, datas, taxas) e sugerir o preenchimento de campos para os advogados e peritos.

**Dores atuais:** O processo manual de "olhar para o PDF e digitar no sistema" é a maior fonte de erros e lentidão no escritório. Advogados perdem tempo procurando onde está a "Taxa de Juros Mensal" em contratos de 20 páginas com layouts variados (Caixa, Bradesco, Itaú). Além disso, a digitação incorreta de um único dígito (ex: 1.2% vs 12%) invalida todo o cálculo pericial.

**Objetivo deste módulo:** O objetivo é implementar um pipeline de IA (OCR \+ Processamento de Linguagem Natural) que transforme documentos não estruturados (PDFs/Imagens) em dados JSON estruturados prontos para cálculo. A IA deve "ler" o contrato em segundos e apresentar os dados para validação humana, reduzindo o tempo de input em até 80%.

**Diferencial:** A capacidade de interpretar não apenas o texto (OCR simples), mas o contexto jurídico-financeiro (ex: distinguir "Data de Emissão" de "Data de Vencimento da 1ª Parcela"), aprendendo com os padrões dos principais bancos nacionais.

## **2\. Histórias de Usuário (User Stories)**

### **Categoria: Extração de Dados (OCR)**

**História 1:** Como um **Sistema**, eu quero processar um arquivo PDF de contrato bancário enviado pelo usuário, identificando e extraindo automaticamente os campos-chave (Valor Financiado, Taxa de Juros, Prazo, Data Contrato), para eliminar a necessidade de digitação manual.

**História 2:** Como um **Sistema**, eu quero identificar se o documento enviado é legível (texto selecionável) ou uma imagem digitalizada (foto/scan), aplicando a técnica de OCR adequada para cada caso, para garantir a leitura mesmo de documentos antigos.

### **Categoria: Interpretação de Contexto**

**História 3:** Como um **Sistema**, eu quero distinguir entre diferentes tipos de contrato (Veículo vs Imóvel) baseando-me em palavras-chave no texto (ex: "Alienação Fiduciária de Veículo", "SFH", "SFI"), para sugerir automaticamente o tipo de cálculo correto ao advogado.

**História 4:** Como um **Sistema**, eu quero localizar tabelas de evolução de pagamentos ou faturas de cartão de crédito e extrair linhas repetitivas (arrays de dados), para preencher as grids de cálculo complexas (módulo Perito) sem intervenção manual.

### **Categoria: Feedback e Aprendizado**

**História 5:** Como um **Sistema**, eu quero apresentar um índice de confiança ("Score") para cada dado extraído (ex: "Taxa: 2.5% \- Confiança: Alta"), alertando o usuário quando um campo estiver ambíguo ou ilegível, para que ele foque sua revisão apenas onde é necessário.

## **3\. Requisitos Funcionais e Fluxos**

### **3.1. Pipeline de Extração de Contrato**

**Gatilho:** Usuário faz upload de um PDF na tela de "Novo Cálculo".

**Processo (Backend):**

1. **Validação de Arquivo:** Verifica se é PDF, JPG ou PNG. Tamanho máx: 20MB.  
2. **Pré-processamento:** Melhora contraste e rotação (se imagem).  
3. **Execução OCR:** Envia para API de Visão Computacional (Google Document AI ou AWS Textract).  
4. **Parsing (LLM/Regex):**  
   * Procura padrões: `R$ [0-9.,]+` perto de "Valor Financiado".  
   * Procura datas: `[0-9]{2}/[0-9]{2}/[0-9]{4}` perto de "Assinatura" ou "Vencimento".  
   * Procura taxas: `[0-9,]+%` perto de "a.m." ou "mensal".  
5. **Mapeamento:** Converte os dados brutos para o objeto JSON esperado pelo Módulo de Cálculo.  
   * `contract_date`: "2023-05-10"  
   * `amount`: 50000.00  
   * `interest_rate_monthly`: 1.85

**Saída (Frontend):**

* Preenche os inputs do formulário automaticamente.  
* Exibe notificação: "Dados extraídos. Por favor, confira os campos destacados em amarelo (baixa confiança)."

### **3.2. Tratamento de Faturas de Cartão (Complexo)**

**Gatilho:** Usuário faz upload de múltiplos PDFs de fatura.

**Processo:**

1. A IA deve iterar sobre cada arquivo.  
2. Identificar o cabeçalho da fatura (Mês de Referência).  
3. Localizar o bloco de "Resumo da Fatura":  
   * Valor Total  
   * Pagamento Mínimo  
   * Pagamento Realizado  
4. Localizar o bloco de "Lançamentos":  
   * Filtrar apenas linhas de Juros, Multa, IOF e Anuidade.  
   * Ignorar compras (ou somar o total de compras do mês se necessário para a recomposição).  
5. **Ordenação Cronológica:** A IA deve ordenar os dados extraídos por data de vencimento, independentemente da ordem de upload.

**Saída:**

* Popula a grid do "Reconstrutor de Cartão" (Jornada do Perito) com uma linha para cada mês identificado.

## **4\. Regras de Negócio da IA**

**RN-001: Formatação de Valores Monetários**

* **Contexto:** Extração de valores.  
* **Comportamento:** A IA deve converter o padrão brasileiro (`1.000,00`) para o padrão de banco de dados (`1000.00`). Deve ter tolerância a erros comuns de OCR (ex: confundir `.` com `,` ou `O` com `0`).

**RN-002: Prioridade de Taxas**

* **Contexto:** Contratos com múltiplas taxas (Nominal vs Efetiva).  
* **Comportamento:** Se o contrato apresentar "Taxa Nominal" e "Taxa Efetiva" (CET), a IA deve priorizar a extração da **Taxa de Juros Mensal Efetiva** para preenchimento do campo de cálculo, pois é a taxa base para a conferência matemática (CET inclui encargos que são tratados separadamente).

**RN-003: Bloqueio de Senha**

* **Contexto:** PDFs protegidos.  
* **Comportamento:** Se o PDF tiver senha de abertura (comum em faturas de cartão enviadas por e-mail), a IA deve falhar imediatamente e retornar erro específico: "Arquivo protegido por senha. Remova a senha e tente novamente." (Não tentaremos quebrar senhas).

## **5\. Integrações e Tecnologia**

### **5.1 Stack Sugerida (High-Code)**

* **Motor de OCR:** Google Cloud Document AI (pré-treinado para formulários) ou Azure Form Recognizer.  
* **Camada de Inteligência (Opcional):** OpenAI GPT-4o (via API) para interpretação de texto não estruturado ("Onde está a multa neste texto jurídico confuso?").  
* **Orquestração:** n8n ou código Python (Lambda/Cloud Functions) acionado pelo Supabase Storage (evento de upload).

### **5.2 Estrutura de Dados (JSON de Saída)**

{

  "document\_type": "veiculo\_financiamento",

  "confidence\_score": 0.95,

  "extracted\_data": {

    "valor\_financiado": { "value": 45000.00, "confidence": 0.99 },

    "taxa\_mensal": { "value": 1.45, "confidence": 0.98 },

    "data\_contrato": { "value": "2022-01-15", "confidence": 0.95 },

    "primeiro\_vencimento": { "value": "2022-02-15", "confidence": 0.85 },

    "sistema\_amortizacao": { "value": "CDC", "confidence": 0.90 }

  }

}

## **6\. Critérios de Aceite**

### **6.1 Acurácia**

* A IA deve extrair corretamente (sem necessidade de edição) a **Taxa de Juros** e o **Valor Financiado** em pelo menos 90% dos contratos digitalizados com boa qualidade (300dpi).

### **6.2 Performance**

* O tempo total entre o upload e o preenchimento dos campos não deve exceder **10 segundos** para contratos simples (até 5 páginas).

### **6.3 Tratamento de Erros**

* Se a IA não encontrar um campo obrigatório (ex: Data do Contrato), ela deve deixar o campo em branco no formulário e marcar visualmente como "Pendente de Preenchimento". Não pode "inventar" ou "alucinar" dados.

## **7\. Fora do Escopo para esta Etapa**

* **Funcionalidade 1:** Classificação automática de cláusulas abusivas no texto jurídico (ex: ler o contrato todo e dizer "A cláusula 5 é ilegal").  
  * **Justificativa:** O foco do MVP é extração de **dados numéricos** para cálculo, não análise semântica jurídica.  
* **Funcionalidade 2:** Leitura de fotos de celular de baixa qualidade/amassadas.  
  * **Justificativa:** Exige pré-processamento de imagem avançado; MVP focará em PDFs nativos ou scans de mesa.

## **8\. Riscos**

**R01 \- Alucinação de Dados (Médio Impacto)**

* A IA pode confundir "Taxa de Juros de Mora" (multa) com "Taxa de Juros Remuneratórios" (contrato).  
* **Mitigação:** Interface de revisão clara para o usuário humano antes de salvar o cálculo.

**R02 \- Custo de API (Baixo Impacto Inicial)**

* APIs de OCR cobram por página. Em contratos longos (Imobiliário \= 30+ páginas), o custo pode subir.  
* **Mitigação:** Configurar a IA para ler apenas as primeiras 5 páginas (onde geralmente está o Quadro Resumo) e a última (assinaturas).

## **9\. Casos de Uso Detalhados**

### **Caso de Uso 1: Extração de Quadro Resumo (Veículo)**

**Ator:** Sistema (IA) **Pré-condições:** PDF recebido no backend. **Fluxo Principal:**

1. Sistema converte PDF em texto.  
2. Busca pelo padrão visual de tabela ou lista "Quadro Resumo".  
3. Localiza chaves: "Valor Total do Crédito", "Taxa Mensal", "Vencimento".  
4. Extrai valores associados.  
5. Normaliza datas (DD/MM/AAAA para YYYY-MM-DD).  
6. Retorna JSON para o frontend Vue.js.

## **10\. Histórico de Versões**

**Versão 1.0**

* Data: 15/09/2025  
* Autor: [leonora@dizevolv.com](mailto:leonora@dizevolv.com)[danilo@dizevolv.com](mailto:danilo@dizevolv.com)  
* Mudanças: Criação inicial baseada no PRD 000 e transcrições.

**Versão 1.1**

* Data: 05/12/2025  
* Autor: [Manuela](mailto:manuela.dizevolv@gmail.com)  
* Mudanças: Atualização baseada nas novas transcrições de zipcalls.

# PRD 005: Detalhamento dos Módulos

# **PRD 005: Detalhamento Técnico dos Módulos e Arquitetura**

**Metadados do Documento:**

* ID do Documento: PRD 005  
* Título: Detalhamento Técnico dos Módulos  
* Status: Aprovado para Desenvolvimento  
* Stack: Vue.js (Front) | Supabase (Back)  
* Versão: 1.1   
* PRD Pai: PRD 000

## **1\. Módulo CRM (Gestão de Relacionamento)**

**Objetivo:** Centralizar a gestão do ciclo de vida do cliente e garantir a integridade dos dados para os cálculos. Substitui o controle via planilhas soltas.

### **1.1. Sub-módulo: Pipeline (Kanban)**

* **Interface:** Quadro visual com colunas dinâmicas.  
* **Funcionalidades:**  
  * **Drag-and-Drop:** Movimentação de cards entre etapas (Lead \-\> Qualificação \-\> Cálculo \-\> Negociação \-\> Fechamento).  
  * **Gestão de Etapas:** O Admin pode criar/editar/excluir colunas. *Regra:* Bloqueio de exclusão se houver cards na etapa.  
  * **Filtros:** Por responsável, tipo de contrato, data e status (Ganho/Perdido/Arquivado).

### **1.2. Sub-módulo: Entidade "Oportunidade" (Card)**

* **Estrutura de Dados (Campos Estáticos):**  
  1. *Nota:* Não há criação de campos personalizados no banco via front-end.  
  2. **Identificação:** Nome, CPF/CNPJ, E-mail, Telefone, Endereço.  
  3. **Processual:** Tipo de Ação (Enum: Veículo, Imóvel, Cartão, Pessoal), Valor da Causa, Número do Processo, Vara/Comarca.  
  4. **Origem:** Canal de aquisição (Indicação, Ads, etc.).  
* **Tabs Internas do Card:**  
  1. **Visão Geral:** Dados cadastrais.  
  2. **Timeline:** Histórico imutável de ações e mudanças de status.  
  3. **Cálculos:** Lista de simulações vinculadas a este cliente.  
  4. **Documentos:** Área de upload (PDF/Img) para Contratos, Procurações e Docs Pessoais.  
  5. **Agenda:** Tarefas e Reuniões vinculadas.

## **2\. Módulo de Cálculo Revisional (Core)**

**Objetivo:** Motor matemático de alta precisão (High-Code) para identificar abusividades e recalcular dívidas.

### **2.1. Motor Geral (Veículos e Empréstimos)**

* **Cenários Suportados:** Tabela Price e CDC (Crédito Direto ao Consumidor).  
* **Inputs (Entradas):**  
  * Valor Financiado, Taxa de Juros (a.m./a.a.), Data Contrato, Prazo (Meses), Data 1º Vencimento.  
  * **Seletor de Capitalização:** Mensal vs. Diária.  
    * *Lógica Crítica:* Se "Diária", aplicar fórmula exponencial baseada em dias corridos (Série Não Periódica) conforme documento `FÓRMULAS.docx`.  
  * **Tarifas (Expurgo):** Campos monetários específicos para TAC, Seguros, Registro, Avaliação. Checkbox "Expurgar?" para cada um.  
* **Integração:** Consulta automática à API do Banco Central (SGS) para obter a Taxa Média de Mercado na data base.

### **2.2. Motor Imobiliário (SFH/SFI)**

* **Complexidade:** Alta (Envolve Correção Monetária e Seguros Habitacionais).  
* **Inputs Específicos:**  
  1. **Sistema de Amortização:** Select \[SAC, Price, SACRE\].  
  2. **Indexador (Obrigatório):** Select \[TR, IPCA, INPC, IGPM\]. O sistema deve buscar a série histórica do índice.  
  3. **Seguros:** Campos para MIP (Morte e Invalidez) e DFI (Danos Físicos) \- aceitar valor fixo ou percentual.  
* **Lógica de Cálculo:**  
  1. Atualização do Saldo Devedor pelo Indexador do mês.  
  2. Cálculo de Juros e Amortização sobre o saldo atualizado.  
  3. Soma dos Seguros na parcela final.

### **2.3. Motor de Cartão de Crédito (Reconstrução)**

* **Interface:** Grid Editável (Data Grid) para input massivo de faturas.  
* **Estrutura da Linha (Mensal):**  
  * `Data Vencimento`, `Total da Fatura`, `Pagamento Realizado`, `Novas Compras`, `Encargos Cobrados (Banco)`.  
* **Algoritmo de Recomposição:**  
  * Identificar se houve pagamento parcial (`Pagamento < Total`).  
  * Calcular o residual.  
  * Aplicar a **Taxa Média de Mercado** (não a do banco) sobre o residual para o mês seguinte.  
  * Acumular o "Indébito" (Juros Cobrados \- Juros Calculados).

### **2.4. Ferramentas de Auditoria (Perito)**

* **Edição Avançada (Overrides):** Permite alterar manualmente uma parcela específica na grid de resultados.  
  * *Ex:* Parcela 15 paga com valor diferente. O sistema deve recalcular todo o saldo subsequente a partir dessa alteração.  
* **Travamento:** Botão "Validar Cálculo" que congela a edição para usuários não-peritos.

## **3\. Módulo de Automação e IA (OCR)**

**Objetivo:** Reduzir o tempo de *data entry* lendo os contratos PDF.

* **Fluxo:** Upload de PDF \-\> Processamento \-\> Preenchimento do Form.  
* **Tecnologia:** Google Document AI ou Azure Form Recognizer.  
* **Extração de Entidades:**  
  * Valores Monetários (`R$`).  
  * Taxas Percentuais (`% a.m.`, `% a.a.`).  
  * Datas (`Data Emissão`, `Vencimento`).  
* **Regra de Negócio:** A IA apenas **sugere**. O formulário vem preenchido, mas o usuário humano deve confirmar/editar antes de clicar em "Calcular".

## **4\. Módulo Gerador de Petições**

**Objetivo:** Transformar os dados estruturados em peças jurídicas finais (.docx).

* **Gestão de Templates:** Admin faz upload de arquivos Word com variáveis (ex: `{{cliente.nome}}`, `{{calculo.economia_total}}`).  
* **Motor de Geração:**  
  * Seleciona Cliente \+ Cálculo Validado \+ Modelo de Petição.  
  * O sistema realiza o "Merge" (substituição).  
  * Gera tabelas financeiras (HTML \-\> Tabela Word) dentro do documento.  
* **Output:** Download do arquivo editável.

## **5\. Módulo Administrativo e Segurança**

* **Gestão de Usuários:** Convites via e-mail (Resend), inativação de contas.  
* **Perfis:**  
  * **Admin:** Acesso total.  
  * **Advogado:** Operacional (CRM/Cálculos).  
  * **Perito:** Foco em Cálculos e Validação.  
* **Segurança (RLS):** Row Level Security no Supabase para garantir que usuários só vejam dados do seu escritório (Multi-tenant ready).

## **6\. Arquitetura de Dados (Schema Simplificado)**

**users**

* **Descrição:** Armazena os dados de login e perfil do usuário.  
* **Relacionamento Chave:** PK `id` (UUID).

**pipelines**

* **Descrição:** Tabela para definição e configuração dos funis de venda.  
* **Relacionamento Chave:** 1:N com `pipeline_stages`.

**pipeline\_stages**

* **Descrição:** Armazena as etapas (colunas) visuais do Kanban.  
* **Relacionamento Chave:** 1:N com `opportunities`.

**opportunities**

* **Descrição:** O "Dossiê" central do cliente (Lead/Processo).  
* **Relacionamento Chave:** FK `client_id`, FK `stage_id`.

**calculations**

* **Descrição:** Cabeçalho do cálculo contendo inputs globais e status.  
* **Relacionamento Chave:** FK `opportunity_id`.

**calc\_installments**

* **Descrição:** Armazena o cache da evolução da dívida (mês a mês), incluindo resultados da Tabela Price/SAC.  
* **Relacionamento Chave:** FK `calculation_id`.

**credit\_card\_invoices**

* **Descrição:** Tabela específica para armazenar os inputs do módulo de cartão de crédito.  
* **Relacionamento Chave:** FK `calculation_id`.

**petitions**

* **Descrição:** Registro do histórico de documentos gerados no sistema.  
* **Relacionamento Chave:** FK `opportunity_id`.

## **7\. Integrações Externas**

1. **API Banco Central (SGS):** Para séries temporais (Taxas Médias, Índices).  
2. **Resend:** E-mails transacionais.  
3. **Google Document AI:** OCR.  
4. **NVOIP (Futuro):** Link "Click-to-call" no CRM.

# EAP

# **Estrutura Analítica do Projeto (EAP) \- OctoApps**

---

### **1.0 Projeto OctoApps (SaaS Jurídico-Financeiro)**

**1.1 Fase de Planejamento e Arquitetura**

* **1.1.1 Definição e Escopo**  
  * 1.1.1.1 Consolidação dos PRDs (000 a 006\)  
  * 1.1.1.2 Validação final do escopo com Stakeholders (Paulo/Diego)  
  * 1.1.1.3 Definição da lista final de campos estáticos do CRM  
* **1.1.2 Arquitetura Técnica (High-Code)**  
  * 1.1.2.1 Definição do Schema do Banco de Dados (PostgreSQL/Supabase)  
  * 1.1.2.2 Arquitetura da API e Edge Functions  
  * 1.1.2.3 Definição da estrutura de segurança (RLS \- Row Level Security)  
* **1.1.3 Design e UX/UI**  
  * 1.1.3.1 Adaptação do Design System para Vue.js (Componentes Base)  
  * 1.1.3.2 Prototipagem de alta fidelidade das telas de Cálculo (Grid de Cartão)  
  * 1.1.3.3 Validação de fluxos de navegação (Light/Dark Mode)

**1.2 Fase de Infraestrutura e DevOps**

* **1.2.1 Ambiente de Desenvolvimento**  
  * 1.2.1.1 Configuração do Repositório (GitHub)  
  * 1.2.1.2 Configuração do Projeto no Supabase (Auth, DB, Storage)  
  * 1.2.1.3 Configuração do Ambiente Local (Docker/Vue CLI)  
* **1.2.2 Ambiente de Produção**  
  * 1.2.2.1 Configuração de DNS e Domínio (Dependência: Compra do Domínio)  
  * 1.2.2.2 Configuração de Hospedagem (Vercel ou VPS/Portainer)  
  * 1.2.2.3 Configuração de E-mails Transacionais (Resend)

**1.3 Fase de Desenvolvimento \- Módulo CRM**

* **1.3.1 Gestão de Pipeline (Kanban)**  
  * 1.3.1.1 Backend: CRUD de Pipelines e Stages  
  * 1.3.1.2 Frontend: Componente visual Kanban com Drag-and-Drop  
  * 1.3.1.3 Lógica: Reordenação de cards e persistência de estado  
  * 1.3.1.4 Frontend: Filtros de busca (Responsável, Data, Status)  
* **1.3.2 Gestão de Oportunidades (Card)**  
  * 1.3.2.1 Backend: CRUD de Oportunidades e Clientes  
  * 1.3.2.2 Frontend: Formulário de cadastro (Campos Estáticos)  
  * 1.3.2.3 Frontend: Tela de detalhes do cliente (Abas: Geral, Timeline, Arquivos)  
  * 1.3.2.4 Funcionalidade: Upload de documentos (Integração Storage)  
  * 1.3.2.5 Funcionalidade: Registro de interações (Tarefas/Agendas)

**1.4 Fase de Desenvolvimento \- Módulo de Cálculos (Core)**

* **1.4.1 Motor de Cálculo Base (Backend)**  
  * 1.4.1.1 Implementação de fórmulas financeiras (Juros Compostos, Simples, Proporcionais)  
  * 1.4.1.2 Integração com API Bacen (SGS) para séries temporais  
  * 1.4.1.3 Estrutura de persistência de cálculos (Cabeçalho \+ Parcelas)  
* **1.4.2 Sub-módulo: Veículos e Empréstimos**  
  * 1.4.2.1 Backend: Lógica de Tabela Price e Capitalização Diária (Exponencial)  
  * 1.4.2.2 Backend: Lógica de expurgo de tarifas (TAC, Seguros)  
  * 1.4.2.3 Frontend: Formulário de Input específico  
  * 1.4.2.4 Frontend: Visualização de resultados (Cenário Banco vs. Recalculado)  
* **1.4.3 Sub-módulo: Imobiliário (SFH/SFI)**  
  * 1.4.3.1 Backend: Lógica de SAC, Price e SACRE com Correção Monetária  
  * 1.4.3.2 Backend: Integração de Indexadores (TR, IPCA, INPC) no fluxo mensal  
  * 1.4.3.3 Backend: Cálculo de Seguros (MIP/DFI) e recálculo de saldo devedor  
  * 1.4.3.4 Frontend: Formulário com seleção de indexadores e seguros  
* **1.4.4 Sub-módulo: Cartão de Crédito (Complexo)**  
  * 1.4.4.1 Backend: Algoritmo de recomposição de dívida (Lógica de Rotativo)  
  * 1.4.4.2 Backend: Tratamento de pagamentos parciais e projeção de saldo  
  * 1.4.4.3 Frontend: Grid Editável (Data Grid) para input de múltiplas faturas  
  * 1.4.4.4 Frontend: Relatório de Indébito (Diferença acumulada)  
* **1.4.5 Funcionalidades do Perito**  
  * 1.4.5.1 Backend: Endpoint para overrides (edição manual de parcelas)  
  * 1.4.5.2 Frontend: Interface de edição avançada da grid de resultados  
  * 1.4.5.3 Funcionalidade: Trava de validação do cálculo

**1.5 Fase de Desenvolvimento \- Automação e IA**

* **1.5.1 Pipeline de OCR**  
  * 1.5.1.1 Integração com Google Document AI (ou Azure)  
  * 1.5.1.2 Desenvolvimento de Parsers (Regex/LLM) para contratos bancários  
  * 1.5.1.3 Backend: Endpoint de processamento de PDF  
* **1.5.2 Interface de Sugestão**  
  * 1.5.2.1 Frontend: Componente de Upload com feedback de progresso  
  * 1.5.2.2 Frontend: Preenchimento automático do formulário (Autofill)

**1.6 Fase de Desenvolvimento \- Gerador de Petições**

* **1.6.1 Gestão de Templates**  
  * 1.6.1.1 Backend: Upload e armazenamento de modelos .docx  
  * 1.6.1.2 Backend: Mapeamento de variáveis disponíveis (`{{variavel}}`)  
* **1.6.2 Motor de Geração**  
  * 1.6.2.1 Backend: Serviço de Merge (Substituição de variáveis)  
  * 1.6.2.2 Backend: Conversão de tabelas de cálculo (JSON) para Tabela Word  
  * 1.6.2.3 Frontend: Wizard de geração (Selecionar Cliente \+ Cálculo \+ Modelo)

**1.7 Fase de Desenvolvimento \- Admin e Segurança**

* **1.7.1 Gestão de Usuários**  
  * 1.7.1.1 Backend: Triggers de criação de usuário e envio de convite  
  * 1.7.1.2 Frontend: Tela de listagem e gerenciamento de membros  
* **1.7.2 Permissões e Configurações**  
  * 1.7.2.1 Implementação de Políticas RLS no Banco de Dados  
  * 1.7.2.2 Tela de configuração de Funil de Vendas

**1.8 Fase de Validação e QA (Crítica)**

* **1.8.1 Testes de Precisão Matemática**  
  * 1.8.1.1 Comparação automatizada: Sistema vs. Planilhas Excel (Veículo)  
  * 1.8.1.2 Comparação automatizada: Sistema vs. Planilhas Excel (Imobiliário)  
  * 1.8.1.3 Comparação automatizada: Sistema vs. Planilhas Excel (Cartão)  
  * 1.8.1.4 Validação e Homologação pelo Perito Técnico (Diego Nascimento)  
* **1.8.2 Testes de Sistema**  
  * 1.8.2.1 Testes de Integração (OCR \-\> Cálculo \-\> Petição)  
  * 1.8.2.2 Testes de Usabilidade e Responsividade  
  * 1.8.2.3 Correção de Bugs (Bug Bash)

**1.9 Fase de Implantação e Treinamento**

* **1.9.1 Deploy em Produção**  
  * 1.9.1.1 Configuração final do ambiente de produção  
  * 1.9.1.2 Limpeza de dados de teste  
* **1.9.2 Onboarding**  
  * 1.9.2.1 Treinamento dos Advogados (Operação)  
  * 1.9.2.2 Treinamento do Admin (Gestão)  
  * 1.9.2.3 Entrega da documentação técnica

---

### **INFORMAÇÕES DO PROJETO:**

**Módulos principais:** CRM, Cálculo Revisional (Veículo, Imóvel, Cartão, Empréstimo), Automação IA/OCR, Gerador de Petições, Admin.

**Stack tecnológico:**

* Frontend: Vue.js  
* Backend: Supabase (PostgreSQL, Edge Functions)  
* Infra: VPS/Vercel  
* Integrações: Bacen API, Resend, Google Doc AI

**Equipe:**

* Design: 1 (Ian \- Fase concluída)  
* Frontend: 1 (Diego Alves)  
* Backend/Fullstack: 1 (Cássio)  
* Automação: 1 (Enzo)  
* Produto/QA: 1 (Danilo)

**Integrações necessárias:**

* API Banco Central (SGS)  
* Google Document AI (OCR)  
* Resend (E-mail)  
* NVOIP (Link click-to-call)

**Dependências Críticas:**

* **Item 1.4.1:** O Motor de Cálculo é pré-requisito para o Gerador de Petições (1.6).  
* **Item 1.4.4:** O Módulo de Cartão de Crédito é o de maior complexidade e risco.  
* **Item 1.1.1.3:** A definição dos campos estáticos do CRM é pré-requisito para o início do desenvolvimento do módulo 1.3.

# EAP Design

# **Estrutura Analítica do Projeto (EAP) \- Design OctoApps**

---

### **1.1 Design System & Fundações (Global)**

**1.1.1 Identidade e Style Guide**

* **1.1.1.1 Definição de Tipografia**  
  * Família Primária (ex: Inter ou Poppins) para UI.  
  * Família Secundária (Monospace) para dados numéricos/tabelas.  
  * Escala tipográfica (H1 a H6, Body, Caption, Label).  
* **1.1.1.2 Paleta de Cores e Temas**  
  * **Cores Semânticas:** Sucesso (Viável), Erro (Inviável/Prejuízo), Alerta, Info.  
  * **Cores de Marca:** Azul OctoApps (Primary), Tons de Cinza (Neutrals).  
  * **Definição de Tokens:** Mapeamento de cores para *Light Mode* e *Dark Mode*.  
* **1.1.1.3 Iconografia e Gráficos**  
  * Set de ícones (Lucide/Phosphor) para ações (Edit, Delete, Calc, Upload).  
  * Ilustrações para *Empty States* (estados vazios).

**1.1.2 Biblioteca de Componentes (Atomic Design)**

* **1.1.2.1 Componentes de Formulário (Críticos)**  
  * Inputs Monetários (R$ com máscara).  
  * Inputs de Porcentagem (com precisão de casas decimais).  
  * Date Pickers (Seleção de datas passadas).  
  * Selects e Dropdowns (Indexadores, Bancos).  
  * Upload Areas (Drag-and-drop para PDF).  
* **1.1.2.2 Componentes de Visualização de Dados**  
  * Data Grids (Tabelas complexas com scroll, fixação de colunas).  
  * Cards de Kanban (CRM).  
  * Badges e Tags (Status do Processo).  
* **1.1.2.3 Estrutura de Navegação**  
  * Sidebar Retrátil (Menu Principal).  
  * Top Bar (Perfil, Notificações, Toggle de Tema).  
  * Breadcrumbs (Navegação estrutural).

---

### **1.2 Jornada: Colaborador (Advogado/Assistente)**

*Foco: Agilidade no cadastro e facilidade na visualização comercial.*

**1.2.1 Tela: Gestão de Oportunidades (CRM)**

* **Tipo:** Kanban Board.  
* **Componentes Necessários:**  
  * Colunas de Estágio (Lead, Cálculo, Negociação).  
  * Cards de Cliente (Resumo: Nome, Valor, Tipo).  
  * Filtros Rápidos (Meus Leads, Atrasados).  
  * Botão Flutuante (FAB) ou Header Button "Novo Lead".  
* **Estados:**  
  * *Empty:* "Nenhuma oportunidade. Cadastre a primeira."  
  * *Loading:* Skeletons dos cards.  
  * *Drag:* Estado visual do card sendo arrastado.  
* **Responsividade:**  
  * Desktop: Kanban horizontal.  
  * Mobile: Abas por coluna ou lista vertical.

**1.2.2 Tela: Detalhes do Cliente (O Dossiê)**

* **Tipo:** Dashboard de Registro.  
* **Componentes Necessários:**  
  * Header do Cliente (Dados fixos de contato).  
  * Tabs de Navegação: Visão Geral | Timeline | Cálculos | Documentos.  
  * Timeline Component: Lista vertical de eventos históricos.  
  * Lista de Arquivos: Ícone de PDF \+ Nome \+ Data.  
* **Interações:**  
  * Clique para editar dados cadastrais.  
  * Clique para baixar documento.

**1.2.3 Tela: Novo Cálculo Revisional (Wizard)**

* **Tipo:** Formulário Complexo.  
* **Componentes Necessários:**  
  * **Seletor de Tipo:** Cards grandes (Veículo, Imóvel, Cartão).  
  * **Área de OCR:** Upload com barra de progresso de leitura.  
  * **Formulário Dinâmico:** Inputs que aparecem/somem conforme o tipo (ex: Se Imóvel \-\> Mostra Indexador).  
  * **Validação:** Feedback visual imediato em campos obrigatórios.  
* **Estados:**  
  * *Processando:* Animação de "IA Lendo Contrato".  
  * *Sucesso:* Campos preenchidos automaticamente (highlight amarelo para conferência).

**1.2.4 Tela: Resultado da Análise (Viabilidade)**

* **Tipo:** Dashboard de Apresentação.  
* **Componentes Necessários:**  
  * **Scorecard:** Comparativo "Taxa Banco" vs "Taxa Justa".  
  * **Gráfico de Linha:** Curva de Saldo Devedor (Banco vs Recalculado).  
  * **Call-to-Action:** Botões "Gerar PDF", "Salvar", "Gerar Petição".  
* **Interações:**  
  * Tooltip nos gráficos para ver valores exatos.

---

### **1.3 Jornada: Perito Técnico**

*Foco: Densidade de informação e ferramentas de edição precisa.*

**1.3.1 Tela: Central de Perícia**

* **Tipo:** Listagem (Data Table).  
* **Componentes Necessários:**  
  * Tabela com alta densidade (Muitas linhas).  
  * Colunas: Cliente, Tipo, Status, Responsável, Data.  
  * Filtros Avançados (Drawer lateral).  
  * Status Badges: "Rascunho", "Aguardando Validação", "Validado".

**1.3.2 Tela: Editor Avançado de Cálculo (Grid)**

* **Tipo:** Editor Tabular (Spreadsheet-like).  
* **Componentes Necessários:**  
  * **Grid de Parcelas:** Tabela com edição *inline* (clicar na célula e digitar).  
  * **Painel Lateral de Parâmetros:** Inputs para alterar Taxa Global, Sistema de Amortização.  
  * **Destaque de Delta:** Visualização da diferença entre valor original e novo.  
* **Interações:**  
  * Navegação por teclado (Tab/Enter).  
  * Feedback de Recálculo (Spinner sutil ao alterar valor).

**1.3.3 Tela: Reconstrutor de Cartão de Crédito**

* **Tipo:** Input Massivo.  
* **Componentes Necessários:**  
  * **Grid Mensal:** Linhas \= Meses. Colunas \= Componentes da Fatura (Saldo, Pagamento, Compras).  
  * **Sticky Header:** Cabeçalho da tabela fixo ao rolar.  
  * **Resumo Flutuante:** Footer fixo mostrando "Total de Indébito Apurado".

---

### **1.4 Jornada: Administrador**

*Foco: Controle e Configuração.*

**1.4.1 Tela: Dashboard Administrativo**

* **Tipo:** Visão Macro.  
* **Componentes Necessários:**  
  * KPI Cards (Faturamento Potencial, Total Leads).  
  * Gráfico de Funil (Conversão por etapa).  
  * Lista de Atividade Recente da Equipe.

**1.4.2 Tela: Configuração de Funil (CRM)**

* **Tipo:** Lista Ordenável.  
* **Componentes Necessários:**  
  * Lista de Etapas com "Grab handle" (alça para arrastar).  
  * Botão "Adicionar Etapa".  
  * Modal de Edição de Nome da Etapa.  
* **Interações:**  
  * Drag-and-drop fluido das etapas.

**1.4.3 Tela: Gestão de Usuários**

* **Tipo:** Listagem e Permissões.  
* **Componentes Necessários:**  
  * Tabela de Usuários (Avatar, Nome, Cargo, Status).  
  * Modal de Convite (E-mail \+ Seleção de Perfil).  
  * Toggles de Permissão (Ativar/Desativar acesso).

---

### **ENTREGÁVEIS DE DESIGN:**

1. **Guia de Estilos (Figma):** Cores, Fontes, Sombras, Grid.  
2. **Biblioteca de Componentes:** Botões, Inputs, Cards, Tabelas.  
3. **Telas de Alta Fidelidade:** Todas as telas listadas acima (Light Mode).  
4. **Variação Dark Mode:** Principais telas (Dashboard, Cálculo, CRM) em modo escuro.  
5. **Protótipo Navegável:** Fluxo principal (Login \-\> CRM \-\> Novo Cálculo \-\> Resultado).  
6. **Handoff para Dev:** Especificações de espaçamento, cores (hex/rgb) e comportamentos.

### **ORDEM DE PRIORIDADE (SPRINTS DE DESIGN):**

* **Sprint 1:** Style Guide \+ Componentes Base \+ Telas do CRM (Colaborador).  
* **Sprint 2:** Telas de Cálculo (Input Wizard e Resultado) \+ Telas do Perito (Grids complexas).  
* **Sprint 3:** Admin (Configurações/Usuários) \+ Gerador de Petições \+ Ajustes de Dark Mode.

