'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calculator, Loader2, ChevronDown, Home, Info, Shield } from 'lucide-react';
import { DetalhadaUploadButton } from '@/components/calculations/wizard/detalhada-upload-button';
import { fetchMarketRate, getEstimatedMarketRate, calculateEconomia, calculatePMT } from '@/utils/financialCalculations';
import type { PreviaImobiliariaResultadoType as PreviaImobiliariaResultadoTypeALIAS } from '@/schemas/triagemRapida.schema'; // Note: This might be from schema or componente, verifying grep showed schema? No, wait. Grep showed import type { ResultadoImobiliario as ... } from '@/schemas/triagemRapida.schema'.. WAIT.
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useTiposOperacao } from '@/hooks/useTiposOperacao';
import { TipoOperacaoSelect } from '@/components/shared/TipoOperacaoSelect';

// ============================================================================
// SCHEMA
// ============================================================================

const moduloImobiliarioSchema = z.object({
    // Dados básicos
    valorFinanciado: z.number().min(100, 'Valor financiado inválido').nullable(),
    prazoMeses: z.number().min(1, 'Prazo inválido').nullable(),
    taxaAnualContrato: z.number().min(0, 'Taxa anual inválida').nullable(),
    dataContrato: z.string().min(1, 'Data do contrato obrigatória'),

    // Valor da parcela (essencial para confronto Original vs Revisto)
    valorParcela: z.number().min(1, 'Valor da parcela inválido').nullable(),

    // Específicos Imobiliário
    tipoFinanciamento: z.string({ required_error: 'Selecione o tipo de financiamento' }).min(1, 'Selecione o tipo'),
    sistemaAmortizacao: z.enum(['SAC', 'PRICE', 'SACRE']).default('SAC'),
    indexador: z.enum(['TR', 'IPCA', 'INPC', 'IGPM']).default('TR'),

    // Seguros obrigatórios (incluídos no cálculo)
    seguroMIP: z.number().min(0).nullable(),
    seguroDFI: z.number().min(0).nullable(),
    taxaAdministracao: z.number().min(0).nullable(),
});

type ModuloImobiliarioFormData = z.infer<typeof moduloImobiliarioSchema>;

// ============================================================================
// HELPER: Converte Taxa Anual para Mensal (capitalização composta)
// ============================================================================

function taxaAnualParaMensal(taxaAnual: number): number {
    const taxaAnualDecimal = taxaAnual / 100;
    const taxaMensalDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;
    return taxaMensalDecimal * 100;
}

// ============================================================================
// HELPER: Estilo para campos preenchidos por OCR
// ============================================================================

function getOcrFieldClass(fieldName: string, ocrFilledFields: Set<string>): string {
    return cn(
        'transition-all duration-200',
        ocrFilledFields.has(fieldName) && 'ring-2 ring-green-300 ring-offset-1'
    );
}

// ...

// ============================================================================
// COMPONENTE
// ============================================================================

interface ModuloImobiliarioFormProps {
    onResultado: (resultado: ResultadoImobiliarioType, formData?: ModuloImobiliarioFormData) => void;
}

