import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { UserDocumentSettings } from '../pdf-engine/DocumentTypes';
import { PdfEngine } from '../pdf-engine/PdfEngine';
import type { PeticaoExportData } from '@/services/export.service';

interface PeticaoTemplateProps {
    data: PeticaoExportData;
    settings: UserDocumentSettings;
}

export const PeticaoTemplate = ({ data, settings }: PeticaoTemplateProps) => {
    const styles = PdfEngine.createStyles({
        ...PdfEngine.styles,
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
                        {data.nome || 'Petição'}
                    </Text>
                )}
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                    {settings.show_page_numbers ? `Pág. ` : ''}
                    <Text render={({ pageNumber, totalPages }) => settings.show_page_numbers ? `${pageNumber}/${totalPages}` : ''} />
                </Text>
            </View>
        </View>
    );

    const BrandingFooter = () => (
        <View style={PdfEngine.styles.footer} fixed>
            <Text>{settings.footer_text || 'Documento jurídico gerado pelo sistema OctoApps'}</Text>
        </View>
    );

    const Watermark = () => {
        if (!settings.watermark_url) return null;
        return <Image src={settings.watermark_url} style={styles.watermarkImage} fixed />;
    }

    // Split content by newline to respect paragraphs
    const contentLines = data.conteudo ? data.conteudo.split('\n') : [];

    return (
        <Document>
            <Page size="A4" style={PdfEngine.styles.page}>
                <Watermark />
                <BrandingHeader />

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
                        {data.nome.toUpperCase()}
                    </Text>

                    {contentLines.map((line, index) => (
                        <Text key={index} style={[PdfEngine.styles.text, {
                            marginBottom: (line.trim() === '') ? 10 : 5 // Bigger margin for empty lines
                        }]}>
                            {line}
                        </Text>
                    ))}
                </View>

                <BrandingFooter />
            </Page>
        </Document>
    );
};
