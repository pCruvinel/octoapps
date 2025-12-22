'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    AlertTriangle, CheckCircle, XCircle, ArrowRight,
    TrendingDown, Download, Percent, Scale, FileText, Clock, Zap
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { ResultadoTriagem } from '@/schemas/triagemRapida.schema';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { TriagemTemplate } from '@/components/pdf-templates/TriagemTemplate';
import { useDocumentSettings } from '../pdf-engine/DocumentContext';
import { toast } from 'sonner';
import { HelpExplainerModal, type HelpModuleType } from '@/components/shared/HelpExplainerModal';

interface ResultadoViabilidadeProps {
    resultado: ResultadoTriagem;
    onIniciarCompleto: () => void;
    onNovoCalculo: () => void;
}

export function ResultadoViabilidade({
    resultado,
    onIniciarCompleto,
    onNovoCalculo
}: ResultadoViabilidadeProps) {
    const { settings } = useDocumentSettings();

    const handleExportPDF = async () => {
        try {
            toast.loading('Gerando dossiê...');
            const blob = await pdf(
                <TriagemTemplate data={resultado} settings={settings} />
            ).toBlob();

            saveAs(blob, `Dossie_Analise_${new Date().getTime()}.pdf`);
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
            iconColor: 'text-emerald-600',
            icon: CheckCircle,
            title: 'Viabilidade Alta',
            description: 'Forte indício de abusividade no contrato.'
        },
        ATENCAO: {
            iconColor: 'text-amber-600',
            icon: AlertTriangle,
            title: 'Análise Recomendada',
            description: 'Oportunidade de economia, mas requer cautela.'
        },
        INVIAVEL: {
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
                            <Badge variant={resultado.isAbusivo ? "destructive" : "secondary"} className="ml-1">
                                Score: {resultado.score}/100
                            </Badge>
                            <HelpExplainerModal moduleType="ANALISE_PREVIA_VEICULOS" />
                        </div>
                        <p className="text-slate-500 max-w-xl text-lg leading-relaxed mt-2">{config.description}</p>
                    </div>
                </div>

                {/* Key KPI - Total Economy */}
                <div className="text-right hidden md:block pt-1">
                    <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Economia Potencial</span>
                    <div className="text-3xl font-bold text-emerald-700 mt-1">
                        {formatCurrency(resultado.economiaTotal)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Tables */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Comparativo de Economia */}
                    <Card className="shadow-none border border-slate-200">
                        <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-slate-400" />
                                Composição da Economia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[200px]">Componente</TableHead>
                                        <TableHead className="text-right">Valor Estimado</TableHead>
                                        <TableHead className="text-center">Observação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">Economia em Juros</TableCell>
                                        <TableCell className="p-3 text-right font-semibold text-emerald-700">{formatCurrency(resultado.economiaJuros)}</TableCell>
                                        <TableCell className="p-3 text-center text-xs text-slate-500">Recálculo pela taxa média</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">Restituição de Tarifas</TableCell>
                                        <TableCell className="p-3 text-right font-semibold text-slate-700">{formatCurrency(resultado.economiaTarifas)}</TableCell>
                                        <TableCell className="p-3 text-center text-xs text-slate-500">Venda casada (se aplicável)</TableCell>
                                    </TableRow>
                                    <TableRow className="border-t-2 border-slate-100 bg-emerald-50/20">
                                        <TableCell className="p-3 font-bold text-slate-900">Total Economia</TableCell>
                                        <TableCell className="p-3 text-right font-bold text-emerald-600 text-lg">{formatCurrency(resultado.economiaTotal)}</TableCell>
                                        <TableCell className="p-3 text-center">
                                            <Badge variant="outline" className="text-emerald-600 border-emerald-200">Projeção</Badge>
                                        </TableCell>
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
                                        <TableHead className="text-center text-slate-600">Taxa Praticada</TableHead>
                                        <TableHead className="text-center text-emerald-700 bg-emerald-50/10">Média de Mercado</TableHead>
                                        <TableHead className="text-center text-slate-700">Diferença</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">Taxa Mensal (a.m.)</TableCell>
                                        <TableCell className="p-3 text-center text-slate-700 font-medium">
                                            {formatPercent(resultado.taxaContratoAnual / 12)}
                                        </TableCell>
                                        <TableCell className="p-3 text-center text-emerald-700 font-medium bg-emerald-50/10">
                                            {formatPercent(resultado.taxaMercadoAnual / 12)}
                                        </TableCell>
                                        <TableCell className="p-3 text-center">
                                            <span className={`font-bold ${resultado.taxaContratoAnual > resultado.taxaMercadoAnual ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {resultado.taxaContratoAnual > resultado.taxaMercadoAnual ? '+' : ''}
                                                {formatPercent((resultado.taxaContratoAnual - resultado.taxaMercadoAnual) / 12)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="p-3 font-medium text-slate-600">Taxa Anual (a.a.)</TableCell>
                                        <TableCell className="p-3 text-center text-slate-700 font-medium">
                                            {formatPercent(resultado.taxaContratoAnual)}
                                        </TableCell>
                                        <TableCell className="p-3 text-center text-emerald-700 font-medium bg-emerald-50/10">
                                            {formatPercent(resultado.taxaMercadoAnual)}
                                        </TableCell>
                                        <TableCell className="p-3 text-center">
                                            <span className={`font-bold ${resultado.taxaContratoAnual > resultado.taxaMercadoAnual ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {resultado.taxaContratoAnual > resultado.taxaMercadoAnual ? '+' : ''}
                                                {formatPercent(resultado.taxaContratoAnual - resultado.taxaMercadoAnual)}
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

                    {/* Comparativo de Prestações (se disponível) */}
                    {resultado.prestacaoOriginal && resultado.prestacaoRevisada && (
                        <Card className="shadow-none border border-slate-200">
                            <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-slate-400" />
                                    Comparativo de Prestações
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Prestação Atual</span>
                                    <span className="font-semibold text-slate-700">{formatCurrency(resultado.prestacaoOriginal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-600">Nova Prestação</span>
                                    <span className="font-semibold text-slate-700">{formatCurrency(resultado.prestacaoRevisada)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <span className="text-xs font-medium text-slate-600">Economia Mensal</span>
                                    <span className="font-bold text-slate-900 text-lg">
                                        {formatCurrency(resultado.diferencaPrestacao || 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - KPIs & Details */}
                <div className="space-y-6">
                    <Card className="shadow-none border border-slate-200 text-center p-6 bg-slate-50/30">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Sobretaxa Encontrada</p>
                        <div className="text-4xl font-bold text-slate-900 tracking-tighter">
                            +{(resultado.sobretaxaPercentual * 100).toFixed(2)}%
                        </div>
                        <p className="text-xs text-slate-500 mt-2">acima da média de mercado</p>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <Badge variant={resultado.isAbusivo ? "destructive" : "secondary"} className="w-full justify-center py-1">
                                {resultado.isAbusivo ? 'Taxa Potencialmente Abusiva' : 'Taxa Dentro do Esperado'}
                            </Badge>
                        </div>
                    </Card>


                    {/* Alerta de Capitalização Diária */}
                    {resultado.capitalizacaoDiariaDetectada && (
                        <Card className="shadow-none border-2 border-red-300 bg-red-50">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-100 rounded-full">
                                        <Zap className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-red-800 text-sm">
                                            Capitalização Diária Detectada
                                        </h4>
                                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                                            {resultado.evidenciaCapitalizacao}
                                        </p>
                                        <Badge variant="destructive" className="mt-2 text-xs">
                                            Irregularidade Confirmada
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Informação de Carência */}
                    {resultado.carenciaDetectada && (
                        <Card className="shadow-none border border-amber-200 bg-amber-50/30">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-100 rounded-full">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-amber-800 text-sm">
                                            Período de Carência
                                        </h4>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-600">Dias de carência:</span>
                                                <span className="font-medium text-amber-700">{resultado.diasCarencia} dias</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-600">Juros incorporados:</span>
                                                <span className="font-medium text-amber-700">{formatCurrency(resultado.jurosCarencia || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recomendação */}
                    <Card className="shadow-none border border-slate-200">
                        <CardHeader className="px-6 py-4 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                Recomendação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-sm text-slate-600 italic leading-relaxed">
                                "{resultado.recomendacao}"
                            </p>
                        </CardContent>
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

            <p className="text-center text-[10px] text-slate-400 uppercase tracking-wider">
                * Estimativa baseada em jurisprudência (Tema 234 STJ)
            </p>
        </div>
    );
}
