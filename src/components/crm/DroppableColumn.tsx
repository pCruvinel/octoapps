
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EtapaFunil } from '@/types/funnel';
import { Opportunity } from '@/types/opportunity';

interface DroppableColumnProps {
    etapa: EtapaFunil;
    opportunities: Opportunity[];
    children: React.ReactNode;
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
    children
}: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({ id: etapa.id });

    // White background with 50% opacity
    const columnBgColor = 'rgba(255, 255, 255, 0.1)';

    return (
        <div className="w-80 flex-shrink-0 flex flex-col h-full max-h-full">
            <div
                className="mb-4 flex-shrink-0 rounded-lg px-3 py-2 border"
                style={{
                    backgroundColor: etapa.cor ? hexToRgba(etapa.cor, 0.2) : 'rgba(243, 244, 246, 0.2)',
                    borderColor: etapa.cor ? hexToRgba(etapa.cor, 0.3) : 'rgba(203, 213, 225, 0.3)'
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: etapa.cor }}
                    />
                    <h3 className="text-gray-900 font-semibold">{etapa.nome}</h3>
                    <span className="text-sm text-gray-500">({opportunities.length})</span>
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
