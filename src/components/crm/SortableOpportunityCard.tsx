
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Opportunity } from '@/types/opportunity';
import { OpportunityCard } from './OpportunityCard'; // Assuming OpportunityCard is exported or will be separated

interface SortableOpportunityCardProps {
    opportunity: Opportunity;
    onNavigate: (path: string, id: string) => void;
    onEdit: (opp: Opportunity) => void;
    onDelete: (opp: Opportunity) => void;
    canUpdate: boolean;
    canDelete: boolean;
}

export function SortableOpportunityCard({
    opportunity,
    onNavigate,
    onEdit,
    onDelete,
    canUpdate,
    canDelete
}: SortableOpportunityCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: opportunity.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <OpportunityCard
                opportunity={opportunity}
                onNavigate={onNavigate}
                onEdit={onEdit}
                onDelete={onDelete}
                canUpdate={canUpdate}
                canDelete={canDelete}
            />
        </div>
    );
}
