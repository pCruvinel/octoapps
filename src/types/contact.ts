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
  status_contato: 'Ativo' | 'Inativo' | 'Lead' | 'Cliente' | 'Ex-Cliente';
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
  status_contato: 'Ativo' | 'Inativo' | 'Lead' | 'Cliente' | 'Ex-Cliente';
}

export interface ContactInsert {
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  nome_completo: string;
  email?: string | null;
  cpf_cnpj?: string | null;
  telefone_principal?: string | null;
  status_contato: 'Ativo' | 'Inativo' | 'Lead' | 'Cliente' | 'Ex-Cliente';
  responsavel_id?: string | null;
  criado_por?: string | null;
}
