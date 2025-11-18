'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EmprestimosFinanciamentosProps {
  calcId: string | null;
  onNavigate: (route: string, id?: string) => void;
}

export function EmprestimosFinanciamentos({ calcId, onNavigate }: EmprestimosFinanciamentosProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    credor: '',
    devedor: '',
    tipoContrato: '',
    dataCalculo: '',
    totalFinanciado: '',
    valorParcela: '',
    quantidadeParcelas: '',
    dataPrimeiraParcela: '',
    dataContrato: '',
  });

  // Carregar dados quando estiver editando
  useEffect(() => {
    if (calcId) {
      // Simular carregamento de dados
      setFormData({
        credor: 'Financeira Beta LTDA',
        devedor: 'Pedro Santos',
        tipoContrato: 'emprestimo-pessoal',
        dataCalculo: '2025-01-15',
        totalFinanciado: 'R$ 15.000,00',
        valorParcela: 'R$ 550,00',
        quantidadeParcelas: '36',
        dataPrimeiraParcela: '2024-02-15',
        dataContrato: '2024-01-15',
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