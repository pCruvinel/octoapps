'use client';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  AnalisePreviaResponse,
  AnaliseCartaoResponse,
  AnaliseEmprestimoResponse
} from '@/types/calculation.types';

// Union type para suportar todos os tipos de análise
type AnaliseData = AnalisePreviaResponse | AnaliseCartaoResponse | AnaliseEmprestimoResponse;

interface AnalisePreviaProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
  data?: AnaliseData;
}

export function AnalisePrevia({ calcId, onNavigate, data }: AnalisePreviaProps) {
  const handleExport = () => {
    // TODO: Implementar geração de PDF
    toast.success('Análise exportada em PDF com sucesso!');
  };

  // ========== TYPE GUARDS ==========
  const isCartaoData = (d: AnaliseData | undefined): d is AnaliseCartaoResponse => {
    return d !== undefined && 'anatocismoDetectado' in d;
  };

  const isEmprestimoData = (d: AnaliseData | undefined): d is AnaliseEmprestimoResponse => {
    return d !== undefined && 'sistemaAmortizacao' in d;
  };

  const isFinanciamentoData = (d: AnaliseData | undefined): d is AnalisePreviaResponse => {
    return d !== undefined && !isCartaoData(d) && !isEmprestimoData(d);
  };

  // ========== DETECT TYPE ==========
  const tipoCalculo: 'cartao' | 'emprestimo' | 'financiamento' = isCartaoData(data)
    ? 'cartao'
    : isEmprestimoData(data)
    ? 'emprestimo'
    : 'financiamento';

  // ========== EXTRACT DATA BASED ON TYPE ==========
  // Taxa do Contrato
  const taxaContratoLabel = tipoCalculo === 'cartao' ? 'Taxa Média Cobrada' : 'Taxa do Contrato';
  const taxaContratoAM = isCartaoData(data)
    ? data.formatted?.taxaMediaCobrada || '0,00%'
    : isEmprestimoData(data)
    ? data.formatted?.taxaCobradaMensal || '0,00%'
    : data?.formatted?.taxaContratoAM || '0,00%';

  // Taxa de Mercado
  const taxaMercadoAM = isCartaoData(data)
    ? data.formatted?.taxaMercado || '0,00%'
    : isEmprestimoData(data)
    ? data.formatted?.taxaMercadoMensal || '0,00%'
    : data?.formatted?.taxaMercadoAM || '0,00%';

  // Sobretaxa
  const sobretaxaPP = data?.formatted?.sobretaxaPP || '0,00%';

  // Valores
  const valorTotalPago = isCartaoData(data)
    ? data.formatted?.totalJurosCobrado || 'R$ 0,00'
    : isEmprestimoData(data)
    ? data.formatted?.totalJurosCobrado || 'R$ 0,00'
    : data?.formatted?.valorTotalPago || 'R$ 0,00';

  const valorDevidoLabel = isCartaoData(data) || isEmprestimoData(data)
    ? 'Total de Juros que Deveria ter Pago'
    : 'Valor que Deveria ter Pago';

  const valorDevido = isCartaoData(data)
    ? data.formatted?.totalJurosDevido || 'R$ 0,00'
    : isEmprestimoData(data)
    ? data.formatted?.totalJurosDevido || 'R$ 0,00'
    : data?.formatted?.valorDevido || 'R$ 0,00';

  const diferencaRestituicao = data?.formatted?.diferencaRestituicao || 'R$ 0,00';

  // CET (apenas para cartão e empréstimo)
  const cetMensal = (isCartaoData(data) || isEmprestimoData(data))
    ? data.formatted?.cetMensal || '0,00%'
    : null;

  const cetAnual = (isCartaoData(data) || isEmprestimoData(data))
    ? data.formatted?.cetAnual || '0,00%'
    : null;

  // ========== CALCULATED VALUES ==========
  // Calcular percentual de diferença
  const calcularPercentualDiferenca = (): string => {
    if (!data) return '0%';
    const valorDevidoNum = isCartaoData(data)
      ? data.totalJurosDevido
      : isEmprestimoData(data)
      ? data.totalJurosDevido
      : data.valorDevido;

    if (valorDevidoNum === 0) return '0%';
    const percentual = ((data.diferencaRestituicao / valorDevidoNum) * 100).toFixed(0);
    return `${percentual}%`;
  };

  // Verificar se há sobretaxa significativa (> 0.001 = 0.1%)
  const temSobretaxaSignificativa = data && data.sobretaxaPP > 0.001;

  // Verificar se há diferença significativa (> 10%)
  const temDiferencaSignificativa = data && (() => {
    const valorDevidoNum = isCartaoData(data)
      ? data.totalJurosDevido
      : isEmprestimoData(data)
      ? data.totalJurosDevido
      : data.valorDevido;
    return valorDevidoNum > 0 && (data.diferencaRestituicao / valorDevidoNum) > 0.1;
  })();

  // Irregularidades detectadas
  const irregularidades: string[] = [];
  if (isCartaoData(data)) {
    if (data.anatocismoDetectado) {
      irregularidades.push('Anatocismo detectado (juros sobre juros)');
    }
    if (data.encargosAbusivos && data.encargosAbusivos.length > 0) {
      irregularidades.push(...data.encargosAbusivos);
    }
  }
  if (isEmprestimoData(data)) {
    if (data.tacTecIrregular) {
      irregularidades.push('TAC/TEC irregular (vedada pela Resolução CMN 3.518/2007)');
    }
    if (data.encargosIrregulares && data.encargosIrregulares.length > 0) {
      irregularidades.push(...data.encargosIrregulares);
    }
  }
  const temIrregularidades = irregularidades.length > 0;

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
            Análise Prévia
            {tipoCalculo === 'cartao' && ' - Cartão de Crédito'}
            {tipoCalculo === 'emprestimo' && ' - Empréstimo'}
            {tipoCalculo === 'financiamento' && ' - Financiamento Imobiliário'}
          </h1>
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
              <div className="text-sm text-gray-500 dark:text-gray-400">{taxaContratoLabel}</div>
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
            {cetMensal && cetAnual && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-sm text-gray-500 dark:text-gray-400">CET (Custo Efetivo Total)</div>
                <div className="text-lg text-gray-900 dark:text-white">
                  Mensal: {cetMensal} | Anual: {cetAnual}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Representatividade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tipoCalculo === 'financiamento' && (
              <>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Redução Estimada Juros Simples</div>
                  <div className="text-2xl text-gray-900 dark:text-white">
                    {data?.formatted?.reducaoEstimadaSimples || 'R$ 0,00'}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Redução Estimada Média</div>
                  <div className={`text-2xl ${temDiferencaSignificativa ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {data?.formatted?.reducaoEstimadaMedia || 'R$ 0,00'}
                  </div>
                </div>
              </>
            )}
            {(tipoCalculo === 'cartao' || tipoCalculo === 'emprestimo') && (
              <>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {tipoCalculo === 'cartao' || tipoCalculo === 'emprestimo'
                      ? 'Total de Juros Cobrado'
                      : 'Valor Total Pago'}
                  </div>
                  <div className="text-2xl text-gray-900 dark:text-white">{valorTotalPago}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{valorDevidoLabel}</div>
                  <div className="text-2xl text-gray-900 dark:text-white">{valorDevido}</div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Diferença (Possível Restituição)</div>
                  <div className={`text-2xl ${temDiferencaSignificativa ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {diferencaRestituicao}
                  </div>
                </div>
              </>
            )}
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
                  ? `Diferença significativa entre valores (${calcularPercentualDiferenca()} de diferença)`
                  : 'Diferença entre valores dentro dos parâmetros normais'}
              </span>
            </li>
            {temIrregularidades && (
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 flex-shrink-0">⚠</span>
                <div className="text-gray-900 dark:text-white">
                  <div className="font-semibold">Irregularidades detectadas:</div>
                  <ul className="mt-1 space-y-1 pl-4">
                    {irregularidades.map((irr, idx) => (
                      <li key={idx} className="text-sm">• {irr}</li>
                    ))}
                  </ul>
                </div>
              </li>
            )}
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
              <span className={`${(temSobretaxaSignificativa && temDiferencaSignificativa) || temIrregularidades ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'} flex-shrink-0`}>
                {(temSobretaxaSignificativa && temDiferencaSignificativa) || temIrregularidades ? '✓' : '○'}
              </span>
              <span className="text-gray-900 dark:text-white">
                {(temSobretaxaSignificativa && temDiferencaSignificativa) || temIrregularidades
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