import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { OCRSettings, OCRFieldConfig, OCRCategory } from '../../types/ocr.types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save, Eye, EyeOff, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { DEFAULT_FIELDS } from '../../types/ocr.types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

export function OCRSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<OCRSettings | null>(null);
    const [fieldConfigs, setFieldConfigs] = useState<Record<OCRCategory, OCRFieldConfig[]>>({
        EMPRESTIMOS_VEICULOS: [],
        IMOBILIARIO: [],
        CARTAO_CREDITO: []
    });
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showMistralKey, setShowMistralKey] = useState(false);
    const [openPromptPreviews, setOpenPromptPreviews] = useState<Record<OCRCategory, boolean>>({
        EMPRESTIMOS_VEICULOS: false,
        IMOBILIARIO: false,
        CARTAO_CREDITO: false
    });

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Initialize with default fields first (in case DB fails)
            const defaultConfigs: Record<OCRCategory, OCRFieldConfig[]> = {
                EMPRESTIMOS_VEICULOS: DEFAULT_FIELDS.EMPRESTIMOS_VEICULOS.map((f, i) => ({ ...f, id: `default-emp-${i}` })) as OCRFieldConfig[],
                IMOBILIARIO: DEFAULT_FIELDS.IMOBILIARIO.map((f, i) => ({ ...f, id: `default-imob-${i}` })) as OCRFieldConfig[],
                CARTAO_CREDITO: DEFAULT_FIELDS.CARTAO_CREDITO.map((f, i) => ({ ...f, id: `default-cartao-${i}` })) as OCRFieldConfig[],
            };
            setFieldConfigs(defaultConfigs);

            // Try to fetch settings from database
            try {
                let { data: settingsData, error: settingsError } = await supabase
                    .from('ocr_settings')
                    .select('*')
                    .eq('user_id', user!.id)
                    .single();

                if (settingsError) {
                    console.warn('OCR settings table might not exist yet:', settingsError.message);
                    // Use default settings
                    setSettings({
                        id: 'local-default',
                        user_id: user!.id,
                        gemini_enabled: true,
                        mistral_enabled: true,
                        fallback_enabled: true,
                        timeout_seconds: 60,
                        gemini_model: 'gemini-1.5-flash',
                        mistral_model: 'pixtral-12b-2409',
                        gemini_api_key_encrypted: null,
                        mistral_api_key_encrypted: null
                    });
                } else if (settingsData) {
                    setSettings({
                        ...settingsData,
                        user_id: settingsData.user_id as string,
                        gemini_enabled: settingsData.gemini_enabled ?? true,
                        mistral_enabled: settingsData.mistral_enabled ?? true,
                        fallback_enabled: settingsData.fallback_enabled ?? true,
                        timeout_seconds: settingsData.timeout_seconds || 60,
                        gemini_model: settingsData.gemini_model || 'gemini-1.5-flash',
                        mistral_model: settingsData.mistral_model || 'pixtral-12b-2409',
                        additional_context_emprestimos: settingsData.additional_context_emprestimos,
                        additional_context_imobiliario: settingsData.additional_context_imobiliario,
                        additional_context_cartao: settingsData.additional_context_cartao
                    });
                }
            } catch (dbError) {
                console.warn('Database not available for OCR settings, using defaults');
                setSettings({
                    id: 'local-default',
                    user_id: user!.id,
                    gemini_enabled: true,
                    mistral_enabled: true,
                    fallback_enabled: true,
                    timeout_seconds: 60,
                    gemini_model: 'gemini-1.5-flash',
                    mistral_model: 'pixtral-12b-2409',
                    gemini_api_key_encrypted: null,
                    mistral_api_key_encrypted: null
                });
            }

            // Try to fetch field configs from database
            try {
                const categories: OCRCategory[] = ['EMPRESTIMOS_VEICULOS', 'IMOBILIARIO', 'CARTAO_CREDITO'];
                const configs: Record<OCRCategory, OCRFieldConfig[]> = { ...defaultConfigs };

                for (const cat of categories) {
                    const { data: fields, error: fieldsError } = await supabase
                        .from('ocr_field_configs')
                        .select('*')
                        .eq('user_id', user!.id)
                        .eq('category', cat)
                        .order('display_order');

                    if (!fieldsError && fields && fields.length > 0) {
                        configs[cat] = fields.map((f: any) => ({
                            ...f,
                            is_required: f.is_required ?? false,
                            is_enabled: f.is_enabled ?? true,
                            field_type: f.field_type || 'text'
                        }));
                    }
                    // If error or no fields, keep the default configs we already set
                }
                setFieldConfigs(configs);
            } catch (dbError) {
                console.warn('Could not fetch field configs from database, using defaults');
                // Keep default configs already set
            }

        } catch (error) {
            console.error('Error loading OCR settings:', error);
            toast.error('Erro ao carregar configurações - usando valores padrão');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!settings || !user) return;
        try {
            setSaving(true);

            const settingsPayload = {
                user_id: user.id,
                gemini_api_key_encrypted: settings.gemini_api_key_encrypted,
                gemini_model: settings.gemini_model,
                gemini_enabled: settings.gemini_enabled,
                mistral_api_key_encrypted: settings.mistral_api_key_encrypted,
                mistral_model: settings.mistral_model,
                mistral_enabled: settings.mistral_enabled,
                fallback_enabled: settings.fallback_enabled,
                timeout_seconds: settings.timeout_seconds,
                additional_context_emprestimos: settings.additional_context_emprestimos,
                additional_context_imobiliario: settings.additional_context_imobiliario,
                additional_context_cartao: settings.additional_context_cartao
            };

            // If ID is local-default, we need to insert, otherwise update
            if (settings.id === 'local-default' || !settings.id) {
                const { data, error } = await supabase
                    .from('ocr_settings')
                    .insert(settingsPayload)
                    .select()
                    .single();

                if (error) throw error;

                // Update local state with the new ID
                if (data) {
                    setSettings(prev => prev ? { ...prev, id: data.id } : null);
                }
            } else {
                const { error } = await supabase
                    .from('ocr_settings')
                    .update(settingsPayload)
                    .eq('id', settings.id);

                if (error) throw error;
            }

            toast.success('Configurações salvas com sucesso');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleField = async (fieldId: string, enabled: boolean) => {
        // Optimistic update
        const updateState = (cat: OCRCategory) => {
            setFieldConfigs(prev => ({
                ...prev,
                [cat]: prev[cat].map(f => f.id === fieldId ? { ...f, is_enabled: enabled } : f)
            }));
        };

        // Find category
        let category: OCRCategory | null = null;
        Object.entries(fieldConfigs).forEach(([cat, fields]) => {
            if (fields.some(f => f.id === fieldId)) category = cat as OCRCategory;
        });

        if (category) updateState(category);

        try {
            const { error } = await supabase
                .from('ocr_field_configs')
                .update({ is_enabled: enabled })
                .eq('id', fieldId);

            if (error) throw error;
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar campo');
        }
    };

    const handleUpdateHint = async (fieldId: string, hint: string) => {
        // Find category
        let category: OCRCategory | null = null;
        Object.entries(fieldConfigs).forEach(([cat, fields]) => {
            if (fields.some(f => f.id === fieldId)) category = cat as OCRCategory;
        });

        if (category) {
            // Optimistic update
            setFieldConfigs(prev => ({
                ...prev,
                [category!]: prev[category!].map(f => 
                    f.id === fieldId ? { ...f, extraction_hint: hint } : f
                )
            }));
        }

        // Debounced DB update
        try {
            const { error } = await supabase
                .from('ocr_field_configs')
                .update({ extraction_hint: hint })
                .eq('id', fieldId);

            if (error) throw error;
        } catch (error) {
            console.error(error);
            // Don't show error toast for every keystroke
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurações de OCR</h1>
                    <p className="text-gray-500 mt-2">Gerencie as integrações de IA e campos de extração de dados.</p>
                </div>
                <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Alterações
                </Button>
            </div>

            <Tabs defaultValue="api" className="space-y-6">
                <TabsList className="bg-white p-1 border">
                    <TabsTrigger value="api">APIs & Modelos</TabsTrigger>
                    <TabsTrigger value="EMPRESTIMOS_VEICULOS">Empréstimos & Veículos</TabsTrigger>
                    <TabsTrigger value="IMOBILIARIO">Imobiliário</TabsTrigger>
                    <TabsTrigger value="CARTAO_CREDITO">Cartão de Crédito</TabsTrigger>
                </TabsList>

                {/* API CONFIGURATION TAB */}
                <TabsContent value="api" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Gemini Config */}
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">Gemini AI <Badge variant="outline">Google</Badge></CardTitle>
                                        <CardDescription>Provedor Primário (Recomendado)</CardDescription>
                                    </div>
                                    <Switch
                                        checked={settings?.gemini_enabled}
                                        onCheckedChange={(c) => setSettings(s => s ? { ...s, gemini_enabled: c } : null)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <div className="relative">
                                        <Input
                                            type={showGeminiKey ? "text" : "password"}
                                            value={settings?.gemini_api_key_encrypted || ''}
                                            onChange={(e) => setSettings(s => s ? { ...s, gemini_api_key_encrypted: e.target.value } : null)}
                                            placeholder="AIzaSy..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Modelo</Label>
                                    <Select
                                        value={settings?.gemini_model || 'gemini-2.0-flash'}
                                        onValueChange={(v) => setSettings(s => s ? { ...s, gemini_model: v } : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Recomendado)</SelectItem>
                                            <SelectItem value="gemini-2.0-pro">Gemini 2.0 Pro (Preciso)</SelectItem>
                                            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</SelectItem>
                                            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Legacy)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mistral Config */}
                        <Card className="border-l-4 border-l-purple-500">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">Mistral AI <Badge variant="outline">Pixtral</Badge></CardTitle>
                                        <CardDescription>Provedor de Fallback</CardDescription>
                                    </div>
                                    <Switch
                                        checked={settings?.mistral_enabled}
                                        onCheckedChange={(c) => setSettings(s => s ? { ...s, mistral_enabled: c } : null)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <div className="relative">
                                        <Input
                                            type={showMistralKey ? "text" : "password"}
                                            value={settings?.mistral_api_key_encrypted || ''}
                                            onChange={(e) => setSettings(s => s ? { ...s, mistral_api_key_encrypted: e.target.value } : null)}
                                            placeholder="sk-..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowMistralKey(!showMistralKey)}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            {showMistralKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Modelo</Label>
                                    <Select
                                        value={settings?.mistral_model || 'mistral-ocr-latest'}
                                        onValueChange={(v) => setSettings(s => s ? { ...s, mistral_model: v } : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mistral-ocr-latest">Mistral OCR (Recomendado)</SelectItem>
                                            <SelectItem value="pixtral-large-latest">Pixtral Large (Vision)</SelectItem>
                                            <SelectItem value="pixtral-12b-2409">Pixtral 12B (Legacy)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Comportamento do Sistema</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Fallback Automático</h3>
                                        <p className="text-sm text-gray-500">Se o Gemini falhar, tentar automaticamente com Mistral.</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings?.fallback_enabled}
                                    onCheckedChange={(c) => setSettings(s => s ? { ...s, fallback_enabled: c } : null)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FIELD CONFIGS TABS */}
                {(Object.keys(fieldConfigs) as OCRCategory[]).map(category => {
                    const contextKey = category === 'EMPRESTIMOS_VEICULOS' 
                        ? 'additional_context_emprestimos' 
                        : category === 'IMOBILIARIO' 
                            ? 'additional_context_imobiliario' 
                            : 'additional_context_cartao';
                    
                    const activeFields = fieldConfigs[category].filter(f => f.is_enabled);
                    
                    // Build prompt preview
                    const fieldsList = activeFields.map(f =>
                        `- "${f.field_key}" (${f.field_label}): ${f.extraction_hint || ''} [Type: ${f.field_type}]`
                    ).join('\n');
                    
                    const additionalContext = settings?.[contextKey as keyof OCRSettings] as string | null;
                    
                    let promptPreview = `Você é um especialista em OCR e extração de dados de contratos bancários e jurídicos brasileiros.

Analise o documento fornecido e extraia os seguintes campos específicos.
Retorne APENAS um objeto JSON válido. NÃO inclua formatação markdown.

Categoria: ${category}

Campos para extrair:
${fieldsList}

Regras:
1. Se um campo não for encontrado claramente, defina como null. NÃO invente dados.
2. Para datas, use formato YYYY-MM-DD.
3. Para números/valores monetários, retorne como números puros (ex: 1500.50).
4. Remova separadores de milhares (pontos) e substitua vírgula decimal por ponto.
5. Identifique "Capitalização Diária" vs "Mensal" se aplicável.`;

                    if (additionalContext) {
                        promptPreview += `\n\nInformações Adicionais / Contexto do Usuário:\n${additionalContext}`;
                    }

                    return (
                        <TabsContent key={category} value={category} className="space-y-6">
                            {/* Context Textarea */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Contexto Adicional</CardTitle>
                                    <CardDescription>
                                        Informações extras para ajudar a IA a entender melhor os documentos desta categoria.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Ex: Contratos antigos deste banco usam formatação diferente para taxas. A taxa mensal geralmente aparece na página 2..."
                                        className="min-h-[100px]"
                                        value={(settings?.[contextKey as keyof OCRSettings] as string) || ''}
                                        onChange={(e) => setSettings(s => s ? { ...s, [contextKey]: e.target.value } : null)}
                                    />
                                </CardContent>
                            </Card>

                            {/* Fields Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Campos de Extração - {category.replace(/_/g, ' ')}</CardTitle>
                                    <CardDescription>Defina quais campos a IA deve buscar e suas descrições de contexto.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-700 font-medium">
                                                <tr>
                                                    <th className="p-3">Campo</th>
                                                    <th className="p-3">Descrição (Dica para IA)</th>
                                                    <th className="p-3 w-20">Obrig?</th>
                                                    <th className="p-3 w-20 text-right">Ativo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {fieldConfigs[category].map((field) => (
                                                    <tr key={field.id} className="hover:bg-gray-50">
                                                        <td className="p-3">
                                                            <div className="font-medium">{field.field_label}</div>
                                                            <div className="text-xs text-gray-400 font-mono">{field.field_key}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                className="text-sm"
                                                                defaultValue={field.extraction_hint || ''}
                                                                placeholder="Ex: Nome do banco, financeira..."
                                                                onBlur={(e) => handleUpdateHint(field.id, e.target.value)}
                                                            />
                                                        </td>
                                    <td className="p-3">
                                                            {field.is_required ? (
                                                                <Badge variant="secondary" className="text-xs">Sim</Badge>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <Switch
                                                                checked={field.is_enabled}
                                                                onCheckedChange={(c) => handleToggleField(field.id, c)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Prompt Preview */}
                            <Collapsible 
                                open={openPromptPreviews[category]} 
                                onOpenChange={(open) => setOpenPromptPreviews(prev => ({ ...prev, [category]: open }))}
                            >
                                <Card>
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Code className="h-5 w-5 text-gray-500" />
                                                    <CardTitle className="text-lg">Preview do Prompt (Read-Only)</CardTitle>
                                                </div>
                                                {openPromptPreviews[category] ? (
                                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                                )}
                                            </div>
                                            <CardDescription>
                                                Clique para visualizar o prompt que será enviado à IA
                                            </CardDescription>
                                        </CardHeader>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <CardContent>
                                            <Textarea
                                                readOnly
                                                className="font-mono text-xs min-h-[300px] bg-gray-50"
                                                value={promptPreview}
                                            />
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        </TabsContent>
                    );
                })}

            </Tabs>
        </div>
    );
}
