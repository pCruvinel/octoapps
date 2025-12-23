
import { useState } from 'react';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Opportunity } from '@/types/opportunity';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useEtapasFunil } from '@/hooks/useEtapasFunil';

export function useKanbanDnd(
    opportunities: Opportunity[],
    setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>
) {
    const { user } = useAuth();
    const { etapas } = useEtapasFunil();
    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const opportunityId = active.id as string;
        const targetId = over.id as string;

        // Find dragged opportunity
        const draggedOpp = opportunities.find(o => o.id === opportunityId);
        if (!draggedOpp) return;

        // Check if dropped on a Column (etapa_id) or another Card (opp_id)
        // If dropped on a column, targetId is etapa_id
        // If dropped on a card, we need to find that card's etapa_id

        let targetEtapaId = targetId;
        let targetOpp = opportunities.find(o => o.id === targetId);

        if (targetOpp) {
            // Dropped on another card
            targetEtapaId = targetOpp.etapa_funil_id || '';
        }

        // If drag and drop in same column basically
        if (draggedOpp.etapa_funil_id === targetEtapaId) {
            // Reordering logic could go here if we want to implement reordering within column
            return;
        }

        // Changing columns
        const previousOpportunities = [...opportunities];

        // Optimistic Update
        setOpportunities(prev => prev.map(opp =>
            opp.id === opportunityId
                ? { ...opp, etapa_funil_id: targetEtapaId }
                : opp
        ));

        try {
            const { error } = await supabase
                .from('oportunidades')
                .update({
                    etapa_funil_id: targetEtapaId,
                    data_atualizacao: new Date().toISOString()
                })
                .eq('id', opportunityId);

            if (error) throw error;

            toast.success('Oportunidade movida!');

            // Log activity with human-readable etapa names (non-blocking)
            const fromEtapa = etapas.find(e => e.id === draggedOpp.etapa_funil_id)?.nome || 'Desconhecida';
            const toEtapa = etapas.find(e => e.id === targetEtapaId)?.nome || 'Desconhecida';

            supabase.from('log_atividades').insert({
                user_id: user?.id,
                acao: 'MOVER_OPORTUNIDADE',
                entidade: 'oportunidades',
                entidade_id: opportunityId,
                dados_anteriores: { etapa: fromEtapa },
                dados_novos: { etapa: toEtapa }
            }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

        } catch (error) {
            setOpportunities(previousOpportunities);
            toast.error('Erro ao mover oportunidade');
            console.error('Drag error:', error);
        }
    };

    return {
        activeId,
        handleDragStart,
        handleDragEnd,
    };
}
