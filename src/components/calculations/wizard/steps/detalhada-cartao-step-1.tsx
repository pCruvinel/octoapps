'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { cartaoStep1Schema, type CartaoStep1Data } from '@/schemas/moduloCartao.schema';
import { OcrUploadCard } from '@/components/shared/OcrUploadCard';


interface DetalhadaCartaoStep1Props {
    defaultValues?: Partial<CartaoStep1Data>;
    onDataChange?: (data: CartaoStep1Data) => void;
    onValidationChange?: (isValid: boolean) => void;
}

export function DetalhadaCartaoStep1({
    defaultValues,
    onDataChange,
    onValidationChange,
}: DetalhadaCartaoStep1Props) {
    const [ocrFilledFields, setOcrFilledFields] = React.useState<Set<string>>(new Set());

    const {
        register,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<CartaoStep1Data>({
        resolver: zodResolver(cartaoStep1Schema),
        mode: 'onChange',
        defaultValues: {
            credor: '',
            devedor: '',
            ultimosDigitos: '',
            limiteCredito: 0,
            dataInicioAnalise: '',
            dataFimAnalise: '',
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

    const handleOcrData = (data: any) => {
        const filledFields = new Set<string>();

        if (data.bandeira_banco) {
            setValue('credor', data.bandeira_banco, { shouldValidate: true });
            filledFields.add('credor');
        }
        if (data.nome_devedor) {
            setValue('devedor', data.nome_devedor, { shouldValidate: true });
            filledFields.add('devedor');
        }
        if (data.limite_credito) {
            setValue('limiteCredito', Number(data.limite_credito), { shouldValidate: true });
            filledFields.add('limiteCredito');
        }
        if (data.data_vencimento && !watchedValues.dataInicioAnalise) {
            setValue('dataInicioAnalise', data.data_vencimento, { shouldValidate: true });
            filledFields.add('dataInicioAnalise');
        }

        setOcrFilledFields(filledFields);
        setTimeout(() => setOcrFilledFields(new Set()), 5000);
    };

    const getHighlightClass = (fieldName: string) =>
        ocrFilledFields.has(fieldName) ? 'ring-2 ring-green-400 ring-offset-1 transition-all duration-300' : '';


    return (
        <div className="space-y-6">
            <OcrUploadCard
                category="CARTAO_CREDITO"
                onDataExtracted={handleOcrData}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Dados do Cartão de Crédito</CardTitle>
                    <CardDescription>Identificação da dívida e período de revisão (RMC/Rotativo)</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Emissor do Cartão (Credor)</Label>
                        <Input placeholder="Ex: Banco Santander" {...register('credor')} />
                        {errors.credor && <p className="text-sm text-red-500">{errors.credor.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Titular (Devedor)</Label>
                        <Input placeholder="Nome do cliente" {...register('devedor')} />
                        {errors.devedor && <p className="text-sm text-red-500">{errors.devedor.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Limite de Crédito</Label>
                        <CurrencyInput
                            value={watchedValues.limiteCredito}
                            onChange={(val) => setValue('limiteCredito', val || 0, { shouldValidate: true })}
                        />
                        {errors.limiteCredito && <p className="text-sm text-red-500">{errors.limiteCredito.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Últimos 4 dígitos (Opcional)</Label>
                        <Input
                            placeholder="Ex: 1234"
                            maxLength={4}
                            {...register('ultimosDigitos')}
                        />
                        {errors.ultimosDigitos && <p className="text-sm text-red-500">{errors.ultimosDigitos.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Início da Análise (1ª Fatura)</Label>
                        <DatePicker
                            value={watchedValues.dataInicioAnalise}
                            onChange={(val) => setValue('dataInicioAnalise', val || '', { shouldValidate: true })}
                        />
                        {errors.dataInicioAnalise && <p className="text-sm text-red-500">{errors.dataInicioAnalise.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Final da Análise (Última Fatura)</Label>
                        <DatePicker
                            value={watchedValues.dataFimAnalise}
                            onChange={(val) => setValue('dataFimAnalise', val || '', { shouldValidate: true })}
                        />
                        {errors.dataFimAnalise && <p className="text-sm text-red-500">{errors.dataFimAnalise.message}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
