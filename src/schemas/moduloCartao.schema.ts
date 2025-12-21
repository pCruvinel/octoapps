import { z } from 'zod';
import { credorSchema, devedorSchema } from './sharedFields.schema';

// ============================================================================
// MÓDULO CARTÃO DE CRÉDITO
// Módulo com maior densidade de dados - reconstrução fatura a fatura
// ============================================================================

/**
 * Tipos de operação de cartão
 */
export const tipoCartaoEnum = z.enum([
    'CARTAO_CREDITO_ROTATIVO',
    'CARTAO_CREDITO_PARCELADO',
]);

/**
 * Schema para uma fatura individual
 * Reconstrução dos valores mês a mês
 */
export const faturaSchema = z.object({
    // Identificação da fatura
    mesReferencia: z.string().min(1), // YYYY-MM format
    dataVencimento: z.string().min(1),

    // === VALORES PRINCIPAIS ===
    saldoAnterior: z.number().min(0).default(0),
    totalFatura: z.number().min(0),
    pagamentoRealizado: z.number().min(0).default(0),
    novasCompras: z.number().min(0).default(0),

    // === ENCARGOS COBRADOS ===
    encargos: z.object({
        jurosRotativo: z.number().min(0).default(0),
        jurosMora: z.number().min(0).default(0),
        multa: z.number().min(0).default(0),
    }).default({ jurosRotativo: 0, jurosMora: 0, multa: 0 }),

    // === ENCARGOS ADICIONAIS ===
    encargosAdicionais: z.object({
        iof: z.number().min(0).default(0),
        anuidade: z.number().min(0).default(0),
        segurosFatura: z.number().min(0).default(0),
        parcelamentoFatura: z.number().min(0).default(0),
        renegociacao: z.number().min(0).default(0),
    }).default({ iof: 0, anuidade: 0, segurosFatura: 0, parcelamentoFatura: 0, renegociacao: 0 }),

    // === AJUSTES (ESTORNOS) ===
    estornos: z.number().min(0).default(0), // Valores negativos/correções

    // === SALDO FINAL ===
    saldoFinal: z.number().min(0).default(0), // Calculado ou informado
});

/**
 * Schema para dados do cartão - Módulo Cartão (Step 1)
 * Campos padronizados conforme especificação
 * 
 * NOTA: Campos NÃO necessários (removidos):
 * - Bandeira do cartão
 * - Limite de crédito
 * - Data de abertura da conta
 * - Periodicidade da capitalização (sempre diária em cartões)
 */
export const cartaoStep1Schema = z.object({
    // === IDENTIFICAÇÃO (Campos Globais Padronizados) ===
    credor: credorSchema,
    devedor: devedorSchema,
    numeroContrato: z.string().optional(), // Número do cartão parcial ou contrato
    tipoCartao: tipoCartaoEnum,

    // === DATA DE INÍCIO DO PROBLEMA ===
    dataInicioProblema: z.string().min(1, 'Data de início é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    // === LISTA DE FATURAS ===
    faturas: z.array(faturaSchema).min(1, 'Pelo menos uma fatura é necessária'),
});

/**
 * Schema para configuração de cálculo - Módulo Cartão (Step 2)
 */
export const cartaoStep2Schema = z.object({
    // Usar taxa média do Bacen como referência
    usarTaxaBacen: z.boolean().default(true),

    // Threshold para abusividade (1.5 = 50% acima)
    thresholdAbuso: z.number().min(1).max(5).default(1.5),

    // Repetição em dobro (Art. 42 CDC)
    repetirEmDobro: z.boolean().default(true),

    // Índice de correção monetária
    indiceCorrecao: z.enum(['INPC', 'IPCA', 'IGPM', 'SELIC']).default('INPC'),

    // Campo calculado
    taxaMediaBacenRotativo: z.number().optional(),
});

/**
 * Função auxiliar para calcular totais de uma lista de faturas
 */
export const calcularTotaisFaturas = (faturas: z.infer<typeof faturaSchema>[]) => {
    return faturas.reduce((acc, fatura) => {
        const encargos = fatura.encargos;
        const adicional = fatura.encargosAdicionais;

        return {
            totalPago: acc.totalPago + fatura.pagamentoRealizado,
            totalCompras: acc.totalCompras + fatura.novasCompras,
            totalJurosRotativo: acc.totalJurosRotativo + encargos.jurosRotativo,
            totalJurosMora: acc.totalJurosMora + encargos.jurosMora,
            totalMultas: acc.totalMultas + encargos.multa,
            totalIOF: acc.totalIOF + adicional.iof,
            totalAnuidade: acc.totalAnuidade + adicional.anuidade,
            totalSeguros: acc.totalSeguros + adicional.segurosFatura,
            totalEstornos: acc.totalEstornos + fatura.estornos,
        };
    }, {
        totalPago: 0,
        totalCompras: 0,
        totalJurosRotativo: 0,
        totalJurosMora: 0,
        totalMultas: 0,
        totalIOF: 0,
        totalAnuidade: 0,
        totalSeguros: 0,
        totalEstornos: 0,
    });
};

export type TipoCartao = z.infer<typeof tipoCartaoEnum>;
export type Fatura = z.infer<typeof faturaSchema>;
export type CartaoStep1Data = z.infer<typeof cartaoStep1Schema>;
export type CartaoStep2Data = z.infer<typeof cartaoStep2Schema>;
