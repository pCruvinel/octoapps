'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown, Printer, Share2 } from 'lucide-react';
import { KPICards, type KPIData } from './KPICards';
import { EvolutionChart, type EvolutionDataPoint } from './EvolutionChart';
import { AppendicesTabs } from './AppendicesTabs';
import { PaymentReconciliationGrid, type PaymentRow } from '../reconciliation/PaymentReconciliationGrid';
import { toast } from 'sonner';

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

    // Conteúdo do Resumo (Dashboard)
    const resumoContent = (
        <div className="space-y-6">
            <KPICards data={data.kpis} />
            <EvolutionChart data={data.evolucao} />
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
                                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    Resultado do Cálculo
                                </h1>
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
            <div className="container max-w-7xl mx-auto px-4 py-6">
                <AppendicesTabs
                    data={data.appendices}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    resumoContent={resumoContent}
                    conciliacaoContent={conciliacaoContent}
                />
            </div>
        </div>
    );
}
