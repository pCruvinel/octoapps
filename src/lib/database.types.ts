export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome_completo: string | null
          avatar_url: string | null
          telefone: string | null
          cargo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome_completo?: string | null
          avatar_url?: string | null
          telefone?: string | null
          cargo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_completo?: string | null
          avatar_url?: string | null
          telefone?: string | null
          cargo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string
        }
      }
      contatos: {
        Row: {
          id: string
          nome: string
          email: string | null
          telefone: string | null
          cpf_cnpj: string | null
          tipo: string
          endereco: Json | null
          observacoes: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email?: string | null
          telefone?: string | null
          cpf_cnpj?: string | null
          tipo?: string
          endereco?: Json | null
          observacoes?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string | null
          telefone?: string | null
          cpf_cnpj?: string | null
          tipo?: string
          endereco?: Json | null
          observacoes?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      oportunidades: {
        Row: {
          id: string
          titulo: string
          contato_id: string
          valor_estimado: number | null
          estagio: string
          probabilidade: number | null
          data_fechamento_prevista: string | null
          descricao: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          contato_id: string
          valor_estimado?: number | null
          estagio?: string
          probabilidade?: number | null
          data_fechamento_prevista?: string | null
          descricao?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          contato_id?: string
          valor_estimado?: number | null
          estagio?: string
          probabilidade?: number | null
          data_fechamento_prevista?: string | null
          descricao?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tarefas: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          status: string
          prioridade: string
          data_vencimento: string | null
          contato_id: string | null
          oportunidade_id: string | null
          projeto_id: string | null
          responsavel_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          status?: string
          prioridade?: string
          data_vencimento?: string | null
          contato_id?: string | null
          oportunidade_id?: string | null
          projeto_id?: string | null
          responsavel_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          status?: string
          prioridade?: string
          data_vencimento?: string | null
          contato_id?: string | null
          oportunidade_id?: string | null
          projeto_id?: string | null
          responsavel_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      notificacoes: {
        Row: {
          id: string
          user_id: string
          tipo: string
          titulo: string
          mensagem: string
          lida: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo: string
          titulo: string
          mensagem: string
          lida?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tipo?: string
          titulo?: string
          mensagem?: string
          lida?: boolean
          link?: string | null
          created_at?: string
        }
      }
      // Add more tables as needed
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
