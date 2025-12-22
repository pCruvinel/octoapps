'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { DetalhadaImportCard } from '../wizard/detalhada-import-card';
import { TipoOperacaoSelect } from '@/components/shared/TipoOperacaoSelect';
import type { DetalhadaModuleType, DetalhadaPageData } from '../detalhada-page';

// Generic Validation Schema (will be adjusted per module)
const baseSchema = z.object({
    credor: z.string().min(1, 'Credor obrigatório'),
    devedor: z.string().min(1, 'Devedor obrigatório'),
    numeroContrato: z.string().optional(),
    tipoContrato: z.string().optional(),
    valorFinanciado: z.number().min(1, 'Valor obrigatório'),
    dataContrato: z.string().min(1, 'Data obrigatória'),
    dataPrimeiroVencimento: z.string().min(1, 'Data obrigatória'),
    prazoMeses: z.number().min(1, 'Prazo obrigatório'),
    valorPrestacao: z.number().optional(),
    taxaMensalContrato: z.number().optional(),
    taxaAnualContrato: z.number().optional(),
    sistemaAmortizacao: z.enum(['PRICE', 'SAC', 'SACRE']),
    capitalizacao: z.enum(['MENSAL', 'DIARIA']),
    usarTaxaBacen: z.boolean(),
    expurgarTarifas: z.boolean(),
    restituicaoEmDobro: z.boolean(),
    // Encargos Moratórios (para período de atraso)
    jurosMora: z.number().min(0).max(100).optional(),
    multaMoratoria: z.number().min(0).max(100).optional(),
    encargosIncidirSobrePrincipalCorrigido: z.boolean().optional(),
    // Imobiliário specific
    indexador: z.enum(['TR', 'IPCA', 'INPC', 'IGPM', 'NENHUM']).optional(),
    valorImovel: z.number().optional(),
    tipoFinanciamento: z.enum(['SFH', 'SFI']).optional(),
    // Veículo specific
    valorBem: z.number().optional(),
    valorEntrada: z.number().optional(),
    dataLiberacao: z.string().optional(),
});

type DataEntryFormData = z.infer<typeof baseSchema>;

interface DetalhadaEntradaDadosTabProps {
    module: DetalhadaModuleType;
    data: Partial<DetalhadaPageData>;
    onChange: (data: Partial<DetalhadaPageData>) => void;
    onValidationChange: (isValid: boolean) => void;
}

// Options for imobiliario module only - Geral uses TipoOperacaoSelect now

const INDEXADORES = [
    { value: 'TR', label: 'TR (Taxa Referencial)' },
    { value: 'IPCA', label: 'IPCA' },
    { value: 'INPC', label: 'INPC' },
    { value: 'IGPM', label: 'IGP-M' },
    { value: 'NENHUM', label: 'Nenhum (Pré-fixado)' },
];

const SISTEMAS_AMORTIZACAO = [
    { value: 'PRICE', label: 'Tabela Price' },
    { value: 'SAC', label: 'SAC (Sistema de Amortização Constante)' },
    { value: 'SACRE', label: 'SACRE' },
];

