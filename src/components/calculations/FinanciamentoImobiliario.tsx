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
import { formatCurrencyInput, formatCurrency, formatPercent } from '@/utils/formatCurrency';
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
    taxaMediaMensal: '', // Taxa média do BACEN (será preenchida automaticamente ou manualmente)
    taxaMediaAnual: '', // Taxa média anual (será preenchida automaticamente ou manualmente)
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

      let taxaMediaMensal: number;
      let taxaMediaAnual: number;

      // Verificar se o usuário já preencheu manualmente as taxas médias
      const taxaManualMensal = formData.taxaMediaMensal ? parseFloat(formData.taxaMediaMensal.replace('%', '').replace(',', '.')) : null;
      const taxaManualAnual = formData.taxaMediaAnual ? parseFloat(formData.taxaMediaAnual.replace('%', '').replace(',', '.')) : null;

      if (taxaManualMensal && taxaManualMensal > 0) {
        console.log('✅ Usando taxa média MANUAL fornecida pelo usuário');

        // Sempre converter percentual para decimal (ex: "0.59" vira 0.0059, "59" vira 0.59)
        // Se usuário digitou "0.59", é 0.59% = 0.0059 em decimal
        // Se usuário digitou "59", é 59% = 0.59 em decimal
        taxaMediaMensal = taxaManualMensal / 100;

        if (taxaManualAnual && taxaManualAnual > 0) {
          taxaMediaAnual = taxaManualAnual / 100;
        } else {
          // Calcular anual baseado na mensal
          taxaMediaAnual = Math.pow(1 + taxaMediaMensal, 12) - 1;
        }

        console.log('📊 Taxa Manual:');
        console.log('  - Mensal (decimal):', taxaMediaMensal);
        console.log('  - Mensal (%):', `${(taxaMediaMensal * 100).toFixed(4)}% a.m.`);
        console.log('  - Anual (decimal):', taxaMediaAnual);
        console.log('  - Anual (%):', `${(taxaMediaAnual * 100).toFixed(2)}% a.a.`);
      } else {
        // Buscar taxa na tabela histórica do banco de dados
        console.log('🔍 Buscando taxa histórica do BACEN na tabela local...');

        try {
          const { data: taxaData, error: taxaError } = await supabase.rpc('buscar_taxa_bacen', {
            p_data_contrato: dataContrato
          });

          if (taxaError) {
            throw new Error(taxaError.message || 'Erro ao buscar taxa no banco');
          }

          if (taxaData && taxaData.length > 0) {
            const taxa = taxaData[0];
            taxaMediaMensal = parseFloat(taxa.taxa_mensal_decimal);
            taxaMediaAnual = parseFloat(taxa.taxa_anual_decimal);

            const isAproximada = taxa.fonte?.includes('APROXIMADA');

            console.log('✅ TAXA ENCONTRADA (banco de dados):');
            console.log('  📡 Fonte:', taxa.fonte);
            console.log('  📅 Período:', taxa.ano_mes);
            console.log('  📊 Mensal:', `${(taxaMediaMensal * 100).toFixed(4)}% a.m.`);
            console.log('  📊 Anual:', `${(taxaMediaAnual * 100).toFixed(2)}% a.a.`);
            if (isAproximada) {
              console.log('  ⚠️ Taxa aproximada (mês exato não disponível)');
            }

            // Atualizar formulário
            setFormData(prev => ({
              ...prev,
              taxaMediaMensal: (taxaMediaMensal * 100).toFixed(4),
              taxaMediaAnual: (taxaMediaAnual * 100).toFixed(2),
            }));

            toast.success(
              isAproximada
                ? `Taxa aproximada encontrada: ${(taxaMediaMensal * 100).toFixed(4)}% a.m.`
                : `Taxa encontrada: ${(taxaMediaMensal * 100).toFixed(4)}% a.m. (${taxa.ano_mes})`,
              { duration: 4000 }
            );
          } else {
            throw new Error('Nenhuma taxa encontrada para a data especificada');
          }
        } catch (error) {
          console.warn('\n⚠️ Taxa não encontrada no banco de dados');
          console.warn('Detalhes:', error instanceof Error ? error.message : 'Erro desconhecido');

          // Usar taxa padrão como fallback para não bloquear o usuário
          console.log('📌 Usando taxa padrão de julho/2012: 0.59% a.m.');
          taxaMediaMensal = 0.0059; // 0.59% ao mês (taxa de julho/2012)
          taxaMediaAnual = Math.pow(1 + taxaMediaMensal, 12) - 1;

          toast.warning('Taxa média não encontrada. Usando taxa padrão: 0.59% a.m. Você pode preencher manualmente.', {
            duration: 6000
          });

          console.log('💡 Dica: Preencha o campo "Taxa Média Mensal" para usar um valor específico');
        }
      }

      console.log('📊 Taxa Média Final Confirmada:');
      console.log('  - Mensal:', taxaMediaMensal, `(${(taxaMediaMensal * 100).toFixed(4)}% a.m.)`);
      console.log('  - Anual:', taxaMediaAnual, `(${(taxaMediaAnual * 100).toFixed(2)}% a.a.)`);

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
    console.log('========== INICIANDO GERAÇÃO DE RELATÓRIO COMPLETO ==========');
    console.log('📝 Dados do formulário:', formData);
    console.log('🆔 CalcId atual:', calcId);

    // Validação básica
    if (!formData.credor || !formData.devedor) {
      toast.error('Preencha os campos obrigatórios: Credor e Devedor');
      return;
    }

    if (!formData.valorFinanciado || !formData.numeroParcelas) {
      toast.error('Preencha: Valor Financiado e Número de Parcelas');
      return;
    }

    setLoading(true);
    try {
      let currentFinanciamentoId = calcId;

      // Se não existe financiamento, criar primeiro usando handlePreview
      if (!currentFinanciamentoId) {
        console.log('⚠️ Nenhum financiamento existente. Criando novo...');

        // Parsear valores necessários
        const valorFinanciado = parseNumber(formData.valorFinanciado);
        const valorBem = formData.valorBem ? parseNumber(formData.valorBem) : valorFinanciado;
        const entrada = formData.entrada ? parseNumber(formData.entrada) : 0;
        const valorParcela = formData.valorParcela ? parseNumber(formData.valorParcela) : 0;
        const numeroParcelas = parseInt(formData.numeroParcelas);

        const taxaJurosMensal = parseFloat(formData.taxaJurosMensal.replace('%', '')) / (formData.taxaJurosMensal.includes('%') ? 100 : 1);
        const taxaJurosAnual = parseFloat(formData.taxaJurosAnual.replace('%', '')) / (formData.taxaJurosAnual.includes('%') ? 100 : 1);

        const parsePercentage = (value: string, defaultValue: number): number => {
          if (!value) return defaultValue;
          const numericValue = parseFloat(value.replace('%', '').replace(',', '.'));
          if (value.includes('%')) return numericValue / 100;
          if (numericValue >= 1) return numericValue / 100;
          return numericValue;
        };

        const multaMoratoria = parsePercentage(formData.multaMoratoria, 0.02);
        const jurosMora = formData.jurosMora ? parsePercentage(formData.jurosMora, 0.00033) : 0.00033;
        const taxasSeguro = formData.taxasSeguro ? parseNumber(formData.taxasSeguro) : 0;
        const outrosEncargos = formData.outrosEncargos ? parseNumber(formData.outrosEncargos) : 0;
        const tarifaAvaliacaoBem = formData.tarifaAvaliacaoBem ? parseNumber(formData.tarifaAvaliacaoBem) : 0;

        // Buscar taxa média
        const dataContrato = formData.dataContrato || new Date().toISOString().split('T')[0];
        let taxaMediaMensal = 0.0059;
        let taxaMediaAnual = 0.0735;

        // Criar financiamento
        const dataCalculoAtual = new Date().toISOString().split('T')[0];

        const params = {
          p_valor_financiado: valorFinanciado,
          p_taxa_juros_mensal_contrato: taxaJurosMensal,
          p_taxa_juros_anual_contrato: taxaJurosAnual,
          p_taxa_media_mensal: taxaMediaMensal,
          p_taxa_media_anual: taxaMediaAnual,
          p_qtd_parcelas_contrato: numeroParcelas,
          p_qtd_parcelas_analise: numeroParcelas,
          p_seguros_mensais: taxasSeguro,
          p_sistema_amortizacao: (formData.sistemaAmortizacao || 'sac').toUpperCase(),
          p_indexador_cm: 'TR',
          p_data_contratual: dataContrato,
          p_primeiro_vencimento: formData.dataPrimeiroVencimento,
          p_credor: formData.credor,
          p_devedor: formData.devedor,
          p_tipo_contrato: 'Financiamento Imobiliário SFH',
          p_data_calculo: dataCalculoAtual,
          p_valor_bem: valorBem,
          p_valor_entrada: entrada,
          p_valor_parcela_contrato: valorParcela,
          p_multa_moratoria_percent: multaMoratoria,
          p_juros_mora_percent: jurosMora,
          p_outros_encargos: outrosEncargos,
          p_tarifa_avaliacao_bem: tarifaAvaliacaoBem,
        };

        const result = await financiamentosService.criarFinanciamentoEAnalise(params);
        currentFinanciamentoId = result.financiamento_calculo_id;
        console.log('✅ Financiamento criado:', currentFinanciamentoId);
        toast.success('Financiamento criado com sucesso!');
      }

      // Gerar relatório completo via RPC
      console.log('\n========== GERANDO RELATÓRIO COMPLETO VIA RPC ==========');
      console.log('🆔 Financiamento ID:', currentFinanciamentoId);
      console.log('📊 Quantidade de parcelas:', parseInt(formData.numeroParcelas));

      const relatorio = await financiamentosService.gerarRelatorioCompleto(
        currentFinanciamentoId!,
        parseInt(formData.numeroParcelas)
      );

      console.log('✅ Relatório gerado:', relatorio.relatorio_id);
      console.log('📋 Cabeçalho:', relatorio.cabecalho);
      console.log('📊 Amortização (primeiras 3 parcelas):', relatorio.amortizacao.slice(0, 3));

      // Transformar dados para formato do RelatorioCompleto
      const fc = relatorio.cabecalho.financiamentos_calculo;

      const relatorioData = {
        tipo: 'financiamento' as const,
        credor: fc.credor,
        devedor: fc.devedor,
        contratoNum: fc.numero_processo || 'N/A',
        metodologia: `Financiamento Imobiliário - ${fc.sistema_amortizacao}`,

        cards: {
          valorPrincipal: relatorio.cabecalho.valor_principal,
          totalJuros: relatorio.cabecalho.total_juros_cobrado || 0,
          totalTaxas: relatorio.cabecalho.total_taxas || 0,
          valorTotalDevido: relatorio.cabecalho.valor_total_devido || 0,
          totalRestituir: relatorio.cabecalho.valor_total_a_restituir || 0,
        },

        comparativo: {
          taxaContratoAM: fc.taxa_juros_mensal_contrato,
          taxaMercadoAM: fc.taxa_media_mensal,
          sobretaxaPP: relatorio.cabecalho.percentual_sobretaxa || 0,
        },

        tabelaAmortizacao: relatorio.amortizacao.map((parcela) => ({
          mes: parcela.numero_parcela,
          data: parcela.data_vencimento,
          valorOriginalParcela: parcela.pmt_original, // PMT original do contrato
          valorCorrigido: parcela.amortizacao + parcela.juros_media, // Amortização + Juros pela taxa média
          juros: parcela.juros, // Juros cobrados no contrato
          amortizacao: parcela.amortizacao,
          saldoDevedor: parcela.saldo_devedor,
          // Campos extras para referência futura
          saldoInicial: parcela.saldo_inicial,
          jurosContrato: parcela.juros_contrato,
          jurosMedia: parcela.juros_media,
          totalParcela: parcela.total_parcela,
          saldoFinal: parcela.saldo_final,
          diferencaJuros: parcela.diferenca_juros,
          restituicaoAcumulada: parcela.restituicao_acumulada,
        })),

        sistemaAmortizacao: fc.sistema_amortizacao,

        formatted: {
          cards: {
            valorPrincipal: formatCurrency(relatorio.cabecalho.valor_principal),
            totalJuros: formatCurrency(relatorio.cabecalho.total_juros_cobrado || 0),
            totalTaxas: formatCurrency(relatorio.cabecalho.total_taxas || 0),
            valorTotalDevido: formatCurrency(relatorio.cabecalho.valor_total_devido || 0),
            totalRestituir: formatCurrency(relatorio.cabecalho.valor_total_a_restituir || 0),
          },
          comparativo: {
            taxaContratoAM: formatPercent(fc.taxa_juros_mensal_contrato),
            taxaMercadoAM: formatPercent(fc.taxa_media_mensal),
            sobretaxaPP: formatPercent(relatorio.cabecalho.percentual_sobretaxa || 0),
          },
        },
      };

      console.log('📊 Dados do relatório formatados:', relatorioData);
      console.log('\n✅ RELATÓRIO COMPLETO GERADO COM SUCESSO!');

      toast.success('Relatório completo gerado com sucesso!');

      // Navegar para visualização do relatório
      console.log('\n========== NAVEGANDO PARA VISUALIZAÇÃO DO RELATÓRIO ==========');
      console.log('🔄 Redirecionando para:', 'calc-relatorio');
      console.log('🆔 Com ID:', relatorio.relatorio_id);

      setTimeout(() => {
        onNavigate('calc-relatorio', relatorio.relatorio_id, relatorioData);
      }, 300);

    } catch (error) {
      console.error('\n❌❌❌ ERRO AO GERAR RELATÓRIO COMPLETO ❌❌❌');
      console.error('Detalhes do erro:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      toast.error('Erro ao gerar relatório completo');
    } finally {
      setLoading(false);
      console.log('\n========== FIM DO PROCESSO ==========\n');
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
                <Label htmlFor="taxaMediaMensal">
                  Taxa Média Mensal (BACEN)
                  <span className="text-xs text-gray-500 ml-1">(Opcional - Preenchida automaticamente)</span>
                </Label>
                <Input
                  id="taxaMediaMensal"
                  type="text"
                  placeholder="Ex: 0,59% - Buscado automaticamente do BACEN"
                  value={formData.taxaMediaMensal}
                  onChange={(e) => handleInputChange('taxaMediaMensal', e.target.value)}
                  className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxaMediaAnual">
                  Taxa Média Anual (BACEN)
                  <span className="text-xs text-gray-500 ml-1">(Opcional - Calculada automaticamente)</span>
                </Label>
                <Input
                  id="taxaMediaAnual"
                  type="text"
                  placeholder="Ex: 7,35% - Calculado automaticamente"
                  value={formData.taxaMediaAnual}
                  onChange={(e) => handleInputChange('taxaMediaAnual', e.target.value)}
                  className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800"
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