export function PreviaImobiliariaForm({ onResultado }: ModuloImobiliarioFormProps) {
    const [calculating, setCalculating] = useState(false);
    const [taxaMercado, setTaxaMercado] = useState<number | null>(null);
    const [loadingTaxa, setLoadingTaxa] = useState(false);
    const [segurosExpanded, setSegurosExpanded] = useState(false);
    const [ocrFilledFields, setOcrFilledFields] = useState<Set<string>>(new Set());

    // Hook dinâmico para tipos imobiliários
    const { tiposOperacao, loading: loadingTipos, getSeriePorCodigo } = useTiposOperacao({
        categoria: 'IMOBILIARIO'
    });

    const form = useForm<ModuloImobiliarioFormData>({
        resolver: zodResolver(moduloImobiliarioSchema),
        defaultValues: {
            valorFinanciado: null,
            prazoMeses: null,
            taxaAnualContrato: null,
            valorParcela: null,
            dataContrato: '',
            tipoFinanciamento: 'IMOBILIARIO_SFH', // Default (corresponde à série 20773)
            sistemaAmortizacao: 'SAC',
            indexador: 'TR',
            seguroMIP: null,
            seguroDFI: null,
            taxaAdministracao: null,
        },
    });

    const watchDataContrato = form.watch('dataContrato');
    const watchTaxaAnual = form.watch('taxaAnualContrato');
    const watchTipoFinanciamento = form.watch('tipoFinanciamento');

    // Calcular taxa mensal automaticamente a partir da anual
    const taxaMensalCalculada = watchTaxaAnual ? taxaAnualParaMensal(watchTaxaAnual) : null;

    // Buscar taxa BACEN quando a data OU tipo de financiamento mudar
    useEffect(() => {
        if (!watchDataContrato || watchDataContrato.length < 8) return;

        const buscarTaxa = async () => {
            setLoadingTaxa(true);

            // Usar série dinâmica baseada no hook
            const serieBacen = getSeriePorCodigo(watchTipoFinanciamento);
            console.log(`[Imobiliário] Buscando taxa BACEN (${serieBacen}) para data:`, watchDataContrato);

            try {
                if (serieBacen) {
                    const taxa = await fetchMarketRate(serieBacen, watchDataContrato);
                    if (taxa) {
                        console.log(`[Imobiliário] Taxa BACEN ${watchTipoFinanciamento} encontrada:`, taxa, '%');
                        setTaxaMercado(taxa);
                        setLoadingTaxa(false);
                        return;
                    }
                }

                // Fallback
                console.warn('[Imobiliário] Série não encontrada ou taxa indisponível. Usando fallback.');
                const taxaFallback = getEstimatedMarketRate('IMOBILIARIO', watchDataContrato);
                setTaxaMercado(taxaFallback);
            } catch (error) {
                console.error('[Imobiliário] Erro ao buscar taxa:', error);
                const taxaFallback = getEstimatedMarketRate('IMOBILIARIO', watchDataContrato);
                setTaxaMercado(taxaFallback);
            } finally {
                setLoadingTaxa(false);
            }
        };

        buscarTaxa();
    }, [watchDataContrato, watchTipoFinanciamento, tiposOperacao]);

    // Handler OCR
    const handleOcrData = (data: any) => {
        console.log('[Imobiliário] Dados OCR recebidos:', data);
        const filledFields = new Set<string>();

        if (data.valor_financiado) {
            form.setValue('valorFinanciado', Number(data.valor_financiado), { shouldValidate: true });
            filledFields.add('valorFinanciado');
        }
        if (data.prazo_meses) {
            form.setValue('prazoMeses', Number(data.prazo_meses), { shouldValidate: true });
            filledFields.add('prazoMeses');
        }
        if (data.taxa_juros_anual) {
            form.setValue('taxaAnualContrato', Number(data.taxa_juros_anual), { shouldValidate: true });
            filledFields.add('taxaAnualContrato');
            toast.success(`Taxa de juros anual detectada: ${data.taxa_juros_anual}%`);
        }
        if (data.data_contrato) {
            form.setValue('dataContrato', data.data_contrato, { shouldValidate: true });
            filledFields.add('dataContrato');
        }
        if (data.sistema_amortizacao) {
            const sistema = String(data.sistema_amortizacao).toUpperCase();
            if (['SAC', 'PRICE', 'SACRE'].includes(sistema)) {
                form.setValue('sistemaAmortizacao', sistema as 'SAC' | 'PRICE' | 'SACRE');
                filledFields.add('sistemaAmortizacao');
            }
        }
        if (data.seguro_mip) {
            form.setValue('seguroMIP', Number(data.seguro_mip));
            filledFields.add('seguroMIP');
            setSegurosExpanded(true);
        }
        if (data.seguro_dfi) {
            form.setValue('seguroDFI', Number(data.seguro_dfi));
            filledFields.add('seguroDFI');
            setSegurosExpanded(true);
        }
        // NOVO: Valor da parcela (essencial para confronto)
        if (data.valor_parcela) {
            form.setValue('valorParcela', Number(data.valor_parcela), { shouldValidate: true });
            filledFields.add('valorParcela');
            toast.success(`Valor parcela detectado: R$ ${Number(data.valor_parcela).toLocaleString('pt-BR')}`);
        }

        setOcrFilledFields(filledFields);
        // Manter ring verde por 5 segundos
        setTimeout(() => setOcrFilledFields(new Set()), 5000);
    };

    // Função de submit
    const onSubmit = async (data: ModuloImobiliarioFormData) => {
        // Validar campos obrigatórios
        if (!data.valorFinanciado || !data.prazoMeses || !data.taxaAnualContrato || !data.valorParcela) {
            toast.error('Preencha todos os campos obrigatórios, incluindo o Valor da Parcela');
            return;
        }

        setCalculating(true);
        console.log('[Imobiliário] ========================================');
        console.log('[Imobiliário] ===== INICIANDO ANÁLISE PRÉVIA =====');
        console.log('[Imobiliário] ========================================');
        console.log('[Imobiliário] Dados de entrada:', data);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            // Converter taxa anual para mensal
            const taxaMensalContrato = taxaAnualParaMensal(data.taxaAnualContrato);
            console.log('[Imobiliário] Taxa Contrato Anual:', data.taxaAnualContrato, '%');
            console.log('[Imobiliário] Taxa Contrato Mensal (calculada):', taxaMensalContrato.toFixed(4), '%');

            // Taxa de mercado
            const taxaMercadoMensal = taxaMercado ?? getEstimatedMarketRate('IMOBILIARIO', data.dataContrato);
            console.log('[Imobiliário] Taxa Mercado Mensal:', taxaMercadoMensal, '%');

            // Converter % para decimal
            const taxaContratoDecimal = taxaMensalContrato / 100;
            const taxaMercadoDecimal = taxaMercadoMensal / 100;

            // Calcular seguros totais (incluídos no cálculo conforme solicitado)
            const segurosMensais = (data.seguroMIP || 0) + (data.seguroDFI || 0) + (data.taxaAdministracao || 0);
            const segurosTotal = segurosMensais * data.prazoMeses;
            console.log('[Imobiliário] Seguros mensais:', segurosMensais);
            console.log('[Imobiliário] Seguros total (prazo):', segurosTotal);

            // Escolher função de cálculo baseada no sistema
            const calcularFluxo = data.sistemaAmortizacao === 'SAC' || data.sistemaAmortizacao === 'SACRE'
                ? calcularFluxoSAC
                : calcularFluxoPRICE;

            // ============================================
            // CENÁRIO A: Taxa do Contrato
            // ============================================
            console.log('\n[Imobiliário] ===== CENÁRIO A: TAXA CONTRATO =====');
            const cenarioContrato = calcularFluxo(
                data.valorFinanciado,
                taxaContratoDecimal,
                data.prazoMeses,
                'Cenário A'
            );
            cenarioContrato.totalPago += segurosTotal;
            console.log('[Imobiliário][Cenário A] Total + Seguros:', cenarioContrato.totalPago);

            // ============================================
            // CENÁRIO B: Taxa Média de Mercado
            // ============================================
            console.log('\n[Imobiliário] ===== CENÁRIO B: TAXA MÉDIA BACEN =====');
            const cenarioMercado = calcularFluxo(
                data.valorFinanciado,
                taxaMercadoDecimal,
                data.prazoMeses,
                'Cenário B'
            );
            cenarioMercado.totalPago += segurosTotal;
            console.log('[Imobiliário][Cenário B] Total + Seguros:', cenarioMercado.totalPago);

            // ============================================
            // CENÁRIO C: Juros Simples (Gauss/MAGIS) - OTIMISTA
            // ============================================
            console.log('\n[Imobiliário] ===== CENÁRIO C: JUROS SIMPLES (OTIMISTA) =====');

            // Tese Agressiva: Juros Reais ou Média Histórica (aprox. 3% a 4% a.a.)
            // Aplicamos um Fator MAGIS de 0.4 sobre a taxa Bacen da época (8.16% * 0.4 ~= 3.2% a.a.)
            // Isso diferencia o Cenário C (Otimista) do Cenário B (Conservador/STJ)
            const FATOR_MAGIS_OTIMISTA = 0.4;
            const taxaSimplesOtimista = taxaMercadoDecimal * FATOR_MAGIS_OTIMISTA;

            const cenarioSimples = calcularJurosSimplesDetalhado(
                data.valorFinanciado,
                taxaSimplesOtimista, // Taxa Reduzida (Otimista)
                data.prazoMeses,
                data.sistemaAmortizacao,
                data.valorParcela,
                'Cenário C (Otimista)'
            );
            // No Cenário C (Tese Agressiva), expurgamos os seguros (venda casada).
            // Portanto, NÃO somamos segurosTotal ao total pago revisado.
            console.log('[Imobiliário][Cenário C] Total (S/ Seguros):', cenarioSimples.totalPago);

            // ============================================
            // APURAÇÃO DE ECONOMIA
            // ============================================
            console.log('\n[Imobiliário] ===== APURAÇÃO DE ECONOMIA =====');

            const economiaTaxaMedia = cenarioContrato.totalPago - cenarioMercado.totalPago;
            const economiaJurosSimples = cenarioContrato.totalPago - cenarioSimples.totalPago;

            console.log('[Imobiliário] Economia (Taxa Média):', economiaTaxaMedia.toFixed(2));
            console.log('[Imobiliário] Economia (Juros Simples):', economiaJurosSimples.toFixed(2));

            // Taxas anuais para exibição
            const taxaContratoAnual = data.taxaAnualContrato;
            const taxaMercadoAnual = (Math.pow(1 + taxaMercadoDecimal, 12) - 1) * 100;

            // Sobretaxa
            const sobretaxa = taxaMercadoAnual > 0
                ? ((taxaContratoAnual - taxaMercadoAnual) / taxaMercadoAnual) * 100
                : 0;
            const isAbusivo = sobretaxa >= 50;
            console.log('[Imobiliário] Sobretaxa:', sobretaxa.toFixed(2), '%');
            console.log('[Imobiliário] É Abusivo:', isAbusivo);

            // Classificação
            let classificacao: 'VIAVEL' | 'ATENCAO' | 'INVIAVEL' = 'INVIAVEL';
            if (isAbusivo || economiaTaxaMedia > 50000) {
                classificacao = 'VIAVEL';
            } else if (sobretaxa > 20 || economiaTaxaMedia > 10000) {
                classificacao = 'ATENCAO';
            }
            console.log('[Imobiliário] Classificação:', classificacao);

            const resultado: ResultadoImobiliarioType = {
                classificacao,
                isAbusivo,

                // Taxas
                taxaContratoMensal: taxaMensalContrato,
                taxaContratoAnual: taxaContratoAnual,
                taxaMercadoMensal: taxaMercadoMensal,
                taxaMercadoAnual,
                sobretaxaPercent: sobretaxa,

                // Cenário A: Contrato
                cenarioContrato: {
                    totalPago: cenarioContrato.totalPago,
                    totalJuros: cenarioContrato.totalJuros,
                    primeiraParcela: cenarioContrato.primeiraParcela + segurosMensais,
                    ultimaParcela: cenarioContrato.ultimaParcela + segurosMensais,
                },

                // Cenário B: Taxa Média
                cenarioTaxaMedia: {
                    totalPago: cenarioMercado.totalPago,
                    totalJuros: cenarioMercado.totalJuros,
                    primeiraParcela: cenarioMercado.primeiraParcela + segurosMensais,
                    ultimaParcela: cenarioMercado.ultimaParcela + segurosMensais,
                    economia: Math.max(0, economiaTaxaMedia),
                },

                // Cenário C: Juros Simples (MAGIS/Gauss) - Com Expurgo de Seguros
                cenarioJurosSimples: {
                    totalPago: cenarioSimples.totalPago,
                    totalJuros: cenarioSimples.totalJuros,
                    primeiraParcela: cenarioSimples.primeiraParcela, // Sem seguros (expurgo)
                    ultimaParcela: cenarioSimples.ultimaParcela,     // Sem seguros (expurgo)
                    parcelaMedia: cenarioSimples.parcelaMedia,       // Sem seguros (expurgo)
                    // Economia = diferença acumulada (soma mensal: cobrada - revisada)
                    economia: cenarioSimples.diferencaTotal > 0
                        ? cenarioSimples.diferencaTotal
                        : Math.max(0, economiaJurosSimples),
                },

                // Dados do contrato para referência
                dadosContrato: {
                    valorFinanciado: data.valorFinanciado,
                    prazoMeses: data.prazoMeses,
                    sistema: data.sistemaAmortizacao,
                    indexador: data.indexador,
                    segurosTotal,
                    parcelaOriginal: data.valorParcela, // NOVO
                },

                // NOVO: Confronto de Parcelas (impacto comercial)
                confrontoParcelas: {
                    parcelaOriginal: data.valorParcela,
                    parcelaRevista: cenarioMercado.primeiraParcela + segurosMensais, // Com taxa média
                    diferencaMensal: data.valorParcela - (cenarioMercado.primeiraParcela + segurosMensais),
                    diferencaTotal: (data.valorParcela - (cenarioMercado.primeiraParcela + segurosMensais)) * data.prazoMeses,
                },
            };

            console.log('\n[Imobiliário] ===== RESULTADO FINAL =====');
            console.log('[Imobiliário]', JSON.stringify(resultado, null, 2));
            console.log('[Imobiliário] ========================================\n');

            onResultado(resultado, data);
        } catch (error) {
            console.error('[Imobiliário] Erro no cálculo:', error);
        } finally {
            setCalculating(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload de Contrato (OCR) - INTEGRADO */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="pt-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                        <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Home className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 mb-1">
                            Upload do Contrato Imobiliário (OCR)
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">
                            Arraste o CCB/Contrato para preencher automaticamente
                        </p>
                        <DetalhadaUploadButton
                            category="IMOBILIARIO"
                            onDataExtracted={handleOcrData}
                            variant="outline"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Formulário Principal */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        Dados do Financiamento Imobiliário
                    </CardTitle>
                    <CardDescription>
                        Sistema SAC/Price com correção por indexador
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Linha 1: Valor e Prazo */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="valorFinanciado"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor Financiado</FormLabel>
                                            <FormControl>
                                                <div className={getOcrFieldClass('valorFinanciado', ocrFilledFields)}>
                                                    <CurrencyInput
                                                        value={field.value ?? undefined}
                                                        onChange={field.onChange}
                                                        placeholder="R$ 0,00"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="prazoMeses"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prazo (Meses)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Ex: 360"
                                                    className={getOcrFieldClass('prazoMeses', ocrFilledFields)}
                                                    value={field.value ?? ''}
                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Linha 2: Taxa ANUAL, Valor Parcela e Data */}
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="taxaAnualContrato"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Taxa Anual (% a.a.)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Ex: 11.00"
                                                    className={getOcrFieldClass('taxaAnualContrato', ocrFilledFields)}
                                                    value={field.value ?? ''}
                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                />
                                            </FormControl>
                                            {taxaMensalCalculada && (
                                                <p className="text-xs text-slate-500">
                                                    ≈ {taxaMensalCalculada.toFixed(4)}% a.m.
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* NOVO: Valor da Parcela (essencial para confronto) */}
                                <FormField
                                    control={form.control}
                                    name="valorParcela"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor Parcela Atual *</FormLabel>
                                            <FormControl>
                                                <div className={getOcrFieldClass('valorParcela', ocrFilledFields)}>
                                                    <CurrencyInput
                                                        value={field.value ?? undefined}
                                                        onChange={field.onChange}
                                                        placeholder="R$ 0,00"
                                                    />
                                                </div>
                                            </FormControl>
                                            <p className="text-xs text-slate-400">Parcela cobrada pelo banco</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dataContrato"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data do Contrato</FormLabel>
                                            <FormControl>
                                                <div className={getOcrFieldClass('dataContrato', ocrFilledFields)}>
                                                    <DatePicker
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Taxa de Mercado (readonly) */}
                            <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm text-slate-600">Taxa Média Imobiliário (BACEN):</span>
                                </div>
                                {loadingTaxa ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Buscando...</span>
                                    </div>
                                ) : (
                                    <span className="text-sm font-semibold text-emerald-600">
                                        {taxaMercado !== null
                                            ? `${taxaMercado.toFixed(4)}% a.m.`
                                            : 'Informe a data do contrato'
                                        }
                                    </span>
                                )}
                            </div>

                            {/* Linha 3: Tipo Financiamento, Sistema e Indexador */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* NOVO: Tipo de Financiamento (SFH/SFI) */}
                                <FormField
                                    control={form.control}
                                    name="tipoFinanciamento"
                                    render={({ field }) => (
                                        <TipoOperacaoSelect
                                            categorias="IMOBILIARIO"
                                            field={field}
                                            showSerieInHelper={true}
                                        />
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sistemaAmortizacao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sistema de Amortização</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className={getOcrFieldClass('sistemaAmortizacao', ocrFilledFields)}>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="SAC">SAC (Decrescente)</SelectItem>
                                                    <SelectItem value="PRICE">Tabela Price (Fixa)</SelectItem>
                                                    <SelectItem value="SACRE">SACRE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="indexador"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Indexador de Correção</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="TR">TR (Taxa Referencial)</SelectItem>
                                                    <SelectItem value="IPCA">IPCA</SelectItem>
                                                    <SelectItem value="INPC">INPC</SelectItem>
                                                    <SelectItem value="IGPM">IGP-M</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Seção de Seguros (Colapsável) */}
                            <Collapsible open={segurosExpanded} onOpenChange={setSegurosExpanded}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-slate-600 hover:text-slate-800">
                                        <span className="flex items-center gap-2">
                                            <Shield className="w-4 h-4" />
                                            Seguros Obrigatórios (MIP/DFI)
                                        </span>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 transition-transform",
                                            segurosExpanded && "rotate-180"
                                        )} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="seguroMIP"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">MIP (Mensal)</FormLabel>
                                                    <FormControl>
                                                        <CurrencyInput
                                                            value={field.value ?? undefined}
                                                            onChange={field.onChange}
                                                            placeholder="R$ 0,00"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="seguroDFI"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">DFI (Mensal)</FormLabel>
                                                    <FormControl>
                                                        <CurrencyInput
                                                            value={field.value ?? undefined}
                                                            onChange={field.onChange}
                                                            placeholder="R$ 0,00"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="taxaAdministracao"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">Taxa Adm (Mensal)</FormLabel>
                                                    <FormControl>
                                                        <CurrencyInput
                                                            value={field.value ?? undefined}
                                                            onChange={field.onChange}
                                                            placeholder="R$ 0,00"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Botão Submit */}
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg mt-4 bg-emerald-600 hover:bg-emerald-700"
                                disabled={calculating}
                            >
                                {calculating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Calculando 3 Cenários...
                                    </>
                                ) : (
                                    'Analisar Viabilidade'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
