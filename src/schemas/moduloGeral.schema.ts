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
 */
export const tipoContratoGeralEnum = z.enum([
    'EMPRESTIMO_PESSOAL',
    'CONSIGNADO_PRIVADO',
    'CONSIGNADO_PUBLICO',
    'CONSIGNADO_INSS',
    'CAPITAL_GIRO',
    'FINANCIAMENTO_VEICULO',
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
    tipoContrato: tipoContratoGeralEnum,

    // === VALORES DO FINANCIAMENTO ===
    valorBem: z.number().min(0).optional(), // Apenas para veículos
    valorEntrada: z.number().min(0).optional(), // Apenas para veículos
    valorFinanciado: z.number().min(100, 'Valor mínimo é R$ 100,00'),

    // === DATAS FUNDAMENTAIS ===
    dataContrato: z.string().min(1, 'Data do contrato é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    dataLiberacao: z.string().min(1, 'Data de liberação é obrigatória') // FUNDAMENTAL para juros de carência
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    dataPrimeiroVencimento: z.string().min(1, 'Data do primeiro vencimento é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    // === CONDIÇÕES DO CONTRATO ===
    prazoMeses: z.number()
        .min(1, 'Prazo deve ser de pelo menos 1 mês')
        .max(600, 'Prazo máximo é 600 meses'),

    taxaMensalContrato: z.number().min(0, 'Taxa não pode ser negativa'),
    taxaAnualContrato: z.number().min(0, 'Taxa não pode ser negativa'),

    // Valor da prestação (se informado pelo cliente)
    valorPrestacao: z.number().min(0).optional(),

    // === TARIFAS E SEGUROS (VENDA CASADA) ===
    // Estrutura com checkbox para expurgo
    tarifas: tarifasGeralSchema,

}).refine(
    (data) => new Date(data.dataPrimeiroVencimento) >= new Date(data.dataContrato),
    {
        message: 'Data do primeiro vencimento não pode ser anterior à data do contrato',
        path: ['dataPrimeiroVencimento'],
    }
).refine(
    (data) => new Date(data.dataLiberacao) <= new Date(data.dataPrimeiroVencimento),
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
