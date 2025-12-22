'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown, Printer, Share2 } from 'lucide-react';
import { KPICards, type KPIData } from './KPICards';
import { EvolutionChart, type EvolutionDataPoint } from './EvolutionChart';
import { ComparisonSummaryTable } from './ComparisonSummaryTable';
import { AppendicesTabs } from './AppendicesTabs';
import { PaymentReconciliationGrid, type PaymentRow } from '../reconciliation/PaymentReconciliationGrid';
import { toast } from 'sonner';
import { HelpExplainerModal } from '@/components/shared/HelpExplainerModal';

export interface ResultsDashboardData {
    kpis: KPIData;
    evolucao: EvolutionDataPoint[];
    conciliacao: PaymentRow[];
    appendices: {
        ap01?: any[];
        ap02?: any[];
        ap03?: any[];
        parametros?: {
            serieBacen: string;
            taxaUsada: number;
            dataConsulta: string;
            metodologia: string;
        };
    };
    cliente: {
        nome: string;
        contrato: string;
    };
    // Totais para tabela comparativa
    totais?: {
        totalPagoBanco: number;
        totalJurosBanco: number;
        totalPagoRecalculado: number;
        totalJurosRecalculado: number;
    };
}

interface ResultsDashboardProps {
    data: ResultsDashboardData;
    onBack?: () => void;
    onExportPDF?: () => void;
    onReconciliationChange?: (data: PaymentRow[]) => void;
    onRecalculate?: () => void;
    isLoading?: boolean;
}

