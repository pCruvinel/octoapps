import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { UserDocumentSettings } from '../pdf-engine/DocumentTypes';
import { PdfEngine } from '../pdf-engine/PdfEngine';
import { ResultadoTriagem } from '@/schemas/triagemRapida.schema';

// Helpers
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) =>
    ((value || 0) * 100).toFixed(2).replace('.', ',') + '%';

// For values already in percent format (e.g., 26.97 for 26.97%)
const formatPercentDirect = (value: number) =>
    (value || 0).toFixed(2).replace('.', ',') + '%';

// ===== IMAGE VALIDATION =====
// @react-pdf/renderer requires valid image URLs with proper extensions
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    const lowerUrl = url.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => lowerUrl.includes(ext));
    const isDataUrl = lowerUrl.startsWith('data:image/');
    const isSupabaseStorage = lowerUrl.includes('supabase') && lowerUrl.includes('storage');
    return hasValidExtension || isDataUrl || isSupabaseStorage;
};

interface TriagemTemplateProps {
    data: ResultadoTriagem;
    settings: UserDocumentSettings;
}

export const PreviaEmprestimoVeiculoPdf = ({ data, settings }: TriagemTemplateProps) => {
    const styles = PdfEngine.createStyles({
        ...PdfEngine.styles,
        card: {
            padding: 15,
            backgroundColor: '#ffffff',
            borderRadius: 5,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
        },
        table: {
            display: 'flex',
            width: 'auto',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: settings.table_border_color || '#e2e8f0',
            borderRightWidth: 0,
            borderBottomWidth: 0,
            marginBottom: 15,
        },
        tableRow: {
            flexDirection: 'row',
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
        tableCell: {
            margin: 5,
            fontSize: 9,
            textAlign: 'center',
            color: settings.text_color || '#0f172a',
        },
        tableHeader: {
            backgroundColor: '#f8fafc', // Very light gray for header
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
        sectionTitle: {
            fontSize: 11,
            fontWeight: 'bold',
            marginBottom: 8,
            color: settings.heading_color || '#334155',
            textTransform: 'uppercase',
        },
        alertBox: {
            padding: 12,
            borderRadius: 5,
            marginBottom: 12,
        }
    });

    const BrandingHeader = () => (
        <View style={PdfEngine.styles.header} fixed>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left: Logo */}
                <View style={{ flex: 1 }}>
                    {isValidImageUrl(settings.logo_url) ? (
                        <Image src={settings.logo_url!} style={{ width: 100, height: 'auto' }} />
                    ) : (
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: settings.primary_color || '#000' }}>
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
                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                        Dossiê de Viabilidade • {new Date().toLocaleDateString('pt-BR')}
                    </Text>
                </View>
            </View>
        </View>
    );

    const BrandingFooter = () => (
        <View style={PdfEngine.styles.footer} fixed>
            <Text>{settings.footer_text || 'Documento gerado pelo sistema OctoApps'}</Text>
        </View>
    );

    const Watermark = () => {
        if (!isValidImageUrl(settings.watermark_url)) return null;
        return <Image src={settings.watermark_url!} style={styles.watermarkImage} fixed />;
    };

    // Derive monthly rates - data comes as decimal (e.g., 0.2697 for 26.97%)
    // formatPercent multiplies by 100, so we just divide by 12 for monthly
    const taxaMensal = data.taxaContratoAnual / 12;
    const taxaMercadoMensal = data.taxaMercadoAnual / 12;

    // Classification Colors (for borders/text instead of backgrounds)
    const classificationColor = data.classificacao === 'VIAVEL' ? '#16a34a' : data.classificacao === 'ATENCAO' ? '#d97706' : '#dc2626';

    return (
        <Document>
            <Page size="A4" style={PdfEngine.styles.page}>
                <Watermark />
                <BrandingHeader />

                <Text style={[PdfEngine.styles.title, { color: settings.primary_color }]}>DOSSIÊ DE VIABILIDADE</Text>
                <Text style={PdfEngine.styles.subtitle}>Análise Prévia de Contrato Revisional</Text>

                {/* Classification Banner - MINIMALIST: White bg, colored left border */}
                <View style={{
                    padding: 15,
                    backgroundColor: '#ffffff',
                    borderLeftWidth: 4,
                    borderLeftColor: classificationColor,
                    borderWidth: 1,
                    borderColor: '#f1f5f9',
                    borderRightWidth: 1,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    marginBottom: 20,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>
                                {data.classificacao === 'VIAVEL' ? 'ALTA VIABILIDADE' : data.classificacao === 'ATENCAO' ? 'ANÁLISE RECOMENDADA' : 'BAIXA VIABILIDADE'}
                            </Text>
                            <Text style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                                {data.isAbusivo ? 'Indícios de abusividade detectados' : 'Dentro dos parâmetros de mercado'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Score de Risco</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>{data.score}/100</Text>
                        </View>
                    </View>
                </View>

                {/* Economy and Sobretaxa Highlights */}
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                    {/* Economy */}
                    <View style={{ flex: 1, padding: 12, backgroundColor: '#ffffff', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 8, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Economia Potencial</Text>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#15803d', marginTop: 6 }}>
                            {formatCurrency(data.economiaTotal)}
                        </Text>
                        <Text style={{ fontSize: 8, color: '#166534', marginTop: 4 }}>Projeção Total</Text>
                    </View>

                    {/* Sobretaxa */}
                    <View style={{ flex: 1, padding: 12, backgroundColor: '#ffffff', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 8, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Sobretaxa Encontrada</Text>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: data.isAbusivo ? '#dc2626' : '#0f172a', marginTop: 6 }}>
                            +{formatPercent(data.sobretaxaPercentual)}
                        </Text>
                        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>acima da média de mercado</Text>
                    </View>
                </View>

                {/* Composição da Economia */}
                <Text style={styles.sectionTitle}>Composição da Economia</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>Componente</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>Valor Estimado</Text></View>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>Observação</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>Economia em Juros</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, fontWeight: 'bold', color: '#166534' }}>{formatCurrency(data.economiaJuros)}</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, fontSize: 8 }}>Recálculo pela taxa média</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol3}><Text style={styles.tableCell}>Restituição de Tarifas</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>{formatCurrency(data.economiaTarifas)}</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, fontSize: 8 }}>Venda casada (se aplicável)</Text></View>
                    </View>
                    <View style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>Total Economia</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, fontWeight: 'bold', color: '#166534', fontSize: 10 }}>{formatCurrency(data.economiaTotal)}</Text></View>
                        <View style={styles.tableCol3}><Text style={{ ...styles.tableCell, fontSize: 8 }}>Projeção</Text></View>
                    </View>
                </View>

                {/* Análise de Taxas de Juros */}
                <Text style={styles.sectionTitle}>Análise de Taxas de Juros</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Tipo de Taxa</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Taxa Praticada</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Média de Mercado</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Diferença</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Taxa Mensal (a.m.)</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatPercent(taxaMensal)}</Text></View>
                        <View style={styles.tableCol4}><Text style={{ ...styles.tableCell, color: '#166534' }}>{formatPercent(taxaMercadoMensal)}</Text></View>
                        <View style={styles.tableCol4}>
                            <Text style={{ ...styles.tableCell, color: taxaMensal > taxaMercadoMensal ? '#dc2626' : '#10b981', fontWeight: 'bold' }}>
                                {taxaMensal > taxaMercadoMensal ? '+' : ''}{formatPercent(taxaMensal - taxaMercadoMensal)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Taxa Anual (a.a.)</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatPercent(data.taxaContratoAnual)}</Text></View>
                        <View style={styles.tableCol4}><Text style={{ ...styles.tableCell, color: '#166534' }}>{formatPercent(data.taxaMercadoAnual)}</Text></View>
                        <View style={styles.tableCol4}>
                            <Text style={{ ...styles.tableCell, color: data.taxaContratoAnual > data.taxaMercadoAnual ? '#dc2626' : '#10b981', fontWeight: 'bold' }}>
                                {data.taxaContratoAnual > data.taxaMercadoAnual ? '+' : ''}{formatPercent(data.taxaContratoAnual - data.taxaMercadoAnual)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Comparativo de Prestações (if available) */}
                {data.prestacaoOriginal && data.prestacaoRevisada && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Comparativo de Prestações</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                            <Text style={{ fontSize: 10 }}>Prestação Atual:</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(data.prestacaoOriginal)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                            <Text style={{ fontSize: 10 }}>Nova Prestação (estimada):</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(data.prestacaoRevisada)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 5, marginTop: 5 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Economia Mensal:</Text>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534' }}>{formatCurrency(data.diferencaPrestacao || 0)}</Text>
                        </View>
                    </View>
                )}

                {/* Alert: Capitalização Diária */}
                {data.capitalizacaoDiariaDetectada && (
                    <View style={[styles.alertBox, { borderWidth: 1, borderColor: '#fca5a5' }]}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#991b1b' }}>⚡ CAPITALIZAÇÃO DIÁRIA DETECTADA</Text>
                        <Text style={{ fontSize: 9, color: '#b91c1c', marginTop: 4 }}>{data.evidenciaCapitalizacao}</Text>
                    </View>
                )}

                {/* Alert: Carência */}
                {data.carenciaDetectada && (
                    <View style={[styles.alertBox, { borderWidth: 1, borderColor: '#fcd34d' }]}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#92400e' }}>⏱ PERÍODO DE CARÊNCIA IDENTIFICADO</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={{ fontSize: 9, color: '#a16207' }}>Dias: {data.diasCarencia}</Text>
                            <Text style={{ fontSize: 9, color: '#a16207' }}>Juros incorporados: {formatCurrency(data.jurosCarencia || 0)}</Text>
                        </View>
                    </View>
                )}

                {/* Recomendação with lighter style */}
                <View style={{ marginTop: 10, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={styles.sectionTitle}>Recomendação Técnica</Text>
                    <Text style={{ fontSize: 10, fontStyle: 'italic', color: '#475569', lineHeight: 1.5 }}>
                        "{data.recomendacao}"
                    </Text>
                </View>

                {/* Disclaimer */}
                <Text style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center', marginTop: 15 }}>
                    * Estimativa baseada em jurisprudência (Tema 234 STJ). Este documento não substitui um laudo pericial completo.
                </Text>

                <BrandingFooter />
            </Page>
        </Document>
    );
};
