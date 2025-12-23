
export interface ActivityLog {
    id: string;
    acao: string;
    entidade: string;
    entidade_id: string;
    dados_anteriores: any;
    dados_novos: any;
    user_id: string;
    data_criacao: string;
    users?: { email: string };
    profiles?: { nome_completo: string; email: string };
}
