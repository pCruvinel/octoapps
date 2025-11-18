-- =====================================================
-- QUERIES ÚTEIS PARA GESTÃO DE TAREFAS
-- Exemplos de consultas para o sistema jurídico
-- =====================================================

-- =====================================================
-- 1. DASHBOARD - MÉTRICAS GERAIS
-- =====================================================

-- Total de tarefas por status para um usuário
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM tarefas
WHERE responsavel_id = 'USER_ID_AQUI'
  AND ativo = true
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'Pendente' THEN 1
    WHEN 'Em Andamento' THEN 2
    WHEN 'Aguardando' THEN 3
    WHEN 'Concluída' THEN 4
    WHEN 'Cancelada' THEN 5
  END;

-- Tarefas atrasadas por prioridade
SELECT 
  t.id,
  t.titulo,
  t.prioridade,
  t.data_vencimento,
  p.nome_completo as responsavel,
  DATE_PART('day', NOW() - t.data_vencimento) as dias_atraso
FROM tarefas t
JOIN profiles p ON t.responsavel_id = p.id
WHERE t.status NOT IN ('Concluída', 'Cancelada')
  AND t.data_vencimento < NOW()
  AND t.ativo = true
ORDER BY 
  CASE t.prioridade
    WHEN 'Urgente' THEN 1
    WHEN 'Alta' THEN 2
    WHEN 'Média' THEN 3
    WHEN 'Baixa' THEN 4
  END,
  t.data_vencimento;

-- Tarefas da próxima semana
SELECT 
  t.id,
  t.titulo,
  t.tipo,
  t.prioridade,
  t.data_vencimento,
  p.nome_completo as responsavel,
  c.nome_completo as contato,
  proj.titulo as projeto
FROM tarefas t
JOIN profiles p ON t.responsavel_id = p.id
LEFT JOIN contatos c ON t.contato_id = c.id
LEFT JOIN projetos proj ON t.projeto_id = proj.id
WHERE t.status NOT IN ('Concluída', 'Cancelada')
  AND t.data_vencimento BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND t.ativo = true
ORDER BY t.data_vencimento;

-- =====================================================
-- 2. RELATÓRIOS DE PRODUTIVIDADE
-- =====================================================

-- Tarefas concluídas por usuário no mês atual
SELECT 
  p.nome_completo,
  COUNT(*) as tarefas_concluidas,
  AVG(t.tempo_gasto) as tempo_medio_minutos,
  SUM(t.tempo_gasto) as tempo_total_minutos
FROM tarefas t
JOIN profiles p ON t.responsavel_id = p.id
WHERE t.status = 'Concluída'
  AND t.data_conclusao >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.data_conclusao < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY p.id, p.nome_completo
ORDER BY tarefas_concluidas DESC;

-- Taxa de conclusão por tipo de tarefa
SELECT 
  tipo,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'Concluída') as concluidas,
  ROUND(COUNT(*) FILTER (WHERE status = 'Concluída') * 100.0 / COUNT(*), 2) as taxa_conclusao,
  AVG(CASE 
    WHEN status = 'Concluída' AND data_conclusao IS NOT NULL AND data_vencimento IS NOT NULL
    THEN EXTRACT(EPOCH FROM (data_conclusao - data_vencimento)) / 86400 
  END) as media_dias_prazo
FROM tarefas
WHERE data_criacao >= NOW() - INTERVAL '30 days'
GROUP BY tipo
ORDER BY total DESC;

-- Distribuição de carga de trabalho
SELECT 
  p.nome_completo,
  COUNT(*) FILTER (WHERE t.status = 'Pendente') as pendentes,
  COUNT(*) FILTER (WHERE t.status = 'Em Andamento') as em_andamento,
  COUNT(*) FILTER (WHERE t.prioridade = 'Urgente' AND t.status NOT IN ('Concluída', 'Cancelada')) as urgentes,
  SUM(t.duracao_estimada) as minutos_estimados_total
FROM profiles p
LEFT JOIN tarefas t ON p.id = t.responsavel_id AND t.ativo = true
WHERE p.ativo = true
GROUP BY p.id, p.nome_completo
ORDER BY pendentes DESC, em_andamento DESC;

