'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingDown,
    AlertTriangle,
    DollarSign,
    Percent,
    ShieldCheck,
    ShieldAlert,
    Clock,
    Wallet,
    ArrowDownRight,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
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
    // Extended data for breakdown
    indebitoAcumulado?: number;      // Past: what was overpaid
    reducaoSaldoDevedor?: number;    // Future: saldo reduction
    diferençaMensal?: number;        // Monthly relief
    valorFinanciadoOriginal?: number;
    valorFinanciadoExpurgado?: number;
    tarifasExpurgadas?: number;
    capitalizacaoDiariaDetectada?: boolean;
    percentualJurosCapital?: number; // Interest as % of principal
}

interface DetalhadaKPICardsProps {
    data: KPIData;
    className?: string;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value: number): string {
    return value.toFixed(2) + '%';
}

// Scorecard Configuration based on Sobretaxa %
function getSobretaxaConfig(sobretaxa: number) {
    if (sobretaxa >= 50) {
        return {
            level: 'CRITICA',
            color: 'border-l-red-500 bg-red-50/50',
            iconColor: 'text-red-600 bg-red-100',
            textColor: 'text-red-700',
            label: 'Abusividade Crítica',
            description: 'Sobretaxa ≥ 50% (Tema 28 STJ)',
            badge: 'bg-red-100 text-red-700 border-red-200',
            icon: XCircle,
        };
    }
    if (sobretaxa >= 30) {
        return {
            level: 'ALTA',
            color: 'border-l-orange-500 bg-orange-50/30',
            iconColor: 'text-orange-600 bg-orange-100',
            textColor: 'text-orange-700',
            label: 'Abusividade Alta',
            description: 'Sobretaxa entre 30% e 50%',
            badge: 'bg-orange-100 text-orange-700 border-orange-200',
            icon: ShieldAlert,
        };
    }
    if (sobretaxa >= 15) {
        return {
            level: 'MEDIA',
            color: 'border-l-amber-400 bg-amber-50/30',
            iconColor: 'text-amber-600 bg-amber-100',
            textColor: 'text-amber-700',
            label: 'Atenção',
            description: 'Sobretaxa entre 15% e 30%',
            badge: 'bg-amber-100 text-amber-700 border-amber-200',
            icon: AlertTriangle,
        };
    }
    return {
        level: 'BAIXA',
        color: 'border-l-emerald-500 bg-emerald-50/30',
        iconColor: 'text-emerald-600 bg-emerald-100',
        textColor: 'text-emerald-700',
        label: 'Baixa Viabilidade',
        description: 'Sobretaxa < 15% - Avaliar custo/benefício',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
    };
}

export function DetalhadaKPICards({ data, className }: DetalhadaKPICardsProps) {
    const sobretaxa = data.taxaMercado > 0
        ? ((data.taxaPraticada - data.taxaMercado) / data.taxaMercado) * 100
        : 0;

    const config = getSobretaxaConfig(sobretaxa);
    const IconStatus = config.icon;

    const diferençaMensal = data.diferençaMensal ?? (data.parcelaOriginalValor - data.novaParcelaValor);
    const indebitoPassado = data.indebitoAcumulado ?? data.restituicaoSimples;
    const reducaoFutura = data.reducaoSaldoDevedor ?? (data.economiaTotal - indebitoPassado);

    return (
        <div className={cn('space-y-4', className)}>
            {/* Scorecard Principal - Sobretaxa com Semáforo */}
            <Card className={cn('border-l-4 shadow-sm', config.color)}>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn('p-3 rounded-xl', config.iconColor)}>
                                <IconStatus className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className={cn('text-lg font-semibold', config.textColor)}>
                                        {config.label}
                                    </p>
                                    <Badge variant="outline" className={cn('text-xs', config.badge)}>
                                        {formatPercent(sobretaxa)} sobretaxa
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {config.description}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Taxa Contrato vs. Mercado</p>
                            <div className="flex items-center gap-2 justify-end mt-1">
                                <span className="font-mono text-sm text-slate-600">
                                    {formatPercent(data.taxaPraticada)} a.m.
                                </span>
                                <ArrowDownRight className="h-4 w-4 text-slate-400" />
                                <span className="font-mono text-sm text-emerald-600 font-medium">
                                    {formatPercent(data.taxaMercado)} a.m.
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Grid de Economia Detalhada */}
            <div className="grid gap-3 md:grid-cols-3">
                {/* Indébito Acumulado (Passado) */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Passado</p>
                                <p className="text-lg font-bold font-mono text-slate-800 mt-1">
                                    {formatCurrency(indebitoPassado)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">Indébito acumulado</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Redução Saldo (Futuro) */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                                <Wallet className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Futuro</p>
                                <p className="text-lg font-bold font-mono text-slate-800 mt-1">
                                    {formatCurrency(reducaoFutura > 0 ? reducaoFutura : 0)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">Redução saldo devedor</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Diferença Mensal */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <TrendingDown className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mensal</p>
                                <p className="text-lg font-bold font-mono text-emerald-700 mt-1">
                                    {formatCurrency(diferençaMensal)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">Alívio por parcela</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Indicadores Técnicos */}
            <div className="grid gap-3 md:grid-cols-3">
                {/* Valor Financiado Fidedigno */}
                {data.tarifasExpurgadas && data.tarifasExpurgadas > 0 && (
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Principal</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-xs text-slate-400 line-through font-mono">
                                            {formatCurrency(data.valorFinanciadoOriginal || 0)}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800 font-mono">
                                            {formatCurrency(data.valorFinanciadoExpurgado || 0)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        -{formatCurrency(data.tarifasExpurgadas)} em tarifas
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Representatividade do Juro */}
                {data.percentualJurosCapital && data.percentualJurosCapital > 0 && (
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                    <Percent className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Juros/Capital</p>
                                    <p className="text-lg font-bold font-mono text-slate-800 mt-1">
                                        {formatPercent(data.percentualJurosCapital)}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">Peso dos juros</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Capitalização Diária */}
                {data.capitalizacaoDiariaDetectada !== undefined && (
                    <Card className={cn(
                        'shadow-sm',
                        data.capitalizacaoDiariaDetectada
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-slate-200'
                    )}>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    'p-2 rounded-lg',
                                    data.capitalizacaoDiariaDetectada
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-slate-100 text-slate-600'
                                )}>
                                    {data.capitalizacaoDiariaDetectada
                                        ? <ShieldAlert className="h-4 w-4" />
                                        : <ShieldCheck className="h-4 w-4" />
                                    }
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Capitalização</p>
                                    <p className={cn(
                                        'text-sm font-semibold mt-1',
                                        data.capitalizacaoDiariaDetectada ? 'text-red-700' : 'text-slate-700'
                                    )}>
                                        {data.capitalizacaoDiariaDetectada ? 'Diária Detectada' : 'Mensal Regular'}
                                    </p>
                                    {data.capitalizacaoDiariaDetectada && (
                                        <p className="text-xs text-red-600 mt-0.5">Argumento de abusividade STJ</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
