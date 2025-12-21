import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { UserDocumentSettings } from '../pdf-engine/DocumentTypes';
import { PdfEngine } from '../pdf-engine/PdfEngine';
import { ResultadoImobiliarioType } from '@/components/triagem/ResultadoImobiliario';

// Helpers
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) =>
    (value * 100).toFixed(2).replace('.', ',') + '%';

interface TriagemImobiliarioTemplateProps {
    data: ResultadoImobiliarioType;
    settings: UserDocumentSettings;
}

export const TriagemImobiliarioTemplate = ({ data, settings }: TriagemImobiliarioTemplateProps) => {
    const styles = PdfEngine.createStyles({
        ...PdfEngine.styles,
        card: {
            padding: 15,
            backgroundColor: '#f8fafc',
            borderRadius: 5,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: '#e2e8f0',
        },
        table: {
            display: 'flex',
            width: 'auto',
            borderStyle: 'solid',
            borderWidth: 1,
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
            borderLeftWidth: 0,
            borderTopWidth: 0,
        },
        tableCell: {
            margin: 5,
            fontSize: 9,
            textAlign: 'center',
        },
        tableHeader: {
            backgroundColor: '#f1f5f9',
            fontWeight: 'bold',
        },
        watermarkImage: {
            position: 'absolute',
            top: '30%',
            left: '25%',
            width: '50%',
            height: 'auto',
            opacity: settings.watermark_opacity ?? 0.15,
            transform: 'rotate(-45deg)',
            zIndex: -1,
        }
    });

    const BrandingHeader = () => (
        <View style={PdfEngine.styles.header} fixed>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {settings.logo_url ? (
                    <Image src={settings.logo_url} style={{ width: 100, height: 'auto' }} />
                ) : (
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: settings.primary_color || '#000' }}>
                        OCTOAPPS
                    </Text>
                )}
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                    Triagem Imobiliária • {new Date().toLocaleDateString('pt-BR')}
                </Text>
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

                {/* Classification Banner */}
                <View style={{
                    padding: 15,
                    backgroundColor: data.classificacao === 'VIAVEL' ? '#f0fdf4' : data.classificacao === 'ATENCAO' ? '#fffbeb' : '#fef2f2',
                    borderLeftWidth: 5,
                    borderLeftColor: data.classificacao === 'VIAVEL' ? '#22c55e' : data.classificacao === 'ATENCAO' ? '#d97706' : '#dc2626',
                    marginBottom: 20
                }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
                        {data.classificacao === 'VIAVEL' ? 'ALTA VIABILIDADE' : data.classificacao === 'ATENCAO' ? 'ANÁLISE RECOMENDADA' : 'BAIXA VIABILIDADE'}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#475569', marginTop: 5 }}>
                        {data.isAbusivo ? 'Indícios de abusividade detectados' : 'Dentro dos parâmetros de mercado'}
                    </Text>
                </View>

                {/* Economy and Sobretaxa Highlights */}
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                    {/* Economy */}
                    <View style={{ flex: 1, padding: 15, backgroundColor: '#f0fdf4', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
                        <Text style={{ fontSize: 10, color: '#15803d', fontWeight: 'bold', textTransform: 'uppercase' }}>Economia Potencial</Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#15803d', marginTop: 5 }}>
                            {formatCurrency(data.cenarioJurosSimples.economia)}
                        </Text>
                        <Text style={{ fontSize: 8, color: '#166534', marginTop: 3 }}>Projeção Juros Simples</Text>
                    </View>

                    {/* Sobretaxa */}
                    <View style={{ flex: 1, padding: 15, backgroundColor: '#f8fafc', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ fontSize: 10, color: '#475569', fontWeight: 'bold', textTransform: 'uppercase' }}>Sobretaxa Encontrada</Text>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 5 }}>
                            +{data.sobretaxaPercent.toFixed(2)}%
                        </Text>
                        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 3 }}>acima da média de mercado</Text>
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
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Praticada (Contrato)</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Média (BACEN)</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Diferença</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Taxa Mensal</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatPercent(data.taxaContratoMensal / 100)} a.m.</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatPercent(data.taxaMercadoMensal / 100)} a.m.</Text></View>
                        <View style={styles.tableCol}>
                            <Text style={{ ...styles.tableCell, color: data.taxaContratoMensal > data.taxaMercadoMensal ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                {data.taxaContratoMensal > data.taxaMercadoMensal ? '+' : ''}
                                {formatPercent((data.taxaContratoMensal - data.taxaMercadoMensal) / 100)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>Taxa Anual</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatPercent(data.taxaContratoAnual / 100)} a.a.</Text></View>
                        <View style={styles.tableCol}><Text style={styles.tableCell}>{formatPercent(data.taxaMercadoAnual / 100)} a.a.</Text></View>
                        <View style={styles.tableCol}>
                            <Text style={{ ...styles.tableCell, color: data.taxaContratoAnual > data.taxaMercadoAnual ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                {data.taxaContratoAnual > data.taxaMercadoAnual ? '+' : ''}
                                {formatPercent((data.taxaContratoAnual - data.taxaMercadoAnual) / 100)}
                            </Text>
                        </View>
                    </View>
                </View>

                <BrandingFooter />
            </Page>
        </Document>
    );
};
