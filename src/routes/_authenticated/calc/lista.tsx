import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ListaCasos } from '@/components/calculations/ListaCasos';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/_authenticated/calc/lista')({
  loader: async () => {
    const { data, error } = await supabase
      .from('contratos_revisionais')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[calc/lista loader] Error fetching:', error);
      return [];
    }
    return data || [];
  },
  component: ListaCasosPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
});

function ListaCasosPage() {
  const navigate = useNavigate();
  const preloadedCasos = Route.useLoaderData();

  return (
    <ListaCasos
      initialData={preloadedCasos}
      onNavigate={(route: string, id?: string, data?: any) => {
        if (route === 'novo-calculo') {
          navigate({ to: '/calc/selecao' });
        } else if (route === 'calc-wizard') {
          navigate({
            to: '/calc/wizard',
            search: {
              module: data?.module || 'GERAL',
              contratoId: data?.contratoId
            }
          });
        } else if (route === 'calc-relatorio' && id) {
          navigate({ to: '/calc/relatorio/$id', params: { id } });
        }
      }}
    />
  );
}
