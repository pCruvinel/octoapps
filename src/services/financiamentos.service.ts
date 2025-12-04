/**
 * FinanciamentosService
 *
 * Service layer for managing financing calculations in the database.
 * Handles CRUD operations for financiamentos, amortization tables, and history tracking.
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { safeSaveAmortizacao, validateAmortizacaoRows } from './amortizacao.helper';
import type { RelatorioCompletoCabecalho, RelatorioAmortizacaoParcela, RelatorioCompletoResponse } from '@/types/relatorio.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Financiamento = Database['public']['Tables']['financiamentos']['Row'];
type FinanciamentoInsert = Database['public']['Tables']['financiamentos']['Insert'];
type FinanciamentoUpdate = Database['public']['Tables']['financiamentos']['Update'];

type AmortizacaoRow = Database['public']['Tables']['financiamentos_amortizacao']['Row'];
type AmortizacaoInsert = Database['public']['Tables']['financiamentos_amortizacao']['Insert'];

type HistoricoRow = Database['public']['Tables']['financiamentos_historico']['Row'];
type HistoricoInsert = Database['public']['Tables']['financiamentos_historico']['Insert'];

// Cenarios for amortization tables
export type Cenario = 'AP01' | 'AP05' | 'AP03';

// Status options
export type Status = 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado';

// Filters for listing
export interface FinanciamentoFilters {
  status?: Status;
  devedor?: string;
  credor?: string;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
}

// Complete financiamento with relations
export interface FinanciamentoCompleto extends Financiamento {
  amortizacao_ap01?: AmortizacaoRow[];
  amortizacao_ap05?: AmortizacaoRow[];
  amortizacao_ap03?: AmortizacaoRow[];
  historico?: HistoricoRow[];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class FinanciamentosService {

  // ==========================================================================
  // CREATE OPERATIONS
  // ==========================================================================

  /**
   * Create a new financiamento record
   */
  async create(data: FinanciamentoInsert): Promise<Financiamento> {
    const { data: financiamento, error } = await supabase
      .from('financiamentos')
      .insert({
        ...data,
        criado_por: (await supabase.auth.getUser()).data.user?.id,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating financiamento:', error);
      throw new Error(`Erro ao criar financiamento: ${error.message}`);
    }

    return financiamento;
  }

  /**
   * Save amortization table rows for a specific scenario
   * Uses safeSaveAmortizacao helper for robust error handling
   */
  async saveAmortizacao(
    financiamentoId: string,
    cenario: Cenario,
    rows: Omit<AmortizacaoInsert, 'financiamento_id' | 'cenario'>[]
  ): Promise<void> {
    // Validar dados antes de salvar
    const validation = validateAmortizacaoRows(rows);
    if (!validation.valid) {
      console.error('❌ Validation errors:', validation.errors);
      throw new Error(`Dados de amortização inválidos: ${validation.errors.join(', ')}`);
    }

    // Usar helper robusta para salvar
    const result = await safeSaveAmortizacao(financiamentoId, cenario, rows, 100);

    if (!result.success) {
      throw new Error(`Erro ao salvar tabela de amortização: ${result.errors.join(', ')}`);
    }

  }

  /**
   * Create a history record for audit trail
   */
  async createHistoryRecord(
    financiamentoId: string,
    dadosAnteriores: any,
    dadosNovos: any,
    camposAlterados: string[],
    motivoAlteracao?: string
  ): Promise<void> {
    // Get the next version number
    const { data: lastVersion } = await supabase
      .from('financiamentos_historico')
      .select('versao')
      .eq('financiamento_id', financiamentoId)
      .order('versao', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (lastVersion?.versao || 0) + 1;

    const historyData: HistoricoInsert = {
      financiamento_id: financiamentoId,
      versao: nextVersion,
      dados_anteriores: dadosAnteriores,
      dados_novos: dadosNovos,
      campos_alterados: camposAlterados,
      motivo_alteracao: motivoAlteracao,
      alterado_por: (await supabase.auth.getUser()).data.user?.id,
      data_alteracao: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('financiamentos_historico')
      .insert(historyData);

    if (error) {
      console.error('Error creating history record:', error);
      // Don't throw - history is nice to have but not critical
    }
  }

  // ==========================================================================
  // READ OPERATIONS
  // ==========================================================================

  /**
   * Get a single financiamento by ID
   */
  async getById(id: string): Promise<Financiamento | null> {
    const { data, error } = await supabase
      .from('financiamentos')
      .select('*')
      .eq('id', id)
      .eq('excluido', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching financiamento:', error);
      throw new Error(`Erro ao buscar financiamento: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a complete financiamento with all related data
   */
  async getCompleto(id: string): Promise<FinanciamentoCompleto | null> {
    const financiamento = await this.getById(id);
    if (!financiamento) return null;

    // Load amortization tables
    const [amortizacaoAP01, amortizacaoAP05, amortizacaoAP03, historico] = await Promise.all([
      this.getAmortizacao(id, 'AP01'),
      this.getAmortizacao(id, 'AP05'),
      this.getAmortizacao(id, 'AP03'),
      this.getHistorico(id),
    ]);

    return {
      ...financiamento,
      amortizacao_ap01: amortizacaoAP01,
      amortizacao_ap05: amortizacaoAP05,
      amortizacao_ap03: amortizacaoAP03,
      historico,
    };
  }

  /**
   * Get all financiamentos with optional filters
   */
  async getAll(filters?: FinanciamentoFilters): Promise<Financiamento[]> {
    let query = supabase
      .from('financiamentos')
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
        `contrato_num.ilike.%${filters.search}%,` +
        `numero_processo.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching financiamentos:', error);
      throw new Error(`Erro ao buscar financiamentos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all financiamentos_calculo (cálculos de revisão) with analysis data
   * Busca dados da tabela financiamentos_calculo com informações de análise
   */
  async getAllCalculos(): Promise<any[]> {
    const { data, error } = await supabase
      .from('financiamentos_calculo')
      .select(`
        *,
        financiamentos_calculo_analise (
          taxa_juros_mensal_contrato,
          taxa_media_mensal,
          excesso_media,
          diferenca_total_media,
          diferenca_total_simples
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching financiamentos_calculo:', error);
      throw new Error(`Erro ao buscar cálculos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single financiamento_calculo by ID with analysis data
   * Busca um cálculo específico da tabela financiamentos_calculo
   */
  async getCalculoById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('financiamentos_calculo')
      .select(`
        *,
        financiamentos_calculo_analise (
          taxa_juros_mensal_contrato,
          taxa_media_mensal,
          excesso_media,
          diferenca_total_media,
          diferenca_total_simples
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching financiamento_calculo:', error);
      throw new Error(`Erro ao buscar cálculo: ${error.message}`);
    }

    return data;
  }

  /**
   * Soft delete a financiamento_calculo
   * Excluir logicamente um cálculo da tabela financiamentos_calculo
   */
  async softDeleteCalculo(id: string): Promise<void> {
    const { error } = await supabase
      .from('financiamentos_calculo')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting financiamento_calculo:', error);
      throw new Error(`Erro ao excluir cálculo: ${error.message}`);
    }
  }

  /**
   * Get amortization table rows for a financiamento
   */
  async getAmortizacao(
    financiamentoId: string,
    cenario?: Cenario
  ): Promise<AmortizacaoRow[]> {
    let query = supabase
      .from('financiamentos_amortizacao')
      .select('*')
      .eq('financiamento_id', financiamentoId)
      .order('mes', { ascending: true });

    if (cenario) {
      query = query.eq('cenario', cenario);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching amortizacao:', error);
      throw new Error(`Erro ao buscar tabela de amortização: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get history records for a financiamento
   */
  async getHistorico(financiamentoId: string): Promise<HistoricoRow[]> {
    const { data, error } = await supabase
      .from('financiamentos_historico')
      .select('*')
      .eq('financiamento_id', financiamentoId)
      .order('versao', { ascending: false });

    if (error) {
      console.error('Error fetching historico:', error);
      throw new Error(`Erro ao buscar histórico: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================================================
  // UPDATE OPERATIONS
  // ==========================================================================

  /**
   * Update a financiamento record
   */
  async update(
    id: string,
    data: FinanciamentoUpdate,
    createHistory = true
  ): Promise<Financiamento> {
    // Get current data for history
    let dadosAnteriores: Financiamento | null = null;
    if (createHistory) {
      dadosAnteriores = await this.getById(id);
    }

    // Update the record
    const { data: updated, error } = await supabase
      .from('financiamentos')
      .update({
        ...data,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating financiamento:', error);
      throw new Error(`Erro ao atualizar financiamento: ${error.message}`);
    }

    // Create history record
    if (createHistory && dadosAnteriores) {
      const camposAlterados = Object.keys(data);
      await this.createHistoryRecord(
        id,
        dadosAnteriores,
        updated,
        camposAlterados,
        'Atualização manual'
      );
    }

    return updated;
  }

  /**
   * Update calculated results (denormalized fields)
   */
  async updateCalculatedResults(
    id: string,
    results: {
      taxa_contrato_am?: number;
      taxa_mercado_am?: number;
      sobretaxa_pp?: number;
      valor_total_pago?: number;
      valor_total_devido?: number;
      diferenca_restituicao?: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('financiamentos')
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
  async updateStatus(id: string, status: Status): Promise<void> {
    const { error } = await supabase
      .from('financiamentos')
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

  // ==========================================================================
  // DELETE OPERATIONS
  // ==========================================================================

  /**
   * Soft delete a financiamento
   */
  async softDelete(id: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('financiamentos')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString(),
        excluido_por: userId,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error soft deleting financiamento:', error);
      throw new Error(`Erro ao excluir financiamento: ${error.message}`);
    }
  }

  /**
   * Restore a soft-deleted financiamento
   */
  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('financiamentos')
      .update({
        excluido: false,
        excluido_em: null,
        excluido_por: null,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error restoring financiamento:', error);
      throw new Error(`Erro ao restaurar financiamento: ${error.message}`);
    }
  }

  /**
   * Hard delete (permanent) - USE WITH CAUTION
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('financiamentos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error hard deleting financiamento:', error);
      throw new Error(`Erro ao deletar permanentemente: ${error.message}`);
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Check if a financiamento exists
   */
  async exists(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('financiamentos')
      .select('id')
      .eq('id', id)
      .eq('excluido', false)
      .single();

    return !error && data !== null;
  }

  /**
   * Count total financiamentos
   */
  async count(filters?: FinanciamentoFilters): Promise<number> {
    let query = supabase
      .from('financiamentos')
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
      console.error('Error counting financiamentos:', error);
      return 0;
    }

    return count || 0;
  }

  // ==========================================================================
  // RPC OPERATIONS
  // ==========================================================================

  /**
   * Create financiamento and generate preview analysis via RPC
   * Calls the Supabase RPC function criar_financiamento_e_analise
   */
  async criarFinanciamentoEAnalise(params: {
    // Cálculo params
    p_valor_financiado: number;
    p_taxa_juros_mensal_contrato: number;
    p_taxa_juros_anual_contrato: number;
    p_taxa_media_mensal: number;
    p_taxa_media_anual: number;
    p_qtd_parcelas_contrato: number;
    p_qtd_parcelas_analise: number;
    p_seguros_mensais: number;
    p_sistema_amortizacao: string;
    p_indexador_cm: string;
    p_data_contratual: string;
    p_primeiro_vencimento: string;

    // Dados do processo
    p_credor: string;
    p_devedor: string;
    p_tipo_contrato: string;
    p_data_calculo: string;

    // Dados do imóvel
    p_valor_bem: number;
    p_valor_entrada: number;
    p_valor_parcela_contrato: number;

    // Taxas e juros
    p_multa_moratoria_percent: number;
    p_juros_mora_percent: number;
    p_outros_encargos: number;
    p_tarifa_avaliacao_bem: number;
  }): Promise<{
    financiamento_calculo_id: string;
    excesso_media: number;
    diferenca_total_media: number;
    diferenca_total_simples: number;
  }> {
    const { data, error } = await supabase.rpc('criar_financiamento_e_analise', params);

    if (error) {
      console.error('Error calling criar_financiamento_e_analise:', error);
      throw new Error(`Erro ao criar análise prévia: ${error.message}`);
    }

    return data;
  }

  /**
   * Gera um relatório completo de financiamento usando a RPC do Supabase
   * @param financiamentoCalculoId - ID do financiamento_calculo
   * @param qtdParcelasTabela - Quantidade de parcelas para a tabela de amortização
   * @returns Relatório completo com cabeçalho e amortização
   */
  async gerarRelatorioCompleto(
    financiamentoCalculoId: string,
    qtdParcelasTabela: number
  ): Promise<RelatorioCompletoResponse> {
    // 1. Chamar RPC gerar_relatorio_completo
    const { data: relatorioId, error: rpcError } = await supabase.rpc(
      'gerar_relatorio_completo',
      {
        p_financiamento_calculo_id: financiamentoCalculoId,
        p_qtd_parcelas_tabela: qtdParcelasTabela,
      }
    );

    if (rpcError) {
      console.error('Error calling gerar_relatorio_completo:', rpcError);
      throw new Error(`Erro ao gerar relatório completo: ${rpcError.message}`);
    }

    if (!relatorioId) {
      throw new Error('RPC não retornou o ID do relatório');
    }

    // 2. Buscar cabeçalho do relatório com join do financiamento
    const { data: cabecalho, error: cabecalhoError } = await supabase
      .from('relatorios_completos')
      .select('*, financiamentos_calculo(*)')
      .eq('id', relatorioId)
      .single();

    if (cabecalhoError) {
      console.error('Error fetching relatorio cabecalho:', cabecalhoError);
      throw new Error(`Erro ao buscar cabeçalho do relatório: ${cabecalhoError.message}`);
    }

    // 3. Buscar tabela de amortização ordenada por parcela
    const { data: amortizacao, error: amortizacaoError } = await supabase
      .from('relatorios_amortizacao')
      .select('*')
      .eq('relatorio_id', relatorioId)
      .order('numero_parcela', { ascending: true });

    if (amortizacaoError) {
      console.error('Error fetching relatorio amortizacao:', amortizacaoError);
      throw new Error(`Erro ao buscar amortização do relatório: ${amortizacaoError.message}`);
    }

    return {
      relatorio_id: relatorioId,
      cabecalho: cabecalho as RelatorioCompletoCabecalho,
      amortizacao: (amortizacao || []) as RelatorioAmortizacaoParcela[],
    };
  }

  /**
   * Busca um relatório completo já gerado pelo ID
   * @param relatorioId - ID do relatório
   * @returns Relatório completo com cabeçalho e amortização
   */
  async buscarRelatorioCompletoPorId(relatorioId: string): Promise<RelatorioCompletoResponse> {
    // 1. Buscar cabeçalho do relatório com join do financiamento
    const { data: cabecalho, error: cabecalhoError } = await supabase
      .from('relatorios_completos')
      .select('*, financiamentos_calculo(*)')
      .eq('id', relatorioId)
      .single();

    if (cabecalhoError) {
      console.error('Error fetching relatorio cabecalho:', cabecalhoError);
      throw new Error(`Erro ao buscar cabeçalho do relatório: ${cabecalhoError.message}`);
    }

    // 2. Buscar tabela de amortização ordenada por parcela
    const { data: amortizacao, error: amortizacaoError } = await supabase
      .from('relatorios_amortizacao')
      .select('*')
      .eq('relatorio_id', relatorioId)
      .order('numero_parcela', { ascending: true });

    if (amortizacaoError) {
      console.error('Error fetching relatorio amortizacao:', amortizacaoError);
      throw new Error(`Erro ao buscar amortização do relatório: ${amortizacaoError.message}`);
    }

    return {
      relatorio_id: relatorioId,
      cabecalho: cabecalho as RelatorioCompletoCabecalho,
      amortizacao: (amortizacao || []) as RelatorioAmortizacaoParcela[],
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Export a singleton instance for convenience
export const financiamentosService = new FinanciamentosService();
