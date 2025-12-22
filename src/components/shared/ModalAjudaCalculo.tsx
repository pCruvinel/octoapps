import React, { useMemo } from 'react';
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface ModalAjudaCalculoProps {
    moduleType: HelpModuleType;
    iconClassName?: string;
    triggerLabel?: string;
}

interface ParsedSection {
    id: string;
    title: string;
    content: string;
}

export function ModalAjudaCalculo({ moduleType, iconClassName }: ModalAjudaCalculoProps) {
    const rawContent = contentMap[moduleType];

    const { intro, sections } = useMemo(() => {
        // Split by H2 headers (## ) based on the markdown structure
        // The split regex finds "## " at the start of a line
        const parts = rawContent.split(/\n## /);

        const introContent = parts[0];
        const sectionParts = parts.slice(1);

        const parsedSections: ParsedSection[] = sectionParts.map((part, index) => {
            const firstLineBreak = part.indexOf('\n');
            let title = part;
            let content = '';

            if (firstLineBreak !== -1) {
                title = part.substring(0, firstLineBreak).trim();
                content = part.substring(firstLineBreak).trim();
            } else {
                title = part.trim();
            }

            return {
                id: `section-${index}`,
                title,
                content
            };
        });

        return { intro: introContent, sections: parsedSections };
    }, [rawContent]);

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

            <DialogContent className="max-w-7xl min-w-[800px] w-[95vw] h-[90vh] p-0 overflow-hidden bg-white flex flex-col">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white z-10">
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-emerald-600" />
                        Metodologia de Cálculo
                    </DialogTitle>
                    <DialogDescription>
                        Detalhes técnicos sobre as fórmulas e parâmetros utilizados.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 w-full bg-slate-50/50">
                    <div className="px-6 py-4">
                        <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-a:text-blue-600 prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-white prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:p-4 prose-blockquote:not-italic prose-blockquote:text-slate-700 mb-6">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {intro}
                            </ReactMarkdown>
                        </div>

                        <Accordion type="single" collapsible className="w-full bg-white rounded-lg border border-slate-200 shadow-sm">
                            {sections.map((section) => (
                                <AccordionItem key={section.id} value={section.id} className="border-b last:border-0">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 data-[state=open]:bg-slate-50 font-semibold text-slate-800">
                                        {section.title}
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 py-4 bg-white prose prose-sm max-w-none prose-slate">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={{
                                                table: ({ node, ...props }) => <div className="overflow-x-auto my-2 border rounded-lg"><table className="w-full text-sm text-left text-slate-600" {...props} /></div>,
                                                thead: ({ node, ...props }) => <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b" {...props} />,
                                                th: ({ node, ...props }) => <th className="px-4 py-2 font-semibold" {...props} />,
                                                td: ({ node, ...props }) => <td className="px-4 py-2 border-b last:border-0" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-3 mb-1 text-slate-700" {...props} />,
                                            }}
                                        >
                                            {section.content}
                                        </ReactMarkdown>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        <div className="h-6" /> {/* Bottom spacer */}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
