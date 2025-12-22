'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calculator, Save, Loader2, FileText, Table2, BarChart3, Files, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useCalculation } from '@/hooks/useCalculation';
import { wizardToDetalhadoRequest, detalhadoToResultsDashboard } from '@/lib/calculationAdapters';
import { supabase } from '@/lib/supabase';
import { contratoRevisionalService } from '@/services/contratoRevisionalService';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { LaudoRevisionalTemplate } from '@/components/pdf-templates/LaudoRevisionalTemplate';
import { useDocumentSettings } from '../pdf-engine/DocumentContext';

// Tab Components
import { DataEntryTab } from './tabs/DataEntryTab';
import { PaymentReconciliationGrid, type PaymentRow } from './reconciliation/PaymentReconciliationGrid';
import { KPICards } from './results/KPICards';
import { EvolutionChart } from './results/EvolutionChart';
import { ComparisonSummaryTable } from './results/ComparisonSummaryTable';
import { AppendicesTabs } from './results/AppendicesTabs';

import type { CalculoDetalhadoResponse } from '@/types/calculation.types';

export type CalculationModuleType = 'GERAL' | 'IMOBILIARIO' | 'CARTAO';

export interface CalculationPageData {
    module: CalculationModuleType;
    // Unified data from all form sections
    credor: string;
    devedor: string;
    numeroContrato: string;
    tipoContrato: string;
    valorFinanciado: number;
    dataContrato: string;
    dataPrimeiroVencimento: string;
    prazoMeses: number;
    valorPrestacao?: number;
    taxaMensalContrato?: number;
    taxaAnualContrato?: number;
    sistemaAmortizacao: 'PRICE' | 'SAC';
    capitalizacao: 'MENSAL' | 'DIARIA';
    usarTaxaBacen: boolean;
    indexador?: string;
    // Imóvel / Veículo
    valorImovel?: number;
    valorBem?: number;
    valorEntrada?: number;
    tipoFinanciamento?: 'SFH' | 'SFI';
    dataLiberacao?: string; // Data de liberação do crédito (para detectar carência)
    // Encargos Moratórios
    jurosMora?: number; // Padrão: 1% a.m.
    multaMoratoria?: number; // Padrão: 2%
    encargosIncidirSobrePrincipalCorrigido?: boolean;
    // Revisão
    expurgarTarifas: boolean;
    restituicaoEmDobro: boolean;
    tarifas: Array<{ nome: string; valor: number }>;
}

interface CalculationPageProps {
    module: CalculationModuleType;
    onBack?: () => void;
    onComplete?: (result: any) => void;
    initialData?: Partial<CalculationPageData>;
    existingContratoId?: string;
    initialStep2?: { conciliacao?: PaymentRow[] } | null;
    initialStep3?: { resultado?: CalculoDetalhadoResponse; dashboard?: any } | null;
    initialTab?: TabId;
}

type TabId = 'dados' | 'conciliacao' | 'resumo' | 'apendices';

const TAB_CONFIG: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'dados', label: 'Dados do Contrato', icon: FileText },
    { id: 'conciliacao', label: 'Conciliação', icon: Table2 },
    { id: 'resumo', label: 'Resumo', icon: BarChart3 },
    { id: 'apendices', label: 'Apêndices', icon: Files },
];

