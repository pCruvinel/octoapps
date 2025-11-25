'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { emprestimosService } from '@/services/emprestimos.service';
import { analisarEmprestimoPrevia } from '@/services/calculationEngine.emprestimo';
import type { TipoEmprestimo, SistemaAmortizacao } from '@/types/calculation.types';

interface EmprestimosFinanciamentosProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
}

export function EmprestimosFinanciamentos({ calcId, onNavigate }: EmprestimosFinanciamentosProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emprestimoId, setEmprestimoId] = useState<string | null>(calcId);

  const [formData, setFormData] = useState({
    credor: '',
    devedor: '',
    numeroProcesso: '',
    contratoNum: '',
    tipoEmprestimo: 'Pessoal' as TipoEmprestimo,
    sistemaAmortizacao: 'PRICE' as SistemaAmortizacao,
    totalFinanciado: '',
    quantidadeParcelas: '',
    dataPrimeiraParcela: '',
    dataContrato: '',
    taxaMensalContrato: '',
    taxaMensalMercado: '3.00', // 3% padrão
    tac: '',
    tec: '',
    tarifaCadastro: '',
    seguroPrestamista: '',
    iofPrincipal: '',
    observacoes: '',
  });

  // Carregar dados quando estiver editando
  useEffect(() => {
    if (calcId) {
      loadEmprestimoData(calcId);
    }
  }, [calcId]);

  /**
   * Carrega dados do empréstimo do banco
   */
  const loadEmprestimoData = async (id: string) => {
    try {
      setLoading(true);
      const emprestimo = await emprestimosService.getById(id);

      if (!emprestimo) {
        toast.error('Empréstimo não encontrado');
        onNavigate('calculations');
        return;
      }

      setFormData({
        credor: emprestimo.credor || '',
        devedor: emprestimo.devedor || '',
        numeroProcesso: emprestimo.numeroProcesso || '',
        contratoNum: emprestimo.contratoNum || '',
        tipoEmprestimo: emprestimo.tipoEmprestimo,
        sistemaAmortizacao: emprestimo.sistemaAmortizacao,
        totalFinanciado: emprestimo.totalFinanciado?.toString() || '',
        quantidadeParcelas: emprestimo.quantidadeParcelas?.toString() || '',
        dataPrimeiraParcela: emprestimo.dataPrimeiraParcela?.split('T')[0] || '',
        dataContrato: emprestimo.dataContrato?.split('T')[0] || '',
        taxaMensalContrato: (emprestimo.taxaMensalContrato * 100)?.toFixed(4) || '',
        taxaMensalMercado: emprestimo.taxaMensalMercado ? (emprestimo.taxaMensalMercado * 100).toFixed(2) : '3.00',
        tac: emprestimo.tac?.toString() || '',
        tec: emprestimo.tec?.toString() || '',
        tarifaCadastro: emprestimo.tarifaCadastro?.toString() || '',
        seguroPrestamista: emprestimo.seguroPrestamista?.toString() || '',
        iofPrincipal: emprestimo.iofPrincipal?.toString() || '',
        observacoes: emprestimo.observacoes || '',
      });

      toast.success('Dados carregados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Valida o formulário
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

    const valor = parseFloat(formData.totalFinanciado.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (!valor || valor <= 0) {
      toast.error('Valor financiado deve ser maior que zero');
      return false;
    }

    const parcelas = parseInt(formData.quantidadeParcelas);
    if (!parcelas || parcelas <= 0) {
      toast.error('Número de parcelas inválido');
      return false;
    }

    const taxa = parseFloat(formData.taxaMensalContrato.replace(',', '.'));
    if (taxa === undefined || taxa < 0) {
      toast.error('Taxa mensal é obrigatória');
      return false;
    }

    if (!formData.dataPrimeiraParcela) {
      toast.error('Data da primeira parcela é obrigatória');
      return false;
    }

    return true;
  };

  /**
   * Prepara dados para salvar
   */
  const prepareDataForSave = () => {
    const parseNumber = (value: string): number => {
      if (!value) return 0;
      return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    };

    const parsePercent = (value: string): number => {
      if (!value) return 0;
      const num = parseFloat(value.replace(',', '.')) || 0;
      return num / 100;
    };

    return {
      credor: formData.credor,
      devedor: formData.devedor,
      numeroProcesso: formData.numeroProcesso || undefined,
      contratoNum: formData.contratoNum || undefined,
      tipoEmprestimo: formData.tipoEmprestimo,
      sistemaAmortizacao: formData.sistemaAmortizacao,
      totalFinanciado: parseNumber(formData.totalFinanciado),
      quantidadeParcelas: parseInt(formData.quantidadeParcelas),
      dataPrimeiraParcela: formData.dataPrimeiraParcela,
      dataContrato: formData.dataContrato || undefined,
      taxaMensalContrato: parsePercent(formData.taxaMensalContrato),
      taxaMensalMercado: parsePercent(formData.taxaMensalMercado),
      tac: parseNumber(formData.tac) || undefined,
      tec: parseNumber(formData.tec) || undefined,
      tarifaCadastro: parseNumber(formData.tarifaCadastro) || undefined,
      seguroPrestamista: parseNumber(formData.seguroPrestamista) || undefined,
      iofPrincipal: parseNumber(formData.iofPrincipal) || undefined,
      observacoes: formData.observacoes || undefined,
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

      if (emprestimoId) {
        await emprestimosService.update(emprestimoId, dataToSave);
        toast.success('Dados atualizados com sucesso!');
      } else {
        const novoEmprestimo = await emprestimosService.create(dataToSave);
        setEmprestimoId(novoEmprestimo.id);
        toast.success('Empréstimo criado com sucesso!');
      }
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
    if (!emprestimoId) {
      toast.error('Salve os dados antes de iniciar a análise');
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);
      const dataToSave = prepareDataForSave();

      // Salvar dados primeiro
      await handleSave();

      // Executar análise
      console.log('🔍 Executando análise prévia de empréstimo...');
      const resultadoAnalise = analisarEmprestimoPrevia({
        valorFinanciado: dataToSave.totalFinanciado,
        numeroParcelas: dataToSave.quantidadeParcelas,
        taxaMensalCobrada: dataToSave.taxaMensalContrato,
        taxaMensalMercado: dataToSave.taxaMensalMercado,
        sistemaAmortizacao: dataToSave.sistemaAmortizacao,
        encargosIniciais: (dataToSave.tac || 0) + (dataToSave.tec || 0) + (dataToSave.tarifaCadastro || 0),
        encargosRecorrentes: dataToSave.seguroPrestamista || 0,
        mesesAnalise: 12,
      });

      // Salvar resultados no banco
      await emprestimosService.updateCalculatedResults(emprestimoId, {
        total_juros_cobrado: resultadoAnalise.totalJurosCobrado,
        total_juros_devido: resultadoAnalise.totalJurosDevido,
        diferenca_restituicao: resultadoAnalise.diferencaRestituicao,
        total_encargos: resultadoAnalise.totalEncargos,
        valor_total_pago: resultadoAnalise.totalJurosCobrado + dataToSave.totalFinanciado,
        valor_total_devido: resultadoAnalise.totalJurosDevido + dataToSave.totalFinanciado,
        sobretaxa_pp: resultadoAnalise.sobretaxaPP,
        cet_mensal: resultadoAnalise.cetMensal,
        cet_anual: resultadoAnalise.cetAnual,
        tac_tec_irregular: resultadoAnalise.tacTecIrregular,
        encargos_irregulares: resultadoAnalise.encargosIrregulares,
      });

      // Atualizar status
      await emprestimosService.updateStatus(emprestimoId, 'Em Análise');

      // Preparar dados para AnalisePreviaResponse
      const analysisData = {
        taxaContratoAM: resultadoAnalise.taxaCobradaMensal,
        taxaMercadoAM: resultadoAnalise.taxaMercadoMensal,
        sobretaxaPP: resultadoAnalise.sobretaxaPP,
        valorTotalPago: resultadoAnalise.totalJurosCobrado + dataToSave.totalFinanciado,
        valorDevido: resultadoAnalise.totalJurosDevido + dataToSave.totalFinanciado,
        diferencaRestituicao: resultadoAnalise.diferencaRestituicao,
        formatted: resultadoAnalise.formatted,
      };

      toast.success('Análise prévia concluída com sucesso!');
      onNavigate('calc-analise', emprestimoId, analysisData);
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
    if (!emprestimoId) {
      toast.error('Salve os dados antes de gerar o relatório');
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);
      const dataToSave = prepareDataForSave();

      // Salvar dados
      await handleSave();

      // Executar análise completa
      console.log('📊 Gerando relatório completo de empréstimo...');
      const resultadoAnalise = analisarEmprestimoPrevia({
        valorFinanciado: dataToSave.totalFinanciado,
        numeroParcelas: dataToSave.quantidadeParcelas,
        taxaMensalCobrada: dataToSave.taxaMensalContrato,
        taxaMensalMercado: dataToSave.taxaMensalMercado,
        sistemaAmortizacao: dataToSave.sistemaAmortizacao,
        encargosIniciais: (dataToSave.tac || 0) + (dataToSave.tec || 0),
        encargosRecorrentes: dataToSave.seguroPrestamista || 0,
      });

      // Salvar todos os resultados
      await emprestimosService.updateCalculatedResults(emprestimoId, {
        total_juros_cobrado: resultadoAnalise.totalJurosCobrado,
        total_juros_devido: resultadoAnalise.totalJurosDevido,
        diferenca_restituicao: resultadoAnalise.diferencaRestituicao,
        total_encargos: resultadoAnalise.totalEncargos,
        valor_total_pago: resultadoAnalise.totalJurosCobrado + dataToSave.totalFinanciado,
        valor_total_devido: resultadoAnalise.totalJurosDevido + dataToSave.totalFinanciado,
        sobretaxa_pp: resultadoAnalise.sobretaxaPP,
        cet_mensal: resultadoAnalise.cetMensal,
        cet_anual: resultadoAnalise.cetAnual,
        tac_tec_irregular: resultadoAnalise.tacTecIrregular,
        encargos_irregulares: resultadoAnalise.encargosIrregulares,
      });

      // Atualizar status para Concluído
      await emprestimosService.updateStatus(emprestimoId, 'Concluído');

      // Preparar dados do relatório
      const relatorioData = {
        credor: dataToSave.credor,
        devedor: dataToSave.devedor,
        contratoNum: dataToSave.contratoNum || 'N/A',
        metodologia: `Análise de Empréstimo - Sistema ${dataToSave.sistemaAmortizacao}`,
        cards: {
          valorPrincipal: dataToSave.totalFinanciado,
          totalJuros: resultadoAnalise.totalJurosCobrado,
          totalTaxas: resultadoAnalise.totalEncargos,
          valorTotalDevido: resultadoAnalise.totalJurosDevido + dataToSave.totalFinanciado,
          totalRestituir: resultadoAnalise.diferencaRestituicao,
        },
        comparativo: {
          taxaContratoAM: resultadoAnalise.taxaCobradaMensal,
          taxaMercadoAM: resultadoAnalise.taxaMercadoMensal,
          sobretaxaPP: resultadoAnalise.sobretaxaPP,
        },
        tabelaAmortizacao: [],
        formatted: {
          cards: {
            valorPrincipal: resultadoAnalise.formatted?.valorFinanciado || '',
            totalJuros: resultadoAnalise.formatted?.totalJurosCobrado || '',
            totalTaxas: `R$ ${resultadoAnalise.totalEncargos.toFixed(2)}`,
            valorTotalDevido: resultadoAnalise.formatted?.totalJurosDevido || '',
            totalRestituir: resultadoAnalise.formatted?.diferencaRestituicao || '',
          },
          comparativo: {
            taxaContratoAM: resultadoAnalise.formatted?.taxaCobradaMensal || '',
            taxaMercadoAM: resultadoAnalise.formatted?.taxaMercadoMensal || '',
            sobretaxaPP: resultadoAnalise.formatted?.sobretaxaPP || '',
          },
        },
      };

      toast.success('Relatório completo gerado com sucesso!');
      onNavigate('calc-relatorio', emprestimoId, relatorioData);
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
          Revisão Geral (Empréstimos e Financiamentos)
        </h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Contrato</CardTitle>
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
                <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                <Select>
                  <SelectTrigger id="tipoContrato">
                    <SelectValue placeholder="Selecione" value={formData.tipoContrato} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emprestimo-pessoal">Empréstimo Pessoal</SelectItem>
                    <SelectItem value="emprestimo-consignado">Empréstimo Consignado</SelectItem>
                    <SelectItem value="capital-giro">Capital de Giro</SelectItem>
                    <SelectItem value="financiamento-veiculo">Financiamento de Veículo</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataCalculo">Data do Cálculo</Label>
                <Input id="dataCalculo" type="date" placeholder="Escolha a data" value={formData.dataCalculo} onChange={(e) => handleInputChange('dataCalculo', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalFinanciado">Total Financiado</Label>
                <Input id="totalFinanciado" type="text" placeholder="Valor total do empréstimo" value={formData.totalFinanciado} onChange={(e) => handleInputChange('totalFinanciado', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorParcela">Valor da Parcela</Label>
                <Input id="valorParcela" type="text" placeholder="Valor da parcela mensal" value={formData.valorParcela} onChange={(e) => handleInputChange('valorParcela', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidadeParcelas">Quantidade de Parcelas</Label>
                <Input id="quantidadeParcelas" type="text" placeholder="Informe a quantidade de parcelas" value={formData.quantidadeParcelas} onChange={(e) => handleInputChange('quantidadeParcelas', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPrimeiraParcela">Data da 1ª Parcela</Label>
                <Input id="dataPrimeiraParcela" type="date" placeholder="Escolha a data" value={formData.dataPrimeiraParcela} onChange={(e) => handleInputChange('dataPrimeiraParcela', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataContrato">Data do Contrato</Label>
                <Input id="dataContrato" type="date" placeholder="Escolha a data" value={formData.dataContrato} onChange={(e) => handleInputChange('dataContrato', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="indiceCorrecao">Índice de Correção Monetária (opcional)</Label>
                <Select>
                  <SelectTrigger id="indiceCorrecao">
                    <SelectValue placeholder="Selecione (se houver)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inpc">INPC</SelectItem>
                    <SelectItem value="ipca">IPCA</SelectItem>
                    <SelectItem value="tr">TR</SelectItem>
                    <SelectItem value="igpm">IGP-M</SelectItem>
                    <SelectItem value="selic">SELIC</SelectItem>
                    <SelectItem value="cdi">CDI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encargos Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seguros">Seguros</Label>
                <Input id="seguros" type="text" placeholder="Valor total dos seguros, se aplicável" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outrosEncargos">Outros Encargos</Label>
                <Input id="outrosEncargos" type="text" placeholder="Valor de outras taxas e encargos" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataLiberacao">Data de Liberação</Label>
                <Input id="dataLiberacao" type="date" placeholder="Escolha a data" />
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
                <Label htmlFor="taxaJurosMensal">Taxa de Juros Mensal</Label>
                <Input id="taxaJurosMensal" type="text" placeholder="Ex: 1,5% ou 0,015" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdi">CDI (Taxa Adicional)</Label>
                <Input id="cdi" type="text" placeholder="Ex: 100% do CDI" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxaJurosAnual">Taxa de Juros Anual</Label>
                <Input id="taxaJurosAnual" type="text" placeholder="Ex: 18% ou 0,18" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurosMora">Juros de Mora %</Label>
                <Input id="jurosMora" type="text" placeholder="Ex: 1%" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifaTAC">Tarifa TAC</Label>
                <Input id="tarifaTAC" type="text" placeholder="Valor da Tarifa de Abertura de Crédito (TAC)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifaTEC">Tarifa TEC</Label>
                <Input id="tarifaTEC" type="text" placeholder="Valor da Tarifa de Emissão de Carnê (TEC)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seguroProtecao">Seguro Prestamista</Label>
                <Input id="seguroProtecao" type="text" placeholder="Valor do seguro prestamista contratado" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seguroProtecaoFinanceira">Seguro de Proteção Financeira</Label>
                <Input id="seguroProtecaoFinanceira" type="text" placeholder="Valor do seguro de proteção financeira" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comissaoFlat">Comissão Flat</Label>
                <Input id="comissaoFlat" type="text" placeholder="Valor da comissão flat aplicada" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifas">Tarifas</Label>
                <Input id="tarifas" type="text" placeholder="Outras tarifas cobradas na fatura" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifaAvaliacao">Tarifa de Avaliação do Bem</Label>
                <Input id="tarifaAvaliacao" type="text" placeholder="Valor da avaliação do bem financiado" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registroContrato">Registro de Contrato</Label>
                <Input id="registroContrato" type="text" placeholder="Valor do registro do contrato" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifaCadastro">Tarifa de Cadastro</Label>
                <Input id="tarifaCadastro" type="text" placeholder="Valor da tarifa de cadastro" />
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