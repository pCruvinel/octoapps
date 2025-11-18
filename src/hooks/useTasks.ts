import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskInsert, TaskUpdate } from '../types/task';

/**
 * Hook para gerenciar CRUD de Tarefas/Interações
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar tarefas de uma oportunidade específica
   */
  const loadTasksByOpportunity = useCallback(async (opportunityId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tarefas')
        .select(`
          *,
          responsavel:responsavel_id (
            id,
            nome_completo,
            avatar_url
          ),
          contato:contato_id (
            id,
            nome_completo
          )
        `)
        .eq('oportunidade_id', opportunityId)
        .eq('ativo', true)
        .order('data_vencimento', { ascending: false });

      if (fetchError) throw fetchError;

      setTasks(data || []);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar tarefas';
      setError(errorMessage);
      console.error('Erro ao buscar tarefas:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar uma tarefa específica por ID
   */
  const getTaskById = useCallback(async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('tarefas')
        .select(`
          *,
          responsavel:responsavel_id (
            id,
            nome_completo,
            avatar_url
          ),
          contato:contato_id (
            id,
            nome_completo
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar tarefa';
      console.error('Erro ao buscar tarefa:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  /**
   * Criar nova tarefa
   */
  const createTask = useCallback(async (task: TaskInsert) => {
    try {
      setError(null);

      // Obter ID do usuário atual
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: insertError } = await supabase
        .from('tarefas')
        .insert({
          ...task,
          responsavel_id: task.responsavel_id || user?.id,
          criado_por: user?.id,
          status: task.status || 'Pendente',
          prioridade: task.prioridade || 'Média',
        })
        .select(`
          *,
          responsavel:responsavel_id (
            id,
            nome_completo,
            avatar_url
          )
        `)
        .single();

      if (insertError) throw insertError;

      // Atualizar lista local se já carregou tarefas da mesma oportunidade
      if (task.oportunidade_id && tasks.length > 0) {
        setTasks(prev => [data, ...prev]);
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(errorMessage);
      console.error('Erro ao criar tarefa:', err);
      return { data: null, error: errorMessage };
    }
  }, [tasks.length]);

  /**
   * Atualizar tarefa existente
   */
  const updateTask = useCallback(async (id: string, updates: TaskUpdate) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('tarefas')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          responsavel:responsavel_id (
            id,
            nome_completo,
            avatar_url
          )
        `)
        .single();

      if (updateError) throw updateError;

      // Atualizar lista local
      setTasks(prev => prev.map(task => task.id === id ? data : task));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(errorMessage);
      console.error('Erro ao atualizar tarefa:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  /**
   * Deletar tarefa (soft delete)
   */
  const deleteTask = useCallback(async (id: string) => {
    try {
      setError(null);

      // Soft delete (marcar como inativo)
      const { data, error: deleteError } = await supabase
        .from('tarefas')
        .update({ ativo: false })
        .eq('id', id)
        .select()
        .single();

      if (deleteError) throw deleteError;

      // Remover da lista local
      setTasks(prev => prev.filter(task => task.id !== id));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir tarefa';
      setError(errorMessage);
      console.error('Erro ao excluir tarefa:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  /**
   * Marcar tarefa como concluída
   */
  const completeTask = useCallback(async (id: string) => {
    return updateTask(id, {
      status: 'Concluída',
      progresso: 100,
      data_conclusao: new Date().toISOString(),
    });
  }, [updateTask]);

  /**
   * Cancelar tarefa
   */
  const cancelTask = useCallback(async (id: string) => {
    return updateTask(id, {
      status: 'Cancelada',
    });
  }, [updateTask]);

  return {
    // Estados
    tasks,
    loading,
    error,

    // Funções de leitura
    loadTasksByOpportunity,
    getTaskById,

    // Funções de escrita
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    cancelTask,
  };
}
