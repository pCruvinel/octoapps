'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    AlertTriangle, CheckCircle, XCircle, ArrowRight,
    Scale, Download, FileText, Percent
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { TriagemImobiliarioTemplate } from '@/components/pdf-templates/TriagemImobiliarioTemplate';
import { useDocumentSettings } from '../pdf-engine/DocumentContext';
import { toast } from 'sonner';

export interface ResultadoImobiliarioType {
    classificacao: 'VIAVEL' | 'ATENCAO' | 'INVIAVEL';
    isAbusivo: boolean;

    // Taxas
    taxaContratoMensal: number;
    taxaContratoAnual: number;
    taxaMercadoMensal: number;
    taxaMercadoAnual: number;
    sobretaxaPercent: number;

    // Cenário A: Contrato Original
    cenarioContrato: {
        totalPago: number;
        totalJuros: number;
        primeiraParcela: number;
        ultimaParcela: number;
    };

    // Cenário B: Taxa Média de Mercado
    cenarioTaxaMedia: {
        totalPago: number;
        totalJuros: number;
        primeiraParcela: number;
        ultimaParcela: number;
        economia: number;
    };

    // Cenário C: Juros Simples (MAGIS/Gauss)
    cenarioJurosSimples: {
        totalPago: number;
        totalJuros: number;
        primeiraParcela: number;
        ultimaParcela: number;
        parcelaMedia: number;
        economia: number;
    };

    // Dados de referência
    dadosContrato: {
        valorFinanciado: number;
        prazoMeses: number;
        sistema: string;
        indexador: string;
        segurosTotal: number;
    };
}

interface ResultadoImobiliarioProps {
    resultado: ResultadoImobiliarioType;
    onIniciarCompleto: () => void;
    onNovoCalculo: () => void;
}

