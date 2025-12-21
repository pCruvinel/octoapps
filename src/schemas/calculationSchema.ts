import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS - Cálculo Revisional v3.0
// ============================================================================

/**
 * Schema para dados do contrato (Step 1)
 */
export const contractDataSchema = z.object({
    credor: z.string()
        .min(2, 'Nome do credor deve ter pelo menos 2 caracteres')
        .max(200, 'Nome do credor muito longo'),

    devedor: z.string()
        .min(2, 'Nome do devedor deve ter pelo menos 2 caracteres')
        .max(200, 'Nome do devedor muito longo'),

    contratoNum: z.string().optional(),

    tipoContrato: z.enum([
        'PESSOAL',
        'CONSIGNADO_PRIVADO',
        'CONSIGNADO_PUBLICO',
        'CONSIGNADO_INSS',
        'CAPITAL_GIRO',
        'VEICULO',
        'CHEQUE_ESPECIAL',
        'IMOBILIARIO_SFH',
        'IMOBILIARIO_SFI',
    ]),

    valorFinanciado: z.number()
        .min(100, 'Valor mínimo é R$ 100,00')
        .max(100000000, 'Valor máximo excedido'),

    dataContrato: z.string()
        .min(1, 'Data do contrato é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    dataPrimeiroVencimento: z.string()
        .min(1, 'Data do primeiro vencimento é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    prazoMeses: z.number()
        .min(1, 'Prazo mínimo é 1 mês')
        .max(600, 'Prazo máximo é 600 meses'),
}).refine(
    (data) => new Date(data.dataPrimeiroVencimento) >= new Date(data.dataContrato),
    {
        message: 'Data do primeiro vencimento não pode ser anterior à data do contrato',
        path: ['dataPrimeiroVencimento'],
    }
);

/**
 * Schema para configuração de teses (Step 2)
 */
export const thesisConfigSchema = z.object({
    capitalizacao: z.enum(['MENSAL', 'DIARIA']),

    sistemaAmortizacao: z.enum(['PRICE', 'SAC', 'SACRE', 'GAUSS']),

    usarTaxaBacen: z.boolean(),

    thresholdAbuso: z.number()
        .min(1, 'Threshold mínimo é 1x')
        .max(5, 'Threshold máximo é 5x'),

    taxaMensalContrato: z.number()
        .min(0, 'Taxa não pode ser negativa')
        .max(50, 'Taxa máxima é 50% a.m.'),

    taxaAnualContrato: z.number()
        .min(0, 'Taxa não pode ser negativa')
        .max(500, 'Taxa máxima é 500% a.a.'),

    repetirEmDobro: z.boolean(),
});

/**
 * Schema para tarifa a ser expurgada
 */
export const tarifaSchema = z.object({
    nome: z.string().min(1, 'Nome da tarifa é obrigatório'),
    valor: z.number().min(0, 'Valor deve ser positivo'),
    expurgar: z.boolean(),
});

/**
 * Schema para revisão de tarifas (Step 3)
 */
export const reviewConfigSchema = z.object({
    tarifas: z.array(tarifaSchema),

    multaPercent: z.number()
        .min(0, 'Multa não pode ser negativa')
        .max(10, 'Multa máxima é 10%'),

    moraPercent: z.number()
        .min(0, 'Mora não pode ser negativa')
        .max(10, 'Mora máxima é 10%'),

    baseMulta: z.enum(['PRINCIPAL', 'PARCELA_TOTAL']),

    observacoes: z.string().optional(),
});

/**
 * Schema completo do wizard
 */
export const calculationWizardSchema = z.object({
    step1: contractDataSchema,
    step2: thesisConfigSchema,
    step3: reviewConfigSchema,
});

/**
 * Schema para linha de pagamento no grid de conciliação
 */
export const paymentRowSchema = z.object({
    n: z.number().min(1),
    vencimento: z.string(),
    valorContrato: z.number().min(0),
    dataPagamentoReal: z.string(),
    valorPagoReal: z.number().min(0),
    amortizacaoExtra: z.number().min(0),
    status: z.enum(['PAGO', 'EM_ABERTO', 'RENEGOCIADO', 'ATRASO']),
    isEdited: z.boolean(),
});

/**
 * Schema para request de cálculo (conforme contrato JSON do plano)
 */
export const calculationRequestSchema = z.object({
    module: z.enum(['EMPRESTIMO', 'IMOBILIARIO', 'CARTAO_RMC']),
    creditor: z.string(),
    debtor: z.string(),
    contract_number: z.string().optional(),
    amount_financed: z.number().positive(),
    contract_date: z.string(),
    first_payment_date: z.string(),
    term_months: z.number().positive().max(600),
    contract_rate_monthly: z.number(),
    contract_rate_yearly: z.number(),
    capitalization_mode: z.enum(['MONTHLY', 'DAILY']),
    amortization_method: z.enum(['PRICE', 'SAC', 'SACRE', 'GAUSS']),
    use_bacen_average: z.boolean(),
    abuse_threshold: z.number().default(1.5),
    default_fine_percent: z.number().default(2.0),
    default_interest_percent: z.number().default(1.0),
    default_fine_base: z.enum(['PRINCIPAL', 'TOTAL_INSTALLMENT']),
    specific_data: z.record(z.unknown()).optional(),
    payment_reconciliation: z.array(z.object({
        n: z.number(),
        paid_date: z.string(),
        paid_value: z.number(),
        extra_amortization: z.number().default(0),
    })).optional(),
});

// Type exports
export type ContractData = z.infer<typeof contractDataSchema>;
export type ThesisConfig = z.infer<typeof thesisConfigSchema>;
export type Tarifa = z.infer<typeof tarifaSchema>;
export type ReviewConfig = z.infer<typeof reviewConfigSchema>;
export type CalculationWizardData = z.infer<typeof calculationWizardSchema>;
export type PaymentRow = z.infer<typeof paymentRowSchema>;
export type CalculationRequest = z.infer<typeof calculationRequestSchema>;
