import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { TriagemRapida } from '@/components/triagem/TriagemRapida';

export const Route = createFileRoute('/_authenticated/triagem')({
  component: TriagemPage,
});

function TriagemPage() {
  const navigate = useNavigate();

  return (
    <TriagemRapida
      onNavigateToWizard={() => navigate({ to: '/calc/wizard' })}
    />
  );
}
