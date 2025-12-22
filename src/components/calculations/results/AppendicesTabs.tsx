'use client';

import * as React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { FileText, GitCompare, DollarSign, Settings2 } from 'lucide-react';

interface ApendiceRow {
    mes: number;
    data: string;
    saldoAbertura?: number;
    saldoAnterior?: number;
    juros?: number;
    amortizacao?: number;
    parcelaTotal?: number;
    parcela?: number;
    saldoDevedor?: number;
    diferenca?: number;
    diferencaAcumulada?: number;
    override?: any;
}

interface AppendicesTabsProps {
    ap01?: ApendiceRow[];
    ap02?: ApendiceRow[];
    ap03?: ApendiceRow[];
    parametros?: {
        serieBacen?: string;
        taxaUsada?: number;
        dataConsulta?: string;
        metodologia?: string;
    };
}

function formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
        return dateStr;
    }
}

function AmortizationTable({ data, title }: { data: ApendiceRow[]; title: string }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-6 text-slate-500">
                Nenhum dado disponível
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Nº</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Vencimento</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Saldo Anterior</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Juros</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Amortização</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Parcela</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Saldo Devedor</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono text-slate-500">{row.mes}</td>
                            <td className="px-3 py-2 text-slate-600">{formatDate(row.data)}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatCurrency(row.saldoAbertura || row.saldoAnterior)}</td>
                            <td className="px-3 py-2 text-right font-mono text-orange-600">{formatCurrency(row.juros)}</td>
                            <td className="px-3 py-2 text-right font-mono text-blue-600">{formatCurrency(row.amortizacao)}</td>
                            <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(row.parcelaTotal || row.parcela)}</td>
                            <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(row.saldoDevedor)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DiferencasTable({ data }: { data: ApendiceRow[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-6 text-slate-500">
                Nenhum dado disponível
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Nº</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Vencimento</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Diferença Parcela</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-600">Diferença Acumulada</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono text-slate-500">{row.mes}</td>
                            <td className="px-3 py-2 text-slate-600">{formatDate(row.data)}</td>
                            <td className="px-3 py-2 text-right font-mono text-emerald-600">{formatCurrency(row.diferenca)}</td>
                            <td className="px-3 py-2 text-right font-mono font-medium text-emerald-700">{formatCurrency(row.diferencaAcumulada)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function AppendicesTabs({
    ap01,
    ap02,
    ap03,
    parametros,
}: AppendicesTabsProps) {
    return (
        <Accordion type="multiple" defaultValue={['ap01']} className="w-full space-y-3">
            {/* AP01 - Evolução Original */}
            <AccordionItem value="ap01" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-red-100 text-red-600">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium">AP01 - Evolução da Dívida (Cenário Banco)</div>
                            <div className="text-sm text-slate-500">{ap01?.length || 0} parcelas</div>
                        </div>
                        <Badge variant="outline" className="ml-auto mr-2 bg-red-50 text-red-700 border-red-200">
                            Cobrado
                        </Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <AmortizationTable data={ap01 || []} title="Evolução Original" />
                </AccordionContent>
            </AccordionItem>

            {/* AP02 - Evolução Recalculada */}
            <AccordionItem value="ap02" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-blue-100 text-blue-600">
                            <GitCompare className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium">AP02 - Evolução Recalculada</div>
                            <div className="text-sm text-slate-500">{ap02?.length || 0} parcelas</div>
                        </div>
                        <Badge variant="outline" className="ml-auto mr-2 bg-blue-50 text-blue-700 border-blue-200">
                            Devido
                        </Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <AmortizationTable data={ap02 || []} title="Evolução Recalculada" />
                </AccordionContent>
            </AccordionItem>

            {/* AP03 - Diferenças */}
            <AccordionItem value="ap03" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-emerald-100 text-emerald-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium">AP03 - Diferenças Apuradas</div>
                            <div className="text-sm text-slate-500">{ap03?.length || 0} parcelas</div>
                        </div>
                        <Badge variant="outline" className="ml-auto mr-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                            Indébito
                        </Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <DiferencasTable data={ap03 || []} />
                </AccordionContent>
            </AccordionItem>

            {/* Parâmetros */}
            <AccordionItem value="parametros" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-slate-100 text-slate-600">
                            <Settings2 className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium">Parâmetros do Cálculo</div>
                            <div className="text-sm text-slate-500">Metodologia e fontes utilizadas</div>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    {parametros ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500 mb-1">Série BACEN</p>
                                <p className="font-mono font-medium">{parametros.serieBacen || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500 mb-1">Taxa Utilizada</p>
                                <p className="font-mono font-medium">{parametros.taxaUsada?.toFixed(4) || 0}% a.m.</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500 mb-1">Data da Consulta</p>
                                <p className="font-mono font-medium">{formatDate(parametros.dataConsulta)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500 mb-1">Metodologia</p>
                                <p className="font-medium">{parametros.metodologia || 'N/A'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500">
                            Parâmetros não disponíveis
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
