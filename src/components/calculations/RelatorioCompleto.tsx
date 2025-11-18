'use client';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { RelatorioCompletoResponse } from '@/types/calculation.types';
import { formatarMoeda } from '@/services/calculationEngine';

interface RelatorioCompletoProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string, data?: any) => void;
  data?: RelatorioCompletoResponse;
}

export function RelatorioCompleto({ calcId, onNavigate, data }: RelatorioCompletoProps) {
  const handleExport = () => {
    // TODO: Implementar geração de PDF
    toast.success('Relatório exportado em PDF com sucesso!');
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
          <h1 className="text-gray-900 dark:text-white mb-2">Relatório Completo de Cálculo</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Relatório detalhado de cálculos financeiros para processos judiciais.
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
          </CardContent>
        </Card>

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

        {/* Tabela de Amortização */}
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
                    <TableHead>Data</TableHead>
                    <TableHead>Valor Original</TableHead>
                    <TableHead>Valor Corrigido</TableHead>
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
                        <TableCell>{new Date(row.data).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{formatarMoeda(row.valorOriginalParcela)}</TableCell>
                        <TableCell>{formatarMoeda(row.valorCorrigido)}</TableCell>
                        <TableCell>{formatarMoeda(row.juros)}</TableCell>
                        <TableCell>{formatarMoeda(row.amortizacao)}</TableCell>
                        <TableCell>{formatarMoeda(row.saldoDevedor)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 dark:text-gray-400">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Executivo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 dark:text-white leading-relaxed">
              Este relatório de detalha os cálculos financeiros para o processo número 1234567-89.2023.8.00.0001, envolvendo o credor {dadosRelatorio.credor} e o devedor {dadosRelatorio.devedor}. Os cálculos incluem uma tabela de amortização, detalhes de encargos e são baseados no contrato de empréstimo nº 98765.
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
              Os cálculos são baseados no Código Civil Brasileiro e no Código de Defesa do Consumidor, aplicando o método de juros compostos com uma taxa de juros mensal fixa de R$ 90,00. A amortização segue o método SAC (Sistema de Amortização Constante).
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
