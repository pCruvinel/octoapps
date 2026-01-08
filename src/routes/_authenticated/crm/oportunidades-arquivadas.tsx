import { createFileRoute } from '@tanstack/react-router';
import { ArchivedOpportunities } from '@/components/crm/ArchivedOpportunities';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/crm/oportunidades-arquivadas')({
    component: ArchivedOpportunitiesPage,
});

function ArchivedOpportunitiesPage() {
    const navigate = useNavigate();

    return (
        <ArchivedOpportunities
            onBack={() => navigate({ to: '/crm/oportunidades' })}
            onNavigate={(route: string, id?: string) => {
                if (route === 'opportunity-details' && id) {
                    navigate({ to: '/crm/oportunidade/$id', params: { id } });
                }
            }}
        />
    );
}
