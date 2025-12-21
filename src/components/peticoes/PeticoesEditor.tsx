import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Save, Download, FileText, Sparkles, Edit, Eye, Trash2, BookmarkPlus } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { peticoesService } from '@/services/peticoes.service';
import { Peticao } from '@/types/peticoes.types';
import { exportService, PeticaoExportData } from '@/services/export.service';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { PeticaoTemplate } from '@/components/pdf-templates/PeticaoTemplate';
import { useDocumentSettings } from '../pdf-engine/DocumentContext';

interface PeticoesEditorProps {
  documentId: string | null;
  onNavigate: (route: string, id?: string) => void;
}

export function PeticoesEditor({ documentId, onNavigate }: PeticoesEditorProps) {
  const { settings } = useDocumentSettings();
  const isNewDocument = documentId === 'new';
  const isViewMode = documentId && documentId !== 'new';

  const [viewMode, setViewMode] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [peticao, setPeticao] = useState<Peticao | null>(null);

  const [petitionData, setPetitionData] = useState({
    name: isNewDocument ? '' : '',
    type: isNewDocument ? '' : '',
    status: isNewDocument ? 'Rascunho' : 'Rascunho',
  });

  const [content, setContent] = useState(isNewDocument ? '' : '');

  const [caseData, setCaseData] = useState({
    client: '',
    contract: '',
    institution: '',
    value: '',
  });

  // Carregar petição ao montar componente
  useEffect(() => {
    if (documentId && documentId !== 'new') {
      loadPeticao(documentId);
    }
  }, [documentId]);

  const loadPeticao = async (id: string) => {
    try {
      setLoading(true);
      const data = await peticoesService.getById(id);
      if (data) {
        setPeticao(data);
        setPetitionData({
          name: data.nome,
          type: data.tipo,
          status: data.status,
        });
        setContent(data.conteudo);
        // Carregar dados do caso
        setCaseData({
          client: data.clienteNome || '',
          contract: data.numeroContrato || '',
          institution: data.instituicaoFinanceira || '',
          value: data.valorContrato ? `R$ ${data.valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
        });
      } else {
        toast.error('Petição não encontrada');
        onNavigate('peticoes');
      }
    } catch (error) {
      console.error('Erro ao carregar petição:', error);
      toast.error('Erro ao carregar petição');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!petitionData.name) {
      toast.error('Informe o nome da petição');
      return;
    }

    try {
      setLoading(true);

      // Converter valor para número (remover formatação)
      const valorNumerico = caseData.value
        ? parseFloat(caseData.value.replace(/[^\d,]/g, '').replace(',', '.'))
        : undefined;

      if (isNewDocument) {
        // Criar nova petição
        const novaPeticao = await peticoesService.create({
          nome: petitionData.name,
          tipo: petitionData.type,
          status: petitionData.status,
          conteudo: content,
          clienteNome: caseData.client || undefined,
          numeroContrato: caseData.contract || undefined,
          instituicaoFinanceira: caseData.institution || undefined,
          valorContrato: valorNumerico,
        });
        toast.success('Petição criada com sucesso!');
        onNavigate('peticoes-editor', novaPeticao.id);
      } else if (documentId) {
        // Atualizar petição existente
        await peticoesService.update(documentId, {
          nome: petitionData.name,
          tipo: petitionData.type,
          status: petitionData.status,
          conteudo: content,
          clienteNome: caseData.client || undefined,
          numeroContrato: caseData.contract || undefined,
          instituicaoFinanceira: caseData.institution || undefined,
          valorContrato: valorNumerico,
        });
        toast.success('Petição atualizada com sucesso!');
        await loadPeticao(documentId); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao salvar petição:', error);
      toast.error('Erro ao salvar petição');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    toast.success('Petição gerada com dados do caso!');
  };

  const handleExport = async (format: 'pdf' | 'word') => {
    // Validar se há conteúdo para exportar
    if (!content.trim()) {
      toast.error('Não há conteúdo para exportar. Adicione texto à petição antes de exportar.');
      return;
    }

    try {
      // Preparar dados para exportação
      const exportData: PeticaoExportData = {
        nome: petitionData.name || 'Petição sem título',
        tipo: petitionData.type || 'Não especificado',
        status: petitionData.status,
        conteudo: content,
        clienteNome: caseData.client || undefined,
        numeroContrato: caseData.contract || undefined,
        instituicaoFinanceira: caseData.institution || undefined,
        valorContrato: caseData.value || undefined,
      };

      // Exportar no formato selecionado
      if (format === 'pdf') {
        const blob = await pdf(
          <PeticaoTemplate data={exportData} settings={settings} />
        ).toBlob();

        const timestamp = new Date().getTime();
        saveAs(blob, `Peticao_${timestamp}.pdf`);

        toast.success('Documento exportado em PDF com sucesso!');
      } else {
        await exportService.exportToWord(exportData);
        toast.success('Documento exportado em Word com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar documento:', error);
      toast.error(`Erro ao exportar documento em ${format.toUpperCase()}`);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!content.trim()) {
      toast.error('O conteúdo está vazio. Adicione texto antes de salvar como modelo.');
      return;
    }

    if (!petitionData.name) {
      toast.error('Informe o nome da petição antes de salvar como modelo.');
      return;
    }

    try {
      setLoading(true);

      // Converter valor para número (remover formatação)
      const valorNumerico = caseData.value
        ? parseFloat(caseData.value.replace(/[^\d,]/g, '').replace(',', '.'))
        : undefined;

      // SEMPRE criar um novo registro de modelo (uma cópia da petição atual)
      // Isso permite que a petição original e o modelo sejam independentes
      await peticoesService.create({
        nome: petitionData.name,
        tipo: petitionData.type || 'Outro',
        status: 'Concluído',
        conteudo: content,
        modelo: 'custom', // Marca como modelo customizado
        clienteNome: caseData.client || undefined,
        numeroContrato: caseData.contract || undefined,
        instituicaoFinanceira: caseData.institution || undefined,
        valorContrato: valorNumerico,
      });

      toast.success('Modelo salvo com sucesso! Disponível para uso futuro.');
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      toast.error('Erro ao salvar modelo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentId || documentId === 'new') return;

    try {
      await peticoesService.softDelete(documentId);
      toast.success('Petição excluída com sucesso!');
      setDeleteDialogOpen(false);
      onNavigate('peticoes');
    } catch (error) {
      console.error('Erro ao excluir petição:', error);
      toast.error('Erro ao excluir petição');
    }
  };

  const toggleViewMode = () => {
    setViewMode(!viewMode);
    toast.info(viewMode ? 'Modo de edição ativado' : 'Modo de visualização ativado');
  };

  return (
    <div className="lg:p-8 p-[32px]">
      <div className="max-w-6xl mx-auto m-[0px]">
        <Button
          variant="ghost"
          onClick={() => onNavigate('peticoes')}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Petições
        </Button>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-white mb-2">
              {isNewDocument ? 'Nova Petição' : viewMode ? 'Visualizar Petição' : 'Editar Petição'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isNewDocument ? 'Crie uma nova petição com preenchimento automático' : 'Gerencie petições com preenchimento automático'}
            </p>
          </div>
          <div className="flex gap-2">
            {!isNewDocument && (
              <>
                <Button
                  variant="outline"
                  onClick={toggleViewMode}
                  className="gap-2"
                >
                  {viewMode ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {viewMode ? 'Editar' : 'Visualizar'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </>
            )}
            {(!viewMode || isNewDocument) && (
              <>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isNewDocument ? 'Salvar' : 'Salvar Alterações'}
                </Button>
                <Button onClick={handleSaveAsTemplate} variant="outline" className="gap-2">
                  <BookmarkPlus className="w-4 h-4" />
                  Salvar como Modelo
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={viewMode && !isNewDocument ? 'default' : 'outline'} className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('word')}>
                  Exportar Word
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informações da Petição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="petition-name">Nome da Petição *</Label>
                  <Input
                    id="petition-name"
                    value={petitionData.name}
                    onChange={(e) => setPetitionData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Petição Inicial - Caso ABC"
                    disabled={viewMode && !isNewDocument}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="petition-type">Tipo de Petição</Label>
                  <Select
                    value={petitionData.type}
                    onValueChange={(value) => setPetitionData(prev => ({ ...prev, type: value }))}
                    disabled={viewMode && !isNewDocument}
                  >
                    <SelectTrigger id="petition-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petição Inicial">Petição Inicial</SelectItem>
                      <SelectItem value="Contestação">Contestação</SelectItem>
                      <SelectItem value="Recurso">Recurso</SelectItem>
                      <SelectItem value="Memorial">Memorial</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="petition-status">Status</Label>
                  <Select
                    value={petitionData.status}
                    onValueChange={(value) => setPetitionData(prev => ({ ...prev, status: value }))}
                    disabled={viewMode && !isNewDocument}
                  >
                    <SelectTrigger id="petition-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados do Caso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="case-client">Cliente</Label>
                  <Input
                    id="case-client"
                    value={caseData.client}
                    onChange={(e) => setCaseData(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="Nome do cliente"
                    disabled={viewMode && !isNewDocument}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-contract">Nº Contrato</Label>
                  <Input
                    id="case-contract"
                    value={caseData.contract}
                    onChange={(e) => setCaseData(prev => ({ ...prev, contract: e.target.value }))}
                    placeholder="Número do contrato"
                    disabled={viewMode && !isNewDocument}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-institution">Instituição</Label>
                  <Input
                    id="case-institution"
                    value={caseData.institution}
                    onChange={(e) => setCaseData(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="Nome da instituição financeira"
                    disabled={viewMode && !isNewDocument}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-value">Valor (R$)</Label>
                  <Input
                    id="case-value"
                    value={caseData.value}
                    onChange={(e) => setCaseData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="0,00"
                    disabled={viewMode && !isNewDocument}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conteúdo da Petição</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[700px] font-mono text-sm"
                  placeholder="Digite ou cole o conteúdo da petição..."
                  disabled={viewMode && !isNewDocument}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Petição</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza de que deseja excluir esta petição? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}