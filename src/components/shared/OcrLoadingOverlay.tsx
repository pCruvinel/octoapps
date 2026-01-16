
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Loader2, FileText, Scan, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLogo } from './AnimatedLogo';

interface OcrLoadingOverlayProps {
    isOpen: boolean;
}

const MESSAGES = [
    { text: "Analisando documento...", icon: FileText },
    { text: "Identificando campos do contrato...", icon: Scan },
    { text: "Extraindo dados financeiros...", icon: BrainCircuit },
    { text: "Processando taxas e valores...", icon: Loader2 },
    { text: "Validando informações...", icon: CheckCircle2 },
    { text: "Finalizando extração...", icon: CheckCircle2 }
];

export function OcrLoadingOverlay({ isOpen }: OcrLoadingOverlayProps) {
    const [messageIndex, setMessageIndex] = React.useState(0);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    React.useEffect(() => {
        if (!isOpen) {
            setMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % MESSAGES.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Prevent scrolling when open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    const CurrentIcon = MESSAGES[messageIndex].icon;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md"
                >
                    <div className="flex flex-col items-center max-w-md p-6 text-center space-y-8">
                        <div className="relative">
                            <AnimatedLogo className="w-32 h-32" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                IA Trabalhando
                            </h2>
                            
                            <div className="h-8 relative overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={messageIndex}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-muted-foreground font-medium"
                                    >
                                        {MESSAGES[messageIndex].text}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ 
                                    width: ["0%", "100%"],
                                    transition: { 
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }
                                }}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground/50">
                            Isso pode levar alguns segundos. Por favor, não feche a página.
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
