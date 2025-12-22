'use client';

import { useState } from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TipoOperacaoSelect } from '@/components/shared/TipoOperacaoSelect';
import { useContatos, ContatoSimplificado } from '@/hooks/useContatos';

// ============================================================================
// TYPES
// ============================================================================

export interface CardIdentificacaoProps<TFieldValues extends FieldValues = FieldValues> {
    /** React Hook Form control object */
    control: Control<TFieldValues>;

    /** Field names mapping - customize to match your form schema */
    fieldNames?: {
        credor?: FieldPath<TFieldValues>;
        devedor?: FieldPath<TFieldValues>;
        devedorId?: FieldPath<TFieldValues>;
        tipoOperacao?: FieldPath<TFieldValues>;
        numeroContrato?: FieldPath<TFieldValues>;
    };

    /** Categories for TipoOperacaoSelect */
    tipoOperacaoCategorias: string | string[];

    /** Show serie number in TipoOperacaoSelect label */
    showSerieInLabel?: boolean;

    /** Optional class name for OCR field styling */
    ocrFieldClassName?: (fieldName: string) => string;
}

// ============================================================================
// DEFAULT FIELD NAMES
// ============================================================================

const DEFAULT_FIELD_NAMES = {
    credor: 'credor' as const,
    devedor: 'devedor' as const,
    devedorId: 'devedorId' as const,
    tipoOperacao: 'tipoContrato' as const,
    numeroContrato: 'numeroContrato' as const,
};

// ============================================================================
// CREATABLE COMBOBOX FOR DEVEDOR
// ============================================================================

interface DevedorComboboxProps {
    value: string;
    onChange: (value: string) => void;
    onIdChange?: (id: string | null) => void;
    contatos: ContatoSimplificado[];
    loading: boolean;
    onCreateContato: (nome: string) => Promise<string | null>;
    className?: string;
}

function DevedorCombobox({
    value,
    onChange,
    onIdChange,
    contatos,
    loading,
    onCreateContato,
    className
}: DevedorComboboxProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [creating, setCreating] = useState(false);

    const filteredContatos = contatos.filter(c =>
        c.nome.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleSelect = (contato: ContatoSimplificado) => {
        onChange(contato.nome);
        onIdChange?.(contato.id);
        setOpen(false);
        setInputValue('');
    };

    const handleCreateNew = async () => {
        if (inputValue.trim()) {
            setCreating(true);
            const novoId = await onCreateContato(inputValue.trim());
            onChange(inputValue.trim());
            onIdChange?.(novoId);
            setCreating(false);
            setOpen(false);
            setInputValue('');
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando contatos...
                        </span>
                    ) : (
                        value || "Selecione ou digite o nome..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar ou criar contato..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        {loading ? (
                            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Carregando...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty className="py-2">
                                    {inputValue.trim() ? (
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2"
                                            onClick={handleCreateNew}
                                            disabled={creating}
                                        >
                                            {creating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserPlus className="h-4 w-4" />
                                            )}
                                            Criar "{inputValue.trim()}"
                                        </Button>
                                    ) : (
                                        <span className="text-sm text-muted-foreground px-2">
                                            Digite para buscar ou criar
                                        </span>
                                    )}
                                </CommandEmpty>
                                <CommandGroup>
                                    {filteredContatos.map((contato) => (
                                        <CommandItem
                                            key={contato.id}
                                            value={contato.nome}
                                            onSelect={() => handleSelect(contato)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === contato.nome ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{contato.nome}</span>
                                                {contato.cpf_cnpj && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {contato.cpf_cnpj}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                {inputValue.trim() && !filteredContatos.find(c => c.nome.toLowerCase() === inputValue.toLowerCase()) && (
                                    <CommandGroup heading="Criar novo">
                                        <CommandItem onSelect={handleCreateNew}>
                                            {creating ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserPlus className="mr-2 h-4 w-4" />
                                            )}
                                            Criar "{inputValue.trim()}"
                                        </CommandItem>
                                    </CommandGroup>
                                )}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CardIdentificacao<TFieldValues extends FieldValues = FieldValues>({
    control,
    fieldNames = {},
    tipoOperacaoCategorias,
    showSerieInLabel = true,
    ocrFieldClassName,
}: CardIdentificacaoProps<TFieldValues>) {
    const fields = { ...DEFAULT_FIELD_NAMES, ...fieldNames };

    // Hook para buscar contatos do Supabase
    const { contatos, loading, criarContato } = useContatos();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Identificação</CardTitle>
                <CardDescription>Partes e tipo de operação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Credor */}
                <FormField
                    control={control}
                    name={fields.credor as FieldPath<TFieldValues>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Credor *</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    id="credor"
                                    placeholder="Ex: Banco do Brasil"
                                    className={ocrFieldClassName?.('credor')}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Devedor - Smart Select from Supabase */}
                <FormField
                    control={control}
                    name={fields.devedor as FieldPath<TFieldValues>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Devedor *</FormLabel>
                            <FormControl>
                                <DevedorCombobox
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    contatos={contatos}
                                    loading={loading}
                                    onCreateContato={criarContato}
                                    className={ocrFieldClassName?.('devedor')}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Tipo de Operação */}
                <FormField
                    control={control}
                    name={fields.tipoOperacao as FieldPath<TFieldValues>}
                    render={({ field }) => (
                        <TipoOperacaoSelect
                            categorias={tipoOperacaoCategorias}
                            field={field}
                            showSerieInLabel={showSerieInLabel}
                            helperText="Define a série temporal do Bacen"
                            triggerClassName={ocrFieldClassName?.('tipoOperacao')}
                        />
                    )}
                />

                {/* Número do Contrato (Opcional) */}
                <FormField
                    control={control}
                    name={fields.numeroContrato as FieldPath<TFieldValues>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nº do Contrato (Opcional)</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    id="numeroContrato"
                                    placeholder="Ex: 123456789"
                                    className={ocrFieldClassName?.('numeroContrato')}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
