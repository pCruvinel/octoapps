/**
 * PeticoesService
 *
 * Service layer for managing petitions in the database.
 * Handles CRUD operations for petições (legal petitions).
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { Peticao, PeticaoListItem } from '@/types/peticoes.types';

type PeticaoRow = Database['public']['Tables']['peticoes']['Row'];
type PeticaoInsert = Database['public']['Tables']['peticoes']['Insert'];
type PeticaoUpdate = Database['public']['Tables']['peticoes']['Update'];

export class PeticoesService {

  // ========== MAPEAMENTO ==========

  private mapRowToPeticao(row: PeticaoRow): Peticao {
    return {
      id: row.id,
      nome: row.nome,
      tipo: row.tipo as any,
      status: row.status as any,
      conteudo: row.conteudo,
      modelo: row.modelo as any,
      clienteNome: row.cliente_nome,
      numeroContrato: row.numero_contrato,
      instituicaoFinanceira: row.instituicao_financeira,
      valorContrato: row.valor_contrato ?? undefined,
      calculoId: row.calculo_id ?? undefined,
      dataUltimaEdicao: row.data_ultima_edicao,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      criadoPor: row.criado_por,
      ativo: row.ativo,
      excluido: row.excluido,
      excluidoEm: row.excluido_em,
      excluidoPor: row.excluido_por,
    };
  }

  private mapRowToListItem(row: PeticaoRow): PeticaoListItem {
    return {
      id: row.id,
      name: row.nome,
      type: row.tipo,
      lastEdit: new Date(row.data_ultima_edicao).toLocaleDateString('pt-BR'),
      status: row.status,
    };
  }

  // ========== CREATE ==========

  async create(data: {
    nome: string;
    tipo: string;
    status?: string;
    conteudo: string;
    modelo?: string;
    clienteNome?: string;
    numeroContrato?: string;
    instituicaoFinanceira?: string;
    valorContrato?: number;
    calculoId?: string;
  }): Promise<Peticao> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Usuário não autenticado');

    const insertData: PeticaoInsert = {
      nome: data.nome,
      tipo: data.tipo,
      status: data.status || 'Rascunho',
      conteudo: data.conteudo,
      modelo: data.modelo || null,
      cliente_nome: data.clienteNome || null,
      numero_contrato: data.numeroContrato || null,
      instituicao_financeira: data.instituicaoFinanceira || null,
      valor_contrato: data.valorContrato || null,
      calculo_id: data.calculoId || null,
      criado_por: user.id,
      data_ultima_edicao: new Date().toISOString(),
    };

    const { data: peticao, error } = await supabase
      .from('peticoes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar petição:', error);
      throw new Error(`Erro ao criar petição: ${error.message}`);
    }

    return this.mapRowToPeticao(peticao);
  }

  // ========== READ ==========

  async getAll(): Promise<PeticaoListItem[]> {
    const { data, error } = await supabase
      .from('peticoes')
      .select('*')
      .eq('excluido', false)
      .neq('modelo', 'custom') // Filtrar modelos customizados (permite null e outros valores)
      .order('data_ultima_edicao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar petições:', error);
      throw new Error(`Erro ao buscar petições: ${error.message}`);
    }

    return data.map(row => this.mapRowToListItem(row));
  }

  async getById(id: string): Promise<Peticao | null> {
    const { data, error } = await supabase
      .from('peticoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Erro ao buscar petição:', error);
      throw new Error(`Erro ao buscar petição: ${error.message}`);
    }

    return this.mapRowToPeticao(data);
  }

  async getModelosCustomizados(): Promise<Array<{ id: string; nome: string; tipo: string; conteudo: string }>> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('peticoes')
      .select('id, nome, tipo, conteudo')
      .eq('modelo', 'custom')
      .eq('excluido', false)
      .eq('criado_por', user.id)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar modelos customizados:', error);
      throw new Error(`Erro ao buscar modelos: ${error.message}`);
    }

    return data || [];
  }

  // ========== UPDATE ==========

  async update(
    id: string,
    data: {
      nome?: string;
      tipo?: string;
      status?: string;
      conteudo?: string;
      modelo?: string;
      clienteNome?: string;
      numeroContrato?: string;
      instituicaoFinanceira?: string;
      valorContrato?: number;
    }
  ): Promise<Peticao> {
    const updateData: PeticaoUpdate = {
      ...(data.nome && { nome: data.nome }),
      ...(data.tipo && { tipo: data.tipo }),
      ...(data.status && { status: data.status }),
      ...(data.conteudo && { conteudo: data.conteudo }),
      ...(data.modelo !== undefined && { modelo: data.modelo }),
      ...(data.clienteNome !== undefined && { cliente_nome: data.clienteNome }),
      ...(data.numeroContrato !== undefined && { numero_contrato: data.numeroContrato }),
      ...(data.instituicaoFinanceira !== undefined && { instituicao_financeira: data.instituicaoFinanceira }),
      ...(data.valorContrato !== undefined && { valor_contrato: data.valorContrato }),
      data_ultima_edicao: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: peticao, error } = await supabase
      .from('peticoes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar petição:', error);
      throw new Error(`Erro ao atualizar petição: ${error.message}`);
    }

    return this.mapRowToPeticao(peticao);
  }

  // ========== DELETE ==========

  async softDelete(id: string): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('peticoes')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString(),
        excluido_por: user.id,
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir petição:', error);
      throw new Error(`Erro ao excluir petição: ${error.message}`);
    }
  }

  // Hard delete - Exclusão permanente
  async delete(id: string): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('peticoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir petição:', error);
      throw new Error(`Erro ao excluir petição: ${error.message}`);
    }
  }
}

// Singleton instance
export const peticoesService = new PeticoesService();
