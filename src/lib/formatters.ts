/**
 * Formatadores comuns para a aplicação
 */

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export const formatPercent = (value: number | undefined) => {
    if (value === undefined) return '-';
    // Se o valor for decimal (ex: 0.02), multiplica por 100. Se já for percentual (ex: 2), mantém.
    // Aqui assumimos que o input pode variar, mas geralmente tratamos taxas como percentual direto na UI
    // ou decimal em cálculos. Ajuste conforme padrão do projeto.

    // Padrão do projeto parece ser armazenar 2.5 para 2.5% em alguns lugares e 0.025 em outros.
    // O formatador deve ser agnóstico ou receber flag.
    // Assumindo que taxaContratoAnual vem como decimal (ex: 0.5 para 50%) da TriagemRapida.

    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

/**
 * Formata número de telefone brasileiro
 * Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export const formatPhone = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica máscara
    if (limited.length <= 2) {
        return `(${limited}`;
    } else if (limited.length <= 6) {
        return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 10) {
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    } else {
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
};

/**
 * Formata CPF brasileiro
 * Formato: XXX.XXX.XXX-XX
 */
export const formatCpf = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica máscara
    if (limited.length <= 3) {
        return limited;
    } else if (limited.length <= 6) {
        return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    } else if (limited.length <= 9) {
        return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    } else {
        return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
    }
};

