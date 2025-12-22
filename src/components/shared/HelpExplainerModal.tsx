import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Import contents as raw strings due to Vite resource query
import contentEmprestimo from '@/content/help/analise-previa-emprestimo.md?raw';
import contentVeiculos from '@/content/help/analise-previa-veiculos.md?raw';
import contentImobiliario from '@/content/help/analise-previa-imobiliario.md?raw';
import contentRevisionalGeral from '@/content/help/calculo-revisional-geral.md?raw';
import contentRevisionalImob from '@/content/help/calculo-revisional-imobiliario.md?raw';

export type HelpModuleType =
    | 'ANALISE_PREVIA_EMPRESTIMO'
    | 'ANALISE_PREVIA_VEICULOS'
    | 'ANALISE_PREVIA_IMOBILIARIO'
    | 'CALCULO_REVISIONAL_GERAL'
    | 'CALCULO_REVISIONAL_VEICULOS'
    | 'CALCULO_REVISIONAL_IMOBILIARIO';

const contentMap: Record<HelpModuleType, string> = {
    'ANALISE_PREVIA_EMPRESTIMO': contentEmprestimo,
    'ANALISE_PREVIA_VEICULOS': contentVeiculos,
    'ANALISE_PREVIA_IMOBILIARIO': contentImobiliario,
    'CALCULO_REVISIONAL_GERAL': contentRevisionalGeral,
    'CALCULO_REVISIONAL_VEICULOS': contentRevisionalGeral,
    'CALCULO_REVISIONAL_IMOBILIARIO': contentRevisionalImob,
};

interface HelpExplainerModalProps {
    moduleType: HelpModuleType;
    iconClassName?: string;
    triggerLabel?: string;
}

export function HelpExplainerModal({ moduleType, iconClassName, triggerLabel }: HelpExplainerModalProps) {
    const content = contentMap[moduleType];

    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 ${iconClassName}`}
                            >
                                <HelpCircle className="w-5 h-5" />
                                <span className="sr-only">Entenda o cálculo</span>
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Entenda como os cálculos são feitos</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw]">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-slate-500" />
                        Metodologia de Cálculo
                    </DialogTitle>
                    <DialogDescription>
                        Detalhes técnicos sobre as fórmulas e parâmetros utilizados nesta análise.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 prose prose-slate max-w-none dark:prose-invert prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-a:text-blue-600 prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-white prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:p-4 prose-blockquote:not-italic prose-blockquote:text-slate-700">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-4 border rounded-lg"><table className="w-full text-sm text-left text-slate-600" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b" {...props} />,
                            th: ({ node, ...props }) => <th className="px-6 py-3 font-semibold" {...props} />,
                            td: ({ node, ...props }) => <td className="px-6 py-4 border-b last:border-0" {...props} />,
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-6 mb-3 text-slate-800" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-4 mb-2 text-slate-700" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-4" {...props} />,
                            li: ({ node, ...props }) => <li className="text-slate-600" {...props} />,
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </DialogContent>
        </Dialog>
    );
}

