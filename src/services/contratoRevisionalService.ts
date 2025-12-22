'use client';

import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/lib/database.types';

// Types derived from database
type ContratoRevisional = Database['public']['Tables']['contratos_revisionais']['Row'];
type ContratoRevisionalInsert = Database['public']['Tables']['contratos_revisionais']['Insert'];
type ContratoRevisionalUpdate = Database['public']['Tables']['contratos_revisionais']['Update'];
type ResultadoAnalisePreviaInsert = Database['public']['Tables']['resultado_analise_previa']['Insert'];
type ModuloCalculo = Database['public']['Enums']['modulo_calculo'];
type StatusContrato = Database['public']['Enums']['status_contrato'];
type ClassificacaoViabilidade = Database['public']['Enums']['classificacao_viabilidade'];

// Extended type with resultado
export interface ContratoWithResultado extends ContratoRevisional {
    resultado_analise_previa?: Database['public']['Tables']['resultado_analise_previa']['Row'] | null;
}

/**
 * Serviço para gerenciar contratos revisionais e análises prévias
 */
export const contratoRevisionalService = {
    /**
     * Cria um novo contrato em status RASCUNHO
     */
    async create(
        modulo: ModuloCalculo,
        userId: string,
        options?: {
            origem?: 'TRIAGEM' | 'OCR' | 'MANUAL' | 'MIGRATED';
            leadNome?: string;
            valorContrato?: number;
            dataContrato?: string;
        }
    ): Promise<{ data: ContratoRevisional | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('contratos_revisionais')
            .insert({
                user_id: userId,
                modulo,
                status: 'RASCUNHO',
                origem: options?.origem || 'TRIAGEM',
                lead_nome: options?.leadNome,
                valor_contrato: options?.valorContrato,
                data_contrato: options?.dataContrato,
            })
            .select()
            .single();

        return { data, error: error as Error | null };
    },

    /**
     * Salva dados do Step 1 e atualiza status
     * @param keepDraftStatus Se true, mantém status RASCUNHO em vez de ANALISE_PREVIA
     */
    async saveStep1(
        contratoId: string,
        step1Data: Record<string, unknown>,
        nomeReferencia?: string,
        keepDraftStatus?: boolean
    ): Promise<{ data: ContratoRevisional | null; error: Error | null }> {
        const updateData: ContratoRevisionalUpdate = {
            dados_step1: step1Data as unknown as Json,
            status: keepDraftStatus ? 'RASCUNHO' : 'ANALISE_PREVIA',
        };

        if (nomeReferencia) {
            updateData.nome_referencia = nomeReferencia;
        }

        const { data, error } = await supabase
            .from('contratos_revisionais')
            .update(updateData)
            .eq('id', contratoId)
            .select()
            .single();

        return { data, error: error as Error | null };
    },

    /**
     * Salva resultado da análise prévia (com versionamento)
     * Desativa versão anterior se existir e cria nova versão
     */
    async saveResultadoAnalisePrevia(
        contratoId: string,
        resultado: {
            taxaContrato: number;
            taxaMediaBacen: number;
            sobretaxaPercentual: number;
            economiaEstimada: number;
            novaParcelaEstimada?: number;
            classificacao: ClassificacaoViabilidade;
            detalhesCalculo?: Record<string, unknown>;
        }
    ): Promise<{ error: Error | null }> {
        // Desativar versão anterior
        await supabase
            .from('resultado_analise_previa')
            .update({ is_current: false })
            .eq('contrato_id', contratoId)
            .eq('is_current', true);

        // Calcular próxima versão
        const { data: prev } = await supabase
            .from('resultado_analise_previa')
            .select('versao')
            .eq('contrato_id', contratoId)
            .order('versao', { ascending: false })
            .limit(1);

        const nextVersion = (prev?.[0]?.versao || 0) + 1;

        const insertData: ResultadoAnalisePreviaInsert = {
            contrato_id: contratoId,
            taxa_contrato: resultado.taxaContrato,
            taxa_media_bacen: resultado.taxaMediaBacen,
            sobretaxa_percentual: resultado.sobretaxaPercentual,
            economia_estimada: resultado.economiaEstimada,
            nova_parcela_estimada: resultado.novaParcelaEstimada,
            classificacao: resultado.classificacao,
            detalhes_calculo: resultado.detalhesCalculo as unknown as Json,
            is_current: true,
            versao: nextVersion,
        };

        const { error } = await supabase
            .from('resultado_analise_previa')
            .insert(insertData);

        return { error: error as Error | null };
    },

    /**
     * Atualiza Step 2 e/ou Step 3
     */
    async updateSteps(
        contratoId: string,
        updates: { step2?: Record<string, unknown>; step3?: Record<string, unknown> }
    ): Promise<{ error: Error | null }> {
        const updateData: ContratoRevisionalUpdate = {};

        if (updates.step2) {
            updateData.dados_step2 = updates.step2 as unknown as Json;
        }
        if (updates.step3) {
            updateData.dados_step3 = updates.step3 as unknown as Json;
        }

        const { error } = await supabase
            .from('contratos_revisionais')
            .update(updateData)
            .eq('id', contratoId);

        return { error: error as Error | null };
    },

    /**
     * Finaliza contrato como ANALISE_DETALHADA
     */
    async finalize(
        contratoId: string,
        step2Data: Record<string, unknown>,
        step3Data: Record<string, unknown>
    ): Promise<{ data: ContratoRevisional | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('contratos_revisionais')
            .update({
                dados_step2: step2Data as unknown as Json,
                dados_step3: step3Data as unknown as Json,
                status: 'ANALISE_DETALHADA',
            })
            .eq('id', contratoId)
            .select()
            .single();

        return { data, error: error as Error | null };
    },

    /**
     * Lista contratos pendentes (RASCUNHO ou ANALISE_PREVIA)
     */
    async listPending(userId: string): Promise<{ data: ContratoWithResultado[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('contratos_revisionais')
            .select('*, resultado_analise_previa(*)')
            .eq('user_id', userId)
            .in('status', ['RASCUNHO', 'ANALISE_PREVIA'])
            .order('updated_at', { ascending: false });

        return { data: data as ContratoWithResultado[] | null, error: error as Error | null };
    },

    /**
     * Lista todos os contratos do usuário
     */
    async listAll(userId: string): Promise<{ data: ContratoWithResultado[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('contratos_revisionais')
            .select('*, resultado_analise_previa(*)')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        return { data: data as ContratoWithResultado[] | null, error: error as Error | null };
    },

    /**
     * Lista contratos com paginação e filtros server-side
     * Otimizado para não carregar JSONs pesados
     */
    async listWithPagination(
        userId: string,
        options: {
            page?: number;
            pageSize?: number;
            status?: StatusContrato | 'TODOS';
            search?: string;
            orderBy?: 'updated_at' | 'created_at' | 'nome_referencia';
            orderDirection?: 'asc' | 'desc';
        } = {}
    ): Promise<{
        data: ContratoWithResultado[] | null;
        count: number;
        error: Error | null;
    }> {
        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const offset = (page - 1) * pageSize;
        const orderBy = options.orderBy || 'updated_at';
        const orderDirection = options.orderDirection || 'desc';

        // Build query - select only lightweight columns
        let query = supabase
            .from('contratos_revisionais')
            .select(`
                id,
                user_id,
                modulo,
                status,
                nome_referencia,
                created_at,
                updated_at,
                resultado_analise_previa (
                    economia_estimada,
                    classificacao
                )
            `, { count: 'exact' })
            .eq('user_id', userId);

        // Apply status filter
        if (options.status && options.status !== 'TODOS') {
            query = query.eq('status', options.status);
        }

        // Apply search filter (ilike for case-insensitive)
        if (options.search && options.search.trim()) {
            query = query.ilike('nome_referencia', `%${options.search.trim()}%`);
        }

        // Apply ordering and pagination
        const { data, count, error } = await query
            .order(orderBy, { ascending: orderDirection === 'asc' })
            .range(offset, offset + pageSize - 1);

        return {
            data: data as ContratoWithResultado[] | null,
            count: count || 0,
            error: error as Error | null,
        };
    },

    /**
     * Busca contrato por ID
     */
    async getById(contratoId: string): Promise<{ data: ContratoWithResultado | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('contratos_revisionais')
            .select('*, resultado_analise_previa(*)')
            .eq('id', contratoId)
            .single();

        return { data: data as ContratoWithResultado | null, error: error as Error | null };
    },

    /**
     * Arquiva um contrato
     */
    async archive(contratoId: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('contratos_revisionais')
            .update({ status: 'ARQUIVADO' })
            .eq('id', contratoId);

        return { error: error as Error | null };
    },

    /**
     * Deleta um contrato
     */
    async delete(contratoId: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('contratos_revisionais')
            .delete()
            .eq('id', contratoId);

        return { error: error as Error | null };
    },
};

export type { ContratoRevisional, ModuloCalculo, StatusContrato, ClassificacaoViabilidade };
