'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, TrendingUp, DollarSign, Percent } from 'lucide-react';

export interface ComparisonSummaryTableProps {
    /**
     * Valores pagos do banco (AP01)
     */
    totalPagoBanco: number;
    totalJurosBanco: number;
    parcelaBanco: number;
    taxaContrato: number; // % mensal

    /**
     * Valores recalculados (AP02)
     */
    totalPagoRecalculado: number;
    totalJurosRecalculado: number;
    parcelaRecalculada: number;
    taxaMercado: number; // % mensal

    /**
     * Diferenças
     */
    economiaTotal: number;
    economiaJuros: number;
    economiaParcela: number;
    sobretaxaPercentual: number;

    className?: string;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    }).format(value);
}

function formatPercent(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) return '0.00%';
    return `${value.toFixed(2)}%`;
}

export function ComparisonSummaryTable({
    totalPagoBanco,
    totalJurosBanco,
    parcelaBanco,
    taxaContrato,
    totalPagoRecalculado,
    totalJurosRecalculado,
    parcelaRecalculada,
    taxaMercado,
    economiaTotal,
    economiaJuros,
    economiaParcela,
    sobretaxaPercentual,
    className,
}: ComparisonSummaryTableProps) {
    const rows = [
        {
            label: 'Total Pago',
            icon: DollarSign,
            banco: totalPagoBanco,
            recalculado: totalPagoRecalculado,
            diferenca: economiaTotal,
            format: 'currency' as const,
        },
        {
            label: 'Total de Juros',
            icon: TrendingUp,
            banco: totalJurosBanco,
            recalculado: totalJurosRecalculado,
            diferenca: economiaJuros,
            format: 'currency' as const,
        },
        {
            label: 'Valor da Parcela',
            icon: DollarSign,
            banco: parcelaBanco,
            recalculado: parcelaRecalculada,
            diferenca: economiaParcela,
            format: 'currency' as const,
        },
        {
            label: 'Taxa Mensal',
            icon: Percent,
            banco: taxaContrato,
            recalculado: taxaMercado,
            diferenca: (taxaContrato || 0) - (taxaMercado || 0),
            format: 'percent' as const,
        },
    ];

    return (
        <Card className={className}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Resumo Comparativo</CardTitle>
                        <CardDescription>Valores cobrados pelo banco vs. valores de mercado</CardDescription>
                    </div>
                    <Badge
                        variant="outline"
                        className={sobretaxaPercentual > 50
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                        }
                    >
                        Sobretaxa: {formatPercent(sobretaxaPercentual)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Descrição</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                                    Banco
                                </TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                                    Recalculado
                                </TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                                    Economia
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, index) => {
                                const Icon = row.icon;
                                const isPositiveDiff = row.diferenca > 0;
                                const formatValue = row.format === 'currency' ? formatCurrency : formatPercent;

                                return (
                                    <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                    <Icon className="h-3.5 w-3.5" />
                                                </div>
                                                {row.label}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-600 dark:text-slate-400">
                                            {formatValue(row.banco)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-600 dark:text-slate-400 font-medium">
                                            {formatValue(row.recalculado)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 font-mono font-bold text-slate-600 dark:text-slate-400">
                                                {isPositiveDiff ? (
                                                    <ArrowDown className="h-3 w-3 text-emerald-500" />
                                                ) : row.diferenca < 0 ? (
                                                    <ArrowUp className="h-3 w-3 text-amber-500" />
                                                ) : null}
                                                {formatValue(Math.abs(row.diferenca))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer com destaque na economia */}
                <div className="mt-4 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                                    Economia Total Apurada
                                </p>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                                    Diferença entre o que foi cobrado e o valor justo
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(economiaTotal)}
                            </p>
                            {sobretaxaPercentual > 0 && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-1">
                                    {formatPercent(sobretaxaPercentual)} acima do mercado
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
