export interface UserDocumentSettings {
    id?: string;
    user_id?: string;
    logo_url?: string | null;
    watermark_url?: string | null;
    watermark_opacity?: number; // 0.0 to 1.0
    primary_color?: string; // Hex
    secondary_color?: string; // Hex
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
    show_page_numbers: true,
};
