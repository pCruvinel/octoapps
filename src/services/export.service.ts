import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export interface PeticaoExportData {
  nome: string;
  tipo: string;
  status: string;
  conteudo: string;
  clienteNome?: string;
  numeroContrato?: string;
  instituicaoFinanceira?: string;
  valorContrato?: string;
}

class ExportService {
  /**
   * Exporta petição para formato PDF
   */
  async exportToPdf(data: PeticaoExportData): Promise<void> {
    try {
      // Criar documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Configurações de margem e dimensões
      const margins = {
        top: 20,
        left: 20,
        right: 20,
        bottom: 20,
      };
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margins.left - margins.right;
      let yPosition = margins.top;

      // Função auxiliar para adicionar nova página se necessário
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margins.bottom) {
          doc.addPage();
          yPosition = margins.top;
          return true;
        }
        return false;
      };

      // Função auxiliar para adicionar texto com quebra de linha
      const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);

        const lines = doc.splitTextToSize(text, contentWidth);

        for (const line of lines) {
          checkPageBreak(fontSize * 0.4);
          doc.text(line, margins.left, yPosition);
          yPosition += fontSize * 0.4;
        }
      };

      // Adicionar conteúdo puro com quebra de linha
      const contentLines = data.conteudo.split('\n');
      for (const line of contentLines) {
        if (line.trim() === '') {
          yPosition += 4;
        } else {
          addText(line, 11, 'normal');
          yPosition += 1;
        }
      }

      // Gerar nome do arquivo
      const filename = this.generateFilename(data.nome, 'pdf');

      // Salvar PDF
      doc.save(filename);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha ao exportar PDF');
    }
  }

  /**
   * Exporta petição para formato Word (.docx)
   */
  async exportToWord(data: PeticaoExportData): Promise<void> {
    try {
      // Criar parágrafos do conteúdo puro
      const contentParagraphs = data.conteudo.split('\n').map(line => {
        if (line.trim() === '') {
          return new Paragraph({
            spacing: { after: 200 },
          });
        }
        return new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: 'Arial',
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 200 },
        });
      });

      // Criar documento apenas com o conteúdo
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: contentParagraphs,
          },
        ],
      });

      // Gerar arquivo
      const blob = await Packer.toBlob(doc);
      const filename = this.generateFilename(data.nome, 'docx');

      // Salvar arquivo
      saveAs(blob, filename);
    } catch (error) {
      console.error('Erro ao gerar Word:', error);
      throw new Error('Falha ao exportar Word');
    }
  }

  /**
   * Gera nome de arquivo baseado no nome da petição
   */
  private generateFilename(nome: string, extension: 'pdf' | 'docx'): string {
    // Remover caracteres especiais e espaços
    const cleanName = nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9]/g, '_') // Substitui caracteres especiais por _
      .replace(/_+/g, '_') // Remove múltiplos underscores consecutivos
      .toLowerCase();

    // Adicionar timestamp para evitar conflitos
    const timestamp = new Date().getTime();

    return `${cleanName}_${timestamp}.${extension}`;
  }
}

export const exportService = new ExportService();
