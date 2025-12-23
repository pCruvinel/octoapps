'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Car, Home, CreditCard, Clock, Loader2 } from 'lucide-react';
import { PreviaEmprestimoVeiculoForm } from './previa-emprestimo-veiculo-form';
import { PreviaImobiliariaForm } from './previa-imobiliaria-form';
import { PreviaEmprestimoVeiculoResultado } from './previa-emprestimo-veiculo-resultado';
import { PreviaImobiliariaResultado } from './previa-imobiliaria-resultado';
import type { ResultadoTriagem } from '@/schemas/triagemRapida.schema';
import type { PreviaImobiliariaResultadoType } from './previa-imobiliaria-resultado';
import type { TriagemFormData } from '@/schemas/triagemRapida.schema';
import { contratoRevisionalService } from '@/services/contratoRevisionalService';
import { createStep1Payload, type TriagemGeralFormData, type TriagemImobiliarioFormData } from '@/adapters/triagemToWizard.adapter';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

export type ModuloAtivo = 'GERAL' | 'IMOBILIARIO' | 'CARTAO';

export interface PreviaContainerProps {
    onNavigateToWizard?: (prefillData: TriagemFormData) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PreviaContainer({ onNavigateToWizard }: PreviaContainerProps) {
    const { user } = useAuth();
    const [moduloAtivo, setModuloAtivo] = useState<ModuloAtivo>('GERAL');
    const [step, setStep] = useState<'input' | 'result'>('input');
    const [isCreatingContract, setIsCreatingContract] = useState(false);

    // Estado para resultado do módulo Geral
    const [resultadoGeral, setResultadoGeral] = useState<ResultadoTriagem | null>(null);
    // Estado para dados do formulário Geral (para persistir)
    const [formDataGeral, setFormDataGeral] = useState<TriagemGeralFormData | null>(null);

    // Estado para resultado do módulo Imobiliário
    const [resultadoImobiliario, setResultadoImobiliario] = useState<PreviaImobiliariaResultadoType | null>(null);
    // Estado para dados do formulário Imobiliário (para persistir)
    const [formDataImobiliario, setFormDataImobiliario] = useState<TriagemImobiliarioFormData | null>(null);

    // Handler para quando o cálculo do Geral for concluído
    const handleResultadoGeral = (resultado: ResultadoTriagem, formData?: TriagemGeralFormData) => {
        console.log('[TriagemRapida] Resultado Geral recebido:', resultado);
        setResultadoGeral(resultado);
        if (formData) setFormDataGeral(formData);
        setStep('result');
    };

    // Handler para quando o cálculo do Imobiliário for concluído
    const handleResultadoImobiliario = (resultado: PreviaImobiliariaResultadoType, formData?: TriagemImobiliarioFormData) => {
        console.log('[TriagemRapida] Resultado Imobiliário recebido:', resultado);
        setResultadoImobiliario(resultado);
        if (formData) setFormDataImobiliario(formData);
        setStep('result');
    };

    // Handler para iniciar cálculo completo (criar contrato e navegar para wizard)
    const handleIniciarCompleto = async () => {
        if (!user?.id) {
            toast.error('Você precisa estar logado para continuar');
            return;
        }

        setIsCreatingContract(true);
        try {
            const modulo = moduloAtivo === 'IMOBILIARIO' ? 'IMOBILIARIO' : 'GERAL';
            const formData = modulo === 'GERAL' ? formDataGeral : formDataImobiliario;
            const resultado = modulo === 'GERAL' ? resultadoGeral : resultadoImobiliario;

            if (!formData) {
                toast.error('Dados do formulário não encontrados');
                return;
            }

            // 1. Criar contrato
            const { data: contrato, error: createError } = await contratoRevisionalService.create(
                modulo,
                user.id,
                {
                    origem: 'TRIAGEM',
                    valorContrato: formData.valorFinanciado || undefined,
                    dataContrato: formData.dataContrato || undefined,
                }
            );

            if (createError || !contrato) {
                console.error('[TriagemRapida] Erro ao criar contrato:', createError);
                toast.error('Erro ao criar contrato');
                return;
            }

            console.log('[TriagemRapida] Contrato criado:', contrato.id);

            // 2. Adaptar e salvar Step 1
            const step1Data = createStep1Payload(modulo, formData);
            const nomeReferencia = `Triagem ${modulo} - ${new Date().toLocaleDateString('pt-BR')}`;

            const { error: saveError } = await contratoRevisionalService.saveStep1(
                contrato.id,
                step1Data,
                nomeReferencia
            );

            if (saveError) {
                console.error('[TriagemRapida] Erro ao salvar step1:', saveError);
                toast.error('Erro ao salvar dados do contrato');
                return;
            }

            // 3. Salvar resultado da análise prévia (se existir)
            if (resultado && 'economiaTotal' in resultado) {
                const classificacao = resultado.classificacao === 'VIAVEL' ? 'VIAVEL'
                    : resultado.classificacao === 'ATENCAO' ? 'ATENCAO' : 'INVIAVEL';

                await contratoRevisionalService.saveResultadoAnalisePrevia(contrato.id, {
                    taxaContrato: (resultado as ResultadoTriagem).taxaContratoAnual * 100,
                    taxaMediaBacen: (resultado as ResultadoTriagem).taxaMercadoAnual * 100,
                    sobretaxaPercentual: (resultado as ResultadoTriagem).sobretaxaPercentual * 100,
                    economiaEstimada: (resultado as ResultadoTriagem).economiaTotal,
                    novaParcelaEstimada: (resultado as ResultadoTriagem).prestacaoRevisada,
                    classificacao,
                    detalhesCalculo: resultado as unknown as Record<string, unknown>,
                });
            }

            toast.success('Contrato criado! Redirecionando...');

            // 4. Navegar para wizard no step 2
            window.location.href = `/calculos/wizard?id=${contrato.id}&step=2`;

        } catch (error) {
            console.error('[TriagemRapida] Erro:', error);
            toast.error('Erro ao processar solicitação');
        } finally {
            setIsCreatingContract(false);
        }
    };

    // Handler para nova triagem
    const handleNovoCalculo = () => {
        setStep('input');
        setResultadoGeral(null);
        setResultadoImobiliario(null);
    };

    // Renderizar resultado baseado no módulo ativo
    if (step === 'result') {
        if (moduloAtivo === 'GERAL' && resultadoGeral) {
            return (
                <div className="max-w-4xl mx-auto">
                    <PreviaEmprestimoVeiculoResultado
                        resultado={resultadoGeral}
                        onIniciarCompleto={handleIniciarCompleto}
                        onNovoCalculo={handleNovoCalculo}
                    />
                </div>
            );
        }

        if (moduloAtivo === 'IMOBILIARIO' && resultadoImobiliario) {
            return (
                <div className="max-w-4xl mx-auto">
                    <PreviaImobiliariaResultado
                        resultado={resultadoImobiliario}
                        onIniciarCompleto={handleIniciarCompleto}
                        onNovoCalculo={handleNovoCalculo}
                    />
                </div>
            );
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-1 pt-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Análise Prévia
                </h1>
                <p className="text-muted-foreground">
                    Avalie a viabilidade de uma revisão contratual em segundos
                </p>
            </div>

            {/* Tabs por Módulo */}
            <Tabs
                value={moduloAtivo}
                onValueChange={(v) => setModuloAtivo(v as ModuloAtivo)}
                className="w-full"
            >
                <TabsList className="bg-muted text-muted-foreground items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-3 mb-6 h-14">
                    <TabsTrigger value="GERAL" className="text-base gap-2">
                        <Car className="w-4 h-4" />
                        <span className="hidden sm:inline">Veículos/Empréstimos</span>
                        <span className="sm:hidden">Geral</span>
                    </TabsTrigger>
                    <TabsTrigger value="IMOBILIARIO" className="text-base gap-2">
                        <Home className="w-4 h-4" />
                        <span className="hidden sm:inline">Imobiliário</span>
                        <span className="sm:hidden">Imóvel</span>
                    </TabsTrigger>
                    <TabsTrigger value="CARTAO" className="text-base gap-2" disabled>
                        <CreditCard className="w-4 h-4" />
                        <span className="hidden sm:inline">Cartão de Crédito</span>
                        <span className="sm:hidden">Cartão</span>
                        <Clock className="w-3 h-3 text-muted-foreground" />
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Módulo Geral */}
                <TabsContent value="GERAL" className="mt-0">
                    <PreviaEmprestimoVeiculoForm onResultado={handleResultadoGeral} />
                </TabsContent>

                {/* Tab: Módulo Imobiliário */}
                <TabsContent value="IMOBILIARIO" className="mt-0">
                    <PreviaImobiliariaForm onResultado={handleResultadoImobiliario} />
                </TabsContent>

                {/* Tab: Módulo Cartão (Em breve) */}
                <TabsContent value="CARTAO" className="mt-0">
                    <Card className="border-dashed border-2 border-slate-200">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <CreditCard className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">
                                Em Breve
                            </h3>
                            <p className="text-sm text-slate-500 max-w-md">
                                O módulo de Cartão de Crédito está em desenvolvimento.
                                Ele permitirá análise de faturas com cálculo de rotativo
                                e recomposição pela Taxa Média de Mercado.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