-- =====================================================
-- 3. GESTÃO DE PROJETOS
-- =====================================================

-- Tarefas por projeto com progresso
SELECT 
  proj.id,
  proj.titulo,
  proj.status,
  COUNT(t.id) as total_tarefas,
  COUNT(t.id) FILTER (WHERE t.status = 'Concluída') as tarefas_concluidas,
  ROUND(
    COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'Concluída') * 100.0 / NULLIF(COUNT(t.id), 0), 0),
    2
  ) as percentual_conclusao,
  MIN(t.data_vencimento) FILTER (WHERE t.status NOT IN ('Concluída', 'Cancelada')) as proxima_tarefa_vencimento,
  COUNT(t.id) FILTER (WHERE t.data_vencimento < NOW() AND t.status NOT IN ('Concluída', 'Cancelada')) as tarefas_atrasadas
FROM projetos proj
LEFT JOIN tarefas t ON proj.id = t.projeto_id AND t.ativo = true
WHERE proj.ativo = true
  AND proj.status NOT IN ('Concluído', 'Cancelado')
GROUP BY proj.id, proj.titulo, proj.status
ORDER BY tarefas_atrasadas DESC, proxima_tarefa_vencimento;

-- Timeline de tarefas de um projeto
SELECT 
  t.id,
  t.titulo,
  t.tipo,
  t.status,
  t.prioridade,
  t.data_inicio,
  t.data_vencimento,
  t.data_conclusao,
  p.nome_completo as responsavel,
  ARRAY_AGG(DISTINCT pt.nome_completo) FILTER (WHERE pt.id IS NOT NULL) as participantes
FROM tarefas t
LEFT JOIN profiles p ON t.responsavel_id = p.id
LEFT JOIN LATERAL UNNEST(t.participantes_ids) WITH ORDINALITY AS participante_id ON true
LEFT JOIN profiles pt ON pt.id = participante_id
WHERE t.projeto_id = 'PROJECT_ID_AQUI'
  AND t.ativo = true
GROUP BY t.id, t.titulo, t.tipo, t.status, t.prioridade, t.data_inicio, t.data_vencimento, t.data_conclusao, p.nome_completo
ORDER BY 
  COALESCE(t.data_vencimento, t.data_inicio, t.data_criacao);

-- =====================================================
-- 4. ANÁLISE DE OPORTUNIDADES (CRM)
-- =====================================================

-- Oportunidades com próximas tarefas
SELECT 
  o.id,
  o.titulo,
  o.estagio,
  o.valor_estimado,
  c.nome_completo as contato,
  p.nome_completo as responsavel,
  COUNT(t.id) as total_tarefas,
  MIN(t.data_vencimento) FILTER (WHERE t.status NOT IN ('Concluída', 'Cancelada')) as proxima_tarefa,
  COUNT(t.id) FILTER (WHERE t.status = 'Concluída') as tarefas_concluidas
FROM oportunidades o
LEFT JOIN contatos c ON o.contato_id = c.id
LEFT JOIN profiles p ON o.responsavel_id = p.id
LEFT JOIN tarefas t ON o.id = t.oportunidade_id AND t.ativo = true
WHERE o.ativo = true
  AND o.estagio NOT IN ('Ganho', 'Perdido')
GROUP BY o.id, o.titulo, o.estagio, o.valor_estimado, c.nome_completo, p.nome_completo
ORDER BY proxima_tarefa NULLS LAST;

-- Tempo médio para fechar oportunidades por origem
SELECT 
  origem,
  COUNT(*) as total_oportunidades,
  COUNT(*) FILTER (WHERE estagio = 'Ganho') as ganhas,
  ROUND(COUNT(*) FILTER (WHERE estagio = 'Ganho') * 100.0 / COUNT(*), 2) as taxa_conversao,
  AVG(
    CASE WHEN estagio = 'Ganho' AND data_fechamento_real IS NOT NULL
    THEN EXTRACT(EPOCH FROM (data_fechamento_real - data_criacao)) / 86400
    END
  ) as dias_medio_fechamento,
  SUM(valor_estimado) FILTER (WHERE estagio = 'Ganho') as valor_total_ganho
