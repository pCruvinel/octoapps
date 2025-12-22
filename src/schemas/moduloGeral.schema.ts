import { z } from 'zod';
import {
    tarifasGeralSchema,
} from './sharedFields.schema';

// ============================================================================
// MÓDULO GERAL - Veículos, Empréstimos e Consignados
// Foco em parcelas fixas e identificação de capitalização diária
// ============================================================================

/**
 * Tipos específicos do Módulo Geral
 * IMPORTANTE: Estes valores são usados pela Triagem Rápida e Step1_Geral
 */
export const tipoContratoGeralEnum = z.enum([
    'EMPRESTIMO_PESSOAL',
    'CONSIGNADO_PRIVADO',
    'CONSIGNADO_PUBLICO',
    'CONSIGNADO_INSS',
    'CAPITAL_GIRO',
    'FINANCIAMENTO_VEICULO',
    'FINANCIAMENTO_VEICULO_PJ',
    'CHEQUE_ESPECIAL'
]);

/**
 * Schema para dados do contrato - Módulo Geral (Step 1)
 * Campos padronizados conforme especificação
 */
export const geralStep1Schema = z.object({
    // === IDENTIFICAÇÃO ===
    credor: z.string().min(2, 'Nome do credor deve ter pelo menos 2 caracteres'),
    devedor: z.string().min(2, 'Nome do devedor deve ter pelo menos 2 caracteres'),
    numeroContrato: z.string().optional(),
    tipoContrato: tipoContratoGeralEnum.default('EMPRESTIMO_PESSOAL'),

    // === VALORES DO FINANCIAMENTO ===
    valorBem: z.number().min(0).optional(), // Apenas para veículos
    valorEntrada: z.number().min(0).optional(), // Apenas para veículos
    valorFinanciado: z.number().min(100, 'Valor mínimo é R$ 100,00'),

    // === DATAS FUNDAMENTAIS ===
    dataContrato: z.string().min(1, 'Data do contrato é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    // Data de liberação é opcional (usada para cálculo de carência quando informada)
    dataLiberacao: z.string().optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), 'Data inválida'),

    dataPrimeiroVencimento: z.string().min(1, 'Data do primeiro vencimento é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    // === CONDIÇÕES DO CONTRATO ===
    prazoMeses: z.number()
        .min(1, 'Prazo deve ser de pelo menos 1 mês')
        .max(600, 'Prazo máximo é 600 meses'),

    // Taxas são opcionais no Step1 (podem ser preenchidas via OCR ou calculadas)
    taxaMensalContrato: z.number().min(0).optional(),
    taxaAnualContrato: z.number().min(0).optional(),

    // Valor da prestação (se informado pelo cliente)
    valorPrestacao: z.number().min(0).optional(),

    // === TARIFAS E SEGUROS (VENDA CASADA) ===
    tarifas: tarifasGeralSchema.optional(),

}).refine(
    (data) => new Date(data.dataPrimeiroVencimento) >= new Date(data.dataContrato),
    {
        message: 'Data do primeiro vencimento não pode ser anterior à data do contrato',
        path: ['dataPrimeiroVencimento'],
    }
).refine(
    (data) => !data.dataLiberacao || new Date(data.dataLiberacao) <= new Date(data.dataPrimeiroVencimento),
    {
        message: 'Data de liberação não pode ser posterior ao primeiro vencimento',
        path: ['dataLiberacao'],
    }
);

/**
 * Schema para configuração de cálculo - Módulo Geral (Step 2)
 * NOTA: Capitalização NÃO é input manual - é auto-detectada pelos cálculos
 */
export const geralStep2Schema = z.object({
    // Sistema de amortização
    sistemaAmortizacao: z.enum(['PRICE', 'GAUSS', 'SAC']).default('PRICE'),

    // Usar taxa média do Bacen como referência
    usarTaxaBacen: z.boolean().default(true),

    // Threshold para abusividade (1.5 = 50% acima)
    thresholdAbuso: z.number().min(1).max(5).default(1.5),

    // Repetição em dobro (Art. 42 CDC)
    repetirEmDobro: z.boolean().default(true),

    // Configurações de mora (para parcelas atrasadas)
    taxaMoraAnual: z.number().min(0).max(24).default(12), // 12% a.a. = 1% a.m.
    multaAtraso: z.number().min(0).max(10).default(2), // 2% de multa

    // Campo calculado - taxa média do Bacen na data
    taxaMediaBacen: z.number().optional(),
});

/**
 * Schema para controle de parcelas - Módulo Geral
 * Status, valor pago e data real do pagamento
 */
export const parcelaGeralSchema = z.object({
    numero: z.number().min(1),
    dataVencimento: z.string(),
    valorNominal: z.number().min(0),
    status: z.enum(['PAGA', 'ABERTA', 'ATRASADA', 'PARCIAL']),
    dataPagamento: z.string().optional(),
    valorPago: z.number().min(0).optional(),
});

export type TipoContratoGeral = z.infer<typeof tipoContratoGeralEnum>;
export type GeralStep1Data = z.infer<typeof geralStep1Schema>;
export type GeralStep2Data = z.infer<typeof geralStep2Schema>;
export type ParcelaGeral = z.infer<typeof parcelaGeralSchema>;
