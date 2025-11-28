/**
 * Types e interfaces para o módulo de Petições
 */

export type TipoPeticao = 'Petição Inicial' | 'Contestação' | 'Recurso' | 'Memorial' | 'Outro';
export type StatusPeticao = 'Rascunho' | 'Concluído';
export type TemplateModelo = 'inicial' | 'contestacao' | 'recurso' | 'memorial' | 'blank';

/**
 * Interface completa de uma petição
 */
export interface Peticao {
  id: string;
  nome: string;
  tipo: TipoPeticao;
  status: StatusPeticao;
  conteudo: string;
  modelo?: TemplateModelo | null;

  // Dados do caso vinculado
  clienteNome?: string | null;
  numeroContrato?: string | null;
  instituicaoFinanceira?: string | null;
  valorContrato?: number | null;
  calculoId?: string | null;

  // Metadados
  dataUltimaEdicao: string;
  createdAt: string;
  updatedAt: string;
  criadoPor: string;

  // Soft delete
  ativo: boolean;
  excluido: boolean;
  excluidoEm?: string | null;
  excluidoPor?: string | null;
}

/**
 * Interface simplificada para listagem de petições
 */
export interface PeticaoListItem {
  id: string;
  name: string;
  type: string;
  lastEdit: string;
  status: string;
}

/**
 * Dados do caso para exibição no editor
 */
export interface DadosCaso {
  client: string;
  contract: string;
  institution: string;
  value: string;
}

/**
 * Informações sobre templates de petições
 */
export interface TemplateInfo {
  id: TemplateModelo;
  nome: string;
  descricao: string;
  conteudoBase: string;
}
