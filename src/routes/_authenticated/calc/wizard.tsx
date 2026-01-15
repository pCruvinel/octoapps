import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { CalculationWizard } from '@/components/calculations/wizard/CalculationWizard';
import { DetalhadaPage, type DetalhadaPageData } from '@/components/calculations/detalhada-page';
import { contratoRevisionalService } from '@/services/contratoRevisionalService';
import * as React from 'react';

// Typesafe search params with Zod validation
const wizardSearchSchema = z.object({
  module: z.enum(['GERAL', 'IMOBILIARIO', 'CARTAO']).default('GERAL'),
  contratoId: z.string().optional(),
  useTabs: z.coerce.boolean().default(true), // New UI enabled by default
});

export const Route = createFileRoute('/_authenticated/calc/wizard')({
  validateSearch: wizardSearchSchema,
  component: WizardPage,
});

function WizardPage() {
  const navigate = useNavigate();
  const { module, contratoId, useTabs } = Route.useSearch();

  // State for loaded contract data
  const [initialData, setInitialData] = React.useState<Partial<DetalhadaPageData> | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(!!contratoId);
  const [loadedContratoId, setLoadedContratoId] = React.useState<string | undefined>(contratoId);
  const [initialStep2, setInitialStep2] = React.useState<any>(null);
  const [initialStep3, setInitialStep3] = React.useState<any>(null);
  const [initialTab, setInitialTab] = React.useState<'dados' | 'conciliacao' | 'resumo' | 'apendices'>('dados');
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Helper to validate UUID format
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Load existing contract data if contratoId is provided
  React.useEffect(() => {
    if (!contratoId) {
      setIsLoading(false);
      return;
    }

    // Validate UUID format before making API call
    if (!isValidUUID(contratoId)) {
      console.error('[WizardPage] UUID inválido:', contratoId);
      setLoadError('ID de cálculo inválido. Verifique o link ou inicie um novo cálculo.');
      setIsLoading(false);
      return;
    }

    const loadContractData = async () => {
      try {
        const { data: contrato, error } = await contratoRevisionalService.getById(contratoId);

        if (error || !contrato) {
          console.error('[WizardPage] Erro ao carregar contrato:', error);
          setLoadError('Cálculo não encontrado ou sem permissão de acesso.');
          setIsLoading(false);
          return;
        }

        // Convert stored step1 data to DetalhadaPageData format
        const step1 = contrato.dados_step1 as Record<string, unknown> | null;

        if (step1) {
          const loadedData: Partial<DetalhadaPageData> = {
            module: contrato.modulo as 'GERAL' | 'IMOBILIARIO' | 'CARTAO',
            credor: step1.credor as string || '',
            devedor: step1.devedor as string || '',
            numeroContrato: step1.numeroContrato as string || '',
            tipoContrato: step1.tipoContrato as string || '',
            valorFinanciado: step1.valorFinanciado as number || 0,
            dataContrato: step1.dataContrato as string || '',
            dataPrimeiroVencimento: step1.dataPrimeiroVencimento as string || '',
            prazoMeses: step1.prazoMeses as number || 12,
            valorPrestacao: step1.valorPrestacao as number,
            taxaMensalContrato: step1.taxaMensalContrato as number,
            taxaAnualContrato: step1.taxaAnualContrato as number,
            sistemaAmortizacao: (step1.sistemaAmortizacao as 'PRICE' | 'SAC') || 'PRICE',
            capitalizacao: (step1.capitalizacao as 'MENSAL' | 'DIARIA') || 'MENSAL',
            usarTaxaBacen: step1.usarTaxaBacen as boolean ?? true,
            expurgarTarifas: step1.expurgarTarifas as boolean ?? false,
            restituicaoEmDobro: step1.restituicaoEmDobro as boolean ?? false,
            tarifas: step1.tarifas as Array<{ nome: string; valor: number }> || [],
            indexador: step1.indexador as string,
            valorImovel: step1.valorImovel as number,
            tipoFinanciamento: step1.tipoFinanciamento as 'SFH' | 'SFI',
            valorBem: step1.valorBem as number,
            valorEntrada: step1.valorEntrada as number,
            dataLiberacao: step1.dataLiberacao as string,
          };

          setInitialData(loadedData);
          setLoadedContratoId(contratoId);
          console.log('[WizardPage] Dados do contrato carregados:', loadedData);
        }

        // Carregar step2 e step3 se existirem
        if (contrato.dados_step2) {
          setInitialStep2(contrato.dados_step2);
        }
        if (contrato.dados_step3) {
          setInitialStep3(contrato.dados_step3);
        }

        // Definir tab inicial baseado no status
        switch (contrato.status) {
          case 'ANALISE_DETALHADA':
            setInitialTab('resumo');
            break;
          case 'ANALISE_PREVIA':
            setInitialTab('conciliacao');
            break;
          default:
            setInitialTab('dados');
        }

      } catch (err) {
        console.error('[WizardPage] Erro ao carregar contrato:', err);
        setLoadError('Erro ao carregar dados do cálculo. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContractData();
  }, [contratoId]);

  // Show loading spinner while fetching contract data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando dados do contrato...</p>
        </div>
      </div>
    );
  }

  // Show error message if contract loading failed
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Erro ao carregar cálculo</h2>
          <p className="text-slate-600 mb-6">{loadError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate({ to: '/calc/lista' })}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Ver Meus Cálculos
            </button>
            <button
              onClick={() => navigate({ to: '/calc/wizard', search: { module } })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Novo Cálculo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use new Tabs UI by default
  if (useTabs) {
    return (
      <DetalhadaPage
        module={module}
        initialData={initialData}
        existingContratoId={loadedContratoId}
        initialStep2={initialStep2}
        initialStep3={initialStep3}
        initialTab={initialTab}
        onComplete={(resultData) => {
          navigate({
            to: '/calc/results',
            state: { resultData }
          });
        }}
        onBack={() => {
          navigate({ to: '/calc/lista' });
        }}
      />
    );
  }

  // Legacy Stepper UI (can be accessed via ?useTabs=false)
  return (
    <CalculationWizard
      module={module}
      existingContratoId={contratoId}
      onComplete={(resultData) => {
        navigate({
          to: '/calc/results',
          state: { resultData }
        });
      }}
      onBack={() => {
        navigate({ to: '/calc/lista' });
      }}
    />
  );
}
