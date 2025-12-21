'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Loader2, TrendingUp, FileSearch, Upload, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Schema de validação
const step1Schema = z.object({
    credor: z.string().min(2, 'Nome do credor deve ter pelo menos 2 caracteres'),
    devedor: z.string().min(2, 'Nome do devedor deve ter pelo menos 2 caracteres'),
    contratoNum: z.string().optional(),
    tipoContrato: z.enum(['PESSOAL', 'CONSIGNADO_PRIVADO', 'CONSIGNADO_PUBLICO', 'CONSIGNADO_INSS', 'CAPITAL_GIRO', 'VEICULO', 'CHEQUE_ESPECIAL']),
    valorFinanciado: z.number().min(100, 'Valor mínimo é R$ 100,00'),
    dataContrato: z.string().min(1, 'Data do contrato é obrigatória'),
    dataPrimeiroVencimento: z.string().min(1, 'Data do primeiro vencimento é obrigatória'),
    prazoMeses: z.number().min(1, 'Prazo deve ser de pelo menos 1 mês').max(600, 'Prazo máximo é 600 meses'),
});

export type Step1Data = z.infer<typeof step1Schema>;

interface Step1_DadosContratoProps {
    defaultValues?: Partial<Step1Data>;
    onDataChange?: (data: Step1Data) => void;
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
];

