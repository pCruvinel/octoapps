// =====================================================
// TYPES: Feriados Nacionais
// =====================================================

export interface Feriado {
    id?: string;
    data: string; // YYYY-MM-DD
    nome: string;
    tipo: string;
    ano: number;
}

export interface BrasilAPIFeriado {
    date: string;
    name: string;
    type: string;
}
