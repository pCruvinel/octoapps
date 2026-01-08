import { createFileRoute } from '@tanstack/react-router';
import { FunnelStagesManager } from '@/components/crm/FunnelStagesManager';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/crm/etapas-funil')({
  component: FunnelStagesPage,
});

function FunnelStagesPage() {
  const navigate = useNavigate();

  return (
    <FunnelStagesManager
      onBack={() => navigate({ to: '/crm/oportunidades' })}
    />
  );
}
