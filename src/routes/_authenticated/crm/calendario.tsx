import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CRMCalendar } from '@/components/crm/CRMCalendar';

export const Route = createFileRoute('/_authenticated/crm/calendario')({
  component: CalendarioPage,
});

function CalendarioPage() {
  const navigate = useNavigate();

  return (
    <CRMCalendar
      onNavigate={(route: string, id?: string) => {
        if (route === 'opportunity-details' && id) {
          navigate({ to: '/crm/oportunidade/$id', params: { id } });
        }
      }}
    />
  );
}