FROM oportunidades
WHERE data_criacao >= NOW() - INTERVAL '6 months'
GROUP BY origem
ORDER BY ganhas DESC;

-- =====================================================
-- 5. NOTIFICAÇÕES E LEMBRETES
-- =====================================================

-- Criar notificações para tarefas vencendo nas próximas 24h
INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link_entidade)
SELECT 
  t.responsavel_id,
  'lembrete',
  'Tarefa vence em breve',
  'A tarefa "' || t.titulo || '" vence em ' || 
    CASE 
      WHEN t.data_vencimento::date = CURRENT_DATE THEN 'hoje'
      WHEN t.data_vencimento::date = CURRENT_DATE + 1 THEN 'amanhã'
      ELSE TO_CHAR(t.data_vencimento, 'DD/MM/YYYY')
    END || ' às ' || TO_CHAR(t.data_vencimento, 'HH24:MI'),
  t.id::TEXT
FROM tarefas t
WHERE t.status NOT IN ('Concluída', 'Cancelada')
  AND t.data_vencimento BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
  AND t.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM notificacoes n
    WHERE n.user_id = t.responsavel_id
      AND n.tipo = 'lembrete'
      AND n.link_entidade = t.id::TEXT
      AND n.data_criacao > NOW() - INTERVAL '24 hours'
  );

-- Listar notificações não lidas de um usuário
SELECT 
  n.id,
  n.tipo,
  n.titulo,
  n.mensagem,
  n.data_criacao,
  CASE n.tipo
    WHEN 'tarefa' THEN (SELECT titulo FROM tarefas WHERE id::TEXT = n.link_entidade)
    WHEN 'mencao' THEN 'Menção em comentário'
    ELSE NULL
  END as contexto
FROM notificacoes n
WHERE n.user_id = 'USER_ID_AQUI'
  AND n.lida = false
ORDER BY n.data_criacao DESC
LIMIT 20;

-- =====================================================
-- 6. BUSCAS E FILTROS AVANÇADOS
-- =====================================================

-- Busca full-text de tarefas
SELECT 
  t.id,
  t.titulo,
  t.descricao,
  t.status,
  t.prioridade,
  p.nome_completo as responsavel,
  proj.titulo as projeto,
  ts_rank(
    to_tsvector('portuguese', t.titulo || ' ' || COALESCE(t.descricao, '')),
    plainto_tsquery('portuguese', 'TERMO_BUSCA_AQUI')
  ) as relevancia
FROM tarefas t
LEFT JOIN profiles p ON t.responsavel_id = p.id
LEFT JOIN projetos proj ON t.projeto_id = proj.id
WHERE to_tsvector('portuguese', t.titulo || ' ' || COALESCE(t.descricao, '')) @@ 
      plainto_tsquery('portuguese', 'TERMO_BUSCA_AQUI')
  AND t.ativo = true
ORDER BY relevancia DESC, t.data_criacao DESC;

-- Filtrar tarefas por múltiplos critérios
SELECT 
  t.id,
  t.titulo,
  t.tipo,
  t.status,
  t.prioridade,
  t.data_vencimento,
  p.nome_completo as responsavel,
  c.nome_completo as contato
FROM tarefas t
LEFT JOIN profiles p ON t.responsavel_id = p.id
LEFT JOIN contatos c ON t.contato_id = c.id
WHERE t.ativo = true
  AND (
    'STATUS_FILTRO' = 'todos' OR 
    t.status = 'STATUS_FILTRO'
  )
  AND (
    'PRIORIDADE_FILTRO' = 'todas' OR 
    t.prioridade = 'PRIORIDADE_FILTRO'
  )
  AND (
    'TIPO_FILTRO' = 'todos' OR 
    t.tipo = 'TIPO_FILTRO'
  )
  AND (
    'USER_ID_FILTRO' IS NULL OR 
    t.responsavel_id = 'USER_ID_FILTRO'::UUID
  )
  AND (
    'DATA_INICIO_FILTRO' IS NULL OR 
    t.data_vencimento >= 'DATA_INICIO_FILTRO'::DATE
  )
  AND (
    'DATA_FIM_FILTRO' IS NULL OR 
    t.data_vencimento <= 'DATA_FIM_FILTRO'::DATE
  )
