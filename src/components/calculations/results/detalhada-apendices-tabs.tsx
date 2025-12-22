'use client';

import * as React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, GitCompare, DollarSign, Settings2, Scale, Calculator, CheckCircle2, Clock, CalendarClock, AlertTriangle } from 'lucide-react';
import type { LinhaAmortizacaoDetalhada, ApendiceResult, SituacaoParcela } from '@/types/calculation.types';

interface DetalhadaApendicesTabsProps {
    ap01?: LinhaAmortizacaoDetalhada[];
    ap02?: LinhaAmortizacaoDetalhada[];
    ap03?: LinhaAmortizacaoDetalhada[];
    ap04?: LinhaAmortizacaoDetalhada[];
    ap05?: LinhaAmortizacaoDetalhada[];
    ap04Descricao?: string;
    ap05Descricao?: string;
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

// Badge de situação da parcela
function SituacaoBadge({ situacao }: { situacao?: SituacaoParcela }) {
    if (!situacao) return null;

    const config = {
        PAGA: { label: 'Paga', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        VENCIDA: { label: 'Vencida', color: 'bg-red-100 text-red-700 border-red-200', icon: Clock },
        VINCENDA: { label: 'Vincenda', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CalendarClock },
    };

    const { label, color, icon: Icon } = config[situacao];

    return (
        <Badge variant="outline" className={`${color} text-xs px-1.5 py-0.5`}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
        </Badge>
    );
}

// Tabela AP01 com campos XTIR
function AP01Table({ data }: { data: LinhaAmortizacaoDetalhada[] }) {
    if (!data || data.length === 0) {
        return <div className="text-center py-6 text-slate-500">Nenhum dado disponível</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-2 py-2 text-left font-medium text-slate-600">Nº</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-600">Vencimento</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Saldo Anterior</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Juros</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Amortização</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Parcela</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Saldo Devedor</th>
                        <th className="px-2 py-2 text-center font-medium text-slate-600">Dias</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Fator NP</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-2 py-2 font-mono text-slate-500">{row.mes}</td>
                            <td className="px-2 py-2 text-slate-600">{formatDate(row.data)}</td>
                            <td className="px-2 py-2 text-right font-mono">{formatCurrency(row.saldoAbertura)}</td>
                            <td className="px-2 py-2 text-right font-mono text-orange-600">{formatCurrency(row.juros)}</td>
                            <td className="px-2 py-2 text-right font-mono text-blue-600">{formatCurrency(row.amortizacao)}</td>
                            <td className="px-2 py-2 text-right font-mono font-medium">{formatCurrency(row.parcelaTotal)}</td>
                            <td className="px-2 py-2 text-right font-mono font-medium">{formatCurrency(row.saldoDevedor)}</td>
                            <td className="px-2 py-2 text-center font-mono text-slate-500">{row.diasEntreParcelas || 30}</td>
                            <td className="px-2 py-2 text-right font-mono text-slate-500">{row.fatorNaoPeriodico?.toFixed(6) || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Tabela AP02 - Evolução Recalculada
function AP02Table({ data }: { data: LinhaAmortizacaoDetalhada[] }) {
    if (!data || data.length === 0) {
        return <div className="text-center py-6 text-slate-500">Nenhum dado disponível</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-2 py-2 text-left font-medium text-slate-600">Nº</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-600">Vencimento</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Saldo Anterior</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Juros</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Amortização</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Prestação Devida</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Saldo Devedor</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-2 py-2 font-mono text-slate-500">{row.mes}</td>
                            <td className="px-2 py-2 text-slate-600">{formatDate(row.data)}</td>
                            <td className="px-2 py-2 text-right font-mono">{formatCurrency(row.saldoAbertura)}</td>
                            <td className="px-2 py-2 text-right font-mono text-blue-600">{formatCurrency(row.juros)}</td>
                            <td className="px-2 py-2 text-right font-mono text-blue-600">{formatCurrency(row.amortizacao)}</td>
                            <td className="px-2 py-2 text-right font-mono font-medium text-blue-700">{formatCurrency(row.parcelaTotal)}</td>
                            <td className="px-2 py-2 text-right font-mono font-medium">{formatCurrency(row.saldoDevedor)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Tabela AP03 - Diferenças com situação e correção INPC
function AP03Table({
    data,
    parametros
}: {
    data: LinhaAmortizacaoDetalhada[];
    parametros?: {
        inpcCorrection?: number;
        inpcAccumulated?: number;
        correctionDate?: string;
    };
}) {
    if (!data || data.length === 0) {
        return <div className="text-center py-6 text-slate-500">Nenhum dado disponível</div>;
    }

    // Calculate nominal refund total (last row accumulated difference)
    const nominalTotal = data[data.length - 1]?.diferencaAcumulada || 0;
    const hasINPCCorrection = parametros?.inpcCorrection && parametros.inpcCorrection > 0;

    return (
        <div className="space-y-4">
            {/* Main differences table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-2 py-2 text-left font-medium text-slate-600">Nº</th>
                            <th className="px-2 py-2 text-left font-medium text-slate-600">Vencimento</th>
                            <th className="px-2 py-2 text-center font-medium text-slate-600">Situação</th>
                            <th className="px-2 py-2 text-right font-medium text-slate-600">Valor Pago</th>
                            <th className="px-2 py-2 text-right font-medium text-slate-600">Valor Devido</th>
                            <th className="px-2 py-2 text-right font-medium text-slate-600">Diferença</th>
                            <th className="px-2 py-2 text-right font-medium text-slate-600">Dif. Acumulada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-2 py-2 font-mono text-slate-500">{row.mes}</td>
                                <td className="px-2 py-2 text-slate-600">{formatDate(row.data)}</td>
                                <td className="px-2 py-2 text-center"><SituacaoBadge situacao={row.situacao} /></td>
                                <td className="px-2 py-2 text-right font-mono text-red-600">{formatCurrency(row.valorPago)}</td>
                                <td className="px-2 py-2 text-right font-mono text-blue-600">{formatCurrency(row.valorDevido)}</td>
                                <td className="px-2 py-2 text-right font-mono text-emerald-600">{formatCurrency(row.diferenca)}</td>
                                <td className="px-2 py-2 text-right font-mono font-medium text-emerald-700">{formatCurrency(row.diferencaAcumulada)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* INPC Monetary Correction Summary */}
            {hasINPCCorrection && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Atualização Monetária (INPC)</h4>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                        Art. 389 CC
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-xs">Código Civil Art. 389: Não cumprida a obrigação, responde o devedor por perdas e danos, mais juros e atualização monetária.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Nominal Value */}
                        <div className="bg-white rounded-md p-3 border border-blue-100">
                            <div className="text-xs text-slate-500 mb-1">Indébito Nominal</div>
                            <div className="text-lg font-bold text-slate-700">{formatCurrency(nominalTotal)}</div>
                            <div className="text-xs text-slate-400 mt-1">Valor histórico sem correção</div>
                        </div>

                        {/* INPC Corrected Value */}
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md p-3 text-white shadow-md">
                            <div className="text-xs text-blue-100 mb-1 flex items-center gap-1">
                                <Calculator className="h-3 w-3" />
                                Valor Atualizado (INPC)
                            </div>
                            <div className="text-2xl font-bold">{formatCurrency(parametros.inpcCorrection)}</div>
                            <div className="text-xs text-blue-100 mt-1 flex items-center gap-1">
                                <Badge variant="outline" className="bg-blue-600 text-white border-blue-400 text-xs px-1 py-0">
                                    +{((parametros.inpcAccumulated || 0) * 100).toFixed(2)}%
                                </Badge>
                                INPC acumulado
                            </div>
                        </div>

                        {/* Gain from Correction */}
                        <div className="bg-white rounded-md p-3 border border-emerald-200">
                            <div className="text-xs text-slate-500 mb-1">Ganho pela Correção</div>
                            <div className="text-lg font-bold text-emerald-700">
                                {formatCurrency((parametros.inpcCorrection || 0) - nominalTotal)}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                Diferença nominal vs. corrigido
                            </div>
                        </div>
                    </div>

                    {/* Reference Date */}
                    {parametros.correctionDate && (
                        <div className="mt-3 text-xs text-slate-600 text-center bg-white/50 rounded py-1">
                            Data de referência: <span className="font-medium">{formatDate(parametros.correctionDate)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Tabela AP04/AP05 - Compensação com saldo credor
function CompensacaoTable({ data, isDobro }: { data: LinhaAmortizacaoDetalhada[]; isDobro: boolean }) {
    if (!data || data.length === 0) {
        return <div className="text-center py-6 text-slate-500">Nenhum dado disponível</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-2 py-2 text-left font-medium text-slate-600">Nº</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-600">Venc.</th>
                        <th className="px-2 py-2 text-center font-medium text-slate-600">Situação</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Pago</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Devido</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">{isDobro ? 'Dif. (2x)' : 'Diferença'}</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Juros</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Amort. Comp.</th>
                        <th className="px-2 py-2 text-right font-medium text-slate-600">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => {
                        const saldoCompensado = row.saldoDevedorCompensado ?? row.saldoDevedor ?? 0;
                        const isNegativo = saldoCompensado < 0;
                        const isQuitacao = row.quitacaoAntecipada;

                        return (
                            <tr
                                key={index}
                                className={`border-b border-slate-100 hover:bg-slate-50 ${isQuitacao ? 'bg-emerald-50' : ''}`}
                            >
                                <td className="px-2 py-1.5 font-mono text-slate-500">{row.mes}</td>
                                <td className="px-2 py-1.5 text-slate-600 text-xs">{formatDate(row.data)}</td>
                                <td className="px-2 py-1.5 text-center"><SituacaoBadge situacao={row.situacao} /></td>
                                <td className="px-2 py-1.5 text-right font-mono text-xs">{formatCurrency(row.valorPago)}</td>
                                <td className="px-2 py-1.5 text-right font-mono text-xs text-blue-600">{formatCurrency(row.valorDevido)}</td>
                                <td className="px-2 py-1.5 text-right font-mono text-xs text-emerald-600">{formatCurrency(row.diferenca)}</td>
                                <td className="px-2 py-1.5 text-right font-mono text-xs text-orange-600">{formatCurrency(row.juros)}</td>
                                <td className="px-2 py-1.5 text-right font-mono text-xs text-purple-600">{formatCurrency(row.amortizacaoCompensada)}</td>
                                <td className={`px-2 py-1.5 text-right font-mono text-xs font-medium ${isNegativo ? 'text-emerald-700' : ''}`}>
                                    {isNegativo ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <span className="flex items-center justify-end gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {formatCurrency(row.saldoCredor)} CR
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Saldo Credor ao Cliente</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        formatCurrency(Math.max(0, saldoCompensado))
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function DetalhadaApendicesTabs({
    ap01,
    ap02,
    ap03,
    ap04,
    ap05,
    ap04Descricao,
    ap05Descricao,
    parametros,
}: DetalhadaApendicesTabsProps) {
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
                            <div className="font-medium">AP01 - Evolução Original (Cenário Banco)</div>
                            <div className="text-sm text-slate-500">{ap01?.length || 0} parcelas | Taxa Pactuada</div>
                        </div>
                        <Badge variant="outline" className="ml-auto mr-2 bg-red-50 text-red-700 border-red-200">
                            Cobrado
                        </Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <AP01Table data={ap01 || []} />
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
                            <div className="font-medium">AP02 - Recálculo (Taxa Média BACEN)</div>
                            <div className="text-sm text-slate-500">{ap02?.length || 0} parcelas | Expurgo de Tarifas</div>
                        </div>
                        <Badge variant="outline" className="ml-auto mr-2 bg-blue-50 text-blue-700 border-blue-200">
                            Devido
                        </Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <AP02Table data={ap02 || []} />
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
                            <div className="font-medium">AP03 - Demonstrativo das Diferenças Excedentes</div>
                            <div className="text-sm text-slate-500">{ap03?.length || 0} parcelas | Situação por Parcela</div>
                        </div>
                        <Badge variant="outline" className="ml-auto mr-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                            Indébito
                        </Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <AP03Table data={ap03 || []} parametros={parametros} />
                </AccordionContent>
            </AccordionItem>

            {/* AP04 - Restituição em Dobro */}
            {ap04 && ap04.length > 0 && (
                <AccordionItem value="ap04" className="border rounded-lg border-purple-200">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-purple-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-purple-100 text-purple-600">
                                <Scale className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium">AP04 - Restituição em Dobro (Art. 42 CDC)</div>
                                <div className="text-sm text-slate-500">{ap04Descricao || 'Compensação mensal em dobro no saldo'}</div>
                            </div>
                            <Badge variant="outline" className="ml-auto mr-2 bg-purple-50 text-purple-700 border-purple-200">
                                2x CDC
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        <CompensacaoTable data={ap04} isDobro={true} />
                    </AccordionContent>
                </AccordionItem>
            )}

            {/* AP05 - Restituição Simples */}
            {ap05 && ap05.length > 0 && (
                <AccordionItem value="ap05" className="border rounded-lg border-amber-200">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-amber-100 text-amber-600">
                                <Calculator className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium">AP05 - Restituição Simples (Art. 368 CC)</div>
                                <div className="text-sm text-slate-500">{ap05Descricao || 'Real Saldo Devedor após compensações'}</div>
                            </div>
                            <Badge variant="outline" className="ml-auto mr-2 bg-amber-50 text-amber-700 border-amber-200">
                                Simples
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        <CompensacaoTable data={ap05} isDobro={false} />
                    </AccordionContent>
                </AccordionItem>
            )}

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
