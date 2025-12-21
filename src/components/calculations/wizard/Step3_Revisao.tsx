'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { Plus, Trash2, AlertCircle, Shield, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Schema de validação
const tarifaSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    valor: z.number().min(0, 'Valor deve ser positivo'),
    expurgar: z.boolean(),
});

const step3Schema = z.object({
    tarifas: z.array(tarifaSchema),
    multaPercent: z.number().min(0).max(10),
    moraPercent: z.number().min(0).max(10),
    baseMulta: z.enum(['PRINCIPAL', 'PARCELA_TOTAL']),
    observacoes: z.string().optional(),
});

export type Step3Data = z.infer<typeof step3Schema>;

interface Step3_RevisaoProps {
    defaultValues?: Partial<Step3Data>;
    onDataChange?: (data: Step3Data) => void;
    onValidationChange?: (isValid: boolean) => void;
}

const TARIFAS_COMUNS = [
    { nome: 'TAC (Tarifa de Abertura de Crédito)', valor: 0 },
    { nome: 'TEC (Tarifa de Emissão de Carnê)', valor: 0 },
    { nome: 'Seguro Prestamista', valor: 0 },
    { nome: 'Seguro de Proteção Financeira', valor: 0 },
    { nome: 'Tarifa de Cadastro', valor: 0 },
    { nome: 'Avaliação do Bem', valor: 0 },
    { nome: 'Registro de Contrato', valor: 0 },
    { nome: 'IOF', valor: 0 },
];

export function Step3_Revisao({
    defaultValues,
    onDataChange,
    onValidationChange,
}: Step3_RevisaoProps) {
    const {
        register,
        control,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<Step3Data>({
        resolver: zodResolver(step3Schema),
        mode: 'onChange',
        defaultValues: {
            tarifas: [],
            multaPercent: 2.0,
            moraPercent: 1.0,
            baseMulta: 'PRINCIPAL',
            observacoes: '',
            ...defaultValues,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'tarifas',
    });

    const watchedValues = watch();

    // Notifica mudança de validação
    React.useEffect(() => {
        onValidationChange?.(isValid);
    }, [isValid, onValidationChange]);

    // Notifica mudança de dados
    React.useEffect(() => {
        if (isValid) {
            onDataChange?.(watchedValues as Step3Data);
        }
    }, [watchedValues, isValid, onDataChange]);

    const adicionarTarifaComum = (nome: string) => {
        // Verifica se já existe
        const existe = fields.some(f => f.nome === nome);
        if (!existe) {
            append({ nome, valor: 0, expurgar: true });
        }
    };

    const tarifas = watchedValues.tarifas || [];
    const totalExpurgos = tarifas
        .filter(t => t.expurgar)
        .reduce((sum, t) => sum + (t.valor || 0), 0);

    return (
        <div className="space-y-6">
            {/* Resumo de Expurgos */}
            {totalExpurgos > 0 && (
                <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                                    <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Total a Expurgar</p>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpurgos)}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                {tarifas.filter(t => t.expurgar).length} itens
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tarifas para Expurgo */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Tarifas e Encargos
                    </CardTitle>
                    <CardDescription>
                        Adicione as tarifas cobradas e marque quais devem ser expurgadas do cálculo
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Botões de tarifas comuns */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b">
                        {TARIFAS_COMUNS.map((tarifa) => (
                            <Button
                                key={tarifa.nome}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => adicionarTarifaComum(tarifa.nome)}
                                disabled={fields.some(f => f.nome === tarifa.nome)}
                                className="text-xs"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                {tarifa.nome.split(' ')[0]}
                            </Button>
                        ))}
                    </div>

                    {/* Lista de tarifas */}
                    <div className="space-y-3">
                        {fields.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Nenhuma tarifa adicionada</p>
                                <p className="text-sm">Clique nos botões acima para adicionar tarifas comuns</p>
                            </div>
                        ) : (
                            fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${tarifas[index]?.expurgar
                                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                                        : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <Switch
                                        checked={tarifas[index]?.expurgar ?? true}
                                        onCheckedChange={(checked) => setValue(`tarifas.${index}.expurgar`, checked)}
                                        className="data-[state=checked]:bg-red-500"
                                    />

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                            placeholder="Nome da tarifa"
                                            {...register(`tarifas.${index}.nome`)}
                                            className="bg-white dark:bg-slate-900"
                                        />
                                        <CurrencyInput
                                            value={tarifas[index]?.valor}
                                            onChange={(value) => setValue(`tarifas.${index}.valor`, value || 0)}
                                            className="bg-white dark:bg-slate-900"
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Botão adicionar tarifa customizada */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ nome: '', valor: 0, expurgar: true })}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Tarifa Customizada
                    </Button>
                </CardContent>
            </Card>

            {/* Configuração de Inadimplência */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuração de Inadimplência</CardTitle>
                    <CardDescription>
                        Parâmetros para cálculo de multa e mora em caso de atraso
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="multaPercent">Multa (%)</Label>
                        <PercentInput
                            id="multaPercent"
                            value={watchedValues.multaPercent}
                            onChange={(value) => setValue('multaPercent', value || 0, { shouldValidate: true })}
                            decimalPlaces={1}
                            maxPercent={10}
                        />
                        <p className="text-xs text-slate-500">Máximo legal: 2%</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="moraPercent">Juros de Mora (%)</Label>
                        <PercentInput
                            id="moraPercent"
                            value={watchedValues.moraPercent}
                            onChange={(value) => setValue('moraPercent', value || 0, { shouldValidate: true })}
                            decimalPlaces={1}
                            maxPercent={10}
                        />
                        <p className="text-xs text-slate-500">Máximo legal: 1% a.m.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baseMulta">Base de Cálculo da Multa</Label>
                        <Select
                            value={watchedValues.baseMulta}
                            onValueChange={(value) => setValue('baseMulta', value as Step3Data['baseMulta'], { shouldValidate: true })}
                        >
                            <SelectTrigger id="baseMulta">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PRINCIPAL">Valor Principal</SelectItem>
                                <SelectItem value="PARCELA_TOTAL">Parcela Total</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Observações */}
            <Card>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                    <CardDescription>
                        Anotações adicionais para o laudo (opcional)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <textarea
                        {...register('observacoes')}
                        placeholder="Ex: Cliente pagou parcelas 1 a 24 em dia. A partir da parcela 25, houve atraso..."
                        className="w-full h-24 px-3 py-2 border rounded-lg resize-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

// Exporta o schema para uso no wizard pai
export { step3Schema };
