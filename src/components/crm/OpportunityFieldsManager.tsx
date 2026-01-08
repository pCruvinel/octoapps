'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Settings2, Eye, EyeOff, Save, Loader2, RotateCcw } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface OpportunityFieldsManagerProps {
    onBack: () => void;
}

interface FieldConfig {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
    required?: boolean;
}

const DEFAULT_FIELDS: FieldConfig[] = [
    { id: 'contato', label: 'Nome do Contato', description: 'Nome do cliente/lead vinculado', enabled: true, required: true },
    { id: 'valor_estimado', label: 'Valor Estimado', description: 'Valor monetário da oportunidade', enabled: true },
    { id: 'tipo_acao', label: 'Tipo de Operação', description: 'Tipo do produto/serviço (Badge)', enabled: true },
    { id: 'data_criacao', label: 'Data de Criação', description: 'Quando a oportunidade foi criada', enabled: true },
    { id: 'responsavel', label: 'Responsável', description: 'Avatar do usuário responsável', enabled: true },
    { id: 'origem', label: 'Origem', description: 'Canal de onde veio o lead', enabled: false },
    { id: 'comentarios_count', label: 'Contador de Comentários', description: 'Quantidade de comentários', enabled: true },
    { id: 'anexos_count', label: 'Contador de Anexos', description: 'Quantidade de arquivos anexados', enabled: true },
];

const STORAGE_KEY = 'octoapps_opportunity_card_fields';

export function OpportunityFieldsManager({ onBack }: OpportunityFieldsManagerProps) {
    const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load saved config from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with defaults to handle new fields
                const merged = DEFAULT_FIELDS.map(defaultField => {
                    const savedField = parsed.find((f: FieldConfig) => f.id === defaultField.id);
                    return savedField ? { ...defaultField, enabled: savedField.enabled } : defaultField;
                });
                setFields(merged);
            } catch (e) {
                console.error('Error loading field config:', e);
            }
        }
    }, []);

    const handleToggle = (fieldId: string) => {
        setFields(prev =>
            prev.map(field =>
                field.id === fieldId && !field.required
                    ? { ...field, enabled: !field.enabled }
                    : field
            )
        );
        setHasChanges(true);
    };

    const handleSave = () => {
        setLoading(true);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
            toast.success('Configurações salvas com sucesso!');
            setHasChanges(false);
        } catch (e) {
            toast.error('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFields(DEFAULT_FIELDS);
        localStorage.removeItem(STORAGE_KEY);
        toast.success('Configurações restauradas');
        setHasChanges(false);
    };

    const enabledCount = fields.filter(f => f.enabled).length;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-3xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="gap-2 mb-4 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o Kanban
                    </Button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Settings2 className="w-7 h-7 text-slate-600" />
                                Campos do Card
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Configure quais informações exibir nos cards de oportunidade
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Restaurar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!hasChanges || loading}
                                className="gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Salvar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Campos disponíveis para exibição nos cards
                        </p>
                        <span className="text-xs text-slate-500">
                            {enabledCount} de {fields.length} campos ativos
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {fields.map((field) => (
                            <div
                                key={field.id}
                                className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${field.required ? 'bg-slate-50/50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${field.enabled
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}
                                    >
                                        {field.enabled ? (
                                            <Eye className="w-5 h-5" />
                                        ) : (
                                            <EyeOff className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Label className="font-medium text-slate-900">
                                                {field.label}
                                            </Label>
                                            {field.required && (
                                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                    Obrigatório
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">{field.description}</p>
                                    </div>
                                </div>

                                <Switch
                                    checked={field.enabled}
                                    onCheckedChange={() => handleToggle(field.id)}
                                    disabled={field.required}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Info */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Dica:</strong> As alterações serão aplicadas em todos os cards do Kanban após salvar.
                        Campos marcados como obrigatórios não podem ser ocultados.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Export helper to get field config from other components
export function getOpportunityFieldConfig(): FieldConfig[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return DEFAULT_FIELDS;
        }
    }
    return DEFAULT_FIELDS;
}
