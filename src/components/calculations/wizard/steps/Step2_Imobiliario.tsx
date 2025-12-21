'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { imobiliarioStep2Schema, type ImobiliarioStep2Data } from '@/schemas/moduloImobiliario.schema';

interface Step2_ImobiliarioProps {
    defaultValues?: Partial<ImobiliarioStep2Data>;
    onDataChange?: (data: ImobiliarioStep2Data) => void;
    onValidationChange?: (isValid: boolean) => void;
    contractDate?: string;
}

export function Step2_Imobiliario({
    defaultValues,
    onDataChange,
    onValidationChange,
    contractDate,
}: Step2_ImobiliarioProps) {
    const {
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<ImobiliarioStep2Data>({
        resolver: zodResolver(imobiliarioStep2Schema),
        mode: 'onChange',
        defaultValues: {
            taxaJurosMensal: 0,
            taxaJurosNominal: 0,
            taxaJurosEfetiva: 0,
            taxaAdministracao: 25.00,
            seguroMIP: { valor: 0, tipo: 'PERCENTUAL_SALDO' },
            seguroDFI: { valor: 0, tipo: 'PERCENTUAL_IMOVEL' },
            ...defaultValues,
        },
    });

    const watchedValues = watch();

    React.useEffect(() => {
        onValidationChange?.(isValid);
        if (isValid) {
            onDataChange?.(watchedValues);
        }
    }, [isValid, watchedValues, onValidationChange, onDataChange]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Taxas de Juros</CardTitle>
                    <CardDescription>Defina as taxas do contrato (Sincronização automática)</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Taxa Mensal (%)</Label>
                        <PercentInput
                            value={watchedValues.taxaJurosMensal}
                            onChange={(val) => {
                                const mensal = val || 0;
                                const nominal = mensal * 12;
                                const efetiva = (Math.pow(1 + mensal / 100, 12) - 1) * 100;

                                setValue('taxaJurosMensal', mensal, { shouldValidate: true });
                                setValue('taxaJurosNominal', nominal, { shouldValidate: true });
                                setValue('taxaJurosEfetiva', efetiva);
                            }}
                            decimalPlaces={4}
                            placeholder="Ex: 0.70%"
                        />
                        {errors.taxaJurosMensal && <p className="text-sm text-red-500">{errors.taxaJurosMensal.message}</p>}
                        {watchedValues.taxaJurosMensal > 2 && (
                            <p className="text-sm text-amber-600">⚠️ Taxa mensal alta para imobiliário</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Taxa Nominal Anual (%)</Label>
                        <PercentInput
                            value={watchedValues.taxaJurosNominal}
                            onChange={(val) => {
                                const nominal = val || 0;
                                const mensal = nominal / 12;
                                const efetiva = (Math.pow(1 + mensal / 100, 12) - 1) * 100;

                                setValue('taxaJurosNominal', nominal, { shouldValidate: true });
                                setValue('taxaJurosMensal', mensal, { shouldValidate: true });
                                setValue('taxaJurosEfetiva', efetiva);
                            }}
                            decimalPlaces={4}
                            placeholder="Ex: 8.5%"
                        />
                        {errors.taxaJurosNominal && <p className="text-sm text-red-500">{errors.taxaJurosNominal.message}</p>}
                        {watchedValues.taxaJurosNominal > 20 && (
                            <p className="text-sm text-amber-600">⚠️ Taxa nominal alta para imobiliário</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Taxa Efetiva / CET Anual (%)</Label>
                        <PercentInput
                            value={watchedValues.taxaJurosEfetiva}
                            onChange={(val) => setValue('taxaJurosEfetiva', val || 0)}
                            decimalPlaces={4}
                            placeholder="Ex: 9.2%"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Seguros e Taxas Mensais</CardTitle>
                    <CardDescription>Seguros habitacionais obrigatórios e taxas administrativas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Seguro MIP */}
                    <div className="grid md:grid-cols-2 gap-4 border-b pb-4">
                        <div className="space-y-2">
                            <Label>Seguro MIP (Morte e Invalidez)</Label>
                            <Select
                                value={watchedValues.seguroMIP.tipo}
                                onValueChange={(val: any) => setValue('seguroMIP', { ...watchedValues.seguroMIP, tipo: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTUAL_SALDO">% sobre Saldo Devedor</SelectItem>
                                    <SelectItem value="FIXO">Valor Fixo (R$)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor / Alíquota</Label>
                            {watchedValues.seguroMIP.tipo === 'FIXO' ? (
                                <CurrencyInput
                                    value={watchedValues.seguroMIP.valor}
                                    onChange={(val) => setValue('seguroMIP.valor', val || 0)}
                                />
                            ) : (
                                <PercentInput
                                    value={watchedValues.seguroMIP.valor}
                                    onChange={(val) => setValue('seguroMIP.valor', val || 0)}
                                    decimalPlaces={4}
                                    placeholder="Ex: 0.0245%"
                                />
                            )}
                        </div>
                    </div>

                    {/* Seguro DFI */}
                    <div className="grid md:grid-cols-2 gap-4 border-b pb-4">
                        <div className="space-y-2">
                            <Label>Seguro DFI (Danos Físicos)</Label>
                            <Select
                                value={watchedValues.seguroDFI.tipo}
                                onValueChange={(val: any) => setValue('seguroDFI', { ...watchedValues.seguroDFI, tipo: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTUAL_IMOVEL">% sobre Valor Imóvel</SelectItem>
                                    <SelectItem value="FIXO">Valor Fixo (R$)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor / Alíquota</Label>
                            {watchedValues.seguroDFI.tipo === 'FIXO' ? (
                                <CurrencyInput
                                    value={watchedValues.seguroDFI.valor}
                                    onChange={(val) => setValue('seguroDFI.valor', val || 0)}
                                />
                            ) : (
                                <PercentInput
                                    value={watchedValues.seguroDFI.valor}
                                    onChange={(val) => setValue('seguroDFI.valor', val || 0)}
                                    decimalPlaces={4}
                                    placeholder="Ex: 0.0090%"
                                />
                            )}
                        </div>
                    </div>

                    {/* Taxa ADM */}
                    <div className="w-1/2 space-y-2">
                        <Label>Taxa de Administração (Mensal)</Label>
                        <CurrencyInput
                            value={watchedValues.taxaAdministracao}
                            onChange={(val) => setValue('taxaAdministracao', val || 0)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
