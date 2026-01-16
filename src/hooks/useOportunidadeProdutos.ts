import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProductService } from './useProducts';

/**
 * Tipo para relacionamento Oportunidade-Produto
 */
export interface OportunidadeProduto {
    id: string;
    oportunidade_id: string;
    produto_servico_id: string;
    created_at: string;
    produto?: ProductService;
}

/**
 * Hook para gerenciar relacionamento N:N entre oportunidades e produtos/serviços
 * Permite que uma oportunidade tenha múltiplos produtos associados
 * 
 * @example
 * const { produtos, syncProdutos, addProduto, removeProduto } = useOportunidadeProdutos(oportunidadeId);
 */
export function useOportunidadeProdutos(oportunidadeId?: string) {
    const [produtos, setProdutos] = useState<OportunidadeProduto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Carregar produtos de uma oportunidade
     */
    const loadProdutos = useCallback(async (oppId?: string) => {
        const id = oppId || oportunidadeId;
        if (!id) {
            setProdutos([]);
            return { data: [], error: null };
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('oportunidade_produtos')
                .select(`
                    *,
                    produto:products_services(*)
                `)
                .eq('oportunidade_id', id);

            if (fetchError) throw fetchError;

            setProdutos(data || []);
            return { data: data || [], error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
            setError(errorMessage);
            console.error('[useOportunidadeProdutos] Erro ao carregar:', err);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [oportunidadeId]);

    /**
     * Adicionar produto à oportunidade
     */
    const addProduto = useCallback(async (produtoId: string, oppId?: string) => {
        const id = oppId || oportunidadeId;
        if (!id) {
            return { data: null, error: 'ID da oportunidade não informado' };
        }

        try {
            setError(null);

            const { data, error: insertError } = await supabase
                .from('oportunidade_produtos')
                .insert({
                    oportunidade_id: id,
                    produto_servico_id: produtoId,
                })
                .select(`
                    *,
                    produto:products_services(*)
                `)
                .single();

            if (insertError) throw insertError;

            // Atualizar lista local
            setProdutos(prev => [...prev, data]);

            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar produto';
            setError(errorMessage);
            console.error('[useOportunidadeProdutos] Erro ao adicionar:', err);
            return { data: null, error: errorMessage };
        }
    }, [oportunidadeId]);

    /**
     * Remover produto da oportunidade
     */
    const removeProduto = useCallback(async (produtoId: string, oppId?: string) => {
        const id = oppId || oportunidadeId;
        if (!id) {
            return { error: 'ID da oportunidade não informado' };
        }

        try {
            setError(null);

            const { error: deleteError } = await supabase
                .from('oportunidade_produtos')
                .delete()
                .eq('oportunidade_id', id)
                .eq('produto_servico_id', produtoId);

            if (deleteError) throw deleteError;

            // Atualizar lista local
            setProdutos(prev => prev.filter(p => p.produto_servico_id !== produtoId));

            return { error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao remover produto';
            setError(errorMessage);
            console.error('[useOportunidadeProdutos] Erro ao remover:', err);
            return { error: errorMessage };
        }
    }, [oportunidadeId]);

    /**
     * Sincronizar lista de produtos (substitui todos)
     * Útil para formulários com multi-select
     */
    const syncProdutos = useCallback(async (produtoIds: string[], oppId?: string) => {
        const id = oppId || oportunidadeId;
        if (!id) {
            return { error: 'ID da oportunidade não informado' };
        }

        try {
            setError(null);

            // 1. Remover todos os produtos atuais
            const { error: deleteError } = await supabase
                .from('oportunidade_produtos')
                .delete()
                .eq('oportunidade_id', id);

            if (deleteError) throw deleteError;

            // 2. Se não tiver produtos novos, só limpa
            if (produtoIds.length === 0) {
                setProdutos([]);
                return { error: null };
            }

            // 3. Inserir novos produtos
            const inserts = produtoIds.map(produtoId => ({
                oportunidade_id: id,
                produto_servico_id: produtoId,
            }));

            const { data, error: insertError } = await supabase
                .from('oportunidade_produtos')
                .insert(inserts)
                .select(`
                    *,
                    produto:products_services(*)
                `);

            if (insertError) throw insertError;

            setProdutos(data || []);
            return { error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao sincronizar produtos';
            setError(errorMessage);
            console.error('[useOportunidadeProdutos] Erro ao sincronizar:', err);
            return { error: errorMessage };
        }
    }, [oportunidadeId]);

    /**
     * Obter IDs dos produtos associados
     */
    const getProdutoIds = useCallback(() => {
        return produtos.map(p => p.produto_servico_id);
    }, [produtos]);

    return {
        // Estado
        produtos,
        loading,
        error,

        // Funções
        loadProdutos,
        addProduto,
        removeProduto,
        syncProdutos,
        getProdutoIds,
    };
}
