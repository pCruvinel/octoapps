import { z } from 'zod';

/**
 * Schema para registro de pagamento individual
 */
export const pagamentoSchema = z.object({
    parcela: z.number().min(1),
    dataVencimento: z.string(),
    valorDevido: z.number().min(0),
    status: z.enum(['PAGA', 'ABERTA', 'ATRASADA', 'PARCIAL']),
    dataPagamento: z.string().optional(),
    valorPago: z.number().min(0).optional(),
    diasAtraso: z.number().min(0).optional(),
    jurosMora: z.number().min(0).optional(),
    multa: z.number().min(0).optional(),
});

/**
 * Schema para histórico de pagamentos completo
 */
export const historicoPagamentosSchema = z.object({
    contratoId: z.string().optional(),

    // Resumo
    totalParcelas: z.number().min(1),
    parcelasPagas: z.number().min(0),
    parcelasEmAberto: z.number().min(0),
    parcelasAtrasadas: z.number().min(0),

    // Totais
    totalPago: z.number().min(0),
    totalDevido: z.number().min(0),
    totalJurosMora: z.number().min(0),
    totalMultas: z.number().min(0),

    // Lista de pagamentos
    pagamentos: z.array(pagamentoSchema),
});

/**
 * Schema para configuração de cálculo pericial
 */
export const calculoPericialSchema = z.object({
    // Indébito
    usarCorrecaoMonetaria: z.boolean().default(true),
    indiceCorrecao: z.enum(['INPC', 'IPCA', 'IGPM', 'TR', 'SELIC']).default('INPC'),

    // Restituição
    repetirEmDobro: z.boolean().default(true),  // Art. 42 CDC

    // Juros de mora
    taxaMoraAnual: z.number().min(0).max(24).default(12),
    multaAtraso: z.number().min(0).max(10).default(2),

    // Tarifas expurgadas
    expurgarTAC: z.boolean().default(false),
    expurgarSeguro: z.boolean().default(false),
    expurgarRegistro: z.boolean().default(false),
    expurgarAvaliacao: z.boolean().default(false),
});

export type Pagamento = z.infer<typeof pagamentoSchema>;
export type HistoricoPagamentos = z.infer<typeof historicoPagamentosSchema>;
export type CalculoPericial = z.infer<typeof calculoPericialSchema>;
