-- =====================================================
-- SCHEMA DE BANCO DE DADOS - GESTÃO JURÍDICA
-- Sistema de Gestão Integrado (CRM + Tarefas + Cálculos + Petições)
-- Versão: 2.0
-- Data: Janeiro 2025
-- =====================================================

-- =====================================================
-- 1. TABELA DE PERFIS DE USUÁRIOS
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(15),
  cargo TEXT,
  persona TEXT CHECK (persona IN ('Ana Admin', 'Diego Perito', 'Maria Advogada', 'Outro')),
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema - vinculados ao auth.users do Supabase';
COMMENT ON COLUMN profiles.persona IS 'Persona do usuário para personalização de interface';

-- =====================================================
-- 2. TABELA DE PERMISSÕES E ROLES
-- =====================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  permissoes JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

COMMENT ON TABLE roles IS 'Perfis de permissão do sistema (Administrador, Advogado, Perito, Assistente)';
COMMENT ON COLUMN roles.permissoes IS 'JSONB com permissões granulares: {"modulo": ["ler", "criar", "editar", "deletar"]}';

-- =====================================================
-- 3. TABELA DE CONTATOS (Clientes e Leads)
-- =====================================================
CREATE TABLE contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('Pessoa Física', 'Pessoa Jurídica')) NOT NULL,
  nome_completo TEXT NOT NULL,
  nome_social TEXT,
  cpf_cnpj VARCHAR(18),
  rg VARCHAR(20),
  data_nascimento DATE,
  email TEXT,
  telefone_principal VARCHAR(15),
  telefone_secundario VARCHAR(15),

  -- Endereço
  cep VARCHAR(9),
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado VARCHAR(2),

  -- CRM e Marketing
  origem_lead TEXT,
  status_contato TEXT CHECK (status_contato IN ('Ativo', 'Inativo', 'Lead', 'Cliente', 'Ex-Cliente')) DEFAULT 'Lead',
  tags TEXT[],
  observacoes TEXT,

  -- Relacionamentos
  responsavel_id UUID REFERENCES profiles(id),

  -- Metadata
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

COMMENT ON TABLE contatos IS 'Cadastro de clientes, leads e prospects';
COMMENT ON COLUMN contatos.status_contato IS 'Status do contato no funil de relacionamento';

-- =====================================================
-- 4. TABELA DE OPORTUNIDADES (CRM - Pipeline Kanban)
-- =====================================================
CREATE TABLE oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,

  -- Tipo de ação jurídica
  tipo_acao TEXT CHECK (tipo_acao IN ('Revisional', 'Cartão de Crédito', 'Empréstimo', 'Financiamento Imobiliário', 'Consultoria', 'Outros')),

  -- Estágios do funil (IDs em inglês para o frontend)
  estagio TEXT CHECK (estagio IN ('lead', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost')) NOT NULL DEFAULT 'lead',

  -- Valores e probabilidade
  valor_estimado DECIMAL(15, 2),
  probabilidade INTEGER CHECK (probabilidade >= 0 AND probabilidade <= 100) DEFAULT 50,

  -- Origem e responsável
  origem TEXT,
  responsavel_id UUID REFERENCES profiles(id),

  -- Datas
  data_fechamento_prevista DATE,
  data_fechamento_real DATE,

  -- Motivo de perda
  motivo_perda TEXT,

  -- Ordem no Kanban
  ordem INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT[],
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

COMMENT ON TABLE oportunidades IS 'Pipeline de oportunidades de negócio (CRM Kanban)';
COMMENT ON COLUMN oportunidades.estagio IS 'Estágios: lead, qualification, proposal, negotiation, closed-won, closed-lost';

-- =====================================================
-- 5. TABELA DE PROJETOS/CASOS JURÍDICOS
-- =====================================================
CREATE TABLE projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(50) UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,

  -- Relacionamentos
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE SET NULL,

  -- Tipo e status
  tipo_projeto TEXT CHECK (tipo_projeto IN ('Revisional', 'Cartão de Crédito', 'Empréstimo', 'Financiamento Imobiliário', 'Consultoria', 'Outros')),
  status TEXT CHECK (status IN ('Não Iniciado', 'Em Andamento', 'Em Análise', 'Aguardando Cliente', 'Pausado', 'Concluído', 'Cancelado')) NOT NULL DEFAULT 'Não Iniciado',
  prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',

  -- Valores e datas
  valor_causa DECIMAL(15, 2),
  data_inicio DATE,
  data_prazo DATE,
  data_conclusao DATE,

  -- Equipe
  responsavel_id UUID REFERENCES profiles(id),
  equipe_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Metadata
  tags TEXT[],
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

COMMENT ON TABLE projetos IS 'Casos jurídicos e projetos em andamento';
COMMENT ON COLUMN projetos.equipe_ids IS 'Array de UUIDs dos membros da equipe do projeto';

-- =====================================================
-- 6. TABELA DE TAREFAS
-- =====================================================
CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('Tarefa', 'Follow-up', 'Reunião', 'Ligação', 'E-mail', 'Documento', 'Prazo Judicial', 'Audiência', 'Outros')) NOT NULL DEFAULT 'Tarefa',
  status TEXT CHECK (status IN ('Pendente', 'Em Andamento', 'Aguardando', 'Concluída', 'Cancelada')) NOT NULL DEFAULT 'Pendente',
  prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',

  -- Relacionamentos
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE SET NULL,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  tarefa_pai_id UUID REFERENCES tarefas(id) ON DELETE SET NULL,

  -- Responsáveis e participantes
  responsavel_id UUID REFERENCES profiles(id) NOT NULL,
  participantes_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Datas e tempo
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_vencimento TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  duracao_estimada INTEGER, -- em minutos
  tempo_gasto INTEGER, -- em minutos

  -- Notificações e lembretes
  lembrete_antecedencia INTEGER, -- em minutos antes do vencimento
  lembrete_enviado BOOLEAN DEFAULT false,

  -- Recorrência
  recorrente BOOLEAN DEFAULT false,
  recorrencia_tipo TEXT CHECK (recorrencia_tipo IN ('Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Anual')),
  recorrencia_fim DATE,

  -- Checklist e progresso
  checklist JSONB DEFAULT '[]', -- [{ "item": "texto", "concluido": false }]
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),

  -- Metadata
  tags TEXT[],
  anexos JSONB DEFAULT '[]', -- [{ "nome": "", "url": "", "tipo": "" }]
  observacoes TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

