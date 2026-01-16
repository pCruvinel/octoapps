import React from 'react';
import { Page, Text, View, Document, Image, StyleSheet } from '@react-pdf/renderer';
import { UserDocumentSettings } from '../pdf-engine/DocumentTypes';
import { PdfEngine } from '../pdf-engine/PdfEngine';
import type { DetalhadaPageData } from '../calculations/detalhada-page';
import type { CalculoDetalhadoResponse } from '@/types/calculation.types';

// ===== HELPER FORMATTERS =====
const formatCurrency = (value: number | undefined) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatPercent = (value: number | undefined) =>
    ((value || 0) * 100).toFixed(2).replace('.', ',') + '%';

const formatPercentDirect = (value: number | undefined) =>
    (value || 0).toFixed(2).replace('.', ',') + '%';

const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
        return dateStr;
    }
};

// ===== IMAGE VALIDATION =====
// @react-pdf/renderer requires valid image URLs. We validate:
// 1. URL-like strings (http/https)
// 2. Data URIs (data:image/...)
// 3. Supabase Storage URLs (always considered valid if they include supabase.co)
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        console.log('[PDF Logo] Invalid URL: empty or null');
        return false;
    }
    
    const lowerUrl = url.toLowerCase().trim();
    
    // Accept data URIs
    if (lowerUrl.startsWith('data:image/')) {
        console.log('[PDF Logo] Valid data URI detected');
        return true;
    }
    
    // Accept valid HTTP/HTTPS URLs
    if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
        // Check for Supabase storage or any URL with image extensions
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
        const hasValidExtension = validExtensions.some(ext => lowerUrl.includes(ext));
        const isSupabaseUrl = lowerUrl.includes('supabase.co') || lowerUrl.includes('supabase.in');
        
        const isValid = hasValidExtension || isSupabaseUrl;
        console.log(`[PDF Logo] URL check: ${url.substring(0, 80)}... | extension: ${hasValidExtension} | supabase: ${isSupabaseUrl} | valid: ${isValid}`);
        return isValid;
    }
    
    console.log('[PDF Logo] URL does not start with http/https or data:image/');
    return false;
};

// ===== TYPES =====
interface LaudoRevisionalTemplateProps {
    formData: Partial<DetalhadaPageData>;
    resultado: CalculoDetalhadoResponse;
    dashboard: {
        kpis: {
            economiaTotal: number;
            parcelaOriginalValor: number;
            novaParcelaValor: number;
            taxaPraticada: number;
            taxaMercado: number;
            restituicaoSimples: number;
            restituicaoEmDobro: number;
            classificacaoAbuso: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
        };
        totais: {
            totalPagoBanco: number;
            totalJurosBanco: number;
            totalPagoRecalculado: number;
            totalJurosRecalculado: number;
            economiaTotal: number;
            sobretaxaPercentual: number;
        };
        evolucao: Array<{
            mes: number;
            saldoBanco: number;
            saldoRecalculado: number;
            diferenca: number;
        }>;
    };
    settings: UserDocumentSettings;
    /** Se true, exibe todas as linhas das tabelas (gera múltiplas páginas). Padrão: false (truncado em 30 linhas) */
    showFullTables?: boolean;
}

// Helper to split array into chunks for pagination
const ROWS_PER_PAGE = 30;
const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};