export function Step1_DadosContrato({
    defaultValues,
    onDataChange,
    onValidationChange,
}: Step1_DadosContratoProps) {
    const [taxaMercado, setTaxaMercado] = React.useState<number | null>(null);
    const [loadingTaxa, setLoadingTaxa] = React.useState(false);
    const [carenciaAlert, setCarenciaAlert] = React.useState(false);
    const [ocrDialogOpen, setOcrDialogOpen] = React.useState(false);
    const [ocrLoading, setOcrLoading] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const {
        register,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<Step1Data>({
        resolver: zodResolver(step1Schema),
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

    // Notifica mudança de validação
    React.useEffect(() => {
        onValidationChange?.(isValid);
    }, [isValid, onValidationChange]);

    // Notifica mudança de dados
    React.useEffect(() => {
        if (isValid) {
            onDataChange?.(watchedValues as Step1Data);
        }
    }, [watchedValues, isValid, onDataChange]);

    // Calcula carência (dias entre contrato e primeiro vencimento)
    React.useEffect(() => {
        const { dataContrato, dataPrimeiroVencimento } = watchedValues;
        if (dataContrato && dataPrimeiroVencimento) {
            const contrato = new Date(dataContrato);
            const vencimento = new Date(dataPrimeiroVencimento);

            if (vencimento < contrato) {
                setCarenciaAlert(true);
            } else {
                setCarenciaAlert(false);
                const diffDays = Math.floor((vencimento.getTime() - contrato.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 45) {
                    // Período de carência detectado
                    setCarenciaAlert(true);
                }
            }
        }
    }, [watchedValues.dataContrato, watchedValues.dataPrimeiroVencimento]);

    // Auto-busca taxa Bacen quando tipo e data mudam
    React.useEffect(() => {
        const { tipoContrato, dataContrato } = watchedValues;
        if (tipoContrato && dataContrato) {
            fetchTaxaBacen(tipoContrato, dataContrato);
        }
    }, [watchedValues.tipoContrato, watchedValues.dataContrato]);

    const fetchTaxaBacen = async (tipo: string, data: string) => {
        setLoadingTaxa(true);
        try {
            // Import Supabase client
            const { supabase } = await import('@/lib/supabase');

            // Map tipo to Bacen series
            const mapTipoToSerie: Record<string, string> = {
                'PESSOAL': '20714',
                'CONSIGNADO_PRIVADO': '25471',
                'CONSIGNADO_PUBLICO': '25471',
                'CONSIGNADO_INSS': '25471',
                'CAPITAL_GIRO': '20714',
                'VEICULO': '432',
                'CHEQUE_ESPECIAL': '20714',
            };

            const serieBacen = mapTipoToSerie[tipo] || '20714';

            // Parse date to extract YYYY-MM
            // Handle both DD/MM/YYYY and YYYY-MM-DD formats
            let yearMonth: string;
            if (data.includes('/')) {
                // DD/MM/YYYY or DD/MM/YY format
                const parts = data.split('/');
                if (parts.length === 3) {
                    let year = parts[2];
                    if (year.length === 2) {
                        year = '20' + year;
                    }
                    yearMonth = `${year}-${parts[1].padStart(2, '0')}`;
                } else {
                    yearMonth = new Date().toISOString().substring(0, 7);
                }
            } else if (data.includes('-')) {
                // YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS format
                yearMonth = data.substring(0, 7);
            } else {
                // Fallback to current month
                yearMonth = new Date().toISOString().substring(0, 7);
            }

            // Validate year is reasonable (1990-2100)
            const year = parseInt(yearMonth.substring(0, 4));
            if (year < 1990 || year > 2100) {
                console.warn('Invalid year detected:', yearMonth, 'from date:', data);
                yearMonth = new Date().toISOString().substring(0, 7);
            }

            console.log('Fetching Bacen rate for:', yearMonth, 'serie:', serieBacen);

            // Try to get rate for the specific month
            let { data: taxaData, error } = await supabase
                .from('taxas_bacen_historico')
                .select('taxa_mensal_percent')
                .eq('ano_mes', yearMonth)
                .eq('serie_bacen', serieBacen)
                .single();

            // If not found, get the latest available
            if (error || !taxaData) {
                const { data: latestData } = await supabase
                    .from('taxas_bacen_historico')
                    .select('taxa_mensal_percent')
                    .eq('serie_bacen', serieBacen)
                    .order('ano_mes', { ascending: false })
                    .limit(1)
                    .single();

                taxaData = latestData;
            }

            if (taxaData?.taxa_mensal_percent) {
                setTaxaMercado(taxaData.taxa_mensal_percent);
                toast.success('Taxa de mercado carregada do Bacen');
            } else {
                // Fallback to static rates if no data
                const taxasPorTipo: Record<string, number> = {
                    'PESSOAL': 6.5, 'CONSIGNADO_PRIVADO': 2.8, 'CONSIGNADO_PUBLICO': 1.9,
                    'CONSIGNADO_INSS': 2.1, 'CAPITAL_GIRO': 3.5, 'VEICULO': 2.2, 'CHEQUE_ESPECIAL': 12.0,
                };
                setTaxaMercado(taxasPorTipo[tipo] || 3.0);
                toast.info('Usando taxa média estimada');
            }
        } catch (error) {
            console.error('Error fetching Bacen rate:', error);
            toast.error('Erro ao buscar taxa de mercado');
            setTaxaMercado(null);
        } finally {
            setLoadingTaxa(false);
        }
    };

    // Handler para upload e análise OCR do contrato
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
                toast.error('Formato inválido. Envie PDF ou imagem.');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleOcrAnalysis = async () => {
        if (!selectedFile) {
            toast.error('Selecione um arquivo primeiro');
            return;
        }

        setOcrLoading(true);
        try {
            // TODO: Implementar chamada para Edge Function de OCR/AI
            // const formData = new FormData();
            // formData.append('file', selectedFile);
            // const response = await fetch('/api/analyze-contract', { method: 'POST', body: formData });
            // const data = await response.json();

            // Simula análise por enquanto
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast.success('Análise de contrato será implementada em breve!');
            toast.info('A funcionalidade OCR será integrada com Edge Function');

            setOcrDialogOpen(false);
            setSelectedFile(null);
        } catch (error) {
            console.error('Error analyzing contract:', error);
            toast.error('Erro ao analisar contrato');
        } finally {
            setOcrLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Botão de Analisar Contrato com Dialog */}
            <Card className="border-dashed border-2 border-slate-300 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 dark:border-slate-700">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                                <FileSearch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Análise Automática de Contrato</h3>
                                <p className="text-sm text-slate-500">
                                    Faça upload do contrato e extraia os dados automaticamente com IA
                                </p>
                            </div>
                        </div>

                        <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Sparkles className="h-4 w-4" />
                                    Analisar Contrato
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <FileSearch className="h-5 w-5 text-blue-600" />
                                        Análise de Contrato com OCR
                                    </DialogTitle>
                                    <DialogDescription>
                                        Envie o contrato em PDF ou imagem para extrair automaticamente:
                                        credor, devedor, valores, taxas e datas.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {/* Área de Upload */}
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                                            ${selectedFile
                                                ? 'border-green-400 bg-green-50 dark:bg-green-950'
                                                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:hover:bg-blue-950/50'
                                            }`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />

                                        {selectedFile ? (
                                            <div className="space-y-2">
                                                <FileText className="h-10 w-10 mx-auto text-green-600" />
                                                <p className="font-medium text-green-700 dark:text-green-400">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="h-10 w-10 mx-auto text-slate-400" />
                                                <p className="font-medium text-slate-600 dark:text-slate-300">
                                                    Clique ou arraste o contrato aqui
                                                </p>
                                                <p className="text-sm text-slate-400">
                                                    PDF ou imagem (JPG, PNG) • Máx 10MB
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botões */}
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => {
                                                setOcrDialogOpen(false);
                                                setSelectedFile(null);
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            className="flex-1 gap-2"
                                            onClick={handleOcrAnalysis}
                                            disabled={!selectedFile || ocrLoading}
                                        >
                                            {ocrLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Analisando...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4" />
                                                    Extrair Dados
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            {/* Alerta de validação de datas */}
            {carenciaAlert && watchedValues.dataPrimeiroVencimento < watchedValues.dataContrato && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro de Data</AlertTitle>
                    <AlertDescription>
                        A data do primeiro vencimento não pode ser anterior à data do contrato.
                    </AlertDescription>
                </Alert>
            )}

            {/* Alerta de carência */}
            {carenciaAlert && watchedValues.dataPrimeiroVencimento >= watchedValues.dataContrato && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Período de Carência Detectado</AlertTitle>
                    <AlertDescription>
                        O intervalo entre a data do contrato e o primeiro vencimento é superior a 45 dias.
                        Juros de carência podem estar sendo incorporados ao saldo devedor.
                    </AlertDescription>
                </Alert>
            )}

            {/* Dados das Partes */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados das Partes</CardTitle>
                    <CardDescription>Informações do credor e devedor</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="credor">Credor (Instituição Financeira)</Label>
                        <Input
                            id="credor"
                            placeholder="Ex: Banco do Brasil S.A."
                            {...register('credor')}
                        />
                        {errors.credor && (
                            <p className="text-sm text-red-500">{errors.credor.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="devedor">Devedor</Label>
                        <Input
                            id="devedor"
                            placeholder="Nome completo do cliente"
                            {...register('devedor')}
                        />
                        {errors.devedor && (
                            <p className="text-sm text-red-500">{errors.devedor.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contratoNum">Número do Contrato (opcional)</Label>
                        <Input
                            id="contratoNum"
                            placeholder="Ex: 123456789"
                            {...register('contratoNum')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                        <Select
                            value={watchedValues.tipoContrato}
                            onValueChange={(value) => setValue('tipoContrato', value as Step1Data['tipoContrato'], { shouldValidate: true })}
                        >
                            <SelectTrigger id="tipoContrato">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIPOS_CONTRATO.map((tipo) => (
                                    <SelectItem key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Dados Financeiros */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados Financeiros</CardTitle>
                    <CardDescription>Valores e prazos do contrato</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="valorFinanciado">Valor Financiado</Label>
                        <CurrencyInput
                            id="valorFinanciado"
                            value={watchedValues.valorFinanciado}
                            onChange={(value) => setValue('valorFinanciado', value || 0, { shouldValidate: true })}
                            placeholder="R$ 0,00"
                        />
                        {errors.valorFinanciado && (
                            <p className="text-sm text-red-500">{errors.valorFinanciado.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                        <Input
                            id="prazoMeses"
                            type="number"
                            min={1}
                            max={600}
                            {...register('prazoMeses', { valueAsNumber: true })}
                        />
                        {errors.prazoMeses && (
                            <p className="text-sm text-red-500">{errors.prazoMeses.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dataContrato">Data do Contrato</Label>
                        <DatePicker
                            id="dataContrato"
                            value={watchedValues.dataContrato}
                            onChange={(value) => setValue('dataContrato', value || '', { shouldValidate: true })}
                            placeholder="DD/MM/AAAA"
                        />
                        {errors.dataContrato && (
                            <p className="text-sm text-red-500">{errors.dataContrato.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dataPrimeiroVencimento">Data do 1º Vencimento</Label>
                        <DatePicker
                            id="dataPrimeiroVencimento"
                            value={watchedValues.dataPrimeiroVencimento}
                            onChange={(value) => setValue('dataPrimeiroVencimento', value || '', { shouldValidate: true })}
                            placeholder="DD/MM/AAAA"
                        />
                        {errors.dataPrimeiroVencimento && (
                            <p className="text-sm text-red-500">{errors.dataPrimeiroVencimento.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Card de Taxa de Mercado */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <TrendingUp className="h-5 w-5" />
                        Taxa Média de Mercado (Bacen)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingTaxa ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <Skeleton className="h-8 w-24" />
                            <span className="text-sm text-slate-500">Consultando API Bacen...</span>
                        </div>
                    ) : taxaMercado !== null ? (
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {taxaMercado.toFixed(2)}%
                            </span>
                            <span className="text-sm text-slate-500">a.m.</span>
                            <span className="text-xs text-slate-400 ml-2">
                                ({TIPOS_CONTRATO.find(t => t.value === watchedValues.tipoContrato)?.label})
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Selecione o tipo de contrato e a data para carregar a taxa de mercado.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Exporta o schema para uso no wizard pai
export { step1Schema };
