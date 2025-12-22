
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserDocumentSettings, DEFAULT_SETTINGS } from '../pdf-engine/DocumentTypes';
import { Loader2, Palette, Image as ImageIcon, LayoutTemplate, X, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { PdfPreviewPanel } from './PdfPreviewPanel';

export const DocumentSettingsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<UserDocumentSettings>(DEFAULT_SETTINGS);

    // Refs for file inputs to allow clearing them manually
    const logoInputRef = useRef<HTMLInputElement>(null);
    const watermarkInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;

        const loadSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_document_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                if (data) {
                    setFormData({ ...DEFAULT_SETTINGS, ...data });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                toast.error('Erro ao carregar configurações.');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [user]);

    const handleUpload = async (file: File, bucket: string, pathPrefix: string) => {
        if (!user) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${pathPrefix}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        try {
            setSaving(true);
            const url = await handleUpload(e.target.files[0], 'branding-assets', 'logo');
            if (url) setFormData(prev => ({ ...prev, logo_url: url }));
            toast.success('Logo carregado com sucesso!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erro ao fazer upload do logo.');
        } finally {
            setSaving(false);
        }
    };

    const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        try {
            setSaving(true);
            const url = await handleUpload(e.target.files[0], 'branding-assets', 'watermark');
            if (url) setFormData(prev => ({ ...prev, watermark_url: url }));
            toast.success('Marca d\'água carregada com sucesso!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erro ao fazer upload da marca d\'água.');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('user_document_settings')
                .upsert({
                    ...(formData.id ? { id: formData.id } : {}),
                    user_id: user.id,
                    // Colors
                    primary_color: formData.primary_color,
                    secondary_color: formData.secondary_color,
                    table_header_bg: formData.table_header_bg,
                    table_border_color: formData.table_border_color,
                    heading_color: formData.heading_color,
                    text_color: formData.text_color,
                    // Branding
                    logo_url: formData.logo_url,
                    watermark_url: formData.watermark_url,
                    watermark_opacity: formData.watermark_opacity,
                    watermark_scale: formData.watermark_scale,
                    // Misc
                    footer_text: formData.footer_text,
                    show_page_numbers: formData.show_page_numbers
                });

            if (error) throw error;
            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const ColorInput = ({ label, value, onChange, suggestion }: { label: string, value: string | undefined, onChange: (val: string) => void, suggestion?: string }) => (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <label
                    className="w-10 h-10 rounded-md border border-input shadow-sm cursor-pointer block"
                    style={{ backgroundColor: value || '#000000' }}
                >
                    <input
                        type="color"
                        value={value || '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                    />
                </label>
                <Input
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 font-mono uppercase"
                    maxLength={7}
                />
            </div>
            {suggestion && <p className="text-[10px] text-muted-foreground">Sugestão: {suggestion}</p>}
        </div>
    );

    return (
        <div className="container mx-auto py-8 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configurações de Documentos</h1>
                    <p className="text-muted-foreground mt-1">
                        Personalize a aparência dos relatórios e documentos exportados (PDFs).
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Alterações
                </Button>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column: Settings Forms */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="visual" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
                            <TabsTrigger value="visual" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 rounded-lg">
                                <Palette className="w-4 h-4 mr-2" />
                                Identidade
                            </TabsTrigger>
                            <TabsTrigger value="branding" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 rounded-lg">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Branding
                            </TabsTrigger>
                            <TabsTrigger value="structure" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 rounded-lg">
                                <LayoutTemplate className="w-4 h-4 mr-2" />
                                Formato
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: VISUAL IDENTITY */}
                        <TabsContent value="visual" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cores Principais</CardTitle>
                                    <CardDescription>Defina as cores primárias que representam sua marca nos documentos.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-6">
                                    <ColorInput
                                        label="Cor Primária (Destaques, Títulos Principais)"
                                        value={formData.primary_color}
                                        onChange={(val) => setFormData(prev => ({ ...prev, primary_color: val }))}
                                    />
                                    <ColorInput
                                        label="Cor Secundária (Subtítulos, Detalhes)"
                                        value={formData.secondary_color}
                                        onChange={(val) => setFormData(prev => ({ ...prev, secondary_color: val }))}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tipografia e Tabelas</CardTitle>
                                    <CardDescription>Personalize a legibilidade e o estilo das tabelas e textos.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-6">
                                    <ColorInput
                                        label="Cor dos Títulos (Heading)"
                                        value={formData.heading_color}
                                        onChange={(val) => setFormData(prev => ({ ...prev, heading_color: val }))}
                                        suggestion="Geralmente #334155 (Slate 700)"
                                    />
                                    <ColorInput
                                        label="Cor do Texto (Corpo)"
                                        value={formData.text_color}
                                        onChange={(val) => setFormData(prev => ({ ...prev, text_color: val }))}
                                        suggestion="Geralmente #0f172a (Slate 900)"
                                    />

                                    <div className="col-span-2 my-2">
                                        <Separator />
                                    </div>

                                    <ColorInput
                                        label="Fundo do Cabeçalho da Tabela"
                                        value={formData.table_header_bg}
                                        onChange={(val) => setFormData(prev => ({ ...prev, table_header_bg: val }))}
                                        suggestion="#f1f5f9 ou tom muito claro da primária"
                                    />
                                    <ColorInput
                                        label="Bordas da Tabela"
                                        value={formData.table_border_color}
                                        onChange={(val) => setFormData(prev => ({ ...prev, table_border_color: val }))}
                                        suggestion="#e2e8f0 (Slate 200)"
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: BRANDING */}
                        <TabsContent value="branding" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Logotipo</CardTitle>
                                    <CardDescription>O logotipo aparecerá no canto superior esquerdo dos documentos.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-start gap-6">
                                        <div className="space-y-2 flex-1">
                                            <Label>Arquivo da Logo</Label>
                                            <Input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/png, image/jpeg, image/svg+xml"
                                                onChange={handleLogoUpload}
                                            />
                                            <p className="text-xs text-muted-foreground">Recomendado: PNG transparente ou SVG.</p>
                                        </div>
                                        <div className="border rounded-lg p-4 bg-white shadow-sm w-32 h-32 flex items-center justify-center relative bg-[url(/checkerboard.png)]">
                                            {formData.logo_url ? (
                                                <>
                                                    <div className="absolute top-1 right-1 z-10">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-5 w-5 rounded-full"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, logo_url: null }));
                                                                if (logoInputRef.current) logoInputRef.current.value = '';
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                    <img src={formData.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                                </>
                                            ) : (
                                                <div className="text-center text-muted-foreground text-[10px]">Sem Logo</div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Marca d'água</CardTitle>
                                    <CardDescription>Imagem de fundo para identidade visual.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Arquivo da Marca d'água</Label>
                                            <div className="flex gap-4">
                                                <Input
                                                    ref={watermarkInputRef}
                                                    type="file"
                                                    accept="image/png, image/jpeg"
                                                    onChange={handleWatermarkUpload}
                                                    className="flex-1"
                                                />
                                                {formData.watermark_url && (
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, watermark_url: null }));
                                                            if (watermarkInputRef.current) watermarkInputRef.current.value = '';
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <Label>Opacidade</Label>
                                                    <span className="text-xs text-muted-foreground">{Math.round((formData.watermark_opacity || 0.15) * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.05" max="0.5" step="0.05"
                                                    value={formData.watermark_opacity || 0.15}
                                                    onChange={e => setFormData(prev => ({ ...prev, watermark_opacity: parseFloat(e.target.value) }))}
                                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <Label>Tamanho (Escala)</Label>
                                                    <span className="text-xs text-muted-foreground">{Math.round((formData.watermark_scale || 0.5) * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.2" max="1" step="0.1"
                                                    value={formData.watermark_scale || 0.5}
                                                    onChange={e => setFormData(prev => ({ ...prev, watermark_scale: parseFloat(e.target.value) }))}
                                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 3: STRUCTURE & FOOTER */}
                        <TabsContent value="structure" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rodapé e Paginação</CardTitle>
                                    <CardDescription>Configurações globais para todas as páginas dos documentos.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Timbre (Identificação da Empresa)</Label>
                                        <Input
                                            value={formData.header_text || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, header_text: e.target.value }))}
                                            placeholder="Ex: ESCRITÓRIO ABC JURÍDICO - CNPJ 00.000.000/0001-00"
                                        />
                                        <p className="text-xs text-muted-foreground">Aparece centralizado no cabeçalho, ao lado da logo. Ideal para nome da empresa e CNPJ.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Texto do Rodapé</Label>
                                        <Input
                                            value={formData.footer_text || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                                            placeholder="Ex: Documento gerado pelo OctoApps - Confidencial"
                                        />
                                        <p className="text-xs text-muted-foreground">Este texto aparecerá centralizado na parte inferior de todas as páginas.</p>
                                    </div>

                                    <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50">
                                        <input
                                            type="checkbox"
                                            id="page-numbers"
                                            checked={formData.show_page_numbers}
                                            onChange={(e) => setFormData(prev => ({ ...prev, show_page_numbers: e.target.checked }))}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="page-numbers" className="font-medium cursor-pointer">Exibir numeração de páginas</Label>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Preview Panel */}
                <div className="hidden lg:block lg:col-span-1">
                    <PdfPreviewPanel settings={formData} />
                </div>
            </div>
        </div>
    );
};
