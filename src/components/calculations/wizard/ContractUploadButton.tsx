'use client';

import * as React from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ocrService } from '@/services/ocr.service';
import { supabase } from '@/lib/supabase';
import type { OCRCategory } from '@/types/ocr.types';

interface ContractUploadButtonProps {
    category: OCRCategory;
    onDataExtracted: (data: any) => void;
    variant?: 'default' | 'outline' | 'ghost';
    className?: string;
}

export function ContractUploadButton({
    category,
    onDataExtracted,
    variant = 'default',
    className = '',
}: ContractUploadButtonProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Formato não suportado. Use PDF, PNG ou JPG.');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Arquivo muito grande. Máximo 10MB.');
            return;
        }

        setIsUploading(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            toast.info('Processando contrato com IA...');

            const result = await ocrService.extractFromDocument(file, category, user.id);

            if (result.success && result.data) {
                toast.success('Dados extraídos com sucesso!');
                onDataExtracted(result.data);
            } else {
                toast.error(result.error || 'Erro ao processar documento');
            }
        } catch (error) {
            console.error('[ContractUploadButton] Erro:', error);
            toast.error('Erro ao processar documento');
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
            />
            <Button
                type="button"
                variant={variant}
                className={className}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                {isUploading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                    </>
                ) : (
                    <>
                        <Upload className="w-4 h-4 mr-2" />
                        Importar Contrato
                    </>
                )}
            </Button>
        </>
    );
}
