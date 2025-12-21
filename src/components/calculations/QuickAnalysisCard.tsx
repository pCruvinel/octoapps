'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Shield,
    CreditCard,
    Zap,
    ArrowRight,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickAnalysisResult {
    taxaContrato: number;
    taxaMercado: number;
    sobretaxa: number;
    economiaEstimada: number;
    parcelaAtual: number;
    parcelaJusta: number;
    viavel: boolean;
    flags: {
        capitalizacaoDiaria: boolean;
        seguroAbusivo: boolean;
        taxaIlegal: boolean;
        tacTecIrregular: boolean;
    };
}

interface QuickAnalysisCardProps {
    result: QuickAnalysisResult | null;
    isLoading?: boolean;
    onProceed?: () => void;
    onNewAnalysis?: () => void;
    className?: string;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value: number): string {
    return value.toFixed(2) + '%';
}

// Loading skeleton
function AnalysisSkeleton() {
    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                </div>
                <Skeleton className="h-16" />
                <div className="flex gap-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-32" />
                </div>
            </CardContent>
        </Card>
    );
}

// Flag badge component
function FlagBadge({ active, label, icon: Icon }: { active: boolean; label: string; icon: React.ElementType }) {
    if (!active) return null;

    return (
        <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
        >
            <Icon className="h-3 w-3 mr-1" />
            {label}
        </Badge>
    );
}

export function QuickAnalysisCard({
    result,
    isLoading = false,
    onProceed,
    onNewAnalysis,
    className,
}: QuickAnalysisCardProps) {
    if (isLoading) {
        return <AnalysisSkeleton />;
    }

    if (!result) {
        return (
            <Card className={cn('w-full max-w-2xl mx-auto', className)}>
                <CardContent className="py-12 text-center">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-blue-500 opacity-50" />
                    <p className="text-slate-500">Insira os dados do contrato para ver a análise prévia</p>
                </CardContent>
            </Card>
        );
    }

    const economiaPercent = result.parcelaAtual > 0
        ? ((result.parcelaAtual - result.parcelaJusta) / result.parcelaAtual) * 100
        : 0;

    return (
        <Card className={cn(
            'w-full max-w-2xl mx-auto border-2',
            result.viavel
                ? 'border-emerald-200 dark:border-emerald-800'
                : 'border-slate-200 dark:border-slate-700',
            className
        )}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'p-2 rounded-full',
                            result.viavel
                                ? 'bg-emerald-100 dark:bg-emerald-900'
                                : 'bg-slate-100 dark:bg-slate-800'
                        )}>
                            {result.viavel ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <XCircle className="h-6 w-6 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Análise Prévia
                                <Badge className={cn(
                                    result.viavel
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                )}>
                                    {result.viavel ? 'Viável' : 'Baixa Viabilidade'}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Retorno em menos de 5 segundos
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Comparativo de Parcelas */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm text-slate-500 mb-1">Parcela Atual</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(result.parcelaAtual)}
                        </p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Parcela Justa</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(result.parcelaJusta)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingDown className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm text-emerald-600">-{economiaPercent.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Sobretaxa */}
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Sobretaxa Detectada</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    +{result.sobretaxa.toFixed(0)}%
                                </span>
                                <span className="text-sm text-slate-500">acima do mercado</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Taxa Contrato</p>
                            <p className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                {formatPercent(result.taxaContrato)} a.m.
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Taxa Mercado</p>
                            <p className="font-mono font-medium text-emerald-600">
                                {formatPercent(result.taxaMercado)} a.m.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Economia Estimada */}
                <div className="text-center py-4">
                    <p className="text-sm text-slate-500 mb-2">Economia Estimada</p>
                    <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(result.economiaEstimada)}
                    </p>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-2">
                    <FlagBadge
                        active={result.flags.capitalizacaoDiaria}
                        label="Capitalização Diária Detectada"
                        icon={TrendingUp}
                    />
                    <FlagBadge
                        active={result.flags.seguroAbusivo}
                        label="Seguro Abusivo"
                        icon={Shield}
                    />
                    <FlagBadge
                        active={result.flags.taxaIlegal}
                        label="Taxa Ilegal"
                        icon={AlertTriangle}
                    />
                    <FlagBadge
                        active={result.flags.tacTecIrregular}
                        label="TAC/TEC Irregular"
                        icon={CreditCard}
                    />
                </div>

                {/* Alert de economia baixa */}
                {result.economiaEstimada < 2000 && result.viavel && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                            Atenção: A economia projetada é baixa. Verifique se os custos processuais compensam o ajuizamento.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    {onNewAnalysis && (
                        <Button variant="outline" onClick={onNewAnalysis} className="flex-1">
                            Nova Análise
                        </Button>
                    )}
                    {onProceed && result.viavel && (
                        <Button onClick={onProceed} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                            Prosseguir para Cálculo Completo
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
