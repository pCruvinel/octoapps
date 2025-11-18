/**
 * Endpoint: POST /api/relatorio_completo
 *
 * Gera relatório completo de financiamento imobiliário incluindo:
 * - Dados das partes e do contrato
 * - Tabela de amortização completa
 * - Comparativo cobrado vs. devido
 * - Resumo executivo com valores e indicadores
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  gerarCenarioAP01,
  gerarCenarioAP05,
  gerarCenarioAP03,
  validarParametros,
  validarTRSeries,
  validarEncargos,
  formatarMoeda,
  formatarPercent,
} from '@/services/calculationEngine';
import {
  RelatorioCompletoRequest,
  RelatorioCompletoResponse,
  ParametrosSAC,
  CalculationError,
  LinhaAmortizacao,
} from '@/types/calculation.types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RelatorioCompletoRequest = await request.json();

    // Extrair parâmetros
    const {
      credor,
      devedor,
      contratoNum,
      metodologia,
      pv,
      n,
      primeiroVenc,
      faixasTaxa,
      trSeries = [],
      encargosMensais = [],
      taxaMercadoMensal,
      horizonteMeses,
      tabelaExibe,
    } = body;

    // Validação básica
    if (!credor || !devedor || !contratoNum || !pv || !n || !primeiroVenc) {
      return NextResponse.json(
        {
          error: 'Parâmetros obrigatórios ausentes',
          required: ['credor', 'devedor', 'contratoNum', 'pv', 'n', 'primeiroVenc'],
        },
        { status: 400 }
      );
    }

    if (!faixasTaxa || faixasTaxa.length === 0) {
      return NextResponse.json(
        {
          error: 'Pelo menos uma faixa de taxa deve ser fornecida',
        },
        { status: 400 }
      );
    }

    if (!taxaMercadoMensal) {
      return NextResponse.json(
        {
          error: 'Taxa de mercado mensal é obrigatória',
        },
        { status: 400 }
      );
    }

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
    validarEncargos(encargosMensais);

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
    // Usar a primeira taxa de contrato como referência
    const taxaContratoReferencia = faixasTaxa[0].i;
    const ap03 = gerarCenarioAP03(
      ap01,
      ap05,
      taxaContratoReferencia,
      taxaMercadoMensal
    );

    // Selecionar qual tabela exibir
    let tabelaAmortizacao: LinhaAmortizacao[] = [];
    let totalJuros = 0;
    let totalTaxas = 0;
    let valorTotalDevido = 0;

    switch (tabelaExibe) {
      case 'cobrado':
        tabelaAmortizacao = ap01.tabela;
        totalJuros = ap01.totais.totalJuros;
        totalTaxas = ap01.totais.totalTaxas;
        valorTotalDevido = ap01.totais.totalPago;
        break;

      case 'devido':
        tabelaAmortizacao = ap05.tabela;
        totalJuros = ap05.totais.totalJuros;
        totalTaxas = 0; // Devido não tem taxas
        valorTotalDevido = ap05.totais.totalDevido;
        break;

      case 'comparativo':
        tabelaAmortizacao = ap03.tabela;
        totalJuros = ap01.totais.totalJuros; // Usar juros do cobrado
        totalTaxas = ap01.totais.totalTaxas;
        valorTotalDevido = ap01.totais.totalPago;
        break;

      default:
        tabelaAmortizacao = ap01.tabela;
        totalJuros = ap01.totais.totalJuros;
        totalTaxas = ap01.totais.totalTaxas;
        valorTotalDevido = ap01.totais.totalPago;
    }

    // Total a restituir
    const totalRestituir = ap03.totais.totalRestituir;

    // Montar cards de resumo
    const cards = {
      valorPrincipal: pv,
      totalJuros,
      totalTaxas,
      valorTotalDevido,
      totalRestituir,
    };

    // Comparativo de taxas
    const comparativo = {
      taxaContratoAM: taxaContratoReferencia,
      taxaMercadoAM: taxaMercadoMensal,
      sobretaxaPP: ap03.totais.sobretaxaPP,
    };

    // Montar response
    const response: RelatorioCompletoResponse = {
      credor,
      devedor,
      contratoNum,
      metodologia: metodologia || 'SAC com TR — AP01 (Cobrado) vs AP05 (Devido)',
      cards,
      comparativo,
      tabelaAmortizacao,
      formatted: {
        cards: {
          valorPrincipal: formatarMoeda(cards.valorPrincipal),
          totalJuros: formatarMoeda(cards.totalJuros),
          totalTaxas: formatarMoeda(cards.totalTaxas),
          valorTotalDevido: formatarMoeda(cards.valorTotalDevido),
          totalRestituir: formatarMoeda(cards.totalRestituir),
        },
        comparativo: {
          taxaContratoAM: formatarPercent(comparativo.taxaContratoAM),
          taxaMercadoAM: formatarPercent(comparativo.taxaMercadoAM),
          sobretaxaPP: formatarPercent(comparativo.sobretaxaPP),
        },
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Erro em /api/relatorio_completo:', error);

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
