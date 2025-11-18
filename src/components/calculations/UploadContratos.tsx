import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Upload, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface UploadContratosProps {
  onNavigate: (route: string, id?: string) => void;
}

export function UploadContratos({ onNavigate }: UploadContratosProps) {
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setExtractedData({
      credor: 'Banco Exemplo S.A.',
      devedor: 'João Silva',
      numeroContrato: '123456789',
      valorFinanciado: '250000,00',
      taxaJuros: '1,85',
      numeroParcelas: '360',
      dataContrato: '15/01/2020',
      sistemAmortizacao: 'SAC',
    });

    setUploading(false);
    toast.success('Contrato processado com sucesso!');
  };

  const handleProceed = () => {
    toast.success('Prosseguindo para cálculo...');
    onNavigate('calc-financiamento');
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-gray-900 dark:text-white mb-2">Upload de Contratos (OCR)</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Faça upload do contrato em PDF para extração automática de dados
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Arraste um arquivo PDF ou clique para selecionar
              </p>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
                id="fileUpload"
              />
              <Button
                onClick={() => document.getElementById('fileUpload')?.click()}
                disabled={uploading}
              >
                {uploading ? 'Processando...' : 'Selecionar Arquivo'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {extractedData && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Dados Extraídos</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Revise e edite os dados extraídos do contrato
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credor">Credor</Label>
                    <Input id="credor" defaultValue={extractedData.credor} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="devedor">Devedor</Label>
                    <Input id="devedor" defaultValue={extractedData.devedor} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroContrato">Nº do Contrato</Label>
                    <Input id="numeroContrato" defaultValue={extractedData.numeroContrato} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorFinanciado">Valor Financiado (R$)</Label>
                    <Input id="valorFinanciado" defaultValue={extractedData.valorFinanciado} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxaJuros">Taxa de Juros (%)</Label>
                    <Input id="taxaJuros" defaultValue={extractedData.taxaJuros} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroParcelas">Nº de Parcelas</Label>
                    <Input id="numeroParcelas" defaultValue={extractedData.numeroParcelas} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataContrato">Data do Contrato</Label>
                    <Input id="dataContrato" type="date" defaultValue={extractedData.dataContrato.split('/').reverse().join('-')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sistemaAmortizacao">Sistema de Amortização</Label>
                    <Input id="sistemaAmortizacao" defaultValue={extractedData.sistemAmortizacao} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline">
                Salvar Dados
              </Button>
              <Button onClick={handleProceed} className="gap-2">
                Prosseguir para Cálculo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}