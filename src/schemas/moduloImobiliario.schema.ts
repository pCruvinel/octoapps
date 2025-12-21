import { z } from 'zod';

// ============================================================================
// MÓDULO IMOBILIÁRIO - SFH/SFI
// Maior detalhamento: correção monetária e seguros específicos
// ============================================================================

/**
 * Tipos de financiamento imobiliário
 */
export const tipoFinanciamentoImobEnum = z.enum([
    'FINANCIAMENTO_SFH',
    'FINANCIAMENTO_SFI',
    'FINANCIAMENTO_IMOBILIARIO_OUTROS',
]);

/**
 * Sistema de amortização imobiliário
 */
export const sistemaAmortizacaoImobEnum = z.enum(['SAC', 'PRICE', 'SACRE']);

/**
 * Indexador de correção monetária
 */
export const indexadorEnum = z.enum(['TR', 'IPCA', 'INPC', 'IGPM']);

/**
 * Schema para dados do contrato - Módulo Imobiliário (Step 1)
 * Campos padronizados conforme especificação
 */
export const imobiliarioStep1Schema = z.object({
    // === IDENTIFICAÇÃO ===
    credor: z.string().min(2, 'Nome do credor deve ter pelo menos 2 caracteres'),
    devedor: z.string().min(2, 'Nome do devedor deve ter pelo menos 2 caracteres'),
    contratoNum: z.string().optional(),
    tipoFinanciamento: tipoFinanciamentoImobEnum.default('FINANCIAMENTO_SFH'),

    // === VALORES DO IMÓVEL ===
    valorBem: z.number().min(10000, 'Valor do imóvel inválido'),
    valorAvaliacao: z.number().min(0).optional(),

    // Entrada e FGTS
    valorEntrada: z.number().min(0).default(0),
    usouFGTS: z.boolean().default(false),
    valorFGTS: z.number().min(0).optional(),

    // Valor efetivamente financiado
    valorFinanciado: z.number().min(1000, 'Valor financiado muito baixo'),

    // === SISTEMA E INDEXADOR ===
    sistemaAmortizacao: sistemaAmortizacaoImobEnum,
    indexador: indexadorEnum,

    // === DATAS ===
    dataContrato: z.string().min(1, 'Data do contrato é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    dataLiberacao: z.string().min(1, 'Data de liberação é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    dataPrimeiraParcela: z.string().min(1, 'Data da primeira parcela é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    // === PRAZO ===
    prazoMeses: z.number()
        .min(12, 'Prazo mínimo 12 meses')
        .max(420, 'Prazo máximo 420 meses'), // 35 anos

    // === TAXAS DO CONTRATO ===
    taxaMensalContrato: z.number().min(0).optional(),
    taxaAnualContrato: z.number().min(0).optional(),

    // Valor da prestação atual (se informado)
    valorPrestacao: z.number().min(0).optional(),

}).refine((data) => {
    // Validação de LTV (Loan To Value)
    return data.valorFinanciado <= data.valorBem * 1.1;
}, {
    message: 'Valor financiado suspeito (>110% do valor do imóvel)',
    path: ['valorFinanciado']
});

/**
 * Schema para seguros habitacionais - Módulo Imobiliário (Step 2)
 * Seguros MIP e DFI obrigatórios
 * 
 * NOTA: Tarifas típicas de veículos (TAC, registro) NÃO aplicáveis aqui
 */
export const imobiliarioStep2Schema = z.object({
    // === TAXAS DE JUROS ===
    taxaJurosMensal: z.number().min(0, 'Taxa não pode ser negativa'),
    taxaJurosNominal: z.number().min(0, 'Taxa não pode ser negativa'),
    taxaCET: z.number().min(0).optional(), // Custo Efetivo Total

    // === SEGUROS HABITACIONAIS OBRIGATÓRIOS ===
    seguroMIP: z.object({
        valor: z.number().min(0).default(0), // Morte e Invalidez Permanente
        tipo: z.enum(['FIXO', 'PERCENTUAL_SALDO']),
        percentual: z.number().min(0).max(5).optional(), // % sobre saldo se tipo = PERCENTUAL
    }).default({ valor: 0, tipo: 'PERCENTUAL_SALDO' }),

    seguroDFI: z.object({
        valor: z.number().min(0).default(0), // Danos Físicos ao Imóvel
        tipo: z.enum(['FIXO', 'PERCENTUAL_IMOVEL']),
        percentual: z.number().min(0).max(2).optional(), // % sobre valor imóvel
    }).default({ valor: 0, tipo: 'PERCENTUAL_IMOVEL' }),

    // === TAXA ADMINISTRATIVA ===
    taxaAdministracao: z.number().min(0).default(25), // Comumente R$ 25,00

    // === CONFIGURAÇÕES DE CÁLCULO ===
    usarTaxaBacen: z.boolean().default(true),
    repetirEmDobro: z.boolean().default(true),

    // Campo calculado
    taxaMediaBacen: z.number().optional(),
});

/**
 * Data de nascimento do devedor - usada para cálculo do MIP
 * O MIP aumenta conforme idade do proponente
 */
export const calcularTaxaMIP = (dataNascimento: string, valorFinanciado: number): number => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    const idade = Math.floor((hoje.getTime() - nascimento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Tabela simplificada de MIP por faixa etária (valores aproximados)
    // Normalmente varia de 0.02% a 0.15% sobre saldo devedor
    let taxaMIP = 0.0002; // 0.02% base

    if (idade >= 30) taxaMIP = 0.0003;
    if (idade >= 40) taxaMIP = 0.0005;
    if (idade >= 50) taxaMIP = 0.0008;
    if (idade >= 60) taxaMIP = 0.0012;
    if (idade >= 65) taxaMIP = 0.0015;

    return valorFinanciado * taxaMIP;
};

export type TipoFinanciamentoImob = z.infer<typeof tipoFinanciamentoImobEnum>;
export type SistemaAmortizacaoImob = z.infer<typeof sistemaAmortizacaoImobEnum>;
export type Indexador = z.infer<typeof indexadorEnum>;
export type ImobiliarioStep1Data = z.infer<typeof imobiliarioStep1Schema>;
export type ImobiliarioStep2Data = z.infer<typeof imobiliarioStep2Schema>;