export function ResultadoImobiliario({
    resultado,
    onIniciarCompleto,
    onNovoCalculo
}: ResultadoImobiliarioProps) {
    const { settings } = useDocumentSettings();

    const handleExportPDF = async () => {
        try {
            toast.loading('Gerando dossiê atualizado...');
            const blob = await pdf(
                <TriagemImobiliarioTemplate data={resultado} settings={settings} />
            ).toBlob();

            saveAs(blob, `Dossie_Imobiliario_${new Date().getTime()}.pdf`);
            toast.dismiss();
            toast.success('Dossiê baixado com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.dismiss();
            toast.error('Erro na geração do PDF');
        }
    };

    // Configuração visual discreta e profissional
    const config = {
        VIAVEL: {
            borderColor: 'border-l-emerald-600',
            iconColor: 'text-emerald-600',
            icon: CheckCircle,
            title: 'Viabilidade Alta',
            description: 'Forte indício de abusividade no contrato.'
        },
        ATENCAO: {
            borderColor: 'border-l-amber-600',
            iconColor: 'text-amber-600',
            icon: AlertTriangle,
            title: 'Análise Recomendada',
            description: 'Oportunidade de economia, mas requer cautela.'
        },
        INVIAVEL: {
            borderColor: 'border-l-red-600',
            iconColor: 'text-red-600',
            icon: XCircle,
            title: 'Baixa Viabilidade',
            description: 'Taxa próxima ao mercado ou economia irrelevante.'
        }
    }[resultado.classificacao];

    const Icon = config.icon;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header: Design Limpo */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between pb-4 pt-4">
                <div className="flex gap-5 items-start">
                    <div className={`p-3 rounded-full bg-slate-50 border border-slate-100 ${config.iconColor}`}>
                        <Icon className="w-8 h-8" />
                    </div>
                    <div className="pt-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{config.title}</h2>
                            {resultado.isAbusivo && <Badge variant="destructive">Abusivo</Badge>}
                        </div>
                        <p className="text-slate-500 max-w-xl text-lg leading-relaxed mt-2">{config.description}</p>
                    </div>
                </div>

                {/* Key KPI - Total Economy */}
                <div className="text-right hidden md:block pt-1">
                    <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Economia Potencial</span>
                    <div className="text-3xl font-bold text-slate-900 mt-1">
                        {formatCurrency(resultado.cenarioJurosSimples.economia)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Table */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Cenários */}
                    <Card className="shadow-none border border-slate-200">
                        <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-slate-400" />
                                Comparativo de Cenários
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[180px]">Indicador</TableHead>
                                        <TableHead className="text-center text-slate-500 font-normal">Contrato</TableHead>
                                        <TableHead className="text-center font-bold text-emerald-700 bg-emerald-50/10">Taxa Mercado (A)</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700 bg-slate-50/50">Juros Simples (B)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">Total a Pagar</TableCell>
                                        <TableCell className="p-3 text-center text-slate-500">{formatCurrency(resultado.cenarioContrato.totalPago)}</TableCell>
                                        <TableCell className="p-3 text-center font-semibold text-emerald-700 bg-emerald-50/10">{formatCurrency(resultado.cenarioTaxaMedia.totalPago)}</TableCell>
                                        <TableCell className="p-3 text-center font-semibold text-slate-900 bg-slate-50/50">{formatCurrency(resultado.cenarioJurosSimples.totalPago)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">Total de Juros</TableCell>
                                        <TableCell className="p-3 text-center text-slate-500">{formatCurrency(resultado.cenarioContrato.totalJuros)}</TableCell>
                                        <TableCell className="p-3 text-center text-emerald-600/80 bg-emerald-50/10">{formatCurrency(resultado.cenarioTaxaMedia.totalJuros)}</TableCell>
                                        <TableCell className="p-3 text-center text-slate-600 bg-slate-50/50">{formatCurrency(resultado.cenarioJurosSimples.totalJuros)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">1ª Parcela</TableCell>
                                        <TableCell className="p-3 text-center text-slate-500">{formatCurrency(resultado.cenarioContrato.primeiraParcela)}</TableCell>
                                        <TableCell className="p-3 text-center text-emerald-600/80 bg-emerald-50/10">{formatCurrency(resultado.cenarioTaxaMedia.primeiraParcela)}</TableCell>
                                        <TableCell className="p-3 text-center text-slate-600 bg-slate-50/50">{formatCurrency(resultado.cenarioJurosSimples.parcelaMedia)}</TableCell>
                                    </TableRow>
                                    <TableRow className="border-t-2 border-slate-100">
                                        <TableCell className="p-3 font-bold text-slate-900">Economia Estimada</TableCell>
                                        <TableCell className="p-3 text-center text-slate-300">-</TableCell>
                                        <TableCell className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/10">{formatCurrency(resultado.cenarioTaxaMedia.economia)}</TableCell>
                                        <TableCell className="p-3 text-center font-bold text-slate-900 bg-slate-50/50">{formatCurrency(resultado.cenarioJurosSimples.economia)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Detalhamento de Taxas */}
                    <Card className="shadow-none border border-slate-200">
                        <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Percent className="w-4 h-4 text-slate-400" />
                                Análise de Taxas de Juros
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[200px]">Tipo de Taxa</TableHead>
                                        <TableHead className="text-center text-slate-600">Taxa Praticada (Contrato)</TableHead>
                                        <TableHead className="text-center text-emerald-700 bg-emerald-50/10">Média de Mercado (BACEN)</TableHead>
                                        <TableHead className="text-center text-slate-700">Diferença</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">Taxa Mensal</TableCell>
                                        <TableCell className="p-3 text-center text-slate-700 font-medium">
                                            {formatPercent(resultado.taxaContratoMensal / 100)} a.m.
                                        </TableCell>
                                        <TableCell className="p-3 text-center text-emerald-700 font-medium bg-emerald-50/10">
                                            {formatPercent(resultado.taxaMercadoMensal / 100)} a.m.
                                        </TableCell>
                                        <TableCell className="p-3 text-center flex justify-center items-center gap-1">
                                            <span className={`${resultado.taxaContratoMensal > resultado.taxaMercadoMensal ? 'text-red-500 font-bold' : 'text-emerald-500'}`}>
                                                {resultado.taxaContratoMensal > resultado.taxaMercadoMensal ? '+' : ''}
                                                {formatPercent((resultado.taxaContratoMensal - resultado.taxaMercadoMensal) / 100)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">Taxa Anual</TableCell>
                                        <TableCell className="p-3 text-center text-slate-700 font-medium">
                                            {formatPercent(resultado.taxaContratoAnual / 100)} a.a.
                                        </TableCell>
                                        <TableCell className="p-3 text-center text-emerald-700 font-medium bg-emerald-50/10">
                                            {formatPercent(resultado.taxaMercadoAnual / 100)} a.a.
                                        </TableCell>
                                        <TableCell className="p-3 text-center flex justify-center items-center gap-1">
                                            <span className={`${resultado.taxaContratoAnual > resultado.taxaMercadoAnual ? 'text-red-500 font-bold' : 'text-emerald-500'}`}>
                                                {resultado.taxaContratoAnual > resultado.taxaMercadoAnual ? '+' : ''}
                                                {formatPercent((resultado.taxaContratoAnual - resultado.taxaMercadoAnual) / 100)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <div className="p-4 bg-slate-50/50 text-xs text-slate-500 border-t border-slate-100 text-center">
                                A taxa média de mercado é obtida através da série histórica do Banco Central do Brasil para a data da contratação.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Contract Details & Rates */}
                <div className="space-y-6">
                    <Card className="shadow-none border border-slate-200">
                        <CardHeader className="px-6 py-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-slate-700">Dados do Contrato</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Valor Financiado</span>
                                <span className="font-medium text-slate-900">{formatCurrency(resultado.dadosContrato.valorFinanciado)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Prazo</span>
                                <span className="font-medium text-slate-900">{resultado.dadosContrato.prazoMeses} meses</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Sistema</span>
                                <span className="font-medium text-slate-900">{resultado.dadosContrato.sistema}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Indexador</span>
                                <span className="font-medium text-slate-900">{resultado.dadosContrato.indexador}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border border-slate-200 text-center p-6 bg-slate-50/30">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Sobretaxa Encontrada</p>
                        <div className="text-4xl font-bold text-slate-900 tracking-tighter">
                            +{resultado.sobretaxaPercent.toFixed(2)}%
                        </div>
                        <p className="text-xs text-slate-500 mt-2">acima da média de mercado</p>
                    </Card>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 pb-6">
                <Button size="lg" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" onClick={onIniciarCompleto}>
                    Iniciar Perícia Completa
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={handleExportPDF}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Dossiê PDF
                </Button>
                <Button size="lg" variant="ghost" className="text-slate-500" onClick={onNovoCalculo}>
                    Nova Simulação
                </Button>
            </div>
        </div>
    );
}
