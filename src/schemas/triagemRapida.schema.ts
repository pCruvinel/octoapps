import { z } from 'zod';
import { tipoContratoEnum } from './sharedFields.schema';

/**
 * Schema para Triagem Rápida (Stateless)
 * Focado em validar apenas o essencial para análise de viabilidade
 */
export const triagemRapidaSchema = z.object({
    // Identificação básica
    tipoContrato: tipoContratoEnum,

    // Dados para cálculo de viabilidade
    valorFinanciado: z.number().min(100, 'Valor financiado inválido'),

    // Taxas
    taxaMensalContrato: z.number().min(0, 'Taxa mensal inválida'),
    taxaAnualContrato: z.number().min(0, 'Taxa anual inválida').optional(), // Calculada se não vier

    // Prazos
    prazoMeses: z.number().min(1, 'Prazo inválido'),

    // Data (para buscar Bacen)
    dataContrato: z.string().min(1, 'Data do contrato obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),

    // Tarifas (para estimar expurgo)
    tarifasTotal: z.number().min(0).optional().default(0),

    // Sistema
    sistemaAmortizacao: z.enum(['SAC', 'PRICE']).default('PRICE'),
});

/**
 * Resultado da Triagem (não persistido)
 */
export interface ResultadoTriagem {
    classificacao: 'VIAVEL' | 'ATENCAO' | 'INVIAVEL';
    score: number; // 0-100

    // Indicadores de Taxa
    taxaContratoAnual: number;
    taxaMercadoAnual: number;
    sobretaxaPercentual: number; // Ex: 50%
    isAbusivo: boolean; // >= 50%

    // Economia
    economiaJuros: number;
    economiaTarifas: number;
    economiaTotal: number;

    // Mensagem
    recomendacao: string;

    // ===== NOVOS CAMPOS =====

    // Comparativo de Prestações (impacto comercial)
    prestacaoOriginal?: number;      // Valor informado pelo cliente
    prestacaoRevisada?: number;      // Recalculada com taxa Bacen
    diferencaPrestacao?: number;     // Economia mensal

    // Análise de Taxas (XTIR / Cálculo Reverso)
    taxaPactuadaMensal?: number;     // Informada no contrato (% a.m.)
    taxaRealAplicada?: number;       // Descoberta via XTIR (% a.m.)
    discrepanciaTaxas?: boolean;     // Se taxa real ≠ taxa pactuada

    // Capitalização Diária
    capitalizacaoDiariaDetectada?: boolean;
    evidenciaCapitalizacao?: string; // Ex: "Taxa XTIR coincide com pactuada"

    // Carência
    diasCarencia?: number;           // Dias entre liberação e 1º vencimento
    jurosCarencia?: number;          // Valor incorporado ao saldo
    carenciaDetectada?: boolean;     // Se dias > 30
}

export type TriagemFormData = z.infer<typeof triagemRapidaSchema>;
