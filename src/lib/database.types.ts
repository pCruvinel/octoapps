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
      projetos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          status: string
          data_inicio: string | null
          data_fim: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      financiamentos: {
        Row: {
          id: string
          contato_id: string | null
          projeto_id: string | null
          credor: string
          devedor: string
          contrato_num: string | null
          numero_processo: string | null
          tipo_contrato: 'CCB' | 'Financiamento' | 'SAC' | 'PRICE' | null
          valor_bem: number | null
          entrada: number | null
          valor_financiado: number
          quantidade_parcelas: number
          data_primeira_parcela: string
          data_contrato: string | null
          sistema_amortizacao: 'SAC' | 'PRICE' | 'GAUSS' | 'MQJS' | 'SAC-JUROS-SIMPLES'
          indice_correcao: 'TR' | 'IPCA' | 'INPC' | 'IGP-M' | 'INCC'
          taxa_mensal_contrato: number
          taxa_anual_contrato: number | null
          taxa_mensal_mercado: number
          mip_primeira_parcela: number | null
          dfi_primeira_parcela: number | null
          tca_primeira_parcela: number | null
          multa_primeira_parcela: number | null
          mora_primeira_parcela: number | null
          horizonte_meses: number | null
          data_calculo: string | null
          status: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado'
          taxa_contrato_am: number | null
          taxa_mercado_am: number | null
          sobretaxa_pp: number | null
          valor_total_pago: number | null
          valor_total_devido: number | null
          diferenca_restituicao: number | null
          calculado_por: string | null
          revisado_por: string | null
          observacoes: string | null
          data_criacao: string
          data_atualizacao: string
          data_revisao: string | null
          criado_por: string | null
          ativo: boolean
          excluido: boolean
          excluido_em: string | null
          excluido_por: string | null
        }
        Insert: {
          id?: string
          contato_id?: string | null
          projeto_id?: string | null
          credor: string
          devedor: string
          contrato_num?: string | null
          numero_processo?: string | null
          tipo_contrato?: 'CCB' | 'Financiamento' | 'SAC' | 'PRICE' | null
          valor_bem?: number | null
          entrada?: number | null
          valor_financiado: number
          quantidade_parcelas: number
          data_primeira_parcela: string
          data_contrato?: string | null
          sistema_amortizacao?: 'SAC' | 'PRICE' | 'GAUSS' | 'MQJS' | 'SAC-JUROS-SIMPLES'
          indice_correcao?: 'TR' | 'IPCA' | 'INPC' | 'IGP-M' | 'INCC'
          taxa_mensal_contrato: number
          taxa_anual_contrato?: number | null
          taxa_mensal_mercado: number
          mip_primeira_parcela?: number | null
          dfi_primeira_parcela?: number | null
          tca_primeira_parcela?: number | null
          multa_primeira_parcela?: number | null
          mora_primeira_parcela?: number | null
          horizonte_meses?: number | null
          data_calculo?: string | null
          status?: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado'
          taxa_contrato_am?: number | null
          taxa_mercado_am?: number | null
          sobretaxa_pp?: number | null
          valor_total_pago?: number | null
          valor_total_devido?: number | null
          diferenca_restituicao?: number | null
          calculado_por?: string | null
          revisado_por?: string | null
          observacoes?: string | null
          data_criacao?: string
          data_atualizacao?: string
          data_revisao?: string | null
          criado_por?: string | null
          ativo?: boolean
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
        }
        Update: {
          id?: string
          contato_id?: string | null
          projeto_id?: string | null
          credor?: string
          devedor?: string
          contrato_num?: string | null
          numero_processo?: string | null
          tipo_contrato?: 'CCB' | 'Financiamento' | 'SAC' | 'PRICE' | null
          valor_bem?: number | null
          entrada?: number | null
          valor_financiado?: number
          quantidade_parcelas?: number
          data_primeira_parcela?: string
          data_contrato?: string | null
          sistema_amortizacao?: 'SAC' | 'PRICE' | 'GAUSS' | 'MQJS' | 'SAC-JUROS-SIMPLES'
          indice_correcao?: 'TR' | 'IPCA' | 'INPC' | 'IGP-M' | 'INCC'
          taxa_mensal_contrato?: number
          taxa_anual_contrato?: number | null
          taxa_mensal_mercado?: number
          mip_primeira_parcela?: number | null
          dfi_primeira_parcela?: number | null
          tca_primeira_parcela?: number | null
          multa_primeira_parcela?: number | null
          mora_primeira_parcela?: number | null
          horizonte_meses?: number | null
          data_calculo?: string | null
          status?: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado'
          taxa_contrato_am?: number | null
          taxa_mercado_am?: number | null
          sobretaxa_pp?: number | null
          valor_total_pago?: number | null
          valor_total_devido?: number | null
          diferenca_restituicao?: number | null
          calculado_por?: string | null
          revisado_por?: string | null
          observacoes?: string | null
          data_criacao?: string
          data_atualizacao?: string
          data_revisao?: string | null
          criado_por?: string | null
          ativo?: boolean
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
        }
      }
      financiamentos_amortizacao: {
        Row: {
          id: string
          financiamento_id: string
          mes: number
          data: string
          valor_original_parcela: number
          valor_corrigido: number
          juros: number
          amortizacao: number
          saldo_devedor: number
          mip: number | null
          dfi: number | null
          tca: number | null
          multa: number | null
          mora: number | null
          total_pago: number | null
          diferenca: number | null
          cenario: 'AP01' | 'AP05' | 'AP03'
          criado_em: string
        }
        Insert: {
          id?: string
          financiamento_id: string
          mes: number
          data: string
          valor_original_parcela: number
          valor_corrigido: number
          juros: number
          amortizacao: number
          saldo_devedor: number
          mip?: number | null
          dfi?: number | null
          tca?: number | null
          multa?: number | null
          mora?: number | null
          total_pago?: number | null
          diferenca?: number | null
          cenario: 'AP01' | 'AP05' | 'AP03'
          criado_em?: string
        }
        Update: {
          id?: string
          financiamento_id?: string
          mes?: number
          data?: string
          valor_original_parcela?: number
          valor_corrigido?: number
          juros?: number
          amortizacao?: number
          saldo_devedor?: number
          mip?: number | null
          dfi?: number | null
          tca?: number | null
          multa?: number | null
          mora?: number | null
          total_pago?: number | null
          diferenca?: number | null
          cenario?: 'AP01' | 'AP05' | 'AP03'
          criado_em?: string
        }
      }
      financiamentos_historico: {
        Row: {
          id: string
          financiamento_id: string
          versao: number
          dados_anteriores: Json
          dados_novos: Json
          campos_alterados: string[]
          motivo_alteracao: string | null
          alterado_por: string | null
          data_alteracao: string
        }
        Insert: {
          id?: string
          financiamento_id: string
          versao: number
          dados_anteriores: Json
          dados_novos: Json
          campos_alterados?: string[]
          motivo_alteracao?: string | null
          alterado_por?: string | null
          data_alteracao?: string
        }
        Update: {
          id?: string
          financiamento_id?: string
          versao?: number
          dados_anteriores?: Json
          dados_novos?: Json
          campos_alterados?: string[]
          motivo_alteracao?: string | null
          alterado_por?: string | null
          data_alteracao?: string
        }
      }
      cartoes_credito: {
        Row: {
          id: string
          contato_id: string | null
          projeto_id: string | null
          credor: string
          devedor: string
          numero_cartao: string | null
          numero_processo: string | null
          limite_total: number | null
          limite_disponivel: number | null
          saldo_devedor: number
          saldo_anterior: number | null
          saldo_financiado: number | null
          data_inicio_analise: string | null
          data_ultima_fatura: string | null
          data_pagamento: string | null
          dia_vencimento: number | null
          data_calculo: string
          total_fatura: number | null
          pagamento_minimo: number | null
          consumos_despesas: number | null
          parcelamentos: Json
          saques_especie: Json
          estornos_ajustes: Json
          renegociacoes: Json
          juros_remuneratorios_atraso: number | null
          juros_rotativo: number
          taxa_juros_parcelamento: number | null
          juros_mora: number | null
          multa_inadimplencia: number | null
          cet_mensal: number | null
          cet_anual: number | null
          anuidade: number
          seguro: number
          iof: number
          tarifas: number
          outras_tarifas: Json
          dies_mora: number
          total_juros_cobrado: number | null
          total_juros_devido: number | null
          diferenca_restituicao: number | null
          taxa_efetiva_mensal: number | null
          taxa_efetiva_anual: number | null
          valor_total_pago: number | null
          valor_total_devido: number | null
          percentual_sobretaxa: number | null
          anatocismo_detectado: boolean
          encargos_abusivos: string[]
          status: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado'
          observacoes: string | null
          criado_por: string | null
          calculado_por: string | null
          revisado_por: string | null
          data_criacao: string
          data_atualizacao: string
          data_revisao: string | null
          ativo: boolean
          excluido: boolean
          excluido_em: string | null
          excluido_por: string | null
        }
        Insert: {
          id?: string
          contato_id?: string | null
          projeto_id?: string | null
          credor: string
          devedor: string
          numero_cartao?: string | null
          numero_processo?: string | null
          limite_total?: number | null
          limite_disponivel?: number | null
          saldo_devedor: number
          saldo_anterior?: number | null
          saldo_financiado?: number | null
          data_inicio_analise?: string | null
          data_ultima_fatura?: string | null
          data_pagamento?: string | null
          dia_vencimento?: number | null
          data_calculo?: string
          total_fatura?: number | null
          pagamento_minimo?: number | null
          consumos_despesas?: number | null
          parcelamentos?: Json
          saques_especie?: Json
          estornos_ajustes?: Json
          renegociacoes?: Json
          juros_remuneratorios_atraso?: number | null
          juros_rotativo: number
          taxa_juros_parcelamento?: number | null
          juros_mora?: number | null
          multa_inadimplencia?: number | null
          cet_mensal?: number | null
          cet_anual?: number | null
          anuidade?: number
          seguro?: number
          iof?: number
          tarifas?: number
          outras_tarifas?: Json
          dies_mora?: number
          total_juros_cobrado?: number | null
          total_juros_devido?: number | null
          diferenca_restituicao?: number | null
          taxa_efetiva_mensal?: number | null
          taxa_efetiva_anual?: number | null
          valor_total_pago?: number | null
          valor_total_devido?: number | null
          percentual_sobretaxa?: number | null
          anatocismo_detectado?: boolean
          encargos_abusivos?: string[]
          status?: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado'
          observacoes?: string | null
          criado_por?: string | null
          calculado_por?: string | null
          revisado_por?: string | null
          data_criacao?: string
          data_atualizacao?: string
          data_revisao?: string | null
          ativo?: boolean
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
        }
        Update: {
          id?: string
          contato_id?: string | null
          projeto_id?: string | null
          credor?: string
          devedor?: string
          numero_cartao?: string | null
          numero_processo?: string | null
          limite_total?: number | null
          limite_disponivel?: number | null
          saldo_devedor?: number
          saldo_anterior?: number | null
          saldo_financiado?: number | null
          data_inicio_analise?: string | null
          data_ultima_fatura?: string | null
          data_pagamento?: string | null
          dia_vencimento?: number | null
          data_calculo?: string
          total_fatura?: number | null
          pagamento_minimo?: number | null
          consumos_despesas?: number | null
          parcelamentos?: Json
          saques_especie?: Json
          estornos_ajustes?: Json
          renegociacoes?: Json
          juros_remuneratorios_atraso?: number | null
          juros_rotativo?: number
          taxa_juros_parcelamento?: number | null
          juros_mora?: number | null
          multa_inadimplencia?: number | null
          cet_mensal?: number | null
          cet_anual?: number | null
          anuidade?: number
          seguro?: number
          iof?: number
          tarifas?: number
          outras_tarifas?: Json
          dies_mora?: number
          total_juros_cobrado?: number | null
          total_juros_devido?: number | null
          diferenca_restituicao?: number | null
          taxa_efetiva_mensal?: number | null
          taxa_efetiva_anual?: number | null
          valor_total_pago?: number | null
          valor_total_devido?: number | null
          percentual_sobretaxa?: number | null
          anatocismo_detectado?: boolean
          encargos_abusivos?: string[]
          status?: 'Rascunho' | 'Em Análise' | 'Concluído' | 'Arquivado'
          observacoes?: string | null
          criado_por?: string | null
          calculado_por?: string | null
          revisado_por?: string | null
          data_criacao?: string
          data_atualizacao?: string
          data_revisao?: string | null
          ativo?: boolean
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
        }
      }
      cartoes_faturas: {
        Row: {
          id: string
          cartao_id: string
          mes_referencia: number
          ano_referencia: number
          data_vencimento: string
          data_fechamento: string | null
          saldo_anterior: number
          compras_nacionais: number
          compras_internacionais: number
          saques: number
          juros_rotativo: number
          juros_parcelamento: number
          juros_mora: number
          multa: number
          iof: number
          anuidade: number
          seguros: number
          tarifas: number
          estornos: number
          pagamentos: number
          total_fatura: number
          pagamento_minimo: number
          status_pagamento: 'Pendente' | 'Pago Integral' | 'Pago Parcial' | 'Não Pago' | 'Em Atraso'
          valor_pago: number | null
          data_pagamento: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          cartao_id: string
          mes_referencia: number
          ano_referencia: number
          data_vencimento: string
          data_fechamento?: string | null
          saldo_anterior: number
          compras_nacionais?: number
          compras_internacionais?: number
          saques?: number
          juros_rotativo?: number
          juros_parcelamento?: number
          juros_mora?: number
          multa?: number
          iof?: number
          anuidade?: number
          seguros?: number
          tarifas?: number
          estornos?: number
          pagamentos?: number
          total_fatura: number
          pagamento_minimo: number
          status_pagamento?: 'Pendente' | 'Pago Integral' | 'Pago Parcial' | 'Não Pago' | 'Em Atraso'
          valor_pago?: number | null
          data_pagamento?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          cartao_id?: string
          mes_referencia?: number
          ano_referencia?: number
          data_vencimento?: string
          data_fechamento?: string | null
          saldo_anterior?: number
          compras_nacionais?: number
          compras_internacionais?: number
          saques?: number
          juros_rotativo?: number
          juros_parcelamento?: number
          juros_mora?: number
          multa?: number
          iof?: number
          anuidade?: number
          seguros?: number
          tarifas?: number
          estornos?: number
          pagamentos?: number
          total_fatura?: number
          pagamento_minimo?: number
          status_pagamento?: 'Pendente' | 'Pago Integral' | 'Pago Parcial' | 'Não Pago' | 'Em Atraso'
          valor_pago?: number | null
          data_pagamento?: string | null
          criado_em?: string
        }
      }
      peticoes: {
        Row: {
          id: string
          nome: string
          tipo: string
          status: string
          conteudo: string
          modelo: string | null
          cliente_nome: string | null
          numero_contrato: string | null
          instituicao_financeira: string | null
          valor_contrato: number | null
          calculo_id: string | null
          data_ultima_edicao: string
          created_at: string
          updated_at: string
          criado_por: string
          ativo: boolean
          excluido: boolean
          excluido_em: string | null
          excluido_por: string | null
        }
        Insert: {
          id?: string
          nome: string
          tipo: string
          status?: string
          conteudo: string
          modelo?: string | null
          cliente_nome?: string | null
          numero_contrato?: string | null
          instituicao_financeira?: string | null
          valor_contrato?: number | null
          calculo_id?: string | null
          data_ultima_edicao?: string
          created_at?: string
          updated_at?: string
          criado_por: string
          ativo?: boolean
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
        }
        Update: {
          nome?: string
          tipo?: string
          status?: string
          conteudo?: string
          modelo?: string | null
          cliente_nome?: string | null
          numero_contrato?: string | null
          instituicao_financeira?: string | null
          valor_contrato?: number | null
          calculo_id?: string | null
          data_ultima_edicao?: string
          updated_at?: string
          ativo?: boolean
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
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
