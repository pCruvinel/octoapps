import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { EventCategory } from '../types/task';

/**
 * Interface para inserção de categoria
 */
export interface EventCategoryInsert {
  name: string;
  description?: string | null;
  color: string;
  icon?: string;
  is_all_day?: boolean;
  default_duration_minutes?: number;
  ordem?: number;
}

/**
 * Interface para atualização de categoria
 */
export interface EventCategoryUpdate {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
  is_all_day?: boolean;
  default_duration_minutes?: number;
  ordem?: number;
  ativo?: boolean;
}

/**
 * Paleta de cores permitidas para categorias
 */
export const CATEGORY_COLORS = [
  { name: 'Marinho',   value: '#1e3a8a', tailwind: 'blue-900' },
  { name: 'Azul',      value: '#3b82f6', tailwind: 'blue-500' },
  { name: 'Índigo',    value: '#6366f1', tailwind: 'indigo-500' },
  { name: 'Roxo',      value: '#8b5cf6', tailwind: 'violet-500' },
  { name: 'Rosa',      value: '#ec4899', tailwind: 'pink-500' },
  { name: 'Vermelho',  value: '#ef4444', tailwind: 'red-500' },
  { name: 'Laranja',   value: '#f97316', tailwind: 'orange-500' },
  { name: 'Amarelo',   value: '#eab308', tailwind: 'yellow-500' },
  { name: 'Verde',     value: '#22c55e', tailwind: 'green-500' },
  { name: 'Teal',      value: '#14b8a6', tailwind: 'teal-500' },
  { name: 'Cyan',      value: '#06b6d4', tailwind: 'cyan-500' },
  { name: 'Cinza',     value: '#6b7280', tailwind: 'gray-500' },
] as const;

/**
 * Ícones disponíveis para categorias (Lucide)
 */
export const CATEGORY_ICONS = [
  'calendar',
  'check-square',
  'phone-forwarded',
  'users',
  'gavel',
  'clock',
  'phone',
  'mail',
  'file-text',
  'briefcase',
  'star',
  'flag',
  'bell',
  'target',
  'zap',
] as const;

/**
 * Hook para gerenciar categorias de eventos
 */
export function useEventCategories() {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar todas as categorias
   */
  /**
   * Carregar todas as categorias da organização
   */
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [], error: 'Usuário não autenticado' };

      // Buscar apenas categorias da organização
      const { data, error: fetchError } = await supabase
        .from('event_categories')
        .select('*')
        .eq('organization_id', user.id)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (fetchError) throw fetchError;

      // Se não houver categorias, inicializar com padrões e recarregar
      if (!data || data.length === 0) {
        console.log('Inicializando categorias padrão...');
        const { error: rpcError } = await supabase.rpc('initialize_organization_categories' as any);
        if (rpcError) throw rpcError;

        // Recarregar
        return loadCategories();
      }

      setCategories((data || []) as unknown as EventCategory[]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias';
      setError(errorMessage);
      console.error('Erro ao carregar categorias:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar categoria por ID
   */
  const getCategoryById = useCallback(async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('event_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar categoria';
      console.error('Erro ao buscar categoria:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  /**
   * Buscar categoria padrão (Tarefa)
   */
  const getDefaultCategory = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('event_categories')
        .select('*')
        .eq('name', 'Tarefa')
        .eq('is_system', true)
        .single();

      if (fetchError) throw fetchError;
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar categoria padrão';
      console.error('Erro ao buscar categoria padrão:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  /**
   * Criar nova categoria
   */
  const createCategory = useCallback(async (category: EventCategoryInsert) => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar maior ordem atual
      const { data: maxOrdem } = await supabase
        .from('event_categories')
        .select('ordem')
        .order('ordem', { ascending: false })
        .limit(1)
        .single();

      const { data, error: insertError } = await supabase
        .from('event_categories')
        .insert({
          ...category,
          organization_id: user.id,
          ordem: category.ordem ?? ((maxOrdem?.ordem ?? 0) + 1),
          is_system: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setCategories(prev => [...prev, data as unknown as EventCategory]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria';
      setError(errorMessage);
      console.error('Erro ao criar categoria:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  /**
   * Atualizar categoria existente
   */
  const updateCategory = useCallback(async (id: string, updates: EventCategoryUpdate) => {
    try {
      setError(null);

      // Verificar se é categoria do sistema
      // Trava de sistema removida pois agora usamos cópias locais
      // const existing = categories.find(c => c.id === id);
      // if (existing?.is_system) { ... }

      const { data, error: updateError } = await supabase
        .from('event_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCategories(prev => prev.map(c => c.id === id ? (data as unknown as EventCategory) : c));
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria';
      setError(errorMessage);
      console.error('Erro ao atualizar categoria:', err);
      return { data: null, error: errorMessage };
    }
  }, [categories]);

  /**
   * Excluir categoria (soft delete)
   */
  const deleteCategory = useCallback(async (id: string) => {
    try {
      setError(null);

      // Verificar se é categoria do sistema
      // Trava de sistema removida pois agora usamos cópias locais
      // const existing = categories.find(c => c.id === id);
      // if (existing?.is_system) { ... }

      const { error: deleteError } = await supabase
        .from('event_categories')
        .update({ ativo: false })
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCategories(prev => prev.filter(c => c.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir categoria';
      setError(errorMessage);
      console.error('Erro ao excluir categoria:', err);
      return { error: errorMessage };
    }
  }, [categories]);

  /**
   * Reordenar categorias
   */
  const reorderCategories = useCallback(async (orderedIds: string[]) => {
    try {
      setError(null);

      const updates = orderedIds.map((id, index) => ({
        id,
        ordem: index + 1,
      }));

      // Atualizar cada categoria
      for (const { id, ordem } of updates) {
        await supabase
          .from('event_categories')
          .update({ ordem })
          .eq('id', id);
      }

      // Recarregar para garantir sincronização
      await loadCategories();
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar categorias';
      setError(errorMessage);
      console.error('Erro ao reordenar categorias:', err);
      return { error: errorMessage };
    }
  }, [loadCategories]);

  return {
    // Estado
    categories,
    loading,
    error,

    // Leitura
    loadCategories,
    getCategoryById,
    getDefaultCategory,

    // Escrita
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
}
