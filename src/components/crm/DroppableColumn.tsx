
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EtapaFunil } from '@/types/funnel';
import { Opportunity } from '@/types/opportunity';

interface DroppableColumnProps {
    etapa: EtapaFunil;
    opportunities: Opportunity[];
    children: React.ReactNode;
    onHeaderClick?: () => void;
}

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function DroppableColumn({
    etapa,
    opportunities,
    children,
    onHeaderClick
}: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({ id: etapa.id });

    // Calculate total value for this column (prioritize valor_proposta, fallback to valor_estimado)
    const totalValor = opportunities.reduce((sum, opp) => {
        const valor = opp.valor_proposta ?? opp.valor_estimado ?? 0;
        return sum + valor;
    }, 0);

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1_000_000) {
            return `R$ ${(value / 1_000_000).toFixed(1)}M`;
        } else if (value >= 1_000) {
            return `R$ ${(value / 1_000).toFixed(0)}K`;
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(value);
    };

    // White background with 50% opacity
    const columnBgColor = 'rgba(255, 255, 255, 0.1)';

    return (
        <div className="flex-1 min-w-[280px] max-w-[350px] flex flex-col h-full max-h-full">
            <div
                className="mb-4 flex-shrink-0 rounded-lg px-3 py-2 border cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                    backgroundColor: etapa.cor ? hexToRgba(etapa.cor, 0.2) : 'rgba(243, 244, 246, 0.2)',
                    borderColor: etapa.cor ? hexToRgba(etapa.cor, 0.3) : 'rgba(203, 213, 225, 0.3)'
                }}
                onClick={onHeaderClick}
                title="Ver oportunidades desta etapa"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: etapa.cor }}
                        />
                        <h3 className="text-gray-900 font-semibold">{etapa.nome}</h3>
                        <span className="text-sm text-gray-500">({opportunities.length})</span>
                    </div>
                    {/* Total Value */}
                    {totalValor > 0 && (
                        <span className="text-sm font-medium text-emerald-600" title="Total de propostas">
                            {formatCurrency(totalValor)}
                        </span>
                    )}
                </div>
            </div>

            <div
                ref={setNodeRef}
                className="space-y-3 rounded-lg p-3 min-h-[150px] flex-1 overflow-y-auto custom-scrollbar border border-slate-200/50"
                style={{ backgroundColor: columnBgColor }}
            >
                <SortableContext
                    items={opportunities.map(o => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {children}
                </SortableContext>
            </div>
        </div>
    );
}
