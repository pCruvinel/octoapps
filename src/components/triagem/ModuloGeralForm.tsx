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
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calculator, Loader2, ChevronDown, Info, Car } from 'lucide-react';
import { ContractUploadButton } from '@/components/calculations/wizard/ContractUploadButton';
import { fetchMarketRate, getEstimatedMarketRate, calculateEconomia, calculatePMT, daysBetween, calculateGracePeriodInterest, detectDailyCapitalization, roundToDisplayPrecision } from '@/utils/financialCalculations';
import type { ResultadoTriagem } from '@/schemas/triagemRapida.schema';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================================
// SCHEMA
// ============================================================================

// Tipos de operação disponíveis (define série temporal Bacen) - Mesmo formato do Cálculo Revisional
const TIPOS_CONTRATO = [
    { value: 'EMPRESTIMO_PESSOAL', label: '25464 - Empréstimo Pessoal PF (% a.a.)' },
    { value: 'CONSIGNADO_PRIVADO', label: '25463 - Consignado Privado (% a.a.)' },
    { value: 'CONSIGNADO_PUBLICO', label: '25462 - Consignado Público (% a.a.)' },
    { value: 'CONSIGNADO_INSS', label: '25470 - Consignado INSS (% a.a.)' },
    { value: 'CAPITAL_GIRO', label: '20739 - Capital de Giro até 365 dias PJ (% a.a.)' },
    { value: 'FINANCIAMENTO_VEICULO', label: '20749 - Aquisição de Veículos PF (% a.a.)' },
    { value: 'FINANCIAMENTO_VEICULO_PJ', label: '20728 - Aquisição de Veículos PJ (% a.a.)' },
    { value: 'CHEQUE_ESPECIAL', label: '20712 - Cheque Especial PF (% a.a.)' },
] as const;

type TipoContrato = typeof TIPOS_CONTRATO[number]['value'];

const moduloGeralSchema = z.object({
    // Dados básicos
    valorFinanciado: z.number().min(100, 'Valor financiado inválido').nullable(),
    valorPrestacao: z.number().min(1, 'Valor da prestação inválido').nullable(),
    prazoMeses: z.number().min(1, 'Prazo inválido').nullable(),
    taxaAnualContrato: z.number().min(0, 'Taxa anual inválida').nullable(),

    // Tipo de Operação (para API Bacen)
    tipoContrato: z.enum([
        'EMPRESTIMO_PESSOAL',
        'CONSIGNADO_PRIVADO',
        'CONSIGNADO_PUBLICO',
        'CONSIGNADO_INSS',
        'CAPITAL_GIRO',
        'FINANCIAMENTO_VEICULO',
        'FINANCIAMENTO_VEICULO_PJ',
        'CHEQUE_ESPECIAL'
    ]).default('FINANCIAMENTO_VEICULO'),

    // Datas importantes
    dataContrato: z.string().min(1, 'Data do contrato obrigatória'),
    dataLiberacao: z.string().optional(), // Data de liberação do crédito
    dataPrimeiroVencimento: z.string().optional(), // Data do 1º vencimento

    // Sistema e capitalização
    sistemaAmortizacao: z.enum(['SAC', 'PRICE']).default('PRICE'),
    capitalizacao: z.enum(['MENSAL', 'DIARIA']).default('MENSAL'),

    // Tarifas (para expurgo)
    tarifaTAC: z.number().min(0).nullable(),
    tarifaRegistro: z.number().min(0).nullable(),
    tarifaAvaliacao: z.number().min(0).nullable(),
    seguroPrestamista: z.number().min(0).nullable(),

    // Checkboxes de expurgo
    expurgarTAC: z.boolean().default(false),
    expurgarRegistro: z.boolean().default(false),
    expurgarAvaliacao: z.boolean().default(false),
    expurgarSeguro: z.boolean().default(false),
});

type ModuloGeralFormData = z.infer<typeof moduloGeralSchema>;

// ============================================================================
// HELPER: Converte Taxa Anual para Mensal (capitalização composta)
// ============================================================================

function taxaAnualParaMensal(taxaAnual: number): number {
    const taxaAnualDecimal = taxaAnual / 100;
    const taxaMensalDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;
    return taxaMensalDecimal * 100;
}

// ============================================================================
// HELPER: CSS para feedback visual (ring verde APENAS em campos do OCR)
// ============================================================================