export function ResultsDashboard({
    data,
    onBack,
    onExportPDF,
    onReconciliationChange,
    onRecalculate,
    isLoading = false,
}: ResultsDashboardProps) {
    const [activeTab, setActiveTab] = React.useState('resumo');
    const [conciliacaoData, setConciliacaoData] = React.useState(data.conciliacao);

    const handleConciliacaoChange = (newData: PaymentRow[]) => {
        setConciliacaoData(newData);
        onReconciliationChange?.(newData);
    };

    const handleExportPDF = () => {
        if (onExportPDF) {
            onExportPDF();
        } else {
            toast.info('Exportação de PDF será implementada com Edge Function');
        }
    };

    // Calcular sobretaxa
    const sobretaxa = data.kpis.taxaMercado > 0
        ? ((data.kpis.taxaPraticada - data.kpis.taxaMercado) / data.kpis.taxaMercado) * 100
        : 0;

    // Lógica de visualização: Projetado vs Realizado
    // Se houver qualquer parcela com status diferente de 'EM_ABERTO', assumimos modo "Realizado"
    // Caso contrário, mostramos o modo "Projetado" (todas as parcelas)
    const hasReconciliation = conciliacaoData.some(r => r.status !== 'EM_ABERTO');

    const rowsToConsider = hasReconciliation
        ? conciliacaoData.filter(r => ['PAGO', 'ATRASO', 'RENEGOCIADO'].includes(r.status))
        : conciliacaoData;

    // Totais Dinâmicos (inclui valorPagoReal + amortizacaoExtra)
    const dynamicTotalPagoBanco = rowsToConsider.reduce((sum, r) => sum + r.valorPagoReal + (r.amortizacaoExtra || 0), 0);
    const dynamicTotalAmortizacaoExtra = rowsToConsider.reduce((sum, r) => sum + (r.amortizacaoExtra || 0), 0);
    const dynamicTotalPagoRecalculado = data.kpis.novaParcelaValor * rowsToConsider.length;

    // Economias Dinâmicas
    const dynamicEconomiaTotal = dynamicTotalPagoBanco - dynamicTotalPagoRecalculado;
    const dynamicEconomiaParcela = data.kpis.parcelaOriginalValor - data.kpis.novaParcelaValor;

    // Estimar Juros (proporcional ao valor pago, mantendo a razão implícita original ou 40%)
    // Se tivermos os totais originais, calculamos a razão de juros
    const originalTotalPago = data.totais?.totalPagoBanco || (data.kpis.parcelaOriginalValor * conciliacaoData.length);
    const originalTotalJuros = data.totais?.totalJurosBanco || (originalTotalPago - 50000); // 50k estimativa de principal
    const jurosRatio = originalTotalPago > 0 ? (originalTotalJuros / originalTotalPago) : 0.4;

    const dynamicTotalJurosBanco = dynamicTotalPagoBanco * jurosRatio;
    const dynamicTotalJurosRecalculado = dynamicTotalPagoRecalculado * jurosRatio; // Assumindo mesma proporção para simplificação
    const dynamicEconomiaJuros = dynamicTotalJurosBanco - dynamicTotalJurosRecalculado;

    // Conteúdo do Resumo (Dashboard)
    const resumoContent = (
        <div className="space-y-6">
            <KPICards data={{
                ...data.kpis,
                economiaTotal: dynamicEconomiaTotal, // Atualiza KPI card principal também? Sim, para consistência.
                // Mas KPICards recebe data.kpis direto. Podemos fazer override ou deixar KPICards estático e só mudar a tabela.
                // O usuário pediu "status changes accurately reflect in the overall calculation results".
                // Então mudar o KPI Card também é bom.
                // Vou passar o objeto atualizado.
            }} />
            <EvolutionChart data={data.evolucao} />
            <ComparisonSummaryTable
                totalPagoBanco={dynamicTotalPagoBanco}
                totalJurosBanco={dynamicTotalJurosBanco}
                parcelaBanco={hasReconciliation ? (rowsToConsider.length > 0 ? dynamicTotalPagoBanco / rowsToConsider.length : 0) : data.kpis.parcelaOriginalValor}
                taxaContrato={data.kpis.taxaPraticada}
                totalPagoRecalculado={dynamicTotalPagoRecalculado}
                totalJurosRecalculado={dynamicTotalJurosRecalculado}
                parcelaRecalculada={data.kpis.novaParcelaValor}
                taxaMercado={data.kpis.taxaMercado}
                economiaTotal={dynamicEconomiaTotal}
                economiaJuros={dynamicEconomiaJuros}
                economiaParcela={dynamicEconomiaParcela}
                sobretaxaPercentual={sobretaxa}
            />
            {hasReconciliation && (
                <p className="text-xs text-slate-500 text-right italic">
                    * Exibindo valores conciliados ({rowsToConsider.length} parcelas)
                </p>
            )}
        </div>
    );

    // Conteúdo da Conciliação
    const conciliacaoContent = (
        <PaymentReconciliationGrid
            data={conciliacaoData}
            onDataChange={handleConciliacaoChange}
            onRecalculate={onRecalculate}
            isLoading={isLoading}
        />
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="border-b bg-white dark:bg-slate-800 sticky top-0 z-10">
                <div className="container max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {onBack && (
                                <Button variant="ghost" size="icon" onClick={onBack}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Resultado do Cálculo
                                    </h1>
                                    <HelpExplainerModal moduleType="CALCULO_REVISIONAL_GERAL" />
                                </div>
                                <p className="text-sm text-slate-500">
                                    {data.cliente.nome} • Contrato: {data.cliente.contrato}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                            </Button>
                            <Button variant="outline" size="sm">
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimir
                            </Button>
                            <Button size="sm" onClick={handleExportPDF}>
                                <FileDown className="h-4 w-4 mr-2" />
                                Exportar PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Resumo */}
                {resumoContent}

                {/* Conciliação */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4">Conciliação de Pagamentos</h2>
                    {conciliacaoContent}
                </div>

                {/* Apêndices */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4">Apêndices Técnicos</h2>
                    <AppendicesTabs
                        ap01={data.appendices?.ap01}
                        ap02={data.appendices?.ap02}
                        ap03={data.appendices?.ap03}
                        parametros={data.appendices?.parametros}
                    />
                </div>
            </div>
        </div>
    );
}
