/**
 * Type overrides para tabelas V2 (Calendar/Tasks)
 * Este arquivo contém extensões de tipos que serão mescladas com o database.types.ts
 * quando os types forem regenerados pelo Supabase CLI
 */

import type { Database } from './database.types';

// =====================================================
// EVENT CATEGORIES (Migration 003)
// =====================================================

export interface EventCategory {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  is_all_day: boolean;
  default_duration_minutes: number;
  is_system: boolean;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCategoryInsert {
  organization_id?: string;
  name: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  is_all_day?: boolean;
  default_duration_minutes?: number;
  is_system?: boolean;
  ordem?: number;
  ativo?: boolean;
}

export interface EventCategoryUpdate {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  is_all_day?: boolean;
  default_duration_minutes?: number;
  ordem?: number;
  ativo?: boolean;
}

// =====================================================
// TAREFAS V2 (Migration 004)
// =====================================================

export interface TarefaV2Row {
  // Campos originais
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  status: string;
  prioridade: string;
  responsavel_id: string;
  criado_por: string | null;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  
  // V2: Categoria
  category_id: string | null;
  cor: string | null;
  
  // V2: Datas com hora
  data_inicio: string | null;
  data_fim: string | null;
  is_all_day: boolean;
  
  // V2: Recorrência
  recorrente: boolean;
  recorrencia_tipo: 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'anual' | null;
  recorrencia_fim: string | null;
  recorrencia_parent_id: string | null;
  
  // Relacionamentos
  contato_id: string | null;
  oportunidade_id: string | null;
  caso_id: string | null;
  projeto_id: string | null;
  tarefa_pai_id: string | null;
  
  // Outros campos existentes
  data_vencimento: string | null;
  data_conclusao: string | null;
  duracao_estimada: number | null;
  tempo_gasto: number | null;
  lembrete_antecedencia: number | null;
  lembrete_enviado: boolean;
  checklist: any;
  progresso: number;
  tags: string[] | null;
  anexos: any;
  observacoes: string | null;
  ordem: number;
  participantes_ids: string[] | null;
}

// =====================================================
// SUPABASE TABLE OVERRIDES
// Usar com: supabase.from('event_categories') as unknown as SupabaseClient<EventCategoriesTable>
// =====================================================

export type EventCategoriesTable = {
  event_categories: {
    Row: EventCategory;
    Insert: EventCategoryInsert;
    Update: EventCategoryUpdate;
    Relationships: [];
  };
};

export type TarefasV2Table = {
  tarefas: {
    Row: TarefaV2Row;
    Insert: Partial<TarefaV2Row> & { titulo: string; responsavel_id: string };
    Update: Partial<TarefaV2Row>;
    Relationships: [];
  };
};
