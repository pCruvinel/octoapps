import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PreviaContainer } from '@/components/triagem/previa-container';

export const Route = createFileRoute('/_authenticated/triagem')({
  component: TriagemPage,
});

function TriagemPage() {
  const navigate = useNavigate();

  return (
    <PreviaContainer
      onNavigateToWizard={() => navigate({ to: '/calc/wizard' })}
    />
  );
}
