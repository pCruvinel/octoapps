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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, TrendingUp, Loader2, ChevronDown, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { geralStep1Schema, type GeralStep1Data } from '@/schemas/moduloGeral.schema';
import { ContractUploadButton } from '../ContractUploadButton';
import { fetchMarketRate, getEstimatedMarketRate } from '@/utils/financialCalculations';


interface Step1_GeralProps {
    defaultValues?: Partial<GeralStep1Data>;
    onDataChange?: (data: GeralStep1Data) => void;
    onValidationChange?: (isValid: boolean) => void;
}

const TIPOS_CONTRATO = [
    { value: 'PESSOAL', label: 'Empréstimo Pessoal' },
    { value: 'CONSIGNADO_PRIVADO', label: 'Consignado Privado' },
    { value: 'CONSIGNADO_PUBLICO', label: 'Consignado Público' },
    { value: 'CONSIGNADO_INSS', label: 'Consignado INSS' },
    { value: 'CAPITAL_GIRO', label: 'Capital de Giro' },
    { value: 'VEICULO', label: 'Financiamento de Veículo' },
    { value: 'CHEQUE_ESPECIAL', label: 'Cheque Especial' },
] as const;

export function Step1_Geral({
    defaultValues,
    onDataChange,
    onValidationChange,
}: Step1_GeralProps) {
    const [taxaMercado, setTaxaMercado] = React.useState<number | null>(null);
    const [loadingTaxa, setLoadingTaxa] = React.useState(false);
    const [carenciaAlert, setCarenciaAlert] = React.useState(false);
    const [ocrFilledFields, setOcrFilledFields] = React.useState<Set<string>>(new Set());
    const [tarifasOpen, setTarifasOpen] = React.useState(false);

    const {
        register,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<GeralStep1Data>({
        resolver: zodResolver(geralStep1Schema) as any,
        mode: 'onChange',
        defaultValues: {
            credor: '',
            devedor: '',
            contratoNum: '',
            tipoContrato: 'PESSOAL',
            valorFinanciado: 0,
            dataContrato: '',
            dataPrimeiroVencimento: '',
            prazoMeses: 12,
            ...defaultValues,
        },
    });

    const watchedValues = watch();

    // Notifica validação e dados
    React.useEffect(() => {
        onValidationChange?.(isValid);
        if (isValid) {
            onDataChange?.(watchedValues);
        }
    }, [isValid, watchedValues, onValidationChange, onDataChange]);

    // Calcula carência
    React.useEffect(() => {
        const { dataContrato, dataPrimeiroVencimento } = watchedValues;
        if (dataContrato && dataPrimeiroVencimento) {
            const contrato = new Date(dataContrato);
            const vencimento = new Date(dataPrimeiroVencimento);

            if (vencimento >= contrato) {
                const diffDays = Math.floor((vencimento.getTime() - contrato.getTime()) / (1000 * 60 * 60 * 24));
                setCarenciaAlert(diffDays > 45);
            } else {
                setCarenciaAlert(false);
            }
        }
    }, [watchedValues.dataContrato, watchedValues.dataPrimeiroVencimento]);

    // Busca taxa Bacen real via Edge Function (com debounce)
    const lastFetchedRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        const tipoContrato = watchedValues.tipoContrato;
        const dataContrato = watchedValues.dataContrato;

        // Guard: só buscar se data mudou e é válida
        if (!tipoContrato || !dataContrato || dataContrato.length < 10) {
            return;
        }

        // Guard: não refetchar se já buscou essa data
        if (lastFetchedRef.current === dataContrato) {
            return;
        }

        // Debounce de 500ms
        const timer = setTimeout(() => {
            lastFetchedRef.current = dataContrato;
            setLoadingTaxa(true);

            fetchMarketRate('GERAL', dataContrato)
                .then((rate) => {
                    if (rate !== null) {
                        setTaxaMercado(rate);
                    } else {
                        const estimated = getEstimatedMarketRate('GERAL', dataContrato);
                        setTaxaMercado(estimated);
                    }
                })
                .catch((err) => {
                    console.warn('[Step1_Geral] Erro ao buscar taxa:', err);
                    const estimated = getEstimatedMarketRate('GERAL', dataContrato);
                    setTaxaMercado(estimated);
                })
                .finally(() => {
                    setLoadingTaxa(false);
                });
        }, 500);

        return () => clearTimeout(timer);
    }, [watchedValues.tipoContrato, watchedValues.dataContrato]);

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
        if (data.numero_contrato) {
            setValue('contratoNum', data.numero_contrato);
            filledFields.add('contratoNum');
        }
        if (data.valor_financiado) {
            setValue('valorFinanciado', Number(data.valor_financiado), { shouldValidate: true });
            filledFields.add('valorFinanciado');
        }
        if (data.prazo_meses) {
            setValue('prazoMeses', Number(data.prazo_meses), { shouldValidate: true });
            filledFields.add('prazoMeses');
        }
        if (data.data_contrato) {
            setValue('dataContrato', data.data_contrato, { shouldValidate: true });
            filledFields.add('dataContrato');
        }
        if (data.data_primeiro_vencimento) {
            setValue('dataPrimeiroVencimento', data.data_primeiro_vencimento, { shouldValidate: true });
            filledFields.add('dataPrimeiroVencimento');
        }

        setOcrFilledFields(filledFields);

        // Clear highlights after 5 seconds
        setTimeout(() => setOcrFilledFields(new Set()), 5000);

        // Handle OCR extracted taxa
        if (data.taxa_juros_mensal) {
            const taxaMensal = Number(data.taxa_juros_mensal);
            setValue('taxaMensalContrato', taxaMensal, { shouldValidate: true });
            const taxaAnual = (Math.pow(1 + taxaMensal / 100, 12) - 1) * 100;
            setValue('taxaAnualContrato', taxaAnual, { shouldValidate: true });
            filledFields.add('taxaMensalContrato');
            toast.success(`Taxa de juros mensal detectada: ${taxaMensal}%`);
        }
        if (data.valor_parcela) {
            setValue('valorPrestacao', Number(data.valor_parcela), { shouldValidate: true });
            filledFields.add('valorPrestacao');
        }
        // Handle tarifas from OCR
        if (data.tac || data.seguro_prestamista) {
            setTarifasOpen(true);
            if (data.tac) {
                setValue('tarifas.tac', Number(data.tac));
            }
            if (data.seguro_prestamista) {
                setValue('tarifas.seguroPrestamista', Number(data.seguro_prestamista));
            }
        }
    };

    // Helper for highlight class
    const getHighlightClass = (fieldName: string) =>
        ocrFilledFields.has(fieldName) ? 'ring-2 ring-green-400 ring-offset-1 transition-all duration-300' : '';

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-blue-900">Importar Contrato</CardTitle>
                            <CardDescription className="text-blue-700">Preencher automaticamente com IA</CardDescription>
                        </div>
                        <ContractUploadButton
                            category="EMPRESTIMOS_VEICULOS"
                            onDataExtracted={handleOcrData}
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        />
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Identificação do Contrato</CardTitle>
                    <CardDescription>Informe os dados básicos da operação de crédito</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="credor">Credor</Label>
                        <Input id="credor" placeholder="Ex: Banco do Brasil" className={getHighlightClass('credor')} {...register('credor')} />
                        {errors.credor && <p className="text-sm text-red-500">{errors.credor.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="devedor">Devedor</Label>
                        <Input id="devedor" placeholder="Nome do cliente" className={getHighlightClass('devedor')} {...register('devedor')} />
                        {errors.devedor && <p className="text-sm text-red-500">{errors.devedor.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipoContrato">Tipo de Operação</Label>
                        <Select
                            value={watchedValues.tipoContrato}
                            onValueChange={(val) => setValue('tipoContrato', val as any, { shouldValidate: true })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TIPOS_CONTRATO.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contratoNum">Nº do Contrato (Opcional)</Label>
                        <Input id="contratoNum" className={getHighlightClass('contratoNum')} {...register('contratoNum')} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Valores e Prazos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    {/* Campos condicionais para veículos */}
                    {watchedValues.tipoContrato === 'VEICULO' && (
                        <>
                            <div className="space-y-2">
                                <Label>Valor do Bem</Label>
                                <CurrencyInput
                                    value={watchedValues.valorBem}
                                    onChange={(val) => setValue('valorBem', val || 0, { shouldValidate: true })}
                                    className={getHighlightClass('valorBem')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Valor da Entrada</Label>
                                <CurrencyInput
                                    value={watchedValues.valorEntrada}
                                    onChange={(val) => setValue('valorEntrada', val || 0, { shouldValidate: true })}
                                    className={getHighlightClass('valorEntrada')}
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>Valor Financiado (Crédito Liberado)</Label>
                        <CurrencyInput
                            value={watchedValues.valorFinanciado}
                            onChange={(val) => setValue('valorFinanciado', val || 0, { shouldValidate: true })}
                            className={getHighlightClass('valorFinanciado')}
                        />
                        {errors.valorFinanciado && <p className="text-sm text-red-500">{errors.valorFinanciado.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Data do Contrato</Label>
                        <DatePicker
                            value={watchedValues.dataContrato}
                            onChange={(val) => setValue('dataContrato', val || '', { shouldValidate: true })}
                            className={getHighlightClass('dataContrato')}
                        />
                        {errors.dataContrato && <p className="text-sm text-red-500">{errors.dataContrato.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Data de Liberação (Opcional)</Label>
                        <DatePicker
                            value={watchedValues.dataLiberacao}
                            onChange={(val) => setValue('dataLiberacao', val || '', { shouldValidate: true })}
                            className={getHighlightClass('dataLiberacao')}
                        />
                        <p className="text-xs text-slate-500">Para cálculo de juros de carência</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Data do 1º Pagamento</Label>
                        <DatePicker
                            value={watchedValues.dataPrimeiroVencimento}
                            onChange={(val) => setValue('dataPrimeiroVencimento', val || '', { shouldValidate: true })}
                            className={getHighlightClass('dataPrimeiroVencimento')}
                        />
                        {errors.dataPrimeiroVencimento && <p className="text-sm text-red-500">{errors.dataPrimeiroVencimento.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Prazo (Meses)</Label>
                        <Input
                            type="number"
                            className={getHighlightClass('prazoMeses')}
                            {...register('prazoMeses', { valueAsNumber: true })}
                        />
                        {errors.prazoMeses && <p className="text-sm text-red-500">{errors.prazoMeses.message}</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Alerta de carência */}
            {carenciaAlert && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Período de Carência Detectado</AlertTitle>
                    <AlertDescription>
                        Intervalo {'>'} 45 dias entre contrato e primeiro pagamento.
                    </AlertDescription>
                </Alert>
            )}

            {/* Display Taxa Mercado */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">Taxa Média de Mercado</span>
                    </div>
                    {loadingTaxa ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                        <span className="text-2xl font-bold text-blue-700">
                            {taxaMercado?.toFixed(2)}% <span className="text-sm font-normal">a.m.</span>
                        </span>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
