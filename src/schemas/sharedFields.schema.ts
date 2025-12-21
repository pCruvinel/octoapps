import { z } from 'zod';

// ============================================================================
// SCHEMA GLOBAL - Campos Compartilhados entre todos os módulos
// ============================================================================

/**
 * Validador de CPF (básico - apenas formato)
 */
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

/**
 * Validador de CNPJ (básico - apenas formato)
 */
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;

/**
 * Schema para identificação do Credor (Banco/Instituição)
 */
export const credorSchema = z.object({
    nome: z.string().min(2, 'Nome do credor deve ter pelo menos 2 caracteres'),
    cnpj: z.string().optional()
        .refine((val) => !val || cnpjRegex.test(val), 'CNPJ inválido'),
    codigoBacen: z.string().optional(), // Código do banco no Bacen (ex: 001 = BB)
});

/**
 * Schema para identificação do Devedor (Cliente)
 */
export const devedorSchema = z.object({
    nome: z.string().min(2, 'Nome do devedor deve ter pelo menos 2 caracteres'),
    cpfCnpj: z.string().min(11, 'CPF/CNPJ é obrigatório')
        .refine((val) => cpfRegex.test(val) || cnpjRegex.test(val), 'CPF ou CNPJ inválido'),
    dataNascimento: z.string().optional() // Para cálculo de seguros (MIP)
        .refine((val) => !val || !isNaN(Date.parse(val)), 'Data inválida'),
});

/**
 * Tipo/Modalidade do contrato - essencial para API Bacen
 */
export const tipoContratoEnum = z.enum([
    // Módulo Geral
    'EMPRESTIMO_PESSOAL',
    'CONSIGNADO_PRIVADO',
    'CONSIGNADO_PUBLICO',
    'CONSIGNADO_INSS',
    'CAPITAL_GIRO',
    'FINANCIAMENTO_VEICULO',
    'CHEQUE_ESPECIAL',
    // Módulo Imobiliário
    'FINANCIAMENTO_SFH',
    'FINANCIAMENTO_SFI',
    'FINANCIAMENTO_IMOBILIARIO_OUTROS',
    // Módulo Cartão
    'CARTAO_CREDITO_ROTATIVO',
    'CARTAO_CREDITO_PARCELADO',
]);

/**
 * Schema base com campos globais obrigatórios
 * Este schema deve ser estendido por cada módulo
 */
export const baseContratoSchema = z.object({
    // Identificação das partes
    credor: credorSchema,
    devedor: devedorSchema,

    // Identificação do contrato
    numeroContrato: z.string().optional(),
    tipoContrato: tipoContratoEnum,

    // Datas fundamentais
    dataContrato: z.string().min(1, 'Data do contrato é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
    dataCalculo: z.string().optional() // Data em que o cálculo está sendo feito
        .refine((val) => !val || !isNaN(Date.parse(val)), 'Data inválida'),
});

// ============================================================================
// TARIFAS E SEGUROS - Estrutura para expurgo (venda casada)
// ============================================================================

/**
 * Schema para tarifas com checkbox de expurgo
 */
export const tarifasGeralSchema = z.object({
    tac: z.object({
        valor: z.number().min(0).default(0),
        expurgar: z.boolean().default(false),
    }).default({ valor: 0, expurgar: false }),

    seguroPrestamista: z.object({
        valor: z.number().min(0).default(0),
        expurgar: z.boolean().default(false),
    }).default({ valor: 0, expurgar: false }),

    registroContrato: z.object({
        valor: z.number().min(0).default(0),
        expurgar: z.boolean().default(false),
    }).default({ valor: 0, expurgar: false }),

    avaliacaoBem: z.object({
        valor: z.number().min(0).default(0),
        expurgar: z.boolean().default(false),
    }).default({ valor: 0, expurgar: false }),
});

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export type Credor = z.infer<typeof credorSchema>;
export type Devedor = z.infer<typeof devedorSchema>;
export type TipoContrato = z.infer<typeof tipoContratoEnum>;
export type BaseContrato = z.infer<typeof baseContratoSchema>;
export type TarifasGeral = z.infer<typeof tarifasGeralSchema>;

/**
 * Mapeamento de tipo de contrato para série Bacen
 */
export const TIPO_CONTRATO_SERIE_BACEN: Record<TipoContrato, number> = {
    'EMPRESTIMO_PESSOAL': 20718,
    'CONSIGNADO_PRIVADO': 25464,
    'CONSIGNADO_PUBLICO': 25464,
    'CONSIGNADO_INSS': 25465,
    'CAPITAL_GIRO': 20724,
    'FINANCIAMENTO_VEICULO': 20716,
    'CHEQUE_ESPECIAL': 20717,
    'FINANCIAMENTO_SFH': 25477,
    'FINANCIAMENTO_SFI': 25477,
    'FINANCIAMENTO_IMOBILIARIO_OUTROS': 25477,
    'CARTAO_CREDITO_ROTATIVO': 25478,
    'CARTAO_CREDITO_PARCELADO': 25478,
};

/**
 * Labels amigáveis para tipos de contrato
 */
export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
    'EMPRESTIMO_PESSOAL': 'Empréstimo Pessoal',
    'CONSIGNADO_PRIVADO': 'Consignado Privado',
    'CONSIGNADO_PUBLICO': 'Consignado Público',
    'CONSIGNADO_INSS': 'Consignado INSS',
    'CAPITAL_GIRO': 'Capital de Giro',
    'FINANCIAMENTO_VEICULO': 'Financiamento de Veículo',
    'CHEQUE_ESPECIAL': 'Cheque Especial',
    'FINANCIAMENTO_SFH': 'Financ. Imobiliário (SFH)',
    'FINANCIAMENTO_SFI': 'Financ. Imobiliário (SFI)',
    'FINANCIAMENTO_IMOBILIARIO_OUTROS': 'Financ. Imobiliário (Outros)',
    'CARTAO_CREDITO_ROTATIVO': 'Cartão de Crédito (Rotativo)',
    'CARTAO_CREDITO_PARCELADO': 'Cartão de Crédito (Parcelado)',
};
