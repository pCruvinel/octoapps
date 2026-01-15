import React from 'react';
import { UserDocumentSettings } from '../pdf-engine/DocumentTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PDFViewer } from '@react-pdf/renderer';
import { DetalhadaAnalisePdf } from '../pdf-templates/detalhada-analise-pdf';
import { mockFormData, mockResultado, mockDashboard } from './mockData';

interface PdfPreviewPanelProps {
    settings: UserDocumentSettings;
}

export const PdfPreviewPanel = ({ settings }: PdfPreviewPanelProps) => {
    const [mode, setMode] = React.useState<'html' | 'pdf'>('html');

    // A4 Aspect Ratio is 1:1.414 (210mm x 297mm)
    return (
        <Card className="sticky top-6">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pré-visualização</CardTitle>
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-[120px]">
                    <TabsList className="grid w-full grid-cols-2 h-7 p-0.5">
                        <TabsTrigger value="html" className="text-xs py-1">HTML</TabsTrigger>
                        <TabsTrigger value="pdf" className="text-xs py-1">PDF</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                {mode === 'html' ? (
                    <div
                        className="relative w-full bg-white shadow-md border mx-auto overflow-hidden text-[8px] leading-relaxed select-none"
                        style={{
                            aspectRatio: '210/297',
                            color: settings.text_color || '#0f172a'
                        }}
                    >
                        {/* Watermark Layer */}
                        {settings.watermark_url && (
                            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                <img
                                    src={settings.watermark_url}
                                    alt="Watermark"
                                    style={{
                                        width: `${(settings.watermark_scale || 0.5) * 100}%`,
                                        opacity: settings.watermark_opacity || 0.15,
                                        transform: 'rotate(-45deg)',
                                    }}
                                />
                            </div>
                        )}

                        {/* Content Layer */}
                        <div className="relative z-10 p-6 flex flex-col h-full justify-between">

                            {/* Header - Timbre Layout */}
                            <div className="grid grid-cols-3 items-center mb-6 border-b pb-2 gap-1">
                                {/* Left: Logo */}
                                <div className="flex items-center">
                                    {settings.logo_url ? (
                                        <img src={settings.logo_url} alt="Logo" className="h-6 object-contain" />
                                    ) : (
                                        <div style={{ color: settings.primary_color, fontWeight: 'bold', fontSize: '8px' }}>LOGO</div>
                                    )}
                                </div>

                                {/* Center: Timbre (Company Name/CNPJ) */}
                                <div className="text-center">
                                    {settings.header_text ? (
                                        <div className="font-bold text-[7px] uppercase leading-tight" style={{ color: settings.secondary_color || '#64748b' }}>
                                            {settings.header_text}
                                        </div>
                                    ) : (
                                        <div className="text-[6px] text-gray-300 uppercase">Timbre</div>
                                    )}
                                </div>

                                {/* Right: Date */}
                                <div className="text-[6px] text-gray-400 text-right">
                                    {new Date().toLocaleDateString('pt-BR')}
                                </div>
                            </div>

                            {/* Body mockup */}
                            <div className="flex-1 space-y-4">
                                <h1
                                    className="font-bold border-b pb-1 mb-2 uppercase"
                                    style={{
                                        color: settings.heading_color || '#334155',
                                        borderColor: settings.table_border_color || '#e2e8f0'
                                    }}
                                >
                                    Relatório Analítico
                                </h1>

                                <div className="space-y-2 text-justify opacity-80">
                                    <p>Este documento apresenta a análise técnica revisional elaborada conforme parâmetros selecionados.</p>
                                </div>

                                {/* Mock Table */}
                                <div className="mt-4 border rounded overflow-hidden"
                                    style={{ borderColor: settings.table_border_color || '#e2e8f0' }}>
                                    <div
                                        className="grid grid-cols-3 p-1 font-bold"
                                        style={{ backgroundColor: settings.table_header_bg || '#f1f5f9' }}
                                    >
                                        <span>Descrição</span>
                                        <span className="text-center">Ref.</span>
                                        <span className="text-right">Valor</span>
                                    </div>
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="grid grid-cols-3 p-1 border-t"
                                            style={{ borderColor: settings.table_border_color || '#e2e8f0' }}
                                        >
                                            <span>Item Exemplo {i}</span>
                                            <span className="text-center">00{i}</span>
                                            <span className="text-right">R$ 1.000,00</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Color Demo */}
                                <div className="mt-4 p-2 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid', borderColor: settings.table_border_color || '#e2e8f0' }}>
                                    <h2 className="font-bold mb-1" style={{ color: settings.heading_color || '#334155' }}>Resumo Financeiro</h2>
                                    <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                                        <span style={{ color: settings.secondary_color || '#64748b' }}>Total Apurado</span>
                                        <span className="font-bold" style={{ color: settings.primary_color || '#000' }}>R$ 15.420,00</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-2 border-t text-center text-[6px] text-gray-400 flex justify-between items-center">
                                <span>{settings.footer_text || 'Documento Confidencial'}</span>
                                {settings.show_page_numbers && <span>1 / 1</span>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full aspect-[210/297] bg-slate-100 rounded-md overflow-hidden border relative">
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-white z-0">
                            Carregando motor PDF...
                        </div>
                        <PDFViewer
                            width="100%"
                            height="100%"
                            showToolbar={false}
                            className="relative z-10 w-full h-full"
                        >
                            <DetalhadaAnalisePdf
                                formData={mockFormData}
                                resultado={mockResultado}
                                dashboard={mockDashboard}
                                settings={settings}
                                showFullTables={false}
                            />
                        </PDFViewer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
