'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  AnalisePreviaRequest,
  AnalisePreviaResponse,
  RelatorioCompletoRequest,
  RelatorioCompletoResponse,
  FaixaTaxa,
  EncargosMensais,
} from '@/types/calculation.types';

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

    // Parâmetros do financiamento
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

  // Carregar dados quando estiver editando
  useEffect(() => {
    if (calcId) {
      // TODO: Carregar dados reais do Supabase
      // Por enquanto, carregar dados de exemplo para teste
      setFormData({
        credor: 'Ana Silva',
        devedor: 'Carlos Pereira',
        contratoNum: '98765',
        valorFinanciado: '302400',
        quantidadeParcelas: '360',
        dataPrimeiraParcela: '2018-06-21',
        dataContrato: '2018-06-01',
        sistemaAmortizacao: 'sac',
        indiceCorrecao: 'tr',
        taxaMensalContrato: '0.005654145387',
        taxaAnualContrato: '',
        taxaMensalMercado: '0.0062',
        mip: '62.54',
        dfi: '77.66',
        tca: '25',
        multa: '0',
        mora: '0',
        horizonteMeses: '12',
      });
      toast.info('Dados do caso carregados para edição');
    }
  }, [calcId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    return true;
  };

  // Converte string para número
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(',', '.')) || 0;
  };

  const handleSave = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // TODO: Salvar no Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysis = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // Importar as funções do motor de cálculo
      const {
        gerarCenarioAP01,
        gerarCenarioAP05,
        gerarCenarioAP03,
        formatarMoeda,
        formatarPercent,
      } = await import('@/services/calculationEngine');

      const { FaixaTaxa, EncargosMensais } = await import('@/types/calculation.types');

      // Preparar parâmetros
      const pv = parseNumber(formData.valorFinanciado);
      const n = parseInt(formData.quantidadeParcelas);
      const primeiroVenc = formData.dataPrimeiraParcela;
      const taxaContratoMensal = parseNumber(formData.taxaMensalContrato);
      const taxaMercadoMensal = parseNumber(formData.taxaMensalMercado);
      const horizonteMeses = parseInt(formData.horizonteMeses);

      // Criar faixa de taxa única
      const faixasTaxa = [
        {
          ini: primeiroVenc,
          fim: '2099-12-31',
          i: taxaContratoMensal,
        },
      ];

      // Criar encargos da primeira parcela
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

      const trSeries = [{ data: '2022-01-21', fator: 1.001195 }];

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

      // Montar response
      const data: AnalisePreviaResponse = {
        taxaContratoAM: taxaContratoMensal,
        taxaMercadoAM: taxaMercadoMensal,
        sobretaxaPP: ap03.totais.sobretaxaPP,
        valorTotalPago: ap01.totais.totalPago,
        valorDevido: ap05.totais.totalDevido,
        diferencaRestituicao: ap03.totais.totalRestituir,
        formatted: {
          taxaContratoAM: formatarPercent(taxaContratoMensal),
          taxaMercadoAM: formatarPercent(taxaMercadoMensal),
          sobretaxaPP: formatarPercent(ap03.totais.sobretaxaPP),
          valorTotalPago: formatarMoeda(ap01.totais.totalPago),
          valorDevido: formatarMoeda(ap05.totais.totalDevido),
          diferencaRestituicao: formatarMoeda(ap03.totais.totalRestituir),
        },
      };

      toast.success('Análise prévia concluída!');
      // Navegar para a página de análise passando os dados
      setTimeout(() => onNavigate('calc-analise', '1', data), 300);
    } catch (error) {
      toast.error('Erro ao gerar análise prévia');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // Importar as funções do motor de cálculo
      const {
        gerarCenarioAP01,
        gerarCenarioAP05,
        gerarCenarioAP03,
        formatarMoeda,
        formatarPercent,
      } = await import('@/services/calculationEngine');

      // Preparar parâmetros
      const pv = parseNumber(formData.valorFinanciado);
      const n = parseInt(formData.quantidadeParcelas);
      const primeiroVenc = formData.dataPrimeiraParcela;
      const taxaMercadoMensal = parseNumber(formData.taxaMensalMercado);
      const horizonteMeses = parseInt(formData.horizonteMeses);

      // Preparar faixas de taxa (usando as 3 faixas especificadas)
      const faixasTaxa = [
        { ini: '2018-06-21', fim: '2020-02-21', i: 0.005654145387 },
        { ini: '2020-03-21', fim: '2023-07-21', i: 0.005025 },
        { ini: '2023-08-21', fim: '2048-05-21', i: 0.00834755 },
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

      const trSeries = [{ data: '2022-01-21', fator: 1.001195 }];

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
      const taxaContratoReferencia = faixasTaxa[0].i;
      const ap03 = gerarCenarioAP03(ap01, ap05, taxaContratoReferencia, taxaMercadoMensal);

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
          taxaContratoAM: taxaContratoReferencia,
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
            taxaContratoAM: formatarPercent(taxaContratoReferencia),
            taxaMercadoAM: formatarPercent(taxaMercadoMensal),
            sobretaxaPP: formatarPercent(ap03.totais.sobretaxaPP),
          },
        },
      };

      toast.success('Relatório completo gerado!');
      // Navegar para a página de relatório passando os dados
      setTimeout(() => onNavigate('calc-relatorio', '1', data), 300);
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
                <Select>
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
                <Input id="valorBem" type="text" placeholder="Valor total do imóvel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorFinanciado">Valor Financiado (PV)</Label>
                <Input
                  id="valorFinanciado"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 302400"
                  value={formData.valorFinanciado}
                  onChange={(e) => handleInputChange('valorFinanciado', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entrada">Entrada</Label>
                <Input id="entrada" type="text" placeholder="Valor da entrada" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sistemaAmort">Sistema de Amortização</Label>
                <Select>
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
                <Select>
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
                  type="number"
                  step="0.01"
                  placeholder="Ex: 62.54"
                  value={formData.mip}
                  onChange={(e) => handleInputChange('mip', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dfi">DFI (1ª parcela)</Label>
                <Input
                  id="dfi"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 77.66"
                  value={formData.dfi}
                  onChange={(e) => handleInputChange('dfi', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tca">TCA (1ª parcela)</Label>
                <Input
                  id="tca"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 25"
                  value={formData.tca}
                  onChange={(e) => handleInputChange('tca', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multa">Multa (1ª parcela)</Label>
                <Input
                  id="multa"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 0"
                  value={formData.multa}
                  onChange={(e) => handleInputChange('multa', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mora">Mora (1ª parcela)</Label>
                <Input
                  id="mora"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 0"
                  value={formData.mora}
                  onChange={(e) => handleInputChange('mora', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horizonteMeses">Horizonte (meses)</Label>
                <Input
                  id="horizonteMeses"
                  type="number"
                  placeholder="Ex: 12"
                  value={formData.horizonteMeses}
                  onChange={(e) => handleInputChange('horizonteMeses', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={handleAnalysis}>
            Iniciar Análise Prévia
          </Button>
          <Button onClick={handleGenerateReport}>
            Gerar Relatório Completo
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Salvar Dados
          </Button>
        </div>
      </div>
    </div>
  );
}