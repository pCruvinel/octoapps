import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Tipo para Produto/Serviço do catálogo comercial
 */
export interface ProductService {
    id: string;
    user_id: string;
    name: string;
    description?: string | null;
    default_fee_percentage?: number | null;
    active: boolean;
    ordem: number;
    created_at: string;
    updated_at: string;
}

export interface ProductServiceInsert {
    name: string;
    description?: string | null;
    default_fee_percentage?: number | null;
    active?: boolean;
    ordem?: number;
}

export interface ProductServiceUpdate {
    name?: string;
    description?: string | null;
    default_fee_percentage?: number | null;
    active?: boolean;
    ordem?: number;
}

/**
 * Hook para gerenciar catálogo de produtos/serviços comerciais
 * 
 * @example
 * const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
 * 
 * // Criar novo produto
 * await createProduct({ name: 'Revisional Veículo', default_fee_percentage: 30 });
 * 
 * // Atualizar produto
 * await updateProduct(productId, { name: 'Novo Nome' });
 */
export function useProducts() {
    const { user } = useAuth();
    const [products, setProducts] = useState<ProductService[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Carregar todos os produtos do usuário
     */
    const loadProducts = useCallback(async () => {
        if (!user) {
            setProducts([]);
            return { data: [], error: null };
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('products_services')
                .select('*')
                .eq('user_id', user.id)
                .order('ordem', { ascending: true })
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            setProducts(data || []);
            return { data: data || [], error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
            setError(errorMessage);
            console.error('[useProducts] Erro ao carregar:', err);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Carregar apenas produtos ativos
     */
    const loadActiveProducts = useCallback(async () => {
        if (!user) {
            return { data: [], error: null };
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('products_services')
                .select('*')
                .eq('user_id', user.id)
                .eq('active', true)
                .order('ordem', { ascending: true })
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            return { data: data || [], error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos ativos';
            console.error('[useProducts] Erro ao carregar ativos:', err);
            return { data: null, error: errorMessage };
        }
    }, [user]);

    /**
     * Criar novo produto
     */
    const createProduct = useCallback(async (product: ProductServiceInsert) => {
        if (!user) {
            return { data: null, error: 'Usuário não autenticado' };
        }

        try {
            setError(null);

            // Obter próxima ordem
            const maxOrdem = products.length > 0 
                ? Math.max(...products.map(p => p.ordem)) 
                : 0;

            const { data, error: insertError } = await supabase
                .from('products_services')
                .insert({
                    ...product,
                    user_id: user.id,
                    ordem: product.ordem ?? maxOrdem + 1,
                    active: product.active ?? true,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Atualizar lista local
            setProducts(prev => [...prev, data].sort((a, b) => a.ordem - b.ordem));

            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar produto';
            setError(errorMessage);
            console.error('[useProducts] Erro ao criar:', err);
            return { data: null, error: errorMessage };
        }
    }, [user, products]);

    /**
     * Atualizar produto existente
     */
    const updateProduct = useCallback(async (id: string, updates: ProductServiceUpdate) => {
        try {
            setError(null);

            const { data, error: updateError } = await supabase
                .from('products_services')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Atualizar lista local
            setProducts(prev => 
                prev.map(p => p.id === id ? data : p).sort((a, b) => a.ordem - b.ordem)
            );

            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar produto';
            setError(errorMessage);
            console.error('[useProducts] Erro ao atualizar:', err);
            return { data: null, error: errorMessage };
        }
    }, []);

    /**
     * Deletar produto (soft delete - marca como inativo)
     */
    const deleteProduct = useCallback(async (id: string, hardDelete = false) => {
        try {
            setError(null);

            if (hardDelete) {
                const { error: deleteError } = await supabase
                    .from('products_services')
                    .delete()
                    .eq('id', id);

                if (deleteError) throw deleteError;
            } else {
                const { error: updateError } = await supabase
                    .from('products_services')
                    .update({ active: false, updated_at: new Date().toISOString() })
                    .eq('id', id);

                if (updateError) throw updateError;
            }

            // Remover da lista local (ou marcar como inativo)
            if (hardDelete) {
                setProducts(prev => prev.filter(p => p.id !== id));
            } else {
                setProducts(prev => prev.map(p => 
                    p.id === id ? { ...p, active: false } : p
                ));
            }

            return { error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir produto';
            setError(errorMessage);
            console.error('[useProducts] Erro ao excluir:', err);
            return { error: errorMessage };
        }
    }, []);

    /**
     * Reordenar produtos
     */
    const reorderProducts = useCallback(async (orderedIds: string[]) => {
        try {
            setError(null);

            // Atualizar ordem de cada produto
            const updates = orderedIds.map((id, index) => ({
                id,
                ordem: index + 1,
            }));

            for (const update of updates) {
                await supabase
                    .from('products_services')
                    .update({ ordem: update.ordem })
                    .eq('id', update.id);
            }

            // Recarregar lista
            await loadProducts();

            return { error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar produtos';
            setError(errorMessage);
            console.error('[useProducts] Erro ao reordenar:', err);
            return { error: errorMessage };
        }
    }, [loadProducts]);

    /**
     * Obter produto por ID
     */
    const getProductById = useCallback((id: string) => {
        return products.find(p => p.id === id) || null;
    }, [products]);

    // Carregar produtos ao montar
    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    return {
        // Estado
        products,
        activeProducts: products.filter(p => p.active),
        loading,
        error,

        // Funções de leitura
        loadProducts,
        loadActiveProducts,
        getProductById,

        // Funções de escrita
        createProduct,
        updateProduct,
        deleteProduct,
        reorderProducts,
    };
}
