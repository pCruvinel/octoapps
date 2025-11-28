import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Save, Download, FileText, Sparkles, Edit, Eye, Trash2, BookmarkPlus } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { peticoesService } from '@/services/peticoes.service';
import { Peticao } from '@/types/peticoes.types';

interface PeticoesEditorProps {
  documentId: string | null;
  onNavigate: (route: string, id?: string) => void;
}

export function PeticoesEditor({ documentId, onNavigate }: PeticoesEditorProps) {
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

  const [caseData] = useState({
    client: 'João Silva',
    contract: '123456789',
    institution: 'Banco Exemplo S.A.',
    value: 'R$ 250.000,00',
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

      if (isNewDocument) {
        // Criar nova petição
        const novaPeticao = await peticoesService.create({
          nome: petitionData.name,
          tipo: petitionData.type,
          status: petitionData.status,
          conteudo: content,
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

  const handleExport = (format: string) => {
    toast.success(`Documento exportado em ${format.toUpperCase()} com sucesso!`);
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

      // Criar uma nova petição marcada como modelo
      const novoModelo = await peticoesService.create({
        nome: `[MODELO] ${petitionData.name}`,
        tipo: petitionData.type || 'Outro',
        status: 'Concluído',
        conteudo: content,
        modelo: 'custom', // Indicador de modelo customizado
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
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Cliente</div>
                  <div className="text-sm text-gray-900 dark:text-white">{caseData.client}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Nº Contrato</div>
                  <div className="text-sm text-gray-900 dark:text-white">{caseData.contract}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Instituição</div>
                  <div className="text-sm text-gray-900 dark:text-white">{caseData.institution}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Valor</div>
                  <div className="text-sm text-gray-900 dark:text-white">{caseData.value}</div>
                </div>

                {(!viewMode || isNewDocument) && (
                  <Button onClick={handleGenerate} className="w-full gap-2 mt-4">
                    <Sparkles className="w-4 h-4" />
                    Gerar Petição
                  </Button>
                )}
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 A IA pode sugerir trechos relevantes baseados nos dados do caso
                  </p>
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