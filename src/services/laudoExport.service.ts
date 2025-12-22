'use client';

import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import type { DetalhadaDashboardData, KPIData, EvolutionDataPoint } from '@/components/calculations/results';

/**
 * Interface para dados do laudo pericial
 */
export interface LaudoExportData {
    // Identificação
    credor: string;
    devedor: string;
    contratoNum?: string;
    numeroProcesso?: string;

    // KPIs
    kpis: KPIData;

    // Evolução
    evolucao: EvolutionDataPoint[];

    // Parâmetros
    parametros: {
        serieBacen: string;
        taxaUsada: number;
        dataConsulta: string;
        metodologia: string;
        sistemaAmortizacao: string;
        capitalizacao: 'MENSAL' | 'DIARIA';
    };

    // Tabelas de apêndice
    ap01?: any[];
    ap02?: any[];
    ap03?: any[];

    // Tipo de laudo
    tipo: 'ANALISE_PREVIA' | 'LAUDO_COMPLETO';
}

/**
 * Formata valor para moeda brasileira
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Formata porcentagem
 */
function formatPercent(value: number, decimals = 2): string {
    return value.toFixed(decimals) + '%';
}

/**
 * Formata data para padrão brasileiro
 */
function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

/**
 * Classe para exportação de laudos periciais em PDF
 */
class LaudoExportService {
    private margins = { top: 20, left: 20, right: 20, bottom: 25 };
    private pageWidth = 210; // A4 width in mm
    private pageHeight = 297; // A4 height in mm
    private contentWidth = 170; // 210 - 20 - 20

