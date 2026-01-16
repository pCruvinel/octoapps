export interface Opportunity {
  id: string;
  titulo: string;
  contato_id?: string | null;
  tipo_acao?: 'Revisional' | 'Cartão de Crédito' | 'Empréstimo' |
    'Financiamento Imobiliário' | 'Consultoria' | 'Outros' | null;
  estagio: 'lead' | 'qualification' | 'proposal' | 'negotiation' |
    'closed-won' | 'closed-lost';
  etapa_funil_id?: string | null;
  
  // Valores financeiros (v2)
  valor_estimado?: number | null; // Legado - mantido para compatibilidade
  valor_causa?: number | null; // Valor da dívida do cliente
  valor_proposta?: number | null; // Valor dos honorários (receita)
  
  // Produto/Serviço (v2)
  produto_servico_id?: string | null;
  
  probabilidade?: number | null;
  origem?: string | null;
  responsavel_id?: string | null;
  data_fechamento_prevista?: string | null;
  data_fechamento_real?: string | null;
  motivo_perda?: string | null;
  ordem?: number | null;
  tags?: string[] | null;
  observacoes?: string | null;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  criado_por?: string | null;

  // Relações (quando usar JOIN)
  contatos?: {
    id: string;
    nome_completo: string;
    cpf_cnpj?: string | null;
    email?: string | null;
    telefone_principal?: string | null;
  } | null;
  responsavel?: {
    id: string;
    nome_completo: string;
    avatar_url?: string | null;
  } | null;
  produto_servico?: {
    id: string;
    name: string;
    default_fee_percentage?: number | null;
  } | null;
}

export interface OpportunityFormData {
  titulo: string;
  contato_id?: string;
  tipo_acao?: string;
  valor_estimado?: number;
  estagio: string;
  responsavel_id?: string;
  origem?: string;
}

export interface OpportunityInsert {
  titulo: string;
  contato_id?: string | null;
  tipo_acao?: 'Revisional' | 'Cartão de Crédito' | 'Empréstimo' |
    'Financiamento Imobiliário' | 'Consultoria' | 'Outros' | null;
  estagio: 'lead' | 'qualification' | 'proposal' | 'negotiation' |
    'closed-won' | 'closed-lost';
  valor_estimado?: number | null;
  probabilidade?: number | null;
  origem?: string | null;
  responsavel_id?: string | null;
  data_fechamento_prevista?: string | null;
  tags?: string[] | null;
  observacoes?: string | null;
  criado_por?: string | null;
}
