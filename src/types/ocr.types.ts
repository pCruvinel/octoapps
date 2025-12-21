import { Database } from '../lib/database.types';

export type OCRCategory = Database['public']['Enums']['ocr_category'];
export type OCRProvider = Database['public']['Enums']['ocr_provider'];
export type OCRStatus = Database['public']['Enums']['ocr_status'];

export interface OCRSettings {
    id: string;
    user_id: string;
    gemini_api_key_encrypted?: string | null;
    gemini_model: string;
    gemini_enabled: boolean;
    mistral_api_key_encrypted?: string | null;
    mistral_model: string;
    mistral_enabled: boolean;
    fallback_enabled: boolean;
    timeout_seconds: number;
}

export interface OCRFieldConfig {
    id: string;
    category: OCRCategory;
    field_key: string;
    field_label: string;
    field_type: string;
    is_required: boolean;
    is_enabled: boolean;
    extraction_hint?: string | null;
    display_order: number;
}

export interface OCRExtractionResult {
    success: boolean;
    provider: OCRProvider;
    data: Record<string, any>;
    missingFields: string[];
    processingTimeMs: number;
    tokensUsed?: {
        input: number;
        output: number;
    };
    error?: string;
}

// Campos padrão por categoria
export const DEFAULT_FIELDS: Record<OCRCategory, Omit<OCRFieldConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]> = {
    EMPRESTIMOS_VEICULOS: [
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'valor_financiado', field_label: 'Valor Financiado', field_type: 'number', is_required: true, is_enabled: true, display_order: 1, extraction_hint: 'Valor do Crédito, Valor Líquido' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'taxa_juros_mensal', field_label: 'Taxa de Juros Mensal', field_type: 'number', is_required: true, is_enabled: true, display_order: 2, extraction_hint: '% a.m., Taxa Mensal' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'taxa_juros_anual', field_label: 'Taxa de Juros Anual / CET', field_type: 'number', is_required: false, is_enabled: true, display_order: 3, extraction_hint: '% a.a., CET' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'data_contrato', field_label: 'Data do Contrato', field_type: 'date', is_required: true, is_enabled: true, display_order: 4 },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'data_primeiro_vencimento', field_label: 'Data 1º Vencimento', field_type: 'date', is_required: true, is_enabled: true, display_order: 5 },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'prazo_meses', field_label: 'Prazo (Meses)', field_type: 'number', is_required: true, is_enabled: true, display_order: 6 },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'valor_parcela', field_label: 'Valor da Parcela', field_type: 'number', is_required: false, is_enabled: true, display_order: 7 },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'tac', field_label: 'TAC / Tarifas Adm.', field_type: 'number', is_required: false, is_enabled: true, display_order: 8 },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'seguro_prestamista', field_label: 'Seguro Prestamista', field_type: 'number', is_required: false, is_enabled: true, display_order: 9 },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'nome_credor', field_label: 'Nome do Credor/Banco', field_type: 'text', is_required: false, is_enabled: true, display_order: 10 },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'nome_devedor', field_label: 'Nome do Devedor', field_type: 'text', is_required: false, is_enabled: true, display_order: 11 },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'numero_contrato', field_label: 'Número do Contrato', field_type: 'text', is_required: false, is_enabled: true, display_order: 12 },
    ],
    IMOBILIARIO: [
        { category: 'IMOBILIARIO', field_key: 'valor_imovel', field_label: 'Valor do Imóvel', field_type: 'number', is_required: true, is_enabled: true, display_order: 1 },
        { category: 'IMOBILIARIO', field_key: 'valor_financiado', field_label: 'Valor Financiado', field_type: 'number', is_required: true, is_enabled: true, display_order: 2 },
        { category: 'IMOBILIARIO', field_key: 'sistema_amortizacao', field_label: 'Sistema de Amortização', field_type: 'text', is_required: true, is_enabled: true, display_order: 3, extraction_hint: 'SAC, PRICE, SACRE' },
        { category: 'IMOBILIARIO', field_key: 'indexador', field_label: 'Índice de Reajuste', field_type: 'text', is_required: true, is_enabled: true, display_order: 4, extraction_hint: 'TR, IPCA, IGPM, INPC' },
        { category: 'IMOBILIARIO', field_key: 'taxa_juros_anual', field_label: 'Taxa de Juros Anual', field_type: 'number', is_required: true, is_enabled: true, display_order: 5 },
        { category: 'IMOBILIARIO', field_key: 'prazo_meses', field_label: 'Prazo (Meses)', field_type: 'number', is_required: true, is_enabled: true, display_order: 6 },
        { category: 'IMOBILIARIO', field_key: 'mip_valor', field_label: 'Seguro MIP', field_type: 'number', is_required: false, is_enabled: true, display_order: 7 },
        { category: 'IMOBILIARIO', field_key: 'dfi_valor', field_label: 'Seguro DFI', field_type: 'number', is_required: false, is_enabled: true, display_order: 8 },
        { category: 'IMOBILIARIO', field_key: 'data_contrato', field_label: 'Data do Contrato', field_type: 'date', is_required: true, is_enabled: true, display_order: 9 },
        { category: 'IMOBILIARIO', field_key: 'data_primeiro_vencimento', field_label: 'Data 1ª Parcela', field_type: 'date', is_required: false, is_enabled: true, display_order: 10 },
    ],
    CARTAO_CREDITO: [
        { category: 'CARTAO_CREDITO', field_key: 'bandeira_banco', field_label: 'Bandeira/Banco', field_type: 'text', is_required: true, is_enabled: true, display_order: 1 },
        { category: 'CARTAO_CREDITO', field_key: 'limite_credito', field_label: 'Limite de Crédito', field_type: 'number', is_required: false, is_enabled: true, display_order: 2 },
        { category: 'CARTAO_CREDITO', field_key: 'taxa_rotativo', field_label: 'Taxa de Juros Rotativo', field_type: 'number', is_required: false, is_enabled: true, display_order: 3 },
        { category: 'CARTAO_CREDITO', field_key: 'valor_fatura', field_label: 'Valor da Fatura', field_type: 'number', is_required: false, is_enabled: true, display_order: 4 },
        { category: 'CARTAO_CREDITO', field_key: 'encargos_atraso', field_label: 'Encargos de Atraso', field_type: 'number', is_required: false, is_enabled: true, display_order: 5 },
        { category: 'CARTAO_CREDITO', field_key: 'data_vencimento', field_label: 'Data de Vencimento', field_type: 'date', is_required: false, is_enabled: true, display_order: 6 },
    ],
};
