'use client';

import * as React from 'react';
import { Upload, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { ocrService } from '@/services/ocr.service';
import { supabase } from '@/lib/supabase';
import type { OCRCategory } from '@/types/ocr.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { OcrLoadingOverlay } from './OcrLoadingOverlay';

interface OcrUploadCardProps {
    category: OCRCategory;
    onDataExtracted: (data: any) => void;
    className?: string;
}

/**
 * Componente reutilizável de upload OCR com design minimalista e drag-and-drop.
 * Usa borda pontilhada para indicar visualmente a zona de drop.
 */
export function OcrUploadCard({
    category,
    onDataExtracted,
    className,
}: OcrUploadCardProps) {
    const [isUploading, setIsUploading] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileProcess = async (file: File) => {
        // Validate file type
        if (!file.type.match('application/pdf') && !file.type.match('image.*')) {
            toast.error('Formato inválido. Use PDF ou Imagem.');
            return;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) { 
            toast.error('Arquivo muito grande. Máximo 50MB.');
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

            const result = await ocrService.extractFromDocument(file, category, user.id);

            if (result.success && result.data) {
                console.log('[OcrUploadCard] Extracted Data:', result.data);
                toast.success('Dados extraídos com sucesso!');
                onDataExtracted(result.data);
            } else {
                toast.error(result.error || 'Erro ao processar documento');
            }
        } catch (error) {
            console.error('[OcrUploadCard] Erro:', error);
            toast.error('Erro ao processar documento');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFileProcess(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0]; 
        if (file) handleFileProcess(file);
    };

    return (
        <>
            <OcrLoadingOverlay isOpen={isUploading} />
            
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                    isUploading && "opacity-50 pointer-events-none",
                    className
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-muted rounded-full">
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            Arraste seu arquivo aqui ou clique para selecionar
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Suporta PDF, PNG, JPG (Máx. 50MB)
                        </p>
                    </div>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            'Selecionar Arquivo'
                        )}
                    </Button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                />
            </div>
        </>
    );
}