COMMENT ON TABLE tarefas IS 'Sistema principal de gestão de tarefas com suporte a checklist, recorrência e lembretes';
COMMENT ON COLUMN tarefas.checklist IS 'JSONB array de itens do checklist: [{"item": "texto", "concluido": boolean}]';

-- =====================================================
-- 7. TABELA DE COMENTÁRIOS/HISTÓRICO
-- =====================================================
CREATE TABLE comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('comentario', 'historico', 'sistema')) NOT NULL DEFAULT 'comentario',
  conteudo TEXT NOT NULL,

  -- Relacionamentos (pelo menos um deve estar preenchido)
  tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE CASCADE,

  -- Metadata
  autor_id UUID REFERENCES profiles(id),
  mencoes_ids UUID[] DEFAULT ARRAY[]::UUID[],
  anexos JSONB DEFAULT '[]',
  editado BOOLEAN DEFAULT false,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT comentario_relacionamento_check CHECK (
    tarefa_id IS NOT NULL OR
    oportunidade_id IS NOT NULL OR
    projeto_id IS NOT NULL OR
    contato_id IS NOT NULL
  )
);

COMMENT ON TABLE comentarios IS 'Comentários e histórico de atividades em tarefas, projetos, oportunidades e contatos';

-- =====================================================
-- 8. TABELA DE NOTIFICAÇÕES
-- =====================================================
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('tarefa', 'mencao', 'prazo', 'sistema', 'lembrete', 'oportunidade', 'projeto')) NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link_entidade TEXT, -- URL ou ID da entidade relacionada
  icone TEXT,
  prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')) DEFAULT 'media',
  lida BOOLEAN DEFAULT false,
  data_leitura TIMESTAMP WITH TIME ZONE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notificacoes IS 'Sistema de notificações em tempo real com suporte a Realtime';

-- =====================================================
-- 9. TABELA DE ETIQUETAS/TAGS
-- =====================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  cor VARCHAR(7), -- Código hexadecimal da cor (#RRGGBB)
  descricao TEXT,
  categoria TEXT,
  uso_count INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE tags IS 'Etiquetas reutilizáveis para organização de contatos, tarefas e projetos';

-- =====================================================
-- 10. TABELA DE TEMPLATES DE TAREFAS
-- =====================================================
CREATE TABLE templates_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT,
  prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',
  duracao_estimada INTEGER,
  checklist JSONB DEFAULT '[]',
  tags TEXT[],
  publico BOOLEAN DEFAULT false,
  criado_por UUID REFERENCES profiles(id),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE templates_tarefas IS 'Templates reutilizáveis para criar tarefas rapidamente';

-- =====================================================
-- 11. TABELA DE CÁLCULOS REVISIONAIS
-- =====================================================
CREATE TABLE calculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('Financiamento Imobiliário', 'Cartão de Crédito', 'Empréstimos', 'Análise Prévia')) NOT NULL,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  projeto_id UUID REFERENCES projetos(id) ON DELETE SET NULL,

  -- Dados do contrato
  dados_contrato JSONB NOT NULL,

  -- Resultados do cálculo
  resultado_calculo JSONB,
  economia_estimada DECIMAL(15, 2),

  -- Status
  status TEXT CHECK (status IN ('Em Análise', 'Concluído', 'Com Divergências', 'Arquivado')) DEFAULT 'Em Análise',

  -- Metadata
  calculado_por UUID REFERENCES profiles(id),
  revisado_por UUID REFERENCES profiles(id),
  observacoes TEXT,
  data_calculo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_revisao TIMESTAMP WITH TIME ZONE,
  criado_por UUID REFERENCES profiles(id)
);

