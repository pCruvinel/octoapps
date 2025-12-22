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

  // Load existing contract data if contratoId is provided
  React.useEffect(() => {
    if (!contratoId) {
      setIsLoading(false);
      return;
    }

    const loadContractData = async () => {
      try {
        const { data: contrato, error } = await contratoRevisionalService.getById(contratoId);

        if (error || !contrato) {
          console.error('[WizardPage] Erro ao carregar contrato:', error);
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
