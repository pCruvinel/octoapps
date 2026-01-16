import { supabase } from '../lib/supabase';
import { Mistral } from '@mistralai/mistralai';
import { GoogleGenAI } from '@google/genai';
import {
    OCRSettings,
    OCRProvider,
    OCRExtractionResult,
    OCRCategory,
    DEFAULT_FIELDS,
    OCRFieldConfig
} from '../types/ocr.types';

export class OCRService {
    /**
     * Main entry point for document extraction
     */
    async extractFromDocument(
        file: File,
        category: OCRCategory,
        userId: string
    ): Promise<OCRExtractionResult> {
        const startTime = Date.now();
        let provider: OCRProvider = 'GEMINI';

        try {
            // 1. Fetch Settings & Configs
            const settings = await this.getSettings(userId);
            if (!settings) throw new Error('OCR settings not configured for this user');

            const fields = await this.getOrCreateFieldConfigs(userId, category);
            const activeFields = fields.filter(f => f.is_enabled);

            if (activeFields.length === 0) {
                throw new Error(`No active fields configured for category ${category}`);
            }

            // 2. Prepare Prompt & File
            // 2. Prepare Prompt & File
            let additionalContext: string | null = null;
            if (category === 'EMPRESTIMOS_VEICULOS') additionalContext = settings.additional_context_emprestimos || null;
            else if (category === 'IMOBILIARIO') additionalContext = settings.additional_context_imobiliario || null;
            else if (category === 'CARTAO_CREDITO') additionalContext = settings.additional_context_cartao || null;

            const prompt = this.buildSystemPrompt(category, activeFields, additionalContext);
            const base64File = await this.fileToBase64(file);

            // 3. Try Primary Provider (Gemini)
            let result: any = null;
            let error: string | null = null;

            if (settings.gemini_enabled && settings.gemini_api_key_encrypted) {
                try {
                    result = await this.extractWithGemini(
                        base64File,
                        file.type,
                        settings.gemini_api_key_encrypted,
                        settings.gemini_model,
                        prompt
                    );
                    provider = 'GEMINI';
                } catch (e: any) {
                    console.warn('Gemini extraction failed:', e);
                    error = e.message;

                    // Fallback to Mistral if configured
                    if (settings.fallback_enabled && settings.mistral_enabled && settings.mistral_api_key_encrypted) {
                        console.log('Falling back to Mistral...');
                        try {
                            result = await this.extractWithMistral(
                                base64File,
                                file.type,
                                settings.mistral_api_key_encrypted,
                                settings.mistral_model,
                                prompt
                            );
                            provider = 'MISTRAL';
                            error = null;
                        } catch (mistralError: any) {
                            console.error('Mistral fallback failed:', mistralError);
                            throw new Error(`Primary and fallback providers failed. Gemini: ${e.message}. Mistral: ${mistralError.message}`);
                        }
                    } else {
                        throw e;
                    }
                }
            } else if (settings.mistral_enabled && settings.mistral_api_key_encrypted) {
                // Only Mistral enabled
                result = await this.extractWithMistral(
                    base64File,
                    file.type,
                    settings.mistral_api_key_encrypted,
                    settings.mistral_model,
                    prompt
                );
                provider = 'MISTRAL';
            } else {
                throw new Error('No OCR providers are enabled or configured');
            }

            // 4. Process Result
            const processingTimeMs = Date.now() - startTime;
            const extractionResult: OCRExtractionResult = {
                success: true,
                provider,
                data: result.data,
                missingFields: this.identifyMissingFields(result.data, activeFields),
                processingTimeMs,
                tokensUsed: result.usage
            };

            // 5. Log Success
            await this.logExtraction({
                userId,
                fileName: file.name,
                fileSize: file.size,
                category,
                provider,
                status: 'SUCCESS',
                extractedFields: result.data,
                fieldsFound: Object.keys(result.data).length,
                processingTimeMs,
                tokensInput: result.usage?.input,
                tokensOutput: result.usage?.output
            });

            return extractionResult;

        } catch (error: any) {
            // Log Failure
            await this.logExtraction({
                userId,
                fileName: file.name,
                fileSize: file.size,
                category,
                provider,
                status: 'FAILED',
                errorMessage: error.message,
                processingTimeMs: Date.now() - startTime
            });

            return {
                success: false,
                provider,
                data: {},
                missingFields: [],
                processingTimeMs: Date.now() - startTime,
                error: error.message
            };
        }
    }

    // --- Helpers ---

    private async getSettings(userId: string): Promise<OCRSettings | null> {
        const { data, error } = await supabase
            .from('ocr_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') console.error('Error fetching OCR settings:', error);
        if (!data) return null;

        return {
            ...data,
            user_id: data.user_id as string,
            gemini_model: data.gemini_model || 'gemini-2.0-flash',
            gemini_enabled: data.gemini_enabled ?? true,
            mistral_model: data.mistral_model || 'mistral-ocr-latest',
            mistral_enabled: data.mistral_enabled ?? true,
            fallback_enabled: data.fallback_enabled ?? true,
            timeout_seconds: data.timeout_seconds || 60,
            additional_context_emprestimos: data.additional_context_emprestimos,
            additional_context_imobiliario: data.additional_context_imobiliario,
            additional_context_cartao: data.additional_context_cartao
        };
    }

