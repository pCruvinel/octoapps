import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PeticoesList } from '@/components/peticoes/PeticoesList';

export const Route = createFileRoute('/_authenticated/peticoes/')({
  component: PeticoesPage,
});

function PeticoesPage() {
  const navigate = useNavigate();

  return (
    <PeticoesList
      onNavigate={(route: string, id?: string) => {
        if (route === 'peticoes-editor' && id) {
          navigate({ to: '/peticoes/editor/$id', params: { id } });
        }
      }}
    />
  );
}
