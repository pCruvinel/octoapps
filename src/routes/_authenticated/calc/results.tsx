import { fileRoute, useNavigate, useRouter, createFileRoute } from '@tanstack/react-router';
import { DetalhadaDashboard, type DetalhadaDashboardData } from '@/components/calculations/results';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/calc/results')({
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const router = useRouter();

  // Get data from router state (passed from wizard)
  const state = router.state as any;
  const resultData = state?.location?.state?.resultData;
  const dashboardData = resultData?.dashboardData as DetalhadaDashboardData | undefined;

  // Handle export PDF
  const handleExportPDF = () => {
    toast.info('Exportação de PDF em desenvolvimento');
    // TODO: Implement PDF export via Edge Function
  };

  // Handle recalculate
  const handleRecalculate = () => {
    toast.info('Recálculo baseado em edições em desenvolvimento');
  };

  // If no data, show empty state
  if (!dashboardData) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Nenhum resultado disponível
          </h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Para visualizar resultados, você precisa completar um cálculo através do assistente.
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/calc/lista' })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ver Lista de Casos
            </Button>
            <Button
              onClick={() => navigate({ to: '/calc/wizard', search: { module: 'GERAL' } })}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Novo Cálculo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DetalhadaDashboard
      data={dashboardData}
      onBack={() => navigate({ to: '/calc/lista' })}
      onExportPDF={handleExportPDF}
      onRecalculate={handleRecalculate}
    />
  );
}
