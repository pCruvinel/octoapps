import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CRMKanban } from '@/components/crm/CRMKanban';

export const Route = createFileRoute('/_authenticated/crm/oportunidades')({
  component: OportunidadesPage,
});

function OportunidadesPage() {
  const navigate = useNavigate();

  return (
    <CRMKanban
      onNavigate={(route: string, id?: string) => {
        if (route === 'opportunity-details' && id) {
          navigate({ to: '/crm/oportunidade/$id', params: { id } });
        }
      }}
    />
  );
}
