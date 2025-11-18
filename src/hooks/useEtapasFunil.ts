import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  EtapaFunil,
  EtapaFunilInsert,
  EtapaFunilUpdate,
  EtapaFunilEstatisticas,
} from '../types/funnel';

/**
 * Hook para gerenciar CRUD de Etapas do Funil
 */
export function useEtapasFunil() {
  const [etapas, setEtapas] = useState<EtapaFunil[]>([]);
  const [estatisticas, setEstatisticas] = useState<EtapaFunilEstatisticas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar todas as etapas do funil (apenas ativas)
   */
  const getEtapas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('etapas_funil')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (fetchError) throw fetchError;

      setEtapas(data || []);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar etapas';
      setError(errorMessage);
      console.error('Erro ao buscar etapas:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar estatísticas das etapas (com contadores de oportunidades)
   */
  const getEstatisticas = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('v_funil_estatisticas')
        .select('*')
        .order('ordem', { ascending: true });

      if (fetchError) throw fetchError;

      setEstatisticas(data || []);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas';
      console.error('Erro ao buscar estatísticas:', err);
      return { data: null, error: errorMessage };
    }
  }, []);

  /**
   * Buscar uma etapa específica por ID
   */
  const getEtapaPorId = useCallback(async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('etapas_funil')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar etapa';
      console.error('Erro ao buscar etapa:', err);
      return { data: null, error: errorMessage };
    }
  }, []);


  /**
   * Criar nova etapa
   */
  const createEtapa = useCallback(async (etapa: EtapaFunilInsert) => {
    try {
      setError(null);

      // Obter ordem automática (última posição + 1)
      const { data: ultimaEtapa } = await supabase
        .from('etapas_funil')
        .select('ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: false })
        .limit(1)
        .single();

      const novaOrdem = ultimaEtapa ? ultimaEtapa.ordem + 1 : 1;

      // Obter ID do usuário atual
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: insertError } = await supabase
        .from('etapas_funil')
        .insert({
          ...etapa,
          ordem: novaOrdem,
          criado_por: user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualizar lista local
      await getEtapas();

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar etapa';
      setError(errorMessage);
      console.error('Erro ao criar etapa:', err);
      return { data: null, error: errorMessage };
    }
  }, [getEtapas]);

  /**
   * Atualizar etapa existente
   */
  const updateEtapa = useCallback(async (id: string, updates: EtapaFunilUpdate) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('etapas_funil')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualizar lista local
      await getEtapas();

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar etapa';
      setError(errorMessage);
      console.error('Erro ao atualizar etapa:', err);
      return { data: null, error: errorMessage };
    }
  }, [getEtapas]);

  /**
   * Deletar etapa (soft delete)
   */
  const deleteEtapa = useCallback(async (id: string) => {
    try {
      setError(null);

      // Verificar se existem oportunidades vinculadas
      const { count } = await supabase
        .from('oportunidades')
        .select('id', { count: 'exact', head: true })
        .eq('etapa_funil_id', id)
        .eq('ativo', true);

      if (count && count > 0) {
        throw new Error(
          `Não é possível excluir esta etapa pois existem ${count} oportunidade(s) vinculada(s). ` +
          'Mova as oportunidades para outra etapa antes de excluir.'
        );
      }

      // Soft delete (marcar como inativo)
      const { data, error: deleteError } = await supabase
        .from('etapas_funil')
        .update({ ativo: false })
        .eq('id', id)
        .select()
        .single();

      if (deleteError) throw deleteError;

      // Atualizar lista local
      await getEtapas();

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir etapa';
      setError(errorMessage);
      console.error('Erro ao excluir etapa:', err);
      return { data: null, error: errorMessage };
    }
  }, [getEtapas]);

  /**
   * Reordenar etapas (drag & drop)
   */
  const reordenarEtapas = useCallback(async (etapaId: string, novaOrdem: number) => {
    try {
      setError(null);

      // Chamar função do banco para reordenar
      const { error: rpcError } = await supabase.rpc('reordenar_etapas_funil', {
        etapa_id: etapaId,
        nova_ordem: novaOrdem,
      });

      if (rpcError) throw rpcError;

      // Atualizar lista local
      await getEtapas();

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar etapas';
      setError(errorMessage);
      console.error('Erro ao reordenar etapas:', err);
      return { error: errorMessage };
    }
  }, [getEtapas]);

  /**
   * Reordenar etapas localmente (otimista)
   * Útil para drag & drop com feedback imediato
   */
  const reordenarEtapasLocal = useCallback((etapaId: string, novaOrdem: number) => {
    setEtapas(prevEtapas => {
      const etapasOrdenadas = [...prevEtapas];
      const etapaIndex = etapasOrdenadas.findIndex(e => e.id === etapaId);

      if (etapaIndex === -1) return prevEtapas;

      const [etapaMovida] = etapasOrdenadas.splice(etapaIndex, 1);
      etapasOrdenadas.splice(novaOrdem - 1, 0, etapaMovida);

      // Atualizar ordens
      return etapasOrdenadas.map((etapa, index) => ({
        ...etapa,
        ordem: index + 1,
      }));
    });
  }, []);

  /**
   * Carregar etapas ao montar o componente
   */
  useEffect(() => {
    getEtapas();
  }, [getEtapas]);

  return {
    // Estados
    etapas,
    estatisticas,
    loading,
    error,

    // Funções de leitura
    getEtapas,
    getEstatisticas,
    getEtapaPorId,

    // Funções de escrita
    createEtapa,
    updateEtapa,
    deleteEtapa,
    reordenarEtapas,
    reordenarEtapasLocal,
  };
}
