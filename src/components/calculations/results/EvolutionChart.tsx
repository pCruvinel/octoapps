'use client';

import * as React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface EvolutionDataPoint {
    mes: number;
    saldoBanco: number;
    saldoRecalculado: number;
    diferenca: number;
}

interface EvolutionChartProps {
    data: EvolutionDataPoint[];
    className?: string;
}

function formatCurrency(value: number): string {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const banco = payload.find((p: any) => p.dataKey === 'saldoBanco');
        const recalculado = payload.find((p: any) => p.dataKey === 'saldoRecalculado');

        // Calculate diff manually to ensure consistency or get from payload if available
        const valorBanco = banco?.value || 0;
        const valorRecalculado = recalculado?.value || 0;
        const valorDiferenca = valorBanco - valorRecalculado;

        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="font-medium text-slate-900 dark:text-white mb-2">Mês {label}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-slate-600 dark:text-slate-400">Saldo Banco:</span>
                        <span className="font-mono font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorBanco)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-slate-600 dark:text-slate-400">Saldo Recalculado:</span>
                        <span className="font-mono font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorRecalculado)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-400">Indébito:</span>
                        <span className="font-mono font-medium text-emerald-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorDiferenca)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function EvolutionChart({ data, className }: EvolutionChartProps) {
    const totalIndebito = data.length > 0
        ? data.reduce((sum, d) => sum + d.diferenca, 0) / data.length // Média para visualização
        : 0;

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Evolução do Saldo Devedor</CardTitle>
                        <CardDescription>Comparativo: Banco vs Recalculado</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="flex items-center gap-2">
                            <div className="w-3 h-[2px] bg-red-500" />
                            <span>Banco</span>
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-2">
                            <div className="w-3 h-[2px] bg-blue-500" />
                            <span>Recalculado</span>
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                            Área Verde = Indébito
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                            <defs>
                                <linearGradient id="colorIndebito" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="mes"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickLine={{ stroke: '#e2e8f0' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                label={{ value: 'Mês', position: 'insideBottom', offset: -10, fill: '#64748b' }}
                            />
                            <YAxis
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickLine={{ stroke: '#e2e8f0' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickFormatter={formatCurrency}
                                width={80}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Área entre as linhas (indébito) */}
                            <Area
                                type="monotone"
                                dataKey="diferenca"
                                fill="url(#colorIndebito)"
                                stroke="transparent"
                                fillOpacity={1}
                            />

                            {/* Linha do Banco (vermelha) */}
                            <Line
                                type="monotone"
                                dataKey="saldoBanco"
                                stroke="#ef4444"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                            />

                            {/* Linha Recalculada (azul) */}
                            <Line
                                type="monotone"
                                dataKey="saldoRecalculado"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                            />

                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => (
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {value === 'saldoBanco' ? 'Saldo Banco' : value === 'saldoRecalculado' ? 'Saldo Recalculado' : 'Diferença'}
                                    </span>
                                )}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
