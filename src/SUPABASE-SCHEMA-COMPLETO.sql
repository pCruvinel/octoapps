-- =====================================================
-- SCHEMA COMPLETO - SISTEMA DE GESTÃO JURÍDICA
-- Copie e cole este código inteiro no SQL Editor do Supabase
-- =====================================================

-- 1. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(15),
  cargo TEXT,
  persona TEXT CHECK (persona IN ('Ana Admin', 'Diego Perito', 'Maria Advogada')),
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELAS DE PERMISSÕES E ROLES
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  permissoes JSONB DEFAULT '{}',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- 3. TABELA DE CONTATOS
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
  cep VARCHAR(9),
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado VARCHAR(2),
  origem_lead TEXT,
  tags TEXT[],
  observacoes TEXT,
  responsavel_id UUID REFERENCES profiles(id),
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

-- 4. TABELA DE OPORTUNIDADES (CRM)
CREATE TABLE oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  tipo_acao TEXT CHECK (tipo_acao IN ('Revisional', 'Cartão de Crédito', 'Empréstimo', 'Financiamento', 'Outros')),
  estagio TEXT CHECK (estagio IN ('Lead', 'Qualificação', 'Proposta', 'Negociação', 'Ganho', 'Perdido')) NOT NULL DEFAULT 'Lead',
  valor_estimado DECIMAL(15, 2),
  probabilidade INTEGER CHECK (probabilidade >= 0 AND probabilidade <= 100) DEFAULT 50,
  origem TEXT,
  responsavel_id UUID REFERENCES profiles(id),
  data_fechamento_prevista DATE,
  data_fechamento_real DATE,
  motivo_perda TEXT,
  tags TEXT[],
  observacoes TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

-- 5. TABELA DE PROJETOS/CASOS
CREATE TABLE projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(50) UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE SET NULL,
  tipo_projeto TEXT CHECK (tipo_projeto IN ('Revisional', 'Cartão de Crédito', 'Empréstimo', 'Financiamento', 'Consultoria', 'Outros')),
  status TEXT CHECK (status IN ('Não Iniciado', 'Em Andamento', 'Em Análise', 'Aguardando Cliente', 'Pausado', 'Concluído', 'Cancelado')) NOT NULL DEFAULT 'Não Iniciado',
  prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',
  valor_causa DECIMAL(15, 2),
  data_inicio DATE,
  data_prazo DATE,
  data_conclusao DATE,
  responsavel_id UUID REFERENCES profiles(id),
  equipe_ids UUID[] DEFAULT ARRAY[]::UUID[],
  tags TEXT[],
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

-- 6. TABELA DE TAREFAS (PRINCIPAL)
CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('Tarefa', 'Follow-up', 'Reunião', 'Ligação', 'E-mail', 'Documento', 'Prazo Judicial', 'Outros')) NOT NULL DEFAULT 'Tarefa',
  status TEXT CHECK (status IN ('Pendente', 'Em Andamento', 'Aguardando', 'Concluída', 'Cancelada')) NOT NULL DEFAULT 'Pendente',
  prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE SET NULL,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  tarefa_pai_id UUID REFERENCES tarefas(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES profiles(id) NOT NULL,
  participantes_ids UUID[] DEFAULT ARRAY[]::UUID[],
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_vencimento TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  duracao_estimada INTEGER,
  tempo_gasto INTEGER,
  lembrete_antecedencia INTEGER,
  lembrete_enviado BOOLEAN DEFAULT false,
  recorrente BOOLEAN DEFAULT false,
  recorrencia_tipo TEXT CHECK (recorrencia_tipo IN ('Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Anual')),
  recorrencia_fim DATE,
  checklist JSONB DEFAULT '[]',
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  tags TEXT[],
  anexos JSONB DEFAULT '[]',
  observacoes TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES profiles(id)
);

-- 7. TABELA DE COMENTÁRIOS/HISTÓRICO
CREATE TABLE comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('comentario', 'historico', 'sistema')) NOT NULL DEFAULT 'comentario',
  conteudo TEXT NOT NULL,
  tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
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

