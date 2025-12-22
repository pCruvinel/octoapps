export interface UserDocumentSettings {
    id?: string;
    user_id?: string;
    logo_url?: string | null;
    watermark_url?: string | null;
    watermark_opacity?: number; // 0.0 to 1.0
    watermark_scale?: number; // 0.2 to 1.0
    primary_color?: string; // Hex
    secondary_color?: string; // Hex
    table_header_bg?: string; // Hex
    table_border_color?: string; // Hex
    heading_color?: string; // Hex
    text_color?: string; // Hex
    header_text?: string; // Custom header text
    footer_text?: string | null;
    show_page_numbers?: boolean;
}

export interface DocumentContextType {
    settings: UserDocumentSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

export const DEFAULT_SETTINGS: UserDocumentSettings = {
    primary_color: '#000000',
    secondary_color: '#6b7280',
    watermark_opacity: 0.15,
    watermark_scale: 0.5,
    show_page_numbers: true,
    table_header_bg: '#f1f5f9',
    table_border_color: '#e2e8f0',
    heading_color: '#334155',
    text_color: '#0f172a',
};