export function DetalhadaEntradaDadosTab({
    module,
    data,
    onChange,
    onValidationChange,
}: DetalhadaEntradaDadosTabProps) {
    const [tarifas, setTarifas] = React.useState<Array<{ nome: string; valor: number }>>(data.tarifas || []);

    // BACEN Rate State
    const [taxaBacenAnual, setTaxaBacenAnual] = React.useState<number | null>(null);
    const [taxaBacenMensal, setTaxaBacenMensal] = React.useState<number | null>(null);
    const [loadingBacen, setLoadingBacen] = React.useState(false);
    const lastFetchRef = React.useRef<string | null>(null);

    const {
        register,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<DataEntryFormData>({
        resolver: zodResolver(baseSchema),
        mode: 'onChange',
        defaultValues: {
            credor: data.credor || '',
            devedor: data.devedor || '',
            numeroContrato: data.numeroContrato || '',
            tipoContrato: data.tipoContrato || (module === 'GERAL' ? 'EMPRESTIMO_PESSOAL' : undefined),
            valorFinanciado: data.valorFinanciado || 0,
            dataContrato: data.dataContrato || '',
            dataPrimeiroVencimento: data.dataPrimeiroVencimento || '',
            prazoMeses: data.prazoMeses || (module === 'IMOBILIARIO' ? 360 : 12),
            valorPrestacao: data.valorPrestacao || 0,
            taxaMensalContrato: data.taxaMensalContrato || 0,
            taxaAnualContrato: data.taxaAnualContrato || 0,
            sistemaAmortizacao: data.sistemaAmortizacao || (module === 'IMOBILIARIO' ? 'SAC' : 'PRICE'),
            capitalizacao: data.capitalizacao || 'MENSAL',
            usarTaxaBacen: data.usarTaxaBacen ?? true,
            expurgarTarifas: data.expurgarTarifas ?? false,
            restituicaoEmDobro: data.restituicaoEmDobro ?? false,
            // Imobiliário
            indexador: (data as any).indexador || 'TR',
            valorImovel: (data as any).valorImovel || 0,
            valorBem: (data as any).valorBem || 0,
            valorEntrada: (data as any).valorEntrada || 0,
            dataLiberacao: (data as any).dataLiberacao || '',
            tipoFinanciamento: (data as any).tipoFinanciamento || 'SFH',
        },
    });

    const watchedValues = watch();

    // Sync form values with parent
    React.useEffect(() => {
        onChange({ ...watchedValues, tarifas } as any);
    }, [watchedValues, tarifas, onChange]);

    // Notify validation state
    React.useEffect(() => {
        onValidationChange(isValid);
    }, [isValid, onValidationChange]);

    // Calculate monthly rate from annual (when annual changes)
    const [lastEditedField, setLastEditedField] = React.useState<'mensal' | 'anual'>('anual');

    const handleTaxaMensalChange = (val: number | undefined) => {
        setValue('taxaMensalContrato', val || 0, { shouldValidate: true });
        setLastEditedField('mensal');
        // Calculate annual from monthly
        if (val && val > 0) {
            const taxaAnual = (Math.pow(1 + val / 100, 12) - 1) * 100;
            setValue('taxaAnualContrato', parseFloat(taxaAnual.toFixed(2)));
        }
    };

    const handleTaxaAnualChange = (val: number | undefined) => {
        setValue('taxaAnualContrato', val || 0, { shouldValidate: true });
        setLastEditedField('anual');
        // Calculate monthly from annual
        if (val && val > 0) {
            const taxaMensal = (Math.pow(1 + val / 100, 1 / 12) - 1) * 100;
            setValue('taxaMensalContrato', parseFloat(taxaMensal.toFixed(4)));
        }
    };

    // Fetch BACEN rate when contract date and type change
    React.useEffect(() => {
        const dataContrato = watchedValues.dataContrato;
        const tipoContrato = watchedValues.tipoContrato;

        if (!dataContrato || dataContrato.length < 10) return;

        const fetchKey = `${dataContrato}-${tipoContrato || 'default'}-${module}`;
        if (lastFetchRef.current === fetchKey) return;

        const timer = setTimeout(async () => {
            lastFetchRef.current = fetchKey;
            setLoadingBacen(true);

            try {
                const { fetchMarketRate } = await import('@/utils/financialCalculations');
                // fetchMarketRate returns MONTHLY rate
                const rateMensal = await fetchMarketRate(module, dataContrato);

                if (rateMensal && rateMensal > 0) {
                    setTaxaBacenMensal(rateMensal);
                    // Convert monthly to annual for display
                    const rateAnual = (Math.pow(1 + rateMensal / 100, 12) - 1) * 100;
                    setTaxaBacenAnual(parseFloat(rateAnual.toFixed(2)));
                }
            } catch (error) {
                console.error('[DataEntryTab] Erro ao buscar taxa BACEN:', error);
            } finally {
                setLoadingBacen(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [watchedValues.dataContrato, watchedValues.tipoContrato, module]);

    // Handle OCR data
    const handleOcrData = (ocrData: any) => {
        if (ocrData.nome_credor) setValue('credor', ocrData.nome_credor, { shouldValidate: true });
        if (ocrData.nome_devedor) setValue('devedor', ocrData.nome_devedor, { shouldValidate: true });
        if (ocrData.numero_contrato) setValue('numeroContrato', ocrData.numero_contrato);
        if (ocrData.valor_financiado) setValue('valorFinanciado', Number(ocrData.valor_financiado), { shouldValidate: true });
        if (ocrData.prazo_meses) setValue('prazoMeses', Number(ocrData.prazo_meses), { shouldValidate: true });
        if (ocrData.data_contrato) setValue('dataContrato', ocrData.data_contrato, { shouldValidate: true });
        if (ocrData.data_primeiro_vencimento) setValue('dataPrimeiroVencimento', ocrData.data_primeiro_vencimento, { shouldValidate: true });
        if (ocrData.taxa_juros_mensal) setValue('taxaMensalContrato', Number(ocrData.taxa_juros_mensal), { shouldValidate: true });
        if (ocrData.valor_parcela) setValue('valorPrestacao', Number(ocrData.valor_parcela), { shouldValidate: true });
        if (ocrData.valor_parcela) setValue('valorPrestacao', Number(ocrData.valor_parcela), { shouldValidate: true });

        // Vehicle specifics
        if (ocrData.valor_imovel) setValue('valorBem', Number(ocrData.valor_imovel), { shouldValidate: true }); // OCR sometimes maps to property value

        // Imobiliário specifics
        if (ocrData.valor_imovel) setValue('valorImovel', Number(ocrData.valor_imovel), { shouldValidate: true });
        if (ocrData.indexador) {
            const val = ocrData.indexador.toUpperCase();
            if (val.includes('TR')) setValue('indexador', 'TR');
            else if (val.includes('IPCA')) setValue('indexador', 'IPCA');
            else if (val.includes('INPC')) setValue('indexador', 'INPC');
            else if (val.includes('IGPM') || val.includes('IGP-M')) setValue('indexador', 'IGPM');
        }
    };

    // Tarifa handlers
    const addTarifa = () => {
        setTarifas(prev => [...prev, { nome: '', valor: 0 }]);
    };

    const removeTarifa = (index: number) => {
        setTarifas(prev => prev.filter((_, i) => i !== index));
    };

    const updateTarifa = (index: number, field: 'nome' | 'valor', value: string | number) => {
        setTarifas(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
    };

    // ===== RENDER =====
    return (
        <div className="space-y-6">
            {/* OCR Import */}
            <DetalhadaImportCard
                category={module === 'IMOBILIARIO' ? 'IMOBILIARIO' : module === 'CARTAO' ? 'CARTAO_CREDITO' : 'EMPRESTIMOS_VEICULOS'}
                onDataExtracted={handleOcrData}
            />

            {/* Grid 2 Columns */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Card 1: Identificação */}
                <Card>
                    <CardHeader>
                        <CardTitle>Identificação</CardTitle>
                        <CardDescription>
                            {module === 'IMOBILIARIO' ? 'Partes do financiamento imobiliário' : 'Partes e tipo de operação'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="credor">Credor *</Label>
                            <Input
                                id="credor"
                                placeholder={module === 'IMOBILIARIO' ? 'Ex: Caixa Econômica Federal' : 'Ex: Banco do Brasil'}
                                {...register('credor')}
                            />
                            {errors.credor && <p className="text-sm text-red-500">{errors.credor.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="devedor">{module === 'IMOBILIARIO' ? 'Mutuário *' : 'Devedor *'}</Label>
                            <Input id="devedor" placeholder="Nome do cliente" {...register('devedor')} />
                            {errors.devedor && <p className="text-sm text-red-500">{errors.devedor.message}</p>}
                        </div>

                        {/* Tipo de Contrato - only for GERAL */}
                        {module === 'GERAL' && (
                            <TipoOperacaoSelect
                                categorias={['emprestimos', 'veiculos']}
                                value={watchedValues.tipoContrato || ''}
                                onValueChange={(val) => setValue('tipoContrato', val, { shouldValidate: true })}
                                showSerieInLabel={true}
                                name="tipoContrato"
                            />
                        )}

                        {/* Tipo de Financiamento - only for IMOBILIARIO */}
                        {module === 'IMOBILIARIO' && (
                            <TipoOperacaoSelect
                                categorias="imobiliario"
                                value={watchedValues.tipoFinanciamento || ''}
                                onValueChange={(val) => setValue('tipoFinanciamento', val as 'SFH' | 'SFI')}
                                showSerieInHelper={true}
                                label="Tipo de Financiamento"
                                name="tipoFinanciamento"
                            />
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="numeroContrato">Nº do Contrato (Opcional)</Label>
                            <Input id="numeroContrato" {...register('numeroContrato')} />
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2: Valores e Prazos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Valores e Prazos</CardTitle>
                        <CardDescription>
                            {module === 'IMOBILIARIO' ? 'Dados do financiamento imobiliário' : 'Dados financeiros do contrato'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Valor do Imóvel - only for IMOBILIARIO */}
                        {module === 'IMOBILIARIO' && (
                            <div className="space-y-2">
                                <Label>Valor do Imóvel (Avaliação)</Label>
                                <CurrencyInput
                                    value={watchedValues.valorImovel}
                                    onChange={(val) => setValue('valorImovel', val || 0, { shouldValidate: true })}
                                />
                            </div>
                        )}

                        {/* Campos de Veículos (Exibição Condicional) */}
                        {module === 'GERAL' && (watchedValues.tipoContrato === 'FINANCIAMENTO_VEICULO' || watchedValues.tipoContrato === 'FINANCIAMENTO_VEICULO_PJ') && (
                            <>
                                <div className="space-y-2">
                                    <Label>Valor do Bem</Label>
                                    <CurrencyInput
                                        value={watchedValues.valorBem}
                                        onChange={(val) => setValue('valorBem', val || 0, { shouldValidate: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor da Entrada</Label>
                                    <CurrencyInput
                                        value={watchedValues.valorEntrada}
                                        onChange={(val) => setValue('valorEntrada', val || 0, { shouldValidate: true })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label>Valor Financiado *</Label>
                            <CurrencyInput
                                value={watchedValues.valorFinanciado}
                                onChange={(val) => setValue('valorFinanciado', val || 0, { shouldValidate: true })}
                            />
                            {errors.valorFinanciado && <p className="text-sm text-red-500">{errors.valorFinanciado.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data do Contrato *</Label>
                                <DatePicker
                                    value={watchedValues.dataContrato}
                                    onChange={(val) => setValue('dataContrato', val || '', { shouldValidate: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{module === 'IMOBILIARIO' ? 'D ata 1ª Parcela *' : 'Data 1º Vencimento *'}</Label>
                                <DatePicker
                                    value={watchedValues.dataPrimeiroVencimento}
                                    onChange={(val) => setValue('dataPrimeiroVencimento', val || '', { shouldValidate: true })}
                                />
                            </div>
                        </div>

                        {/* Data de Liberação - Somente para Veículos */}
                        {module === 'GERAL' && (watchedValues.tipoContrato === 'FINANCIAMENTO_VEICULO' || watchedValues.tipoContrato === 'FINANCIAMENTO_VEICULO_PJ') && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Data de Liberação do Crédito</Label>
                                    <span className="text-xs text-slate-500" title="Para detectar período de carência superior a 30 dias">
                                        ℹ️
                                    </span>
                                </div>
                                <DatePicker
                                    value={watchedValues.dataLiberacao}
                                    onChange={(val) => setValue('dataLiberacao', val || '', { shouldValidate: true })}
                                />
                                <p className="text-xs text-slate-500">Usada para detectar períodos de carência e calcular juros pro-rata</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Prazo (Meses) *</Label>
                                <Input
                                    type="number"
                                    {...register('prazoMeses', { valueAsNumber: true })}
                                />
                                {module === 'IMOBILIARIO' && (
                                    <p className="text-xs text-slate-500">Ex: 360 meses = 30 anos</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Valor da Parcela</Label>
                                <CurrencyInput
                                    value={watchedValues.valorPrestacao}
                                    onChange={(val) => setValue('valorPrestacao', val || 0, { shouldValidate: true })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 3: Configuração de Taxas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuração de Taxas</CardTitle>
                        <CardDescription>
                            {module === 'IMOBILIARIO' ? 'Juros, indexador e sistema de amortização' : 'Juros e sistema de amortização'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Taxa Anual Contrato (%)</Label>
                                <PercentInput
                                    value={watchedValues.taxaAnualContrato}
                                    onChange={handleTaxaAnualChange}
                                />
                                <p className="text-xs text-slate-500">Digite a taxa anual para calcular a mensal</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Taxa Mensal Contrato (%)</Label>
                                <PercentInput
                                    value={watchedValues.taxaMensalContrato}
                                    onChange={handleTaxaMensalChange}
                                />
                                <p className="text-xs text-slate-500">Calculada automaticamente ou edite</p>
                            </div>
                        </div>

                        {/* BACEN Rate Display */}
                        {watchedValues.usarTaxaBacen && (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="h-4 w-4 text-slate-600" />
                                    <span className="text-sm font-medium text-slate-700">Taxa Média de Mercado (BACEN)</span>
                                    {loadingBacen && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                                </div>
                                {taxaBacenAnual !== null ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500">Taxa Anual</p>
                                            <p className="text-lg font-semibold text-slate-900">{taxaBacenAnual.toFixed(2)}% a.a.</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Taxa Mensal</p>
                                            <p className="text-lg font-semibold text-slate-900">{taxaBacenMensal?.toFixed(4)}% a.m.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600">
                                        {loadingBacen ? 'Buscando taxa...' : 'Preencha a data do contrato'}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Sistema de Amortização</Label>
                                <Select
                                    value={watchedValues.sistemaAmortizacao}
                                    onValueChange={(val) => setValue('sistemaAmortizacao', val as 'PRICE' | 'SAC' | 'SACRE')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SISTEMAS_AMORTIZACAO.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Indexador - only for IMOBILIARIO */}
                            {module === 'IMOBILIARIO' ? (
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
                                            {INDEXADORES.map(i => (
                                                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Capitalização</Label>
                                    <Select
                                        value={watchedValues.capitalizacao}
                                        onValueChange={(val) => setValue('capitalizacao', val as 'MENSAL' | 'DIARIA')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MENSAL">Mensal</SelectItem>
                                            <SelectItem value="DIARIA">Diária</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between py-2 border-t">
                            <div>
                                <Label>Usar Taxa BACEN</Label>
                                <p className="text-xs text-slate-500">Comparar com taxa média do Banco Central</p>
                            </div>
                            <Switch
                                checked={watchedValues.usarTaxaBacen}
                                onCheckedChange={(val) => setValue('usarTaxaBacen', val)}
                            />
                        </div>

                        {/* Encargos Moratórios */}
                        <div className="pt-4 border-t space-y-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <h4 className="font-medium text-slate-700">Encargos Moratórios</h4>
                                <span className="text-xs text-slate-500">(para parcelas em atraso)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Juros de Mora (% a.m.)</Label>
                                    <PercentInput
                                        value={watchedValues.jurosMora ?? 1}
                                        onChange={(val) => setValue('jurosMora', val ?? 1)}
                                    />
                                    <p className="text-xs text-slate-500">Padrão: 1% a.m. (Art. 406 CC)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Multa Moratória (%)</Label>
                                    <PercentInput
                                        value={watchedValues.multaMoratoria ?? 2}
                                        onChange={(val) => setValue('multaMoratoria', val ?? 2)}
                                    />
                                    <p className="text-xs text-slate-500">Padrão: 2% (Art. 52 §1º CDC)</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2 bg-slate-50 px-3 rounded-lg">
                                <div>
                                    <Label className="text-sm">Base de cálculo</Label>
                                    <p className="text-xs text-slate-500">
                                        {watchedValues.encargosIncidirSobrePrincipalCorrigido
                                            ? 'Encargos incidem sobre o principal CORRIGIDO'
                                            : 'Encargos incidem apenas sobre o principal'}
                                    </p>
                                </div>
                                <Switch
                                    checked={watchedValues.encargosIncidirSobrePrincipalCorrigido ?? false}
                                    onCheckedChange={(val) => setValue('encargosIncidirSobrePrincipalCorrigido', val)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 4: Revisão e Tarifas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revisão e Tarifas</CardTitle>
                        <CardDescription>Opções de cálculo revisional</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <Label>Expurgar Tarifas</Label>
                                <p className="text-xs text-slate-500">Considerar tarifas como abusivas</p>
                            </div>
                            <Switch
                                checked={watchedValues.expurgarTarifas}
                                onCheckedChange={(val) => setValue('expurgarTarifas', val)}
                            />
                        </div>

                        <div className="flex items-center justify-between py-2 border-t">
                            <div>
                                <Label>Restituição em Dobro</Label>
                                <p className="text-xs text-slate-500">Art. 42 do CDC</p>
                            </div>
                            <Switch
                                checked={watchedValues.restituicaoEmDobro}
                                onCheckedChange={(val) => setValue('restituicaoEmDobro', val)}
                            />
                        </div>

                        {watchedValues.expurgarTarifas && (
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between mb-3">
                                    <Label>Tarifas a Expurgar</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addTarifa}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Adicionar
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {tarifas.map((tarifa, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input
                                                placeholder="Nome da tarifa"
                                                value={tarifa.nome}
                                                onChange={(e) => updateTarifa(index, 'nome', e.target.value)}
                                                className="flex-1"
                                            />
                                            <CurrencyInput
                                                value={tarifa.valor}
                                                onChange={(val) => updateTarifa(index, 'valor', val || 0)}
                                                className="w-32"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeTarifa(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}

                                    {tarifas.length === 0 && (
                                        <p className="text-sm text-slate-500 text-center py-4">
                                            Nenhuma tarifa adicionada
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
