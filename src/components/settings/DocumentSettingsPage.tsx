'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useDocumentSettings } from '../pdf-engine/DocumentContext';
import { Upload, X } from 'lucide-react';

export function DocumentSettingsPage() {
    const { settings, refreshSettings, loading: contextLoading } = useDocumentSettings();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(settings);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    // Upload handler
    const handleUpload = async (file: File, bucket: string, path: string) => {
        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${path}.${fileExt}`;
            const filePath = `${(await supabase.auth.getUser()).data.user?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading:', error);
            toast.error('Erro ao fazer upload da imagem.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const url = await handleUpload(e.target.files[0], 'branding-assets', 'logo');
        if (url) setFormData(prev => ({ ...prev, logo_url: url }));
    };

    const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const url = await handleUpload(e.target.files[0], 'branding-assets', 'watermark');
        if (url) setFormData(prev => ({ ...prev, watermark_url: url }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('user_document_settings')
                .upsert({
                    user_id: user.id,
                    logo_url: formData.logo_url,
                    watermark_url: formData.watermark_url,
                    watermark_opacity: formData.watermark_opacity,
                    primary_color: formData.primary_color,
                    secondary_color: formData.secondary_color,
                    footer_text: formData.footer_text,
                    show_page_numbers: formData.show_page_numbers
                });

            if (error) throw error;

            toast.success('Configurações salvas com sucesso!');
            await refreshSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Erro ao salvar configurações.');
        } finally {
            setLoading(false);
        }
    };

    if (contextLoading) return <div>Carregando...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Configurações de Documentos (White Label)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Identidade Visual */}
                <Card>
                    <CardHeader><CardTitle>Identidade Visual</CardTitle></CardHeader>
                    <CardContent className="space-y-6">

                        {/* Logo */}
                        <div className="space-y-2">
                            <Label>Logomarca (Cabeçalho)</Label>
                            <div className="flex items-center gap-4">
                                {formData.logo_url && (
                                    <div className="relative w-24 h-12 border p-1 rounded bg-white">
                                        <img src={formData.logo_url} className="w-full h-full object-contain" />
                                        <button onClick={() => setFormData(prev => ({ ...prev, logo_url: null }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <Input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} />
                            </div>
                            <p className="text-xs text-gray-500">Recomendado: 800px largura, PNG transparente.</p>
                        </div>

                        {/* Cores */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cor Primária</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formData.primary_color || '#000000'}
                                        onChange={e => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                                        className="w-8 h-8 rounded cursor-pointer"
                                    />
                                    <Input
                                        value={formData.primary_color || '#000000'}
                                        onChange={e => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Marca d'água */}
                <Card>
                    <CardHeader><CardTitle>Marca d'água e Rodapé</CardTitle></CardHeader>
                    <CardContent className="space-y-6">

                        {/* Watermark */}
                        <div className="space-y-2">
                            <Label>Imagem da Marca d'água</Label>
                            <div className="flex items-center gap-4">
                                {formData.watermark_url && (
                                    <div className="relative w-20 h-20 border p-1 rounded bg-white">
                                        <img src={formData.watermark_url} className="w-full h-full object-contain opacity-50" />
                                        <button onClick={() => setFormData(prev => ({ ...prev, watermark_url: null }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <Input type="file" accept="image/png" onChange={handleWatermarkUpload} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Opacidade da Marca d'água ({Math.round((formData.watermark_opacity || 0.15) * 100)}%)</Label>
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={formData.watermark_opacity || 0.15}
                                onChange={e => setFormData(prev => ({ ...prev, watermark_opacity: parseFloat(e.target.value) }))}
                                className="w-full"
                            />
                        </div>

                        {/* Footer */}
                        <div className="space-y-2">
                            <Label>Texto do Rodapé</Label>
                            <Input
                                value={formData.footer_text || ''}
                                onChange={e => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                                placeholder="Ex: Rua X, 123 - contato@empresa.com"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.show_page_numbers}
                                onCheckedChange={c => setFormData(prev => ({ ...prev, show_page_numbers: c }))}
                            />
                            <Label>Exibir numeração de páginas</Label>
                        </div>

                    </CardContent>
                </Card>

            </div>

            <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="w-32">
                    {loading ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>
        </div>
    );
}