COMMENT ON TABLE calculos IS 'Cálculos revisionais de financiamentos, empréstimos e cartões de crédito';
COMMENT ON COLUMN calculos.dados_contrato IS 'JSONB com todos os dados do contrato fornecidos pelo cliente';
COMMENT ON COLUMN calculos.resultado_calculo IS 'JSONB com resultado detalhado do cálculo';

-- =====================================================
-- 12. TABELA DE PETIÇÕES
-- =====================================================
CREATE TABLE peticoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo_peticao TEXT CHECK (tipo_peticao IN ('Petição Inicial', 'Contestação', 'Recurso', 'Agravo', 'Embargos', 'Outros')),
  conteudo TEXT,

  -- Relacionamentos
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  template_id UUID,

  -- Status
  status TEXT CHECK (status IN ('Rascunho', 'Em Revisão', 'Aprovado', 'Protocolado')) DEFAULT 'Rascunho',

  -- Metadata
  autor_id UUID REFERENCES profiles(id),
  revisor_id UUID REFERENCES profiles(id),
  data_protocolo TIMESTAMP WITH TIME ZONE,
  numero_protocolo TEXT,
  observacoes TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE peticoes IS 'Geração e gerenciamento de petições jurídicas';

-- =====================================================
-- 13. TABELA DE TEMPLATES DE PETIÇÕES
-- =====================================================
CREATE TABLE templates_peticoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo_peticao TEXT,
  conteudo_template TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]', -- [{"nome": "nome_cliente", "descricao": "Nome do cliente", "tipo": "texto"}]
  publico BOOLEAN DEFAULT false,
  criado_por UUID REFERENCES profiles(id),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE templates_peticoes IS 'Templates de petições com variáveis dinâmicas';
COMMENT ON COLUMN templates_peticoes.variaveis IS 'JSONB array com definição de variáveis: [{"nome": "var", "descricao": "desc", "tipo": "texto"}]';

-- =====================================================
-- 14. TABELA DE ANEXOS/ARQUIVOS
-- =====================================================
CREATE TABLE arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  tipo_mime TEXT NOT NULL,
  tamanho BIGINT NOT NULL, -- em bytes
  url TEXT NOT NULL,
  caminho_storage TEXT NOT NULL,
  bucket_name TEXT NOT NULL, -- Nome do bucket do Supabase Storage

  -- Relacionamentos
  tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comentarios(id) ON DELETE CASCADE,
  calculo_id UUID REFERENCES calculos(id) ON DELETE CASCADE,
  peticao_id UUID REFERENCES peticoes(id) ON DELETE CASCADE,

  -- Metadata
  enviado_por UUID REFERENCES profiles(id),
  data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT arquivo_relacionamento_check CHECK (
    tarefa_id IS NOT NULL OR
    projeto_id IS NOT NULL OR
    oportunidade_id IS NOT NULL OR
    contato_id IS NOT NULL OR
    comentario_id IS NOT NULL OR
    calculo_id IS NOT NULL OR
    peticao_id IS NOT NULL
  )
);

COMMENT ON TABLE arquivos IS 'Gestão centralizada de todos os arquivos do sistema';

-- =====================================================
-- 15. TABELA DE AUDIÊNCIAS E PRAZOS JUDICIAIS
-- =====================================================
CREATE TABLE audiencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('Audiência', 'Prazo Fatal', 'Vencimento', 'Sessão')) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT,
  participantes_ids UUID[] DEFAULT ARRAY[]::UUID[],
  observacoes TEXT,
  lembrete_enviado BOOLEAN DEFAULT false,
  lembrete_antecedencia INTEGER DEFAULT 1440, -- 24 horas em minutos
  status TEXT CHECK (status IN ('Agendado', 'Realizado', 'Cancelado', 'Adiado')) DEFAULT 'Agendado',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

COMMENT ON TABLE audiencias IS 'Gerenciamento de audiências e prazos judiciais críticos';

-- =====================================================
-- 16. TABELA DE TIME TRACKING
-- =====================================================
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES projetos(id) ON DELETE SET NULL,
  duracao_minutos INTEGER NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  faturavel BOOLEAN DEFAULT true,
  valor_hora DECIMAL(10, 2),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE time_entries IS 'Controle de horas trabalhadas para faturamento';

-- =====================================================
-- 17. TABELA DE HONORÁRIOS/FATURAMENTO
-- =====================================================
CREATE TABLE honorarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(15, 2) NOT NULL,
  tipo TEXT CHECK (tipo IN ('Fixo', 'Êxito', 'Hora', 'Mensal')) NOT NULL,
  status TEXT CHECK (status IN ('Pendente', 'Pago', 'Atrasado', 'Cancelado')) DEFAULT 'Pendente',
  data_vencimento DATE,
  data_pagamento DATE,
  observacoes TEXT,
  criado_por UUID REFERENCES profiles(id),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE honorarios IS 'Controle de honorários e faturamento de projetos';

-- =====================================================
-- 18. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- =====================================================
CREATE TABLE configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  categoria TEXT,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_por UUID REFERENCES profiles(id)
);

