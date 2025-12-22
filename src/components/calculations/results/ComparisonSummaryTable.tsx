'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComparisonSummaryTableProps {
    /**
     * Valores do cenário banco (AP01)
     */
    totalPagoBanco: number;
    totalJurosBanco: number;
    parcelaBanco: number;
    taxaContrato: number; // % mensal
    valorFinanciadoBanco?: number;

    /**
     * Valores recalculados (AP02)
     */
    totalPagoRecalculado: number;
    totalJurosRecalculado: number;
    parcelaRecalculada: number;
    taxaMercado: number; // % mensal
    valorFinanciadoExpurgado?: number;
    tarifasExpurgadas?: number;

    /**
     * Diferenças / Economia
     */
    economiaTotal: number;
    economiaJuros: number;
    economiaParcela: number;
    sobretaxaPercentual: number;

    /**
     * Flags e metadados
     */
    isReconciled?: boolean;
    jurosRecalculadosMaior?: boolean; // AP02 juros > AP01 quando há menos prazo
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
    if (value === undefined || value === null || isNaN(value)) return '0,00%';
    return value.toFixed(2).replace('.', ',') + '%';
}

// Convert monthly to annual rate (compound)
function monthlyToAnnual(monthly: number): number {
    return (Math.pow(1 + monthly / 100, 12) - 1) * 100;
}

interface RowData {
    label: string;
    banco: string;
    justo: string;
    impacto: string | React.ReactNode;
    impactoType: 'positive' | 'negative' | 'neutral' | 'warning';
    tooltip?: string;
}

export function ComparisonSummaryTable({
    totalPagoBanco,
    totalJurosBanco,
    parcelaBanco,
    taxaContrato,
    valorFinanciadoBanco,
    totalPagoRecalculado,
    totalJurosRecalculado,
    parcelaRecalculada,
    taxaMercado,
    valorFinanciadoExpurgado,
    tarifasExpurgadas,
    economiaTotal,
    economiaJuros,
    economiaParcela,
    sobretaxaPercentual,
    isReconciled,
    jurosRecalculadosMaior,
    className,
}: ComparisonSummaryTableProps) {
    // Build row data according to new structure
    const rows: RowData[] = [
        // 1. Valor Financiado
        {
            label: 'Valor Financiado',
            banco: formatCurrency(valorFinanciadoBanco || totalPagoBanco - totalJurosBanco),
            justo: formatCurrency(valorFinanciadoExpurgado || totalPagoRecalculado - totalJurosRecalculado),
            impacto: tarifasExpurgadas && tarifasExpurgadas > 0
                ? (
                    <span className="flex items-center gap-1">
                        - {formatCurrency(tarifasExpurgadas)}
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50 border-amber-200 text-amber-700">
                            Tarifas
                        </Badge>
                    </span>
                )
                : '-',
            impactoType: tarifasExpurgadas && tarifasExpurgadas > 0 ? 'positive' : 'neutral',
            tooltip: tarifasExpurgadas ? 'Valor expurgado em tarifas abusivas (TAC, seguros, etc.)' : undefined,
        },
        // 2. Taxa de Juros (a.a.)
        {
            label: 'Taxa de Juros (a.a.)',
            banco: formatPercent(monthlyToAnnual(taxaContrato || 0)),
            justo: formatPercent(monthlyToAnnual(taxaMercado || 0)),
            impacto: (
                <span className="flex items-center gap-1">
                    - {formatPercent(Math.abs(monthlyToAnnual(taxaContrato || 0) - monthlyToAnnual(taxaMercado || 0)))}
                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-50 border-blue-200 text-blue-700">
                        Ajuste
                    </Badge>
                </span>
            ),
            impactoType: sobretaxaPercentual > 0 ? 'positive' : 'neutral',
        },
        // 3. Total de Juros
        {
            label: 'Total de Juros',
            banco: formatCurrency(totalJurosBanco),
            justo: formatCurrency(totalJurosRecalculado),
            impacto: jurosRecalculadosMaior || totalJurosRecalculado > totalJurosBanco
                ? (
                    <span className="flex items-center gap-1 text-orange-600">
                        <AlertCircle className="h-3 w-3" />
                        Juros recalculados
                    </span>
                )
                : formatCurrency(economiaJuros),
            impactoType: jurosRecalculadosMaior || totalJurosRecalculado > totalJurosBanco ? 'warning' : 'positive',
            tooltip: jurosRecalculadosMaior ? 'Juros recalculados podem ser maiores se houve redução de prazo ou amortização extra' : undefined,
        },
        // 4. Parcela Mensal
        {
            label: 'Parcela Mensal',
            banco: formatCurrency(parcelaBanco),
            justo: formatCurrency(parcelaRecalculada),
            impacto: (
                <span className="font-semibold">
                    {formatCurrency(economiaParcela)} mensais
                </span>
            ),
            impactoType: economiaParcela > 0 ? 'positive' : 'neutral',
        },
        // 5. Custo Total (Final)
        {
            label: 'Custo Total (Final)',
            banco: formatCurrency(totalPagoBanco),
            justo: formatCurrency(totalPagoRecalculado),
            impacto: (
                <span className="text-lg font-bold">
                    {formatCurrency(economiaTotal)}
                </span>
            ),
            impactoType: economiaTotal > 0 ? 'positive' : 'neutral',
        },
    ];

    const getImpactoCellStyle = (type: RowData['impactoType']) => {
        switch (type) {
            case 'positive':
                return 'text-emerald-700 bg-emerald-50/50';
            case 'negative':
                return 'text-red-700 bg-red-50/50';
            case 'warning':
                return 'text-orange-600 bg-orange-50/50';
            default:
                return 'text-slate-600';
        }
    };

    return (
        <TooltipProvider>
            <Card className={cn('shadow-sm', className)}>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-800">
                                Resumo Comparativo
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Cenário do Banco vs. Cenário Justo (OctoApps)
                            </CardDescription>
                        </div>
                        {isReconciled && (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                ✓ Conciliado
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wide w-[180px]">
                                    Descrição
                                </TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 text-xs uppercase tracking-wide">
                                    Cenário Banco
                                </TableHead>
                                <TableHead className="text-right font-semibold text-blue-700 text-xs uppercase tracking-wide">
                                    Cenário Justo
                                </TableHead>
                                <TableHead className="text-right font-semibold text-emerald-700 text-xs uppercase tracking-wide">
                                    Impacto / Economia
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow
                                    key={index}
                                    className={cn(
                                        'hover:bg-slate-50/50 transition-colors',
                                        index === rows.length - 1 && 'bg-slate-50/50 font-medium'
                                    )}
                                >
                                    <TableCell className="font-medium text-slate-700 text-sm py-3">
                                        <div className="flex items-center gap-1.5">
                                            {row.label}
                                            {row.tooltip && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-[200px] text-xs">
                                                        {row.tooltip}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-slate-600 py-3">
                                        {row.banco}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-blue-700 font-medium py-3">
                                        {row.justo}
                                    </TableCell>
                                    <TableCell className={cn(
                                        'text-right text-sm py-3',
                                        getImpactoCellStyle(row.impactoType)
                                    )}>
                                        {row.impacto}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
