
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

export function DroppableColumn({
    etapa,
    opportunities,
    children
}: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({ id: etapa.id });

    return (
        <div className="w-80 flex-shrink-0 flex flex-col h-full max-h-full">
            <div className="mb-4 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
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
                className="space-y-3 bg-gray-50/50 dark:bg-gray-800/20 rounded-lg p-3 min-h-[150px] flex-1 overflow-y-auto custom-scrollbar"
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