COMMENT ON TABLE configuracoes IS 'Configurações gerais do sistema (funil, emails, notificações, etc)';

-- =====================================================
-- 19. TABELA DE LOG DE ATIVIDADES
-- =====================================================
CREATE TABLE log_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL, -- nome da tabela
  entidade_id UUID NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE log_atividades IS 'Auditoria completa de todas as ações no sistema';

-- =====================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_cpf ON profiles(cpf);
CREATE INDEX idx_profiles_persona ON profiles(persona);
CREATE INDEX idx_profiles_ativo ON profiles(ativo);

-- Contatos
CREATE INDEX idx_contatos_tipo ON contatos(tipo);
CREATE INDEX idx_contatos_cpf_cnpj ON contatos(cpf_cnpj);
CREATE INDEX idx_contatos_responsavel ON contatos(responsavel_id);
CREATE INDEX idx_contatos_ativo ON contatos(ativo);
CREATE INDEX idx_contatos_status ON contatos(status_contato);
CREATE INDEX idx_contatos_tags ON contatos USING GIN(tags);
CREATE INDEX idx_contatos_busca ON contatos USING GIN(to_tsvector('portuguese', nome_completo || ' ' || COALESCE(email, '') || ' ' || COALESCE(telefone_principal, '')));

-- Oportunidades
CREATE INDEX idx_oportunidades_contato ON oportunidades(contato_id);
CREATE INDEX idx_oportunidades_estagio ON oportunidades(estagio);
CREATE INDEX idx_oportunidades_responsavel ON oportunidades(responsavel_id);
CREATE INDEX idx_oportunidades_tipo_acao ON oportunidades(tipo_acao);
CREATE INDEX idx_oportunidades_data_fechamento ON oportunidades(data_fechamento_prevista);
CREATE INDEX idx_oportunidades_ativo ON oportunidades(ativo);

-- Projetos
CREATE INDEX idx_projetos_contato ON projetos(contato_id);
CREATE INDEX idx_projetos_oportunidade ON projetos(oportunidade_id);
CREATE INDEX idx_projetos_status ON projetos(status);
CREATE INDEX idx_projetos_prioridade ON projetos(prioridade);
CREATE INDEX idx_projetos_responsavel ON projetos(responsavel_id);
CREATE INDEX idx_projetos_numero_processo ON projetos(numero_processo);
CREATE INDEX idx_projetos_data_prazo ON projetos(data_prazo);
CREATE INDEX idx_projetos_ativo ON projetos(ativo);

-- Tarefas (Índices mais importantes)
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_prioridade ON tarefas(prioridade);
CREATE INDEX idx_tarefas_tipo ON tarefas(tipo);
CREATE INDEX idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX idx_tarefas_contato ON tarefas(contato_id);
CREATE INDEX idx_tarefas_oportunidade ON tarefas(oportunidade_id);
CREATE INDEX idx_tarefas_projeto ON tarefas(projeto_id);
CREATE INDEX idx_tarefas_data_vencimento ON tarefas(data_vencimento);
CREATE INDEX idx_tarefas_data_criacao ON tarefas(data_criacao DESC);
CREATE INDEX idx_tarefas_participantes ON tarefas USING GIN(participantes_ids);
CREATE INDEX idx_tarefas_tags ON tarefas USING GIN(tags);
CREATE INDEX idx_tarefas_ativo ON tarefas(ativo);
CREATE INDEX idx_tarefas_lembrete ON tarefas(data_vencimento, lembrete_enviado) WHERE lembrete_antecedencia IS NOT NULL AND lembrete_enviado = false;
CREATE INDEX idx_tarefas_atrasadas ON tarefas(data_vencimento, status) WHERE status NOT IN ('Concluída', 'Cancelada');

-- Comentários
CREATE INDEX idx_comentarios_tarefa ON comentarios(tarefa_id);
CREATE INDEX idx_comentarios_oportunidade ON comentarios(oportunidade_id);
CREATE INDEX idx_comentarios_projeto ON comentarios(projeto_id);
CREATE INDEX idx_comentarios_contato ON comentarios(contato_id);
CREATE INDEX idx_comentarios_autor ON comentarios(autor_id);
CREATE INDEX idx_comentarios_data ON comentarios(data_criacao DESC);