ORDER BY 
  CASE t.prioridade
    WHEN 'Urgente' THEN 1
    WHEN 'Alta' THEN 2
    WHEN 'Média' THEN 3
    WHEN 'Baixa' THEN 4
  END,
  t.data_vencimento NULLS LAST;

-- =====================================================
-- 7. HISTÓRICO E AUDITORIA
-- =====================================================

-- Histórico completo de uma tarefa
SELECT 
  'comentario' as tipo,
  c.conteudo as descricao,
  c.data_criacao as data,
  p.nome_completo as usuario,
  c.editado
FROM comentarios c
JOIN profiles p ON c.autor_id = p.id
WHERE c.tarefa_id = 'TAREFA_ID_AQUI'

UNION ALL

SELECT 
  'log' as tipo,
  l.acao as descricao,
  l.data_criacao as data,
  p.nome_completo as usuario,
  false as editado
FROM log_atividades l
LEFT JOIN profiles p ON l.user_id = p.id
WHERE l.entidade = 'tarefas' 
  AND l.entidade_id = 'TAREFA_ID_AQUI'

ORDER BY data DESC;

-- Alterações recentes de status em projetos
SELECT 
  proj.titulo as projeto,
  l.acao,
  l.dados_anteriores->>'status' as status_anterior,
  l.dados_novos->>'status' as status_novo,
  p.nome_completo as alterado_por,
  l.data_criacao
FROM log_atividades l
JOIN projetos proj ON l.entidade_id = proj.id
LEFT JOIN profiles p ON l.user_id = p.id
WHERE l.entidade = 'projetos'
  AND l.acao = 'update'
  AND l.dados_anteriores->>'status' IS DISTINCT FROM l.dados_novos->>'status'
  AND l.data_criacao >= NOW() - INTERVAL '7 days'
ORDER BY l.data_criacao DESC;

-- =====================================================
-- 8. ESTATÍSTICAS E MÉTRICAS
-- =====================================================

-- Tempo médio de conclusão por tipo de tarefa
SELECT 
  tipo,
  COUNT(*) as total_concluidas,
  AVG(
    EXTRACT(EPOCH FROM (data_conclusao - data_criacao)) / 3600
  )::DECIMAL(10,2) as horas_medias,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (data_conclusao - data_criacao)) / 3600
  )::DECIMAL(10,2) as mediana_horas,
  MIN(
    EXTRACT(EPOCH FROM (data_conclusao - data_criacao)) / 3600
  )::DECIMAL(10,2) as tempo_minimo,
  MAX(
    EXTRACT(EPOCH FROM (data_conclusao - data_criacao)) / 3600
  )::DECIMAL(10,2) as tempo_maximo
FROM tarefas
WHERE status = 'Concluída'
  AND data_conclusao IS NOT NULL
  AND data_criacao >= NOW() - INTERVAL '3 months'
GROUP BY tipo
ORDER BY total_concluidas DESC;

-- Evolução mensal de tarefas
SELECT 
  DATE_TRUNC('month', data_criacao) as mes,
  COUNT(*) as total_criadas,
  COUNT(*) FILTER (WHERE status = 'Concluída') as concluidas,
  COUNT(*) FILTER (WHERE status = 'Cancelada') as canceladas,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'Concluída') * 100.0 / COUNT(*),
    2
  ) as taxa_conclusao
FROM tarefas
WHERE data_criacao >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', data_criacao)
ORDER BY mes DESC;

-- Top usuários por produtividade
SELECT 
  p.nome_completo,
  p.persona,
  COUNT(*) as tarefas_concluidas,
  ROUND(AVG(t.progresso), 2) as progresso_medio,
  COUNT(*) FILTER (
    WHERE t.data_conclusao <= t.data_vencimento
  ) as tarefas_no_prazo,
  COUNT(*) FILTER (
    WHERE t.prioridade IN ('Alta', 'Urgente')
  ) as tarefas_prioritarias
FROM profiles p
JOIN tarefas t ON p.id = t.responsavel_id
WHERE t.status = 'Concluída'
  AND t.data_conclusao >= NOW() - INTERVAL '30 days'
  AND p.ativo = true
