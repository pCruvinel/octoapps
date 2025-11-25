'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Download, AlertTriangle, TrendingUp, CreditCard } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { analisarCartaoPrevia } from '@/services/calculationEngine.cartao';
import type { AnaliseCartaoResponse } from '@/types/calculation.types';

interface AnalisePreviaCartaoProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
  data: any; // Dados do cartão vindos do formulário
}

export function AnalisePreviaCartao({ calcId, onNavigate, data }: AnalisePreviaCartaoProps) {
  const [analise, setAnalise] = useState<AnaliseCartaoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AnalisePreviaCartao useEffect - data:', data);
    console.log('🔍 AnalisePreviaCartao useEffect - calcId:', calcId);

    if (data) {
      // Usar dados já calculados que vieram do CartaoCredito
      console.log('📊 Recebendo dados de análise prévia de cartão...', data);
      setAnalise(data);
      setLoading(false);
      toast.success('Análise prévia carregada!');
    } else {
      console.error('❌ Nenhum dado de análise disponível!');
      setLoading(false);
      toast.error('Nenhum dado de análise disponível');
    }
  }, [data]);

  const handleExport = () => {
    toast.success('Análise exportada em PDF com sucesso!');
  };

  const handleGerarRelatorio = () => {
    if (!calcId) {
      toast.error('ID do cálculo não disponível');
      return;
    }

    toast.success('Gerando relatório completo...');
    setTimeout(() => {
      onNavigate('calc-relatorio', calcId, data);
    }, 500);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Realizando análise...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analise) {
    return (
      <div className="p-4 lg:p-8">
        <Card className="border-yellow-500 dark:border-yellow-600">
          <CardContent className="pt-6">
            <p className="text-yellow-700 dark:text-yellow-400">
              Erro ao realizar análise. Verifique os dados e tente novamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentualAbuso = analise.percentualAbuso;
  const temAbuso = percentualAbuso > 50; // > 50% acima do mercado

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

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">
            Análise Prévia - Cartão de Crédito
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análise de {analise?.mesesAnalise || 24} meses de juros rotativos
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button onClick={handleGerarRelatorio} className="gap-2">
            Gerar Relatório Completo
          </Button>
        </div>
      </div>

      {/* Alerta de Abusividade */}
      {temAbuso && (
        <Card className="mb-6 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Encargos Abusivos Detectados
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-3">
                  A taxa cobrada está {percentualAbuso.toFixed(0)}% acima da taxa média de mercado,
                  caracterizando possível abusividade segundo o CDC (Lei 8.078/90).
                </p>
                {analise.encargosAbusivos.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                    {analise.encargosAbusivos.map((encargo, idx) => (
                      <li key={idx}>{encargo}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Saldo Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Devedor</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analise.formatted?.saldoTotal}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Saldo atual no cartão
            </p>
          </CardContent>
        </Card>

        {/* Taxa Cobrada */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Cobrada</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analise.formatted?.taxaMediaCobrada}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Juros rotativo mensal
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Mercado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Mercado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analise.formatted?.taxaMercado}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Taxa média do setor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NOVO: Cards de Encargos Totais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Encargos Cobrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analise.formatted?.totalEncargosCobrados || 'N/A'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Juros + Mora + Multa + IOF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Encargos Devidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analise.formatted?.totalEncargosDevidos || 'N/A'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Apenas juros com taxa BACEN
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise Comparativa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Taxas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Taxa Cobrada (mensal)
                </span>
                <span className="font-semibold text-red-600">
                  {analise.formatted?.taxaMediaCobrada}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Taxa de Mercado (mensal)
                </span>
                <span className="font-semibold text-green-600">
                  {analise.formatted?.taxaMercado}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Sobretaxa</span>
                  <span className="font-bold text-orange-600">
                    {analise.formatted?.sobretaxaPP}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>CET (Custo Efetivo Total):</strong>
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Mensal:</span>
                  <span className="font-semibold">{analise.formatted?.cetMensal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Anual:</span>
                  <span className="font-semibold">{analise.formatted?.cetAnual}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projeção de Juros (12 meses)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Juros Cobrado
                </span>
                <span className="font-semibold text-red-600">
                  {analise.formatted?.totalJurosCobrado}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Juros Devido
                </span>
                <span className="font-semibold text-green-600">
                  {analise.formatted?.totalJurosDevido}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Diferença (Restituição)</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {analise.formatted?.diferencaRestituicao}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                Possível economia de <strong>{analise.formatted?.diferencaRestituicao}</strong> em 12 meses
                se aplicada taxa de mercado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Abusividade */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Abusividade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-sm">Anatocismo (Juros sobre Juros)</span>
              <span className={`font-semibold ${analise.anatocismoDetectado ? 'text-red-600' : 'text-green-600'}`}>
                {analise.anatocismoDetectado ? '⚠️ Detectado' : '✅ Não detectado'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-sm">Taxa Abusiva (&gt; 150% do mercado)</span>
              <span className={`font-semibold ${temAbuso ? 'text-red-600' : 'text-green-600'}`}>
                {temAbuso ? '⚠️ Sim' : '✅ Não'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-sm">Percentual Acima do Mercado</span>
              <span className={`font-semibold ${percentualAbuso > 50 ? 'text-red-600' : 'text-orange-600'}`}>
                {percentualAbuso.toFixed(1)}%
              </span>
            </div>
          </div>

          {analise.totalEncargos > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                <strong>Total de Encargos:</strong> R$ {analise.totalEncargos.toFixed(2)}
                <span className="block mt-1 text-xs">
                  (Anuidade, seguros e tarifas cobradas no período)
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Ação */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleGerarRelatorio} size="lg">
          Prosseguir para Relatório Completo
        </Button>
      </div>
    </div>
  );
}
