// =====================================================
// TYPES: Etapas do Funil
// =====================================================

/**
 * Tipo de etapa do funil
 * - aberta: Etapa em andamento (Lead, Qualificação, Proposta, etc)
 * - fechada-ganha: Oportunidade convertida em cliente
 * - fechada-perdida: Oportunidade não convertida
 */
export type TipoEtapaFunil = 'aberta' | 'fechada-ganha' | 'fechada-perdida';

/**
 * Interface completa da tabela etapas_funil
 */
export interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  tipo: TipoEtapaFunil;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  criado_por?: string | null;
}

/**
 * Interface para inserção de nova etapa (INSERT)
 */
export interface EtapaFunilInsert {
  nome: string;
  cor?: string;
  ordem: number;
  tipo?: TipoEtapaFunil;
  criado_por?: string | null;
}

/**
 * Interface para atualização de etapa (UPDATE)
 */
export interface EtapaFunilUpdate {
  nome?: string;
  cor?: string;
  ordem?: number;
  tipo?: TipoEtapaFunil;
  ativo?: boolean;
}

/**
 * Interface para dados do formulário de criação/edição
 */
export interface EtapaFunilFormData {
  nome: string;
  cor: string;
  tipo: TipoEtapaFunil;
}

/**
 * Interface para estatísticas de uma etapa do funil
 * (View: v_funil_estatisticas)
 */
export interface EtapaFunilEstatisticas {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  tipo: TipoEtapaFunil;
  total_oportunidades: number;
  valor_total: number;
  probabilidade_media: number;
}

/**
 * Interface para reordenação de etapas
 */
export interface ReordenarEtapasParams {
  etapaId: string;
  novaOrdem: number;
}

/**
 * Opções para a função de reordenação
 */
export interface ReordenarEtapasOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Cores padrão disponíveis para as etapas
 */
export const CORES_ETAPA = {
  cinza: '#94a3b8',
  azul: '#3b82f6',
  roxo: '#8b5cf6',
  laranja: '#f59e0b',
  verde: '#10b981',
  vermelho: '#ef4444',
  indigo: '#6366f1',
  pink: '#ec4899',
  amarelo: '#eab308',
  teal: '#14b8a6',
} as const;

/**
 * Tipo para chaves de cores
 */
export type CoreEtapaKey = keyof typeof CORES_ETAPA;

/**
 * Lista de cores disponíveis
 */
export const LISTA_CORES_ETAPA: Array<{ nome: string; valor: string }> = [
  { nome: 'Cinza', valor: CORES_ETAPA.cinza },
  { nome: 'Azul', valor: CORES_ETAPA.azul },
  { nome: 'Roxo', valor: CORES_ETAPA.roxo },
  { nome: 'Laranja', valor: CORES_ETAPA.laranja },
  { nome: 'Verde', valor: CORES_ETAPA.verde },
  { nome: 'Vermelho', valor: CORES_ETAPA.vermelho },
  { nome: 'Índigo', valor: CORES_ETAPA.indigo },
  { nome: 'Pink', valor: CORES_ETAPA.pink },
  { nome: 'Amarelo', valor: CORES_ETAPA.amarelo },
  { nome: 'Teal', valor: CORES_ETAPA.teal },
];

/**
 * Opções de tipo de etapa para formulários
 */
export const TIPOS_ETAPA: Array<{ label: string; value: TipoEtapaFunil }> = [
  { label: 'Aberta (em andamento)', value: 'aberta' },
  { label: 'Fechada - Ganho', value: 'fechada-ganha' },
  { label: 'Fechada - Perdido', value: 'fechada-perdida' },
];

/**
 * Validações para criação de etapa
 */
export const validarEtapaFunil = (data: Partial<EtapaFunilFormData>): string[] => {
  const erros: string[] = [];

  if (!data.nome || data.nome.trim().length === 0) {
    erros.push('O nome da etapa é obrigatório');
  }

  if (data.nome && data.nome.length > 100) {
    erros.push('O nome da etapa deve ter no máximo 100 caracteres');
  }

  if (!data.cor || !/^#[0-9A-Fa-f]{6}$/.test(data.cor)) {
    erros.push('A cor deve estar no formato hexadecimal (#RRGGBB)');
  }

  if (!data.tipo || !['aberta', 'fechada-ganha', 'fechada-perdida'].includes(data.tipo)) {
    erros.push('O tipo da etapa é inválido');
  }

  return erros;
};


/**
 * Obtém cor baseada no tipo de etapa
 */
export const getCorPorTipo = (tipo: TipoEtapaFunil): string => {
  switch (tipo) {
    case 'fechada-ganha':
      return CORES_ETAPA.verde;
    case 'fechada-perdida':
      return CORES_ETAPA.vermelho;
    case 'aberta':
    default:
      return CORES_ETAPA.azul;
  }
};