-- Notificações
CREATE INDEX idx_notificacoes_user ON notificacoes(user_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_data ON notificacoes(data_criacao DESC);
CREATE INDEX idx_notificacoes_user_nao_lidas ON notificacoes(user_id, lida) WHERE lida = false;

-- Arquivos
CREATE INDEX idx_arquivos_tarefa ON arquivos(tarefa_id);
CREATE INDEX idx_arquivos_projeto ON arquivos(projeto_id);
CREATE INDEX idx_arquivos_calculo ON arquivos(calculo_id);
CREATE INDEX idx_arquivos_peticao ON arquivos(peticao_id);
CREATE INDEX idx_arquivos_enviado_por ON arquivos(enviado_por);

-- Cálculos
CREATE INDEX idx_calculos_tipo ON calculos(tipo);
CREATE INDEX idx_calculos_status ON calculos(status);
CREATE INDEX idx_calculos_contato ON calculos(contato_id);
CREATE INDEX idx_calculos_projeto ON calculos(projeto_id);
CREATE INDEX idx_calculos_data ON calculos(data_calculo DESC);

-- Petições
CREATE INDEX idx_peticoes_projeto ON peticoes(projeto_id);
CREATE INDEX idx_peticoes_status ON peticoes(status);
CREATE INDEX idx_peticoes_tipo ON peticoes(tipo_peticao);
CREATE INDEX idx_peticoes_autor ON peticoes(autor_id);

-- Audiências
CREATE INDEX idx_audiencias_projeto ON audiencias(projeto_id);
CREATE INDEX idx_audiencias_data ON audiencias(data_hora);
CREATE INDEX idx_audiencias_status ON audiencias(status);
CREATE INDEX idx_audiencias_proximas ON audiencias(data_hora, status) WHERE status = 'Agendado';

-- Log de atividades
CREATE INDEX idx_log_atividades_user ON log_atividades(user_id);
CREATE INDEX idx_log_atividades_entidade ON log_atividades(entidade, entidade_id);
CREATE INDEX idx_log_atividades_data ON log_atividades(data_criacao DESC);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para data_atualizacao
CREATE TRIGGER trigger_atualizar_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trigger_atualizar_contatos
  BEFORE UPDATE ON contatos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trigger_atualizar_oportunidades
  BEFORE UPDATE ON oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trigger_atualizar_projetos
  BEFORE UPDATE ON projetos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trigger_atualizar_tarefas
  BEFORE UPDATE ON tarefas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trigger_atualizar_peticoes
  BEFORE UPDATE ON peticoes
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trigger_atualizar_templates_peticoes
  BEFORE UPDATE ON templates_peticoes
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_atualizacao();

-- Função para marcar tarefa como concluída automaticamente quando progresso = 100
CREATE OR REPLACE FUNCTION auto_concluir_tarefa()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.progresso = 100 AND OLD.status != 'Concluída' THEN
    NEW.status = 'Concluída';
    NEW.data_conclusao = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_concluir_tarefa
  BEFORE UPDATE ON tarefas
  FOR EACH ROW
  WHEN (NEW.progresso = 100 AND OLD.progresso < 100)
  EXECUTE FUNCTION auto_concluir_tarefa();

-- Função para criar notificação quando tarefa é atribuída
CREATE OR REPLACE FUNCTION notificar_atribuicao_tarefa()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.responsavel_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.responsavel_id != OLD.responsavel_id) THEN
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link_entidade, prioridade)
    VALUES (
      NEW.responsavel_id,
      'tarefa',
      'Nova tarefa atribuída',
      'Você foi atribuído à tarefa: ' || NEW.titulo,
      NEW.id::TEXT,
      CASE NEW.prioridade
        WHEN 'Urgente' THEN 'urgente'
        WHEN 'Alta' THEN 'alta'
        ELSE 'media'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_atribuicao_tarefa
  AFTER INSERT OR UPDATE OF responsavel_id ON tarefas
  FOR EACH ROW
  EXECUTE FUNCTION notificar_atribuicao_tarefa();

-- Função para criar notificação de prazo próximo (executar via cron job)
CREATE OR REPLACE FUNCTION notificar_prazos_proximos()
RETURNS void AS $$
BEGIN
  INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link_entidade, prioridade)
  SELECT DISTINCT
    t.responsavel_id,
    'prazo',
    'Prazo próximo',
    'A tarefa "' || t.titulo || '" vence em breve',
    t.id::TEXT,
    CASE t.prioridade
      WHEN 'Urgente' THEN 'urgente'
      WHEN 'Alta' THEN 'alta'
      ELSE 'media'
    END
  FROM tarefas t
  WHERE t.status NOT IN ('Concluída', 'Cancelada')
    AND t.data_vencimento IS NOT NULL
    AND t.data_vencimento BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notificacoes n
      WHERE n.user_id = t.responsavel_id
        AND n.tipo = 'prazo'
        AND n.link_entidade = t.id::TEXT
        AND n.data_criacao > NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- Função para notificar audiências próximas
CREATE OR REPLACE FUNCTION notificar_audiencias_proximas()
RETURNS void AS $$
BEGIN
  INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link_entidade, prioridade)
  SELECT DISTINCT
    unnest(a.participantes_ids),
    'prazo',
    'Audiência próxima',
    a.tipo || ' "' || a.titulo || '" agendada para ' || to_char(a.data_hora, 'DD/MM/YYYY HH24:MI'),
    a.id::TEXT,
    'alta'
  FROM audiencias a
  WHERE a.status = 'Agendado'
    AND a.data_hora BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notificacoes n
      WHERE n.link_entidade = a.id::TEXT
        AND n.tipo = 'prazo'
        AND n.data_criacao > NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- Função para registrar log de atividades
