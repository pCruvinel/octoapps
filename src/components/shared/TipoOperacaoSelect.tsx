import React from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { useTiposOperacao } from '@/hooks/useTiposOperacao';
import { Label } from '@/components/ui/label';
import {
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface TipoOperacaoSelectProps {
    /**
     * Categoria(s) para filtrar os tipos de operação
     * Ex: 'VEICULO' ou ['EMPRESTIMO', 'VEICULO']
     */
    categorias: string | string[];

    /**
     * Field do React Hook Form Controller
     * Opcional se value/onValueChange forem fornecidos
     */
    field?: ControllerRenderProps<any, any>;

    /**
     * Valor controlado (se field não fornecido)
     */
    value?: string;

    /**
     * Callback de alteração (se field não fornecido)
     */
    onValueChange?: (value: string) => void;

    /**
     * Nome do campo (se field não fornecido)
     */
    name?: string;

    /**
     * Desabilitar select
     */
    disabled?: boolean;

    /**
     * Label do campo (default: "Tipo de Operação")
     */
    label?: string;

    /**
     * Se true, mostra "20749 - Veículos PF" no item do select
     * Se false, mostra apenas "Veículos PF"
     * @default false
     */
    showSerieInLabel?: boolean;

    /**
     * Se true, mostra "Série BACEN: 20749" no helper text
     * Se false, mostra o helperText estático (se fornecido)
     * @default false
     */
    showSerieInHelper?: boolean;

    /**
     * Texto de ajuda estático abaixo do select
     * Ignorado se showSerieInHelper = true
     */
    helperText?: string;

    /**
     * ClassName adicional para o SelectTrigger
     * Ex: estilo verde quando OCR preenche o campo
     */
    triggerClassName?: string;

    /**
     * Placeholder do select
     * @default "Selecione..."
     */
    placeholder?: string;
}

/**
 * Componente reutilizável para seleção de tipos de operação BACEN
 * 
 * Agora é híbrido: detecta automaticamente se está dentro de um Form context.
 * - Se estiver em Form: usa FormItem/FormLabel/FormMessage (com validação)
 * - Se não estiver: usa div/Label (seguro contra crash)
 * 
 * Suporta tanto ControllerRenderProps (field) quanto props manuais (value/onValueChange).
 */
export function TipoOperacaoSelect({
    categorias,
    field,
    value,
    onValueChange,
    name,
    disabled = false,
    label = 'Tipo de Operação',
    showSerieInLabel = false,
    showSerieInHelper = false,
    helperText,
    triggerClassName,
    placeholder = 'Selecione...',
}: TipoOperacaoSelectProps) {
    const { tiposOperacao, loading, getSeriePorCodigo } = useTiposOperacao({
        categoria: categorias,
    });

    // Check if we are inside a Form context
    const formContext = useFormContext();
    const hasFormContext = !!formContext;

    // Determine effective values
    const effectiveValue = field?.value || value || '';
    const effectiveOnChange = field?.onChange || onValueChange;
    const effectiveName = field?.name || name;

    // Renderiza o conteúdo do SelectItem
    const renderItemLabel = (tipo: { codigo: string; nome: string; serie_bacen: number }) => {
        if (showSerieInLabel) {
            return `${tipo.serie_bacen} - ${tipo.nome}`;
        }
        return tipo.nome;
    };

    // Renderiza o helper text abaixo do select
    const renderHelperText = () => {
        if (showSerieInHelper && effectiveValue && !loading) {
            const serie = getSeriePorCodigo(effectiveValue);
            return serie ? `Série BACEN: ${serie}` : 'Selecione o tipo';
        }

        if (showSerieInHelper && !effectiveValue) {
            return 'Selecione o tipo';
        }

        return helperText;
    };

    const computedHelperText = renderHelperText();

    // Guard: If neither field nor manual control provided, or if specifically disabled disabled
    const isInteractive = !!effectiveOnChange && !disabled;

    if (!isInteractive && !loading && !effectiveValue) {
        // Show disabled placeholder if not interactive and no value to show
        return (
            <div className="grid gap-2">
                <Label className="text-sm font-medium">{label}</Label>
                <Select disabled>
                    <SelectTrigger className={triggerClassName}>
                        <SelectValue placeholder="Aguardando..." />
                    </SelectTrigger>
                </Select>
            </div>
        );
    }

    // Common Select Component
    const SelectComponent = (
        <Select
            onValueChange={effectiveOnChange}
            value={effectiveValue}
            name={effectiveName}
            disabled={disabled || loading}
        >
            <SelectTrigger className={triggerClassName} id={effectiveName}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {loading ? (
                    <div className="flex items-center justify-center p-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Carregando...
                    </div>
                ) : (
                    tiposOperacao.map((tipo) => (
                        <SelectItem key={tipo.codigo} value={tipo.codigo}>
                            {renderItemLabel(tipo)}
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    );

    // Render based on context availability
    // We only use the FormItem structure if we have the context AND the field prop
    // This prevents crashing if used manually (controlled) inside a Form but outside a FormField
    if (hasFormContext && field) {
        return (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    {SelectComponent}
                </FormControl>
                {computedHelperText && (
                    <p className={`text-xs ${showSerieInHelper ? 'text-slate-400' : 'text-slate-500'}`}>
                        {computedHelperText}
                    </p>
                )}
                <FormMessage />
            </FormItem>
        );
    }

    // Fallback for usage without Form context
    return (
        <div className="grid gap-2">
            <Label htmlFor={field.name} className="text-sm font-medium">{label}</Label>
            {SelectComponent}
            {computedHelperText && (
                <p className={`text-xs ${showSerieInHelper ? 'text-slate-400' : 'text-slate-500'}`}>
                    {computedHelperText}
                </p>
            )}
        </div>
    );
}