-- 8. TABELA DE NOTIFICAÇÕES
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('tarefa', 'mencao', 'prazo', 'sistema', 'lembrete')) NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link_entidade TEXT,
  icone TEXT,
  lida BOOLEAN DEFAULT false,
  data_leitura TIMESTAMP WITH TIME ZONE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA DE ETIQUETAS/TAGS
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  cor VARCHAR(7),
  descricao TEXT,
  categoria TEXT,
  uso_count INTEGER DEFAULT 0,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABELA DE TEMPLATES DE TAREFAS
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

-- 11. TABELA DE ANEXOS/ARQUIVOS
CREATE TABLE arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  tipo_mime TEXT NOT NULL,
  tamanho BIGINT NOT NULL,
  url TEXT NOT NULL,
  caminho_storage TEXT NOT NULL,
  tarefa_id UUID REFERENCES tarefas(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comentarios(id) ON DELETE CASCADE,
  enviado_por UUID REFERENCES profiles(id),
  data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT arquivo_relacionamento_check CHECK (
    tarefa_id IS NOT NULL OR 
    projeto_id IS NOT NULL OR 
    oportunidade_id IS NOT NULL OR 
    contato_id IS NOT NULL OR
    comentario_id IS NOT NULL
  )
);

-- 12. TABELA DE CÁLCULOS REVISIONAIS
CREATE TABLE calculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('Financiamento Imobiliário', 'Cartão de Crédito', 'Empréstimos')) NOT NULL,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  projeto_id UUID REFERENCES projetos(id) ON DELETE SET NULL,
  dados_contrato JSONB NOT NULL,
  resultado_calculo JSONB,
  economia_estimada DECIMAL(15, 2),
  status TEXT CHECK (status IN ('Em Análise', 'Concluído', 'Com Divergências', 'Arquivado')) DEFAULT 'Em Análise',
  calculado_por UUID REFERENCES profiles(id),
  revisado_por UUID REFERENCES profiles(id),
  observacoes TEXT,
  data_calculo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_revisao TIMESTAMP WITH TIME ZONE,
  criado_por UUID REFERENCES profiles(id)
);

-- 13. TABELA DE PETIÇÕES
CREATE TABLE peticoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo_peticao TEXT,
  conteudo TEXT,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  template_id UUID,
  status TEXT CHECK (status IN ('Rascunho', 'Em Revisão', 'Aprovado', 'Protocolado')) DEFAULT 'Rascunho',
  autor_id UUID REFERENCES profiles(id),
  revisor_id UUID REFERENCES profiles(id),
  data_protocolo TIMESTAMP WITH TIME ZONE,
  numero_protocolo TEXT,
  observacoes TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. TABELA DE LOG DE ATIVIDADES
CREATE TABLE log_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OTIMIZAÇÃO
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
CREATE INDEX idx_contatos_tags ON contatos USING GIN(tags);
CREATE INDEX idx_contatos_busca ON contatos USING GIN(to_tsvector('portuguese', nome_completo || ' ' || COALESCE(email, '') || ' ' || COALESCE(telefone_principal, '')));

-- Oportunidades
CREATE INDEX idx_oportunidades_contato ON oportunidades(contato_id);
CREATE INDEX idx_oportunidades_estagio ON oportunidades(estagio);
CREATE INDEX idx_oportunidades_responsavel ON oportunidades(responsavel_id);
CREATE INDEX idx_oportunidades_tipo_acao ON oportunidades(tipo_acao);
CREATE INDEX idx_oportunidades_data_fechamento ON oportunidades(data_fechamento_prevista);

-- Projetos
CREATE INDEX idx_projetos_contato ON projetos(contato_id);
CREATE INDEX idx_projetos_oportunidade ON projetos(oportunidade_id);
CREATE INDEX idx_projetos_status ON projetos(status);
CREATE INDEX idx_projetos_prioridade ON projetos(prioridade);
CREATE INDEX idx_projetos_responsavel ON projetos(responsavel_id);
CREATE INDEX idx_projetos_numero_processo ON projetos(numero_processo);
CREATE INDEX idx_projetos_data_prazo ON projetos(data_prazo);

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
CREATE INDEX idx_arquivos_enviado_por ON arquivos(enviado_por);

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