CREATE OR REPLACE FUNCTION registrar_log_atividade()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO log_atividades (user_id, acao, entidade, entidade_id, dados_novos)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO log_atividades (user_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO log_atividades (user_id, acao, entidade, entidade_id, dados_anteriores)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar log em tabelas críticas (opcional - pode gerar muitos registros)
-- CREATE TRIGGER trigger_log_tarefas AFTER INSERT OR UPDATE OR DELETE ON tarefas FOR EACH ROW EXECUTE FUNCTION registrar_log_atividade();
-- CREATE TRIGGER trigger_log_projetos AFTER INSERT OR UPDATE OR DELETE ON projetos FOR EACH ROW EXECUTE FUNCTION registrar_log_atividade();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE peticoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_peticoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE honorarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_atividades ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA PROFILES
-- =====================================================
CREATE POLICY "Usuários podem ver todos os perfis"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- POLÍTICAS PARA ROLES E USER_ROLES
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver roles"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem gerenciar roles"
  ON roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nome = 'Administrador'
    )
  );

CREATE POLICY "Usuários podem ver suas próprias roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Apenas admins podem gerenciar user_roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nome = 'Administrador'
    )
  );

-- =====================================================
-- POLÍTICAS PARA CONTATOS
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver contatos"
  ON contatos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar contatos"
  ON contatos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar contatos que criaram ou são responsáveis"
  ON contatos FOR UPDATE
  USING (auth.uid() = criado_por OR auth.uid() = responsavel_id);

CREATE POLICY "Usuários podem deletar contatos que criaram"
  ON contatos FOR DELETE
  USING (auth.uid() = criado_por);

-- =====================================================
-- POLÍTICAS PARA OPORTUNIDADES
-- =====================================================
CREATE POLICY "Usuários podem ver oportunidades que criaram ou são responsáveis"
  ON oportunidades FOR SELECT
  USING (auth.uid() = criado_por OR auth.uid() = responsavel_id);

CREATE POLICY "Usuários autenticados podem criar oportunidades"
  ON oportunidades FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar oportunidades que criaram ou são responsáveis"
  ON oportunidades FOR UPDATE
  USING (auth.uid() = criado_por OR auth.uid() = responsavel_id);

CREATE POLICY "Usuários podem deletar oportunidades que criaram"
  ON oportunidades FOR DELETE
  USING (auth.uid() = criado_por);

-- =====================================================
-- POLÍTICAS PARA PROJETOS
-- =====================================================
CREATE POLICY "Usuários podem ver projetos relacionados"
  ON projetos FOR SELECT
  USING (
    auth.uid() = criado_por OR
    auth.uid() = responsavel_id OR
    auth.uid() = ANY(equipe_ids)
  );

CREATE POLICY "Usuários autenticados podem criar projetos"
  ON projetos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar projetos que criaram ou são responsáveis"
  ON projetos FOR UPDATE
  USING (auth.uid() = criado_por OR auth.uid() = responsavel_id);

CREATE POLICY "Usuários podem deletar projetos que criaram"
  ON projetos FOR DELETE
  USING (auth.uid() = criado_por);

-- =====================================================
-- POLÍTICAS PARA TAREFAS
-- =====================================================
CREATE POLICY "Usuários podem ver tarefas relacionadas"
  ON tarefas FOR SELECT
  USING (
    auth.uid() = criado_por OR
    auth.uid() = responsavel_id OR
    auth.uid() = ANY(participantes_ids) OR
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = tarefas.projeto_id
        AND (p.responsavel_id = auth.uid() OR auth.uid() = ANY(p.equipe_ids))
    )
  );

CREATE POLICY "Usuários autenticados podem criar tarefas"
  ON tarefas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar suas tarefas"
  ON tarefas FOR UPDATE
  USING (
    auth.uid() = criado_por OR
    auth.uid() = responsavel_id OR
    auth.uid() = ANY(participantes_ids)
  );

CREATE POLICY "Usuários podem deletar tarefas que criaram"
  ON tarefas FOR DELETE
  USING (auth.uid() = criado_por);

-- =====================================================
-- POLÍTICAS PARA COMENTÁRIOS
-- =====================================================
CREATE POLICY "Usuários podem ver comentários de entidades relacionadas"
  ON comentarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tarefas t
      WHERE t.id = comentarios.tarefa_id
        AND (t.responsavel_id = auth.uid() OR auth.uid() = ANY(t.participantes_ids) OR t.criado_por = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM oportunidades o
      WHERE o.id = comentarios.oportunidade_id
        AND (o.responsavel_id = auth.uid() OR o.criado_por = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = comentarios.projeto_id
        AND (p.responsavel_id = auth.uid() OR auth.uid() = ANY(p.equipe_ids) OR p.criado_por = auth.uid())
    ) OR
    auth.role() = 'authenticated' -- Todos podem ver comentários de contatos
  );