// ===== MAIN TEMPLATE =====
export const DetalhadaAnalisePdf = ({
    formData,
    resultado,
    dashboard,
    settings,
    showFullTables,
}: LaudoRevisionalTemplateProps) => {
    const styles = PdfEngine.createStyles({
        ...PdfEngine.styles,
        // Custom styles for laudo
        sectionTitle: {
            fontSize: 11,
            fontWeight: 'bold',
            marginBottom: 8,
            marginTop: 15,
            color: settings.heading_color || '#334155',
            textTransform: 'uppercase',
            borderBottomWidth: 1,
            borderBottomColor: settings.table_border_color || '#e2e8f0',
            paddingBottom: 4,
        },
        card: {
            padding: 12,
            backgroundColor: '#ffffff', // White instead of gray
            borderRadius: 5,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
        },
        kpiBox: {
            flex: 1,
            padding: 10,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            backgroundColor: '#ffffff', // White background default
        },
        table: {
            display: 'flex',
            width: 'auto',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
            borderRightWidth: 0,
            borderBottomWidth: 0,
            marginBottom: 10,
        },
        tableRow: {
            flexDirection: 'row',
        },
        tableCol2: {
            width: '50%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
            borderLeftWidth: 0,
            borderTopWidth: 0,
        },
        tableCol3: {
            width: '33.33%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
            borderLeftWidth: 0,
            borderTopWidth: 0,
        },
        tableCol4: {
            width: '25%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
            borderLeftWidth: 0,
            borderTopWidth: 0,
        },
        tableCol5: {
            width: '20%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
            borderLeftWidth: 0,
            borderTopWidth: 0,
        },
        tableCell: {
            margin: 4,
            fontSize: 8,
            textAlign: 'center',
            color: settings.text_color || '#0f172a',
        },
        tableCellLeft: {
            margin: 4,
            fontSize: 8,
            textAlign: 'left',
            color: settings.text_color || '#0f172a',
        },
        tableHeader: {
            backgroundColor: settings.table_header_bg || '#f1f5f9',
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
        },
        infoRow: {
            flexDirection: 'row',
            marginBottom: 4,
        },
        infoLabel: {
            fontSize: 9,
            color: '#64748b',
            width: '40%',
        },
        infoValue: {
            fontSize: 9,
            color: '#0f172a',
            fontWeight: 'bold',
            width: '60%',
        },
    });

    // Classification config
    const classificacaoConfig = {
        BAIXA: { color: '#10b981', bg: '#f0fdf4', label: 'BAIXO RISCO' },
        MEDIA: { color: '#f59e0b', bg: '#fffbeb', label: 'RISCO MODERADO' },
        ALTA: { color: '#f97316', bg: '#fff7ed', label: 'ALTO RISCO' },
        CRITICA: { color: '#dc2626', bg: '#fef2f2', label: 'RISCO CRÍTICO' },
    }[dashboard.kpis.classificacaoAbuso] || { color: '#64748b', bg: '#f8fafc', label: 'N/A' };

    // ===== COMPONENTS =====
    const BrandingHeader = () => (
        <View style={PdfEngine.styles.header} fixed>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left: Logo */}
                <View style={{ flex: 1 }}>
                    {isValidImageUrl(settings.logo_url) ? (
                        <Image src={settings.logo_url!} style={{ width: 80, height: 'auto' }} />
                    ) : (
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: settings.primary_color || '#000' }}>
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

                {/* Right: Document Type & Date */}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 9, color: '#64748b' }}>Parecer Técnico</Text>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>{new Date().toLocaleDateString('pt-BR')}</Text>
                </View>
            </View>
        </View>
    );

    const BrandingFooter = () => (
        <View style={PdfEngine.styles.footer} fixed>
            <Text style={{ fontSize: 7 }}>{settings.footer_text || 'Documento gerado pelo sistema OctoApps'}</Text>
            <Text style={{ fontSize: 7, color: '#94a3b8' }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
    );

    const Watermark = () => {
        if (!isValidImageUrl(settings.watermark_url)) return null;
        return <Image src={settings.watermark_url!} style={styles.watermarkImage} fixed />;
    };

    // Get appendix data
    const ap01 = resultado.apendices?.ap01?.tabela || [];
    const ap02 = resultado.apendices?.ap02?.tabela || [];
    const ap03 = resultado.apendices?.ap03?.tabela || [];

    return (
        <Document>
            {/* ===== PAGE 1: COVER & SUMMARY ===== */}
            <Page size="A4" style={PdfEngine.styles.page}>
                <Watermark />
                <BrandingHeader />

                {/* Title */}
                <Text style={[PdfEngine.styles.title, { color: settings.primary_color, marginTop: 20 }]}>
                    PARECER TÉCNICO
                </Text>
                <Text style={PdfEngine.styles.subtitle}>Análise de Contrato de Crédito</Text>

                {/* Classification Banner - Minimalist */}
                <View style={{
                    padding: 15,
                    backgroundColor: '#ffffff',
                    borderLeftWidth: 5,
                    borderLeftColor: classificacaoConfig.color,
                    borderWidth: 1,
                    borderColor: '#f1f5f9',
                    borderTopWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    marginBottom: 15,
                    marginTop: 10,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>
                                {classificacaoConfig.label}
                            </Text>
                            <Text style={{ fontSize: 9, color: '#64748b', marginTop: 3 }}>
                                {resultado.resumo?.isAbusivo ? 'Indícios de prática abusiva identificados' : 'Taxa dentro dos parâmetros esperados'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>Sobretaxa</Text>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: classificacaoConfig.color }}>
                                +{formatPercentDirect(dashboard.totais.sobretaxaPercentual)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* KPI Boxes - Minimalist */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    <View style={[styles.kpiBox, { borderTopWidth: 3, borderTopColor: '#15803d', borderColor: '#e2e8f0' }]}>
                        <Text style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase' }}>Economia Total</Text>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#15803d', marginTop: 3 }}>
                            {formatCurrency(dashboard.kpis.economiaTotal)}
                        </Text>
                    </View>
                    <View style={[styles.kpiBox, { borderTopWidth: 3, borderTopColor: '#1d4ed8', borderColor: '#e2e8f0' }]}>
                        <Text style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase' }}>Restituição Simples</Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1d4ed8', marginTop: 3 }}>
                            {formatCurrency(dashboard.kpis.restituicaoSimples)}
                        </Text>
                    </View>
                    <View style={[styles.kpiBox, { borderTopWidth: 3, borderTopColor: '#b45309', borderColor: '#e2e8f0' }]}>
                        <Text style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase' }}>Restituição Dobro</Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#b45309', marginTop: 3 }}>
                            {formatCurrency(dashboard.kpis.restituicaoEmDobro)}
                        </Text>
                    </View>
                </View>

                {/* Contract Data */}
                <Text style={styles.sectionTitle}>Dados do Contrato</Text>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Credor:</Text>
                            <Text style={styles.infoValue}>{formData.credor || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Devedor:</Text>
                            <Text style={styles.infoValue}>{formData.devedor || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nº Contrato:</Text>
                            <Text style={styles.infoValue}>{formData.numeroContrato || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tipo:</Text>
                            <Text style={styles.infoValue}>{formData.tipoContrato || formData.module || '-'}</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Valor Financiado:</Text>
                            <Text style={styles.infoValue}>{formatCurrency(formData.valorFinanciado)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Prazo:</Text>
                            <Text style={styles.infoValue}>{formData.prazoMeses || 0} meses</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Data Contrato:</Text>
                            <Text style={styles.infoValue}>{formatDate(formData.dataContrato)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Sistema:</Text>
                            <Text style={styles.infoValue}>{formData.sistemaAmortizacao || 'PRICE'}</Text>
                        </View>
                    </View>
                </View>

                {/* Rate Comparison Table */}
                <Text style={styles.sectionTitle}>Análise Comparativa de Taxas</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Indicador</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Contrato</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Mercado (BACEN)</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Diferença</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Taxa Mensal</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatPercentDirect(dashboard.kpis.taxaPraticada / 12)} a.m.</Text></View>
                        <View style={styles.tableCol4}><Text style={{ ...styles.tableCell, color: '#166534' }}>{formatPercentDirect(dashboard.kpis.taxaMercado / 12)} a.m.</Text></View>
                        <View style={styles.tableCol4}>
                            <Text style={{ ...styles.tableCell, color: '#dc2626', fontWeight: 'bold' }}>
                                +{formatPercentDirect((dashboard.kpis.taxaPraticada - dashboard.kpis.taxaMercado) / 12)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Taxa Anual</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatPercentDirect(dashboard.kpis.taxaPraticada)} a.a.</Text></View>
                        <View style={styles.tableCol4}><Text style={{ ...styles.tableCell, color: '#166534' }}>{formatPercentDirect(dashboard.kpis.taxaMercado)} a.a.</Text></View>
                        <View style={styles.tableCol4}>
                            <Text style={{ ...styles.tableCell, color: '#dc2626', fontWeight: 'bold' }}>
                                +{formatPercentDirect(dashboard.kpis.taxaPraticada - dashboard.kpis.taxaMercado)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Financial Summary Table */}
                <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>Descrição</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>Banco (Contrato)</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>Recalculado (Justo)</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol3}><Text style={styles.tableCellLeft}>Total Pago</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>{formatCurrency(dashboard.totais.totalPagoBanco)}</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, color: '#166534' }}>{formatCurrency(dashboard.totais.totalPagoRecalculado)}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol3}><Text style={styles.tableCellLeft}>Total de Juros</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>{formatCurrency(dashboard.totais.totalJurosBanco)}</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, color: '#166534' }}>{formatCurrency(dashboard.totais.totalJurosRecalculado)}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol3}><Text style={styles.tableCellLeft}>Prestação Média</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>{formatCurrency(dashboard.kpis.parcelaOriginalValor)}</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, color: '#166534' }}>{formatCurrency(dashboard.kpis.novaParcelaValor)}</Text></View>
                    </View>
                    <View style={[styles.tableRow, { backgroundColor: '#f0fdf4' }]}>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCellLeft, fontWeight: 'bold' }}>DIFERENÇA (ECONOMIA)</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>-</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, color: '#166534', fontWeight: 'bold', fontSize: 10 }}>{formatCurrency(dashboard.totais.economiaTotal)}</Text></View>
                    </View>
                </View>

                {/* BACEN Reference */}
                <View style={[styles.card, { marginTop: 10 }]}>
                    <Text style={{ fontSize: 8, color: '#64748b', marginBottom: 3 }}>Fonte de Referência</Text>
                    <Text style={{ fontSize: 9, color: '#0f172a' }}>
                        Taxa média obtida via série histórica do Banco Central do Brasil (SGS) - Série {resultado.taxaSnapshot?.serieId || 'N/A'}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                        Data de referência: {formatDate(resultado.taxaSnapshot?.dataReferencia)} | Valor: {formatPercentDirect(resultado.taxaSnapshot?.valor)} a.a.
                    </Text>
                </View>

                <BrandingFooter />
            </Page>

            {/* ===== PAGE 2+: APPENDIX AP01 - EVOLUÇÃO BANCO ===== */}
            {(() => {
                if (ap01.length === 0) return null;

                // Determine pagination strategy
                const chunks = showFullTables
                    ? chunkArray(ap01, ROWS_PER_PAGE)
                    : [ap01.slice(0, ROWS_PER_PAGE)];

                return chunks.map((chunk, pageIndex) => (
                    <Page key={`ap01-${pageIndex}`} size="A4" style={PdfEngine.styles.page}>
                        <Watermark />
                        <BrandingHeader />

                        <Text style={[PdfEngine.styles.title, { fontSize: 14, marginTop: 10 }]}>
                            APÊNDICE AP-01 {chunks.length > 1 ? `(${pageIndex + 1}/${chunks.length})` : ''}
                        </Text>
                        <Text style={PdfEngine.styles.subtitle}>Evolução do Saldo Devedor - Metodologia do Banco</Text>

                        <View style={[styles.table, { marginTop: 15 }]}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Mês</Text></View>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Saldo Anterior</Text></View>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Juros</Text></View>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Parcela</Text></View>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Saldo Final</Text></View>
                            </View>
                            {chunk.map((row: any, idx: number) => (
                                <View key={idx} style={styles.tableRow}>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{row.mes}</Text></View>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{formatCurrency(row.saldoAnterior || row.saldoAbertura)}</Text></View>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{formatCurrency(row.juros)}</Text></View>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{formatCurrency(row.parcela || row.parcelaTotal)}</Text></View>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{formatCurrency(row.saldoDevedor)}</Text></View>
                                </View>
                            ))}
                        </View>

                        {!showFullTables && ap01.length > 30 && (
                            <Text style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center', marginTop: 5 }}>
                                ... tabela truncada. Exibindo 30 de {ap01.length} linhas. Para ver completo, configure nas opções.
                            </Text>
                        )}

                        <BrandingFooter />
                    </Page>
                ));
            })()}

            {/* ===== PAGE 3+: APPENDIX AP02 - RECALCULADO ===== */}
            {(() => {
                if (ap02.length === 0) return null;

                const chunks = showFullTables
                    ? chunkArray(ap02, ROWS_PER_PAGE)
                    : [ap02.slice(0, ROWS_PER_PAGE)];

                return chunks.map((chunk, pageIndex) => (
                    <Page key={`ap02-${pageIndex}`} size="A4" style={PdfEngine.styles.page}>
                        <Watermark />
                        <BrandingHeader />

                        <Text style={[PdfEngine.styles.title, { fontSize: 14, marginTop: 10 }]}>
                            APÊNDICE AP-02 {chunks.length > 1 ? `(${pageIndex + 1}/${chunks.length})` : ''}
                        </Text>
                        <Text style={PdfEngine.styles.subtitle}>Evolução do Saldo Devedor - Metodologia Recalculada (Taxa BACEN)</Text>

                        <View style={[styles.table, { marginTop: 15 }]}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Mês</Text></View>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Saldo Anterior</Text></View>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Juros</Text></View>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Parcela</Text></View>
                                <View style={styles.tableCol5}><Text style={styles.tableCell}>Saldo Final</Text></View>
                            </View>
                            {chunk.map((row: any, idx: number) => (
                                <View key={idx} style={styles.tableRow}>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{row.mes}</Text></View>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{formatCurrency(row.saldoAnterior || row.saldoAbertura)}</Text></View>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{formatCurrency(row.juros)}</Text></View>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{formatCurrency(row.parcela || row.parcelaTotal)}</Text></View>
                                    <View style={styles.tableCol5}><Text style={styles.tableCell}>{formatCurrency(row.saldoDevedor)}</Text></View>
                                </View>
                            ))}
                        </View>

                        {!showFullTables && ap02.length > 30 && (
                            <Text style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center', marginTop: 5 }}>
                                ... tabela truncada. Exibindo 30 de {ap02.length} linhas. Para ver completo, configure nas opções.
                            </Text>
                        )}

                        <BrandingFooter />
                    </Page>
                ));
            })()}

            {/* ===== PAGE 4+: APPENDIX AP03 - DIFERENÇAS ===== */}
            {(() => {
                if (ap03.length === 0) return null;

                const chunks = showFullTables
                    ? chunkArray(ap03, 35) // Slightly more rows per page for AP03 due to simpler columns
                    : [ap03.slice(0, 35)];

                return chunks.map((chunk, pageIndex) => (
                    <Page key={`ap03-${pageIndex}`} size="A4" style={PdfEngine.styles.page}>
                        <Watermark />
                        <BrandingHeader />

                        <Text style={[PdfEngine.styles.title, { fontSize: 14, marginTop: 10 }]}>
                            APÊNDICE AP-03 {chunks.length > 1 ? `(${pageIndex + 1}/${chunks.length})` : ''}
                        </Text>
                        <Text style={PdfEngine.styles.subtitle}>Demonstrativo de Diferenças Mensais</Text>

                        <View style={[styles.table, { marginTop: 15 }]}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol4}><Text style={styles.tableCell}>Mês</Text></View>
                                <View style={styles.tableCol4}><Text style={styles.tableCell}>Diferença Mensal</Text></View>
                                <View style={styles.tableCol4}><Text style={styles.tableCell}>Diferença Acumulada</Text></View>
                                <View style={styles.tableCol4}><Text style={styles.tableCell}>Observação</Text></View>
                            </View>
                            {chunk.map((row: any, idx: number) => (
                                <View key={idx} style={styles.tableRow}>
                                    <View style={styles.tableCol4}><Text style={styles.tableCell}>{row.mes}</Text></View>
                                    <View style={styles.tableCol4}>
                                        <Text style={{ ...styles.tableCell, color: (row.diferenca || 0) > 0 ? '#dc2626' : '#166534' }}>
                                            {formatCurrency(row.diferenca)}
                                        </Text>
                                    </View>
                                    <View style={styles.tableCol4}>
                                        <Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                                            {formatCurrency(row.diferencaAcumulada)}
                                        </Text>
                                    </View>
                                    <View style={styles.tableCol4}>
                                        <Text style={{ ...styles.tableCell, fontSize: 7 }}>
                                            {row.override ? 'Ajustado' : '-'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {!showFullTables && ap03.length > 35 && (
                            <Text style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center', marginTop: 5 }}>
                                ... tabela truncada. Exibindo 35 de {ap03.length} linhas. Para ver completo, configure nas opções.
                            </Text>
                        )}

                        {/* Shows summary and disclaimer only on the last page */}
                        {pageIndex === chunks.length - 1 && (
                            <>
                                <View style={[styles.card, { marginTop: 15, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#166534' }}>TOTAL INDÉBITO APURADO</Text>
                                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#166534' }}>
                                            {formatCurrency(dashboard.totais.economiaTotal)}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
                                    Este parecer técnico foi elaborado com base em metodologia técnica reconhecida e jurisprudência consolidada (Tema 234 STJ).
                                    Os valores apresentados são estimativas e podem variar conforme análise pericial detalhada.
                                </Text>
                            </>
                        )}

                        <BrandingFooter />
                    </Page>
                ));
            })()}
        </Document>
    );
};