export function CalculationPage({
    module,
    onBack,
    onComplete,
    initialData,
    existingContratoId,
    initialStep2,
    initialStep3,
    initialTab = 'dados',
}: CalculationPageProps) {
    const { calculateDetalhado, isLoading } = useCalculation();
    const { settings } = useDocumentSettings();

    // UI State
    const [activeTab, setActiveTab] = React.useState<TabId>(initialTab);
    const [availableTabs, setAvailableTabs] = React.useState<Set<TabId>>(() => {
        const tabs = new Set<TabId>(['dados']);
        if (initialStep2?.conciliacao?.length || initialStep3) {
            tabs.add('conciliacao');
        }
        if (initialStep3?.resultado) {
            tabs.add('resumo');
            tabs.add('apendices');
        }
        return tabs;
    });

    // Data State
    const [formData, setFormData] = React.useState<Partial<CalculationPageData>>({
        module,
        sistemaAmortizacao: 'PRICE',
        capitalizacao: 'MENSAL',
        usarTaxaBacen: true,
        expurgarTarifas: false,
        restituicaoEmDobro: false,
        tarifas: [],
        ...initialData,
    });

    const [calculationResult, setCalculationResult] = React.useState<CalculoDetalhadoResponse | null>(
        initialStep3?.resultado || null
    );
    const [conciliacaoData, setConciliacaoData] = React.useState<PaymentRow[]>(
        initialStep2?.conciliacao || []
    );
    const [dashboardData, setDashboardData] = React.useState<any>(
        initialStep3?.dashboard || null
    );

    // Validation State
    const [isFormValid, setIsFormValid] = React.useState(false);

    // User ID
    const [userId, setUserId] = React.useState<string | null>(null);
    const [contratoId, setContratoId] = React.useState<string | null>(existingContratoId || null);

    // Dirty State - track if data changed since last calculation
    const [isDadosDirty, setIsDadosDirty] = React.useState(!existingContratoId); // New calculation starts dirty
    const [isConciliacaoDirty, setIsConciliacaoDirty] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    // Debounced auto-save ref
    const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
        });
    }, []);

    // ========== AUTO-SAVE DEBOUNCED ==========
    const debouncedAutoSave = React.useCallback(async (data: Partial<CalculationPageData>) => {
        if (!userId || !data.valorFinanciado) return;

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Set new timer
        autoSaveTimerRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                let currentContratoId = contratoId;

                if (!currentContratoId) {
                    const { data: newContrato, error } = await contratoRevisionalService.create(
                        module,
                        userId,
                        { origem: 'MANUAL' }
                    );
                    if (!error && newContrato) {
                        currentContratoId = newContrato.id;
                        setContratoId(newContrato.id);
                    }
                }

                if (currentContratoId) {
                    const nomeRef = `${data.devedor || 'Cliente'} - ${data.credor || 'Credor'}`;
                    await contratoRevisionalService.saveStep1(
                        currentContratoId,
                        data as Record<string, unknown>,
                        nomeRef,
                        true // keepDraftStatus
                    );
                    console.log('[CalculationPage] Auto-save concluído');
                }
            } catch (error) {
                console.error('[CalculationPage] Erro no auto-save:', error);
            } finally {
                setIsSaving(false);
            }
        }, 1000); // 1 segundo de debounce
    }, [userId, contratoId, module]);

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, []);

    // Handle form data changes
    const handleFormChange = React.useCallback((data: Partial<CalculationPageData>) => {
        setFormData(prev => ({ ...prev, ...data }));
        setIsDadosDirty(true); // Mark as dirty
        debouncedAutoSave(data); // Auto-save
    }, [debouncedAutoSave]);

    // Handle validation changes
    const handleValidationChange = React.useCallback((isValid: boolean) => {
        setIsFormValid(isValid);
    }, []);

    // NOTE: handleConciliacaoChange is defined after handleGenerateResults (line ~436)

    // ========== SALVAR RASCUNHO ==========
    const handleSaveDraft = async () => {
        if (!userId) {
            toast.error('Usuário não autenticado');
            return;
        }

        if (!formData.valorFinanciado) {
            toast.warning('Preencha ao menos o valor financiado');
            return;
        }

        try {
            toast.loading('Salvando rascunho...', { id: 'draft-loading' });
            let currentContratoId = contratoId;

            if (!currentContratoId) {
                const { data, error } = await contratoRevisionalService.create(
                    module,
                    userId,
                    { origem: 'MANUAL' }
                );
                if (error || !data) {
                    toast.dismiss('draft-loading');
                    toast.error('Erro ao criar rascunho');
                    console.error('Erro ao criar contrato:', error);
                    return;
                }
                currentContratoId = data.id;
                setContratoId(data.id);
            }

            const nomeRef = `${formData.devedor || 'Cliente'} - ${formData.credor || 'Credor'}`;
            // Salvar como rascunho (keepDraftStatus = true)
            const { error: saveError } = await contratoRevisionalService.saveStep1(
                currentContratoId,
                formData as Record<string, unknown>,
                nomeRef,
                true // keepDraftStatus
            );

            toast.dismiss('draft-loading');

            if (saveError) {
                toast.error('Erro ao salvar dados');
                console.error('Erro ao salvar Step1:', saveError);
                return;
            }

            toast.success('Rascunho salvo com sucesso!');
        } catch (error) {
            toast.dismiss('draft-loading');
            console.error(error);
            toast.error('Erro ao salvar rascunho');
        }
    };

    // ========== EXPORTAR PDF ==========
    const handleExportPDF = async () => {
        if (!calculationResult || !dashboardData) {
            toast.warning('É necessário gerar o resultado primeiro');
            return;
        }

        try {
            toast.loading('Gerando PDF...', { id: 'pdf-loading' });

            const blob = await pdf(
                <LaudoRevisionalTemplate
                    formData={formData}
                    resultado={calculationResult}
                    dashboard={dashboardData}
                    settings={settings}
                />
            ).toBlob();

            const nomeArquivo = `Laudo_${formData.devedor || 'Cliente'}_${new Date().getTime()}.pdf`;
            saveAs(blob, nomeArquivo);

            toast.dismiss('pdf-loading');
            toast.success('PDF gerado com sucesso!');
        } catch (error) {
            toast.dismiss('pdf-loading');
            toast.error('Erro ao gerar PDF');
            console.error('[PDF Export] Erro:', error);
        }
    };

    // Generate Conciliation (first calculation)
    const handleGenerateConciliation = async () => {
        if (!isFormValid) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        if (!userId) {
            toast.error('Usuário não autenticado');
            return;
        }

        try {
            console.log('\n[CalculationPage] Gerando Conciliação...');
            toast.loading('Calculando evolução...', { id: 'calc-loading' });

            // ========== PERSISTÊNCIA NO BANCO ==========
            let currentContratoId = contratoId;

            if (!currentContratoId) {
                const { data, error } = await contratoRevisionalService.create(
                    module,
                    userId,
                    { origem: 'MANUAL' }
                );
                if (error || !data) {
                    toast.dismiss('calc-loading');
                    toast.error('Erro ao criar contrato');
                    console.error('Erro ao criar contrato:', error);
                    return;
                }
                currentContratoId = data.id;
                setContratoId(data.id);
            }

            // Salvar Step1 e atualizar status para ANALISE_PREVIA
            const nomeRef = `${formData.devedor || 'Cliente'} - ${formData.credor || 'Credor'}`;
            const { error: saveError } = await contratoRevisionalService.saveStep1(
                currentContratoId,
                formData as Record<string, unknown>,
                nomeRef
            );

            if (saveError) {
                console.error('Erro ao salvar Step1:', saveError);
                // Continue anyway - calculation is more important
            }
            // ============================================

            // Convert form data to calculation request
            const request = formDataToRequest(formData as CalculationPageData);
            const result = await calculateDetalhado(request);

            toast.dismiss('calc-loading');

            if (!result) {
                toast.error('Erro no cálculo');
                return;
            }

            setCalculationResult(result);

            // Convert to dashboard data
            const dashboard = detalhadoToResultsDashboard(result, request);
            setDashboardData(dashboard);
            setConciliacaoData(dashboard.conciliacao);

            // Reveal Conciliação tab
            setAvailableTabs(prev => new Set([...prev, 'conciliacao']));
            setActiveTab('conciliacao');
            setIsDadosDirty(false); // Reset dirty after calculation

            toast.success('Conciliação gerada com sucesso!');
        } catch (error) {
            toast.dismiss('calc-loading');
            console.error('[CalculationPage] Erro:', error);
            toast.error('Erro ao gerar conciliação');
        }
    };

    // Generate Results (after conciliation review)
    const handleGenerateResults = async () => {
        if (!calculationResult || !dashboardData) {
            toast.error('Execute a conciliação primeiro');
            return;
        }

        try {
            console.log('[CalculationPage] Gerando Resultados com conciliação editada...');

            // Update dashboard with edited conciliation data
            const updatedDashboard = {
                ...dashboardData,
                conciliacao: conciliacaoData,
            };
            setDashboardData(updatedDashboard);

            // Reveal result tabs (stay on same page)
            setAvailableTabs(prev => new Set([...prev, 'resumo', 'apendices']));
            setActiveTab('resumo');
            setIsConciliacaoDirty(false); // Reset dirty after calculation

            // Salvar resultado completo no banco
            if (contratoId) {
                await contratoRevisionalService.finalize(
                    contratoId,
                    { conciliacao: conciliacaoData },
                    { resultado: calculationResult, dashboard: updatedDashboard }
                );
            }

            toast.success('Resultados gerados!');

            // NOTE: onComplete is NOT called here - user stays in tabs UI
            // onComplete will be called when user clicks "Finalizar" or "Exportar"
        } catch (error) {
            console.error('[CalculationPage] Erro:', error);
            toast.error('Erro ao gerar resultados');
        }
    };

    // Handle conciliation data changes
    const handleConciliacaoChange = React.useCallback((data: PaymentRow[]) => {
        setConciliacaoData(data);
        setIsConciliacaoDirty(true); // Mark as dirty

        // Auto-save conciliação
        if (contratoId) {
            contratoRevisionalService.updateSteps(contratoId, {
                step2: { conciliacao: data }
            }).catch(err => console.error('[CalculationPage] Erro ao salvar conciliação:', err));
        }
    }, [contratoId]);

    // Check if tab is available
    const isTabAvailable = (tabId: TabId) => availableTabs.has(tabId);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="border-b bg-white dark:bg-slate-800 sticky top-0 z-10">
                <div className="container max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {onBack && (
                                <Button variant="ghost" size="icon" onClick={onBack}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                                    <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Cálculo Revisional
                                    </h1>
                                    <p className="text-sm text-slate-500">
                                        {module === 'GERAL' ? 'Empréstimos & Veículos' : module === 'IMOBILIARIO' ? 'Imobiliário' : 'Cartão de Crédito'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSaving && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Salvando...
                                </span>
                            )}
                            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                                <Save className="h-4 w-4 mr-1" />
                                Salvar Rascunho
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportPDF}
                                disabled={!calculationResult}
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Baixar PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content with Tabs */}
            <div className="container max-w-6xl mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                        {TAB_CONFIG.map((tab) => {
                            const Icon = tab.icon;
                            const available = isTabAvailable(tab.id);
                            return (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    disabled={!available}
                                    className={!available ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {/* Tab: Dados do Contrato */}
                    <TabsContent value="dados" className="space-y-6">
                        <DataEntryTab
                            module={module}
                            data={formData}
                            onChange={handleFormChange}
                            onValidationChange={handleValidationChange}
                        />

                        {/* Action Button */}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <div className="text-sm text-slate-500">
                                {!isDadosDirty && availableTabs.has('conciliacao') && (
                                    <span className="text-green-600">✓ Conciliação já gerada</span>
                                )}
                            </div>
                            <Button
                                size="lg"
                                onClick={handleGenerateConciliation}
                                disabled={!isFormValid || isLoading || !isDadosDirty}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Calculando...
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="h-4 w-4 mr-2" />
                                        {isDadosDirty ? 'Gerar Conciliação' : 'Recalcular Conciliação'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Tab: Conciliação */}
                    <TabsContent value="conciliacao" className="space-y-6">
                        {conciliacaoData.length > 0 ? (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Conciliação de Pagamentos</CardTitle>
                                        <CardDescription>
                                            Revise e ajuste os pagamentos reais antes de gerar o resultado final
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <PaymentReconciliationGrid
                                            data={conciliacaoData}
                                            onDataChange={handleConciliacaoChange}
                                            onRecalculate={handleGenerateResults}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Action Button */}
                                <div className="flex justify-between items-center pt-4 border-t">
                                    <div className="text-sm text-slate-500">
                                        {!isConciliacaoDirty && availableTabs.has('resumo') && (
                                            <span className="text-green-600">✓ Resultado já gerado</span>
                                        )}
                                        {isConciliacaoDirty && (
                                            <span className="text-amber-600">Dados alterados - clique para recalcular</span>
                                        )}
                                    </div>
                                    <Button
                                        size="lg"
                                        onClick={handleGenerateResults}
                                        disabled={!isConciliacaoDirty && availableTabs.has('resumo')}
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        {isConciliacaoDirty ? 'Recalcular Resultado' : 'Gerar Resultado'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                Preencha os dados do contrato e clique em "Gerar Conciliação"
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Resumo */}
                    <TabsContent value="resumo" className="space-y-6">
                        {dashboardData ? (
                            <>
                                <KPICards data={dashboardData.kpis} />
                                <ComparisonSummaryTable
                                    {...dashboardData.totais}
                                    isReconciled={true}
                                />
                                <EvolutionChart data={dashboardData.evolucao} />
                            </>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                Complete a conciliação para ver o resumo
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Apêndices */}
                    <TabsContent value="apendices" className="space-y-6">
                        {calculationResult?.apendices ? (
                            <AppendicesTabs
                                ap01={calculationResult.apendices.ap01?.tabela}
                                ap02={calculationResult.apendices.ap02?.tabela}
                                ap03={calculationResult.apendices.ap03?.tabela}
                                ap04={calculationResult.apendices.ap04?.tabela}
                                ap05={calculationResult.apendices.ap05?.tabela}
                                ap04Descricao={calculationResult.apendices.ap04?.descricao}
                                ap05Descricao={calculationResult.apendices.ap05?.descricao}
                                parametros={dashboardData?.appendices?.parametros}
                            />
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                Complete a conciliação para ver os apêndices
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Helper function to convert form data to calculation request
function formDataToRequest(data: CalculationPageData) {
    return {
        // Identificação
        modalidade: mapTipoContratoToModalidade(data.tipoContrato),
        indexador: (data.indexador as any) || 'NENHUM',

        // Valores
        valorFinanciado: data.valorFinanciado || 0,
        prazoMeses: data.prazoMeses || 12,
        taxaContratoMensal: data.taxaMensalContrato || 0,
        valorParcelaCobrada: data.valorPrestacao || 0, // Valor informado pelo usuário

        // Datas
        dataContrato: data.dataContrato || '',
        dataPrimeiroVencimento: data.dataPrimeiroVencimento || '',
        dataLiberacao: data.dataLiberacao, // Para detectar carência

        // Configuração
        sistemaAmortizacao: data.sistemaAmortizacao || 'PRICE',
        capitalizacao: data.capitalizacao || 'MENSAL',
        usarTaxaBacen: data.usarTaxaBacen ?? true,

        // Encargos Moratórios
        jurosMora: data.jurosMora ?? 1, // Padrão: 1% a.m. (Art. 406 CC)
        multaMoratoria: data.multaMoratoria ?? 2, // Padrão: 2% (Art. 52 §1º CDC)
        encargosIncidirSobrePrincipalCorrigido: data.encargosIncidirSobrePrincipalCorrigido ?? false,

        // Revisão
        expurgarTarifas: data.expurgarTarifas ?? false,
        tarifas: data.tarifas || [],
        restituicaoEmDobro: data.restituicaoEmDobro ?? false,
    };
}

function mapTipoContratoToModalidade(tipo: string) {
    // Map tipoContrato to ModalidadeCredito (must match SERIES_SGS_BACEN keys)
    const map: Record<string, string> = {
        'EMPRESTIMO_PESSOAL': 'EMPRESTIMO_PESSOAL',
        'CONSIGNADO_PRIVADO': 'CONSIGNADO_PRIVADO',
        'CONSIGNADO_PUBLICO': 'CONSIGNADO_PUBLICO',
        'CONSIGNADO_INSS': 'CONSIGNADO_INSS',
        'CAPITAL_GIRO': 'CAPITAL_GIRO_ATE_365',
        'FINANCIAMENTO_VEICULO': 'AQUISICAO_VEICULOS_PF',
        'FINANCIAMENTO_VEICULO_PJ': 'AQUISICAO_VEICULOS_PJ',
        'CHEQUE_ESPECIAL': 'CHEQUE_ESPECIAL',
    };
    return map[tipo] || 'EMPRESTIMO_PESSOAL';
}