CREATE POLICY "Usuários autenticados podem criar comentários"
  ON comentarios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar seus próprios comentários"
  ON comentarios FOR UPDATE
  USING (auth.uid() = autor_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários"
  ON comentarios FOR DELETE
  USING (auth.uid() = autor_id);

-- =====================================================
-- POLÍTICAS PARA NOTIFICAÇÕES
-- =====================================================
CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON notificacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar notificações"
  ON notificacoes FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- POLÍTICAS PARA TAGS
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver tags"
  ON tags FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar tags"
  ON tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- POLÍTICAS PARA TEMPLATES
-- =====================================================
CREATE POLICY "Usuários podem ver templates públicos ou próprios"
  ON templates_tarefas FOR SELECT
  USING (publico = true OR criado_por = auth.uid());

CREATE POLICY "Usuários autenticados podem criar templates"
  ON templates_tarefas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar templates próprios"
  ON templates_tarefas FOR UPDATE
  USING (criado_por = auth.uid());

-- =====================================================
-- POLÍTICAS PARA ARQUIVOS
-- =====================================================
CREATE POLICY "Usuários podem ver arquivos de entidades relacionadas"
  ON arquivos FOR SELECT
  USING (
    auth.uid() = enviado_por OR
    EXISTS (
      SELECT 1 FROM tarefas t
      WHERE t.id = arquivos.tarefa_id
        AND (t.responsavel_id = auth.uid() OR auth.uid() = ANY(t.participantes_ids))
    ) OR
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = arquivos.projeto_id
        AND (p.responsavel_id = auth.uid() OR auth.uid() = ANY(p.equipe_ids))
    ) OR
    EXISTS (
      SELECT 1 FROM calculos c
      WHERE c.id = arquivos.calculo_id
        AND (c.calculado_por = auth.uid() OR c.criado_por = auth.uid())
    )
  );

CREATE POLICY "Usuários autenticados podem fazer upload de arquivos"
  ON arquivos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- POLÍTICAS PARA CÁLCULOS
-- =====================================================
CREATE POLICY "Usuários podem ver cálculos relacionados"
  ON calculos FOR SELECT
  USING (
    calculado_por = auth.uid() OR
    criado_por = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = calculos.projeto_id
        AND (p.responsavel_id = auth.uid() OR auth.uid() = ANY(p.equipe_ids))
    )
  );

CREATE POLICY "Usuários autenticados podem criar cálculos"
  ON calculos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar cálculos próprios"
  ON calculos FOR UPDATE
  USING (calculado_por = auth.uid() OR criado_por = auth.uid());

-- =====================================================
-- POLÍTICAS PARA PETIÇÕES
-- =====================================================
CREATE POLICY "Usuários podem ver petições de projetos relacionados"
  ON peticoes FOR SELECT
  USING (
    autor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = peticoes.projeto_id
        AND (p.responsavel_id = auth.uid() OR auth.uid() = ANY(p.equipe_ids))
    )
  );

CREATE POLICY "Usuários autenticados podem criar petições"
  ON peticoes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar petições próprias"
  ON peticoes FOR UPDATE
  USING (autor_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA TEMPLATES DE PETIÇÕES
-- =====================================================
CREATE POLICY "Usuários podem ver templates públicos ou próprios"
  ON templates_peticoes FOR SELECT
  USING (publico = true OR criado_por = auth.uid());

CREATE POLICY "Usuários autenticados podem criar templates"
  ON templates_peticoes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- POLÍTICAS PARA AUDIÊNCIAS
-- =====================================================
CREATE POLICY "Usuários podem ver audiências de projetos relacionados"
  ON audiencias FOR SELECT
  USING (
    auth.uid() = ANY(participantes_ids) OR
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = audiencias.projeto_id
        AND (p.responsavel_id = auth.uid() OR auth.uid() = ANY(p.equipe_ids))
    )
  );

CREATE POLICY "Usuários autenticados podem criar audiências"
  ON audiencias FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- POLÍTICAS PARA TIME TRACKING
-- =====================================================
CREATE POLICY "Usuários podem ver seus próprios time entries"
  ON time_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar time entries"
  ON time_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA HONORÁRIOS
-- =====================================================
CREATE POLICY "Usuários podem ver honorários de projetos relacionados"
  ON honorarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = honorarios.projeto_id
        AND (p.responsavel_id = auth.uid() OR auth.uid() = ANY(p.equipe_ids))
    )
  );

CREATE POLICY "Usuários autenticados podem criar honorários"
  ON honorarios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- POLÍTICAS PARA CONFIGURAÇÕES
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver configurações"
  ON configuracoes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem gerenciar configurações"
  ON configuracoes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nome = 'Administrador'
    )
  );

-- =====================================================
-- POLÍTICAS PARA LOG DE ATIVIDADES
-- =====================================================
CREATE POLICY "Usuários podem ver seus próprios logs"
  ON log_atividades FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Apenas admins podem ver todos os logs"
  ON log_atividades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.nome = 'Administrador'
    )
  );

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para tarefas com informações completas
CREATE OR REPLACE VIEW v_tarefas_completas AS
SELECT
  t.*,
  p.nome_completo as responsavel_nome,
  p.avatar_url as responsavel_avatar,
  c.nome_completo as contato_nome,
  proj.titulo as projeto_titulo,
  o.titulo as oportunidade_titulo,
  (SELECT COUNT(*) FROM comentarios WHERE tarefa_id = t.id) as total_comentarios,
  (SELECT COUNT(*) FROM arquivos WHERE tarefa_id = t.id) as total_anexos,
  CASE
    WHEN t.data_vencimento < NOW() AND t.status NOT IN ('Concluída', 'Cancelada') THEN true
    ELSE false
  END as atrasada
