'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { imobiliarioStep1Schema, type ImobiliarioStep1Data } from '@/schemas/moduloImobiliario.schema';
import { DetalhadaImportCard } from '../detalhada-import-card';


interface Step1_ImobiliarioProps {
    defaultValues?: Partial<ImobiliarioStep1Data>;
    onDataChange?: (data: ImobiliarioStep1Data) => void;
    onValidationChange?: (isValid: boolean) => void;
}

const SISTEMAS = [
    { value: 'SAC', label: 'SAC (Sistema de Amortização Constante)' },
    { value: 'PRICE', label: 'Tabela Price' },
    { value: 'SACRE', label: 'SACRE' },
] as const;

const INDEXADORES = [
    { value: 'TR', label: 'TR (Taxa Referencial)' },
    { value: 'IPCA', label: 'IPCA' },
    { value: 'INPC', label: 'INPC' },
    { value: 'IGPM', label: 'IGPM' },
] as const;

export function DetalhadaImobiliariaStep1({
    defaultValues,
    onDataChange,
    onValidationChange,
}: Step1_ImobiliarioProps) {
    const [ocrFilledFields, setOcrFilledFields] = React.useState<Set<string>>(new Set());

    const {
        register,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<ImobiliarioStep1Data>({
        resolver: zodResolver(imobiliarioStep1Schema) as any,
        mode: 'onChange',
        defaultValues: {
            credor: '',
            devedor: '',
            contratoNum: '',
            sistemaAmortizacao: 'SAC',
            indexador: 'TR',
            valorCompraVenda: 0,
            valorFinanciado: 0,
            prazoMeses: 360,
            dataContrato: '',
            dataLiberacao: '',
            dataPrimeiraParcela: '',
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

        if (data.nome_credor) {
            setValue('credor', data.nome_credor, { shouldValidate: true });
            filledFields.add('credor');
        }
        if (data.nome_devedor) {
            setValue('devedor', data.nome_devedor, { shouldValidate: true });
            filledFields.add('devedor');
        }
        if (data.valor_imovel) {
            setValue('valorCompraVenda', Number(data.valor_imovel), { shouldValidate: true });
            filledFields.add('valorCompraVenda');
        }
        if (data.valor_financiado) {
            setValue('valorFinanciado', Number(data.valor_financiado), { shouldValidate: true });
            filledFields.add('valorFinanciado');
        }
        if (data.prazo_meses) {
            setValue('prazoMeses', Number(data.prazo_meses), { shouldValidate: true });
            filledFields.add('prazoMeses');
        }

        if (data.sistema_amortizacao) {
            const val = data.sistema_amortizacao.toUpperCase();
            if (val.includes('SACRE')) setValue('sistemaAmortizacao', 'SACRE');
            else if (val.includes('PRICE') || val.includes('TP')) setValue('sistemaAmortizacao', 'PRICE');
            else if (val.includes('SAC')) setValue('sistemaAmortizacao', 'SAC');
            filledFields.add('sistemaAmortizacao');
        }

        if (data.indexador) {
            const val = data.indexador.toUpperCase();
            if (val.includes('TR')) setValue('indexador', 'TR');
            else if (val.includes('IPCA')) setValue('indexador', 'IPCA');
            else if (val.includes('INPC')) setValue('indexador', 'INPC');
            else if (val.includes('IGPM') || val.includes('IGP-M')) setValue('indexador', 'IGPM');
            filledFields.add('indexador');
        }

        if (data.data_contrato) {
            setValue('dataContrato', data.data_contrato, { shouldValidate: true });
            filledFields.add('dataContrato');
        }
        if (data.data_primeiro_vencimento) {
            setValue('dataPrimeiraParcela', data.data_primeiro_vencimento, { shouldValidate: true });
            filledFields.add('dataPrimeiraParcela');
        }

        setOcrFilledFields(filledFields);
        setTimeout(() => setOcrFilledFields(new Set()), 5000);
    };

    const getHighlightClass = (fieldName: string) =>
        ocrFilledFields.has(fieldName) ? 'ring-2 ring-green-400 ring-offset-1 transition-all duration-300' : '';

    return (
        <div className="space-y-6">
            <DetalhadaImportCard
                category="IMOBILIARIO"
                onDataExtracted={handleOcrData}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Identificação e Valores do Imóvel</CardTitle>
                    <CardDescription>Dados cadastrais do financiamento habitacional</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Credor</Label>
                        <Input placeholder="Ex: Caixa Econômica Federal" className={getHighlightClass('credor')} {...register('credor')} />
                        {errors.credor && <p className="text-sm text-red-500">{errors.credor.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Devedor</Label>
                        <Input placeholder="Nome do proprietário" className={getHighlightClass('devedor')} {...register('devedor')} />
                        {errors.devedor && <p className="text-sm text-red-500">{errors.devedor.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Valor do Imóvel (Venda/Avaliação)</Label>
                        <CurrencyInput
                            value={watchedValues.valorCompraVenda}
                            onChange={(val) => setValue('valorCompraVenda', val || 0, { shouldValidate: true })}
                            className={getHighlightClass('valorCompraVenda')}
                        />
                        {errors.valorCompraVenda && <p className="text-sm text-red-500">{errors.valorCompraVenda.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Valor Financiado (Crédito)</Label>
                        <CurrencyInput
                            value={watchedValues.valorFinanciado}
                            onChange={(val) => setValue('valorFinanciado', val || 0, { shouldValidate: true })}
                            className={getHighlightClass('valorFinanciado')}
                        />
                        {errors.valorFinanciado && <p className="text-sm text-red-500">{errors.valorFinanciado.message}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configuração e Prazos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Sistema de Amortização</Label>
                        <Select
                            value={watchedValues.sistemaAmortizacao}
                            onValueChange={(val) => setValue('sistemaAmortizacao', val as any)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SISTEMAS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Indexador (Correção)</Label>
                        <Select
                            value={watchedValues.indexador}
                            onValueChange={(val) => setValue('indexador', val as any)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {INDEXADORES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Prazo (Meses)</Label>
                        <Input type="number" className={getHighlightClass('prazoMeses')} {...register('prazoMeses', { valueAsNumber: true })} />
                        {errors.prazoMeses && <p className="text-sm text-red-500">{errors.prazoMeses.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Data do Contrato</Label>
                        <DatePicker
                            value={watchedValues.dataContrato}
                            onChange={(val) => setValue('dataContrato', val || '', { shouldValidate: true })}
                            className={getHighlightClass('dataContrato')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Data Liberação/Chaves</Label>
                        <DatePicker
                            value={watchedValues.dataLiberacao}
                            onChange={(val) => setValue('dataLiberacao', val || '', { shouldValidate: true })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Data da 1ª Parcela</Label>
                        <DatePicker
                            value={watchedValues.dataPrimeiraParcela}
                            onChange={(val) => setValue('dataPrimeiraParcela', val || '', { shouldValidate: true })}
                            className={getHighlightClass('dataPrimeiraParcela')}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
