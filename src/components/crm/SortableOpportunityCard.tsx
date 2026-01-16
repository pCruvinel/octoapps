
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Opportunity } from '@/types/opportunity';
import { OpportunityCard } from './OpportunityCard';

interface SortableOpportunityCardProps {
    opportunity: Opportunity;
    onNavigate: (path: string, id: string) => void;
    onEdit: (opp: Opportunity) => void;
    onDelete: (opp: Opportunity) => void;
    onArchive?: (id: string) => void;
    canUpdate: boolean;
    canDelete: boolean;
    commentCount?: number;
    attachmentCount?: number;
}

export function SortableOpportunityCard({
    opportunity,
    onNavigate,
    onEdit,
    onDelete,
    onArchive,
    canUpdate,
    canDelete,
    commentCount = 0,
    attachmentCount = 0
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
                onEdit={(id) => onEdit(opportunity)}
                onDelete={(id) => onDelete(opportunity)}
                onArchive={onArchive}
                canUpdate={canUpdate}
                canDelete={canDelete}
                commentCount={commentCount}
                attachmentCount={attachmentCount}
            />
        </div>
    );
}
