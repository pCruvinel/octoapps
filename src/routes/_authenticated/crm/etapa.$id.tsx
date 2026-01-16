import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { EtapaDetailPage } from '@/components/crm/EtapaDetailPage';

export const Route = createFileRoute('/_authenticated/crm/etapa/$id')({
  component: EtapaDetailPageRoute,
});

function EtapaDetailPageRoute() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  return (
    <EtapaDetailPage
      etapaId={id}
      onBack={() => navigate({ to: '/crm/oportunidades' })}
      onNavigate={(route: string, navId?: string) => {
        if (route === 'opportunity-details' && navId) {
          navigate({ to: '/crm/oportunidade/$id', params: { id: navId } });
        }
      }}
    />
  );
}
