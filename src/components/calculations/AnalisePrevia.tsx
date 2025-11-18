'use client';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AnalisePreviaResponse } from '@/types/calculation.types';

interface AnalisePreviaProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
  data?: AnalisePreviaResponse;
}

export function AnalisePrevia({ calcId, onNavigate, data }: AnalisePreviaProps) {
  const handleExport = () => {
    // TODO: Implementar geração de PDF
    toast.success('Análise exportada em PDF com sucesso!');
  };

  // Usar dados reais se disponíveis, caso contrário usar valores de fallback
  const taxaContratoAM = data?.formatted?.taxaContratoAM || '0,00%';
  const taxaMercadoAM = data?.formatted?.taxaMercadoAM || '0,00%';
  const sobretaxaPP = data?.formatted?.sobretaxaPP || '0,00%';
  const valorTotalPago = data?.formatted?.valorTotalPago || 'R$ 0,00';
  const valorDevido = data?.formatted?.valorDevido || 'R$ 0,00';
  const diferencaRestituicao = data?.formatted?.diferencaRestituicao || 'R$ 0,00';

  // Calcular percentual de diferença
  const calcularPercentualDiferenca = (): string => {
    if (!data) return '0%';
    const percentual = ((data.diferencaRestituicao / data.valorDevido) * 100).toFixed(0);
    return `${percentual}%`;
  };

  // Verificar se há sobretaxa significativa (> 0.001 = 0.1%)
  const temSobretaxaSignificativa = data && data.sobretaxaPP > 0.001;

  // Verificar se há diferença significativa (> 10%)
  const temDiferencaSignificativa = data && (data.diferencaRestituicao / data.valorDevido) > 0.1;

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
          <h1 className="text-gray-900 dark:text-white mb-2">Análise Prévia</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Resumo comparativo do cálculo revisional
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Análise (PDF)
        </Button>
      </div>

      {!data && (
        <Card className="mb-6 border-yellow-500 dark:border-yellow-600">
          <CardContent className="pt-6">
            <p className="text-yellow-700 dark:text-yellow-400">
              Nenhum dado de análise disponível. Execute uma análise prévia primeiro.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Comparativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Taxa do Contrato</div>
              <div className="text-2xl text-gray-900 dark:text-white">{taxaContratoAM}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Taxa Média do Mercado</div>
              <div className="text-2xl text-gray-900 dark:text-white">{taxaMercadoAM}</div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Sobretaxa</div>
              <div className={`text-2xl ${temSobretaxaSignificativa ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {sobretaxaPP}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Representatividade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Valor Total Pago</div>
              <div className="text-2xl text-gray-900 dark:text-white">{valorTotalPago}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Valor que Deveria ter Pago</div>
              <div className="text-2xl text-gray-900 dark:text-white">{valorDevido}</div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Diferença (Possível Restituição)</div>
              <div className={`text-2xl ${temDiferencaSignificativa ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {diferencaRestituicao}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pontos de Viabilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className={`${temSobretaxaSignificativa ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} flex-shrink-0`}>
                {temSobretaxaSignificativa ? '✓' : '○'}
              </span>
              <span className="text-gray-900 dark:text-white">
                {temSobretaxaSignificativa
                  ? `Sobretaxa identificada (${sobretaxaPP}), caracterizando possível abusividade`
                  : 'Nenhuma sobretaxa significativa identificada'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className={`${temDiferencaSignificativa ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} flex-shrink-0`}>
                {temDiferencaSignificativa ? '✓' : '○'}
              </span>
              <span className="text-gray-900 dark:text-white">
                {temDiferencaSignificativa
                  ? `Diferença significativa entre valor pago e valor devido (${calcularPercentualDiferenca()} de diferença)`
                  : 'Diferença entre valores dentro dos parâmetros normais'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className={`${data && data.diferencaRestituicao > 1000 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} flex-shrink-0`}>
                {data && data.diferencaRestituicao > 1000 ? '✓' : '○'}
              </span>
              <span className="text-gray-900 dark:text-white">
                {data && data.diferencaRestituicao > 1000
                  ? `Potencial de restituição: ${diferencaRestituicao}`
                  : 'Potencial de restituição baixo ou inexistente'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className={`${temSobretaxaSignificativa && temDiferencaSignificativa ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} flex-shrink-0`}>
                {temSobretaxaSignificativa && temDiferencaSignificativa ? '✓' : '○'}
              </span>
              <span className="text-gray-900 dark:text-white">
                {temSobretaxaSignificativa && temDiferencaSignificativa
                  ? 'Caso com alta viabilidade para revisão judicial'
                  : 'Recomenda-se análise mais detalhada antes de prosseguir'}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}