/**
 * Serviço de Cálculo Revisional Detalhado
 * 
 * Motor de perícia contábil que gera 5+ apêndices (AP01-AP07) com
 * evolução mês a mês, correção monetária, e suporte a overrides manuais.
 * 
 * IMPORTANTE: Este serviço é standalone e não modifica base.strategy.ts
 * para evitar regressão na Análise Prévia.
 * 
 * @version 3.1.0
 */

import Decimal from 'decimal.js';
import type {
    CalculoDetalhadoRequest,
    CalculoDetalhadoResponse,
    LinhaAmortizacaoDetalhada,
    ApendiceResult,
    ApendiceTotal,
    TaxaSnapshot,
    MapaIndicesHistoricos,
    OverrideParcela,
} from '@/types/calculation.types';
import {
    buscarTaxaSGS,
    buscarSerieHistorica,
    obterIndicePorData,
} from './taxasMercadoBacen';
import { formatCurrency, formatPercent } from '@/lib/formatters';

// ============================================================================
// CONFIGURAÇÃO DECIMAL.JS (PRECISÃO PERICIAL)
// ============================================================================

Decimal.set({
    precision: 20,      // 20 dígitos significativos
    rounding: Decimal.ROUND_HALF_UP,
});

const VERSAO_MOTOR = '3.1.0';

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Executa cálculo revisional detalhado gerando 5+ apêndices
 * 
 * Fluxo:
 * 1. Busca dados externos em paralelo (taxa SGS + série histórica de índices)
 * 2. Calcula juros de carência (se aplicável)
 * 3. Gera AP01 - Evolução Original (Cenário Banco)
 * 4. Gera AP02 - Recálculo (Cenário Justo)
 * 5. Gera AP03 - Diferenças Nominais
 * 6. Gera AP04/AP05 - Restituições
 * 
 * @param request - Dados do contrato e configurações
 * @returns CalculoDetalhadoResponse com apêndices e resumo
 */
