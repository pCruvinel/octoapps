/**
 * ContratoRevisional Types
 * Tipos para contratos revisionais com relacionamentos CRM
 */

export type ModuloCalculo = 'GERAL' | 'IMOBILIARIO' | 'CARTAO';

export type StatusContrato =
    | 'RASCUNHO'
    | 'ANALISE_PREVIA'
    | 'ANALISE_DETALHADA'
    | 'ARQUIVADO';

export interface ContratoRevisional {
    id: string;
    user_id: string;

    // Relacionamentos CRM (novos)
    contato_id?: string | null;
    oportunidade_id?: string | null;

    // Campos legados (manter para compatibilidade)
    /** @deprecated Use contato_id com JOIN para buscar nome */
    lead_id?: string | null;
    /** @deprecated Use contato.nome_completo via JOIN */
    lead_nome?: string | null;

    // Dados do contrato
    modulo: ModuloCalculo;
    status: StatusContrato;
    nome_referencia?: string | null;
    origem?: string | null;
    valor_contrato?: number | null;
    data_contrato?: string | null;

    // Dados do wizard (JSONB)
    dados_step1?: Record<string, unknown> | null;
    dados_step2?: Record<string, unknown> | null;
    dados_step3?: Record<string, unknown> | null;

    // Metadata
    created_at: string;
    updated_at: string;

    // JOINs (quando usar select com relacionamentos)
    contato?: {
        id: string;
        nome_completo: string;
        cpf_cnpj?: string | null;
        email?: string | null;
        telefone_principal?: string | null;
    } | null;
    oportunidade?: {
        id: string;
        titulo: string;
        estagio?: string | null;
    } | null;
}

export interface ContratoRevisionalInsert {
    user_id: string;
    contato_id?: string | null;
    oportunidade_id?: string | null;
    modulo: ModuloCalculo;
    status?: StatusContrato;
    nome_referencia?: string | null;
    origem?: string | null;
    valor_contrato?: number | null;
    data_contrato?: string | null;
    dados_step1?: Record<string, unknown> | null;
    dados_step2?: Record<string, unknown> | null;
    dados_step3?: Record<string, unknown> | null;
}

export interface ContratoRevisionalUpdate {
    contato_id?: string | null;
    oportunidade_id?: string | null;
    modulo?: ModuloCalculo;
    status?: StatusContrato;
    nome_referencia?: string | null;
    origem?: string | null;
    valor_contrato?: number | null;
    data_contrato?: string | null;
    dados_step1?: Record<string, unknown> | null;
    dados_step2?: Record<string, unknown> | null;
    dados_step3?: Record<string, unknown> | null;
}
