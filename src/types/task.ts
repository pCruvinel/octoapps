// =====================================================
// TYPES: Tarefas e Interações
// =====================================================

/**
 * Tipo de tarefa/interação
 */
export type TipoTarefa =
  | 'Tarefa'
  | 'Follow-up'
  | 'Reunião'
  | 'Ligação'
  | 'E-mail'
  | 'Documento'
  | 'Prazo Judicial'
  | 'Audiência'
  | 'Outros';

/**
 * Status da tarefa
 */
export type StatusTarefa =
  | 'Pendente'
  | 'Em Andamento'
  | 'Aguardando'
  | 'Concluída'
  | 'Cancelada';

/**
 * Prioridade da tarefa
 */
export type PrioridadeTarefa =
  | 'Baixa'
  | 'Média'
  | 'Alta'
  | 'Urgente';

/**
 * Interface completa da tabela tarefas
 */
export interface Task {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo: TipoTarefa;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;

  // Relacionamentos
  contato_id?: string | null;
  oportunidade_id?: string | null;
  projeto_id?: string | null;
  tarefa_pai_id?: string | null;

  // Responsáveis e participantes
  responsavel_id: string;
  participantes_ids?: string[];

  // Datas e tempo
  data_inicio?: string | null;
  data_vencimento?: string | null;
  data_conclusao?: string | null;
  duracao_estimada?: number | null; // em minutos
  tempo_gasto?: number | null; // em minutos

  // Notificações e lembretes
  lembrete_antecedencia?: number | null; // em minutos
  lembrete_enviado: boolean;

  // Recorrência
  recorrente: boolean;
  recorrencia_tipo?: 'Diária' | 'Semanal' | 'Quinzenal' | 'Mensal' | 'Anual' | null;
  recorrencia_fim?: string | null;

  // Checklist e progresso
  checklist?: any; // JSONB
  progresso: number;

  // Metadata
  tags?: string[];
  anexos?: any; // JSONB
  observacoes?: string | null;
  ordem: number;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  criado_por?: string | null;

  // Relações (quando usar JOIN)
  responsavel?: {
    id: string;
    nome_completo: string;
    avatar_url?: string | null;
  } | null;
  contato?: {
    id: string;
    nome_completo: string;
  } | null;
}

/**
 * Interface para inserção de nova tarefa (INSERT)
 */
export interface TaskInsert {
  titulo: string;
  tipo: TipoTarefa;
  oportunidade_id?: string | null;
  contato_id?: string | null;
  responsavel_id: string;
  data_vencimento?: string | null;
  observacoes?: string | null;
  prioridade?: PrioridadeTarefa;
  status?: StatusTarefa;
  criado_por?: string | null;
  participantes_ids?: string[];
  lembrete_antecedencia?: number | null;
}

/**
 * Interface para atualização de tarefa (UPDATE)
 */
export interface TaskUpdate {
  titulo?: string;
  descricao?: string | null;
  tipo?: TipoTarefa;
  status?: StatusTarefa;
  prioridade?: PrioridadeTarefa;
  data_vencimento?: string | null;
  data_conclusao?: string | null;
  observacoes?: string | null;
  progresso?: number;
  participantes_ids?: string[];
  lembrete_antecedencia?: number | null;
}

/**
 * Interface para dados do formulário
 */
export interface TaskFormData {
  titulo: string;
  tipo: TipoTarefa;
  data_vencimento: string;
  observacoes?: string;
  prioridade?: PrioridadeTarefa;
}

/**
 * Mapeia tipo para cor do badge
 */
export const getTipoColor = (tipo: TipoTarefa): string => {
  const colors: Record<TipoTarefa, string> = {
    'Tarefa': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Follow-up': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Reunião': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Ligação': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'E-mail': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'Documento': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'Prazo Judicial': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'Audiência': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'Outros': 'bg-muted text-muted-foreground',
  };
  return colors[tipo];
};

/**
 * Mapeia status para cor do badge
 */
export const getStatusColor = (status: StatusTarefa): string => {
  const colors: Record<StatusTarefa, string> = {
    'Pendente': 'bg-muted text-muted-foreground',
    'Em Andamento': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Aguardando': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Concluída': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Cancelada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status];
};

/**
 * Valida dados do formulário
 */
export const validarTaskForm = (data: Partial<TaskFormData>): string[] => {
  const erros: string[] = [];

  if (!data.titulo || data.titulo.trim().length === 0) {
    erros.push('O título é obrigatório');
  }

  if (data.titulo && data.titulo.length > 200) {
    erros.push('O título deve ter no máximo 200 caracteres');
  }

  if (!data.tipo) {
    erros.push('O tipo é obrigatório');
  }

  if (!data.data_vencimento) {
    erros.push('A data e hora são obrigatórias');
  }

  return erros;
};
