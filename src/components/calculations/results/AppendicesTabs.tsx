'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Table2, FileText, GitCompare, Settings2 } from 'lucide-react';

interface AppendixData {
    ap01?: any[]; // Evolução Original
    ap02?: any[]; // Evolução Recalculada
    ap03?: any[]; // Diferenças
    parametros?: {
        serieBacen: string;
        taxaUsada: number;
        dataConsulta: string;
        metodologia: string;
    };
}

interface AppendicesTabsProps {
    data: AppendixData;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    resumoContent?: React.ReactNode;
    conciliacaoContent?: React.ReactNode;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

function AmortizationTable({ data, title }: { data: any[]; title: string }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                Nenhum dado disponível
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Nº</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Vencimento</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-600">Saldo Anterior</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-600">Juros</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-600">Amortização</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-600">Parcela</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-600">Saldo Devedor</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-2 font-mono text-slate-500">{row.n || row.mes}</td>
                            <td className="px-4 py-2 text-slate-600">{formatDate(row.vencimento || row.data)}</td>
                            <td className="px-4 py-2 text-right font-mono">{formatCurrency(row.saldoAnterior || row.saldo_anterior || 0)}</td>
                            <td className="px-4 py-2 text-right font-mono text-orange-600">{formatCurrency(row.juros || 0)}</td>
                            <td className="px-4 py-2 text-right font-mono text-blue-600">{formatCurrency(row.amortizacao || 0)}</td>
                            <td className="px-4 py-2 text-right font-mono font-medium">{formatCurrency(row.parcela || row.pmt || 0)}</td>
                            <td className="px-4 py-2 text-right font-mono font-medium">{formatCurrency(row.saldoDevedor || row.saldo_devedor || 0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function AppendicesTabs({
    data,
    activeTab = 'resumo',
    onTabChange,
    resumoContent,
    conciliacaoContent,
}: AppendicesTabsProps) {
    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
                <TabsTrigger value="resumo" className="flex items-center gap-2 py-3">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Resumo</span>
                </TabsTrigger>
                <TabsTrigger value="conciliacao" className="flex items-center gap-2 py-3">
                    <Table2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Conciliação</span>
                </TabsTrigger>
                <TabsTrigger value="ap01" className="flex items-center gap-2 py-3">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">AP01</span>
                </TabsTrigger>
                <TabsTrigger value="ap02" className="flex items-center gap-2 py-3">
                    <GitCompare className="h-4 w-4" />
                    <span className="hidden sm:inline">AP02/03</span>
                </TabsTrigger>
                <TabsTrigger value="parametros" className="flex items-center gap-2 py-3">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Parâmetros</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="mt-6">
                {resumoContent || (
                    <div className="text-center py-8 text-slate-500">
                        Dashboard de resultados será exibido aqui
                    </div>
                )}
            </TabsContent>

            <TabsContent value="conciliacao" className="mt-6">
                {conciliacaoContent || (
                    <div className="text-center py-8 text-slate-500">
                        Editor de conciliação será exibido aqui
                    </div>
                )}
            </TabsContent>

            <TabsContent value="ap01" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>AP01 - Evolução da Dívida (Cenário Banco)</span>
                            <Badge variant="secondary">Cobrado</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AmortizationTable data={data.ap01 || []} title="Evolução Original" />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="ap02" className="mt-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>AP02 - Evolução Recalculada</span>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Devido</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AmortizationTable data={data.ap02 || []} title="Evolução Recalculada" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>AP03 - Diferenças Apuradas</span>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Comparativo</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AmortizationTable data={data.ap03 || []} title="Diferenças" />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="parametros" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Parâmetros do Cálculo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.parametros ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-500 mb-1">Série Bacen</p>
                                    <p className="font-mono font-medium">{data.parametros.serieBacen}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-500 mb-1">Taxa Utilizada</p>
                                    <p className="font-mono font-medium">{data.parametros.taxaUsada.toFixed(4)}% a.m.</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-500 mb-1">Data da Consulta</p>
                                    <p className="font-mono font-medium">{formatDate(data.parametros.dataConsulta)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-500 mb-1">Metodologia</p>
                                    <p className="font-medium">{data.parametros.metodologia}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                Parâmetros não disponíveis
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
