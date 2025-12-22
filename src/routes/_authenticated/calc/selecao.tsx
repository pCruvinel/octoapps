import { createFileRoute } from '@tanstack/react-router';
import { ModuleSelection } from '@/components/calculations/ModuleSelection';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/calc/selecao')({
  component: ModuleSelectionPage,
});

function ModuleSelectionPage() {
  const navigate = useNavigate();

  return (
    <ModuleSelection
      onNavigate={(route: string, id?: string, data?: any) => {
        if (route === 'calc-wizard') {
          navigate({
            to: '/calc/wizard',
            search: {
              module: data?.module || 'GERAL'
            }
          });
        } else if (route === 'lista-casos') {
          navigate({ to: '/calc/lista' });
        }
      }}
    />
  );
}