-- Função para marcar tarefa como concluída quando progresso = 100
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
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link_entidade)
    VALUES (
      NEW.responsavel_id,
      'tarefa',
      'Nova tarefa atribuída',
      'Você foi atribuído à tarefa: ' || NEW.titulo,
      NEW.id::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_atribuicao_tarefa
  AFTER INSERT OR UPDATE OF responsavel_id ON tarefas
  FOR EACH ROW
  EXECUTE FUNCTION notificar_atribuicao_tarefa();

-- Função para notificar prazos próximos (executar via cron job)
CREATE OR REPLACE FUNCTION notificar_prazos_proximos()
RETURNS void AS $$
BEGIN
  INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link_entidade)
  SELECT DISTINCT
    t.responsavel_id,
    'prazo',
    'Prazo próximo',
    'A tarefa "' || t.titulo || '" vence em breve',
    t.id::TEXT
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE peticoes ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para CONTATOS
CREATE POLICY "Usuários autenticados podem ver contatos"
  ON contatos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar contatos"
  ON contatos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar contatos que criaram ou são responsáveis"
  ON contatos FOR UPDATE
  USING (auth.uid() = criado_por OR auth.uid() = responsavel_id);

-- Políticas para OPORTUNIDADES
CREATE POLICY "Usuários podem ver oportunidades que criaram ou são responsáveis"
  ON oportunidades FOR SELECT
  USING (auth.uid() = criado_por OR auth.uid() = responsavel_id);

CREATE POLICY "Usuários autenticados podem criar oportunidades"
  ON oportunidades FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar oportunidades que criaram ou são responsáveis"
  ON oportunidades FOR UPDATE
  USING (auth.uid() = criado_por OR auth.uid() = responsavel_id);

-- Políticas para PROJETOS
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

-- Políticas para TAREFAS
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

-- Políticas para COMENTÁRIOS
CREATE POLICY "Usuários podem ver comentários de entidades relacionadas"
  ON comentarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tarefas t
      WHERE t.id = comentarios.tarefa_id
        AND (t.responsavel_id = auth.uid() OR auth.uid() = ANY(t.participantes_ids))
    ) OR
    EXISTS (
      SELECT 1 FROM oportunidades o
      WHERE o.id = comentarios.oportunidade_id
        AND o.responsavel_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = comentarios.projeto_id
        AND (p.responsavel_id = auth.uid() OR auth.uid() = ANY(p.equipe_ids))
    )
  );

CREATE POLICY "Usuários autenticados podem criar comentários"
  ON comentarios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar seus próprios comentários"
  ON comentarios FOR UPDATE
  USING (auth.uid() = autor_id);

-- Políticas para NOTIFICAÇÕES
CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON notificacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para ARQUIVOS
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
    )
  );

CREATE POLICY "Usuários autenticados podem fazer upload de arquivos"
  ON arquivos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

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
  (SELECT COUNT(*) FROM arquivos WHERE tarefa_id = t.id) as total_anexos
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

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================

-- Inserir roles padrão
INSERT INTO roles (nome, descricao, permissoes) VALUES
('Administrador', 'Acesso total ao sistema', '{"all": true}'),
('Advogado', 'Gerenciar casos e petições', '{"casos": true, "peticoes": true, "tarefas": true}'),
('Perito', 'Realizar cálculos e análises', '{"calculos": true, "tarefas": true, "analises": true}'),
('Assistente', 'Visualizar e auxiliar em tarefas', '{"tarefas": true, "leitura": true}');

-- Inserir tags padrão
INSERT INTO tags (nome, cor, categoria) VALUES
('Urgente', '#EF4444', 'Prioridade'),
('Importante', '#F59E0B', 'Prioridade'),
('Cliente VIP', '#8B5CF6', 'Cliente'),
('Revisional', '#3B82F6', 'Tipo Ação'),
('Financiamento', '#10B981', 'Tipo Ação'),
('Cartão', '#EC4899', 'Tipo Ação'),
('Follow-up', '#6366F1', 'Atividade'),
('Documento Pendente', '#F97316', 'Status');

-- =====================================================
-- FIM DO SCHEMA - PRONTO PARA USAR!
-- =====================================================
