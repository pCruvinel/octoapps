import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Tipo para Categoria de Serviço
 */
export interface ServiceCategory {
    id: string;
    user_id: string;
    name: string;
    color?: string | null;
    active: boolean;
    ordem: number;
    created_at: string;
    updated_at: string;
}

export interface ServiceCategoryInsert {
    name: string;
    color?: string | null;
    active?: boolean;
    ordem?: number;
}

export interface ServiceCategoryUpdate {
    name?: string;
    color?: string | null;
    active?: boolean;
    ordem?: number;
}

/**
 * Hook para gerenciar categorias de serviços
 */
export function useServiceCategories() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Carregar todas as categorias do usuário
     */
    const loadCategories = useCallback(async () => {
        if (!user) {
            setCategories([]);
            return { data: [], error: null };
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('service_categories')
                .select('*')
                .eq('user_id', user.id)
                .order('ordem', { ascending: true })
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            setCategories((data as ServiceCategory[]) || []);
            return { data: data || [], error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias';
            setError(errorMessage);
            console.error('[useServiceCategories] Erro ao carregar:', err);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Criar nova categoria
     */
    const createCategory = useCallback(async (category: ServiceCategoryInsert) => {
        if (!user) {
            return { data: null, error: 'Usuário não autenticado' };
        }

        try {
            setError(null);

            const maxOrdem = categories.length > 0 
                ? Math.max(...categories.map(c => c.ordem)) 
                : 0;

            const { data, error: insertError } = await supabase
                .from('service_categories')
                .insert({
                    ...category,
                    user_id: user.id,
                    ordem: category.ordem ?? maxOrdem + 1,
                    active: category.active ?? true,
                } as any)
                .select()
                .single();

            if (insertError) throw insertError;

            setCategories(prev => [...prev, data as ServiceCategory].sort((a, b) => a.ordem - b.ordem));

            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria';
            setError(errorMessage);
            console.error('[useServiceCategories] Erro ao criar:', err);
            return { data: null, error: errorMessage };
        }
    }, [user, categories]);

    /**
     * Atualizar categoria existente
     */
    const updateCategory = useCallback(async (id: string, updates: ServiceCategoryUpdate) => {
        try {
            setError(null);

            const { data, error: updateError } = await supabase
                .from('service_categories')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                } as any)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            setCategories(prev => 
                prev.map(c => c.id === id ? data as ServiceCategory : c).sort((a, b) => a.ordem - b.ordem)
            );

            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria';
            setError(errorMessage);
            console.error('[useServiceCategories] Erro ao atualizar:', err);
            return { data: null, error: errorMessage };
        }
    }, []);

    /**
     * Deletar categoria
     */
    const deleteCategory = useCallback(async (id: string) => {
        try {
            setError(null);

            const { error: deleteError } = await supabase
                .from('service_categories')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setCategories(prev => prev.filter(c => c.id !== id));

            return { error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir categoria';
            setError(errorMessage);
            console.error('[useServiceCategories] Erro ao excluir:', err);
            return { error: errorMessage };
        }
    }, []);

    /**
     * Obter categoria por ID
     */
    const getCategoryById = useCallback((id: string) => {
        return categories.find(c => c.id === id) || null;
    }, [categories]);

    // Carregar categorias ao montar
    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    return {
        categories,
        activeCategories: categories.filter(c => c.active),
        loading,
        error,
        loadCategories,
        getCategoryById,
        createCategory,
        updateCategory,
        deleteCategory,
    };
}
