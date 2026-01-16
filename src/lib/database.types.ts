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
            analises_previas: {
                Row: {
                    arquivos_anexos: Json | null
                    conclusao_analise: string | null
                    created_at: string | null
                    data_analise: string | null
                    id: string
                    lead_id: string | null
                    observacoes: string | null
                    resultado_preliminar: Json | null
                    status: string | null
                    tipo_analise: string | null
                    updated_at: string | null
                    usuario_id: string | null
                    valor_estimado_causa: number | null
                }
                Insert: {
                    arquivos_anexos?: Json | null
                    conclusao_analise?: string | null
                    created_at?: string | null
                    data_analise?: string | null
                    id?: string
                    lead_id?: string | null
                    observacoes?: string | null
                    resultado_preliminar?: Json | null
                    status?: string | null
                    tipo_analise?: string | null
                    updated_at?: string | null
                    usuario_id?: string | null
                    valor_estimado_causa?: number | null
                }
                Update: {
                    arquivos_anexos?: Json | null
                    conclusao_analise?: string | null
                    created_at?: string | null
                    data_analise?: string | null
                    id?: string
                    lead_id?: string | null
                    observacoes?: string | null
                    resultado_preliminar?: Json | null
                    status?: string | null
                    tipo_analise?: string | null
                    updated_at?: string | null
                    usuario_id?: string | null
                    valor_estimado_causa?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "analises_previas_lead_id_fkey"
                        columns: ["lead_id"]
                        isOneToOne: false
                        referencedRelation: "leads"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_document_settings: {
                Row: {
                    id: string
                    user_id: string
                    logo_url: string | null
                    watermark_url: string | null
                    watermark_opacity: number | null
                    primary_color: string | null
                    secondary_color: string | null
                    footer_text: string | null
                    show_page_numbers: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string
                    logo_url?: string | null
                    watermark_url?: string | null
                    watermark_opacity?: number | null
                    primary_color?: string | null
                    secondary_color?: string | null
                    footer_text?: string | null
                    show_page_numbers?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    logo_url?: string | null
                    watermark_url?: string | null
                    watermark_opacity?: number | null
                    primary_color?: string | null
                    secondary_color?: string | null
                    footer_text?: string | null
                    show_page_numbers?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_document_settings_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            calculations: {
                Row: {
                    calculation_result: Json | null
                    created_at: string | null
                    id: string
                    input_data: Json | null
                    module_type: string | null
                    status: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    calculation_result?: Json | null
                    created_at?: string | null
                    id?: string
                    input_data?: Json | null
                    module_type?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    calculation_result?: Json | null
                    created_at?: string | null
                    id?: string
                    input_data?: Json | null
                    module_type?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            contratos_revisionais: {
                Row: {
                    id: string
                    user_id: string
                    lead_id: string | null
                    modulo: Database["public"]["Enums"]["modulo_calculo"]
                    status: Database["public"]["Enums"]["status_contrato"]
                    dados_step1: Json | null
                    dados_step2: Json | null
                    dados_step3: Json | null
                    nome_referencia: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    lead_id?: string | null
                    modulo: Database["public"]["Enums"]["modulo_calculo"]
                    status?: Database["public"]["Enums"]["status_contrato"]
                    dados_step1?: Json | null
                    dados_step2?: Json | null
                    dados_step3?: Json | null
                    nome_referencia?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    lead_id?: string | null
                    modulo?: Database["public"]["Enums"]["modulo_calculo"]
                    status?: Database["public"]["Enums"]["status_contrato"]
                    dados_step1?: Json | null
                    dados_step2?: Json | null
                    dados_step3?: Json | null
                    nome_referencia?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            resultado_analise_previa: {
                Row: {
                    id: string
                    contrato_id: string
                    taxa_contrato: number | null
                    taxa_media_bacen: number | null
                    sobretaxa_percentual: number | null
                    economia_estimada: number | null
                    nova_parcela_estimada: number | null
                    classificacao: Database["public"]["Enums"]["classificacao_viabilidade"] | null
                    detalhes_calculo: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    contrato_id: string
                    taxa_contrato?: number | null
                    taxa_media_bacen?: number | null
                    sobretaxa_percentual?: number | null
                    economia_estimada?: number | null
                    nova_parcela_estimada?: number | null
                    classificacao?: Database["public"]["Enums"]["classificacao_viabilidade"] | null
                    detalhes_calculo?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    contrato_id?: string
                    taxa_contrato?: number | null
                    taxa_media_bacen?: number | null
                    sobretaxa_percentual?: number | null
                    economia_estimada?: number | null
                    nova_parcela_estimada?: number | null
                    classificacao?: Database["public"]["Enums"]["classificacao_viabilidade"] | null
                    detalhes_calculo?: Json | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "resultado_analise_previa_contrato_id_fkey"
                        columns: ["contrato_id"]
                        isOneToOne: false
                        referencedRelation: "contratos_revisionais"
                        referencedColumns: ["id"]
                    }
                ]
            }
            ocr_field_configs: {
                Row: {
                    id: string
                    user_id: string
                    category: Database["public"]["Enums"]["ocr_category"]
                    field_key: string
                    field_label: string
                    field_type: string
                    is_required: boolean
                    is_enabled: boolean
                    extraction_hint: string | null
                    display_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category: Database["public"]["Enums"]["ocr_category"]
                    field_key: string
                    field_label: string
                    field_type?: string
                    is_required?: boolean
                    is_enabled?: boolean
                    extraction_hint?: string | null
                    display_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category?: Database["public"]["Enums"]["ocr_category"]
                    field_key?: string
                    field_label?: string
                    field_type?: string
                    is_required?: boolean
                    is_enabled?: boolean
                    extraction_hint?: string | null
                    display_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            ocr_logs: {
                Row: {
                    id: string
                    user_id: string
                    file_name: string
                    file_size_bytes: number | null
                    file_type: string | null
                    category: Database["public"]["Enums"]["ocr_category"]
                    provider_used: Database["public"]["Enums"]["ocr_provider"]
                    status: Database["public"]["Enums"]["ocr_status"]
                    extracted_data: Json | null
                    missing_fields: string[] | null
                    execution_time_ms: number | null
                    tokens_input: number | null
                    tokens_output: number | null
                    error_message: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    file_name: string
                    file_size_bytes?: number | null
                    file_type?: string | null
                    category: Database["public"]["Enums"]["ocr_category"]
                    provider_used: Database["public"]["Enums"]["ocr_provider"]
                    status: Database["public"]["Enums"]["ocr_status"]
                    extracted_data?: Json | null
                    missing_fields?: string[] | null
                    execution_time_ms?: number | null
                    tokens_input?: number | null
                    tokens_output?: number | null
                    error_message?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    file_name?: string
                    file_size_bytes?: number | null
                    file_type?: string | null
                    category?: Database["public"]["Enums"]["ocr_category"]
                    provider_used?: Database["public"]["Enums"]["ocr_provider"]
                    status?: Database["public"]["Enums"]["ocr_status"]
                    extracted_data?: Json | null
                    missing_fields?: string[] | null
                    execution_time_ms?: number | null
                    tokens_input?: number | null
                    tokens_output?: number | null
                    error_message?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            ocr_settings: {
                Row: {
                    id: string
                    user_id: string
                    gemini_api_key_encrypted: string | null
                    gemini_model: string
                    gemini_enabled: boolean
                    mistral_api_key_encrypted: string | null
                    mistral_model: string
                    mistral_enabled: boolean
                    fallback_enabled: boolean
                    timeout_seconds: number
                    additional_context_emprestimos: string | null
                    additional_context_imobiliario: string | null
                    additional_context_cartao: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    gemini_api_key_encrypted?: string | null
                    gemini_model?: string
                    gemini_enabled?: boolean
                    mistral_api_key_encrypted?: string | null
                    mistral_model?: string
                    mistral_enabled?: boolean
                    fallback_enabled?: boolean
                    timeout_seconds?: number
                    additional_context_emprestimos?: string | null
                    additional_context_imobiliario?: string | null
                    additional_context_cartao?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    gemini_api_key_encrypted?: string | null
                    gemini_model?: string
                    gemini_enabled?: boolean
                    mistral_api_key_encrypted?: string | null
                    mistral_model?: string
                    mistral_enabled?: boolean
                    fallback_enabled?: boolean
                    timeout_seconds?: number
                    additional_context_emprestimos?: string | null
                    additional_context_imobiliario?: string | null
                    additional_context_cartao?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            emprestimos: {
                Row: {
                    created_at: string | null
                    data_contrato: string | null
                    id: string
                    lead_id: string | null
                    numero_contrato: string | null
                    prazo_meses: number | null
                    status: string | null
                    taxa_juros_anual: number | null
                    taxa_juros_mensal: number | null
                    tipo_emprestimo: string | null
                    updated_at: string | null
                    valor_financiado: number | null
                    valor_parcela: number | null
                }
                Insert: {
                    created_at?: string | null
                    data_contrato?: string | null
                    id?: string
                    lead_id?: string | null
                    numero_contrato?: string | null
                    prazo_meses?: number | null
                    status?: string | null
                    taxa_juros_anual?: number | null
                    taxa_juros_mensal?: number | null
                    tipo_emprestimo?: string | null
                    updated_at?: string | null
                    valor_financiado?: number | null
                    valor_parcela?: number | null
                }
                Update: {
                    created_at?: string | null
                    data_contrato?: string | null
                    id?: string
                    lead_id?: string | null
                    numero_contrato?: string | null
                    prazo_meses?: number | null
                    status?: string | null
                    taxa_juros_anual?: number | null
                    taxa_juros_mensal?: number | null
                    tipo_emprestimo?: string | null
                    updated_at?: string | null
                    valor_financiado?: number | null
                    valor_parcela?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "emprestimos_lead_id_fkey"
                        columns: ["lead_id"]
                        isOneToOne: false
                        referencedRelation: "leads"
                        referencedColumns: ["id"]
                    },
                ]
            }
            leads: {
                Row: {
                    arquivos: Json | null
                    cpf: string | null
                    created_at: string | null
                    email: string | null
                    etapa_funil: string | null
                    id: string
                    nome: string | null
                    observacoes: string | null
                    origem: string | null
                    responsavel_id: string | null
                    telefone: string | null
                    updated_at: string | null
                }
                Insert: {
                    arquivos?: Json | null
                    cpf?: string | null
                    created_at?: string | null
                    email?: string | null
                    etapa_funil?: string | null
                    id?: string
                    nome?: string | null
                    observacoes?: string | null
                    origem?: string | null
                    responsavel_id?: string | null
                    telefone?: string | null
                    updated_at?: string | null
                }
                Update: {
                    arquivos?: Json | null
                    cpf?: string | null
                    created_at?: string | null
                    email?: string | null
                    etapa_funil?: string | null
                    id?: string
                    nome?: string | null
                    observacoes?: string | null
                    origem?: string | null
                    responsavel_id?: string | null
                    telefone?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            taxas_bacen_historico: {
                Row: {
                    ano_mes: string
                    created_at: string | null
                    id: string
                    serie_bacen: string
                    taxa_mensal_percent: number
                }
                Insert: {
                    ano_mes: string
                    created_at?: string | null
                    id?: string
                    serie_bacen: string
                    taxa_mensal_percent: number
                }
                Update: {
                    ano_mes?: string
                    created_at?: string | null
                    id?: string
                    serie_bacen?: string
                    taxa_mensal_percent?: number
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            ocr_category: "EMPRESTIMOS_VEICULOS" | "IMOBILIARIO" | "CARTAO_CREDITO"
            ocr_provider: "GEMINI" | "MISTRAL"
            ocr_status: "SUCCESS" | "PARTIAL" | "FAILED" | "TIMEOUT"
            modulo_calculo: "GERAL" | "IMOBILIARIO" | "CARTAO"
            status_contrato: "RASCUNHO" | "ANALISE_PREVIA" | "ANALISE_DETALHADA" | "ARQUIVADO"
            classificacao_viabilidade: "VIAVEL" | "ATENCAO" | "INVIAVEL"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