function getOcrFieldClass(fieldName: string, ocrFilledFields: Set<string>): string {
    return cn(
        'transition-all duration-200',
        ocrFilledFields.has(fieldName) && 'ring-2 ring-green-300 ring-offset-1'
    );
}

// ============================================================================
// COMPONENTE
// ============================================================================

interface ModuloGeralFormProps {
    onResultado: (resultado: ResultadoTriagem, formData?: ModuloGeralFormData) => void;
}

export function ModuloGeralForm({ onResultado }: ModuloGeralFormProps) {
    const [calculating, setCalculating] = useState(false);
    const [taxaMercado, setTaxaMercado] = useState<number | null>(null);
    const [loadingTaxa, setLoadingTaxa] = useState(false);
    const [tarifasExpanded, setTarifasExpanded] = useState(false);
    const [ocrFilledFields, setOcrFilledFields] = useState<Set<string>>(new Set());

    const form = useForm<ModuloGeralFormData>({
        resolver: zodResolver(moduloGeralSchema),
        defaultValues: {
            valorFinanciado: null,
            valorPrestacao: null,
            prazoMeses: null,
            taxaAnualContrato: null,
            tipoContrato: 'FINANCIAMENTO_VEICULO' as const,
            dataContrato: '',
            dataLiberacao: '',
            dataPrimeiroVencimento: '',
            sistemaAmortizacao: 'PRICE',
            capitalizacao: 'MENSAL',
            tarifaTAC: null,
            tarifaRegistro: null,
            tarifaAvaliacao: null,
            seguroPrestamista: null,
            expurgarTAC: false,
            expurgarRegistro: false,
            expurgarAvaliacao: false,
            expurgarSeguro: false,
        },
    });

    const watchDataContrato = form.watch('dataContrato');
    const watchTaxaAnual = form.watch('taxaAnualContrato');
    const watchTipoContrato = form.watch('tipoContrato');

    // Calcular taxa mensal automaticamente a partir da anual
    const taxaMensalCalculada = watchTaxaAnual ? taxaAnualParaMensal(watchTaxaAnual) : null;

    // Mapear tipo de contrato do formulário para módulo da API
    const getModuloParaBacen = (tipoContrato: string): 'GERAL' | 'VEICULOS' => {
        if (tipoContrato === 'FINANCIAMENTO_VEICULO' || tipoContrato === 'FINANCIAMENTO_VEICULO_PJ') return 'VEICULOS';
        return 'GERAL'; // Default para outras modalidades
    };

    // Buscar taxa BACEN quando a data ou modalidade mudar
    useEffect(() => {
        if (!watchDataContrato || watchDataContrato.length < 8) return;

        const buscarTaxa = async () => {
            setLoadingTaxa(true);
            const modulo = getModuloParaBacen(watchTipoContrato);
            console.log('[ModuloGeral] Buscando taxa BACEN para:', { data: watchDataContrato, tipoContrato: watchTipoContrato, modulo });

            try {
                const taxa = await fetchMarketRate(modulo, watchDataContrato);
                if (taxa) {
                    console.log('[ModuloGeral] Taxa BACEN encontrada:', taxa.toFixed(4), '% a.m.');
                    setTaxaMercado(taxa);
                } else {
                    const taxaFallback = getEstimatedMarketRate('GERAL', watchDataContrato);
                    console.log('[ModuloGeral] Usando taxa fallback:', taxaFallback, '%');
                    setTaxaMercado(taxaFallback);
                }
            } catch (error) {
                console.error('[ModuloGeral] Erro ao buscar taxa:', error);
                const taxaFallback = getEstimatedMarketRate('GERAL', watchDataContrato);
                setTaxaMercado(taxaFallback);
            } finally {
                setLoadingTaxa(false);
            }
        };

        buscarTaxa();
    }, [watchDataContrato, watchTipoContrato]);

    // Handler OCR
    const handleOcrData = (data: any) => {
        console.log('[ModuloGeral] Dados OCR recebidos:', data);
        const filledFields = new Set<string>();

        if (data.valor_financiado) {
            form.setValue('valorFinanciado', Number(data.valor_financiado), { shouldValidate: true });
            filledFields.add('valorFinanciado');
        }
        // Ajuste: ocr.types define como 'valor_parcela', mas aqui usamos 'valorPrestacao'
        if (data.valor_parcela || data.valor_prestacao) {
            const valor = Number(data.valor_parcela || data.valor_prestacao);
            form.setValue('valorPrestacao', valor, { shouldValidate: true });
            filledFields.add('valorPrestacao');
        }
        if (data.prazo_meses) {
            form.setValue('prazoMeses', Number(data.prazo_meses), { shouldValidate: true });
            filledFields.add('prazoMeses');
        }

        // Mapeamento de Modalidade
        if (data.modalidade) {
            const modalidadeLower = String(data.modalidade).toLowerCase();
            let tipoDetectado: TipoContrato | null = null;

            if (modalidadeLower.includes('veículo') || modalidadeLower.includes('cdc') || modalidadeLower.includes('auto')) {
                tipoDetectado = 'FINANCIAMENTO_VEICULO';
            } else if (modalidadeLower.includes('consignado')) {
                tipoDetectado = 'CONSIGNADO_PRIVADO'; // Default seguro
                if (modalidadeLower.includes('inss')) tipoDetectado = 'CONSIGNADO_INSS';
                if (modalidadeLower.includes('público') || modalidadeLower.includes('publico')) tipoDetectado = 'CONSIGNADO_PUBLICO';
            } else if (modalidadeLower.includes('pessoal') || modalidadeLower.includes('pessoal')) {
                tipoDetectado = 'EMPRESTIMO_PESSOAL';
            } else if (modalidadeLower.includes('giro')) {
                tipoDetectado = 'CAPITAL_GIRO';
            }

            if (tipoDetectado) {
                form.setValue('tipoContrato', tipoDetectado);
                filledFields.add('tipoContrato');
                toast.success(`Modalidade detectada: ${tipoDetectado}`);
            }
        }

        if (data.taxa_juros_anual) {
            form.setValue('taxaAnualContrato', Number(data.taxa_juros_anual), { shouldValidate: true });
            filledFields.add('taxaAnualContrato');
            toast.success(`Taxa de juros anual detectada: ${data.taxa_juros_anual}%`);
        } else if (data.taxa_juros_mensal) {
            // Se veio taxa mensal, converter para anual
            const taxaMensal = Number(data.taxa_juros_mensal);
            const taxaAnual = (Math.pow(1 + taxaMensal / 100, 12) - 1) * 100;
            form.setValue('taxaAnualContrato', taxaAnual, { shouldValidate: true });
            filledFields.add('taxaAnualContrato');
            toast.success(`Taxa convertida: ${taxaMensal}% a.m. → ${taxaAnual.toFixed(2)}% a.a.`);
        }
        if (data.data_contrato) {
            form.setValue('dataContrato', data.data_contrato, { shouldValidate: true });
            filledFields.add('dataContrato');
        }
        if (data.data_liberacao) {
            form.setValue('dataLiberacao', data.data_liberacao, { shouldValidate: true });
            filledFields.add('dataLiberacao');
        }
        if (data.data_primeiro_vencimento) {
            // Verifica se data.data_primeiro_vencimento (ocr.types) ou data.data_primeira_parcela (ocr.types IMOBILIARIO as reference)
            // No types de veiculos é 'data_primeiro_vencimento'
            form.setValue('dataPrimeiroVencimento', data.data_primeiro_vencimento, { shouldValidate: true });
            filledFields.add('dataPrimeiroVencimento');
        }

        // Tarifas
        if (data.tarifa_tac || data.tac || data.seguro_prestamista || data.tarifa_registro || data.tarifa_avaliacao) {
            setTarifasExpanded(true);

            if (data.tarifa_tac || data.tac) {
                form.setValue('tarifaTAC', Number(data.tarifa_tac || data.tac));
                filledFields.add('tarifaTAC');
            }
            if (data.seguro_prestamista) {
                form.setValue('seguroPrestamista', Number(data.seguro_prestamista));
                filledFields.add('seguroPrestamista');
            }
            if (data.tarifa_registro) {
                form.setValue('tarifaRegistro', Number(data.tarifa_registro));
                filledFields.add('tarifaRegistro');
            }
            if (data.tarifa_avaliacao) {
                form.setValue('tarifaAvaliacao', Number(data.tarifa_avaliacao));
                filledFields.add('tarifaAvaliacao');
            }
        }

        setOcrFilledFields(filledFields);
        // Manter ring verde por 5 segundos
        setTimeout(() => setOcrFilledFields(new Set()), 5000);
    };

    // Função de submit
    const onSubmit = async (data: ModuloGeralFormData) => {
        // Validar campos obrigatórios
        if (!data.valorFinanciado || !data.prazoMeses || !data.taxaAnualContrato) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        setCalculating(true);
        console.log('[ModuloGeral] ===== INICIANDO CÁLCULO AVANÇADO =====');
        console.log('[ModuloGeral] Dados de entrada:', data);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            // =========================================================================
            // 1. CÁLCULO DE CARÊNCIA (se datas informadas)
            // =========================================================================
            let diasCarencia = 0;
            let jurosCarencia = 0;
            let carenciaDetectada = false;
            let pvAjustado = data.valorFinanciado;

            if (data.dataLiberacao && data.dataPrimeiroVencimento) {
                diasCarencia = daysBetween(data.dataLiberacao, data.dataPrimeiroVencimento);
                console.log('[ModuloGeral] Dias entre liberação e 1º vencimento:', diasCarencia);

                if (diasCarencia > 30) {
                    carenciaDetectada = true;
                    // Taxa proporcional exponencial: [(1 + i%)^(dias/30)] - 1
                    const taxaMensalDecimal = taxaAnualParaMensal(data.taxaAnualContrato) / 100;
                    jurosCarencia = calculateGracePeriodInterest(data.valorFinanciado, taxaMensalDecimal, diasCarencia);
                    pvAjustado = data.valorFinanciado + jurosCarencia;
                    console.log('[ModuloGeral] Carência detectada! Juros de carência:', jurosCarencia);
                    console.log('[ModuloGeral] PV ajustado:', pvAjustado);
                }
            }

            // =========================================================================
            // 2. TAXAS E CONVERSÕES
            // =========================================================================
            const taxaMensalContrato = taxaAnualParaMensal(data.taxaAnualContrato);
            const taxaMercadoMensal = taxaMercado ?? getEstimatedMarketRate('GERAL', data.dataContrato);

            console.log('[ModuloGeral] ===== TAXAS =====');
            console.log('[ModuloGeral] Taxa Contrato Anual (input):', data.taxaAnualContrato, '%');
            console.log('[ModuloGeral] Taxa Contrato Mensal (calculada):', taxaMensalContrato.toFixed(4), '%');
            console.log('[ModuloGeral] Taxa Mercado Mensal (Bacen):', taxaMercadoMensal.toFixed(4), '%');

            // Converter para anuais (em DECIMAL, não percentual)
            const taxaContratoAnual = data.taxaAnualContrato / 100;
            const taxaMercadoAnual = (Math.pow(1 + taxaMercadoMensal / 100, 12) - 1);

            console.log('[ModuloGeral] Taxa Contrato Anual (decimal):', taxaContratoAnual.toFixed(4));
            console.log('[ModuloGeral] Taxa Mercado Anual (decimal):', taxaMercadoAnual.toFixed(4), '= ', (taxaMercadoAnual * 100).toFixed(2), '% a.a.');

            // =========================================================================
            // 3. DETECÇÃO DE CAPITALIZAÇÃO DIÁRIA (XTIR)
            // =========================================================================
            let capitalizacaoDiariaDetectada = false;
            let evidenciaCapitalizacao: string | undefined;
            let taxaRealAplicada: number | undefined;
            let discrepanciaTaxas = false;

            // Só executa XTIR se tiver valor da prestação E datas
            if (data.valorPrestacao && data.dataLiberacao && data.dataPrimeiroVencimento) {
                console.log('[ModuloGeral] Executando detecção XTIR...');
                const deteccao = detectDailyCapitalization(
                    data.valorFinanciado,
                    data.valorPrestacao,
                    taxaMensalContrato,
                    data.prazoMeses,
                    data.dataLiberacao,
                    data.dataPrimeiroVencimento
                );

                capitalizacaoDiariaDetectada = deteccao.detected;
                evidenciaCapitalizacao = deteccao.evidencia;
                taxaRealAplicada = deteccao.taxaXTIR_mensal;
                discrepanciaTaxas = Math.abs(deteccao.taxaXTIR_mensal - deteccao.taxaPactuada_mensal) > 0.01;

                console.log('[ModuloGeral] Resultado XTIR:', deteccao);

                if (capitalizacaoDiariaDetectada) {
                    toast.warning('Capitalização diária detectada!', {
                        description: deteccao.evidencia
                    });
                }
            }

            // =========================================================================
            // 4. TARIFAS A EXPURGAR
            // =========================================================================
            let tarifasExpurgadas = 0;
            if (data.expurgarTAC && data.tarifaTAC) tarifasExpurgadas += data.tarifaTAC;
            if (data.expurgarRegistro && data.tarifaRegistro) tarifasExpurgadas += data.tarifaRegistro;
            if (data.expurgarAvaliacao && data.tarifaAvaliacao) tarifasExpurgadas += data.tarifaAvaliacao;
            if (data.expurgarSeguro && data.seguroPrestamista) tarifasExpurgadas += data.seguroPrestamista;
            console.log('[ModuloGeral] Tarifas a expurgar:', tarifasExpurgadas);

            // =========================================================================
            // 5. COMPARATIVO DE PRESTAÇÕES
            // =========================================================================
            const prestacaoOriginal = data.valorPrestacao || 0;

            // Recalcular prestação com taxa de mercado E expurgo de tarifas
            const taxaMercadoDecimal = taxaMercadoMensal / 100;
            const pvLiquido = Math.max(0, pvAjustado - tarifasExpurgadas);
            const prestacaoRevisada = calculatePMT(pvLiquido, taxaMercadoDecimal, data.prazoMeses);
            const diferencaPrestacao = prestacaoOriginal > 0
                ? roundToDisplayPrecision(prestacaoOriginal - prestacaoRevisada)
                : 0;

            console.log('[ModuloGeral] ===== CÁLCULO PMT =====');
            console.log('[ModuloGeral] Valor Financiado:', pvAjustado);
            console.log('[ModuloGeral] Tarifas Expurgadas:', tarifasExpurgadas);
            console.log('[ModuloGeral] PV Líquido (após expurgo):', pvLiquido);
            console.log('[ModuloGeral] Taxa Mercado:', taxaMercadoMensal, '% a.m.');
            console.log('[ModuloGeral] Prazo:', data.prazoMeses, 'meses');
            console.log('[ModuloGeral] Prestação Original:', prestacaoOriginal);
            console.log('[ModuloGeral] Prestação Revisada:', prestacaoRevisada);
            console.log('[ModuloGeral] Economia Mensal:', diferencaPrestacao);

            // =========================================================================
            // 6. SOBRETAXA E ABUSIVIDADE (STJ)
            // =========================================================================
            const sobretaxaPercentual = taxaMercadoAnual > 0
                ? (taxaContratoAnual - taxaMercadoAnual) / taxaMercadoAnual
                : 0;
            const isAbusivo = sobretaxaPercentual >= 0.5 || capitalizacaoDiariaDetectada;
            console.log('[ModuloGeral] Sobretaxa:', (sobretaxaPercentual * 100).toFixed(2), '%');
            console.log('[ModuloGeral] É Abusivo:', isAbusivo);

            // =========================================================================
            // 7. ECONOMIA (Cálculo Correto: Total primeiro, depois decomposição)
            // =========================================================================
            // A economia TOTAL é a diferença entre o que o cliente paga e o que deveria pagar
            // (com taxa de mercado E expurgo de tarifas)
            const economiaTotal = diferencaPrestacao > 0
                ? diferencaPrestacao * data.prazoMeses
                : 0;

            // Decomposição para exibição separada:
            // - economiaTarifas = valor das tarifas expurgadas (restituição direta)
            // - economiaJuros = economiaTotal - tarifas (redução de taxa + juros não pagos sobre tarifas)
            const economiaTarifas = tarifasExpurgadas;
            const economiaJuros = Math.max(0, economiaTotal - economiaTarifas);

            console.log('[ModuloGeral] ===== ECONOMIA DETALHADA =====');
            console.log('[ModuloGeral] Diferença mensal:', diferencaPrestacao, '× ', data.prazoMeses);
            console.log('[ModuloGeral] Economia Total:', economiaTotal);
            console.log('[ModuloGeral] └─ Economia de Juros:', economiaJuros);
            console.log('[ModuloGeral] └─ Restituição de Tarifas:', economiaTarifas);

            // =========================================================================
            // 8. CLASSIFICAÇÃO (SCORECARD)
            // =========================================================================
            let classificacao: 'VIAVEL' | 'ATENCAO' | 'INVIAVEL' = 'INVIAVEL';
            let score = 0;

            if (isAbusivo || capitalizacaoDiariaDetectada) {
                classificacao = 'VIAVEL';
                score = 90;
            } else if (sobretaxaPercentual > 0.2) {
                classificacao = 'ATENCAO';
                score = 60;
            } else if (economiaTotal > 5000) {
                classificacao = 'ATENCAO';
                score = 50;
            } else {
                score = Math.max(0, Math.round(sobretaxaPercentual * 100));
            }

            if (carenciaDetectada) score += 5;
            if (economiaTotal > 10000) score += 10;
            if (economiaTotal < 1000) score -= 20;
            score = Math.min(100, Math.max(0, score));

            // =========================================================================
            // 9. RECOMENDAÇÃO
            // =========================================================================
            let recomendacao = '';
            if (capitalizacaoDiariaDetectada) {
                recomendacao = 'Foi detectada capitalização diária oculta (série não-periódica). Esta prática é considerada abusiva quando não informada claramente ao consumidor. Recomendamos prosseguir com perícia completa.';
            } else if (classificacao === 'VIAVEL') {
                recomendacao = 'A taxa aplicada supera em mais de 50% a média de mercado, caracterizando abusividade segundo entendimento do STJ. Recomendamos prosseguir com o cálculo pericial completo.';
            } else if (classificacao === 'ATENCAO') {
                recomendacao = 'A taxa está acima da média, mas não atinge o patamar automático de abusividade do STJ. A viabilidade depende do volume financeiro total e outras teses (tarifas, anatocismo).';
            } else {
                recomendacao = 'A taxa contratada está próxima ou abaixo da média de mercado. O risco de improcedência é alto, salvo se houverem erros materiais graves no contrato.';
            }

            // =========================================================================
            // 10. RESULTADO FINAL
            // =========================================================================
            const resultado: ResultadoTriagem = {
                classificacao,
                score,
                taxaContratoAnual,
                taxaMercadoAnual,
                sobretaxaPercentual,
                isAbusivo,
                economiaJuros: Math.max(0, economiaJuros),
                economiaTarifas: economiaTarifas,
                economiaTotal,
                recomendacao,

                // Novos campos
                prestacaoOriginal: prestacaoOriginal || undefined,
                prestacaoRevisada: roundToDisplayPrecision(prestacaoRevisada),
                diferencaPrestacao: diferencaPrestacao || undefined,

                taxaPactuadaMensal: roundToDisplayPrecision(taxaMensalContrato),
                taxaRealAplicada,
                discrepanciaTaxas,

                capitalizacaoDiariaDetectada,
                evidenciaCapitalizacao,

                diasCarencia: diasCarencia || undefined,
                jurosCarencia: jurosCarencia || undefined,
                carenciaDetectada,
            };

            console.log('[ModuloGeral] ===== RESULTADO FINAL =====');
            console.log('[ModuloGeral]', resultado);

            onResultado(resultado, data);
        } catch (error) {
            console.error('[ModuloGeral] Erro no cálculo:', error);
            toast.error('Erro ao calcular viabilidade');
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
                        <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Car className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 mb-1">
                            Upload do Contrato (OCR)
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">
                            Arraste o PDF ou clique para preencher automaticamente
                        </p>
                        <ContractUploadButton
                            category="EMPRESTIMOS_VEICULOS"
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
                        <Calculator className="w-5 h-5" />
                        Dados do Contrato
                    </CardTitle>
                    <CardDescription>
                        Preencha os dados básicos para análise de viabilidade
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Linha 1: Valor Financiado e Valor da Prestação */}
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
                                    name="valorPrestacao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor da Prestação</FormLabel>
                                            <FormControl>
                                                <div className={getOcrFieldClass('valorPrestacao', ocrFilledFields)}>
                                                    <CurrencyInput
                                                        value={field.value ?? undefined}
                                                        onChange={field.onChange}
                                                        placeholder="R$ 0,00"
                                                    />
                                                </div>
                                            </FormControl>
                                            <p className="text-xs text-slate-500">
                                                Valor pago mensalmente
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Linha 2: Prazo e Modalidade */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="prazoMeses"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prazo (Meses)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Ex: 48"
                                                    className={getOcrFieldClass('prazoMeses', ocrFilledFields)}
                                                    value={field.value ?? ''}
                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="tipoContrato"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Operação</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className={getOcrFieldClass('tipoContrato', ocrFilledFields)}>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {TIPOS_CONTRATO.map((tipo) => (
                                                        <SelectItem key={tipo.value} value={tipo.value}>
                                                            {tipo.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-slate-500">
                                                Define a série temporal do Bacen
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Linha 3: Taxa ANUAL */}
                            <div className="grid grid-cols-2 gap-4">
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
                                                    placeholder="Ex: 26.82"
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
                            </div>

                            {/* Linha 4: Datas Importantes (3 colunas) */}
                            <div className="grid grid-cols-3 gap-4">
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
                                            <p className="text-xs text-slate-500">
                                                Data da assinatura
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dataLiberacao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Liberação do Crédito</FormLabel>
                                            <FormControl>
                                                <div className={getOcrFieldClass('dataLiberacao', ocrFilledFields)}>
                                                    <DatePicker
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                    />
                                                </div>
                                            </FormControl>
                                            <p className="text-xs text-slate-500">
                                                Início da contagem de juros
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dataPrimeiroVencimento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>1º Vencimento</FormLabel>
                                            <FormControl>
                                                <div className={getOcrFieldClass('dataPrimeiroVencimento', ocrFilledFields)}>
                                                    <DatePicker
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                    />
                                                </div>
                                            </FormControl>
                                            <p className="text-xs text-slate-500">
                                                Define o período de carência
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Taxa de Mercado (readonly) */}
                            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-slate-600">Taxa Média de Mercado (BACEN):</span>
                                </div>
                                {loadingTaxa ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Buscando...</span>
                                    </div>
                                ) : (
                                    <span className="text-sm font-semibold text-green-600">
                                        {taxaMercado !== null
                                            ? `${taxaMercado.toFixed(2)}% a.m.`
                                            : 'Informe a data do contrato'
                                        }
                                    </span>
                                )}
                            </div>

                            {/* Linha 3: Sistema e Capitalização */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="sistemaAmortizacao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sistema de Amortização</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PRICE">Tabela Price</SelectItem>
                                                    <SelectItem value="SAC">SAC</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capitalizacao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Capitalização</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="MENSAL">Mensal</SelectItem>
                                                    <SelectItem value="DIARIA">Diária</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Seção de Tarifas (Colapsável) */}
                            <Collapsible open={tarifasExpanded} onOpenChange={setTarifasExpanded}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between text-slate-600 hover:text-slate-800">
                                        <span>Tarifas e Expurgo (Opcional)</span>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 transition-transform",
                                            tarifasExpanded && "rotate-180"
                                        )} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="tarifaTAC"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel className="text-sm">TAC</FormLabel>
                                                        <FormField
                                                            control={form.control}
                                                            name="expurgarTAC"
                                                            render={({ field: checkField }) => (
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={checkField.value}
                                                                        onCheckedChange={checkField.onChange}
                                                                    />
                                                                    <span className="text-xs text-slate-500">Expurgar</span>
                                                                </div>
                                                            )}
                                                        />
                                                    </div>
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
                                            name="tarifaRegistro"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel className="text-sm">Registro</FormLabel>
                                                        <FormField
                                                            control={form.control}
                                                            name="expurgarRegistro"
                                                            render={({ field: checkField }) => (
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={checkField.value}
                                                                        onCheckedChange={checkField.onChange}
                                                                    />
                                                                    <span className="text-xs text-slate-500">Expurgar</span>
                                                                </div>
                                                            )}
                                                        />
                                                    </div>
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
                                            name="tarifaAvaliacao"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel className="text-sm">Avaliação do Bem</FormLabel>
                                                        <FormField
                                                            control={form.control}
                                                            name="expurgarAvaliacao"
                                                            render={({ field: checkField }) => (
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={checkField.value}
                                                                        onCheckedChange={checkField.onChange}
                                                                    />
                                                                    <span className="text-xs text-slate-500">Expurgar</span>
                                                                </div>
                                                            )}
                                                        />
                                                    </div>
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
                                            name="seguroPrestamista"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel className="text-sm">Seguro Prestamista</FormLabel>
                                                        <FormField
                                                            control={form.control}
                                                            name="expurgarSeguro"
                                                            render={({ field: checkField }) => (
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={checkField.value}
                                                                        onCheckedChange={checkField.onChange}
                                                                    />
                                                                    <span className="text-xs text-slate-500">Expurgar</span>
                                                                </div>
                                                            )}
                                                        />
                                                    </div>
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
                                className="w-full h-12 text-lg mt-4 bg-primary hover:bg-primary/90"
                                disabled={calculating}
                            >
                                {calculating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Calculando Viabilidade...
                                    </>
                                ) : (
                                    'Verificar Viabilidade'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
