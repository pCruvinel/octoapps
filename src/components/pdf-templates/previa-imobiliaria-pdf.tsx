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
            marginBottom: 20,
        },
        tableRow: {
            margin: 'auto',
            flexDirection: 'row',
        },
        tableCol: {
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
                        Triagem Imobiliária • {new Date().toLocaleDateString('pt-BR')}
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
        if (!settings.watermark_url) return null;
        return <Image src={settings.watermark_url} style={styles.watermarkImage} fixed />;
    }

    return (
        <Document>
            <Page size="A4" style={PdfEngine.styles.page}>
                <Watermark />
                <BrandingHeader />

                <Text style={[PdfEngine.styles.title, { color: settings.primary_color }]}>DOSSIÊ IMOBILIÁRIO</Text>
                <Text style={PdfEngine.styles.subtitle}>Análise de Viabilidade Financeira</Text>

                {/* Classification Banner - Minimalist */}
                <View style={{
                    padding: 15,
                    backgroundColor: '#ffffff',
                    borderLeftWidth: 4,
                    borderLeftColor: data.classificacao === 'VIAVEL' ? '#16a34a' : data.classificacao === 'ATENCAO' ? '#d97706' : '#dc2626',
                    borderWidth: 1,
                    borderColor: '#f1f5f9',
                    borderRightWidth: 1,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    marginBottom: 20,
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
                        {data.classificacao === 'VIAVEL' ? 'ALTA VIABILIDADE DETECTADA' : data.classificacao === 'ATENCAO' ? 'ANÁLISE RECOMENDADA' : 'BAIXA VIABILIDADE'}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#64748b', marginTop: 5 }}>
                        {data.isAbusivo ? 'Indícios claros de abusividade contratual foram identificados na análise preliminar.' : 'Os parâmetros encontrados estão condizentes com a média de mercado para o período.'}
                    </Text>
                </View>

                {/* Economy and Sobretaxa Highlights */}
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                    {/* Economy */}
                    <View style={{
                        flex: 1,
                        padding: 15,
                        backgroundColor: '#ffffff',
                        borderRadius: 5,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderTopWidth: 3,
                        borderTopColor: '#16a34a'
                    }}>
                        <Text style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Economia Estimada</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a', marginTop: 5 }}>
                            {formatCurrency(data.cenarioJurosSimples.economia)}
                        </Text>
                        <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 3 }}>Projeção via Juros Simples</Text>
                    </View>

                    {/* Sobretaxa */}
                    <View style={{
                        flex: 1,
                        padding: 15,
                        backgroundColor: '#ffffff',
                        borderRadius: 5,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderTopWidth: 3,
                        borderTopColor: '#dc2626'
                    }}>
                        <Text style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Sobretaxa Média</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626', marginTop: 5 }}>
                            +{data.sobretaxaPercent.toFixed(2)}%
                        </Text>
                        <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 3 }}>acima da média BACEN</Text>
                    </View>
                </View>

                {/* Contract Data */}
                <View style={{ marginBottom: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 8, color: '#334155', textTransform: 'uppercase' }}>Dados do Contrato</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <View style={{ width: '50%', marginBottom: 5 }}>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>Valor Financiado</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{formatCurrency(data.dadosContrato.valorFinanciado)}</Text>
                        </View>
                        <View style={{ width: '50%', marginBottom: 5 }}>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>Prazo</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{data.dadosContrato.prazoMeses} meses</Text>
                        </View>
                        <View style={{ width: '50%', marginBottom: 5 }}>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>Sistema</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{data.dadosContrato.sistema}</Text>
                        </View>
                        <View style={{ width: '50%', marginBottom: 5 }}>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>Indexador</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{data.dadosContrato.indexador}</Text>
                        </View>
                    </View>
                </View>

                {/* Comparison Table */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10, color: '#334155' }}>Comparativo de Cenários</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Indicador</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Contrato</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Taxa Média</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Juros Simples</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Total Pago</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(data.cenarioContrato.totalPago)}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(data.cenarioTaxaMedia.totalPago)}</Text></View>
                        <View style={styles.tableCol}><Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>{formatCurrency(data.cenarioJurosSimples.totalPago)}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Juros Totais</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(data.cenarioContrato.totalJuros)}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(data.cenarioTaxaMedia.totalJuros)}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(data.cenarioJurosSimples.totalJuros)}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>1ª Parcela</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(data.cenarioContrato.primeiraParcela)}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(data.cenarioTaxaMedia.primeiraParcela)}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(data.cenarioJurosSimples.parcelaMedia)}</Text></View>
                    </View>
                    <View style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}>
                        <View style={styles.tableCol}><Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>Economia Estimada</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>-</Text></View>
                        <View style={styles.tableCol}><Text style={{ ...styles.tableCell, fontWeight: 'bold', color: '#166534' }}>{formatCurrency(data.cenarioTaxaMedia.economia)}</Text></View>
                        <View style={styles.tableCol}><Text style={{ ...styles.tableCell, fontWeight: 'bold', color: '#0f172a' }}>{formatCurrency(data.cenarioJurosSimples.economia)}</Text></View>
                    </View>
                </View>

                {/* Rates Analysis Table - New Section */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 10, color: '#334155' }}>Análise de Taxas de Juros</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Tipo de Taxa</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Taxa Praticada</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Média de Mercado</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Diferença</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Taxa Mensal (a.m.)</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatPercent(data.taxaContratoMensal)}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatPercent(data.taxaMercadoMensal)}</Text></View>
                        <View style={styles.tableCol}>
                            <Text style={{ ...styles.tableCell, color: data.taxaContratoMensal > data.taxaMercadoMensal ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                {data.taxaContratoMensal > data.taxaMercadoMensal ? '+' : ''}
                                {formatPercent(data.taxaContratoMensal - data.taxaMercadoMensal)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Taxa Anual (a.a.)</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatPercent(data.taxaContratoAnual)}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatPercent(data.taxaMercadoAnual)}</Text></View>
                        <View style={styles.tableCol}>
                            <Text style={{ ...styles.tableCell, color: data.taxaContratoAnual > data.taxaMercadoAnual ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                {data.taxaContratoAnual > data.taxaMercadoAnual ? '+' : ''}
                                {formatPercent(data.taxaContratoAnual - data.taxaMercadoAnual)}
                            </Text>
                        </View>
                    </View>
                </View>

                <BrandingFooter />
            </Page>
        </Document>
    );
};
