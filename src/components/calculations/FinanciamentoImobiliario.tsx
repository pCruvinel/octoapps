'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AnalisePreviaRequest,
  AnalisePreviaResponse,
  RelatorioCompletoRequest,
  RelatorioCompletoResponse,
  FaixaTaxa,
  EncargosMensais,
} from '@/types/calculation.types';
import { parseNumber } from '@/utils/parseNumber';
import { formatCurrencyInput } from '@/utils/formatCurrency';
import { financiamentosService } from '@/services/financiamentos.service';

interface FinanciamentoImobiliarioProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
}

export function FinanciamentoImobiliario({ calcId, onNavigate }: FinanciamentoImobiliarioProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Identificação
    credor: '',
    devedor: '',
    contratoNum: '',
    tipoContrato: 'financiamento',
    dataCalculo: '',

    // Parâmetros do financiamento
    valorBem: '',
    entrada: '',
    valorFinanciado: '',
    quantidadeParcelas: '',
    dataPrimeiraParcela: '',
    dataContrato: '',

    // Sistema e indexador
    sistemaAmortizacao: 'sac',
    indiceCorrecao: 'tr',

    // Taxas
    taxaMensalContrato: '',
    taxaAnualContrato: '',
    taxaMensalMercado: '0.0062', // 0.62% a.m. (padrão)

    // Seguros e encargos (primeira parcela)
    mip: '',
    dfi: '',
    tca: '',
    multa: '',
    mora: '',

    // Configurações
    horizonteMeses: '12',
  });


  // Helper: Auto-save calculation results to database
  const saveCalculationResults = async (
    ap01: any,
    ap05: any,
    ap03: any,
    taxaContratoAM: number,
    taxaMercadoAM: number
  ): Promise<string> => {
    try {
      // First, ensure the case is saved
      let financiamentoId = calcId;

      if (!financiamentoId) {
        // Auto-save the case first
        const dataToSave = {
          credor: formData.credor,
          devedor: formData.devedor,
          contrato_num: formData.contratoNum || null,
          tipo_contrato: 'Financiamento' as const,
          data_calculo: formData.dataCalculo || new Date().toISOString().split('T')[0],
          valor_bem: formData.valorBem ? parseNumber(formData.valorBem) : null,
          entrada: formData.entrada ? parseNumber(formData.entrada) : null,
          valor_financiado: parseNumber(formData.valorFinanciado),
          quantidade_parcelas: parseInt(formData.quantidadeParcelas),
          data_primeira_parcela: formData.dataPrimeiraParcela,
          data_contrato: formData.dataContrato || null,
          sistema_amortizacao: formData.sistemaAmortizacao.toUpperCase() as 'SAC',
          indice_correcao: formData.indiceCorrecao.toUpperCase() as 'TR',
          taxa_mensal_contrato: parseNumber(formData.taxaMensalContrato),
          taxa_anual_contrato: formData.taxaAnualContrato ? parseNumber(formData.taxaAnualContrato) : null,
          taxa_mensal_mercado: parseNumber(formData.taxaMensalMercado),
          mip_primeira_parcela: formData.mip ? parseNumber(formData.mip) : null,
          dfi_primeira_parcela: formData.dfi ? parseNumber(formData.dfi) : null,
          tca_primeira_parcela: formData.tca ? parseNumber(formData.tca) : null,
          multa_primeira_parcela: formData.multa ? parseNumber(formData.multa) : null,
          mora_primeira_parcela: formData.mora ? parseNumber(formData.mora) : null,
          horizonte_meses: parseInt(formData.horizonteMeses),
          status: 'Em Análise' as const,
        };

        const created = await financiamentosService.create(dataToSave);
        financiamentoId = created.id;
      }

      // Update calculated results
      await financiamentosService.updateCalculatedResults(financiamentoId, {
        taxa_contrato_am: taxaContratoAM * 100, // Convert to percentage
        taxa_mercado_am: taxaMercadoAM * 100,
        sobretaxa_pp: ap03.totais.sobretaxaPP * 100,
        valor_total_pago: ap01.totais.totalPago,
        valor_total_devido: ap05.totais.totalDevido,
        diferenca_restituicao: ap03.totais.totalRestituir,
      });

      // Save amortization tables (AP01, AP05, AP03)
      const amortizacaoAP01 = ap01.tabela.map((row: any) => ({
        mes: row.mes,
        data: row.data,
        valor_original_parcela: row.valorOriginalParcela || 0,
        valor_corrigido: row.valorCorrigido || 0,
        juros: row.juros || 0,
        amortizacao: row.amortizacao || 0,
        saldo_devedor: row.saldoDevedor || 0,
        mip: row.MIP || null,
        dfi: row.DFI || null,
        tca: row.TCA || null,
        multa: row.multa || null,
        mora: row.mora || null,
        total_pago: row.totalPago || null,
      }));

      const amortizacaoAP05 = ap05.tabela.map((row: any) => ({
        mes: row.mes,
        data: row.data,
        valor_original_parcela: row.valorOriginalParcela || 0,
        valor_corrigido: row.valorCorrigido || 0,
        juros: row.juros || 0,
        amortizacao: row.amortizacao || 0,
        saldo_devedor: row.saldoDevedor || 0,
      }));

      const amortizacaoAP03 = ap03.tabela.map((row: any) => ({
        mes: row.mes,
        data: row.data,
        valor_original_parcela: 0,
        valor_corrigido: 0,
        juros: 0,
        amortizacao: 0,
        saldo_devedor: 0,
        diferenca: row.diferenca || 0,
      }));

      // Save all amortization tables sequentially to avoid conflicts
      console.log('💾 Saving amortization tables...');
      await financiamentosService.saveAmortizacao(financiamentoId, 'AP01', amortizacaoAP01);
      await financiamentosService.saveAmortizacao(financiamentoId, 'AP05', amortizacaoAP05);
      await financiamentosService.saveAmortizacao(financiamentoId, 'AP03', amortizacaoAP03);
      console.log('✅ All amortization tables saved successfully');

      return financiamentoId;
    } catch (error) {
      console.error('Error saving calculation results:', error);
      throw error;
    }
  };

  // Carregar dados quando estiver editando
  useEffect(() => {
    const loadCase = async () => {
      if (calcId) {
        console.log('📥 Loading case with ID:', calcId);
        try {
          setLoading(true);
          const financiamento = await financiamentosService.getById(calcId);

          if (!financiamento) {
            toast.error('Caso não encontrado');
            onNavigate('calculations');
            return;
          }

          console.log('✅ Case loaded successfully:', financiamento);

          // Map database fields to form data
          setFormData({
            credor: financiamento.credor,
            devedor: financiamento.devedor,
            contratoNum: financiamento.contrato_num || '',
            tipoContrato: financiamento.tipo_contrato?.toLowerCase() || 'financiamento',
            dataCalculo: financiamento.data_calculo || new Date().toISOString().split('T')[0],
            valorBem: financiamento.valor_bem ? formatCurrencyInput(String(Math.round(financiamento.valor_bem * 100))) : '',
            entrada: financiamento.entrada ? formatCurrencyInput(String(Math.round(financiamento.entrada * 100))) : '',
            valorFinanciado: formatCurrencyInput(String(Math.round(financiamento.valor_financiado * 100))),
            quantidadeParcelas: String(financiamento.quantidade_parcelas),
            dataPrimeiraParcela: financiamento.data_primeira_parcela,
            dataContrato: financiamento.data_contrato || '',
            sistemaAmortizacao: financiamento.sistema_amortizacao.toLowerCase(),
            indiceCorrecao: financiamento.indice_correcao.toLowerCase(),
            taxaMensalContrato: String(financiamento.taxa_mensal_contrato),
            taxaAnualContrato: financiamento.taxa_anual_contrato ? String(financiamento.taxa_anual_contrato) : '',
            taxaMensalMercado: String(financiamento.taxa_mensal_mercado),
            mip: financiamento.mip_primeira_parcela ? formatCurrencyInput(String(Math.round(financiamento.mip_primeira_parcela * 100))) : '',
            dfi: financiamento.dfi_primeira_parcela ? formatCurrencyInput(String(Math.round(financiamento.dfi_primeira_parcela * 100))) : '',
            tca: financiamento.tca_primeira_parcela ? formatCurrencyInput(String(Math.round(financiamento.tca_primeira_parcela * 100))) : '',
            multa: financiamento.multa_primeira_parcela ? formatCurrencyInput(String(Math.round(financiamento.multa_primeira_parcela * 100))) : '',
            mora: financiamento.mora_primeira_parcela ? formatCurrencyInput(String(Math.round(financiamento.mora_primeira_parcela * 100))) : '',
            horizonteMeses: financiamento.horizonte_meses ? String(financiamento.horizonte_meses) : '12',
          });

          toast.success('Dados do caso carregados para edição');
          console.log('🔓 Loading state set to false');
        } catch (error) {
          console.error('❌ Error loading case:', error);
          toast.error('Erro ao carregar caso');
          onNavigate('calculations');
        } finally {
          setLoading(false);
          console.log('🔓 Loading state set to false (finally block)');
        }
      } else {
        console.log('ℹ️ No calcId provided, creating new case');
      }
    };

    loadCase();
  }, [calcId, onNavigate]);

  // Campos que devem ser formatados como moeda brasileira
  const currencyFields = ['valorBem', 'entrada', 'valorFinanciado', 'mip', 'dfi', 'tca', 'multa', 'mora'];

  const handleInputChange = (field: string, value: string) => {
    // Aplica formatação de moeda para campos monetários
    if (currencyFields.includes(field)) {
      const formatted = formatCurrencyInput(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Validação de campos obrigatórios
  const validarFormulario = (): boolean => {
    if (!formData.credor || !formData.devedor) {
      toast.error('Preencha os nomes do credor e devedor');
      return false;
    }

    if (!formData.valorFinanciado || !formData.quantidadeParcelas) {
      toast.error('Preencha o valor financiado e número de parcelas');
      return false;
    }

    if (!formData.dataPrimeiraParcela) {
      toast.error('Preencha a data do primeiro vencimento');
      return false;
    }

    if (!formData.taxaMensalContrato) {
      toast.error('Preencha a taxa mensal do contrato');
      return false;
    }

    // Validar Sistema de Amortização
    if (formData.sistemaAmortizacao !== 'sac') {
      toast.error('Apenas o sistema SAC está implementado no momento');
      return false;
    }

    // Validar Indexador
    if (formData.indiceCorrecao !== 'tr') {
      toast.error('Apenas o indexador TR está implementado no momento');
      return false;
    }

    // Validar coerência: Valor Bem = Financiado + Entrada
    if (formData.valorBem && formData.entrada && formData.valorFinanciado) {
      const valorBem = parseNumber(formData.valorBem);
      const entrada = parseNumber(formData.entrada);
      const valorFinanciado = parseNumber(formData.valorFinanciado);

      const soma = entrada + valorFinanciado;
      const diferenca = Math.abs(valorBem - soma);

      if (diferenca > 1) { // Tolerância de R$ 1
        toast.warning(
          `Atenção: Valor do Bem (R$ ${valorBem.toFixed(2)}) ≠ Entrada + Financiado (R$ ${soma.toFixed(2)})`
        );
      }
    }

    // Validar Data Contrato < Data Primeira Parcela
    if (formData.dataContrato && formData.dataPrimeiraParcela) {
      if (formData.dataContrato >= formData.dataPrimeiraParcela) {
        toast.error('Data do Contrato deve ser anterior à Data do 1º Vencimento');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    console.log('🔵 handleSave clicked');
    if (!validarFormulario()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, saving...');
    setLoading(true);
    try {
      // Prepare data for database (convert currency strings to numbers)
      const dataToSave = {
        credor: formData.credor,
        devedor: formData.devedor,
        contrato_num: formData.contratoNum || null,
        tipo_contrato: formData.tipoContrato.toUpperCase() as 'CCB' | 'Financiamento' | 'SAC' | 'PRICE',
        data_calculo: formData.dataCalculo || new Date().toISOString().split('T')[0],
        valor_bem: formData.valorBem ? parseNumber(formData.valorBem) : null,
        entrada: formData.entrada ? parseNumber(formData.entrada) : null,
        valor_financiado: parseNumber(formData.valorFinanciado),
        quantidade_parcelas: parseInt(formData.quantidadeParcelas),
        data_primeira_parcela: formData.dataPrimeiraParcela,
        data_contrato: formData.dataContrato || null,
        sistema_amortizacao: formData.sistemaAmortizacao.toUpperCase() as 'SAC' | 'PRICE' | 'GAUSS' | 'MQJS' | 'SAC-JUROS-SIMPLES',
        indice_correcao: formData.indiceCorrecao.toUpperCase() as 'TR' | 'IPCA' | 'INPC' | 'IGP-M' | 'INCC',
        taxa_mensal_contrato: parseNumber(formData.taxaMensalContrato),
        taxa_anual_contrato: formData.taxaAnualContrato ? parseNumber(formData.taxaAnualContrato) : null,
        taxa_mensal_mercado: parseNumber(formData.taxaMensalMercado),
        mip_primeira_parcela: formData.mip ? parseNumber(formData.mip) : null,
        dfi_primeira_parcela: formData.dfi ? parseNumber(formData.dfi) : null,
        tca_primeira_parcela: formData.tca ? parseNumber(formData.tca) : null,
        multa_primeira_parcela: formData.multa ? parseNumber(formData.multa) : null,
        mora_primeira_parcela: formData.mora ? parseNumber(formData.mora) : null,
        horizonte_meses: parseInt(formData.horizonteMeses),
        status: 'Rascunho' as const,
      };

      let savedId: string;

      if (calcId) {
        // Update existing case
        const updated = await financiamentosService.update(calcId, dataToSave);
        savedId = updated.id;
        toast.success('Caso atualizado com sucesso!');
      } else {
        // Create new case
        const created = await financiamentosService.create(dataToSave);
        savedId = created.id;
        toast.success('Caso salvo com sucesso!');
        // Navigate to edit mode with the new ID
        onNavigate('calc-financiamento', savedId);
      }
    } catch (error) {
      toast.error('Erro ao salvar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysis = async () => {
    console.log('🔵 handleAnalysis clicked');
    if (!validarFormulario()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, starting analysis...');
    setLoading(true);
    try {
      // Importar as funções do motor de cálculo
      const {
        gerarCenarioAP01,
        gerarCenarioAP05,
        gerarCenarioAP03,
        formatarMoeda,
        formatarPercent,
        buscarTRComCache,
      } = await import('@/services/calculationEngine');

      const { FaixaTaxa, EncargosMensais } = await import('@/types/calculation.types');

      // Preparar parâmetros
      console.log('🔍 DEBUG - Valores do FormData (ANTES do parseNumber):');
      console.log('valorFinanciado (raw):', formData.valorFinanciado);
      console.log('taxaMensalContrato (raw):', formData.taxaMensalContrato);
      console.log('taxaMensalMercado (raw):', formData.taxaMensalMercado);

      const pv = parseNumber(formData.valorFinanciado);
      const n = parseInt(formData.quantidadeParcelas);
      const primeiroVenc = formData.dataPrimeiraParcela;
      const taxaContratoMensal = parseNumber(formData.taxaMensalContrato);
      const taxaMercadoMensal = parseNumber(formData.taxaMensalMercado);
      const horizonteMeses = parseInt(formData.horizonteMeses);

      // DEBUG
      console.log('🔍 DEBUG - Parâmetros da Análise Prévia (DEPOIS do parseNumber):');
      console.log('PV:', pv);
      console.log('n:', n);
      console.log('Primeiro Venc:', primeiroVenc);
      console.log('Taxa Contrato:', taxaContratoMensal);
      console.log('Taxa Mercado:', taxaMercadoMensal);
      console.log('Horizonte:', horizonteMeses);

      // Calcular data final com base no horizonte
      const dataInicio = new Date(primeiroVenc);
      const dataFim = new Date(dataInicio);
      dataFim.setMonth(dataFim.getMonth() + horizonteMeses);
      const dataFimFormatada = dataFim.toISOString().split('T')[0];

      // Buscar TR da API do Banco Central
      toast.info('Buscando série TR do Banco Central...');
      const trSeries = await buscarTRComCache(primeiroVenc, dataFimFormatada);

      if (trSeries.length === 0) {
        toast.warning('TR não disponível. Cálculo sem correção monetária (TR = 1.0)');
      } else {
        toast.success(`${trSeries.length} registros de TR carregados`);
      }

      // Criar faixa de taxa única
      const faixasTaxa = [
        {
          ini: primeiroVenc,
          fim: '2099-12-31',
          i: taxaContratoMensal,
        },
      ];

      // Criar encargos da primeira parcela
      console.log('🔍 DEBUG - Encargos ANTES do parseNumber:');
      console.log('MIP (raw):', formData.mip);
      console.log('DFI (raw):', formData.dfi);
      console.log('TCA (raw):', formData.tca);

      const encargosMensais = [
        {
          data: primeiroVenc,
          MIP: parseNumber(formData.mip),
          DFI: parseNumber(formData.dfi),
          TCA: parseNumber(formData.tca),
          multa: parseNumber(formData.multa),
          mora: parseNumber(formData.mora),
        },
      ];

      console.log('🔍 DEBUG - Encargos DEPOIS do parseNumber:');
      console.log('MIP:', encargosMensais[0].MIP);
      console.log('DFI:', encargosMensais[0].DFI);
      console.log('TCA:', encargosMensais[0].TCA);

      // Gerar cenário AP01 (Cobrado)
      const ap01 = gerarCenarioAP01({
        pv,
        n,
        primeiroVenc,
        faixasTaxa,
        trSeries,
        encargosMensais,
        horizonteMeses,
      });

      // Gerar cenário AP05 (Devido)
      const ap05 = gerarCenarioAP05(
        {
          pv,
          n,
          primeiroVenc,
          faixasTaxa: [{ ini: primeiroVenc, fim: '2099-12-31', i: taxaMercadoMensal }],
          trSeries,
          horizonteMeses,
        },
        taxaMercadoMensal
      );

      // Gerar comparativo
      const ap03 = gerarCenarioAP03(ap01, ap05, taxaContratoMensal, taxaMercadoMensal);

      // DEBUG - Resultados
      console.log('📊 DEBUG - Resultados dos Cenários:');
      console.log('AP01 Total Pago:', ap01.totais.totalPago);
      console.log('AP01 Total Juros:', ap01.totais.totalJuros);
      console.log('AP01 Total Taxas:', ap01.totais.totalTaxas);
      console.log('AP01 Linhas na tabela:', ap01.tabela.length);
      console.log('AP05 Total Devido:', ap05.totais.totalDevido);
      console.log('AP05 Total Juros:', ap05.totais.totalJuros);
      console.log('AP05 Linhas na tabela:', ap05.tabela.length);
      console.log('AP03 Diferença:', ap03.totais.totalRestituir);

      // Save calculation results to database
      const savedId = await saveCalculationResults(ap01, ap05, ap03, taxaContratoMensal, taxaMercadoMensal);

      // Montar response
      const data: AnalisePreviaResponse = {
        taxaContratoAM: taxaContratoMensal,
        taxaMercadoAM: taxaMercadoMensal,
        sobretaxaPP: ap03.totais.sobretaxaPP,
        valorTotalPago: ap01.totais.totalPago,
        valorDevido: ap05.totais.totalDevido,
        diferencaRestituicao: ap03.totais.totalRestituir,
        horizonteMeses,
        totalParcelas: n,
        formatted: {
          taxaContratoAM: formatarPercent(taxaContratoMensal),
          taxaMercadoAM: formatarPercent(taxaMercadoMensal),
          sobretaxaPP: formatarPercent(ap03.totais.sobretaxaPP),
          valorTotalPago: formatarMoeda(ap01.totais.totalPago),
          valorDevido: formatarMoeda(ap05.totais.totalDevido),
          diferencaRestituicao: formatarMoeda(ap03.totais.totalRestituir),
        },
      };

      toast.success('Análise prévia concluída e salva!');
      // Navegar para a página de análise passando o ID salvo e os dados
      setTimeout(() => onNavigate('calc-analise', savedId, data), 300);
    } catch (error) {
      toast.error('Erro ao gerar análise prévia');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    console.log('🔵 handleGenerateReport clicked');
    if (!validarFormulario()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, generating report...');
    setLoading(true);
    try {
      // Importar as funções do motor de cálculo
      const {
        gerarCenarioAP01,
        gerarCenarioAP05,
        gerarCenarioAP03,
        formatarMoeda,
        formatarPercent,
        buscarTRComCache,
      } = await import('@/services/calculationEngine');

      // Preparar parâmetros
      const pv = parseNumber(formData.valorFinanciado);
      const n = parseInt(formData.quantidadeParcelas);
      const primeiroVenc = formData.dataPrimeiraParcela;
      const taxaContratoMensal = parseNumber(formData.taxaMensalContrato);
      const taxaMercadoMensal = parseNumber(formData.taxaMensalMercado);
      const horizonteMeses = parseInt(formData.horizonteMeses);

      // Calcular data final com base no horizonte
      const dataInicio = new Date(primeiroVenc);
      const dataFim = new Date(dataInicio);
      dataFim.setMonth(dataFim.getMonth() + horizonteMeses);
      const dataFimFormatada = dataFim.toISOString().split('T')[0];

      // Buscar TR da API do Banco Central
      toast.info('Buscando série TR do Banco Central...');
      const trSeries = await buscarTRComCache(primeiroVenc, dataFimFormatada);

      if (trSeries.length === 0) {
        toast.warning('TR não disponível. Cálculo sem correção monetária (TR = 1.0)');
      } else {
        toast.success(`${trSeries.length} registros de TR carregados`);
      }

      // Preparar faixas de taxa (usando faixa única do contrato)
      const faixasTaxa = [
        {
          ini: primeiroVenc,
          fim: '2099-12-31',
          i: taxaContratoMensal,
        },
      ];

      // Preparar encargos mensais
      const encargosMensais = [
        {
          data: formData.dataPrimeiraParcela,
          MIP: parseNumber(formData.mip),
          DFI: parseNumber(formData.dfi),
          TCA: parseNumber(formData.tca),
          multa: parseNumber(formData.multa),
          mora: parseNumber(formData.mora),
        },
      ];

      // Gerar cenário AP01 (Cobrado)
      const ap01 = gerarCenarioAP01({
        pv,
        n,
        primeiroVenc,
        faixasTaxa,
        trSeries,
        encargosMensais,
        horizonteMeses,
      });

      // Gerar cenário AP05 (Devido)
      const ap05 = gerarCenarioAP05(
        {
          pv,
          n,
          primeiroVenc,
          faixasTaxa: [{ ini: primeiroVenc, fim: '2099-12-31', i: taxaMercadoMensal }],
          trSeries,
          horizonteMeses,
        },
        taxaMercadoMensal
      );

      // Gerar comparativo
      const ap03 = gerarCenarioAP03(ap01, ap05, taxaContratoMensal, taxaMercadoMensal);

      // Save calculation results to database
      const savedId = await saveCalculationResults(ap01, ap05, ap03, taxaContratoMensal, taxaMercadoMensal);

      // Update status to "Concluído" for complete report
      await financiamentosService.updateStatus(savedId, 'Concluído');

      // Montar response
      const data: RelatorioCompletoResponse = {
        credor: formData.credor,
        devedor: formData.devedor,
        contratoNum: formData.contratoNum || 'SEM-NUMERO',
        metodologia: 'SAC com TR — AP01 (Cobrado) vs AP05 (Devido)',
        cards: {
          valorPrincipal: pv,
          totalJuros: ap01.totais.totalJuros,
          totalTaxas: ap01.totais.totalTaxas,
          valorTotalDevido: ap01.totais.totalPago,
          totalRestituir: ap03.totais.totalRestituir,
        },
        comparativo: {
          taxaContratoAM: taxaContratoMensal,
          taxaMercadoAM: taxaMercadoMensal,
          sobretaxaPP: ap03.totais.sobretaxaPP,
        },
        tabelaAmortizacao: ap01.tabela,
        formatted: {
          cards: {
            valorPrincipal: formatarMoeda(pv),
            totalJuros: formatarMoeda(ap01.totais.totalJuros),
            totalTaxas: formatarMoeda(ap01.totais.totalTaxas),
            valorTotalDevido: formatarMoeda(ap01.totais.totalPago),
            totalRestituir: formatarMoeda(ap03.totais.totalRestituir),
          },
          comparativo: {
            taxaContratoAM: formatarPercent(taxaContratoMensal),
            taxaMercadoAM: formatarPercent(taxaMercadoMensal),
            sobretaxaPP: formatarPercent(ap03.totais.sobretaxaPP),
          },
        },
      };

      toast.success('Relatório completo gerado e salvo!');
      // Navegar para a página de relatório passando o ID salvo e os dados
      setTimeout(() => onNavigate('calc-relatorio', savedId, data), 300);
    } catch (error) {
      toast.error('Erro ao gerar relatório completo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <Button
        variant="ghost"
        onClick={() => onNavigate('calculations')}
        className="gap-2 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Lista de Casos
      </Button>

      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">
          Revisão de Financiamento Imobiliário
        </h1>
        {/* Debug indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-500">
            Debug: Loading = {loading ? '🔴 TRUE (botões desabilitados)' : '🟢 FALSE (botões habilitados)'}
            {calcId && ` | ID do Caso: ${calcId.substring(0, 8)}...`}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Processo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credor">Credor</Label>
                <Input
                  id="credor"
                  placeholder="Nome da Instituição Financeira"
                  value={formData.credor}
                  onChange={(e) => handleInputChange('credor', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="devedor">Devedor</Label>
                <Input
                  id="devedor"
                  placeholder="Nome Completo do Devedor"
                  value={formData.devedor}
                  onChange={(e) => handleInputChange('devedor', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contratoNum">Número do Contrato</Label>
                <Input
                  id="contratoNum"
                  placeholder="Número do contrato"
                  value={formData.contratoNum}
                  onChange={(e) => handleInputChange('contratoNum', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                <Select value={formData.tipoContrato} onValueChange={(value) => handleInputChange('tipoContrato', value)}>
                  <SelectTrigger id="tipoContrato">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ccb">CCB</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                    <SelectItem value="sac">SAC</SelectItem>
                    <SelectItem value="price">PRICE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataCalculo">Data do Cálculo</Label>
                <Input id="dataCalculo" type="date" placeholder="Escolha a data" value={formData.dataCalculo} onChange={(e) => handleInputChange('dataCalculo', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Imóvel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorBem">Valor do Bem</Label>
                <Input
                  id="valorBem"
                  type="text"
                  placeholder="Ex: R$ 432.000,00"
                  value={formData.valorBem}
                  onChange={(e) => handleInputChange('valorBem', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorFinanciado">Valor Financiado (PV)</Label>
                <Input
                  id="valorFinanciado"
                  type="text"
                  placeholder="Ex: R$ 302.400,00"
                  value={formData.valorFinanciado}
                  onChange={(e) => handleInputChange('valorFinanciado', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entrada">Entrada</Label>
                <Input
                  id="entrada"
                  type="text"
                  placeholder="Ex: R$ 129.600,00"
                  value={formData.entrada}
                  onChange={(e) => handleInputChange('entrada', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sistemaAmort">Sistema de Amortização</Label>
                <Select value={formData.sistemaAmortizacao} onValueChange={(value) => handleInputChange('sistemaAmortizacao', value)}>
                  <SelectTrigger id="sistemaAmort">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sac">SAC</SelectItem>
                    <SelectItem value="price">PRICE</SelectItem>
                    <SelectItem value="gauss">GAUSS</SelectItem>
                    <SelectItem value="mqjs">MQJS</SelectItem>
                    <SelectItem value="sac-juros-simples">SAC a Juros Simples</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="indexador">Indexador de Correção Monetária</Label>
                <Select value={formData.indiceCorrecao} onValueChange={(value) => handleInputChange('indiceCorrecao', value)}>
                  <SelectTrigger id="indexador">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">TR</SelectItem>
                    <SelectItem value="ipca">IPCA</SelectItem>
                    <SelectItem value="inpc">INPC</SelectItem>
                    <SelectItem value="igpm">IGP-M</SelectItem>
                    <SelectItem value="incc">INCC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parcelas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numParcelas">Número de Parcelas (n)</Label>
                <Input
                  id="numParcelas"
                  type="number"
                  placeholder="Ex: 360"
                  value={formData.quantidadeParcelas}
                  onChange={(e) => handleInputChange('quantidadeParcelas', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primeiroVenc">Data do 1º Vencimento</Label>
                <Input
                  id="primeiroVenc"
                  type="date"
                  value={formData.dataPrimeiraParcela}
                  onChange={(e) => handleInputChange('dataPrimeiraParcela', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataContrato">Data do Contrato</Label>
                <Input
                  id="dataContrato"
                  type="date"
                  value={formData.dataContrato}
                  onChange={(e) => handleInputChange('dataContrato', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxas e Juros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxaMensalContrato">Taxa Mensal do Contrato (i)</Label>
                <Input
                  id="taxaMensalContrato"
                  type="number"
                  step="0.000000000001"
                  placeholder="Ex: 0.005654145387"
                  value={formData.taxaMensalContrato}
                  onChange={(e) => handleInputChange('taxaMensalContrato', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxaAnualContrato">Taxa Anual do Contrato</Label>
                <Input
                  id="taxaAnualContrato"
                  type="number"
                  step="0.0001"
                  placeholder="Ex: 0.07 (7%)"
                  value={formData.taxaAnualContrato}
                  onChange={(e) => handleInputChange('taxaAnualContrato', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxaMensalMercado">Taxa Mensal de Mercado</Label>
                <Input
                  id="taxaMensalMercado"
                  type="number"
                  step="0.0001"
                  placeholder="Ex: 0.0062"
                  value={formData.taxaMensalMercado}
                  onChange={(e) => handleInputChange('taxaMensalMercado', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mip">MIP (1ª parcela)</Label>
                <Input
                  id="mip"
                  type="text"
                  placeholder="Ex: R$ 62,54"
                  value={formData.mip}
                  onChange={(e) => handleInputChange('mip', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dfi">DFI (1ª parcela)</Label>
                <Input
                  id="dfi"
                  type="text"
                  placeholder="Ex: R$ 77,66"
                  value={formData.dfi}
                  onChange={(e) => handleInputChange('dfi', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tca">TCA (1ª parcela)</Label>
                <Input
                  id="tca"
                  type="text"
                  placeholder="Ex: R$ 25,00"
                  value={formData.tca}
                  onChange={(e) => handleInputChange('tca', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multa">Multa (1ª parcela)</Label>
                <Input
                  id="multa"
                  type="text"
                  placeholder="Ex: R$ 0,00"
                  value={formData.multa}
                  onChange={(e) => handleInputChange('multa', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mora">Mora (1ª parcela)</Label>
                <Input
                  id="mora"
                  type="text"
                  placeholder="Ex: R$ 0,00"
                  value={formData.mora}
                  onChange={(e) => handleInputChange('mora', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horizonteMeses">Horizonte de Análise (meses)</Label>
                <Input
                  id="horizonteMeses"
                  type="number"
                  min="1"
                  max="360"
                  placeholder="Ex: 12"
                  value={formData.horizonteMeses}
                  onChange={(e) => handleInputChange('horizonteMeses', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Quantidade de parcelas para análise prévia. Use 360 para análise completa do contrato.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('horizonteMeses', '12')}
                    className={formData.horizonteMeses === '12' ? 'bg-primary/10' : ''}
                  >
                    12 meses
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('horizonteMeses', '24')}
                    className={formData.horizonteMeses === '24' ? 'bg-primary/10' : ''}
                  >
                    24 meses
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('horizonteMeses', '36')}
                    className={formData.horizonteMeses === '36' ? 'bg-primary/10' : ''}
                  >
                    36 meses
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('horizonteMeses', '360')}
                    className={formData.horizonteMeses === '360' ? 'bg-primary/10' : ''}
                  >
                    Completo (360)
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              console.log('🖱️ Botão Análise Prévia clicado | disabled:', loading);
              handleAnalysis();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              'Iniciar Análise Prévia'
            )}
          </Button>
          <Button
            onClick={() => {
              console.log('🖱️ Botão Gerar Relatório clicado | disabled:', loading);
              handleGenerateReport();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Relatório...
              </>
            ) : (
              'Gerar Relatório Completo'
            )}
          </Button>
          <Button
            onClick={() => {
              console.log('🖱️ Botão Salvar clicado | disabled:', loading);
              handleSave();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Dados'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}