    private async getOrCreateFieldConfigs(userId: string, category: OCRCategory): Promise<OCRFieldConfig[]> {
        const { data: existing, error } = await supabase
            .from('ocr_field_configs')
            .select('*')
            .eq('user_id', userId)
            .eq('category', category)
            .order('display_order');

        if (existing && existing.length > 0) {
            return existing.map(f => ({
                ...f,
                user_id: f.user_id as string,
                field_type: f.field_type as string,
                is_required: f.is_required ?? false,
                is_enabled: f.is_enabled ?? true,
                display_order: f.display_order ?? 0
            }));
        }

        // Seed defaults if empty
        const defaults = DEFAULT_FIELDS[category];
        const toInsert = defaults.map(f => ({ ...f, user_id: userId }));

        const { data: created, error: insertError } = await supabase
            .from('ocr_field_configs')
            .insert(toInsert)
            .select('*');

        if (insertError) throw insertError;

        return (created || []).map(f => ({
            ...f,
            user_id: f.user_id as string,
            field_type: f.field_type as string,
            is_required: f.is_required ?? false,
            is_enabled: f.is_enabled ?? true,
            display_order: f.display_order ?? 0
        }));
    }

    private buildSystemPrompt(category: OCRCategory, fields: OCRFieldConfig[], additionalContext?: string | null): string {
        const fieldsList = fields.map(f =>
            `- "${f.field_key}" (${f.field_label}): ${f.extraction_hint || ''} [Type: ${f.field_type}]`
        ).join('\n');

        let prompt = `
Você é um especialista em OCR e extração de dados de contratos bancários e jurídicos brasileiros.

Analise o documento fornecido e extraia os seguintes campos específicos.
Retorne APENAS um objeto JSON válido. NÃO inclua formatação markdown (como \`\`\`json).

Categoria: ${category}

Campos para extrair:
${fieldsList}

Regras:
1. Se um campo não for encontrado claramente, defina como null. NÃO invente dados.
2. Para datas, use formato YYYY-MM-DD.
3. Para números/valores monetários, retorne como números puros (ex: 1500.50), não strings ("R$ 1.500,50").
4. Remova separadores de milhares (pontos) e substitua vírgula decimal por ponto.
5. Identifique "Capitalização Diária" vs "Mensal" se aplicável.
    `;

        if (additionalContext) {
            prompt += `\n\nInformações Adicionais / Contexto do Usuário:\n${additionalContext}`;
        }

        return prompt;
    }

    // --- API Providers ---

    /**
     * Gemini extraction using @google/genai SDK
     */
    private async extractWithGemini(
        base64Data: string,
        mimeType: string,
        apiKey: string,
        model: string,
        prompt: string
    ) {
        const ai = new GoogleGenAI({ apiKey });

        const result = await ai.models.generateContent({
            model: model || 'gemini-2.0-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        const textResponse = result.text;
        if (!textResponse) throw new Error('Empty response from Gemini');

        return {
            data: JSON.parse(textResponse),
            usage: {
                input: result.usageMetadata?.promptTokenCount || 0,
                output: result.usageMetadata?.candidatesTokenCount || 0
            }
        };
    }

    /**
     * Mistral OCR extraction using @mistralai/mistralai SDK
     */
    private async extractWithMistral(
        base64Data: string,
        mimeType: string,
        apiKey: string,
        model: string,
        prompt: string
    ) {
        const client = new Mistral({ apiKey });

        // Determine document type for data URL
        const dataUrl = `data:${mimeType};base64,${base64Data}`;

        // Use the dedicated OCR endpoint
        const response = await client.ocr.process({
            model: model || 'mistral-ocr-latest',
            document: {
                type: 'document_url',
                documentUrl: dataUrl
            }
        });

        // OCR returns pages with markdown content - we need to parse it
        let fullText = '';
        if (response.pages && response.pages.length > 0) {
            fullText = response.pages.map(p => p.markdown).join('\n');
        }

        // Now use chat to extract structured data from the OCR text
        const chatResponse = await client.chat.complete({
            model: 'mistral-large-latest',
            messages: [
                {
                    role: 'user',
                    content: `${prompt}\n\nDocumento OCR:\n${fullText}`
                }
            ],
            responseFormat: { type: 'json_object' }
        });

        const content = chatResponse.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from Mistral');

        return {
            data: JSON.parse(typeof content === 'string' ? content : JSON.stringify(content)),
            usage: {
                input: chatResponse.usage?.promptTokens || 0,
                output: chatResponse.usage?.completionTokens || 0
            }
        };
    }

    private async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data:xxx;base64, prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    private identifyMissingFields(data: any, fields: OCRFieldConfig[]): string[] {
        const missing: string[] = [];
        fields.forEach(f => {
            if (f.is_required && (data[f.field_key] === null || data[f.field_key] === undefined)) {
                missing.push(f.field_key);
            }
        });
        return missing;
    }

    private async logExtraction(log: any) {
        try {
            await supabase.from('ocr_logs').insert({
                user_id: log.userId,
                file_name: log.fileName,
                file_size_bytes: log.fileSize,
                category: log.category,
                provider_used: log.provider,
                status: log.status,
                extracted_fields: log.extractedFields,
                fields_found: log.fieldsFound || 0,
                processing_time_ms: log.processingTimeMs,
                tokens_input: log.tokensInput,
                tokens_output: log.tokensOutput,
                error_message: log.errorMessage
            });
        } catch (e) {
            console.error('Failed to write OCR logs:', e);
        }
    }
}

export const ocrService = new OCRService();
