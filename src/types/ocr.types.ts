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
    additional_context_emprestimos?: string | null;
    additional_context_imobiliario?: string | null;
    additional_context_cartao?: string | null;
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
        // 1.1 Dados do Contrato
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'nome_credor', field_label: 'Credor (Banco/Financeira)', field_type: 'text', is_required: true, is_enabled: true, display_order: 1, extraction_hint: 'Nome do banco, financeira, instituição de crédito' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'nome_devedor', field_label: 'Devedor (Cliente)', field_type: 'text', is_required: true, is_enabled: true, display_order: 2, extraction_hint: 'Nome completo do cliente/contratante' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'numero_contrato', field_label: 'Número do Contrato', field_type: 'text', is_required: true, is_enabled: true, display_order: 3, extraction_hint: 'Nº do contrato, CCB' },

        // 1.2 Dados Financeiros
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'valor_financiado', field_label: 'Valor Financiado (PV)', field_type: 'number', is_required: true, is_enabled: true, display_order: 4, extraction_hint: 'Valor do Crédito, Valor Líquido, Principal' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'valor_bem', field_label: 'Valor do Bem/Veículo', field_type: 'number', is_required: false, is_enabled: true, display_order: 5, extraction_hint: 'Valor de mercado do veículo' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'valor_entrada', field_label: 'Valor da Entrada', field_type: 'number', is_required: false, is_enabled: true, display_order: 6, extraction_hint: 'Entrada, Sinal' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'prazo_meses', field_label: 'Prazo (Meses)', field_type: 'number', is_required: true, is_enabled: true, display_order: 7, extraction_hint: 'Quantidade de parcelas, prazo total' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'taxa_juros_mensal', field_label: 'Taxa de Juros Mensal (%)', field_type: 'number', is_required: true, is_enabled: true, display_order: 8, extraction_hint: '% a.m., Taxa Mensal, i.m.' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'taxa_juros_anual', field_label: 'Taxa de Juros Anual / CET (%)', field_type: 'number', is_required: false, is_enabled: true, display_order: 9, extraction_hint: '% a.a., CET, Custo Efetivo Total' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'modalidade', field_label: 'Modalidade do Contrato', field_type: 'text', is_required: false, is_enabled: true, display_order: 9.5, extraction_hint: 'CDC, Leasing, Consignado, Pessoal' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'valor_parcela', field_label: 'Valor da Parcela (PMT)', field_type: 'number', is_required: false, is_enabled: true, display_order: 10, extraction_hint: 'Prestação, valor mensal' },

        // 1.3 Datas
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'data_contrato', field_label: 'Data do Contrato', field_type: 'date', is_required: true, is_enabled: true, display_order: 11, extraction_hint: 'Data de assinatura' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'data_liberacao', field_label: 'Data da Liberação', field_type: 'date', is_required: false, is_enabled: true, display_order: 12, extraction_hint: 'Data de liberação do crédito' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'data_primeiro_vencimento', field_label: 'Data 1º Vencimento', field_type: 'date', is_required: true, is_enabled: true, display_order: 13, extraction_hint: 'Vencimento da primeira parcela' },

        // 1.4 Sistema de Amortização
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'sistema_amortizacao', field_label: 'Sistema de Amortização', field_type: 'text', is_required: false, is_enabled: true, display_order: 14, extraction_hint: 'SAC, PRICE, Tabela Price' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'capitalizacao', field_label: 'Tipo de Capitalização', field_type: 'text', is_required: false, is_enabled: true, display_order: 15, extraction_hint: 'Mensal, Diária' },

        // 1.5 Tarifas e Seguros
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'tarifa_tac', field_label: 'TAC (Tarifa Abertura Crédito)', field_type: 'number', is_required: false, is_enabled: true, display_order: 16, extraction_hint: 'Tarifa de cadastro, abertura' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'tarifa_avaliacao', field_label: 'Tarifa de Avaliação', field_type: 'number', is_required: false, is_enabled: true, display_order: 17, extraction_hint: 'Avaliação do bem' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'tarifa_registro', field_label: 'Tarifa de Registro', field_type: 'number', is_required: false, is_enabled: true, display_order: 18, extraction_hint: 'Registro do contrato' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'seguro_prestamista', field_label: 'Seguro Prestamista (MIP)', field_type: 'number', is_required: false, is_enabled: true, display_order: 19, extraction_hint: 'Seguro Morte/Invalidez' },
        { category: 'EMPRESTIMOS_VEICULOS', field_key: 'iof', field_label: 'IOF', field_type: 'number', is_required: false, is_enabled: true, display_order: 20, extraction_hint: 'Imposto sobre Operações Financeiras' },
    ],
    IMOBILIARIO: [
        // 1.1 Dados do Contrato
        { category: 'IMOBILIARIO', field_key: 'nome_credor', field_label: 'Credor (Banco/Instituição)', field_type: 'text', is_required: true, is_enabled: true, display_order: 1, extraction_hint: 'Nome do banco, CEF, instituição financeira' },
        { category: 'IMOBILIARIO', field_key: 'nome_devedor', field_label: 'Devedor (Mutuário)', field_type: 'text', is_required: true, is_enabled: true, display_order: 2, extraction_hint: 'Nome completo do mutuário' },
        { category: 'IMOBILIARIO', field_key: 'numero_contrato', field_label: 'Número do Contrato', field_type: 'text', is_required: true, is_enabled: true, display_order: 3, extraction_hint: 'Nº do contrato de financiamento' },
        { category: 'IMOBILIARIO', field_key: 'tipo_financiamento', field_label: 'Tipo de Financiamento', field_type: 'text', is_required: false, is_enabled: true, display_order: 4, extraction_hint: 'SFH, SFI, Carta de Crédito' },

        // 1.2 Dados do Imóvel
        { category: 'IMOBILIARIO', field_key: 'valor_imovel', field_label: 'Valor do Imóvel', field_type: 'number', is_required: true, is_enabled: true, display_order: 5, extraction_hint: 'Valor de compra/avaliação' },
        { category: 'IMOBILIARIO', field_key: 'valor_avaliacao', field_label: 'Valor da Avaliação Bancária', field_type: 'number', is_required: false, is_enabled: true, display_order: 6, extraction_hint: 'Valor da avaliação do banco' },
        { category: 'IMOBILIARIO', field_key: 'valor_entrada', field_label: 'Valor da Entrada', field_type: 'number', is_required: false, is_enabled: true, display_order: 7, extraction_hint: 'Entrada, Sinal, Recursos próprios' },
        { category: 'IMOBILIARIO', field_key: 'valor_fgts', field_label: 'Valor do FGTS Utilizado', field_type: 'number', is_required: false, is_enabled: true, display_order: 8, extraction_hint: 'FGTS aplicado na entrada' },
        { category: 'IMOBILIARIO', field_key: 'valor_financiado', field_label: 'Valor Financiado (PV)', field_type: 'number', is_required: true, is_enabled: true, display_order: 9, extraction_hint: 'Valor efetivamente financiado' },

        // 1.3 Dados Financeiros
        { category: 'IMOBILIARIO', field_key: 'prazo_meses', field_label: 'Prazo (Meses)', field_type: 'number', is_required: true, is_enabled: true, display_order: 10, extraction_hint: 'Prazo total, quantidade de parcelas' },
        { category: 'IMOBILIARIO', field_key: 'taxa_juros_mensal', field_label: 'Taxa de Juros Mensal (%)', field_type: 'number', is_required: false, is_enabled: true, display_order: 11, extraction_hint: '% a.m., Taxa Mensal' },
        { category: 'IMOBILIARIO', field_key: 'taxa_juros_anual', field_label: 'Taxa de Juros Anual (%)', field_type: 'number', is_required: true, is_enabled: true, display_order: 12, extraction_hint: '% a.a., TEA, Taxa Efetiva Anual' },
        { category: 'IMOBILIARIO', field_key: 'valor_prestacao', field_label: 'Valor da Prestação', field_type: 'number', is_required: false, is_enabled: true, display_order: 13, extraction_hint: 'Prestação mensal atual' },

        // 1.4 Datas
        { category: 'IMOBILIARIO', field_key: 'data_contrato', field_label: 'Data do Contrato', field_type: 'date', is_required: true, is_enabled: true, display_order: 14, extraction_hint: 'Data de assinatura' },
        { category: 'IMOBILIARIO', field_key: 'data_liberacao', field_label: 'Data da Liberação', field_type: 'date', is_required: false, is_enabled: true, display_order: 15, extraction_hint: 'Data de liberação do crédito' },
        { category: 'IMOBILIARIO', field_key: 'data_primeira_parcela', field_label: 'Data 1ª Parcela', field_type: 'date', is_required: true, is_enabled: true, display_order: 16, extraction_hint: 'Primeiro vencimento' },

        // 1.5 Sistema e Indexador
        { category: 'IMOBILIARIO', field_key: 'sistema_amortizacao', field_label: 'Sistema de Amortização', field_type: 'text', is_required: true, is_enabled: true, display_order: 17, extraction_hint: 'SAC, PRICE, SACRE' },
        { category: 'IMOBILIARIO', field_key: 'indexador', field_label: 'Indexador / Correção', field_type: 'text', is_required: true, is_enabled: true, display_order: 18, extraction_hint: 'TR, IPCA, INPC, IGPM' },

        // 1.6 Seguros Habitacionais
        { category: 'IMOBILIARIO', field_key: 'seguro_mip_valor', field_label: 'Seguro MIP (Valor/Percentual)', field_type: 'number', is_required: false, is_enabled: true, display_order: 19, extraction_hint: 'Seguro Morte/Invalidez Permanente' },
        { category: 'IMOBILIARIO', field_key: 'seguro_dfi_valor', field_label: 'Seguro DFI (Valor/Percentual)', field_type: 'number', is_required: false, is_enabled: true, display_order: 20, extraction_hint: 'Seguro Danos Físicos ao Imóvel' },

        // 1.7-1.8 Taxas e Tarifas
        { category: 'IMOBILIARIO', field_key: 'taxa_administracao', field_label: 'Taxa Administrativa Mensal', field_type: 'number', is_required: false, is_enabled: true, display_order: 21, extraction_hint: 'Taxa adm mensal, R$ 25' },
        { category: 'IMOBILIARIO', field_key: 'taxa_avaliacao', field_label: 'Taxa de Avaliação do Imóvel', field_type: 'number', is_required: false, is_enabled: true, display_order: 22, extraction_hint: 'Tarifa avaliação imóvel' },
        { category: 'IMOBILIARIO', field_key: 'taxa_registro', field_label: 'Taxa de Registro em Cartório', field_type: 'number', is_required: false, is_enabled: true, display_order: 23, extraction_hint: 'Registro do contrato' },
        { category: 'IMOBILIARIO', field_key: 'taxa_analise', field_label: 'Taxa de Análise de Garantia', field_type: 'number', is_required: false, is_enabled: true, display_order: 24, extraction_hint: 'Análise de crédito/garantia' },
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
