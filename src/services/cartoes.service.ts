/**
 * CartoesService
 *
 * Service layer for managing credit card calculations in the database.
 * Handles CRUD operations for cartoes_credito, faturas, and analysis results.
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type CartaoCredito = Database['public']['Tables']['cartoes_credito']['Row'];
type CartaoCreditoInsert = Database['public']['Tables']['cartoes_credito']['Insert'];
type CartaoCreditoUpdate = Database['public']['Tables']['cartoes_credito']['Update'];

type CartaoFatura = Database['public']['Tables']['cartoes_faturas']['Row'];
type FaturaInsert = Database['public']['Tables']['cartoes_faturas']['Insert'];
type FaturaUpdate = Database['public']['Tables']['cartoes_faturas']['Update'];

// Status options
export type StatusCartao = 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado';

// Status da fatura
export type StatusPagamento = 'Pendente' | 'Pago Integral' | 'Pago Parcial' | 'Não Pago' | 'Em Atraso';

// Filters for listing
export interface CartaoFilters {
  status?: StatusCartao;
  devedor?: string;
  credor?: string;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
}

// Complete cartao with relations
export interface CartaoCompleto extends CartaoCredito {
  faturas?: CartaoFatura[];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CartoesService {

  // ==========================================================================
  // CREATE OPERATIONS
  // ==========================================================================

  /**
   * Create a new cartao de credito record
   */
  async create(data: CartaoCreditoInsert): Promise<CartaoCredito> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data: cartao, error } = await supabase
      .from('cartoes_credito')
      .insert({
        ...data,
        // Set defaults for arrays if not provided
        parcelamentos: data.parcelamentos || [],
        saques_especie: data.saques_especie || [],
        estornos_ajustes: data.estornos_ajustes || [],
        renegociacoes: data.renegociacoes || [],
        outras_tarifas: data.outras_tarifas || [],
        encargos_abusivos: data.encargos_abusivos || [],
        // Set defaults for numbers
        anuidade: data.anuidade ?? 0,
        seguro: data.seguro ?? 0,
        iof: data.iof ?? 0,
        tarifas: data.tarifas ?? 0,
        dies_mora: data.dies_mora ?? 0,
        anatocismo_detectado: data.anatocismo_detectado ?? false,
        // Audit fields
        criado_por: userId,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        data_calculo: data.data_calculo || new Date().toISOString(),
        // Soft delete defaults
        ativo: true,
        excluido: false,
        status: data.status || 'Rascunho',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cartao:', error);
      throw new Error(`Erro ao criar cartão: ${error.message}`);
    }

    return cartao;
  }

  /**
   * Create a new fatura for a cartao
   */
  async createFatura(data: FaturaInsert): Promise<CartaoFatura> {
    const { data: fatura, error } = await supabase
      .from('cartoes_faturas')
      .insert({
        ...data,
        // Set defaults
        compras_nacionais: data.compras_nacionais ?? 0,
        compras_internacionais: data.compras_internacionais ?? 0,
        saques: data.saques ?? 0,
        juros_rotativo: data.juros_rotativo ?? 0,
        juros_parcelamento: data.juros_parcelamento ?? 0,
        juros_mora: data.juros_mora ?? 0,
        multa: data.multa ?? 0,
        iof: data.iof ?? 0,
        anuidade: data.anuidade ?? 0,
        seguros: data.seguros ?? 0,
        tarifas: data.tarifas ?? 0,
        estornos: data.estornos ?? 0,
        pagamentos: data.pagamentos ?? 0,
        status_pagamento: data.status_pagamento || 'Pendente',
        criado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating fatura:', error);
      throw new Error(`Erro ao criar fatura: ${error.message}`);
    }

    return fatura;
  }

  /**
   * Create multiple faturas in batch
   */
  async createFaturas(faturas: FaturaInsert[]): Promise<CartaoFatura[]> {
    const faturasWithDefaults = faturas.map(f => ({
      ...f,
      compras_nacionais: f.compras_nacionais ?? 0,
      compras_internacionais: f.compras_internacionais ?? 0,
      saques: f.saques ?? 0,
      juros_rotativo: f.juros_rotativo ?? 0,
      juros_parcelamento: f.juros_parcelamento ?? 0,
      juros_mora: f.juros_mora ?? 0,
      multa: f.multa ?? 0,
      iof: f.iof ?? 0,
      anuidade: f.anuidade ?? 0,
      seguros: f.seguros ?? 0,
      tarifas: f.tarifas ?? 0,
      estornos: f.estornos ?? 0,
      pagamentos: f.pagamentos ?? 0,
      status_pagamento: f.status_pagamento || 'Pendente' as StatusPagamento,
      criado_em: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('cartoes_faturas')
      .insert(faturasWithDefaults)
      .select();

    if (error) {
      console.error('Error creating faturas:', error);
      throw new Error(`Erro ao criar faturas: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================================================
  // READ OPERATIONS
  // ==========================================================================

  /**
   * Get a single cartao by ID
   */
  async getById(id: string): Promise<CartaoCredito | null> {
    const { data, error } = await supabase
      .from('cartoes_credito')
      .select('*')
      .eq('id', id)
      .eq('excluido', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching cartao:', error);
      throw new Error(`Erro ao buscar cartão: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a complete cartao with all faturas
   */
  async getCompleto(id: string): Promise<CartaoCompleto | null> {
    const cartao = await this.getById(id);
    if (!cartao) return null;

    // Load faturas
    const faturas = await this.getFaturas(id);

    return {
      ...cartao,
      faturas,
    };
  }

  /**
   * Get all cartoes with optional filters
   */
  async getAll(filters?: CartaoFilters): Promise<CartaoCredito[]> {
    let query = supabase
      .from('cartoes_credito')
      .select('*')
      .eq('excluido', false)
      .eq('ativo', true)
      .order('data_atualizacao', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.devedor) {
      query = query.ilike('devedor', `%${filters.devedor}%`);
    }

    if (filters?.credor) {
      query = query.ilike('credor', `%${filters.credor}%`);
    }

    if (filters?.dataInicio) {
      query = query.gte('data_criacao', filters.dataInicio);
    }

    if (filters?.dataFim) {
      query = query.lte('data_criacao', filters.dataFim);
    }

    if (filters?.search) {
      // Search across multiple fields
      query = query.or(
        `devedor.ilike.%${filters.search}%,` +
        `credor.ilike.%${filters.search}%,` +
        `numero_cartao.ilike.%${filters.search}%,` +
        `numero_processo.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cartoes:', error);
      throw new Error(`Erro ao buscar cartões: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all faturas for a cartao
   */
  async getFaturas(cartaoId: string): Promise<CartaoFatura[]> {
    const { data, error } = await supabase
      .from('cartoes_faturas')
      .select('*')
      .eq('cartao_id', cartaoId)
      .order('ano_referencia', { ascending: false })
      .order('mes_referencia', { ascending: false });

    if (error) {
      console.error('Error fetching faturas:', error);
      throw new Error(`Erro ao buscar faturas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific fatura by month/year
   */
  async getFatura(
    cartaoId: string,
    mes: number,
    ano: number
  ): Promise<CartaoFatura | null> {
    const { data, error } = await supabase
      .from('cartoes_faturas')
      .select('*')
      .eq('cartao_id', cartaoId)
      .eq('mes_referencia', mes)
      .eq('ano_referencia', ano)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching fatura:', error);
      throw new Error(`Erro ao buscar fatura: ${error.message}`);
    }

    return data;
  }

  // ==========================================================================
  // UPDATE OPERATIONS
  // ==========================================================================

  /**
   * Update a cartao record
   */
  async update(
    id: string,
    data: CartaoCreditoUpdate
  ): Promise<CartaoCredito> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data: updated, error } = await supabase
      .from('cartoes_credito')
      .update({
        ...data,
        data_atualizacao: new Date().toISOString(),
        calculado_por: data.calculado_por || userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cartao:', error);
      throw new Error(`Erro ao atualizar cartão: ${error.message}`);
    }

    return updated;
  }

  /**
   * Update calculated results (denormalized fields)
   */
  async updateCalculatedResults(
    id: string,
    results: {
      total_juros_cobrado?: number;
      total_juros_devido?: number;
      diferenca_restituicao?: number;
      taxa_efetiva_mensal?: number;
      taxa_efetiva_anual?: number;
      valor_total_pago?: number;
      valor_total_devido?: number;
      percentual_sobretaxa?: number;
      cet_mensal?: number;
      cet_anual?: number;
      anatocismo_detectado?: boolean;
      encargos_abusivos?: string[];
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('cartoes_credito')
      .update({
        ...results,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating calculated results:', error);
      throw new Error(`Erro ao atualizar resultados calculados: ${error.message}`);
    }
  }

  /**
   * Update status
   */
  async updateStatus(id: string, status: StatusCartao): Promise<void> {
    const { error } = await supabase
      .from('cartoes_credito')
      .update({
        status,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }
  }

  /**
   * Update a fatura
   */
  async updateFatura(
    faturaId: string,
    data: FaturaUpdate
  ): Promise<CartaoFatura> {
    const { data: updated, error } = await supabase
      .from('cartoes_faturas')
      .update(data)
      .eq('id', faturaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating fatura:', error);
      throw new Error(`Erro ao atualizar fatura: ${error.message}`);
    }

    return updated;
  }

  // ==========================================================================
  // DELETE OPERATIONS
  // ==========================================================================

  /**
   * Soft delete a cartao
   */
  async softDelete(id: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('cartoes_credito')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString(),
        excluido_por: userId,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error soft deleting cartao:', error);
      throw new Error(`Erro ao excluir cartão: ${error.message}`);
    }
  }

  /**
   * Restore a soft-deleted cartao
   */
  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('cartoes_credito')
      .update({
        excluido: false,
        excluido_em: null,
        excluido_por: null,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error restoring cartao:', error);
      throw new Error(`Erro ao restaurar cartão: ${error.message}`);
    }
  }

  /**
   * Hard delete (permanent) - USE WITH CAUTION
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('cartoes_credito')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error hard deleting cartao:', error);
      throw new Error(`Erro ao deletar permanentemente: ${error.message}`);
    }
  }

  /**
   * Delete a fatura
   */
  async deleteFatura(faturaId: string): Promise<void> {
    const { error } = await supabase
      .from('cartoes_faturas')
      .delete()
      .eq('id', faturaId);

    if (error) {
      console.error('Error deleting fatura:', error);
      throw new Error(`Erro ao deletar fatura: ${error.message}`);
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Check if a cartao exists
   */
  async exists(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('cartoes_credito')
      .select('id')
      .eq('id', id)
      .eq('excluido', false)
      .single();

    return !error && data !== null;
  }

  /**
   * Count total cartoes
   */
  async count(filters?: CartaoFilters): Promise<number> {
    let query = supabase
      .from('cartoes_credito')
      .select('id', { count: 'exact', head: true })
      .eq('excluido', false)
      .eq('ativo', true);

    // Apply same filters as getAll
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.devedor) {
      query = query.ilike('devedor', `%${filters.devedor}%`);
    }

    if (filters?.credor) {
      query = query.ilike('credor', `%${filters.credor}%`);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting cartoes:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Count faturas for a cartao
   */
  async countFaturas(cartaoId: string): Promise<number> {
    const { count, error } = await supabase
      .from('cartoes_faturas')
      .select('id', { count: 'exact', head: true })
      .eq('cartao_id', cartaoId);

    if (error) {
      console.error('Error counting faturas:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get total saldo devedor across all cartoes
   */
  async getTotalSaldoDevedor(filters?: CartaoFilters): Promise<number> {
    let query = supabase
      .from('cartoes_credito')
      .select('saldo_devedor')
      .eq('excluido', false)
      .eq('ativo', true);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('Error calculating total saldo:', error);
      return 0;
    }

    return data.reduce((sum, cartao) => sum + (cartao.saldo_devedor || 0), 0);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Export a singleton instance for convenience
export const cartoesService = new CartoesService();