    /**
     * Exporta laudo para PDF
     */
    async exportToPdf(data: LaudoExportData): Promise<void> {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            let yPos = this.margins.top;

            // ========== CAPA ==========
            yPos = this.addCapa(doc, data, yPos);

            // ========== PÁGINA 2: SUMÁRIO EXECUTIVO ==========
            doc.addPage();
            yPos = this.margins.top;
            yPos = this.addSumarioExecutivo(doc, data, yPos);

            // ========== PÁGINA 3: METODOLOGIA ==========
            doc.addPage();
            yPos = this.margins.top;
            yPos = this.addMetodologia(doc, data, yPos);

            // ========== PÁGINAS SEGUINTES: APÊNDICES ==========
            if (data.ap01 && data.ap01.length > 0) {
                doc.addPage();
                yPos = this.margins.top;
                yPos = this.addApendice(doc, 'AP01', 'Evolução da Dívida (Cenário Banco)', data.ap01, yPos);
            }

            if (data.ap02 && data.ap02.length > 0) {
                doc.addPage();
                yPos = this.margins.top;
                yPos = this.addApendice(doc, 'AP02', 'Evolução Recalculada', data.ap02, yPos);
            }

            // ========== MARCA D'ÁGUA (se análise prévia) ==========
            if (data.tipo === 'ANALISE_PREVIA') {
                this.addMarcaDagua(doc);
            }

            // Salvar arquivo
            const timestamp = new Date().getTime();
            const filename = `laudo_pericial_${data.contratoNum || 'sem_contrato'}_${timestamp}.pdf`;
            doc.save(filename);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw new Error('Falha ao exportar laudo PDF');
        }
    }

    /**
     * Adiciona capa profissional
     */
    private addCapa(doc: jsPDF, data: LaudoExportData, yPos: number): number {
        // Logo placeholder (pode ser substituído por logo real)
        doc.setFillColor(59, 130, 246); // blue-500
        doc.rect(this.margins.left, yPos, 50, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('OCTOAPPS', this.margins.left + 5, yPos + 10);

        yPos += 40;

        // Título
        doc.setTextColor(30, 41, 59); // slate-800
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('PARECER TÉCNICO PERICIAL', this.pageWidth / 2, yPos, { align: 'center' });

        yPos += 10;
        doc.setFontSize(18);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text('Revisional de Contrato Bancário', this.pageWidth / 2, yPos, { align: 'center' });

        yPos += 30;

        // Linha divisória
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.line(this.margins.left, yPos, this.pageWidth - this.margins.right, yPos);

        yPos += 20;

        // Informações das partes
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('PARTES:', this.margins.left, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.text(`Autor/Requerente: ${data.devedor}`, this.margins.left + 10, yPos);

        yPos += 7;
        doc.text(`Réu/Requerido: ${data.credor}`, this.margins.left + 10, yPos);

        yPos += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('REFERÊNCIA:', this.margins.left, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.text(`Contrato nº: ${data.contratoNum || 'Não informado'}`, this.margins.left + 10, yPos);

        if (data.numeroProcesso) {
            yPos += 7;
            doc.text(`Processo nº: ${data.numeroProcesso}`, this.margins.left + 10, yPos);
        }

        yPos += 30;

        // Box de resumo
        doc.setFillColor(240, 253, 244); // green-50
        doc.setDrawColor(34, 197, 94); // green-500
        doc.roundedRect(this.margins.left, yPos, this.contentWidth, 35, 3, 3, 'FD');

        yPos += 12;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52); // green-800
        doc.text('VALOR A RESTITUIR', this.pageWidth / 2, yPos, { align: 'center' });

        yPos += 12;
        doc.setFontSize(22);
        doc.text(formatCurrency(data.kpis.economiaTotal), this.pageWidth / 2, yPos, { align: 'center' });

        // Data no rodapé da capa
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(
            `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
            this.pageWidth / 2,
            this.pageHeight - this.margins.bottom,
            { align: 'center' }
        );

        return yPos;
    }

    /**
     * Adiciona sumário executivo
     */
    private addSumarioExecutivo(doc: jsPDF, data: LaudoExportData, yPos: number): number {
        // Título
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('1. SUMÁRIO EXECUTIVO', this.margins.left, yPos);

        yPos += 15;

        // Texto introdutório
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85); // slate-700

        const intro = `Trata-se de análise técnica de contrato de ${data.parametros.metodologia} celebrado entre ${data.devedor} (Autor) e ${data.credor} (Réu), onde constatou-se a aplicação de taxa de juros de ${formatPercent(data.kpis.taxaPraticada)} a.m., superior à média de mercado de ${formatPercent(data.kpis.taxaMercado)} a.m.`;

        const introLines = doc.splitTextToSize(intro, this.contentWidth);
        doc.text(introLines, this.margins.left, yPos);
        yPos += introLines.length * 5 + 10;

        // Tabela de resumo
        doc.setFont('helvetica', 'bold');
        doc.text('Quadro Resumo:', this.margins.left, yPos);
        yPos += 8;

        const summaryData = [
            ['Descrição', 'Valor'],
            ['Total Cobrado pelo Banco', formatCurrency(data.kpis.parcelaOriginalValor * (data.evolucao.length || 48))],
            ['Total Devido (Recalculado)', formatCurrency(data.kpis.novaParcelaValor * (data.evolucao.length || 48))],
            ['Diferença a Restituir (Simples)', formatCurrency(data.kpis.restituicaoSimples)],
            ['Diferença a Restituir (Em Dobro - Art. 42 CDC)', formatCurrency(data.kpis.restituicaoEmDobro)],
            ['Economia na Parcela', formatCurrency(data.kpis.parcelaOriginalValor - data.kpis.novaParcelaValor)],
        ];

        // Header da tabela
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(this.margins.left, yPos, this.contentWidth, 8, 'F');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text('Descrição', this.margins.left + 2, yPos + 5);
        doc.text('Valor', this.margins.left + 120, yPos + 5);
        yPos += 10;

        // Linhas da tabela
        doc.setFont('helvetica', 'normal');
        for (let i = 1; i < summaryData.length; i++) {
            if (i % 2 === 0) {
                doc.setFillColor(248, 250, 252); // slate-50
                doc.rect(this.margins.left, yPos - 5, this.contentWidth, 8, 'F');
            }
            doc.text(summaryData[i][0], this.margins.left + 2, yPos);
            doc.text(summaryData[i][1], this.margins.left + 120, yPos);
            yPos += 8;
        }

        yPos += 15;

        // Classificação
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Classificação de Abusividade:', this.margins.left, yPos);

        yPos += 8;
        const classificacao = data.kpis.classificacaoAbuso;
        const cores: Record<string, [number, number, number]> = {
            'BAIXA': [100, 116, 139],
            'MEDIA': [217, 119, 6],
            'ALTA': [234, 88, 12],
            'CRITICA': [220, 38, 38],
        };
        doc.setTextColor(...(cores[classificacao] || cores.MEDIA));
        doc.setFont('helvetica', 'bold');
        doc.text(classificacao, this.margins.left + 60, yPos);

        return yPos;
    }

    /**
     * Adiciona seção de metodologia
     */
    private addMetodologia(doc: jsPDF, data: LaudoExportData, yPos: number): number {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('2. METODOLOGIA APLICADA', this.margins.left, yPos);

        yPos += 15;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);

        const metodologiaText = `
O presente laudo foi elaborado utilizando os seguintes critérios técnicos:

• Sistema de Amortização: ${data.parametros.sistemaAmortizacao}
• Tipo de Capitalização: ${data.parametros.capitalizacao === 'DIARIA' ? 'Diária (expurgada)' : 'Mensal'}
• Taxa de Referência: Série Bacen nº ${data.parametros.serieBacen}
• Taxa de Mercado Aplicada: ${formatPercent(data.parametros.taxaUsada)} a.m.
• Data da Consulta Bacen: ${formatDate(data.parametros.dataConsulta)}

As fórmulas utilizadas seguem os padrões aceitos pela jurisprudência pátria para revisão de contratos bancários, com precisão de 8 casas decimais para evitar erros de arredondamento em operações de longo prazo.
    `.trim();

        const lines = doc.splitTextToSize(metodologiaText, this.contentWidth);
        doc.text(lines, this.margins.left, yPos);

        return yPos + lines.length * 5;
    }

    /**
     * Adiciona apêndice com tabela
     */
    private addApendice(doc: jsPDF, codigo: string, titulo: string, dados: any[], yPos: number): number {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${codigo} - ${titulo}`, this.margins.left, yPos);

        yPos += 10;

        // Cabeçalho da tabela
        doc.setFontSize(8);
        doc.setFillColor(241, 245, 249);
        doc.rect(this.margins.left, yPos, this.contentWidth, 7, 'F');

        const headers = ['Nº', 'Vencimento', 'Saldo Ant.', 'Juros', 'Amort.', 'Parcela', 'Saldo Dev.'];
        const colWidths = [12, 25, 28, 25, 25, 28, 27];
        let xPos = this.margins.left;

        doc.setFont('helvetica', 'bold');
        headers.forEach((h, i) => {
            doc.text(h, xPos + 1, yPos + 5);
            xPos += colWidths[i];
        });

        yPos += 9;
        doc.setFont('helvetica', 'normal');

        // Limita a 30 linhas por página
        const maxRows = Math.min(dados.length, 30);
        for (let i = 0; i < maxRows; i++) {
            const row = dados[i];
            xPos = this.margins.left;

            if (i % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(this.margins.left, yPos - 3, this.contentWidth, 6, 'F');
            }

            doc.text(String(row.n || row.mes || i + 1), xPos + 1, yPos);
            xPos += colWidths[0];

            doc.text(formatDate(row.vencimento || row.data || ''), xPos + 1, yPos);
            xPos += colWidths[1];

            doc.text(this.formatCompact(row.saldoAnterior || row.saldo_anterior || 0), xPos + 1, yPos);
            xPos += colWidths[2];

            doc.text(this.formatCompact(row.juros || 0), xPos + 1, yPos);
            xPos += colWidths[3];

            doc.text(this.formatCompact(row.amortizacao || 0), xPos + 1, yPos);
            xPos += colWidths[4];

            doc.text(this.formatCompact(row.parcela || row.pmt || 0), xPos + 1, yPos);
            xPos += colWidths[5];

            doc.text(this.formatCompact(row.saldoDevedor || row.saldo_devedor || 0), xPos + 1, yPos);

            yPos += 6;

            // Verificar quebra de página
            if (yPos > this.pageHeight - this.margins.bottom - 10) {
                doc.addPage();
                yPos = this.margins.top;
            }
        }

        if (dados.length > maxRows) {
            yPos += 5;
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`... e mais ${dados.length - maxRows} linhas. Tabela completa em anexo digital.`, this.margins.left, yPos);
        }

        return yPos;
    }

    /**
     * Adiciona marca d'água em todas as páginas
     */
    private addMarcaDagua(doc: jsPDF): void {
        const totalPages = doc.getNumberOfPages();

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(40);
            doc.setTextColor(200, 200, 200);
            doc.setFont('helvetica', 'bold');

            // Rotaciona e adiciona marca d'água diagonal
            doc.text('SIMULAÇÃO PRELIMINAR', this.pageWidth / 2, this.pageHeight / 2, {
                align: 'center',
                angle: 45,
            });
        }
    }

    /**
     * Formata valor de forma compacta para caber em colunas pequenas
     */
    private formatCompact(value: number): string {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        }
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toFixed(2);
    }
}

export const laudoExportService = new LaudoExportService();
