'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CartaoCreditoProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string) => void;
}

export function CartaoCredito({ calcId, onNavigate }: CartaoCreditoProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    credor: '',
    devedor: '',
    dataCalculo: '',
    saldoDevedor: '',
    limiteTotalCartao: '',
    limiteDisponivel: '',
  });

  // Carregar dados quando estiver editando
  useEffect(() => {
    if (calcId) {
      // Simular carregamento de dados
      setFormData({
        credor: 'Banco ABC',
        devedor: 'Juliana Lima',
        dataCalculo: '2025-01-15',
        saldoDevedor: 'R$ 8.500,00',
        limiteTotalCartao: 'R$ 10.000,00',
        limiteDisponivel: 'R$ 1.500,00',
      });
      toast.info('Dados do caso carregados para edição');
    }
  }, [calcId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success('Dados salvos com sucesso!');
  };

  const handleAnalysis = () => {
    toast.success('Iniciando análise prévia...');
    setTimeout(() => onNavigate('calc-analise', '1'), 500);
  };

  const handleGenerateReport = () => {
    toast.success('Gerando relatório completo...');
    setTimeout(() => onNavigate('calc-relatorio', '1'), 500);
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
                <Label htmlFor="limiteTotalCartao">Limite Total do Cartão</Label>
                <Input id="limiteTotalCartao" type="text" placeholder="Limite total do cartão" value={formData.limiteTotalCartao} onChange={(e) => handleInputChange('limiteTotalCartao', e.target.value)} />
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
                <Input id="dataInicioAnalise" type="date" placeholder="Escolha a data" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataUltimaFatura">Data da Última Fatura</Label>
                <Input id="dataUltimaFatura" type="date" placeholder="Escolha a data" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoAnterior">Saldo Anterior</Label>
                <Input id="saldoAnterior" type="text" placeholder="Valor do saldo anterior" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoFinanciado">Saldo Financiado</Label>
                <Input id="saldoFinanciado" type="text" placeholder="Saldo total financiado" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">Data de Pagamento</Label>
                <Input id="dataPagamento" type="date" placeholder="Escolha a data" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcelamentos">Parcelamentos (fatura parcelada)</Label>
                <Input id="parcelamentos" type="text" placeholder="Informe os últimos do parcelamento da fatura" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saquesEspecieAvance">Saques em Espécie (Cash Advance)</Label>
                <Input id="saquesEspecieAvance" type="text" placeholder='ex.: "Saque R$ 400,00 - 05/07/2023"' />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anuidade">Anuidade</Label>
                <Input id="anuidade" type="text" placeholder="Valor da anuidade cobrada na fatura" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seguro">Seguro</Label>
                <Input id="seguro" type="text" placeholder="Valor do seguro lançado na fatura" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumosDespesas">Consumos / Despesas</Label>
                <Input id="consumosDespesas" type="text" placeholder="Total de consumos e despesas lançadas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagamentoMinimo">Pagamento Mínimo</Label>
                <Input id="pagamentoMinimo" type="text" placeholder="Valor mínimo de pagamento exigido por fatura" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalFatura">Total da Fatura</Label>
                <Input id="totalFatura" type="text" placeholder="Valor total da fatura" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorIOF">Valor de IOF</Label>
                <Input id="valorIOF" type="text" placeholder="Valor de IOF aplicado" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estornoAjuste">Estorno / Ajuste</Label>
                <Input id="estornoAjuste" type="text" placeholder="Valor de estornos ou ajustes realizados" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renegociacao">Renegociação</Label>
                <Input id="renegociacao" type="text" placeholder="Valor e condições de renegociações" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifa">Tarifa</Label>
                <Input id="tarifa" type="text" placeholder="Valor da tarifa aplicada" />
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
                <Input id="jurosRemuneratoriosAtraso" type="text" placeholder="Taxa de juros aplicada sobre atraso no rotativo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurosRotativo">Juros do Rotativo %</Label>
                <Input id="jurosRotativo" type="text" placeholder="Taxa de juros do crédito rotativo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diaVencimentoFatura">Dia de Vencimento da Fatura</Label>
                <Input id="diaVencimentoFatura" type="date" placeholder="Escolha a data" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxaJurosRemuneratorios">Taxa de Juros Remuneratórios</Label>
                <Input id="taxaJurosRemuneratorios" type="text" placeholder="Ex: 12% ou 012" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multaInadimplencia">Multa de Inadimplência</Label>
                <Input id="multaInadimplencia" type="text" placeholder="2%" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxasJurosRemuneratoriosAtrasoRotativo">Taxas de Juros Remuneratórios do Atraso / Rotativo</Label>
                <Input id="taxasJurosRemuneratoriosAtrasoRotativo" type="text" placeholder="Percentual de juros aplicado sobre atraso no rotativo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diesMora">Dies de Mora</Label>
                <Input id="diesMora" type="text" placeholder="Quantidade de dias em atraso" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cets">CETS - Custo Efetivo Total (a.a.)</Label>
                <Input id="cets" type="text" placeholder='ex.: "358% a.a."' />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxaJurosParcelamentoFatura">Taxa de Juros de Parcelamento de Fatura</Label>
                <Input id="taxaJurosParcelamentoFatura" type="text" placeholder="Percentual de juros do parcelamento de fatura" />
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