export async function calcularEvolucaoDetalhada(
    request: CalculoDetalhadoRequest
): Promise<CalculoDetalhadoResponse> {
    const startTime = performance.now();

    console.log('\n==========================================');
    console.log('[Engine] 📊 MOTOR DE CÁLCULO DETALHADO v' + VERSAO_MOTOR);
    console.log('==========================================');

    // ==========================================
    // 0. VALIDAÇÃO DE ENTRADA
    // ==========================================
    console.log('\n[Engine] 🔍 Fase 0: Validação de Entrada');
    console.log('  • Valor Financiado:', request.valorFinanciado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    console.log('  • Prazo:', request.prazoMeses, 'meses');
    console.log('  • Taxa Contrato (mensal):', request.taxaContratoMensal, '%');
    console.log('  • Taxa Contrato (anual):', request.taxaContratoAnual, '%');
    console.log('  • Sistema:', request.sistemaAmortizacao);
    console.log('  • Capitalização:', request.capitalizacao);
    console.log('  • Modalidade BACEN:', request.modalidade);
    console.log('  • Indexador:', request.indexador);
    console.log('  • Data Contrato:', request.dataContrato);
    console.log('  • Data 1º Vencimento:', request.dataPrimeiroVencimento);
    console.log('  • Usar Taxa BACEN:', request.usarTaxaBacen);
    console.log('  • Usar Juros Simples (Gauss):', request.usarJurosSimples);

    // ==========================================
    // 1. PARALLEL DATA FETCHING (Otimização)
    // ==========================================
    console.log('\n[Engine] 🌐 Fase 1: Busca Paralela de Dados Externos');
    console.log('  • Buscando taxa SGS para modalidade:', request.modalidade);
    console.log('  • Buscando índices históricos:', request.indexador, 'com regra:', request.regraDefasagem || 'MES_CHEIO_ANTERIOR');

    const fetchStartTime = performance.now();
    const [taxaSnapshot, historicoIndices] = await Promise.all([
        buscarTaxaSGS(request.modalidade, request.dataContrato),
        buscarSerieHistorica(
            request.indexador,
            request.dataPrimeiroVencimento,
            request.prazoMeses,
            request.regraDefasagem || 'MES_CHEIO_ANTERIOR'
        )
    ]);
    const fetchEndTime = performance.now();

    console.log('  ✅ Busca concluída em', Math.round(fetchEndTime - fetchStartTime), 'ms');
    console.log('  • Taxa BACEN encontrada:', taxaSnapshot.valor, '%');
    console.log('  • Série SGS:', taxaSnapshot.serieCodigo);
    console.log('  • Data Referência:', taxaSnapshot.dataReferencia);
    console.log('  • Fonte:', taxaSnapshot.fonte);
    console.log('  • Índices carregados:', historicoIndices.size, 'meses');

    // ==========================================
    // 2. CÁLCULO DE CARÊNCIA (SE APLICÁVEL)
    // ==========================================
    console.log('\n[Engine] ⏱️ Fase 2: Análise de Carência');

    let pvAjustado = new Decimal(request.valorFinanciado);
    let diasCarencia = 0;
    let jurosCarencia = 0;

    if (request.dataLiberacao && request.dataPrimeiroVencimento) {
        diasCarencia = calcularDiasEntre(
            request.dataLiberacao,
            request.dataPrimeiroVencimento
        );
        console.log('  • Data Liberação:', request.dataLiberacao);
        console.log('  • Data 1º Vencimento:', request.dataPrimeiroVencimento);
        console.log('  • Dias entre datas:', diasCarencia);

        if (diasCarencia > 30) {
            console.log('  ⚠️ CARÊNCIA DETECTADA:', diasCarencia, 'dias');
            const taxaProporcional = calcularJurosProRata(
                request.taxaContratoMensal / 100,
                diasCarencia
            );
            console.log('  • Taxa proporcional (pro-rata):', (taxaProporcional * 100).toFixed(4), '%');
            jurosCarencia = pvAjustado.times(taxaProporcional).toNumber();
            console.log('  • Juros de carência:', formatCurrency(jurosCarencia));
            pvAjustado = pvAjustado.plus(jurosCarencia);
            console.log('  • Principal ajustado:', formatCurrency(pvAjustado.toNumber()));
        } else {
            console.log('  ✅ Sem carência (dias <= 30)');
        }
    } else {
        console.log('  • Datas de liberação não informadas - pulando análise de carência');
    }

    // ==========================================
    // 3. GERAR AP01 - EVOLUÇÃO ORIGINAL (BANCO)
    // ==========================================
    console.log('\n[Engine] 🏦 Fase 3: Gerando AP01 - Evolução Original');
    console.log('  • Principal:', formatCurrency(pvAjustado.toNumber()));
    console.log('  • Taxa mensal (decimal):', (request.taxaContratoMensal / 100).toFixed(6));
    console.log('  • Sistema:', request.sistemaAmortizacao);
    console.log('  • Capitalização:', request.capitalizacao);

    const ap01StartTime = performance.now();
    const ap01 = gerarAP01_EvolucaoOriginal({
        principal: pvAjustado,
        prazo: request.prazoMeses,
        taxaMensal: request.taxaContratoMensal / 100,
        sistema: request.sistemaAmortizacao,
        capitalizacao: request.capitalizacao,
        dataInicio: request.dataPrimeiroVencimento,
        historicoIndices,
        regraDefasagem: request.regraDefasagem || 'MES_CHEIO_ANTERIOR',
        seguros: {
            mip: request.seguroMIP,
            mipTipo: request.seguroMIPTipo,
            dfi: request.seguroDFI,
            dfiTipo: request.seguroDFITipo,
            valorImovel: request.valorImovel,
        },
        taxaAdm: request.taxaAdministrativa,
        overrides: request.overrides,
        valorPrimeiraParcela: request.valorParcelaCobrada,
        // NOVO: Parâmetros de conciliação e mora
        conciliacao: request.conciliacao,
        jurosMora: request.jurosMora,
        multaMoratoria: request.multaMoratoria,
        // NOVO: Data de liberação para cálculo de dias acumulados (capitalização diária)
        dataLiberacao: request.dataLiberacao,
        // NOVO: Data do contrato para cálculo pro-rata da 1ª parcela
        dataContrato: request.dataContrato,
    });
    const ap01EndTime = performance.now();

    console.log('  ✅ AP01 gerado em', Math.round(ap01EndTime - ap01StartTime), 'ms');
    console.log('  • Linhas geradas:', ap01.tabela.length);
    console.log('  • Total Pago (Banco):', formatCurrency(ap01.totais.totalPago));
    console.log('  • Total Juros (Banco):', formatCurrency(ap01.totais.totalJuros));

    // Log primeira linha para debug
    if (ap01.tabela.length > 0) {
        const p1 = ap01.tabela[0];
        console.log('  [Debug] Primeira parcela AP01:');
        console.log('    Mês 1:', p1.data, '| Saldo:', formatCurrency(p1.saldoAbertura), '| Juros:', formatCurrency(p1.juros), '| Amort:', formatCurrency(p1.amortizacao), '| Parcela:', formatCurrency(p1.parcelaTotal));
    }

    // ==========================================
    // 3.5. ANÁLISE XTIR - DETECÇÃO DE CAPITALIZAÇÃO DIÁRIA
    // ==========================================
    console.log('\n[Engine] 🔬 Fase 3.5: Análise XTIR - Detecção de Capitalização Diária');

    let analiseXTIR: CalculoDetalhadoResponse['analiseXTIR'];

    try {
        const { detectDailyCapitalization } = await import('@/utils/financialCalculations');

        const resultadoXTIR = detectDailyCapitalization(
            pvAjustado.toNumber(),
            ap01.tabela[0]?.parcelaTotal || 0,
            request.taxaContratoMensal,
            request.prazoMeses,
            request.dataContrato || request.dataPrimeiroVencimento,
            request.dataPrimeiroVencimento
        );

        analiseXTIR = {
            detectada: resultadoXTIR.detected,
            taxaXTIR_mensal: resultadoXTIR.taxaXTIR_mensal,
            taxaPactuada_mensal: request.taxaContratoMensal,
            diferenca: Math.abs(resultadoXTIR.taxaXTIR_mensal - request.taxaContratoMensal),
            metodoDeteccao: resultadoXTIR.metodoDeteccao,
            evidencia: resultadoXTIR.evidencia
        };

        console.log('  • XTIR Mensal:', analiseXTIR.taxaXTIR_mensal.toFixed(4), '%');
        console.log('  • Taxa Pactuada:', analiseXTIR.taxaPactuada_mensal.toFixed(4), '%');
        console.log('  • Capitalização Diária:', analiseXTIR.detectada ? '⚠️ DETECTADA' : '✅ NÃO DETECTADA');
        console.log('  • Evidência:', analiseXTIR.evidencia);
    } catch (error) {
        console.warn('  ⚠️ Erro ao calcular XTIR:', error);
        analiseXTIR = undefined;
    }

    // ==========================================
    // 4. GERAR AP02 - RECÁLCULO (JUSTO)
    // ==========================================
    console.log('\n[Engine] ⚖️ Fase 4: Gerando AP02 - Recálculo (Cenário Justo)');

    let principalRecalculo = new Decimal(request.valorFinanciado);

    if (request.expurgarTarifas) {
        const tarifasExpurgadas = calcularTotalTarifasExpurgadas(request);
        principalRecalculo = principalRecalculo.minus(tarifasExpurgadas);
        console.log('  • Tarifas expurgadas:', formatCurrency(tarifasExpurgadas));
        console.log('  • Principal após expurgo:', formatCurrency(principalRecalculo.toNumber()));
    }

    const taxaMercadoDecimal = taxaSnapshot.valor / 100; // Converter para decimal

    console.log('  • Taxa Mercado BACEN (decimal):', taxaMercadoDecimal.toFixed(6));
    console.log('  • Sistema:', request.usarJurosSimples ? 'SAC (Juros Simples/Gauss)' : request.sistemaAmortizacao);
    console.log('  • Capitalização: MENSAL (sempre no recálculo)');

    const ap02StartTime = performance.now();
    const ap02 = gerarAP02_Recalculo({
        principal: principalRecalculo,
        prazo: request.prazoMeses,
        taxaMensal: taxaMercadoDecimal,
        sistema: request.usarJurosSimples ? 'SAC' : request.sistemaAmortizacao,
        usarJurosSimples: request.usarJurosSimples,
        capitalizacao: 'MENSAL',
        dataInicio: request.dataPrimeiroVencimento,
        historicoIndices,
        regraDefasagem: request.regraDefasagem || 'MES_CHEIO_ANTERIOR',
        seguros: request.expurgarTarifas ? undefined : {
            mip: request.seguroMIP,
            mipTipo: request.seguroMIPTipo,
            dfi: request.seguroDFI,
            dfiTipo: request.seguroDFITipo,
            valorImovel: request.valorImovel,
        },
        // NOVO: Conciliação para amortização extra
        conciliacao: request.conciliacao,
        // NOVO: Data do contrato para cálculo pro-rata da 1ª parcela
        dataContrato: request.dataContrato,
    });
    const ap02EndTime = performance.now();

    console.log('  ✅ AP02 gerado em', Math.round(ap02EndTime - ap02StartTime), 'ms');
    console.log('  • Linhas geradas:', ap02.tabela.length);
    console.log('  • Total Pago (Justo):', formatCurrency(ap02.totais.totalPago));
    console.log('  • Total Juros (Justo):', formatCurrency(ap02.totais.totalJuros));

    // Log primeira linha para debug
    if (ap02.tabela.length > 0) {
        const p1 = ap02.tabela[0];
        console.log('  [Debug] Primeira parcela AP02:');
        console.log('    Mês 1:', p1.data, '| Saldo:', formatCurrency(p1.saldoAbertura), '| Juros:', formatCurrency(p1.juros), '| Amort:', formatCurrency(p1.amortizacao), '| Parcela:', formatCurrency(p1.parcelaTotal));
    }

    // ==========================================
    // 5. GERAR AP03 - DIFERENÇAS NOMINAIS
    // ==========================================
    console.log('\n[Engine] 📊 Fase 5: Gerando AP03 - Diferenças Nominais');

    // Usar dataCalculo do request ou data atual
    const dataCalculo = request.dataCalculo || new Date().toISOString().split('T')[0];

    const ap03 = gerarAP03_Diferencas({
        ap01,
        ap02,
        dataCalculo,
        conciliacao: request.conciliacao,
    });

    console.log('  • Total Pago (Banco):', formatCurrency(ap03.totais.totalPago));
    console.log('  • Total Devido (Justo):', formatCurrency(ap03.totais.totalDevido));
    console.log('  • 💰 DIFERENÇA TOTAL:', formatCurrency(ap03.totais.totalDiferenca));
    console.log('  • Diferença em Juros:', formatCurrency(ap03.totais.totalJuros));

    // ==========================================
    // 6. GERAR AP04/AP05 - RESTITUIÇÕES
    // ==========================================
    console.log('\n[Engine] 💵 Fase 6: Gerando Restituições');

    let ap04: ApendiceResult | undefined;
    let ap05: ApendiceResult | undefined;

    // Parâmetros para compensação mensal
    const paramsCompensacao = {
        ap01: ap03, // Usar AP03 que tem situacao
        ap02,
        taxaMercado: taxaMercadoDecimal,
        principal: principalRecalculo.toNumber(),
    };

    if (request.restituicaoEmDobro) {
        ap04 = gerarAP04_RestituicaoDobro(paramsCompensacao);
        console.log('  • AP04 (Dobro) gerado: Art. 42 CDC');
        console.log('    Total a restituir em dobro:', formatCurrency(ap04.totais.totalRestituir));
        if (ap04.descricao.includes('Quitação antecipada')) {
            console.log('    ⚡ QUITAÇÃO ANTECIPADA DETECTADA');
        }
    }

    ap05 = gerarAP05_RestituicaoSimples(paramsCompensacao);
    console.log('  • AP05 (Simples) gerado: Art. 368 CC');
    console.log('    Total a restituir:', formatCurrency(ap05.totais.totalRestituir));
    if (ap05.descricao.includes('Saldo CREDOR')) {
        console.log('    💰 SALDO CREDOR AO CLIENTE');
    }

    // ==========================================
    // 6.5. DETECTAR RENEGOCIAÇÃO (CADEIA DE CONTRATOS)
    // ==========================================
    const renegociacao = detectarRenegociacao(request.conciliacao, ap02);
    if (renegociacao.detectada) {
        console.log('\n[Engine] 🔄 Fase 6.5: Renegociação Detectada');
        console.log(`  • Parcela: ${renegociacao.mesRenegociacao}`);
        console.log(`  • Saldo Fidedigno: ${formatCurrency(renegociacao.saldoFidedigno || 0)}`);
        console.log('  ⚠️ Use este saldo como PV do próximo contrato');
    }

    // ==========================================
    // 7. MONTAR RESPOSTA
    // ==========================================
    console.log('\n[Engine] 📦 Fase 7: Montando Resposta Final');

    const endTime = performance.now();
    const tempoExecucaoMs = Math.round(endTime - startTime);

    const diferencaTotal = ap03.totais.totalRestituir;

    // Taxa anual equivalente (composta) - Fórmula: ((1 + mensal)^12 - 1) * 100
    const taxaMercadoAnual = (Math.pow(1 + taxaSnapshot.valor / 100, 12) - 1) * 100;

    // Calculate taxaContratoAnual from monthly if not provided
    const taxaContratoAnual = request.taxaContratoAnual ??
        (Math.pow(1 + request.taxaContratoMensal / 100, 12) - 1) * 100;

    const sobretaxaPercent = calcularSobretaxa(
        taxaContratoAnual,
        taxaMercadoAnual
    );

    console.log('  • Tempo total de execução:', tempoExecucaoMs, 'ms');
    console.log('  • Diferença Total:', formatCurrency(diferencaTotal));
    console.log('  • Taxa Contrato Anual (calculada):', taxaContratoAnual.toFixed(2), '%');
    console.log('  • Taxa Mercado Anual (composta):', taxaMercadoAnual.toFixed(2), '%');
    console.log('  • Sobretaxa:', sobretaxaPercent.toFixed(1), '%');
    console.log('  • É abusivo:', sobretaxaPercent >= 50 ? '⚠️ SIM (>= 50%)' : 'Não');

    const response: CalculoDetalhadoResponse = {
        calculadoEm: new Date().toISOString(),
        tempoExecucaoMs,
        versaoMotor: VERSAO_MOTOR,

        resumo: {
            valorFinanciado: request.valorFinanciado,
            valorTotalPago: ap01.totais.totalPago,
            valorTotalDevido: ap02.totais.totalPago,
            diferencaTotal,
            restituicaoSimples: diferencaTotal,
            restituicaoDobro: diferencaTotal * 2,
            economiaEstimada: diferencaTotal,
            taxaContratoAnual: taxaContratoAnual,
            taxaMercadoAnual,
            sobretaxaPercent,
            isAbusivo: sobretaxaPercent >= 50,
        },

        taxaSnapshot,

        apendices: {
            ap01,
            ap02,
            ap03,
            ap04,
            ap05,
        },

        flags: {
            capitalizacaoDiariaDetectada: analiseXTIR?.detectada ?? (request.capitalizacao === 'DIARIA'),
            anatocismoDetectado: analiseXTIR?.detectada ?? (request.capitalizacao === 'DIARIA'),
            tarifasIrregulares: request.expurgarTarifas && calcularTotalTarifasExpurgadas(request) > 0,
            segurosAbusivos: false,
            carenciaDetectada: diasCarencia > 30,
            diasCarencia: diasCarencia > 30 ? diasCarencia : undefined,
            jurosCarencia: jurosCarencia > 0 ? jurosCarencia : undefined,
        },

        // Análise XTIR detalhada
        analiseXTIR,

        // NOVO: Detecção de renegociação para cadeia de contratos
        renegociacao: renegociacao.detectada ? {
            detectada: true,
            mesRenegociacao: renegociacao.mesRenegociacao,
            dataRenegociacao: renegociacao.dataRenegociacao,
            saldoFidedigno: renegociacao.saldoFidedigno,
        } : undefined,

        formatted: {
            valorFinanciado: formatCurrency(request.valorFinanciado),
            valorTotalPago: formatCurrency(ap01.totais.totalPago),
            valorTotalDevido: formatCurrency(ap02.totais.totalPago),
            diferencaTotal: formatCurrency(diferencaTotal),
            restituicaoSimples: formatCurrency(diferencaTotal),
            restituicaoDobro: formatCurrency(diferencaTotal * 2),
            taxaContratoAnual: formatPercent(request.taxaContratoAnual),
            taxaMercadoAnual: formatPercent(taxaSnapshot.valor * 12),
            sobretaxaPercent: formatPercent(sobretaxaPercent),
        },
    };

    console.log('\n==========================================');
    console.log('[Engine] ✅ CÁLCULO DETALHADO FINALIZADO');
    console.log('==========================================');
    console.log('  Tempo Total:', tempoExecucaoMs, 'ms');
    console.log('  Diferença:', formatCurrency(diferencaTotal));
    console.log('==========================================\n');

    return response;
}

// ============================================================================
// GERAÇÃO DE APÊNDICES
// ============================================================================

interface GerarAPParams {
    principal: Decimal;
    prazo: number;
    taxaMensal: number;
    sistema: 'SAC' | 'PRICE' | 'SACRE';
    capitalizacao: 'MENSAL' | 'DIARIA';
    dataInicio: string;
    historicoIndices: MapaIndicesHistoricos;
    regraDefasagem: 'MES_CHEIO_ANTERIOR' | 'DEFASAGEM_2_MESES' | 'ACUMULADO_12_MESES';
    seguros?: {
        mip?: number;
        mipTipo?: 'FIXO' | 'PERCENTUAL_SALDO';
        dfi?: number;
        dfiTipo?: 'FIXO' | 'PERCENTUAL_IMOVEL';
        valorImovel?: number;
    };
    taxaAdm?: number;
    overrides?: OverrideParcela[];
    usarJurosSimples?: boolean;
    valorPrimeiraParcela?: number;
    // NOVO: Dados da conciliação para amortização extra e mora
    conciliacao?: Array<{
        numeroParcela: number;
        dataPagamento?: string;
        valorPago?: number;
        amortizacaoExtra?: number;
        isPago: boolean;
    }>;
    jurosMora?: number;        // % a.m. (padrão 1%)
    multaMoratoria?: number;   // % (padrão 2%)
    // NOVO: Data de liberação para cálculo de dias acumulados (capitalização diária)
    dataLiberacao?: string;     // YYYY-MM-DD
    // NOVO: Data do contrato para cálculo pro-rata da 1ª parcela
    dataContrato?: string;      // YYYY-MM-DD
}

/**
 * AP01 - Evolução Original (Cenário Banco)
 * Reproduz exatamente o que o banco cobrou
 */
function gerarAP01_EvolucaoOriginal(params: GerarAPParams): ApendiceResult {
    const tabela: LinhaAmortizacaoDetalhada[] = [];
    let saldoDevedor = params.principal;
    const taxaDecimal = new Decimal(params.taxaMensal);

    // Amortização constante para SAC
    const amortizacaoConstante = params.sistema === 'SAC'
        ? params.principal.div(params.prazo)
        : new Decimal(0);

    // PMT para PRICE
    let pmt = new Decimal(0);

    // Se foi informada uma parcela fixa (cobrada), usamos ela como base para PMT
    if (params.valorPrimeiraParcela && params.valorPrimeiraParcela > 0) {
        pmt = new Decimal(params.valorPrimeiraParcela);
    }
    // Caso contrário, calculamos pela fórmula matemática
    else if (params.sistema === 'PRICE') {
        pmt = calcularPMT(params.principal, taxaDecimal, params.prazo);
    }

    let totalCorrecao = 0;
    let totalJuros = 0;
    let totalSeguros = 0;
    let totalTarifas = 0;
    let totalPago = 0;
    let diferencaAcumulada = 0;

    // ========================================
    // MOMENTO ZERO (t=0): Linha inicial do empréstimo
    // Mostra o saldo devedor inicial antes de qualquer pagamento
    // Essencial para cálculo XTIR e visualização completa
    // ========================================
    tabela.push({
        mes: 0,
        data: params.dataInicio,
        saldoAbertura: 0,
        indiceCorrecao: 0,
        correcaoMonetaria: 0,
        saldoCorrigido: 0,
        juros: 0,
        amortizacao: 0,
        saldoDevedor: params.principal.toNumber(),
        seguroMIP: 0,
        seguroDFI: 0,
        taxaAdm: 0,
        parcelaBase: 0,
        parcelaTotal: 0,
        diferenca: 0,
        diferencaAcumulada: 0,
        diasEntreParcelas: 0,
        fatorNaoPeriodico: 1,
        quocienteXTIR: 0,
        status: 'PAGO', // t=0 é sempre "executado" (o empréstimo foi concedido)
    });

    for (let mes = 1; mes <= params.prazo; mes++) {
        const dataVencimento = adicionarMeses(params.dataInicio, mes - 1);
        const saldoAbertura = saldoDevedor.toNumber();

        // 1. Buscar índice de correção do mapa (sem await!)
        const indiceCorrecao = obterIndicePorData(
            params.historicoIndices,
            dataVencimento,
            params.regraDefasagem
        );

        // 2. Aplicar correção monetária
        // NOVO: Pro-rata na 1ª parcela (dias corridos entre contrato e 1º vencimento)
        let fatorProRata = 1;
        if (mes === 1 && params.dataContrato && params.dataInicio) {
            const diasDecorridos = calcularDiasEntre(params.dataContrato, dataVencimento);
            fatorProRata = diasDecorridos / 30;
            // Log apenas na 1ª parcela
            if (fatorProRata !== 1) {
                console.log(`  [Pro-rata] 1ª parcela: ${diasDecorridos} dias → fator ${fatorProRata.toFixed(4)}`);
            }
        }
        const correcaoMonetaria = saldoDevedor.times(indiceCorrecao * fatorProRata).toNumber();
        const saldoCorrigido = saldoDevedor.plus(correcaoMonetaria);

        // 3. Calcular juros
        let juros: Decimal;
        if (params.capitalizacao === 'DIARIA') {
            // Capitalização diária (30 dias comerciais)
            juros = calcularJurosDiarios(saldoCorrigido, taxaDecimal, 30);
        } else {
            juros = saldoCorrigido.times(taxaDecimal);
        }

        // 4. Calcular amortização
        let amortizacao: Decimal;
        let parcelaBase: Decimal;
        const prazoRemanescente = params.prazo - mes + 1;

        if (params.sistema === 'SAC') {
            // SAC: Amortização = Saldo Corrigido / Prazo Remanescente
            amortizacao = saldoCorrigido.div(prazoRemanescente);
            parcelaBase = amortizacao.plus(juros);
        } else {
            // PRICE com correção monetária:
            // Recalcular PMT a cada mês sobre saldo CORRIGIDO e prazo remanescente
            // Isso garante que o saldo zera exatamente no último mês
            const pmtAtualizado = calcularPMT(saldoCorrigido, taxaDecimal, prazoRemanescente);
            parcelaBase = pmtAtualizado;
            amortizacao = pmtAtualizado.minus(juros);
        }

        // 5. Calcular seguros
        let seguroMIP = 0;
        let seguroDFI = 0;

        if (params.seguros?.mip) {
            if (params.seguros.mipTipo === 'PERCENTUAL_SALDO') {
                seguroMIP = saldoCorrigido.times(params.seguros.mip / 100).toNumber();
            } else {
                seguroMIP = params.seguros.mip;
            }
        }

        if (params.seguros?.dfi) {
            if (params.seguros.dfiTipo === 'PERCENTUAL_IMOVEL' && params.seguros.valorImovel) {
                seguroDFI = params.seguros.valorImovel * (params.seguros.dfi / 100);
            } else {
                seguroDFI = params.seguros.dfi;
            }
        }

        const taxaAdm = params.taxaAdm || 0;

        // 6. Verificar override
        const override = params.overrides?.find(o => o.numeroParcela === mes);
        let status: 'PAGO' | 'PENDENTE' | 'OVERRIDE' | 'PROJETADO' = 'PROJETADO';

        if (override) {
            status = 'OVERRIDE';
            if (override.tipo === 'AMORTIZACAO_EXTRA' && override.amortizacaoExtra) {
                saldoDevedor = saldoDevedor.minus(override.amortizacaoExtra);
            }
        }

        // 7. Atualizar saldo devedor
        saldoDevedor = saldoCorrigido.minus(amortizacao);
        if (saldoDevedor.lessThan(0)) saldoDevedor = new Decimal(0);

        // 8. Calcular totais
        const parcelaTotal = parcelaBase.plus(seguroMIP).plus(seguroDFI).plus(taxaAdm);

        totalCorrecao += correcaoMonetaria;
        totalJuros += juros.toNumber();
        totalSeguros += seguroMIP + seguroDFI;
        totalTarifas += taxaAdm;
        totalPago += parcelaTotal.toNumber();

        // 9. Calcular campos técnicos XTIR
        const dataAnterior = mes === 1 ? params.dataInicio : adicionarMeses(params.dataInicio, mes - 2);
        const diasEntreParcelas = calcularDiasEntre(dataAnterior, dataVencimento);

        // Fator Não Periódico: (1 + i)^(dias/30)
        const fatorNaoPeriodico = Math.pow(1 + params.taxaMensal, diasEntreParcelas / 30);

        // Quociente XTIR: parcela / saldoDevedorAnterior
        const quocienteXTIR = saldoAbertura > 0 ? parcelaTotal.toNumber() / saldoAbertura : 0;

        // NEW: Campos específicos para Capitalização Diária
        let diasAcumulados: number | undefined;
        let quocienteDiario: number | undefined;

        if (params.capitalizacao === 'DIARIA') {
            // Dias acumulados desde a data de liberação (ou dataInicio se não informada)
            const dataBase = params.dataLiberacao || params.dataInicio;
            diasAcumulados = calcularDiasEntre(dataBase, dataVencimento);

            // Quociente = 1 / (1 + taxa)^(diasAcumulados/30)
            quocienteDiario = 1 / Math.pow(1 + params.taxaMensal, diasAcumulados / 30);
        }

        // 10. NOVO: Calcular encargos moratórios se houver atraso
        const dadosConciliacao = params.conciliacao?.find(c => c.numeroParcela === mes);
        let diasAtraso = 0;
        let encargosMora = 0;
        let principalPago = 0;

        if (dadosConciliacao?.dataPagamento && dadosConciliacao.dataPagamento !== dataVencimento) {
            const dataVenc = new Date(dataVencimento);
            const dataPgto = new Date(dadosConciliacao.dataPagamento);
            diasAtraso = Math.max(0, Math.floor((dataPgto.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24)));

            if (diasAtraso > 0) {
                const jurosMora = params.jurosMora ?? 1; // % a.m.
                const multaMoratoria = params.multaMoratoria ?? 2; // %
                const baseCalculo = parcelaTotal.toNumber();

                // Juros de mora pro-rata
                const jurosMoraValor = baseCalculo * (jurosMora / 100) * (diasAtraso / 30);
                // Multa fixa
                const multaValor = baseCalculo * (multaMoratoria / 100);

                encargosMora = jurosMoraValor + multaValor;

                // Separar principal de encargos
                if (dadosConciliacao.valorPago) {
                    principalPago = Math.max(0, dadosConciliacao.valorPago - encargosMora);
                }
            }
        }

        tabela.push({
            mes,
            data: dataVencimento,
            saldoAbertura,
            indiceCorrecao,
            correcaoMonetaria,
            saldoCorrigido: saldoCorrigido.toNumber(),
            juros: juros.toNumber(),
            amortizacao: amortizacao.toNumber(),
            saldoDevedor: saldoDevedor.toNumber(),
            seguroMIP,
            seguroDFI,
            taxaAdm,
            parcelaBase: parcelaBase.toNumber(),
            parcelaTotal: parcelaTotal.toNumber(),
            diferenca: 0, // Será preenchido no AP03
            diferencaAcumulada: 0,
            // Campos técnicos XTIR
            diasEntreParcelas,
            fatorNaoPeriodico,
            quocienteXTIR,
            // Campos específicos para Capitalização Diária
            diasAcumulados,
            quocienteDiario,
            status,
            override,
        });
    }

    return {
        tipo: 'AP01',
        titulo: 'Evolução Original (Cenário Banco)',
        descricao: 'Reprodução exata dos valores cobrados pelo banco, incluindo seguros, tarifas e correção monetária conforme contrato.',
        tabela,
        totais: {
            principal: params.principal.toNumber(),
            totalCorrecao,
            totalJuros,
            totalSeguros,
            totalTarifas,
            totalPago,
            totalDevido: totalPago,
            totalDiferenca: 0,
            totalRestituir: 0,
        },
    };
}

/**
 * AP02 - Recálculo (Cenário Justo)
 * Valores que deveriam ter sido cobrados usando taxa BACEN
 */
function gerarAP02_Recalculo(params: GerarAPParams): ApendiceResult {
    const tabela: LinhaAmortizacaoDetalhada[] = [];
    let saldoDevedor = params.principal;
    const taxaDecimal = new Decimal(params.taxaMensal);

    // Para Juros Simples (Gauss), amortização linear
    const amortizacaoConstante = params.principal.div(params.prazo);

    // PMT para PRICE
    let pmt = new Decimal(0);
    if (params.sistema === 'PRICE' && !params.usarJurosSimples) {
        pmt = calcularPMT(params.principal, taxaDecimal, params.prazo);
    }

    let totalCorrecao = 0;
    let totalJuros = 0;
    let totalSeguros = 0;
    let totalTarifas = 0;
    let totalPago = 0;

    // ========================================
    // MOMENTO ZERO (t=0): Linha inicial do empréstimo
    // Mostra o saldo devedor inicial antes de qualquer pagamento
    // ========================================
    tabela.push({
        mes: 0,
        data: params.dataInicio,
        saldoAbertura: 0,
        indiceCorrecao: 0,
        correcaoMonetaria: 0,
        saldoCorrigido: 0,
        juros: 0,
        amortizacao: 0,
        saldoDevedor: params.principal.toNumber(),
        seguroMIP: 0,
        seguroDFI: 0,
        taxaAdm: 0,
        parcelaBase: 0,
        parcelaTotal: 0,
        diferenca: 0,
        diferencaAcumulada: 0,
        status: 'PAGO',
    });

    for (let mes = 1; mes <= params.prazo; mes++) {
        const dataVencimento = adicionarMeses(params.dataInicio, mes - 1);
        const saldoAbertura = saldoDevedor.toNumber();

        // NOVO: Buscar dados da conciliação para esta parcela
        const dadosConciliacao = params.conciliacao?.find(c => c.numeroParcela === mes);
        const amortExtra = new Decimal(dadosConciliacao?.amortizacaoExtra || 0);

        // 1. Índice de correção (do mapa)
        const indiceCorrecao = obterIndicePorData(
            params.historicoIndices,
            dataVencimento,
            params.regraDefasagem
        );

        // 2. Correção monetária
        // NOVO: Pro-rata na 1ª parcela (dias corridos entre contrato e 1º vencimento)
        let fatorProRata = 1;
        if (mes === 1 && params.dataContrato && params.dataInicio) {
            const diasDecorridos = calcularDiasEntre(params.dataContrato, dataVencimento);
            fatorProRata = diasDecorridos / 30;
        }
        const correcaoMonetaria = saldoDevedor.times(indiceCorrecao * fatorProRata).toNumber();
        const saldoCorrigido = saldoDevedor.plus(correcaoMonetaria);

        // 3. Juros (sempre capitalização mensal no recálculo)
        let juros: Decimal;
        if (params.usarJurosSimples) {
            // Juros simples sobre saldo corrigido
            juros = saldoCorrigido.times(taxaDecimal);
        } else {
            juros = saldoCorrigido.times(taxaDecimal);
        }

        // 4. Amortização
        let amortizacao: Decimal;
        let parcelaBase: Decimal;
        const prazoRemanescente = params.prazo - mes + 1;

        if (params.sistema === 'SAC' || params.usarJurosSimples) {
            // SAC: Amortização = Saldo Corrigido / Prazo Remanescente
            amortizacao = saldoCorrigido.div(prazoRemanescente);
            parcelaBase = amortizacao.plus(juros);
        } else {
            // PRICE com correção monetária:
            // Recalcular PMT a cada mês sobre saldo CORRIGIDO e prazo remanescente
            const pmtAtualizado = calcularPMT(saldoCorrigido, taxaDecimal, prazoRemanescente);
            parcelaBase = pmtAtualizado;
            amortizacao = pmtAtualizado.minus(juros);
        }

        // 5. Seguros (se não expurgados)
        let seguroMIP = 0;
        let seguroDFI = 0;

        if (params.seguros?.mip) {
            if (params.seguros.mipTipo === 'PERCENTUAL_SALDO') {
                seguroMIP = saldoCorrigido.times(params.seguros.mip / 100).toNumber();
            } else {
                seguroMIP = params.seguros.mip;
            }
        }

        if (params.seguros?.dfi) {
            if (params.seguros.dfiTipo === 'PERCENTUAL_IMOVEL' && params.seguros.valorImovel) {
                seguroDFI = params.seguros.valorImovel * (params.seguros.dfi / 100);
            } else {
                seguroDFI = params.seguros.dfi;
            }
        }

        // 6. NOVO: Aplicar amortização extraordinária
        const amortizacaoTotal = amortizacao.plus(amortExtra);

        // 7. Atualizar saldo
        saldoDevedor = saldoCorrigido.minus(amortizacaoTotal);
        if (saldoDevedor.lessThan(0)) saldoDevedor = new Decimal(0);

        // 8. NOVO: RECÁLCULO EM CASCATA - Se houver amort. extra, recalcular PMT
        if (amortExtra.greaterThan(0) && params.sistema === 'PRICE' && !params.usarJurosSimples) {
            const mesesRestantes = params.prazo - mes;
            if (mesesRestantes > 0 && saldoDevedor.greaterThan(0)) {
                pmt = calcularPMT(saldoDevedor, taxaDecimal, mesesRestantes);
                console.log(`[AP02] 🔄 Recálculo em cascata: Mes ${mes}, Amort.Extra: ${amortExtra.toFixed(2)}, Novo PMT: ${pmt.toFixed(2)}`);
            }
        }

        // 9. Totais
        const parcelaTotal = parcelaBase.plus(seguroMIP).plus(seguroDFI);

        totalCorrecao += correcaoMonetaria;
        totalJuros += juros.toNumber();
        totalSeguros += seguroMIP + seguroDFI;
        totalPago += parcelaTotal.toNumber();

        tabela.push({
            mes,
            data: dataVencimento,
            saldoAbertura,
            indiceCorrecao,
            correcaoMonetaria,
            saldoCorrigido: saldoCorrigido.toNumber(),
            juros: juros.toNumber(),
            amortizacao: amortizacao.toNumber(),
            saldoDevedor: saldoDevedor.toNumber(),
            seguroMIP,
            seguroDFI,
            parcelaBase: parcelaBase.toNumber(),
            parcelaTotal: parcelaTotal.toNumber(),
            diferenca: 0,
            diferencaAcumulada: 0,
            status: 'PROJETADO',
        });
    }

    return {
        tipo: 'AP02',
        titulo: 'Evolução Recalculada (Cenário Justo)',
        descricao: 'Valores que deveriam ter sido cobrados utilizando a taxa média de mercado do BACEN e expurgando tarifas irregulares.',
        tabela,
        totais: {
            principal: params.principal.toNumber(),
            totalCorrecao,
            totalJuros,
            totalSeguros,
            totalTarifas,
            totalPago,
            totalDevido: totalPago,
            totalDiferenca: 0,
            totalRestituir: 0,
        },
    };
}

/**
 * AP03 - Diferenças Nominais
 * Compara AP01 (banco) vs AP02 (justo) mês a mês
 * Adiciona classificação de situação (PAGA/VENCIDA/VINCENDA)
 */
interface GerarAP03Params {
    ap01: ApendiceResult;
    ap02: ApendiceResult;
    dataCalculo: string;
    conciliacao?: Array<{
        numeroParcela: number;
        dataPagamento?: string;
        valorPago?: number;
        isPago: boolean;
    }>;
}

function gerarAP03_Diferencas(params: GerarAP03Params): ApendiceResult {
    const { ap01, ap02, dataCalculo, conciliacao } = params;
    const tabela: LinhaAmortizacaoDetalhada[] = [];
    let diferencaAcumulada = 0;

    const dataRef = new Date(dataCalculo);

    for (let i = 0; i < ap01.tabela.length; i++) {
        const linhaBanco = ap01.tabela[i];
        const linhaJusto = ap02.tabela[i];
        const dataVenc = new Date(linhaBanco.data);

        // Determinar situação da parcela
        const dadosConciliacao = conciliacao?.find(c => c.numeroParcela === linhaBanco.mes);
        let situacao: 'PAGA' | 'VENCIDA' | 'VINCENDA';

        if (dadosConciliacao?.isPago) {
            situacao = 'PAGA';
        } else if (dataVenc < dataRef) {
            situacao = 'VENCIDA';
        } else {
            situacao = 'VINCENDA';
        }

        const diferenca = linhaBanco.parcelaTotal - linhaJusto.parcelaTotal;
        diferencaAcumulada += Math.max(0, diferenca); // Só acumula diferença positiva

        tabela.push({
            ...linhaBanco,
            jurosMercado: linhaJusto.juros,
            parcelaMercado: linhaJusto.parcelaTotal,
            diferenca,
            diferencaAcumulada,
            // NEW: Campos de situação
            situacao,
            valorPago: dadosConciliacao?.valorPago ?? linhaBanco.parcelaTotal,
            valorDevido: linhaJusto.parcelaTotal,
        });
    }

    const totalDiferenca = ap01.totais.totalPago - ap02.totais.totalPago;

    return {
        tipo: 'AP03',
        titulo: 'Demonstrativo das Diferenças Excedentes',
        descricao: 'Comparativo mês a mês entre os valores cobrados pelo banco e os valores devidos, com classificação de situação (PAGA/VENCIDA/VINCENDA).',
        tabela,
        totais: {
            principal: ap01.totais.principal,
            totalCorrecao: ap01.totais.totalCorrecao - ap02.totais.totalCorrecao,
            totalJuros: ap01.totais.totalJuros - ap02.totais.totalJuros,
            totalSeguros: ap01.totais.totalSeguros - ap02.totais.totalSeguros,
            totalTarifas: ap01.totais.totalTarifas,
            totalPago: ap01.totais.totalPago,
            totalDevido: ap02.totais.totalPago,
            totalDiferenca,
            totalRestituir: Math.max(0, totalDiferenca),
        },
    };
}

/**
 * AP04 - Restituição em Dobro (Art. 42 CDC)
 * Simula abatimento MENSAL no saldo devedor com compensação em dobro
 * Exibe quitação antecipada e saldo credor quando aplicável
 */
interface GerarAP04Params {
    ap01: ApendiceResult;
    ap02: ApendiceResult;
    taxaMercado: number;
    principal: number;
}

function gerarAP04_RestituicaoDobro(params: GerarAP04Params): ApendiceResult {
    const { ap01, ap02, taxaMercado, principal } = params;
    const tabela: LinhaAmortizacaoDetalhada[] = [];
    let saldoDevedor = principal;
    let totalRestituir = 0;
    let quitacaoOcorreu = false;
    let mesQuitacao = 0;

    for (let i = 0; i < ap01.tabela.length; i++) {
        const linhaBanco = ap01.tabela[i];
        const linhaJusto = ap02.tabela[i];

        const prestacaoPaga = linhaBanco.parcelaTotal;
        const prestacaoDevida = linhaJusto.parcelaTotal;
        const diferenca = Math.max(0, prestacaoPaga - prestacaoDevida);

        // Juros devidos sobre saldo corrente (taxa de mercado)
        const jurosDevidos = saldoDevedor > 0 ? saldoDevedor * taxaMercado : 0;

        // Amortização = (Prestação Paga - Juros Devidos) + Diferença * 2
        // Art. 42 CDC: restituição em dobro
        const amortizacaoNormal = Math.max(0, prestacaoPaga - jurosDevidos);
        const creditoDobro = diferenca * 2;
        const amortizacaoCompensada = amortizacaoNormal + creditoDobro;

        // Atualizar saldo
        const saldoAnterior = saldoDevedor;
        saldoDevedor = saldoDevedor - amortizacaoCompensada;

        // Verificar quitação antecipada
        let saldoCredor = 0;
        if (saldoDevedor < 0 && !quitacaoOcorreu) {
            saldoCredor = Math.abs(saldoDevedor);
            quitacaoOcorreu = true;
            mesQuitacao = linhaBanco.mes;
        }

        totalRestituir += creditoDobro;

        tabela.push({
            ...linhaBanco,
            valorPago: prestacaoPaga,
            valorDevido: prestacaoDevida,
            diferenca: creditoDobro, // Diferença em dobro
            diferencaAcumulada: totalRestituir,
            juros: jurosDevidos,
            jurosMercado: jurosDevidos,
            amortizacao: amortizacaoNormal,
            amortizacaoCompensada,
            saldoDevedor: Math.max(0, saldoDevedor),
            saldoDevedorCompensado: saldoDevedor,
            saldoCredor: saldoCredor > 0 ? saldoCredor : undefined,
            quitacaoAntecipada: saldoDevedor <= 0 && saldoAnterior > 0,
            situacao: linhaBanco.situacao,
        });
    }

    return {
        tipo: 'AP04',
        titulo: 'Restituição em Dobro (Art. 42 CDC)',
        descricao: quitacaoOcorreu
            ? `Compensação mensal em dobro conforme Art. 42 do CDC. Quitação antecipada na parcela ${mesQuitacao}.`
            : 'Compensação mensal em dobro conforme Art. 42 do Código de Defesa do Consumidor.',
        tabela,
        totais: {
            ...ap01.totais,
            totalRestituir,
            totalDiferenca: totalRestituir,
        },
    };
}

/**
 * AP05 - Restituição Simples (Art. 368 CC)
 * Simula abatimento MENSAL simples (1:1) no saldo devedor
 * Para vincendas, recalcula prestação com saldo fidedigno
 */
function gerarAP05_RestituicaoSimples(params: GerarAP04Params): ApendiceResult {
    const { ap01, ap02, taxaMercado, principal } = params;
    const tabela: LinhaAmortizacaoDetalhada[] = [];
    let saldoDevedor = principal;
    let totalRestituir = 0;
    let quitacaoOcorreu = false;
    let mesQuitacao = 0;

    // Calcular prazo restante para recálculo de vincendas
    const prazoTotal = ap01.tabela.length;

    for (let i = 0; i < ap01.tabela.length; i++) {
        const linhaBanco = ap01.tabela[i];
        const linhaJusto = ap02.tabela[i];
        const isVincenda = linhaBanco.situacao === 'VINCENDA';

        const prestacaoPaga = linhaBanco.parcelaTotal;
        const prestacaoDevida = linhaJusto.parcelaTotal;
        const diferenca = Math.max(0, prestacaoPaga - prestacaoDevida);

        // Para vincendas, recalcular prestação com saldo fidedigno
        let prestacaoRecalculada = prestacaoDevida;
        if (isVincenda && saldoDevedor > 0) {
            const prazoRestante = prazoTotal - i;
            if (prazoRestante > 0) {
                // PMT = PV * [i * (1+i)^n] / [(1+i)^n - 1]
                const fator = Math.pow(1 + taxaMercado, prazoRestante);
                prestacaoRecalculada = saldoDevedor * (taxaMercado * fator) / (fator - 1);
            }
        }

        // Juros devidos sobre saldo corrente
        const jurosDevidos = saldoDevedor > 0 ? saldoDevedor * taxaMercado : 0;

        // Amortização = (Prestação Paga - Juros Devidos) + Diferença (simples)
        const amortizacaoNormal = Math.max(0, prestacaoPaga - jurosDevidos);
        const creditoSimples = diferenca;
        const amortizacaoCompensada = amortizacaoNormal + creditoSimples;

        // Atualizar saldo
        const saldoAnterior = saldoDevedor;
        saldoDevedor = saldoDevedor - amortizacaoCompensada;

        // Verificar quitação
        let saldoCredor = 0;
        if (saldoDevedor < 0 && !quitacaoOcorreu) {
            saldoCredor = Math.abs(saldoDevedor);
            quitacaoOcorreu = true;
            mesQuitacao = linhaBanco.mes;
        }

        totalRestituir += creditoSimples;

        tabela.push({
            ...linhaBanco,
            valorPago: prestacaoPaga,
            valorDevido: isVincenda ? prestacaoRecalculada : prestacaoDevida,
            diferenca: creditoSimples,
            diferencaAcumulada: totalRestituir,
            juros: jurosDevidos,
            jurosMercado: jurosDevidos,
            amortizacao: amortizacaoNormal,
            amortizacaoCompensada,
            saldoDevedor: Math.max(0, saldoDevedor),
            saldoDevedorCompensado: saldoDevedor,
            saldoCredor: saldoCredor > 0 ? saldoCredor : undefined,
            quitacaoAntecipada: saldoDevedor <= 0 && saldoAnterior > 0,
            situacao: linhaBanco.situacao,
        });
    }

    const saldoFinal = tabela[tabela.length - 1]?.saldoDevedorCompensado ?? 0;

    return {
        tipo: 'AP05',
        titulo: 'Restituição Simples (Art. 368 CC)',
        descricao: saldoFinal < 0
            ? `Compensação mensal simples conforme Art. 368 do Código Civil. Saldo CREDOR ao cliente: R$ ${Math.abs(saldoFinal).toFixed(2)}.`
            : `Compensação mensal simples. Real Saldo Devedor: R$ ${Math.max(0, saldoFinal).toFixed(2)}.`,
        tabela,
        totais: {
            ...ap01.totais,
            totalRestituir,
            totalDiferenca: totalRestituir,
        },
    };
}

/**
 * Detecta parcela com status RENEGOCIADO e captura saldo fidedigno
 * Usado para cadeia de contratos (renegociações sucessivas)
 */
interface RenegociacaoDetectada {
    detectada: boolean;
    mesRenegociacao?: number;
    dataRenegociacao?: string;
    saldoFidedigno?: number;        // Saldo do AP02 na data da renegociação
    saldoBancoImposoto?: number;    // Saldo que o banco alegou
    diferencaSaldo?: number;        // saldoBanco - saldoFidedigno
}

function detectarRenegociacao(
    conciliacao?: Array<{
        numeroParcela: number;
        status?: 'PAGO' | 'EM_ABERTO' | 'RENEGOCIADO' | 'ATRASO';
        dataPagamento?: string;
    }>,
    ap02?: ApendiceResult
): RenegociacaoDetectada {
    if (!conciliacao || !ap02) {
        return { detectada: false };
    }

    // Procurar parcela com status RENEGOCIADO
    const parcelaRenegociada = conciliacao.find(c => c.status === 'RENEGOCIADO');

    if (!parcelaRenegociada) {
        return { detectada: false };
    }

    // Capturar saldo fidedigno do AP02
    const linhaAP02 = ap02.tabela.find(l => l.mes === parcelaRenegociada.numeroParcela);
    const saldoFidedigno = linhaAP02?.saldoDevedor ?? 0;

    console.log(`[Engine] 🔄 Renegociação detectada na parcela ${parcelaRenegociada.numeroParcela}`);
    console.log(`  • Saldo Fidedigno (AP02): ${formatCurrency(saldoFidedigno)}`);

    return {
        detectada: true,
        mesRenegociacao: parcelaRenegociada.numeroParcela,
        dataRenegociacao: parcelaRenegociada.dataPagamento,
        saldoFidedigno,
    };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcula juros pro-rata para período de carência
 * Fórmula: (1 + i)^(dias/30) - 1
 */
function calcularJurosProRata(taxaMensal: number, dias: number): number {
    const taxa = new Decimal(taxaMensal);
    const expoente = new Decimal(dias).div(30);
    return new Decimal(1).plus(taxa).pow(expoente).minus(1).toNumber();
}

/**
 * Calcula juros com capitalização diária
 * Fórmula: SD * ((1 + i)^(d/30) - 1)
 */
function calcularJurosDiarios(saldo: Decimal, taxaMensal: Decimal, dias: number): Decimal {
    const expoente = new Decimal(dias).div(30);
    const fator = new Decimal(1).plus(taxaMensal).pow(expoente).minus(1);
    return saldo.times(fator);
}

/**
 * Calcula PMT (Prestação da Tabela Price)
 * Fórmula: PV * [i * (1+i)^n] / [(1+i)^n - 1]
 */
function calcularPMT(pv: Decimal, taxaMensal: Decimal, prazo: number): Decimal {
    const um = new Decimal(1);
    const fator = um.plus(taxaMensal).pow(prazo);
    const numerador = taxaMensal.times(fator);
    const denominador = fator.minus(um);
    return pv.times(numerador.div(denominador));
}

/**
 * Calcula total de tarifas a expurgar
 */
function calcularTotalTarifasExpurgadas(request: CalculoDetalhadoRequest): number {
    let total = 0;

    if (request.tarifaTAC) total += request.tarifaTAC;
    if (request.tarifaAvaliacao) total += request.tarifaAvaliacao;
    if (request.tarifaRegistro) total += request.tarifaRegistro;

    if (request.outrasTarifas) {
        for (const tarifa of request.outrasTarifas) {
            if (tarifa.expurgar) {
                total += tarifa.valor;
            }
        }
    }

    return total;
}

/**
 * Calcula sobretaxa em percentual
 */
function calcularSobretaxa(taxaContrato: number, taxaMercado: number): number {
    if (taxaMercado <= 0) return 0;
    return ((taxaContrato - taxaMercado) / taxaMercado) * 100;
}

/**
 * Calcula dias entre duas datas
 */
function calcularDiasEntre(dataInicio: string, dataFim: string): number {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = fim.getTime() - inicio.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Adiciona meses a uma data
 */
function adicionarMeses(dataStr: string, meses: number): string {
    const data = new Date(dataStr);
    data.setMonth(data.getMonth() + meses);
    return data.toISOString().split('T')[0];
}
