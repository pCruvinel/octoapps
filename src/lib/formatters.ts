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