GROUP BY p.id, p.nome_completo, p.persona
ORDER BY tarefas_concluidas DESC
LIMIT 10;

-- =====================================================
-- 9. TAREFAS RECORRENTES
-- =====================================================

-- Criar próxima instância de tarefa recorrente
INSERT INTO tarefas (
  titulo,
  descricao,
  tipo,
  status,
  prioridade,
  responsavel_id,
  participantes_ids,
  projeto_id,
  data_vencimento,
  duracao_estimada,
  recorrente,
  recorrencia_tipo,
  recorrencia_fim,
  checklist,
  tags,
  criado_por
)
SELECT 
  titulo,
  descricao,
  tipo,
  'Pendente',
  prioridade,
  responsavel_id,
  participantes_ids,
  projeto_id,
  CASE recorrencia_tipo
    WHEN 'Diária' THEN data_vencimento + INTERVAL '1 day'
    WHEN 'Semanal' THEN data_vencimento + INTERVAL '7 days'
    WHEN 'Quinzenal' THEN data_vencimento + INTERVAL '14 days'
    WHEN 'Mensal' THEN data_vencimento + INTERVAL '1 month'
    WHEN 'Anual' THEN data_vencimento + INTERVAL '1 year'
  END,
  duracao_estimada,
  recorrente,
  recorrencia_tipo,
  recorrencia_fim,
  checklist,
  tags,
  criado_por
FROM tarefas
WHERE recorrente = true
  AND status = 'Concluída'
  AND NOT EXISTS (
    SELECT 1 FROM tarefas t2
    WHERE t2.tarefa_pai_id = tarefas.id
      AND t2.data_criacao > NOW() - INTERVAL '1 day'
  )
  AND (
    recorrencia_fim IS NULL OR
    CASE recorrencia_tipo
      WHEN 'Diária' THEN data_vencimento + INTERVAL '1 day'
      WHEN 'Semanal' THEN data_vencimento + INTERVAL '7 days'
      WHEN 'Quinzenal' THEN data_vencimento + INTERVAL '14 days'
      WHEN 'Mensal' THEN data_vencimento + INTERVAL '1 month'
      WHEN 'Anual' THEN data_vencimento + INTERVAL '1 year'
    END <= recorrencia_fim
  );

-- =====================================================
-- 10. INTEGRAÇÕES E EXPORTAÇÕES
-- =====================================================

-- Exportar tarefas para relatório (formato JSON)
SELECT json_build_object(
  'id', t.id,
  'titulo', t.titulo,
  'descricao', t.descricao,
  'tipo', t.tipo,
  'status', t.status,
  'prioridade', t.prioridade,
  'responsavel', json_build_object(
    'id', p.id,
    'nome', p.nome_completo,
    'email', p.email
  ),
  'contato', CASE WHEN c.id IS NOT NULL THEN json_build_object(
    'id', c.id,
    'nome', c.nome_completo,
    'cpf_cnpj', c.cpf_cnpj
  ) ELSE NULL END,
  'projeto', CASE WHEN proj.id IS NOT NULL THEN json_build_object(
    'id', proj.id,
    'titulo', proj.titulo,
    'numero_processo', proj.numero_processo
  ) ELSE NULL END,
  'datas', json_build_object(
    'criacao', t.data_criacao,
    'vencimento', t.data_vencimento,
    'conclusao', t.data_conclusao
  ),
  'progresso', t.progresso,
  'tempo_gasto', t.tempo_gasto,
  'tags', t.tags,
  'total_comentarios', (SELECT COUNT(*) FROM comentarios WHERE tarefa_id = t.id),
  'total_anexos', (SELECT COUNT(*) FROM arquivos WHERE tarefa_id = t.id)
) as tarefa_json
FROM tarefas t
LEFT JOIN profiles p ON t.responsavel_id = p.id
LEFT JOIN contatos c ON t.contato_id = c.id
LEFT JOIN projetos proj ON t.projeto_id = proj.id
WHERE t.data_criacao >= 'DATA_INICIO'
  AND t.data_criacao <= 'DATA_FIM'
  AND t.ativo = true;

-- =====================================================
-- FIM DAS QUERIES ÚTEIS
-- =====================================================
