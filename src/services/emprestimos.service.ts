/**
 * EmprestimosService
 *
 * Service layer for managing loan/financing calculations in the database.
 * Handles CRUD operations for emprestimos, amortizacao tables, and analysis results.
 */

import { supabase } from '@/lib/supabase';
import type {
  Emprestimo,
  EmprestimoInsert,
  EmprestimoUpdate,
  LinhaAmortizacaoEmprestimo,
  TipoEmprestimo,
  SistemaAmortizacao,
  TipoCenario,
} from '@/types/calculation.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Status options
export type StatusEmprestimo = 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado';

// Filters for listing
export interface EmprestimoFilters {
  status?: StatusEmprestimo;
  tipoEmprestimo?: TipoEmprestimo;
  devedor?: string;
  credor?: string;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
}

// Complete emprestimo with relations
export interface EmprestimoCompleto extends Emprestimo {
  amortizacao?: LinhaAmortizacaoEmprestimo[];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class EmprestimosService {

  // ==========================================================================
  // CREATE OPERATIONS
  // ==========================================================================

  /**
   * Create a new emprestimo record
   */
  async create(data: EmprestimoInsert): Promise<Emprestimo> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Map camelCase to snake_case properly
    const mapped = this.mapToDatabase(data);

    const { data: emprestimo, error } = await supabase
      .from('emprestimos')
      .insert({
        ...mapped,
        // Set defaults for arrays
        outras_tarifas: data.outrasTarifas || [],
        encargos_irregulares: [],
        // Set defaults for booleans
        tac_tec_irregular: false,
        seguros_irregulares: false,
        comissao_permanencia_irregular: false,
        // Audit fields
        criado_por: userId,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        data_calculo: data.dataCalculo || new Date().toISOString(),
        // Soft delete defaults
        ativo: true,
        excluido: false,
        status: 'Rascunho',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating emprestimo:', error);
      throw new Error(`Erro ao criar empréstimo: ${error.message}`);
    }

    return this.mapFromDatabase(emprestimo);
  }

  // ==========================================================================
  // READ OPERATIONS
  // ==========================================================================

  /**
   * Get a single emprestimo by ID
   */
  async getById(id: string): Promise<Emprestimo | null> {
    const { data, error } = await supabase
      .from('emprestimos')
      .select('*')
      .eq('id', id)
      .eq('excluido', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching emprestimo:', error);
      throw new Error(`Erro ao buscar empréstimo: ${error.message}`);
    }

    return this.mapFromDatabase(data);
  }

  /**
   * Get a complete emprestimo with amortization table
   */
  async getCompleto(id: string): Promise<EmprestimoCompleto | null> {
    const emprestimo = await this.getById(id);
    if (!emprestimo) return null;

    // Load amortization tables
    const amortizacao = await this.getAmortizacao(id);

    return {
      ...emprestimo,
      amortizacao,
    };
  }

  /**
   * Get all emprestimos with optional filters
   */
  async getAll(filters?: EmprestimoFilters): Promise<Emprestimo[]> {
    let query = supabase
      .from('emprestimos')
      .select('*')
      .eq('excluido', false)
      .eq('ativo', true)
      .order('data_atualizacao', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.tipoEmprestimo) {
      query = query.eq('tipo_emprestimo', filters.tipoEmprestimo);
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
      query = query.or(
        `devedor.ilike.%${filters.search}%,` +
        `credor.ilike.%${filters.search}%,` +
        `contrato_num.ilike.%${filters.search}%,` +
        `numero_processo.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching emprestimos:', error);
      throw new Error(`Erro ao buscar empréstimos: ${error.message}`);
    }

    return (data || []).map(item => this.mapFromDatabase(item));
  }

  /**
   * Get amortization table for an emprestimo
   */
  async getAmortizacao(
    emprestimoId: string,
    tipoCenario?: TipoCenario
  ): Promise<LinhaAmortizacaoEmprestimo[]> {
    let query = supabase
      .from('emprestimos_amortizacao')
      .select('*')
      .eq('emprestimo_id', emprestimoId)
      .order('mes', { ascending: true });

    if (tipoCenario) {
      query = query.eq('tipo_cenario', tipoCenario);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching amortizacao:', error);
      throw new Error(`Erro ao buscar tabela de amortização: ${error.message}`);
    }

    return (data || []).map(item => this.mapAmortizacaoFromDatabase(item));
  }

  // ==========================================================================
  // UPDATE OPERATIONS
  // ==========================================================================

  /**
   * Update an emprestimo record
   */
  async update(
    id: string,
    data: EmprestimoUpdate
  ): Promise<Emprestimo> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data: updated, error } = await supabase
      .from('emprestimos')
      .update({
        ...this.mapToDatabase(data),
        data_atualizacao: new Date().toISOString(),
        calculado_por: data.calculadoPor || userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating emprestimo:', error);
      throw new Error(`Erro ao atualizar empréstimo: ${error.message}`);
    }

    return this.mapFromDatabase(updated);
  }

  /**
   * Update calculated results (denormalized fields)
   */
  async updateCalculatedResults(
    id: string,
    results: {
      total_juros_cobrado?: number;
      total_juros_devido?: number;
      total_encargos?: number;
      valor_total_pago?: number;
      valor_total_devido?: number;
      diferenca_restituicao?: number;
      sobretaxa_pp?: number;
      cet_mensal?: number;
      cet_anual?: number;
      tac_tec_irregular?: boolean;
      seguros_irregulares?: boolean;
      comissao_permanencia_irregular?: boolean;
      encargos_irregulares?: string[];
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('emprestimos')
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
  async updateStatus(id: string, status: StatusEmprestimo): Promise<void> {
    const { error } = await supabase
      .from('emprestimos')
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
   * Soft delete an emprestimo
   */
  async softDelete(id: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('emprestimos')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString(),
        excluido_por: userId,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error soft deleting emprestimo:', error);
      throw new Error(`Erro ao excluir empréstimo: ${error.message}`);
    }
  }

  /**
   * Restore a soft-deleted emprestimo
   */
  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('emprestimos')
      .update({
        excluido: false,
        excluido_em: null,
        excluido_por: null,
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error restoring emprestimo:', error);
      throw new Error(`Erro ao restaurar empréstimo: ${error.message}`);
    }
  }

  /**
   * Hard delete (permanent) - USE WITH CAUTION
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('emprestimos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error hard deleting emprestimo:', error);
      throw new Error(`Erro ao deletar permanentemente: ${error.message}`);
    }
  }

  // ==========================================================================
  // AMORTIZATION TABLE OPERATIONS
  // ==========================================================================

  /**
   * Save amortization table (batch insert)
   */
  async saveAmortizacao(
    emprestimoId: string,
    tabela: LinhaAmortizacaoEmprestimo[],
    tipoCenario: TipoCenario
  ): Promise<void> {
    // Delete existing entries for this scenario
    await supabase
      .from('emprestimos_amortizacao')
      .delete()
      .eq('emprestimo_id', emprestimoId)
      .eq('tipo_cenario', tipoCenario);

    // Insert new entries
    const rows = tabela.map(linha => ({
      emprestimo_id: emprestimoId,
      mes: linha.mes,
      data_vencimento: linha.dataVencimento,
      valor_parcela: linha.valorParcela,
      juros: linha.juros,
      amortizacao: linha.amortizacao,
      saldo_devedor: linha.saldoDevedor,
      indice_correcao: linha.indiceCorrecao,
      valor_corrigido: linha.valorCorrigido,
      seguro_prestamista: linha.seguroPrestamista || 0,
      iof: linha.iof || 0,
      tarifas: linha.tarifas || 0,
      total_parcela: linha.totalParcela,
      tipo_cenario: tipoCenario,
      criado_em: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('emprestimos_amortizacao')
      .insert(rows);

    if (error) {
      console.error('Error saving amortizacao:', error);
      throw new Error(`Erro ao salvar tabela de amortização: ${error.message}`);
    }
  }

  /**
   * Delete amortization table for a scenario
   */
  async deleteAmortizacao(
    emprestimoId: string,
    tipoCenario?: TipoCenario
  ): Promise<void> {
    let query = supabase
      .from('emprestimos_amortizacao')
      .delete()
      .eq('emprestimo_id', emprestimoId);

    if (tipoCenario) {
      query = query.eq('tipo_cenario', tipoCenario);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting amortizacao:', error);
      throw new Error(`Erro ao deletar tabela de amortização: ${error.message}`);
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Check if an emprestimo exists
   */
  async exists(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('emprestimos')
      .select('id')
      .eq('id', id)
      .eq('excluido', false)
      .single();

    return !error && data !== null;
  }

  /**
   * Count total emprestimos
   */
  async count(filters?: EmprestimoFilters): Promise<number> {
    let query = supabase
      .from('emprestimos')
      .select('id', { count: 'exact', head: true })
      .eq('excluido', false)
      .eq('ativo', true);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.tipoEmprestimo) {
      query = query.eq('tipo_emprestimo', filters.tipoEmprestimo);
    }

    if (filters?.devedor) {
      query = query.ilike('devedor', `%${filters.devedor}%`);
    }

    if (filters?.credor) {
      query = query.ilike('credor', `%${filters.credor}%`);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting emprestimos:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get total financed amount across all emprestimos
   */
  async getTotalFinanciado(filters?: EmprestimoFilters): Promise<number> {
    let query = supabase
      .from('emprestimos')
      .select('total_financiado')
      .eq('excluido', false)
      .eq('ativo', true);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('Error calculating total financiado:', error);
      return 0;
    }

    return data.reduce((sum, emp) => sum + (emp.total_financiado || 0), 0);
  }

  // ==========================================================================
  // MAPPING HELPERS
  // ==========================================================================

  /**
   * Map database row to Emprestimo type (camelCase)
   */
  private mapFromDatabase(row: any): Emprestimo {
    return {
      id: row.id,
      contatoId: row.contato_id,
      projetoId: row.projeto_id,
      credor: row.credor,
      devedor: row.devedor,
      contratoNum: row.contrato_num,
      numeroProcesso: row.numero_processo,
      tipoEmprestimo: row.tipo_emprestimo,
      totalFinanciado: row.total_financiado,
      valorParcela: row.valor_parcela,
      quantidadeParcelas: row.quantidade_parcelas,
      dataContrato: row.data_contrato,
      dataPrimeiraParcela: row.data_primeira_parcela,
      dataLiberacao: row.data_liberacao,
      dataCalculo: row.data_calculo,
      sistemaAmortizacao: row.sistema_amortizacao,
      indiceCorrecao: row.indice_correcao,
      percentualIndexador: row.percentual_indexador,
      taxaMensalContrato: row.taxa_mensal_contrato,
      taxaAnualContrato: row.taxa_anual_contrato,
      taxaMensalMercado: row.taxa_mensal_mercado,
      taxaJurosMora: row.taxa_juros_mora,
      multaAtraso: row.multa_atraso,
      cdi: row.cdi,
      tac: row.tac,
      tec: row.tec,
      tarifaCadastro: row.tarifa_cadastro,
      tarifaAvaliacaoBem: row.tarifa_avaliacao_bem,
      tarifaRegistroContrato: row.tarifa_registro_contrato,
      despesasRegistro: row.despesas_registro,
      seguroPrestamista: row.seguro_prestamista,
      seguroProtecaoFinanceira: row.seguro_protecao_financeira,
      seguroDesemprego: row.seguro_desemprego,
      seguros: row.seguros,
      comissaoFlat: row.comissao_flat,
      tarifas: row.tarifas,
      outrasTarifas: row.outras_tarifas || [],
      iofPrincipal: row.iof_principal,
      iofAdicional: row.iof_adicional,
      outrosEncargos: row.outros_encargos,
      cetMensal: row.cet_mensal,
      cetAnual: row.cet_anual,
      totalJurosCobrado: row.total_juros_cobrado,
      totalJurosDevido: row.total_juros_devido,
      totalEncargos: row.total_encargos,
      valorTotalPago: row.valor_total_pago,
      valorTotalDevido: row.valor_total_devido,
      diferencaRestituicao: row.diferenca_restituicao,
      sobretaxaPP: row.sobretaxa_pp,
      tacTecIrregular: row.tac_tec_irregular,
      segurosIrregulares: row.seguros_irregulares,
      comissaoPermanenciaIrregular: row.comissao_permanencia_irregular,
      encargosIrregulares: row.encargos_irregulares || [],
      observacoes: row.observacoes,
      status: row.status,
      criadoPor: row.criado_por,
      calculadoPor: row.calculado_por,
      revisadoPor: row.revisado_por,
      dataCriacao: row.data_criacao,
      dataAtualizacao: row.data_atualizacao,
      dataRevisao: row.data_revisao,
      ativo: row.ativo,
      excluido: row.excluido,
      excluidoEm: row.excluido_em,
      excluidoPor: row.excluido_por,
    };
  }

  /**
   * Map Emprestimo type to database row (snake_case)
   */
  private mapToDatabase(data: Partial<EmprestimoUpdate>): any {
    const mapped: any = {};

    // Identificação
    if (data.credor !== undefined) mapped.credor = data.credor;
    if (data.devedor !== undefined) mapped.devedor = data.devedor;
    if (data.contratoNum !== undefined) mapped.contrato_num = data.contratoNum;
    if (data.numeroProcesso !== undefined) mapped.numero_processo = data.numeroProcesso;
    if (data.tipoEmprestimo !== undefined) mapped.tipo_emprestimo = data.tipoEmprestimo;

    // Valores principais
    if (data.totalFinanciado !== undefined) mapped.total_financiado = data.totalFinanciado;
    if (data.valorParcela !== undefined) mapped.valor_parcela = data.valorParcela;
    if (data.quantidadeParcelas !== undefined) mapped.quantidade_parcelas = data.quantidadeParcelas;

    // Datas
    if (data.dataContrato !== undefined) mapped.data_contrato = data.dataContrato;
    if (data.dataPrimeiraParcela !== undefined) mapped.data_primeira_parcela = data.dataPrimeiraParcela;
    if (data.dataLiberacao !== undefined) mapped.data_liberacao = data.dataLiberacao;
    if (data.dataCalculo !== undefined) mapped.data_calculo = data.dataCalculo;

    // Sistema e índice
    if (data.sistemaAmortizacao !== undefined) mapped.sistema_amortizacao = data.sistemaAmortizacao;
    if (data.indiceCorrecao !== undefined) mapped.indice_correcao = data.indiceCorrecao;
    if (data.percentualIndexador !== undefined) mapped.percentual_indexador = data.percentualIndexador;

    // Taxas de juros
    if (data.taxaMensalContrato !== undefined) mapped.taxa_mensal_contrato = data.taxaMensalContrato;
    if (data.taxaAnualContrato !== undefined) mapped.taxa_anual_contrato = data.taxaAnualContrato;
    if (data.taxaMensalMercado !== undefined) mapped.taxa_mensal_mercado = data.taxaMensalMercado;
    if (data.taxaJurosMora !== undefined) mapped.taxa_juros_mora = data.taxaJurosMora;
    if (data.multaAtraso !== undefined) mapped.multa_atraso = data.multaAtraso;
    if (data.cdi !== undefined) mapped.cdi = data.cdi;

    // Encargos iniciais
    if (data.tac !== undefined) mapped.tac = data.tac ?? 0;
    if (data.tec !== undefined) mapped.tec = data.tec ?? 0;
    if (data.tarifaCadastro !== undefined) mapped.tarifa_cadastro = data.tarifaCadastro ?? 0;
    if (data.tarifaAvaliacaoBem !== undefined) mapped.tarifa_avaliacao_bem = data.tarifaAvaliacaoBem ?? 0;
    if (data.tarifaRegistroContrato !== undefined) mapped.tarifa_registro_contrato = data.tarifaRegistroContrato ?? 0;
    if (data.despesasRegistro !== undefined) mapped.despesas_registro = data.despesasRegistro ?? 0;

    // Seguros e comissões
    if (data.seguroPrestamista !== undefined) mapped.seguro_prestamista = data.seguroPrestamista ?? 0;
    if (data.seguroProtecaoFinanceira !== undefined) mapped.seguro_protecao_financeira = data.seguroProtecaoFinanceira ?? 0;
    if (data.seguroDesemprego !== undefined) mapped.seguro_desemprego = data.seguroDesemprego ?? 0;
    if (data.comissaoFlat !== undefined) mapped.comissao_flat = data.comissaoFlat ?? 0;
    if (data.seguros !== undefined) mapped.seguros = data.seguros ?? 0;
    if (data.tarifas !== undefined) mapped.tarifas = data.tarifas ?? 0;
    if (data.outrasTarifas !== undefined) mapped.outras_tarifas = data.outrasTarifas;

    // IOF
    if (data.iofPrincipal !== undefined) mapped.iof_principal = data.iofPrincipal ?? 0;
    if (data.iofAdicional !== undefined) mapped.iof_adicional = data.iofAdicional ?? 0;

    // Outros encargos
    if (data.outrosEncargos !== undefined) mapped.outros_encargos = data.outrosEncargos ?? 0;

    // CET
    if (data.cetMensal !== undefined) mapped.cet_mensal = data.cetMensal;
    if (data.cetAnual !== undefined) mapped.cet_anual = data.cetAnual;

    // Totalizadores calculados
    if (data.totalJurosCobrado !== undefined) mapped.total_juros_cobrado = data.totalJurosCobrado;
    if (data.totalJurosDevido !== undefined) mapped.total_juros_devido = data.totalJurosDevido;
    if (data.totalEncargos !== undefined) mapped.total_encargos = data.totalEncargos;
    if (data.valorTotalPago !== undefined) mapped.valor_total_pago = data.valorTotalPago;
    if (data.valorTotalDevido !== undefined) mapped.valor_total_devido = data.valorTotalDevido;
    if (data.diferencaRestituicao !== undefined) mapped.diferenca_restituicao = data.diferencaRestituicao;
    if (data.sobretaxaPP !== undefined) mapped.sobretaxa_pp = data.sobretaxaPP;

    // Irregularidades
    if (data.tacTecIrregular !== undefined) mapped.tac_tec_irregular = data.tacTecIrregular;
    if (data.segurosIrregulares !== undefined) mapped.seguros_irregulares = data.segurosIrregulares;
    if (data.comissaoPermanenciaIrregular !== undefined) mapped.comissao_permanencia_irregular = data.comissaoPermanenciaIrregular;
    if (data.encargosIrregulares !== undefined) mapped.encargos_irregulares = data.encargosIrregulares;

    // Metadados
    if (data.status !== undefined) mapped.status = data.status;
    if (data.observacoes !== undefined) mapped.observacoes = data.observacoes;
    if (data.calculadoPor !== undefined) mapped.calculado_por = data.calculadoPor;
    if (data.revisadoPor !== undefined) mapped.revisado_por = data.revisadoPor;

    return mapped;
  }

  /**
   * Map amortization row from database
   */
  private mapAmortizacaoFromDatabase(row: any): LinhaAmortizacaoEmprestimo {
    return {
      mes: row.mes,
      dataVencimento: row.data_vencimento,
      valorParcela: row.valor_parcela,
      juros: row.juros,
      amortizacao: row.amortizacao,
      saldoDevedor: row.saldo_devedor,
      indiceCorrecao: row.indice_correcao,
      valorCorrigido: row.valor_corrigido,
      seguroPrestamista: row.seguro_prestamista,
      iof: row.iof,
      tarifas: row.tarifas,
      totalParcela: row.total_parcela,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Export a singleton instance for convenience
export const emprestimosService = new EmprestimosService();
