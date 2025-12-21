'use client';

import * as React from 'react';
import { Stepper, StepperProvider, StepperContent, StepperNavigation, useStepperContext } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calculator, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCalculation } from '@/hooks/useCalculation';
import { wizardToRequest } from '@/lib/calculationAdapters';
import { calculationAPI } from '@/services/calculationAPI.service';
import { contratoRevisionalService } from '@/services/contratoRevisionalService';
// AnalisePreviaPanel removed - viability check is now in Triagem Rápida
import { supabase } from '@/lib/supabase';

// Step 1 Modules
import { Step1_Geral } from './steps/Step1_Geral';
import { Step1_Imobiliario } from './steps/Step1_Imobiliario';
import { Step1_Cartao } from './steps/Step1_Cartao';

// Step 2 Modules
import { Step2_Geral } from './steps/Step2_Geral';
import { Step2_Imobiliario } from './steps/Step2_Imobiliario';
// Note: Cartao uses a different Step 2 (Grid), handled via separate component later or Placeholder for now

// Step 3 Modules (Shared for now)
import { Step3_Revisao } from './Step3_Revisao';

import type { GeralStep1Data, GeralStep2Data } from '@/schemas/moduloGeral.schema';
import type { ImobiliarioStep1Data, ImobiliarioStep2Data } from '@/schemas/moduloImobiliario.schema';

import type { CartaoStep1Data } from '@/schemas/moduloCartao.schema';
import {
    getEstimatedMarketRate,
    calculatePMT,
    calculateSACFirstInstallment,
    calculateEconomia,
    calculateGracePeriodInterest,
    daysBetween
} from '@/utils/financialCalculations';

export type CalculationModuleType = 'GERAL' | 'IMOBILIARIO' | 'CARTAO';

export interface WizardData {
    module: CalculationModuleType;
    step1?: GeralStep1Data | ImobiliarioStep1Data | CartaoStep1Data;
    step2?: GeralStep2Data | ImobiliarioStep2Data | any;
    step3?: any;
}

interface CalculationWizardProps {
    module: CalculationModuleType;
    onBack?: () => void;
    onComplete?: (result: any) => void;
    initialData?: Partial<WizardData>;
    existingContratoId?: string;
}

const WIZARD_STEPS = [
    { id: 'dados', title: 'Dados do Contrato', description: 'Partes e valores' },
    { id: 'teses', title: 'Configuração', description: 'Teses e parâmetros' },
    { id: 'revisao', title: 'Revisão', description: 'Tarifas e expurgos' },
];

