'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseNumber } from '@/utils/parseNumber';
import { formatCurrencyInput } from '@/utils/formatCurrency';
import { financiamentosService } from '@/services/financiamentos.service';
import { obterTaxaMercado, obterDetalheTaxaMercado } from '@/services/taxasMercadoBacen';
import { supabase } from '@/lib/supabase';

interface FinanciamentoImobiliarioProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
}

export function FinanciamentoImobiliario({ calcId, onNavigate }: FinanciamentoImobiliarioProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Dados do Processo
    credor: 'SANTANDER',
    devedor: 'EDVANIA CRISTINA DA SILVA',
    tipoContrato: 'financiamento',
    dataContrato: '2012-07-06',

    // Dados do Imóvel
    valorBem: 'R$ 350.000,00',
    valorFinanciado: 'R$ 300.000,00',
    entrada: 'R$ 50.000,00',
    sistemaAmortizacao: 'sac',

    // Parcelas
    valorParcela: 'R$ 2.326,53',
    numeroParcelas: '360',
    dataPrimeiroVencimento: '2012-08-06',

    // Taxas e Juros
    taxaJurosMensal: '0.007207323316136716',
    taxaJurosAnual: '0.09',
    multaMoratoria: '2',
    jurosMora: '1',
    taxasSeguro: 'R$ 107,58',
    outrosEncargos: '',
    tarifaAvaliacaoBem: 'R$ 800,00',
  });

  // Campos que devem ser formatados como moeda brasileira
  const currencyFields = ['valorBem', 'entrada', 'valorFinanciado', 'valorParcela', 'taxasSeguro', 'outrosEncargos', 'tarifaAvaliacaoBem'];

  const handleInputChange = (field: string, value: string) => {
    // Aplica formatação de moeda para campos monetários
    if (currencyFields.includes(field)) {
      const formatted = formatCurrencyInput(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement save logic
      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    console.log('========== INICIANDO ANÁLISE PRÉVIA ==========');
    console.log('📝 Dados do formulário (raw):', formData);

    // Validation
    if (!formData.credor || !formData.devedor) {
      console.error('❌ Validação falhou: Credor ou Devedor não preenchido');
      toast.error('Preencha os campos obrigatórios: Credor e Devedor');
      return;
    }

    if (!formData.valorFinanciado || !formData.numeroParcelas) {
      console.error('❌ Validação falhou: Valor Financiado ou Número de Parcelas não preenchido');
      toast.error('Preencha: Valor Financiado e Número de Parcelas');
      return;
    }

    if (!formData.taxaJurosMensal || !formData.taxaJurosAnual) {
      console.error('❌ Validação falhou: Taxas de juros não preenchidas');
      toast.error('Preencha as taxas de juros');
      return;
    }

    if (!formData.dataPrimeiroVencimento) {
      console.error('❌ Validação falhou: Data do primeiro vencimento não preenchida');
      toast.error('Preencha a data do primeiro vencimento');
      return;
    }

    console.log('✅ Validação inicial passou');

    setLoading(true);
    try {
      console.log('\n========== PASSO 1: PARSEANDO VALORES MONETÁRIOS ==========');

      // Parse form data
      const valorFinanciado = parseNumber(formData.valorFinanciado);
      console.log('💰 Valor Financiado:', formData.valorFinanciado, '→', valorFinanciado);

      const valorBem = formData.valorBem ? parseNumber(formData.valorBem) : valorFinanciado;
      console.log('💰 Valor do Bem:', formData.valorBem, '→', valorBem);

      const entrada = formData.entrada ? parseNumber(formData.entrada) : 0;
      console.log('💰 Entrada:', formData.entrada, '→', entrada);

      const valorParcela = formData.valorParcela ? parseNumber(formData.valorParcela) : 0;
      console.log('💰 Valor da Parcela:', formData.valorParcela, '→', valorParcela);

      const numeroParcelas = parseInt(formData.numeroParcelas);
      console.log('🔢 Número de Parcelas:', formData.numeroParcelas, '→', numeroParcelas);

      console.log('\n========== PASSO 2: PARSEANDO PERCENTUAIS ==========');

      // Helper function to parse percentage fields correctly
      const parsePercentage = (value: string, defaultValue: number): number => {
        if (!value) return defaultValue;

        const numericValue = parseFloat(value.replace('%', '').replace(',', '.'));

        // If contains %, divide by 100
        if (value.includes('%')) {
          return numericValue / 100;
        }

        // If number is >= 1, assume it's a percentage (e.g., "1" means 1%, "2" means 2%)
        if (numericValue >= 1) {
          return numericValue / 100;
        }

        // Otherwise, use as-is (e.g., "0.02" means 2%)
        return numericValue;
      };

      // Parse percentage fields (support both "2%" and "0.02" formats)
      const taxaJurosMensal = parseFloat(formData.taxaJurosMensal.replace('%', '')) / (formData.taxaJurosMensal.includes('%') ? 100 : 1);
      console.log('📊 Taxa de Juros Mensal (Contrato):', formData.taxaJurosMensal, '→', taxaJurosMensal, `(${(taxaJurosMensal * 100).toFixed(4)}%)`);

      const taxaJurosAnual = parseFloat(formData.taxaJurosAnual.replace('%', '')) / (formData.taxaJurosAnual.includes('%') ? 100 : 1);
      console.log('📊 Taxa de Juros Anual (Contrato):', formData.taxaJurosAnual, '→', taxaJurosAnual, `(${(taxaJurosAnual * 100).toFixed(2)}%)`);

      const multaMoratoria = parsePercentage(formData.multaMoratoria, 0.02);
      console.log('📊 Multa Moratória:', formData.multaMoratoria, '→', multaMoratoria, `(${(multaMoratoria * 100).toFixed(2)}%)`);

      // Juros de Mora: "1" significa 1% ao mês, então precisa dividir por 100
      const jurosMora = formData.jurosMora ? parsePercentage(formData.jurosMora, 0.00033) : 0.00033;
      console.log('📊 Juros de Mora:', formData.jurosMora, '→', jurosMora, `(${(jurosMora * 100).toFixed(5)}%)`);

      console.log('\n========== PASSO 3: PARSEANDO TAXAS E ENCARGOS ==========');

      // Parse monetary fields
      const taxasSeguro = formData.taxasSeguro ? parseNumber(formData.taxasSeguro) : 0;
      console.log('💰 Taxas de Seguro:', formData.taxasSeguro, '→', taxasSeguro);

      const outrosEncargos = formData.outrosEncargos ? parseNumber(formData.outrosEncargos) : 0;
      console.log('💰 Outros Encargos:', formData.outrosEncargos, '→', outrosEncargos);

      const tarifaAvaliacaoBem = formData.tarifaAvaliacaoBem ? parseNumber(formData.tarifaAvaliacaoBem) : 0;
      console.log('💰 Tarifa de Avaliação:', formData.tarifaAvaliacaoBem, '→', tarifaAvaliacaoBem);

      console.log('\n========== PASSO 4: BUSCANDO TAXA MÉDIA DO BACEN ==========');

      // Buscar taxa média do BACEN para financiamento imobiliário
      const dataContrato = formData.dataContrato || new Date().toISOString().split('T')[0];
      console.log('📅 Data do Contrato:', dataContrato);

      let taxaMediaMensal = 0.0059;  // Fallback: 0.59% mensal
      let taxaMediaAnual = 0.0735;   // Fallback: 7.35% anual

      try {
        console.log('🔍 Buscando taxa média na API do BACEN para a data:', dataContrato);

        // Série 432: Taxa de juros - Operações de crédito com recursos livres - Pessoas físicas - Aquisição de imóveis
        const serie = 432;

        // Formatar data para API do BACEN (dd/MM/yyyy)
        const [ano, mes, dia] = dataContrato.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;

        // Buscar taxa do BACEN com timeout de 5 segundos
        const urlBacen = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${dataFormatada}&dataFinal=${dataFormatada}`;
        console.log('🌐 URL BACEN:', urlBacen);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

        const response = await fetch(urlBacen, {
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Erro na API do BACEN: ${response.status}`);
        }

        const dados = await response.json();
        console.log('📊 Resposta da API BACEN:', dados);

        if (dados && dados.length > 0) {
          // Taxa vem em % ao mês, converter para decimal
          const taxaMensalPercent = parseFloat(dados[0].valor);
          taxaMediaMensal = taxaMensalPercent / 100;

          // Calcular taxa anual: (1 + i)^12 - 1
          taxaMediaAnual = Math.pow(1 + taxaMediaMensal, 12) - 1;

          console.log('✅ Taxa encontrada na API BACEN:');
          console.log('  - Taxa Mensal:', taxaMediaMensal, `(${(taxaMediaMensal * 100).toFixed(4)}% a.m.)`);
          console.log('  - Taxa Anual:', taxaMediaAnual, `(${(taxaMediaAnual * 100).toFixed(2)}% a.a.)`);
        } else {
          console.warn('⚠️ Nenhum dado encontrado para a data especificada');
          console.log('ℹ️ Usando taxa padrão:', taxaMediaMensal, `(${(taxaMediaMensal * 100).toFixed(4)}% a.m.)`);
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.error('❌ Timeout ao buscar taxa do BACEN (>5s)');
          } else {
            console.error('❌ Erro ao buscar taxa do BACEN:', error.message);
          }
        }
        console.log('ℹ️ Usando taxa padrão (fallback):', taxaMediaMensal, `(${(taxaMediaMensal * 100).toFixed(4)}% a.m.)`);
        console.log('💡 Dica: A API do BACEN pode estar bloqueada por CORS ou fora do ar. A taxa fallback de 0.59% a.m. é adequada para contratos de 2012.');
      }

      console.log('📊 Taxa Média Final:');
      console.log('  - Taxa Mensal:', taxaMediaMensal, `(${(taxaMediaMensal * 100).toFixed(4)}% a.m.)`);
      console.log('  - Taxa Anual:', taxaMediaAnual, `(${(taxaMediaAnual * 100).toFixed(2)}% a.a.)`);

      console.log('\n========== PASSO 5: PREPARANDO PARÂMETROS RPC ==========');

      // Prepare RPC parameters
      const dataCalculoAtual = new Date().toISOString().split('T')[0]; // Data atual para p_data_calculo

      const params = {
        p_valor_financiado: valorFinanciado,
        p_taxa_juros_mensal_contrato: taxaJurosMensal,
        p_taxa_juros_anual_contrato: taxaJurosAnual,
        p_taxa_media_mensal: taxaMediaMensal,
        p_taxa_media_anual: taxaMediaAnual,
        p_qtd_parcelas_contrato: numeroParcelas,
        p_qtd_parcelas_analise: numeroParcelas,
        p_seguros_mensais: taxasSeguro,
        p_sistema_amortizacao: (formData.sistemaAmortizacao || 'sac').toUpperCase(), // Converter para maiúsculas
        p_indexador_cm: 'TR',
        p_data_contratual: dataContrato,
        p_primeiro_vencimento: formData.dataPrimeiroVencimento,

        p_credor: formData.credor,
        p_devedor: formData.devedor,
        p_tipo_contrato: 'Financiamento Imobiliário SFH', // Tipo fixo conforme especificação
        p_data_calculo: dataCalculoAtual, // Data atual do cálculo

        p_valor_bem: valorBem,
        p_valor_entrada: entrada,
        p_valor_parcela_contrato: valorParcela,

        p_multa_moratoria_percent: multaMoratoria,
        p_juros_mora_percent: jurosMora,
        p_outros_encargos: outrosEncargos,
        p_tarifa_avaliacao_bem: tarifaAvaliacaoBem,
      };

      console.log('📦 Parâmetros para RPC:', JSON.stringify(params, null, 2));

      console.log('\n========== PASSO 6: CHAMANDO RPC SUPABASE ==========');

      // Call RPC function
      const result = await financiamentosService.criarFinanciamentoEAnalise(params);

      console.log('✅ Resposta do RPC:', result);
      console.log('  - ID do Financiamento:', result.financiamento_calculo_id);
      console.log('  - Excesso Média:', result.excesso_media, `(${(result.excesso_media * 100).toFixed(2)}%)`);
      console.log('  - Diferença Total Média:', result.diferenca_total_media);
      console.log('  - Diferença Total Simples:', result.diferenca_total_simples);

      console.log('\n========== PASSO 6.5: BUSCANDO DADOS DA ANÁLISE PRÉVIA ==========');

      // Buscar dados da tabela financiamentos_calculo_analise
      let analiseData = null;

      try {
        const { data, error } = await supabase
          .from('financiamentos_calculo_analise')
          .select('taxa_juros_mensal_contrato, taxa_media_mensal, excesso_media, diferenca_total_simples, diferenca_total_media')
          .eq('financiamento_calculo_id', result.financiamento_calculo_id)
          .maybeSingle(); // maybeSingle() não gera erro quando não há resultados

        if (error) {
          console.error('❌ Erro ao buscar análise prévia:', error);
          console.log('⚠️ Usando dados do RPC como fallback');
        }

        if (data) {
          // Mapear campos da tabela financiamentos_calculo_analise para o formato esperado
          analiseData = {
            taxa_contrato: data.taxa_juros_mensal_contrato,
            taxa_media: data.taxa_media_mensal,
            sobretaxa: data.excesso_media,
            diferenca_total_simples: data.diferenca_total_simples,
            diferenca_total: data.diferenca_total_media,
          };
          console.log('✅ Análise prévia encontrada na tabela financiamentos_calculo_analise:', analiseData);
        } else {
          // Fallback: usar dados do RPC quando tabela está vazia
          console.warn('⚠️ Nenhum registro encontrado em financiamentos_calculo_analise');
          console.log('💡 Usando dados do RPC como fallback');

          analiseData = {
            taxa_contrato: taxaJurosMensal,
            taxa_media: taxaMediaMensal,
            sobretaxa: result.excesso_media,
            diferenca_total_simples: result.diferenca_total_simples,
            diferenca_total: result.diferenca_total_media,
          };

          console.log('✅ Dados do fallback (RPC):', analiseData);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar análise:', error);

        // Usar RPC data como fallback em caso de erro
        console.log('💡 Usando dados do RPC como fallback devido a erro');

        analiseData = {
          taxa_contrato: taxaJurosMensal,
          taxa_media: taxaMediaMensal,
          sobretaxa: result.excesso_media,
          diferenca_total_simples: result.diferenca_total_simples,
          diferenca_total: result.diferenca_total_media,
        };

        console.log('✅ Dados do fallback (RPC):', analiseData);
      }

      console.log('\n========== PASSO 7: FORMATANDO DADOS PARA NAVEGAÇÃO ==========');

      // Format response for AnalisePrevia component - Usando dados da tabela analises_previas
      const analysisData = {
        taxaContratoAM: analiseData.taxa_contrato,
        taxaMercadoAM: analiseData.taxa_media,
        sobretaxaPP: analiseData.sobretaxa,
        reducaoEstimadaSimples: analiseData.diferenca_total_simples,
        reducaoEstimadaMedia: analiseData.diferenca_total,
        horizonteMeses: numeroParcelas,
        totalParcelas: numeroParcelas,
        formatted: {
          taxaContratoAM: `${(analiseData.taxa_contrato * 100).toFixed(4)}%`,
          taxaMercadoAM: `${(analiseData.taxa_media * 100).toFixed(4)}%`,
          sobretaxaPP: `${(analiseData.sobretaxa * 100).toFixed(2)}%`,
          reducaoEstimadaSimples: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(analiseData.diferenca_total_simples),
          reducaoEstimadaMedia: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(analiseData.diferenca_total),
        },
      };

      console.log('📊 Dados da análise formatados:', analysisData);
      console.log('\n✅ ANÁLISE PRÉVIA CONCLUÍDA COM SUCESSO!');

      toast.success('Análise prévia gerada com sucesso!');

      // Navigate to analysis page
      console.log('\n========== PASSO 8: NAVEGANDO PARA PÁGINA DE ANÁLISE ==========');
      console.log('🔄 Redirecionando para:', 'calc-analise');
      console.log('🆔 Com ID:', result.financiamento_calculo_id);

      setTimeout(() => {
        onNavigate('calc-analise', result.financiamento_calculo_id, analysisData);
      }, 300);

    } catch (error) {
      console.error('\n❌❌❌ ERRO AO GERAR ANÁLISE PRÉVIA ❌❌❌');
      console.error('Detalhes do erro:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      toast.error('Erro ao gerar análise prévia');
    } finally {
      setLoading(false);
      console.log('\n========== FIM DO PROCESSO ==========\n');
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // TODO: Implement report generation logic
      toast.success('Relatório completo gerado!');
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Revisão de Financiamento Imobiliário
        </h1>
      </div>

      <div className="space-y-6">
        {/* Dados do Processo */}
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
                <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                <Select value={formData.tipoContrato} onValueChange={(value) => handleInputChange('tipoContrato', value)}>
                  <SelectTrigger id="tipoContrato">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataContrato">Data do Contrato</Label>
                <Input
                  id="dataContrato"
                  type="date"
                  placeholder="dd/mm/aaaa"
                  value={formData.dataContrato}
                  onChange={(e) => handleInputChange('dataContrato', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Imóvel */}
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
                  placeholder="Valor total do imóvel"
                  value={formData.valorBem}
                  onChange={(e) => handleInputChange('valorBem', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorFinanciado">Valor Financiado</Label>
                <Input
                  id="valorFinanciado"
                  type="text"
                  placeholder="Valor total do financiamento"
                  value={formData.valorFinanciado}
                  onChange={(e) => handleInputChange('valorFinanciado', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entrada">Entrada</Label>
                <Input
                  id="entrada"
                  type="text"
                  placeholder="Valor da entrada"
                  value={formData.entrada}
                  onChange={(e) => handleInputChange('entrada', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sistemaAmortizacao">Sistema de Amortização</Label>
                <Select value={formData.sistemaAmortizacao} onValueChange={(value) => handleInputChange('sistemaAmortizacao', value)}>
                  <SelectTrigger id="sistemaAmortizacao">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sac">SAC</SelectItem>
                    <SelectItem value="price">PRICE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parcelas */}
        <Card>
          <CardHeader>
            <CardTitle>Parcelas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorParcela">Valor da Parcela</Label>
                <Input
                  id="valorParcela"
                  type="text"
                  placeholder="Valor da parcela mensal"
                  value={formData.valorParcela}
                  onChange={(e) => handleInputChange('valorParcela', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroParcelas">Número de Parcelas</Label>
                <Input
                  id="numeroParcelas"
                  type="text"
                  placeholder="Informe a quantidade de parcelas"
                  value={formData.numeroParcelas}
                  onChange={(e) => handleInputChange('numeroParcelas', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPrimeiroVencimento">Data do 1º Vencimento</Label>
                <Input
                  id="dataPrimeiroVencimento"
                  type="date"
                  placeholder="dd/mm/aaaa"
                  value={formData.dataPrimeiroVencimento}
                  onChange={(e) => handleInputChange('dataPrimeiroVencimento', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxas e Juros */}
        <Card>
          <CardHeader>
            <CardTitle>Taxas e Juros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxaJurosMensal">Taxa de Juros Mensal</Label>
                <Input
                  id="taxaJurosMensal"
                  type="text"
                  placeholder="Ex: 1,2% ou 0,012"
                  value={formData.taxaJurosMensal}
                  onChange={(e) => handleInputChange('taxaJurosMensal', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxaJurosAnual">Taxa de Juros Anual</Label>
                <Input
                  id="taxaJurosAnual"
                  type="text"
                  placeholder="Ex: 15% ou 0,15"
                  value={formData.taxaJurosAnual}
                  onChange={(e) => handleInputChange('taxaJurosAnual', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multaMoratoria">Multa Moratória %</Label>
                <Input
                  id="multaMoratoria"
                  type="text"
                  placeholder="Ex: 2%"
                  value={formData.multaMoratoria}
                  onChange={(e) => handleInputChange('multaMoratoria', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurosMora">Juros de Mora %</Label>
                <Input
                  id="jurosMora"
                  type="text"
                  placeholder="Ex: 1%"
                  value={formData.jurosMora}
                  onChange={(e) => handleInputChange('jurosMora', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxasSeguro">Taxas de Seguro</Label>
                <Input
                  id="taxasSeguro"
                  type="text"
                  placeholder="Valor do seguro"
                  value={formData.taxasSeguro}
                  onChange={(e) => handleInputChange('taxasSeguro', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outrosEncargos">Outros Encargos</Label>
                <Input
                  id="outrosEncargos"
                  type="text"
                  placeholder="Valor de outras taxas"
                  value={formData.outrosEncargos}
                  onChange={(e) => handleInputChange('outrosEncargos', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifaAvaliacaoBem">Tarifa de Avaliação do Bem</Label>
                <Input
                  id="tarifaAvaliacaoBem"
                  type="text"
                  placeholder="Digite o valor cobrado pela avaliação"
                  value={formData.tarifaAvaliacaoBem}
                  onChange={(e) => handleInputChange('tarifaAvaliacaoBem', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Iniciar Análise Prévia'
            )}
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Relatório Completo'
            )}
          </Button>
          <Button
            onClick={handleSave}
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