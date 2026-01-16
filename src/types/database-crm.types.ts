export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      oportunidades: {
        Row: {
          id: string
          titulo: string
          contato_id: string | null
          tipo_acao: string | null
          estagio: string | null
          valor_estimado: number | null
          valor_causa: number | null
          valor_proposta: number | null
          probabilidade: number | null
          origem: string | null
          responsavel_id: string | null
          data_fechamento_prevista: string | null
          data_fechamento_real: string | null
          motivo_perda: string | null
          ordem: number | null
          tags: string[] | null
          observacoes: string | null
          ativo: boolean | null
          data_criacao: string | null
          data_atualizacao: string | null
          criado_por: string | null
          etapa_funil_id: string | null
          produto_servico_id: string | null
        }
        Insert: {
          id?: string
          titulo: string
          contato_id?: string | null
          tipo_acao?: string | null
          estagio?: string | null
          valor_estimado?: number | null
          valor_causa?: number | null
          valor_proposta?: number | null
          probabilidade?: number | null
          origem?: string | null
          responsavel_id?: string | null
          data_fechamento_prevista?: string | null
          data_fechamento_real?: string | null
          motivo_perda?: string | null
          ordem?: number | null
          tags?: string[] | null
          observacoes?: string | null
          ativo?: boolean | null
          data_criacao?: string | null
          data_atualizacao?: string | null
          criado_por?: string | null
          etapa_funil_id?: string | null
          produto_servico_id?: string | null
        }
        Update: {
          id?: string
          titulo?: string
          contato_id?: string | null
          tipo_acao?: string | null
          estagio?: string | null
          valor_estimado?: number | null
          valor_causa?: number | null
          valor_proposta?: number | null
          probabilidade?: number | null
          origem?: string | null
          responsavel_id?: string | null
          data_fechamento_prevista?: string | null
          data_fechamento_real?: string | null
          motivo_perda?: string | null
          ordem?: number | null
          tags?: string[] | null
          observacoes?: string | null
          ativo?: boolean | null
          data_criacao?: string | null
          data_atualizacao?: string | null
          criado_por?: string | null
          etapa_funil_id?: string | null
          produto_servico_id?: string | null
        }
        Relationships: []
      }
      // ... other tables will remain typed as 'any' 
      // Full types should be regenerated when dev server is stopped
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