function WizardContent({ module, onBack, onComplete, initialData, existingContratoId }: CalculationWizardProps) {
    const { currentStep, nextStep, prevStep, isLastStep } = useStepperContext();
    const { calculateFull, isLoading } = useCalculation();

    const [wizardData, setWizardData] = React.useState<Partial<WizardData>>({
        module,
        ...initialData
    });

    const [stepValidity, setStepValidity] = React.useState<Record<number, boolean>>({
        0: false,
        1: false,
        2: false,
    });

    // Contract persistence state
    const [contratoId, setContratoId] = React.useState<string | null>(existingContratoId || null);
    const [userId, setUserId] = React.useState<string | null>(null);

    // Async Bacen Rate State
    const [taxaBacenReal, setTaxaBacenReal] = React.useState<number | null>(null);

    // Get user ID on mount
    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
        });
    }, []);

    // Fetch Real Bacen Rate when contract date changes (with debounce)
    const lastBacenFetchRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        const step1Data = wizardData.step1 as any;
        const dataContrato = step1Data?.dataContrato;

        // Guard: só buscar se data existe e é válida
        if (!dataContrato || dataContrato.length < 10 || !module) {
            return;
        }

        // Guard: não refetchar se já buscou essa data
        if (lastBacenFetchRef.current === dataContrato) {
            return;
        }

        // Debounce de 500ms
        const timer = setTimeout(() => {
            lastBacenFetchRef.current = dataContrato;

            import('@/utils/financialCalculations').then(({ fetchMarketRate }) => {
                fetchMarketRate(module, dataContrato).then(rate => {
                    if (rate) {
                        setTaxaBacenReal(rate);
                        console.log('Taxa Bacen Real encontrada:', rate);
                    }
                });
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [wizardData.step1, module]);

    const handleStepChange = React.useCallback((stepIndex: number, data: any) => {
        setWizardData(prev => ({
            ...prev,
            [`step${stepIndex + 1}`]: data
        }));
    }, []);


    // NOTE: Análise Prévia calculation moved to Triagem Rápida feature
    // See: src/components/triagem/TriagemRapida.tsx


    const handleNext = async (): Promise<boolean> => {
        if (!stepValidity[currentStep]) {
            toast.error('Preencha os campos obrigatórios para continuar');
            return false;
        }

        // Persist Step1 and show Análise Prévia when leaving Step 0
        if (currentStep === 0 && userId) {
            try {
                const step1 = wizardData.step1 as any;

                // Create or update contrato
                let currentContratoId = contratoId;
                if (!currentContratoId) {
                    const { data, error } = await contratoRevisionalService.create(
                        module as 'GERAL' | 'IMOBILIARIO' | 'CARTAO',
                        userId
                    );
                    if (error || !data) {
                        console.error('Error creating contrato:', error);
                        // Continue without persistence
                    } else {
                        currentContratoId = data.id;
                        setContratoId(data.id);
                    }
                }

                // Save Step1 data
                if (currentContratoId) {
                    const nomeRef = `${step1.devedor || 'Cliente'} - ${step1.credor || 'Credor'}`;
                    await contratoRevisionalService.saveStep1(currentContratoId, step1, nomeRef);
                }

                // Análise Prévia moved to Triagem Rápida - proceed directly
            } catch (error) {
                console.error('Error persisting Step1:', error);
                // Continue anyway
            }
        }

        return true;
    };


    const handleComplete = async () => {
        if (!stepValidity[0] || !stepValidity[1]) {
            toast.error('Dados incompletos');
            return;
        }

        try {
            // Build request from wizard data
            const step1 = wizardData.step1 as any;
            const step2 = wizardData.step2 as any;
            const step3 = wizardData.step3 || {};

            const request = wizardToRequest({
                module,
                step1: { ...step1, tipoContrato: step1.tipoContrato || 'PESSOAL' },
                step2: { ...step2 },
                step3: { tarifas: [], ...step3 },
            });

            // Calculate
            toast.loading('Calculando...', { id: 'calc-loading' });
            const result = await calculateFull(request);
            toast.dismiss('calc-loading');

            if (result) {
                onComplete?.({ wizardData, result });
            }
        } catch (error) {
            toast.dismiss('calc-loading');
            console.error(error);
            toast.error('Erro ao processar cálculo');
        }
    };

    const handleSaveDraft = async () => {
        try {
            const step1 = wizardData.step1 as any;
            if (!step1?.valorFinanciado) {
                toast.warning('Preencha ao menos o Passo 1 para salvar rascunho');
                return;
            }

            // For draft, we save to localStorage for now (or could be a separate DB table)
            const draftKey = `octoapp_draft_${module}_${Date.now()}`;
            localStorage.setItem(draftKey, JSON.stringify(wizardData));
            toast.success('Rascunho salvo localmente!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar rascunho');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="border-b bg-white dark:bg-slate-800 sticky top-0 z-10">
                <div className="container max-w-5xl mx-auto px-4 py-4">
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
                                        Novo Cálculo Revisional
                                    </h1>
                                    <p className="text-sm text-slate-500">
                                        Módulo: {module === 'GERAL' ? 'Empréstimos' : module === 'IMOBILIARIO' ? 'Imobiliário' : 'Cartão de Crédito'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                            <Save className="h-4 w-4 mr-1" />
                            Salvar Rascunho
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            <div className="container max-w-5xl mx-auto px-4 pt-6">
                <Stepper steps={WIZARD_STEPS} currentStep={currentStep} className="mb-8" />
            </div>

            {/* Content */}
            <div className="container max-w-5xl mx-auto px-4 pb-8">
                {/* STEP 1 */}
                <StepperContent step={0}>
                    {module === 'GERAL' && (
                        <Step1_Geral
                            defaultValues={wizardData.step1 as GeralStep1Data}
                            onDataChange={(data) => handleStepChange(0, data)}
                            onValidationChange={(valid) => setStepValidity(prev => ({ ...prev, 0: valid }))}
                        />
                    )}
                    {module === 'IMOBILIARIO' && (
                        <Step1_Imobiliario
                            defaultValues={wizardData.step1 as ImobiliarioStep1Data}
                            onDataChange={(data) => handleStepChange(0, data)}
                            onValidationChange={(valid) => setStepValidity(prev => ({ ...prev, 0: valid }))}
                        />
                    )}
                    {module === 'CARTAO' && (
                        <Step1_Cartao
                            defaultValues={wizardData.step1 as CartaoStep1Data}
                            onDataChange={(data) => handleStepChange(0, data)}
                            onValidationChange={(valid) => setStepValidity(prev => ({ ...prev, 0: valid }))}
                        />
                    )}
                </StepperContent>

                {/* STEP 2 */}
                <StepperContent step={1}>
                    {module === 'GERAL' && (
                        <Step2_Geral
                            defaultValues={wizardData.step2 as GeralStep2Data}
                            onDataChange={(data) => handleStepChange(1, data)}
                            onValidationChange={(valid) => setStepValidity(prev => ({ ...prev, 1: valid }))}
                            contractDate={(wizardData.step1 as GeralStep1Data)?.dataContrato}
                        />
                    )}
                    {module === 'IMOBILIARIO' && (
                        <Step2_Imobiliario
                            defaultValues={wizardData.step2 as ImobiliarioStep2Data}
                            onDataChange={(data) => handleStepChange(1, data)}
                            onValidationChange={(valid) => setStepValidity(prev => ({ ...prev, 1: valid }))}
                            contractDate={(wizardData.step1 as ImobiliarioStep1Data)?.dataContrato}
                        />
                    )}
                    {module === 'CARTAO' && (
                        <div className="text-center p-8 text-slate-500">
                            (Grid de Faturas - Em Desenvolvimento no Sprint 3)
                            {/* Placeholder to pass validation for now */}
                            <Button className="mt-4" onClick={() => setStepValidity(prev => ({ ...prev, 1: true }))}>
                                Simular Preenchimento
                            </Button>
                        </div>
                    )}
                </StepperContent>

                {/* STEP 3 */}
                <StepperContent step={2}>
                    <Step3_Revisao
                        defaultValues={wizardData.step3}
                        onDataChange={(data) => handleStepChange(2, data)}
                        onValidationChange={(valid) => setStepValidity(prev => ({ ...prev, 2: valid }))}
                    />
                </StepperContent>
            </div>

            {/* Footer Navigation */}
            <div className="sticky bottom-0 mt-8 bg-white dark:bg-slate-800 border-t shadow-lg py-4">
                <div className="container max-w-5xl mx-auto px-4">
                    <StepperNavigation
                        onNext={handleNext}
                        onComplete={handleComplete}
                        isLoading={isLoading}
                        completeLabel="Calcular"
                    />
                </div>
            </div>

        </div>
    );
}

export function CalculationWizard(props: CalculationWizardProps) {
    return (
        <StepperProvider totalSteps={WIZARD_STEPS.length}>
            <WizardContent {...props} />
        </StepperProvider>
    );
}
