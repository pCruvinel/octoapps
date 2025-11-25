'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { cartoesService } from '@/services/cartoes.service';
import { analisarCartaoPrevia } from '@/services/calculationEngine.cartao';
import type { CartaoCredito as CartaoCreditoType } from '@/types/calculation.types';

interface CartaoCreditoProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
}

export function CartaoCredito({ calcId, onNavigate }: CartaoCreditoProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cartaoId, setCartaoId] = useState<string | null>(calcId);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    // Dados do Processo (com valores padrão de teste)
    credor: 'Banco Itaú S.A.',
    devedor: 'Maria da Silva Santos',
    numeroCartao: '**** **** **** 5678',
    numeroProcesso: '1234567-89.2024.8.26.0100',
    dataCalculo: '2025-01-15',

    // Dados da Fatura (com valores padrão de teste)
    saldoDevedor: '5.000,00',
    limiteTotal: '10.000,00',
    limiteDisponivel: '5.000,00',
    saldoAnterior: '4.800,00',
    saldoFinanciado: '5.000,00',
    dataInicioAnalise: '2023-01-01',
    dataUltimaFatura: '2024-12-01',
    dataPagamento: '2025-01-10',
    diaVencimento: '10',
    totalFatura: '5.850,00',
    pagamentoMinimo: '750,00',
    consumosDespesas: '1.200,00',

    // Encargos (com valores padrão de teste)
    anuidade: '-480,00',
    seguro: '25,00',
    iof: '35,00',
    tarifas: '15,00',

    // Taxas e Juros (com valores padrão de teste)
    jurosRotativo: '10,5',
    jurosRemuneratoriosAtraso: '',
    taxaJurosParcelamento: '6,99',
    jurosMora: '1',
    multaInadimplencia: '2',
    diesMora: '0',

    observacoes: '',
    parcelamentos: '',
    saquesEspecieAvance: '',
    valorIOF: '',
    estornoAjuste: '',
    renegociacao: '',
    tarifa: '',
  });

  // Carregar dados quando estiver editando
  useEffect(() => {
    if (calcId) {
      loadCartaoData(calcId);
    }
  }, [calcId]);

  /**
   * Carrega dados do cartão do banco
   */
  const loadCartaoData = async (id: string) => {
    try {
      setLoading(true);
      const cartao = await cartoesService.getById(id);

      if (!cartao) {
        toast.error('Cartão não encontrado');
        onNavigate('calculations');
        return;
      }

      // Preencher formulário com dados do banco (convertendo snake_case para camelCase no form)
      setFormData({
        credor: cartao.credor || '',
        devedor: cartao.devedor || '',
        numeroCartao: cartao.numero_cartao || '',
        numeroProcesso: cartao.numero_processo || '',
        dataCalculo: cartao.data_calculo?.split('T')[0] || new Date().toISOString().split('T')[0],
        saldoDevedor: cartao.saldo_devedor?.toString() || '',
        limiteTotal: cartao.limite_total?.toString() || '',
        limiteDisponivel: cartao.limite_disponivel?.toString() || '',
        saldoAnterior: cartao.saldo_anterior?.toString() || '',
        saldoFinanciado: cartao.saldo_financiado?.toString() || '',
        dataInicioAnalise: cartao.data_inicio_analise?.split('T')[0] || '',
        dataUltimaFatura: cartao.data_ultima_fatura?.split('T')[0] || '',
        dataPagamento: cartao.data_pagamento?.split('T')[0] || '',
        diaVencimento: cartao.dia_vencimento?.toString() || '',
        totalFatura: cartao.total_fatura?.toString() || '',
        pagamentoMinimo: cartao.pagamento_minimo?.toString() || '',
        consumosDespesas: cartao.consumos_despesas?.toString() || '',
        anuidade: cartao.anuidade?.toString() || '',
        seguro: cartao.seguro?.toString() || '',
        iof: cartao.iof?.toString() || '',
        tarifas: cartao.tarifas?.toString() || '',
        jurosRotativo: (cartao.juros_rotativo * 100)?.toFixed(4) || '',
        jurosRemuneratoriosAtraso: cartao.juros_remuneratorios_atraso ? (cartao.juros_remuneratorios_atraso * 100).toFixed(4) : '',
        taxaJurosParcelamento: cartao.taxa_juros_parcelamento ? (cartao.taxa_juros_parcelamento * 100).toFixed(4) : '',
        jurosMora: cartao.juros_mora ? (cartao.juros_mora * 100).toFixed(4) : '',
        multaInadimplencia: cartao.multa_inadimplencia ? (cartao.multa_inadimplencia * 100).toFixed(4) : '',
        diesMora: cartao.dies_mora?.toString() || '0',
        observacoes: cartao.observacoes || '',
        parcelamentos: '',
        saquesEspecieAvance: '',
        valorIOF: '',
        estornoAjuste: '',
        renegociacao: '',
        tarifa: '',
      });

      toast.success('Dados carregados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formata valor monetário para padrão brasileiro (R$ 1.234,56)
   * Suporta valores negativos
   */
  const formatCurrency = (value: string): string => {
    // Verifica se é negativo
    const isNegative = value.includes('-');

    // Remove tudo exceto dígitos
    const numbers = value.replace(/\D/g, '');

    if (!numbers) return '';

    // Converte para número e divide por 100 (centavos)
    let amount = parseInt(numbers) / 100;

    // Aplica sinal negativo se necessário
    if (isNegative) {
      amount = -amount;
    }

    // Formata com separadores brasileiros
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * Campos que devem ser formatados como moeda
   */
  const currencyFields = [
    'saldoDevedor',
    'limiteTotal',
    'limiteDisponivel',
    'saldoAnterior',
    'saldoFinanciado',
    'totalFatura',
    'pagamentoMinimo',
    'consumosDespesas',
    'anuidade',
    'seguro',
    'valorIOF',
  ];

  const handleInputChange = (field: string, value: string) => {
    // Formatar campos monetários
    if (currencyFields.includes(field)) {
      const formatted = formatCurrency(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  /**
   * Valida os dados do formulário
   */
  const validateForm = (): boolean => {
    if (!formData.credor?.trim()) {
      toast.error('Credor é obrigatório');
      return false;
    }

    if (!formData.devedor?.trim()) {
      toast.error('Devedor é obrigatório');
      return false;
    }

    const saldo = parseFloat(formData.saldoDevedor.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (!saldo || saldo <= 0) {
      toast.error('Saldo devedor deve ser maior que zero');
      return false;
    }

    const juros = parseFloat(formData.jurosRotativo.replace(',', '.'));
    if (!juros || juros <= 0) {
      toast.error('Taxa de juros rotativo é obrigatória');
      return false;
    }

    return true;
  };

  /**
   * Converte valores do formulário para formato do banco
   */
  const prepareDataForSave = () => {
    const parseNumber = (value: string): number => {
      if (!value) return 0;
      // Remove tudo exceto dígitos, vírgula e ponto
      // Remove pontos (separador de milhar), converte vírgula para ponto (decimal)
      const cleaned = value.replace(/\./g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };

    const parsePercent = (value: string): number => {
      if (!value) return 0;
      const num = parseFloat(value.replace(',', '.')) || 0;
      return num / 100; // Converter % para decimal
    };

    return {
      credor: formData.credor,
      devedor: formData.devedor,
      numero_cartao: formData.numeroCartao || undefined,
      numero_processo: formData.numeroProcesso || undefined,
      saldo_devedor: parseNumber(formData.saldoDevedor),
      limite_total: parseNumber(formData.limiteTotal) || undefined,
      limite_disponivel: parseNumber(formData.limiteDisponivel) || undefined,
      saldo_anterior: parseNumber(formData.saldoAnterior) || undefined,
      saldo_financiado: parseNumber(formData.saldoFinanciado) || undefined,
      data_inicio_analise: formData.dataInicioAnalise || undefined,
      data_ultima_fatura: formData.dataUltimaFatura || undefined,
      data_pagamento: formData.dataPagamento || undefined,
      dia_vencimento: formData.diaVencimento ? parseInt(formData.diaVencimento) : undefined,
      total_fatura: parseNumber(formData.totalFatura) || undefined,
      pagamento_minimo: parseNumber(formData.pagamentoMinimo) || undefined,
      consumos_despesas: parseNumber(formData.consumosDespesas) || undefined,
      anuidade: parseNumber(formData.anuidade) || 0,
      seguro: parseNumber(formData.seguro) || 0,
      iof: parseNumber(formData.iof) || 0,
      tarifas: parseNumber(formData.tarifas) || 0,
      juros_rotativo: parsePercent(formData.jurosRotativo),
      juros_remuneratorios_atraso: parsePercent(formData.jurosRemuneratoriosAtraso) || undefined,
      taxa_juros_parcelamento: parsePercent(formData.taxaJurosParcelamento) || undefined,
      juros_mora: parsePercent(formData.jurosMora) || undefined,
      multa_inadimplencia: parsePercent(formData.multaInadimplencia) || undefined,
      dies_mora: parseInt(formData.diesMora) || 0,
      observacoes: formData.observacoes || undefined,
      // Campos JSON (arrays) - converter strings para arrays JSON
      parcelamentos: formData.parcelamentos ? [formData.parcelamentos] : [],
      saques_especie: formData.saquesEspecieAvance ? [formData.saquesEspecieAvance] : [],
      estornos_ajustes: formData.estornoAjuste ? [formData.estornoAjuste] : [],
      renegociacoes: formData.renegociacao ? [formData.renegociacao] : [],
      outras_tarifas: formData.tarifa ? [formData.tarifa] : [],
    };
  };

  /**
   * Salva os dados no banco
   */
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const dataToSave = prepareDataForSave();

      if (cartaoId) {
        // Atualizar existente
        await cartoesService.update(cartaoId, dataToSave);
        toast.success('Dados atualizados com sucesso!');
      } else {
        // Criar novo
        const novoCartao = await cartoesService.create(dataToSave);
        setCartaoId(novoCartao.id);
        toast.success('Cartão criado com sucesso!');
      }

      setLastSaved(new Date());
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Inicia análise prévia
   */
  const handleAnalysis = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const dataToSave = prepareDataForSave();
      console.log('💾 Dados preparados para salvar (handleAnalysis):', dataToSave);

      // Salvar dados primeiro (criar ou atualizar)
      let currentCartaoId = cartaoId;

      if (!currentCartaoId) {
        // Se não existe cartaoId, criar novo registro primeiro
        setSaving(true);
        const novoCartao = await cartoesService.create(dataToSave);
        currentCartaoId = novoCartao.id;
        setCartaoId(novoCartao.id);
        setLastSaved(new Date());
        setSaving(false);
        toast.success('Cartão criado com sucesso!');
      } else {
        // Atualizar existente
        await cartoesService.update(currentCartaoId, dataToSave);
        setLastSaved(new Date());
      }

      // Preparar parâmetros para análise (novo formato agregado)
      const parametrosAnalise = {
        // Dados básicos
        credor: dataToSave.credor,
        devedor: dataToSave.devedor,
        data_calculo: new Date(dataToSave.data_calculo),
        data_inicio_analise: new Date(dataToSave.data_inicio_analise || dataToSave.data_calculo),
        data_ultima_fatura: new Date(dataToSave.data_ultima_fatura || dataToSave.data_calculo),

        // Valores
        saldo_devedor: dataToSave.saldo_devedor,
        valor_principal: dataToSave.saldo_financiado || dataToSave.saldo_devedor,

        // Taxas (já em decimal)
        jurosRotativo: dataToSave.juros_rotativo,
        taxaMercadoMensal: 0.05, // 5% a.m. (Taxa média BACEN para rotativo - stub)

        // Encargos adicionais (já em decimal)
        jurosMoraPercentual: dataToSave.juros_mora || 0,
        multaPercentual: dataToSave.multa_inadimplencia || 0,
        iofValor: dataToSave.iof || 0,
        anuidade: dataToSave.anuidade || 0,
        seguros: dataToSave.seguro || 0,
        tarifas: dataToSave.tarifas || 0,

        // Parâmetros
        mesesAnalise: 24, // Análise de 24 meses
        prazo_meses_simulacao: 24, // Tabela SAC de 24 meses
      };

      // Executar análise usando motor de cálculo
      console.log('📊 Parâmetros enviados para o motor:', parametrosAnalise);
      const resultadoAnalise = analisarCartaoPrevia(parametrosAnalise);
      console.log('📊 Resultado da análise:', resultadoAnalise);

      // Helper para limitar valores ao máximo do banco (numeric(10,6) = max 9999.999999)
      const limitValue = (value: number, max: number = 9999.999999): number => {
        if (value > max) return max;
        if (value < -max) return -max;
        return value;
      };

      // Salvar resultados calculados no banco
      await cartoesService.updateCalculatedResults(currentCartaoId, {
        total_juros_cobrado: resultadoAnalise.totalJurosCobrado,
        total_juros_devido: resultadoAnalise.totalJurosDevido,
        diferenca_restituicao: resultadoAnalise.diferencaRestituicao,
        taxa_efetiva_mensal: limitValue(resultadoAnalise.taxaMediaCobrada),
        taxa_efetiva_anual: limitValue(resultadoAnalise.cetAnual),
        cet_mensal: limitValue(resultadoAnalise.cetMensal),
        cet_anual: limitValue(resultadoAnalise.cetAnual),
        anatocismo_detectado: resultadoAnalise.anatocismoDetectado,
        encargos_abusivos: resultadoAnalise.encargosAbusivos,
      });

      // Atualizar status
      await cartoesService.updateStatus(currentCartaoId, 'Em Análise');

      // Formatar dados para AnaliseCartaoResponse (compatível com UI unificada)
      const analysisData = {
        // Campos principais (mesmos nomes que o motor retorna)
        saldoTotal: resultadoAnalise.saldoTotal,
        taxaMediaCobrada: resultadoAnalise.taxaMediaCobrada,
        taxaMercado: resultadoAnalise.taxaMercado,
        sobretaxaPP: resultadoAnalise.sobretaxaPP,

        totalJurosCobrado: resultadoAnalise.totalJurosCobrado,
        totalJurosDevido: resultadoAnalise.totalJurosDevido,
        diferencaRestituicao: resultadoAnalise.diferencaRestituicao,

        totalEncargos: resultadoAnalise.totalEncargos,
        totalEncargosCobrados: resultadoAnalise.totalEncargosCobrados,
        totalEncargosDevidos: resultadoAnalise.totalEncargosDevidos,

        encargosAbusivos: resultadoAnalise.encargosAbusivos,
        cetMensal: resultadoAnalise.cetMensal,
        cetAnual: resultadoAnalise.cetAnual,
        anatocismoDetectado: resultadoAnalise.anatocismoDetectado,
        percentualAbuso: resultadoAnalise.percentualAbuso,
        mesesAnalise: resultadoAnalise.mesesAnalise,

        // Formatted já vem do motor
        formatted: resultadoAnalise.formatted,
      };

      toast.success('Análise prévia concluída com sucesso!');
      onNavigate('calc-analise', currentCartaoId, analysisData);
    } catch (error: any) {
      console.error('Erro ao iniciar análise:', error);
      toast.error('Erro ao iniciar análise: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gera relatório completo
   */
  const handleGenerateReport = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const dataToSave = prepareDataForSave();

      // Salvar dados primeiro (criar ou atualizar)
      let currentCartaoId = cartaoId;

      if (!currentCartaoId) {
        // Se não existe cartaoId, criar novo registro primeiro
        setSaving(true);
        const novoCartao = await cartoesService.create(dataToSave);
        currentCartaoId = novoCartao.id;
        setCartaoId(novoCartao.id);
        setLastSaved(new Date());
        setSaving(false);
        toast.success('Cartão criado com sucesso!');
      } else {
        // Atualizar existente
        await cartoesService.update(currentCartaoId, dataToSave);
        setLastSaved(new Date());
      }

      // Preparar parâmetros para análise completa
      const parametrosAnalise = {
        saldoDevedor: dataToSave.saldo_devedor,
        jurosRotativo: dataToSave.juros_rotativo,
        taxaMercadoMensal: 0.05, // 5% a.m.

        // NOVOS: Encargos adicionais (Mora, Multa, IOF)
        // IMPORTANTE: usar dataToSave que já converteu os percentuais corretamente
        jurosMoraPercentual: dataToSave.juros_mora || 0,
        multaPercentual: dataToSave.multa_inadimplencia || 0,
        iofValor: dataToSave.iof || 0,

        parcelamentos: [], // TODO: adicionar parcelamentos se houver
        anuidade: dataToSave.anuidade,
        seguros: dataToSave.seguro,
        tarifas: dataToSave.tarifas,
        mesesAnalise: 24, // Análise de 24 meses para relatório completo
      };

      // Executar análise completa
      console.log('📊 Gerando relatório completo de cartão...');
      const resultadoAnalise = analisarCartaoPrevia(parametrosAnalise);

      // Helper para limitar valores ao máximo do banco
      const limitValue = (value: number, max: number = 9999.999999): number => {
        if (value > max) return max;
        if (value < -max) return -max;
        return value;
      };

      // Salvar resultados no banco
      await cartoesService.updateCalculatedResults(currentCartaoId, {
        total_juros_cobrado: resultadoAnalise.totalJurosCobrado,
        total_juros_devido: resultadoAnalise.totalJurosDevido,
        diferenca_restituicao: resultadoAnalise.diferencaRestituicao,
        taxa_efetiva_mensal: limitValue(resultadoAnalise.taxaMediaCobrada),
        taxa_efetiva_anual: limitValue(resultadoAnalise.cetAnual),
        valor_total_pago: resultadoAnalise.totalJurosCobrado + dataToSave.saldo_devedor,
        valor_total_devido: resultadoAnalise.totalJurosDevido + dataToSave.saldo_devedor,
        percentual_sobretaxa: limitValue(resultadoAnalise.percentualAbuso),
        cet_mensal: limitValue(resultadoAnalise.cetMensal),
        cet_anual: limitValue(resultadoAnalise.cetAnual),
        anatocismo_detectado: resultadoAnalise.anatocismoDetectado,
        encargos_abusivos: resultadoAnalise.encargosAbusivos,
      });

      // Atualizar status para "Concluído"
      await cartoesService.updateStatus(currentCartaoId, 'Concluído');

      // Preparar dados do relatório
      const relatorioData = {
        credor: dataToSave.credor,
        devedor: dataToSave.devedor,
        contratoNum: dataToSave.numero_processo || 'N/A',
        metodologia: 'Análise de Cartão de Crédito - Juros Rotativos e Encargos',
        cards: {
          valorPrincipal: dataToSave.saldo_devedor,
          totalJuros: resultadoAnalise.totalJurosCobrado,
          totalTaxas: resultadoAnalise.totalEncargos,
          valorTotalDevido: resultadoAnalise.totalJurosDevido + dataToSave.saldo_devedor,
          totalRestituir: resultadoAnalise.diferencaRestituicao,
        },
        comparativo: {
          taxaContratoAM: resultadoAnalise.taxaMediaCobrada,
          taxaMercadoAM: resultadoAnalise.taxaMercado,
          sobretaxaPP: resultadoAnalise.sobretaxaPP,
        },
        tabelaAmortizacao: [], // Tabela vazia por enquanto - pode adicionar evolução do saldo se necessário
        formatted: {
          cards: {
            valorPrincipal: `R$ ${dataToSave.saldo_devedor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            totalJuros: `R$ ${resultadoAnalise.totalJurosCobrado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            totalTaxas: `R$ ${resultadoAnalise.totalEncargos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            valorTotalDevido: `R$ ${(resultadoAnalise.totalJurosDevido + dataToSave.saldo_devedor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            totalRestituir: `R$ ${resultadoAnalise.diferencaRestituicao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          comparativo: {
            taxaContratoAM: `${(resultadoAnalise.taxaMediaCobrada * 100).toFixed(2)}%`,
            taxaMercadoAM: `${(resultadoAnalise.taxaMercado * 100).toFixed(2)}%`,
            sobretaxaPP: `${resultadoAnalise.sobretaxaPP.toFixed(2)} p.p.`,
          },
        },
      };

      toast.success('Relatório completo gerado com sucesso!');
      onNavigate('calc-relatorio', currentCartaoId, relatorioData);
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório: ' + error.message);
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
          Revisão de Cartão de Crédito
        </h1>
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
                <Input id="credor" placeholder="Nome da Instituição Financeira" value={formData.credor} onChange={(e) => handleInputChange('credor', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="devedor">Devedor</Label>
                <Input id="devedor" placeholder="Nome Completo do Devedor" value={formData.devedor} onChange={(e) => handleInputChange('devedor', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataCalculo">Data do Cálculo</Label>
                <Input id="dataCalculo" type="date" placeholder="Escolha a data" value={formData.dataCalculo} onChange={(e) => handleInputChange('dataCalculo', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoDevedor">Saldo Devedor</Label>
                <Input id="saldoDevedor" type="text" placeholder="Valor do saldo devedor" value={formData.saldoDevedor} onChange={(e) => handleInputChange('saldoDevedor', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limiteTotal">Limite Total do Cartão</Label>
                <Input id="limiteTotal" type="text" placeholder="Limite total do cartão" value={formData.limiteTotal} onChange={(e) => handleInputChange('limiteTotal', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limiteDisponivel">Limite Disponível</Label>
                <Input id="limiteDisponivel" type="text" placeholder="Limite disponível" value={formData.limiteDisponivel} onChange={(e) => handleInputChange('limiteDisponivel', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Fatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicioAnalise">Data de Início de Análise</Label>
                <Input id="dataInicioAnalise" type="date" placeholder="Escolha a data" value={formData.dataInicioAnalise} onChange={(e) => handleInputChange('dataInicioAnalise', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataUltimaFatura">Data da Última Fatura</Label>
                <Input id="dataUltimaFatura" type="date" placeholder="Escolha a data" value={formData.dataUltimaFatura} onChange={(e) => handleInputChange('dataUltimaFatura', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoAnterior">Saldo Anterior</Label>
                <Input id="saldoAnterior" type="text" placeholder="Valor do saldo anterior" value={formData.saldoAnterior} onChange={(e) => handleInputChange('saldoAnterior', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoFinanciado">Saldo Financiado</Label>
                <Input id="saldoFinanciado" type="text" placeholder="Saldo total financiado" value={formData.saldoFinanciado} onChange={(e) => handleInputChange('saldoFinanciado', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">Data de Pagamento</Label>
                <Input id="dataPagamento" type="date" placeholder="Escolha a data" value={formData.dataPagamento} onChange={(e) => handleInputChange('dataPagamento', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcelamentos">Parcelamentos (fatura parcelada)</Label>
                <Input id="parcelamentos" type="text" placeholder="Informe os últimos do parcelamento da fatura" value={formData.parcelamentos} onChange={(e) => handleInputChange('parcelamentos', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saquesEspecieAvance">Saques em Espécie (Cash Advance)</Label>
                <Input id="saquesEspecieAvance" type="text" placeholder='ex.: "Saque R$ 400,00 - 05/07/2023"' value={formData.saquesEspecieAvance} onChange={(e) => handleInputChange('saquesEspecieAvance', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anuidade">Anuidade</Label>
                <Input id="anuidade" type="text" placeholder="Valor da anuidade cobrada na fatura" value={formData.anuidade} onChange={(e) => handleInputChange('anuidade', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seguro">Seguro</Label>
                <Input id="seguro" type="text" placeholder="Valor do seguro lançado na fatura" value={formData.seguro} onChange={(e) => handleInputChange('seguro', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumosDespesas">Consumos / Despesas</Label>
                <Input id="consumosDespesas" type="text" placeholder="Total de consumos e despesas lançadas" value={formData.consumosDespesas} onChange={(e) => handleInputChange('consumosDespesas', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagamentoMinimo">Pagamento Mínimo</Label>
                <Input id="pagamentoMinimo" type="text" placeholder="Valor mínimo de pagamento exigido por fatura" value={formData.pagamentoMinimo} onChange={(e) => handleInputChange('pagamentoMinimo', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalFatura">Total da Fatura</Label>
                <Input id="totalFatura" type="text" placeholder="Valor total da fatura" value={formData.totalFatura} onChange={(e) => handleInputChange('totalFatura', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorIOF">Valor de IOF</Label>
                <Input id="valorIOF" type="text" placeholder="Valor de IOF aplicado" value={formData.valorIOF} onChange={(e) => handleInputChange('valorIOF', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estornoAjuste">Estorno / Ajuste</Label>
                <Input id="estornoAjuste" type="text" placeholder="Valor de estornos ou ajustes realizados" value={formData.estornoAjuste} onChange={(e) => handleInputChange('estornoAjuste', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renegociacao">Renegociação</Label>
                <Input id="renegociacao" type="text" placeholder="Valor e condições de renegociações" value={formData.renegociacao} onChange={(e) => handleInputChange('renegociacao', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifa">Tarifa</Label>
                <Input id="tarifa" type="text" placeholder="Valor da tarifa aplicada" value={formData.tarifa} onChange={(e) => handleInputChange('tarifa', e.target.value)} />
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
                <Label htmlFor="jurosRemuneratoriosAtraso">Juros Remuneratórios de Atraso %</Label>
                <Input id="jurosRemuneratoriosAtraso" type="text" placeholder="Taxa de juros aplicada sobre atraso no rotativo" value={formData.jurosRemuneratoriosAtraso} onChange={(e) => handleInputChange('jurosRemuneratoriosAtraso', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurosRotativo">Juros do Rotativo %</Label>
                <Input id="jurosRotativo" type="text" placeholder="Taxa de juros do crédito rotativo" value={formData.jurosRotativo} onChange={(e) => handleInputChange('jurosRotativo', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diaVencimento">Dia de Vencimento da Fatura</Label>
                <Input id="diaVencimento" type="text" placeholder="Ex: 10" value={formData.diaVencimento} onChange={(e) => handleInputChange('diaVencimento', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxaJurosParcelamento">Taxa de Juros de Parcelamento</Label>
                <Input id="taxaJurosParcelamento" type="text" placeholder="Ex: 12% ou 012" value={formData.taxaJurosParcelamento} onChange={(e) => handleInputChange('taxaJurosParcelamento', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multaInadimplencia">Multa de Inadimplência</Label>
                <Input id="multaInadimplencia" type="text" placeholder="2%" value={formData.multaInadimplencia} onChange={(e) => handleInputChange('multaInadimplencia', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurosMora">Juros de Mora</Label>
                <Input id="jurosMora" type="text" placeholder="Taxa de juros de mora" value={formData.jurosMora} onChange={(e) => handleInputChange('jurosMora', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diesMora">Dies de Mora</Label>
                <Input id="diesMora" type="text" placeholder="Quantidade de dias em atraso" value={formData.diesMora} onChange={(e) => handleInputChange('diesMora', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="text-sm text-gray-500">
            {saving && (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </span>
            )}
            {lastSaved && !saving && (
              <span>
                Salvo às {lastSaved.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleAnalysis} disabled={loading || saving}>
              Iniciar Análise Prévia
            </Button>
            <Button onClick={handleGenerateReport} disabled={loading || saving}>
              Gerar Relatório Completo
            </Button>
            <Button onClick={handleSave} disabled={loading || saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}