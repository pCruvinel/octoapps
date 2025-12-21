'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserDocumentSettings, DocumentContextType, DEFAULT_SETTINGS } from './DocumentTypes';
import { toast } from 'sonner';

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentSettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<UserDocumentSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('user_document_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
                console.error('Error fetching document settings:', error);
                return;
            }

            if (data) {
                setSettings({ ...DEFAULT_SETTINGS, ...data });
            }
        } catch (error) {
            console.error('Unexpected error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <DocumentContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </DocumentContext.Provider>
    );
}

export function useDocumentSettings() {
    const context = useContext(DocumentContext);
    if (context === undefined) {
        throw new Error('useDocumentSettings must be used within a DocumentSettingsProvider');
    }
    return context;
}
