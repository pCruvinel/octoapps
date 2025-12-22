import React from 'react';
import { Page, Text, View, Document, Image, Font } from '@react-pdf/renderer';
import { UserDocumentSettings } from '../pdf-engine/DocumentTypes';
import { PdfEngine } from '../pdf-engine/PdfEngine';
import type { LaudoExportData } from '@/services/laudoExport.service';

// Helpers
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) =>
    value.toFixed(2) + '%';

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch (e) {
        return dateStr;
    }
};

interface FinancialReportTemplateProps {
    data: LaudoExportData;
    settings: UserDocumentSettings;
}

export const FinancialReportTemplate = ({ data, settings }: FinancialReportTemplateProps) => {
    const styles = PdfEngine.createStyles({
        ...PdfEngine.styles,
        brandColor: {
            color: settings.primary_color || '#000000',
        },
        brandBg: {
            backgroundColor: settings.primary_color || '#000000',
        },
        secondaryColor: {
            color: settings.secondary_color || '#6b7280',
        },
        coverTitle: {
            fontSize: 24,
            textAlign: 'center',
            marginTop: 100,
            marginBottom: 10,
        },
        coverSubtitle: {
            fontSize: 18,
            textAlign: 'center',
            marginBottom: 40,
            color: '#475569',
        },
        sectionTitle: {
            fontSize: 16,
            marginBottom: 15,
            borderBottomWidth: 1,
            borderBottomColor: settings.table_border_color || '#e2e8f0',
            paddingBottom: 5,
            color: settings.primary_color || '#000000',
        },
        table: {
            display: 'flex',
            width: 'auto',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
            borderRightWidth: 0,
            borderBottomWidth: 0,
        },
        tableRow: {
            margin: 'auto',
            flexDirection: 'row',
        },
        tableCol: {
            width: '14%', // 7 cols -> ~14%
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
            borderLeftWidth: 0,
            borderTopWidth: 0,
        },
        tableCell: {
            margin: 5,
            fontSize: 8,
            color: settings.text_color || '#0f172a',
        },
        watermarkImage: {
            position: 'absolute',
            top: '30%',
            left: `${(1 - (settings.watermark_scale ?? 0.5)) / 2 * 100}%`,
            width: `${(settings.watermark_scale ?? 0.5) * 100}%`,
            height: 'auto',
            opacity: settings.watermark_opacity ?? 0.15,
            transform: 'rotate(-45deg)',
            zIndex: -1,
        }
    });

    const BrandingHeader = () => (
        <View style={PdfEngine.styles.header} fixed>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left: Logo */}
                <View style={{ flex: 1 }}>
                    {settings.logo_url ? (
                        <Image src={settings.logo_url} style={{ width: 100, height: 'auto' }} />
                    ) : (
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: settings.primary_color }}>
                            OCTOAPPS
                        </Text>
                    )}
                </View>

                {/* Center: Timbre (Company Name/CNPJ) */}
                <View style={{ flex: 2, alignItems: 'center' }}>
                    {settings.header_text && (
                        <Text style={{
                            fontSize: 10,
                            textAlign: 'center',
                            color: settings.secondary_color || '#64748b',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                        }}>
                            {settings.header_text}
                        </Text>
                    )}
                </View>

                {/* Right: Date */}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                        Gerado em {new Date().toLocaleDateString('pt-BR')}
                    </Text>
                </View>
            </View>
        </View>
    );

    const BrandingFooter = () => (
        <View style={PdfEngine.styles.footer} fixed>
            <Text>{settings.footer_text || 'Documento gerado eletronicamente'}</Text>
            {settings.show_page_numbers && (
                <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
            )}
        </View>
    );

    const Watermark = () => {
        if (!settings.watermark_url) return null;
        return <Image src={settings.watermark_url} style={styles.watermarkImage} fixed />;
    }

    return (
        <Document>
            {/* CAPA */}
            <Page size="A4" style={PdfEngine.styles.page}>
                <Watermark />
                <BrandingHeader />

                <View style={{ flex: 1 }}>
                    <Text style={[styles.coverTitle, styles.brandColor]}>PARECER TÉCNICO PERICIAL</Text>
                    <Text style={styles.coverSubtitle}>Revisional de Contrato Bancário</Text>

                    <View style={{ marginTop: 40, padding: 20, backgroundColor: '#f8fafc', borderRadius: 5 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>PARTES:</Text>
                        <Text style={{ fontSize: 10, marginBottom: 5 }}>Autor: {data.devedor}</Text>
                        <Text style={{ fontSize: 10, marginBottom: 20 }}>Réu: {data.credor}</Text>

                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>REFERÊNCIA:</Text>
                        <Text style={{ fontSize: 10 }}>Contrato nº: {data.contratoNum || 'Não informado'}</Text>
                    </View>

                    <View style={{ marginTop: 40, padding: 20, backgroundColor: '#f0fdf4', borderColor: '#22c55e', borderWidth: 1, borderRadius: 5 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#166534', textAlign: 'center', marginBottom: 10 }}>
                            VALOR A RESTITUIR
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#166534', textAlign: 'center' }}>
                            {formatCurrency(data.kpis.economiaTotal)}
                        </Text>
                    </View>
                </View>

                <BrandingFooter />
            </Page>

            {/* SUMÁRIO E METODOLOGIA */}
            <Page size="A4" style={PdfEngine.styles.page}>
                <Watermark />
                <BrandingHeader />

                <View style={{ marginBottom: 30 }}>
                    <Text style={styles.sectionTitle}>1. SUMÁRIO EXECUTIVO</Text>
                    <Text style={PdfEngine.styles.text}>
                        Trata-se de análise técnica de contrato de {data.parametros.metodologia} celebrado entre {data.devedor} e {data.credor}.
                        Constatou-se a aplicação de taxa de juros de {formatPercent(data.kpis.taxaPraticada)} a.m., superior à média de mercado de {formatPercent(data.kpis.taxaMercado)} a.m.
                    </Text>
                </View>

                <View style={{ marginBottom: 30 }}>
                    <Text style={styles.sectionTitle}>2. QUADRO RESUMO</Text>
                    {/* Simple Table for Summary */}
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 5 }}>
                        <Text style={{ flex: 1, fontSize: 10 }}>Total Devido (Recalculado)</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(data.kpis.novaParcelaValor * (data.evolucao.length || 1))}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 5 }}>
                        <Text style={{ flex: 1, fontSize: 10 }}>Diferença a Restituir (Simples)</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(data.kpis.restituicaoSimples)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 5 }}>
                        <Text style={{ flex: 1, fontSize: 10 }}>Diferença a Restituir (Em Dobro)</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(data.kpis.restituicaoEmDobro)}</Text>
                    </View>
                </View>

                <View style={{ marginBottom: 30 }}>
                    <Text style={styles.sectionTitle}>3. METODOLOGIA</Text>
                    <Text style={PdfEngine.styles.text}>
                        • Sistema de Amortização: {data.parametros.sistemaAmortizacao}{'\n'}
                        • Capitalização: {data.parametros.capitalizacao}{'\n'}
                        • Taxa de Mercado: {formatPercent(data.parametros.taxaUsada)} a.m.
                    </Text>
                </View>

                <BrandingFooter />
            </Page>

            {/* APÊNDICES (TABELAS) */}
            <Page size="A4" style={PdfEngine.styles.page}>
                <Watermark />
                <BrandingHeader />

                <Text style={styles.sectionTitle}>APÊNDICE I - Evolução Recalculada</Text>

                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, { backgroundColor: '#f1f5f9' }]}>
                        {['Mês', 'Vencimento', 'Saldo Ant.', 'Juros', 'Amort.', 'Parcela', 'Saldo Dev.'].map((h) => (
                            <View style={styles.tableCol} key={h}>
                                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{h}</Text>
                            </View>
                        ))}
                    </View>
                    {/* Rows - Limiting to avoid huge PDF generation time if too many rows, usually pages handle it but performance can vary */}
                    {data.ap01 && data.ap01.map((row: any, i: number) => (
                        <View style={styles.tableRow} key={i}>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{row.n}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatDate(row.vencimento)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(row.saldoAnterior)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(row.juros)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(row.amortizacao)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(row.parcela)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(row.saldoDevedor)}</Text></View>
                        </View>
                    ))}
                </View>

                <BrandingFooter />
            </Page>
        </Document>
    );
};
