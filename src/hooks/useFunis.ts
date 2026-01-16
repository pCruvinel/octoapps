import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * Tipo para Funil de vendas
 */
export interface Funil {
    id: string;
    nome: string;
    descricao?: string | null;
    cor: string;
    icone: string;
    ativo: boolean;
    ordem: number;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export interface FunilInsert {
    nome: string;
    descricao?: string | null;
    cor?: string;
    icone?: string;
    ordem?: number;
}

export interface FunilUpdate {
    nome?: string;
    descricao?: string | null;
    cor?: string;
    icone?: string;
    ativo?: boolean;
    ordem?: number;
}

/**
 * Hook para gerenciar funis de vendas
 * Cada usuário pode criar seus próprios pipelines (Vendas, Cobrança, Produção, etc)
 */
export function useFunis() {
    const { user } = useAuth();
    const [funis, setFunis] = useState<Funil[]>([]);
    const [funilAtivo, setFunilAtivo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Refs para evitar re-fetch desnecessário
    const hasLoadedRef = useRef(false);
    const lastUserIdRef = useRef<string | null>(null);

    /**
     * Carregar todos os funis do usuário
     */
    const loadFunis = useCallback(async () => {
        if (!user) {
            setFunis([]);
            return { data: [], error: null };
        }

        // Evitar carregamento duplicado
        if (loading) {
            return { data: funis, error: null };
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('funis')
                .select('*')
                .eq('user_id', user.id)
                .eq('ativo', true)
                .order('ordem', { ascending: true })
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            const funisData = data || [];
            setFunis(funisData);

            // Se não tiver funil ativo, seleciona o primeiro (apenas uma vez)
            if (funisData.length > 0) {
                setFunilAtivo(prev => prev || funisData[0].id);
            }

            return { data: funisData, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar funis';
            setError(errorMessage);
            console.error('[useFunis] Erro ao carregar:', err);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [user]); // Removido funilAtivo das dependências!

    /**
     * Criar novo funil
     */
    const createFunil = useCallback(async (funil: FunilInsert) => {
        if (!user) {
            return { data: null, error: 'Usuário não autenticado' };
        }

        try {
            setError(null);

            // Buscar ordem atual via query, não via estado local (evita stale data)
            const { data: maxOrdemData } = await supabase
                .from('funis')
                .select('ordem')
                .eq('user_id', user.id)
                .eq('ativo', true)
                .order('ordem', { ascending: false })
                .limit(1)
                .single();

            const maxOrdem = maxOrdemData?.ordem ?? 0;

            const { data, error: insertError } = await supabase
                .from('funis')
                .insert({
                    ...funil,
                    user_id: user.id,
                    ordem: funil.ordem ?? maxOrdem + 1,
                    cor: funil.cor || '#6366f1',
                    icone: funil.icone || 'Layers',
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Atualizar lista local
            setFunis(prev => [...prev, data].sort((a, b) => a.ordem - b.ordem));
            
            toast.success(`Funil "${data.nome}" criado com sucesso`);
            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar funil';
            setError(errorMessage);
            console.error('[useFunis] Erro ao criar:', err);
            toast.error('Erro ao criar funil');
            return { data: null, error: errorMessage };
        }
    }, [user]); // Removido 'funis' das dependências

    /**
     * Atualizar funil existente
     */
    const updateFunil = useCallback(async (id: string, updates: FunilUpdate) => {
        try {
            setError(null);

            const { data, error: updateError } = await supabase
                .from('funis')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Atualizar lista local
            setFunis(prev => 
                prev.map(f => f.id === id ? data : f).sort((a, b) => a.ordem - b.ordem)
            );

            toast.success('Funil atualizado');
            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar funil';
            setError(errorMessage);
            console.error('[useFunis] Erro ao atualizar:', err);
            toast.error('Erro ao atualizar funil');
            return { data: null, error: errorMessage };
        }
    }, []);

    /**
     * Desativar funil (soft delete)
     */
    const deleteFunil = useCallback(async (id: string) => {
        try {
            setError(null);

            // Verificar quantidade localmente
            setFunis(prev => {
                if (prev.length <= 1) {
                    toast.error('Não é possível excluir o único funil');
                    return prev;
                }
                return prev;
            });

            const { error: updateError } = await supabase
                .from('funis')
                .update({ 
                    ativo: false, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Atualizar lista local e funil ativo
            setFunis(prev => {
                const remaining = prev.filter(f => f.id !== id);
                // Se era o funil ativo, mudar para o primeiro
                if (funilAtivo === id && remaining.length > 0) {
                    setFunilAtivo(remaining[0].id);
                }
                return remaining;
            });

            toast.success('Funil excluído');
            return { error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir funil';
            setError(errorMessage);
            console.error('[useFunis] Erro ao excluir:', err);
            toast.error('Erro ao excluir funil');
            return { error: errorMessage };
        }
    }, [funilAtivo]);

    /**
     * Reordenar funis
     */
    const reorderFunis = useCallback(async (orderedIds: string[]) => {
        try {
            setError(null);

            // Atualizar ordem de cada funil
            const updates = orderedIds.map((id, index) => ({
                id,
                ordem: index + 1,
            }));

            for (const update of updates) {
                await supabase
                    .from('funis')
                    .update({ ordem: update.ordem })
                    .eq('id', update.id);
            }

            // Recarregar lista
            await loadFunis();

            return { error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar funis';
            setError(errorMessage);
            console.error('[useFunis] Erro ao reordenar:', err);
            return { error: errorMessage };
        }
    }, [loadFunis]);

    /**
     * Criar funil padrão se não existir nenhum
     * Esta função é idempotente - pode ser chamada múltiplas vezes
     */
    const ensureDefaultFunil = useCallback(async () => {
        if (!user) return null;

        try {
            // Verificar se já tem funis
            const { data: existing } = await supabase
                .from('funis')
                .select('id')
                .eq('user_id', user.id)
                .eq('ativo', true)
                .limit(1);

            if (existing && existing.length > 0) {
                // Se já tem, apenas retorna o ID
                return existing[0].id;
            }

            // Criar funil padrão
            const { data, error } = await supabase
                .from('funis')
                .insert({
                    nome: 'Pipeline de Vendas',
                    descricao: 'Funil principal de vendas',
                    cor: '#6366f1',
                    icone: 'Layers',
                    user_id: user.id,
                    ordem: 1,
                })
                .select()
                .single();

            if (error) throw error;

            // Atualizar estado local
            setFunis([data]);
            setFunilAtivo(data.id);

            return data.id;
        } catch (err) {
            console.error('[useFunis] Erro ao criar funil padrão:', err);
            return null;
        }
    }, [user]); // Removido createFunil das dependências - usamos insert direto

    /**
     * Obter funil por ID
     */
    const getFunilById = useCallback((id: string) => {
        return funis.find(f => f.id === id) || null;
    }, [funis]);

    // Carregar funis ao montar - apenas uma vez por usuário
    useEffect(() => {
        if (!user) {
            setFunis([]);
            setFunilAtivo(null);
            hasLoadedRef.current = false;
            lastUserIdRef.current = null;
            return;
        }

        // Só recarrega se o usuário mudou
        if (lastUserIdRef.current !== user.id) {
            lastUserIdRef.current = user.id;
            hasLoadedRef.current = false;
        }

        // Evita re-fetch se já carregou para este usuário
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadFunis();
        }
    }, [user, loadFunis]);

    return {
        // Estado
        funis,
        funilAtivo,
        setFunilAtivo,
        loading,
        error,

        // Funções de leitura
        loadFunis,
        getFunilById,

        // Funções de escrita
        createFunil,
        updateFunil,
        deleteFunil,
        reorderFunis,
        ensureDefaultFunil,
    };
}
