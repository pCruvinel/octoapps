/**
 * Endpoint: POST /api/analise_previa
 *
 * Realiza análise prévia de financiamento imobiliário comparando
 * valores cobrados vs. valores devidos (taxa de mercado)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  gerarCenarioAP01,
  gerarCenarioAP05,
  gerarCenarioAP03,
  validarParametros,
  validarTRSeries,
  formatarMoeda,
  formatarPercent,
} from '@/services/calculationEngine';
import {
  AnalisePreviaRequest,
  AnalisePreviaResponse,
  ParametrosSAC,
  CalculationError,
  FaixaTaxa,
  EncargosMensais,
} from '@/types/calculation.types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AnalisePreviaRequest = await request.json();

    // Extrair parâmetros
    const {
      pv,
      n,
      primeiroVenc,
      taxaContratoMensal,
      taxaMercadoMensal,
      segurosMedios,
      horizonteMeses = 12,
      trSeries = [],
    } = body;

    // Validação básica
    if (!pv || !n || !primeiroVenc || !taxaContratoMensal || !taxaMercadoMensal) {
      return NextResponse.json(
        {
          error: 'Parâmetros obrigatórios ausentes',
          required: ['pv', 'n', 'primeiroVenc', 'taxaContratoMensal', 'taxaMercadoMensal'],
        },
        { status: 400 }
      );
    }

    // Criar faixa de taxa única para análise prévia
    // Usando taxaContratoMensal como única faixa
    const faixasTaxa: FaixaTaxa[] = [
      {
        ini: primeiroVenc,
        fim: '2099-12-31', // Data muito futura para cobrir todo o período
        i: taxaContratoMensal,
      },
    ];

    // Criar encargos médios para todas as parcelas
    // Primeira parcela tem os valores, demais têm 0
    const encargosMensais: EncargosMensais[] = [
      {
        data: primeiroVenc,
        MIP: segurosMedios?.MIP || 0,
        DFI: segurosMedios?.DFI || 0,
        TCA: segurosMedios?.TCA || 0,
        multa: 0,
        mora: 0,
      },
    ];

    // Montar parâmetros para cálculo
    const params: ParametrosSAC = {
      pv,
      n,
      primeiroVenc,
      faixasTaxa,
      trSeries,
      encargosMensais,
      horizonteMeses,
    };

    // Validar parâmetros
    validarParametros(params);
    validarTRSeries(trSeries);

    // Gerar AP01 (Cobrado)
    const ap01 = gerarCenarioAP01(params);

    // Gerar AP05 (Devido) com taxa de mercado
    const paramsDevido: ParametrosSAC = {
      pv,
      n,
      primeiroVenc,
      faixasTaxa: [
        {
          ini: primeiroVenc,
          fim: '2099-12-31',
          i: taxaMercadoMensal,
        },
      ],
      trSeries,
      horizonteMeses,
    };
    const ap05 = gerarCenarioAP05(paramsDevido, taxaMercadoMensal);

    // Gerar AP03 (Comparativo)
    const ap03 = gerarCenarioAP03(
      ap01,
      ap05,
      taxaContratoMensal,
      taxaMercadoMensal
    );

    // Calcular totais
    const valorTotalPago = ap01.totais.totalPago;
    const valorDevido = ap05.totais.totalDevido;
    const diferencaRestituicao = ap03.totais.totalRestituir;
    const sobretaxaPP = ap03.totais.sobretaxaPP;

    // Montar response
    const response: AnalisePreviaResponse = {
      taxaContratoAM: taxaContratoMensal,
      taxaMercadoAM: taxaMercadoMensal,
      sobretaxaPP,
      valorTotalPago,
      valorDevido,
      diferencaRestituicao,
      formatted: {
        taxaContratoAM: formatarPercent(taxaContratoMensal),
        taxaMercadoAM: formatarPercent(taxaMercadoMensal),
        sobretaxaPP: formatarPercent(sobretaxaPP),
        valorTotalPago: formatarMoeda(valorTotalPago),
        valorDevido: formatarMoeda(valorDevido),
        diferencaRestituicao: formatarMoeda(diferencaRestituicao),
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Erro em /api/analise_previa:', error);

    if (error instanceof CalculationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// Configuração do runtime (edge ou nodejs)
export const runtime = 'nodejs';
