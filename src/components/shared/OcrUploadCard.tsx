'use client';

import * as React from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ocrService } from '@/services/ocr.service';
import { supabase } from '@/lib/supabase';
import type { OCRCategory } from '@/types/ocr.types';
import { cn } from '@/lib/utils';

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
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Formato não suportado. Use PDF, PNG ou JPG.');
            return;
        }

        // Validate file size (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
            toast.error('Arquivo muito grande. Máximo 25MB.');
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

        const file = e.dataTransfer.files?.[0];
        if (file) handleFileProcess(file);
    };

    return (
        <div
            className={cn(
                "relative group border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
                isDragging
                    ? "border-blue-400 bg-blue-50/50"
                    : "border-slate-300 bg-slate-50/30 hover:border-slate-400 hover:bg-slate-100/50",
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
            />
            <div className="flex items-center gap-3 px-4 py-3">
                {isUploading ? (
                    <>
                        <div className="p-2 rounded-md bg-blue-100">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700">Processando contrato...</p>
                            <p className="text-xs text-slate-500">Extração automática com IA</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={cn(
                            "p-2 rounded-md transition-colors",
                            isDragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        )}>
                            <Upload className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700">
                                {isDragging ? "Solte o arquivo" : "Importar contrato"}
                            </p>
                            <p className="text-xs text-slate-500">
                                Arraste ou clique • PDF, PNG, JPG
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
