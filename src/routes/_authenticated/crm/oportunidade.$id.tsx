import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { OpportunityDetails } from '@/components/crm/OpportunityDetails';

export const Route = createFileRoute('/_authenticated/crm/oportunidade/$id')({
  component: OportunidadeDetailPage,
});

function OportunidadeDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  return (
    <OpportunityDetails
      opportunityId={id}
      onBack={() => navigate({ to: '/crm/oportunidades' })}
      onNavigate={(route: string, navId?: string) => {
        if (route === 'contact-details' && navId) {
          navigate({ to: '/contatos/$id', params: { id: navId } });
        } else if (route === 'calc-wizard') {
          navigate({ to: '/calc/wizard', search: { module: 'GERAL' } });
        } else if (route === 'crm') {
          navigate({ to: '/crm/oportunidades' });
        }
      }}
    />
  );
}
