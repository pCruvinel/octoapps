'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPIData {
    economiaTotal: number;
    novaParcelaValor: number;
    parcelaOriginalValor: number;
    taxaPraticada: number;
    taxaMercado: number;
    restituicaoSimples: number;
    restituicaoEmDobro: number;
    classificacaoAbuso: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
}

interface KPICardsProps {
    data: KPIData;
    className?: string;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value: number): string {
    return value.toFixed(2) + '%';
}

const CLASSIFICACAO_CONFIG = {
    BAIXA: { label: 'Baixa', color: 'bg-slate-100 text-slate-700', description: 'Dentro do esperado' },
    MEDIA: { label: 'Média', color: 'bg-amber-100 text-amber-700', description: 'Acima da média' },
    ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-700', description: 'Significativamente abusiva' },
    CRITICA: { label: 'Crítica', color: 'bg-red-100 text-red-700', description: 'Extremamente abusiva' },
};

export function KPICards({ data, className }: KPICardsProps) {
    const economiaPercent = data.parcelaOriginalValor > 0
        ? ((data.parcelaOriginalValor - data.novaParcelaValor) / data.parcelaOriginalValor) * 100
        : 0;

    const sobretaxa = data.taxaMercado > 0
        ? ((data.taxaPraticada - data.taxaMercado) / data.taxaMercado) * 100
        : 0;

    const classificacao = CLASSIFICACAO_CONFIG[data.classificacaoAbuso];

    return (
        <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
            {/* Economia Total */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Economia Total</p>
                            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                                {formatCurrency(data.economiaTotal)}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                Diferença apurada
                            </p>
                        </div>
                        <div className="p-2 rounded-full bg-emerald-200 dark:bg-emerald-800">
                            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Nova Parcela */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Nova Parcela</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                {formatCurrency(data.novaParcelaValor)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400 line-through">
                                    {formatCurrency(data.parcelaOriginalValor)}
                                </span>
                                <Badge variant="secondary" className="text-emerald-600 bg-emerald-100 text-xs">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    {economiaPercent.toFixed(1)}%
                                </Badge>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                            <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Taxa Praticada */}
            <Card className={cn(
                sobretaxa > 50 && 'border-red-200 dark:border-red-800'
            )}>
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Taxa Praticada</p>
                            <p className={cn(
                                'text-2xl font-bold mt-1',
                                sobretaxa > 50 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                            )}>
                                {formatPercent(data.taxaPraticada)} a.m.
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400">
                                    Mercado: {formatPercent(data.taxaMercado)}
                                </span>
                                {sobretaxa > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        +{sobretaxa.toFixed(0)}%
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className={cn(
                            'p-2 rounded-full',
                            sobretaxa > 50
                                ? 'bg-red-100 dark:bg-red-900'
                                : 'bg-slate-100 dark:bg-slate-800'
                        )}>
                            <Percent className={cn(
                                'h-5 w-5',
                                sobretaxa > 50
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-600 dark:text-slate-400'
                            )} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Classificação de Abuso */}
            <Card className={cn(
                data.classificacaoAbuso === 'CRITICA' && 'border-red-200 dark:border-red-800',
                data.classificacaoAbuso === 'ALTA' && 'border-orange-200 dark:border-orange-800'
            )}>
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Classificação</p>
                            <div className="mt-2">
                                <Badge className={cn('text-sm px-3 py-1', classificacao.color)}>
                                    {classificacao.label}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                {classificacao.description}
                            </p>
                        </div>
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
