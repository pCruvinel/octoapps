// =====================================================
// TYPES: Agendamentos (Calendário)
// =====================================================

export interface Agendamento {
    id: string;
    user_id: string;
    titulo: string;
    descricao?: string | null;
    cor: string;
    data_inicio: string; // ISO string
    data_fim: string; // ISO string
    dia_inteiro: boolean;

    // Links opcionais
    contato_id?: string | null;
    contrato_id?: string | null;
    oportunidade_id?: string | null;

    // Metadata
    created_at: string;
    updated_at: string;

    // Joins (para display)
    contato?: {
        id: string;
        nome_completo: string;
    } | null;
    oportunidade?: {
        id: string;
        titulo: string;
    } | null;
}

export interface AgendamentoInsert {
    titulo: string;
    descricao?: string | null;
    cor?: string;
    data_inicio: string;
    data_fim: string;
    dia_inteiro?: boolean;
    contato_id?: string | null;
    contrato_id?: string | null;
    oportunidade_id?: string | null;
    user_id?: string; // Optional if set by hook from auth context
}

export interface AgendamentoUpdate {
    titulo?: string;
    descricao?: string | null;
    cor?: string;
    data_inicio?: string;
    data_fim?: string;
    dia_inteiro?: boolean;
    contato_id?: string | null;
    contrato_id?: string | null;
    oportunidade_id?: string | null;
}
