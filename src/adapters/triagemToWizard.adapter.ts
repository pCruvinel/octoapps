/**
 * Adapter: Triagem Rápida → Cálculo Revisional (Wizard Step 1)
 * 
 * Converte dados preenchidos na Triagem Rápida para o formato
 * esperado pelo Wizard de Cálculo Completo, permitindo persistência
 * de dados ao progredir de análise prévia para análise detalhada.
 */

import type { GeralStep1Data, TipoContratoGeral } from '@/schemas/moduloGeral.schema';
import type { ImobiliarioStep1Data, TipoFinanciamentoImob, SistemaAmortizacaoImob, Indexador } from '@/schemas/moduloImobiliario.schema';

// ============================================================================
// TIPOS
// ============================================================================

/** Dados do formulário de Triagem Geral (Veículos/Empréstimos) */
export interface TriagemGeralFormData {
    valorFinanciado: number | null;
    valorPrestacao: number | null;
    prazoMeses: number | null;
    taxaAnualContrato: number | null;
    tipoContrato: string;
    dataContrato: string;
    dataLiberacao?: string;
    dataPrimeiroVencimento?: string;
    sistemaAmortizacao: 'SAC' | 'PRICE';
    capitalizacao: 'MENSAL' | 'DIARIA';
    tarifaTAC?: number | null;
    tarifaRegistro?: number | null;
    tarifaAvaliacao?: number | null;
    seguroPrestamista?: number | null;
    expurgarTAC?: boolean;
    expurgarRegistro?: boolean;
    expurgarAvaliacao?: boolean;
    expurgarSeguro?: boolean;
}

/** Dados do formulário de Triagem Imobiliário */
export interface TriagemImobiliarioFormData {
    valorFinanciado: number | null;
    valorParcela: number | null;
    prazoMeses: number | null;
    taxaAnualContrato: number | null;
    dataContrato: string;
    tipoFinanciamento: 'SFH' | 'SFI';
    sistemaAmortizacao: 'SAC' | 'PRICE' | 'SACRE';
    indexador: 'TR' | 'IPCA' | 'INPC' | 'IGPM';
    seguroMIP?: number | null;
    seguroDFI?: number | null;
    taxaAdministracao?: number | null;
}

// ============================================================================
// MAPEAMENTOS
// ============================================================================



/** Converte tipo de financiamento imobiliário */
const TIPO_IMOB_MAP: Record<'SFH' | 'SFI', TipoFinanciamentoImob> = {
    'SFH': 'FINANCIAMENTO_SFH',
    'SFI': 'FINANCIAMENTO_SFI',
};

// ============================================================================
// HELPERS
// ============================================================================

/** Converte taxa anual para mensal (capitalização composta) */
function taxaAnualParaMensal(taxaAnual: number): number {
    const taxaAnualDecimal = taxaAnual / 100;
    const taxaMensalDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;
    return taxaMensalDecimal * 100;
}

// ============================================================================
// ADAPTERS
// ============================================================================

/**
 * Converte dados da Triagem Geral para formato do Wizard Step 1
 */
export function adaptTriagemGeralToStep1(
    triagem: TriagemGeralFormData,
    options?: {
        credor?: string;
        devedor?: string;
    }
): Partial<GeralStep1Data> {
    const taxaMensal = triagem.taxaAnualContrato
        ? taxaAnualParaMensal(triagem.taxaAnualContrato)
        : 0;

    return {
        // Identificação (preenchido pelo usuário no wizard ou defaults)
        credor: options?.credor || '',
        devedor: options?.devedor || '',
        tipoContrato: (triagem.tipoContrato as TipoContratoGeral) || 'EMPRESTIMO_PESSOAL',

        // Valores
        valorFinanciado: triagem.valorFinanciado || 0,
        valorPrestacao: triagem.valorPrestacao || undefined,

        // Datas
        dataContrato: triagem.dataContrato,
        dataLiberacao: triagem.dataLiberacao || triagem.dataContrato, // Fallback
        dataPrimeiroVencimento: triagem.dataPrimeiroVencimento || '',

        // Condições
        prazoMeses: triagem.prazoMeses || 0,
        taxaMensalContrato: taxaMensal,
        taxaAnualContrato: triagem.taxaAnualContrato || 0,

        // Tarifas (estrutura do wizard)
        tarifas: {
            tac: {
                valor: triagem.tarifaTAC || 0,
                expurgar: triagem.expurgarTAC || false,
            },
            registro: {
                valor: triagem.tarifaRegistro || 0,
                expurgar: triagem.expurgarRegistro || false,
            },
            avaliacao: {
                valor: triagem.tarifaAvaliacao || 0,
                expurgar: triagem.expurgarAvaliacao || false,
            },
            seguro: {
                valor: triagem.seguroPrestamista || 0,
                expurgar: triagem.expurgarSeguro || false,
            },
        },
    };
}

/**
 * Converte dados da Triagem Imobiliário para formato do Wizard Step 1
 */
export function adaptTriagemImobiliarioToStep1(
    triagem: TriagemImobiliarioFormData,
    options?: {
        credor?: string;
        devedor?: string;
        valorBem?: number;
    }
): Partial<ImobiliarioStep1Data> {
    const taxaMensal = triagem.taxaAnualContrato
        ? taxaAnualParaMensal(triagem.taxaAnualContrato)
        : undefined;

    return {
        // Identificação
        credor: options?.credor || '',
        devedor: options?.devedor || '',
        tipoFinanciamento: TIPO_IMOB_MAP[triagem.tipoFinanciamento],

        // Valores (valorBem = valorFinanciado se não informado)
        valorBem: options?.valorBem || triagem.valorFinanciado || 0,
        valorFinanciado: triagem.valorFinanciado || 0,
        valorPrestacao: triagem.valorParcela || undefined,

        // Sistema e Indexador
        sistemaAmortizacao: triagem.sistemaAmortizacao as SistemaAmortizacaoImob,
        indexador: triagem.indexador as Indexador,

        // Datas
        dataContrato: triagem.dataContrato,
        dataLiberacao: triagem.dataContrato, // Usar data contrato como fallback
        dataPrimeiraParcela: '', // Não existe na triagem

        // Condições
        prazoMeses: triagem.prazoMeses || 0,
        taxaMensalContrato: taxaMensal,
        taxaAnualContrato: triagem.taxaAnualContrato || undefined,
    };
}

/**
 * Dados do Step 2 do Imobiliário (seguros) a partir da triagem
 */
export function adaptTriagemImobiliarioToStep2(triagem: TriagemImobiliarioFormData) {
    return {
        seguroMIP: {
            valor: triagem.seguroMIP || 0,
            tipo: 'FIXO' as const,
        },
        seguroDFI: {
            valor: triagem.seguroDFI || 0,
            tipo: 'FIXO' as const,
        },
        taxaAdministracao: triagem.taxaAdministracao || 25,
    };
}

/**
 * Cria objeto para salvar no campo dados_step1 (JSONB)
 */
export function createStep1Payload(
    modulo: 'GERAL' | 'IMOBILIARIO',
    triagemData: TriagemGeralFormData | TriagemImobiliarioFormData,
    options?: { credor?: string; devedor?: string; valorBem?: number }
): Record<string, unknown> {
    if (modulo === 'GERAL') {
        return adaptTriagemGeralToStep1(triagemData as TriagemGeralFormData, options);
    } else {
        return adaptTriagemImobiliarioToStep1(triagemData as TriagemImobiliarioFormData, options);
    }
}
