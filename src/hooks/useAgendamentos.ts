import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Agendamento, AgendamentoInsert, AgendamentoUpdate } from '../types/agendamento';

export function useAgendamentos() {
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Buscar agendamentos em um intervalo de datas
     */
    const loadAgendamentosByRange = useCallback(async (startDate: string, endDate: string) => {
        try {
            setLoading(true);
            setError(null);

            // Usar a lógica de sobreposição de intervalos:
            // (StartA <= EndB) and (EndA >= StartB)
            // Aqui queremos eventos onde data_inicio <= endDate E data_fim >= startDate

            const { data, error: fetchError } = await supabase
                .from('agendamentos')
                .select(`
          *,
          contato:contato_id (id, nome_completo),
          oportunidade:oportunidade_id (id, titulo)
        `)
                .lte('data_inicio', endDate)
                .gte('data_fim', startDate)
                .order('data_inicio', { ascending: true });

            if (fetchError) throw fetchError;

            setAgendamentos(data || []);
            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar agendamentos';
            setError(errorMessage);
            console.error(errorMessage, err);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Criar novo agendamento
     */
    const createAgendamento = useCallback(async (agendamento: AgendamentoInsert) => {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error: insertError } = await supabase
                .from('agendamentos')
                .insert({
                    ...agendamento,
                    user_id: user.id
                })
                .select(`
          *,
          contato:contato_id (id, nome_completo),
          oportunidade:oportunidade_id (id, titulo)
        `)
                .single();

            if (insertError) throw insertError;

            setAgendamentos(prev => [...prev, data]);
            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar agendamento';
            console.error(errorMessage, err);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Atualizar agendamento
     */
    const updateAgendamento = useCallback(async (id: string, updates: AgendamentoUpdate) => {
        try {
            setLoading(true);

            const { data, error: updateError } = await supabase
                .from('agendamentos')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
          *,
          contato:contato_id (id, nome_completo),
          oportunidade:oportunidade_id (id, titulo)
        `)
                .single();

            if (updateError) throw updateError;

            setAgendamentos(prev => prev.map(item => item.id === id ? data : item));
            return { data, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar agendamento';
            console.error(errorMessage, err);
            return { data: null, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Excluir agendamento
     */
    const deleteAgendamento = useCallback(async (id: string) => {
        try {
            setLoading(true);

            const { error: deleteError } = await supabase
                .from('agendamentos')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setAgendamentos(prev => prev.filter(item => item.id !== id));
            return { error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir agendamento';
            console.error(errorMessage, err);
            return { error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        agendamentos,
        loading,
        error,
        loadAgendamentosByRange,
        createAgendamento,
        updateAgendamento,
        deleteAgendamento
    };
}
