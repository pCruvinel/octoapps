export interface Contact {
  id: string;
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  nome_completo: string;
  nome_social?: string | null;
  cpf_cnpj?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  email?: string | null;
  telefone_principal?: string | null;
  telefone_secundario?: string | null;

  // Endereço
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;

  // CRM e Marketing
  origem_lead?: string | null;
  /** @deprecated Use categoria_contato instead */
  status_contato?: 'Ativo' | 'Inativo' | 'Lead' | 'Cliente' | 'Ex-Cliente';
  /** Categoria manual: LEAD (prospect), CLIENTE (ativo), EX_CLIENTE (encerrado) */
  categoria_contato: 'LEAD' | 'CLIENTE' | 'EX_CLIENTE';
  /** Status calculado automaticamente: ATIVO (<90d), INATIVO (90-180d), ARQUIVADO (>180d) */
  status_atividade?: 'ATIVO' | 'INATIVO' | 'ARQUIVADO';
  tags?: string[] | null;
  observacoes?: string | null;

  // Relacionamentos
  responsavel_id?: string | null;

  // Metadata
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  criado_por?: string | null;
}

export interface ContactFormData {
  nome_completo: string;
  email: string;
  cpf_cnpj?: string;
  telefone_principal?: string;
  categoria_contato: 'LEAD' | 'CLIENTE' | 'EX_CLIENTE';
}

export interface ContactInsert {
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  nome_completo: string;
  email?: string | null;
  cpf_cnpj?: string | null;
  telefone_principal?: string | null;
  categoria_contato: 'LEAD' | 'CLIENTE' | 'EX_CLIENTE';
  responsavel_id?: string | null;
  criado_por?: string | null;
}

