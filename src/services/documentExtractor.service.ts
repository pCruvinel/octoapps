/**
 * Serviço para extração de dados de documentos via automação n8n
 *
 * Este serviço envia documentos (PDF/DOC/DOCX) para um webhook n8n que:
 * 1. Faz OCR do documento
 * 2. Extrai dados específicos via IA
 * 3. Consulta taxas do Banco Central
 * 4. Retorna JSON estruturado com dados do contrato
 */

const WEBHOOK_URL = 'https://webhook.dizevolv.tech/webhook/extrator-dados';
const AUTH_TOKEN = '6ce7eb8a83de3075b09a8f88916165a0b42e206320d691154875a0777fee6ae2';
const AUTH_HEADER_NAME = 'token';

export type TipoDocumento = 'financiamento_imobiliario' | 'revisao_cartao_de_credito' | 'revisao_geral';

export interface ExtratorResponse {
  sugestao_peticao: string;
  titulo_acao: string;
  contrato_identificado: {
    credor?: string;
    devedor?: string;
    numero_contrato?: string;
    valor_financiado?: number;
    valor_bem?: number;
    valor_entrada?: number;
    valor_parcela?: number;
    numero_parcelas?: number;
    taxa_juros_contrato?: number;
    taxa_juros_mensal?: number;
    taxa_juros_anual?: number;
    data_inicio?: string;
    data_fim?: string;
    data_contrato?: string;
    data_primeiro_vencimento?: string;
    sistema_amortizacao?: string;
    // Outros campos que a API pode retornar
    [key: string]: any;
  };
}

class DocumentExtractorService {
  /**
   * Extrai dados de um documento usando a automação n8n
   *
   * @param file - Arquivo PDF/DOC/DOCX a ser processado
   * @param tipoDocumento - Tipo do documento (financiamento_imobiliario, revisao_cartao_de_credito, revisao_geral)
   * @returns Promise com os dados extraídos
   * @throws Error se a requisição falhar ou timeout
   */
  async extractDataFromDocument(
    file: File,
    tipoDocumento: TipoDocumento
  ): Promise<ExtratorResponse> {
    try {
      const formData = new FormData();
      formData.append('data', file); // n8n espera campo 'data'

      console.log('[DocumentExtractor] Iniciando extração:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        tipoDocumento,
        url: `${WEBHOOK_URL}?tipo_documento=${tipoDocumento}`,
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          valueType: value instanceof File ? 'File' : typeof value,
          fileName: value instanceof File ? value.name : null,
          fileSize: value instanceof File ? value.size : null
        }))
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 segundos timeout

      // Token no header conforme documentação
      const url = `${WEBHOOK_URL}?tipo_documento=${tipoDocumento}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          [AUTH_HEADER_NAME]: AUTH_TOKEN,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[DocumentExtractor] Response status:', response.status);
      console.log('[DocumentExtractor] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DocumentExtractor] Error response:', errorText);
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Primeiro, pegar o texto da resposta para debug
      const responseText = await response.text();
      console.log('[DocumentExtractor] Response text:', responseText);

      // Verificar se a resposta está vazia
      if (!responseText || responseText.trim() === '') {
        throw new Error('Resposta vazia do servidor. O webhook pode estar processando o documento.');
      }

      // Tentar fazer parse do JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[DocumentExtractor] Erro ao fazer parse do JSON:', parseError);
        console.error('[DocumentExtractor] Resposta recebida:', responseText);
        throw new Error(`Resposta inválida do servidor: ${responseText.substring(0, 100)}`);
      }

      console.log('[DocumentExtractor] Extração concluída:', data);

      return data as ExtratorResponse;
    } catch (error) {
      console.error('[DocumentExtractor] Erro na extração:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Tempo limite excedido. O documento pode ser muito grande ou complexo.');
        }
        throw new Error(`Erro ao extrair dados: ${error.message}`);
      }

      throw new Error('Erro desconhecido ao extrair dados do documento');
    }
  }

  /**
   * Valida se o arquivo é suportado pela automação
   */
  isFileTypeSupported(file: File): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];

    return supportedTypes.includes(file.type);
  }
}

export const documentExtractorService = new DocumentExtractorService();
