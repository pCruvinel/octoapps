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
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Economia Total</p>
                            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
                                {formatCurrency(data.economiaTotal)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Diferença apurada
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Nova Parcela */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Nova Parcela</p>
                            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                                {formatCurrency(data.novaParcelaValor)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400 line-through font-mono">
                                    {formatCurrency(data.parcelaOriginalValor)}
                                </span>
                                <Badge variant="secondary" className="text-emerald-600 bg-emerald-100 text-xs">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    {economiaPercent.toFixed(1)}%
                                </Badge>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                            <Scale className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Taxa Praticada */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Taxa Praticada</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                                    {formatPercent(data.taxaPraticada)}
                                </p>
                                <span className="text-sm font-medium text-slate-400">a.m.</span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500">
                                    Mercado: <span className="font-medium font-mono">{formatPercent(data.taxaMercado)}</span>
                                </span>
                                {sobretaxa > 0 && (
                                    <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        +{sobretaxa.toFixed(0)}%
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="p-3 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Percent className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Classificação de Abuso */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
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
                        <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                            <AlertTriangle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
