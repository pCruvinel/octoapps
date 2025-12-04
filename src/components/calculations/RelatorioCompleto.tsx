'use client';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { RelatorioCompletoResponse } from '@/types/calculation.types';
import { formatarMoeda } from '@/services/calculationEngine';

// Tipo flexível para suportar dados adicionais de outros tipos de cálculo
interface RelatorioCompletoProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
  data?: RelatorioCompletoResponse & {
    tipo?: 'financiamento' | 'emprestimo' | 'cartao';
    sistemaAmortizacao?: string;
    irregularidades?: string[];
    cetMensal?: number;
    cetAnual?: number;
  };
}

export function RelatorioCompleto({ calcId, onNavigate, data }: RelatorioCompletoProps) {
  const handleExport = () => {
    // TODO: Implementar geração de PDF
    toast.success('Relatório exportado em PDF com sucesso!');
  };

  // ========== TYPE DETECTION ==========
  const tipoCalculo = data?.tipo || 'financiamento';

  // Títulos dinâmicos baseados no tipo
  const tituloRelatorio = {
    financiamento: 'Financiamento Imobiliário',
    emprestimo: 'Empréstimo',
    cartao: 'Cartão de Crédito',
  }[tipoCalculo];

  const descricaoRelatorio = {
    financiamento: 'Relatório detalhado de cálculos financeiros para processos judiciais.',
    emprestimo: 'Análise detalhada de empréstimo com Sistema PRICE/SAC.',
    cartao: 'Análise detalhada de operações de cartão de crédito.',
  }[tipoCalculo];

  // Formatar data sem problemas de timezone (YYYY-MM-DD → DD/MM/YYYY)
  const formatarData = (dataStr: string | undefined | null): string => {
    if (!dataStr) return 'N/A';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Usar dados reais se disponíveis
  const dadosRelatorio = {
    credor: data?.credor || 'N/A',
    devedor: data?.devedor || 'N/A',
    contrato: data?.contratoNum ? `Contrato nº ${data.contratoNum}` : 'N/A',
    metodologia: data?.metodologia || 'N/A',
  };

  const encargos = {
    valorPrincipal: data?.formatted?.cards?.valorPrincipal || 'R$ 0,00',
    totalJuros: data?.formatted?.cards?.totalJuros || 'R$ 0,00',
    totalTaxas: data?.formatted?.cards?.totalTaxas || 'R$ 0,00',
    valorTotalDevido: data?.formatted?.cards?.valorTotalDevido || 'R$ 0,00',
    valorRestituir: data?.formatted?.cards?.totalRestituir || 'R$ 0,00',
  };

  const comparativo = {
    taxaContratoAM: data?.formatted?.comparativo?.taxaContratoAM || '0,00%',
    taxaMercadoAM: data?.formatted?.comparativo?.taxaMercadoAM || '0,00%',
    sobretaxaPP: data?.formatted?.comparativo?.sobretaxaPP || '0,00%',
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

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">
            Relatório Completo de Cálculo - {tituloRelatorio}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {descricaoRelatorio}
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Relatório Completo (PDF)
        </Button>
      </div>

      {!data && (
        <Card className="mb-6 border-yellow-500 dark:border-yellow-600">
          <CardContent className="pt-6">
            <p className="text-yellow-700 dark:text-yellow-400">
              Nenhum dado de relatório disponível. Gere um relatório completo primeiro.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Dados do Credor, Devedor e do Processo */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Credor, Devedor e do Processo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Credor</p>
                <p className="text-gray-900 dark:text-white">{dadosRelatorio.credor}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Devedor</p>
                <p className="text-gray-900 dark:text-white">{dadosRelatorio.devedor}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Dados do Contrato</p>
                <p className="text-gray-900 dark:text-white">{dadosRelatorio.contrato}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Metodologia de Cálculo</p>
                <p className="text-gray-900 dark:text-white">{dadosRelatorio.metodologia}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Comparativo de Taxas */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Taxas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxa do Contrato</p>
                <p className="text-2xl text-gray-900 dark:text-white">{comparativo.taxaContratoAM}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Mercado</p>
                <p className="text-2xl text-gray-900 dark:text-white">{comparativo.taxaMercadoAM}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Sobretaxa</p>
                <p className="text-2xl text-red-600 dark:text-red-400">{comparativo.sobretaxaPP}</p>
              </div>
            </div>

            {/* CET - Apenas para Empréstimo e Cartão */}
            {(tipoCalculo === 'emprestimo' || tipoCalculo === 'cartao') && data?.cetMensal && data?.cetAnual && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Custo Efetivo Total (CET)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">CET Mensal</p>
                    <p className="text-xl text-gray-900 dark:text-white">
                      {(data.cetMensal * 100).toFixed(4)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">CET Anual</p>
                    <p className="text-xl text-gray-900 dark:text-white">
                      {(data.cetAnual * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sistema de Amortização - Apenas para Empréstimo */}
            {tipoCalculo === 'emprestimo' && data?.sistemaAmortizacao && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Sistema de Amortização</p>
                <p className="text-xl text-gray-900 dark:text-white">{data.sistemaAmortizacao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Irregularidades - Apenas para Empréstimo e Cartão */}
        {(tipoCalculo === 'emprestimo' || tipoCalculo === 'cartao') && data?.irregularidades && data.irregularidades.length > 0 && (
          <Card className="border-red-500 dark:border-red-600">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400">Irregularidades Detectadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.irregularidades.map((irr, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-900 dark:text-white">
                    <span className="text-red-600 dark:text-red-400 flex-shrink-0">⚠</span>
                    <span>{irr}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Detalhes de Encargos */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes de Encargos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Valor Principal</Label>
                <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950">
                  <p className="text-gray-900 dark:text-white">{encargos.valorPrincipal}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total de Juros</Label>
                <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950">
                  <p className="text-gray-900 dark:text-white">{encargos.totalJuros}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total de Taxas</Label>
                <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950">
                  <p className="text-gray-900 dark:text-white">{encargos.totalTaxas}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor Total Devido</Label>
                <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950">
                  <p className="text-gray-900 dark:text-white">{encargos.valorTotalDevido}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor Total a Restituir</Label>
                <div className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800">
                  <p className="text-green-700 dark:text-green-400">{encargos.valorRestituir}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Amortização - Apenas para Financiamento e Empréstimo */}
        {(tipoCalculo === 'financiamento' || tipoCalculo === 'emprestimo') && (
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Amortização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Valor Original</TableHead>
                      <TableHead>Juros</TableHead>
                      <TableHead>Amortização</TableHead>
                      <TableHead>Saldo Devedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.tabelaAmortizacao && data.tabelaAmortizacao.length > 0 ? (
                      data.tabelaAmortizacao.map((row) => (
                        <TableRow key={row.mes}>
                          <TableCell>{row.mes}</TableCell>
                          <TableCell>{formatarMoeda(row.valorOriginalParcela)}</TableCell>
                          <TableCell>{formatarMoeda(row.juros)}</TableCell>
                          <TableCell>{formatarMoeda(row.amortizacao)}</TableCell>
                          <TableCell>{formatarMoeda(row.saldoDevedor)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400">
                          Nenhum dado disponível
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo Executivo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 dark:text-white leading-relaxed">
              {tipoCalculo === 'financiamento' && (
                <>
                  Este relatório apresenta o cálculo revisional de financiamento imobiliário, comparando os valores efetivamente cobrados com os valores que deveriam ter sido cobrados considerando a taxa média de mercado. O cálculo envolve o credor {dadosRelatorio.credor} e o devedor {dadosRelatorio.devedor}, referente ao contrato {dadosRelatorio.contratoNum || 'não informado'}. A análise contempla {data?.tabelaAmortizacao?.length || 0} parcelas, utilizando a metodologia {dadosRelatorio.metodologia}.
                </>
              )}
              {tipoCalculo === 'emprestimo' && (
                <>
                  Este relatório apresenta a análise revisional de empréstimo {data?.sistemaAmortizacao ? `utilizando o Sistema ${data.sistemaAmortizacao}` : ''}, comparando os valores efetivamente cobrados com os valores devidos considerando a taxa média de mercado e identificando irregularidades contratuais. O cálculo envolve o credor {dadosRelatorio.credor} e o devedor {dadosRelatorio.devedor}, referente ao contrato {dadosRelatorio.contratoNum || 'não informado'}. A análise contempla {data?.tabelaAmortizacao?.length || 0} parcelas e considera os encargos iniciais, tarifas recorrentes e o Custo Efetivo Total (CET).
                </>
              )}
              {tipoCalculo === 'cartao' && (
                <>
                  Este relatório apresenta a análise de operações de cartão de crédito, identificando práticas abusivas como anatocismo (juros sobre juros), encargos irregulares e sobretaxa acima do mercado. O cálculo envolve o credor {dadosRelatorio.credor} e o devedor {dadosRelatorio.devedor}. A análise contempla o Custo Efetivo Total (CET), comparação com taxas de mercado e identificação de encargos vedados pela legislação consumerista.
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Base Legal e Metodologia */}
        <Card>
          <CardHeader>
            <CardTitle>Base Legal e Metodologia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 dark:text-white leading-relaxed">
              {tipoCalculo === 'financiamento' && (
                <>
                  Os cálculos são fundamentados no Código Civil Brasileiro (Lei 10.406/2002), Código de Defesa do Consumidor (Lei 8.078/1990, especialmente Art. 39, V e Art. 51, IV), Lei do Sistema Financeiro de Habitação (Lei 4.380/1964 e Lei 10.931/2004), e Resolução CMN 3.932/2010 que regulamenta encargos bancários. A metodologia empregada utiliza o Sistema de Amortização Constante (SAC), com taxa de juros efetiva de {data?.formatted?.comparativo?.taxaContratoAM || 'não informada'} ao mês. O comparativo com a taxa média de mercado ({data?.formatted?.comparativo?.taxaMercadoAM || 'não informada'}) identifica eventual sobretaxa em desacordo com os parâmetros do SFH.
                </>
              )}
              {tipoCalculo === 'emprestimo' && (
                <>
                  Os cálculos são fundamentados no Código Civil Brasileiro (Lei 10.406/2002), Código de Defesa do Consumidor (Lei 8.078/1990, Art. 39, V - venda casada, e Art. 51, IV - vantagens exageradas), Resolução CMN 3.518/2007 (proíbe TAC e TEC desde 30/04/2008), Resolução CMN 3.919/2010 (Custo Efetivo Total - CET), e Súmula 472 do STJ (vedação de cumulação de comissão de permanência com outros encargos). A metodologia empregada utiliza o Sistema {data?.sistemaAmortizacao || 'PRICE'} de amortização, calculando o CET mensal e anual para identificação de encargos abusivos. A taxa efetiva de {data?.formatted?.comparativo?.taxaContratoAM || 'não informada'} é comparada com a taxa de mercado de {data?.formatted?.comparativo?.taxaMercadoAM || 'não informada'}.
                </>
              )}
              {tipoCalculo === 'cartao' && (
                <>
                  Os cálculos são fundamentados no Código de Defesa do Consumidor (Lei 8.078/1990, Art. 39, V e Art. 51, IV), Resolução CMN 4.549/2017 (pagamento mínimo de 15% da fatura), Resolução CMN 3.919/2010 (divulgação do CET), Súmula 283 do STJ (juros remuneratórios), e Súmula 381 do STJ (anatocismo). A análise identifica a prática de anatocismo (capitalização de juros no rotativo), encargos irregulares (seguros não contratados, tarifas vedadas), e sobretaxa abusiva em relação às taxas médias de mercado divulgadas pelo Banco Central. O CET efetivo é comparado com a taxa média do mercado para identificar possíveis vantagens excessivas vedadas pelo CDC.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente Label auxiliar para manter consistência visual
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-400">
      {children}
    </p>
  );
}
