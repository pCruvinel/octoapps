import { useState, useRef } from 'react';
import { Button } from '../../ui/button';
import { Loader2, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ocrService } from '@/services/ocr.service';
import { OCRCategory } from '@/types/ocr.types';
import { useAuth } from '@/hooks/useAuth';

interface ContractUploadButtonProps {
    category: OCRCategory;
    onDataExtracted: (data: any) => void;
    className?: string;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function ContractUploadButton({
    category,
    onDataExtracted,
    className,
    variant = 'outline'
}: ContractUploadButtonProps) {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Validations
        if (!user) {
            toast.error('Usuário não autenticado');
            return;
        }

        const MAX_SIZE = 20 * 1024 * 1024; // 20MB
        if (file.size > MAX_SIZE) {
            toast.error('O arquivo deve ter no máximo 20MB');
            return;
        }

        const type = file.type;
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(type)) {
            toast.error('Formato não suportado. Use PDF, JPG ou PNG.');
            return;
        }

        try {
            setIsUploading(true);
            const toastId = toast.loading('Processando contrato com IA...');

            const result = await ocrService.extractFromDocument(file, category, user.id);

            if (result.success) {
                toast.dismiss(toastId);

                const fieldCount = Object.keys(result.data).length;
                const missingCount = result.missingFields.length;

                let msg = `${fieldCount} campos extraídos com sucesso.`;
                if (missingCount > 0) msg += ` ${missingCount} campos não encontrados.`;

                toast.success('Extração concluída!', { description: msg });

                onDataExtracted(result.data);
            } else {
                toast.dismiss(toastId);
                toast.error('Falha na extração', { description: result.error || 'Erro desconhecido' });
            }
        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error('Erro ao processar', { description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
            />
            <Button
                variant={variant}
                onClick={handleClick}
                disabled={isUploading}
                className={`gap-2 ${className}`}
            >
                {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4" />
                )}
                {isUploading ? 'Analisando...' : 'Inserir Contrato (IA)'}
            </Button>
        </>
    );
}
