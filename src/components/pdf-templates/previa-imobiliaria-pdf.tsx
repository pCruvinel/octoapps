import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { UserDocumentSettings } from '../pdf-engine/DocumentTypes';
import { PdfEngine } from '../pdf-engine/PdfEngine';
import { PreviaImobiliariaResultadoType } from '@/components/triagem/previa-imobiliaria-resultado';

// Helpers
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Imobiliário data comes already as percentage (e.g., 8.75 for 8.75%), NOT as decimal
const formatPercent = (value: number) =>
    (value || 0).toFixed(2).replace('.', ',') + '%';

// ===== IMAGE VALIDATION =====
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    const lowerUrl = url.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => lowerUrl.includes(ext));
    const isDataUrl = lowerUrl.startsWith('data:image/');
    const isSupabaseStorage = lowerUrl.includes('supabase') && lowerUrl.includes('storage');
    return hasValidExtension || isDataUrl || isSupabaseStorage;
};

interface TriagemImobiliarioTemplateProps {
    data: PreviaImobiliariaResultadoType;
    settings: UserDocumentSettings;
}

export const PreviaImobiliariaPdf = ({ data, settings }: TriagemImobiliarioTemplateProps) => {
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
            backgroundColor: '#f8fafc',
            fontWeight: 'bold',
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
                        Dossiê Imobiliário • {new Date().toLocaleDateString('pt-BR')}
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
    }

    // Classification Colors
    const classificationColor = data.classificacao === 'VIAVEL' ? '#16a34a' : data.classificacao === 'ATENCAO' ? '#d97706' : '#dc2626';

    return (
        <Document>
            <Page size="A4" style={PdfEngine.styles.page}>
                <Watermark />
                <BrandingHeader />

                <Text style={[PdfEngine.styles.title, { color: settings.primary_color }]}>DOSSIÊ IMOBILIÁRIO</Text>
                <Text style={PdfEngine.styles.subtitle}>Análise de Viabilidade Financeira</Text>

                {/* Classification Banner - MINIMALIST */}
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
                                {data.classificacao === 'VIAVEL' ? 'ALTA VIABILIDADE DETECTADA' : data.classificacao === 'ATENCAO' ? 'ANÁLISE RECOMENDADA' : 'BAIXA VIABILIDADE'}
                            </Text>
                            <Text style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                                {data.isAbusivo ? 'Indícios de abusividade detectados' : 'Dentro dos parâmetros de mercado'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Sobretaxa Média</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: classificationColor }}>
                                +{data.sobretaxaPercent.toFixed(2)}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Economy and Sobretaxa Highlights */}
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                    {/* Economy */}
                    <View style={{ flex: 1, padding: 12, backgroundColor: '#ffffff', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 8, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Economia Estimada</Text>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#15803d', marginTop: 6 }}>
                            {formatCurrency(data.cenarioJurosSimples.economia)}
                        </Text>
                        <Text style={{ fontSize: 8, color: '#166534', marginTop: 4 }}>Projeção Juros Simples</Text>
                    </View>

                    {/* Sobretaxa */}
                    <View style={{ flex: 1, padding: 12, backgroundColor: '#ffffff', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 8, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Sobretaxa Encontrada</Text>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: data.sobretaxaPercent > 0 ? '#dc2626' : '#0f172a', marginTop: 6 }}>
                            +{data.sobretaxaPercent.toFixed(2)}%
                        </Text>
                        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>acima da média BACEN</Text>
                    </View>
                </View>

                {/* Contract Data */}
                <Text style={styles.sectionTitle}>Dados do Contrato</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, padding: 10, backgroundColor: '#ffffff', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <View style={{ width: '50%', marginBottom: 8 }}>
                        <Text style={{ fontSize: 8, color: '#64748b' }}>Valor Financiado</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{formatCurrency(data.dadosContrato.valorFinanciado)}</Text>
                    </View>
                    <View style={{ width: '50%', marginBottom: 8 }}>
                        <Text style={{ fontSize: 8, color: '#64748b' }}>Prazo</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{data.dadosContrato.prazoMeses} meses</Text>
                    </View>
                    <View style={{ width: '50%', marginBottom: 8 }}>
                        <Text style={{ fontSize: 8, color: '#64748b' }}>Sistema</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{data.dadosContrato.sistema}</Text>
                    </View>
                    <View style={{ width: '50%', marginBottom: 8 }}>
                        <Text style={{ fontSize: 8, color: '#64748b' }}>Indexador</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{data.dadosContrato.indexador}</Text>
                    </View>
                </View>

                {/* Comparison Table */}
                <Text style={styles.sectionTitle}>Comparativo de Cenários</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Indicador</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Contrato</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Taxa Média</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Juros Simples</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Total Pago</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatCurrency(data.cenarioContrato.totalPago)}</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatCurrency(data.cenarioTaxaMedia.totalPago)}</Text></View>
                        <View style={styles.tableCol4}><Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>{formatCurrency(data.cenarioJurosSimples.totalPago)}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Juros Totais</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatCurrency(data.cenarioContrato.totalJuros)}</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatCurrency(data.cenarioTaxaMedia.totalJuros)}</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatCurrency(data.cenarioJurosSimples.totalJuros)}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>1ª Parcela</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatCurrency(data.cenarioContrato.primeiraParcela)}</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatCurrency(data.cenarioTaxaMedia.primeiraParcela)}</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatCurrency(data.cenarioJurosSimples.parcelaMedia)}</Text></View>
                    </View>
                    <View style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}>
                        <View style={styles.tableCol4}><Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>Economia Estimada</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>-</Text></View>
                        <View style={styles.tableCol4}><Text style={{ ...styles.tableCell, fontWeight: 'bold', color: '#166534' }}>{formatCurrency(data.cenarioTaxaMedia.economia)}</Text></View>
                        <View style={styles.tableCol4}><Text style={{ ...styles.tableCell, fontWeight: 'bold', color: '#0f172a' }}>{formatCurrency(data.cenarioJurosSimples.economia)}</Text></View>
                    </View>
                </View>

                {/* Rates Analysis Table */}
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
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatPercent(data.taxaContratoMensal)}</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatPercent(data.taxaMercadoMensal)}</Text></View>
                        <View style={styles.tableCol4}>
                            <Text style={{ ...styles.tableCell, color: data.taxaContratoMensal > data.taxaMercadoMensal ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                {data.taxaContratoMensal > data.taxaMercadoMensal ? '+' : ''}
                                {formatPercent(data.taxaContratoMensal - data.taxaMercadoMensal)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>Taxa Anual (a.a.)</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatPercent(data.taxaContratoAnual)}</Text></View>
                        <View style={styles.tableCol4}><Text style={styles.tableCell}>{formatPercent(data.taxaMercadoAnual)}</Text></View>
                        <View style={styles.tableCol4}>
                            <Text style={{ ...styles.tableCell, color: data.taxaContratoAnual > data.taxaMercadoAnual ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                {data.taxaContratoAnual > data.taxaMercadoAnual ? '+' : ''}
                                {formatPercent(data.taxaContratoAnual - data.taxaMercadoAnual)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Disclaimer */}
                <Text style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center', marginTop: 15 }}>
                    * Estimativa baseada em metodologia técnica (Série 25442/25443 BACEN). Este documento não substitui um laudo pericial completo.
                </Text>

                <BrandingFooter />
            </Page>
        </Document>
    );
};