FROM tarefas t
LEFT JOIN profiles p ON t.responsavel_id = p.id
LEFT JOIN contatos c ON t.contato_id = c.id
LEFT JOIN projetos proj ON t.projeto_id = proj.id
LEFT JOIN oportunidades o ON t.oportunidade_id = o.id;

-- View para dashboard de tarefas por usuário
CREATE OR REPLACE VIEW v_dashboard_tarefas AS
SELECT
  responsavel_id,
  COUNT(*) FILTER (WHERE status = 'Pendente') as tarefas_pendentes,
  COUNT(*) FILTER (WHERE status = 'Em Andamento') as tarefas_em_andamento,
  COUNT(*) FILTER (WHERE status = 'Concluída') as tarefas_concluidas,
  COUNT(*) FILTER (WHERE data_vencimento < NOW() AND status NOT IN ('Concluída', 'Cancelada')) as tarefas_atrasadas,
  COUNT(*) FILTER (WHERE data_vencimento BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status NOT IN ('Concluída', 'Cancelada')) as tarefas_proxima_semana,
  COUNT(*) FILTER (WHERE prioridade = 'Urgente' AND status NOT IN ('Concluída', 'Cancelada')) as tarefas_urgentes
FROM tarefas
WHERE ativo = true
GROUP BY responsavel_id;

-- View para oportunidades por estágio (Pipeline Kanban)
CREATE OR REPLACE VIEW v_pipeline_resumo AS
SELECT
  estagio,
  COUNT(*) as total_oportunidades,
  SUM(valor_estimado) as valor_total,
  AVG(probabilidade) as probabilidade_media
FROM oportunidades
WHERE ativo = true
GROUP BY estagio;

-- View para projetos ativos com métricas
CREATE OR REPLACE VIEW v_projetos_metricas AS
SELECT
  p.*,
  (SELECT COUNT(*) FROM tarefas WHERE projeto_id = p.id AND status NOT IN ('Concluída', 'Cancelada')) as tarefas_pendentes,
  (SELECT COUNT(*) FROM tarefas WHERE projeto_id = p.id AND status = 'Concluída') as tarefas_concluidas,
  (SELECT COUNT(*) FROM calculos WHERE projeto_id = p.id) as total_calculos,
  (SELECT COUNT(*) FROM peticoes WHERE projeto_id = p.id) as total_peticoes,
  prof.nome_completo as responsavel_nome
FROM projetos p
LEFT JOIN profiles prof ON p.responsavel_id = prof.id
WHERE p.ativo = true;

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================

-- Inserir roles padrão
INSERT INTO roles (nome, descricao, permissoes, ativo) VALUES
('Administrador', 'Acesso total ao sistema', '{"all": true}', true),
('Advogado', 'Gerenciar casos, petições e tarefas', '{"casos": ["ler", "criar", "editar"], "peticoes": ["ler", "criar", "editar"], "tarefas": ["ler", "criar", "editar"]}', true),
('Perito', 'Realizar cálculos e análises técnicas', '{"calculos": ["ler", "criar", "editar"], "tarefas": ["ler", "criar", "editar"], "analises": ["ler", "criar", "editar"]}', true),
('Assistente', 'Visualizar e auxiliar em tarefas', '{"tarefas": ["ler"], "contatos": ["ler"], "leitura": true}', true),
('Financeiro', 'Gerenciar honorários e faturamento', '{"honorarios": ["ler", "criar", "editar"], "relatorios": ["ler"]}', true);

-- Inserir tags padrão
INSERT INTO tags (nome, cor, categoria, ativo) VALUES
('Urgente', '#EF4444', 'Prioridade', true),
('Importante', '#F59E0B', 'Prioridade', true),
('Cliente VIP', '#8B5CF6', 'Cliente', true),
('Revisional', '#3B82F6', 'Tipo Ação', true),
('Financiamento', '#10B981', 'Tipo Ação', true),
('Cartão de Crédito', '#EC4899', 'Tipo Ação', true),
('Empréstimo', '#6366F1', 'Tipo Ação', true),
('Follow-up', '#F97316', 'Atividade', true),
('Documento Pendente', '#EAB308', 'Status', true),
('Primeira Consulta', '#06B6D4', 'CRM', true);

-- Inserir configurações iniciais
INSERT INTO configuracoes (chave, valor, descricao, categoria) VALUES
('funil_estagios', '["lead", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"]', 'Estágios do funil de oportunidades', 'CRM'),
('notificacoes_ativadas', 'true', 'Sistema de notificações ativo', 'Sistema'),
('lembrete_padrao_horas', '24', 'Antecedência padrão para lembretes (em horas)', 'Tarefas'),
('email_smtp_config', '{}', 'Configuração do servidor SMTP para envio de emails', 'Email');

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON SCHEMA public IS 'Schema principal do sistema de gestão jurídica - v2.0';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
