import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, MoreVertical, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { peticoesService } from '@/services/peticoes.service';
import { PeticaoListItem } from '@/types/peticoes.types';
import { TEMPLATE_PETICAO_INICIAL, TEMPLATE_CONTESTACAO, TEMPLATE_RECURSO, TEMPLATE_MEMORIAL } from '@/constants/templates-peticoes';
import { exportService, PeticaoExportData } from '@/services/export.service';

interface PeticoesListProps {
  onNavigate: (route: string, id?: string) => void;
}

interface ModeloCustomizado {
  id: string;
  nome: string;
  tipo: string;
  conteudo: string;
}

export function PeticoesList({ onNavigate }: PeticoesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteModeloDialogOpen, setDeleteModeloDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedModeloId, setSelectedModeloId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true);

  const [documents, setDocuments] = useState<PeticaoListItem[]>([]);
  const [modelosCustomizados, setModelosCustomizados] = useState<ModeloCustomizado[]>([]);

  // Carregar petições ao montar o componente
  useEffect(() => {
    loadPeticoes();
    loadModelosCustomizados();
  }, []);

  const loadPeticoes = async () => {
    try {
      setLoading(true);
      const data = await peticoesService.getAll();
      setDocuments(data);
    } catch (err) {
      console.error('Erro ao carregar petições:', err);
      toast.error('Erro ao carregar petições');
    } finally {
      setLoading(false);
    }
  };

  const loadModelosCustomizados = async () => {
    try {
      const modelos = await peticoesService.getModelosCustomizados();
      setModelosCustomizados(modelos);
    } catch (err) {
      console.error('Erro ao carregar modelos customizados:', err);
      // Não mostrar erro ao usuário, apenas não exibir modelos customizados
    }
  };

  const getTemplateContent = (template: string): string => {
    // Verificar se é um modelo padrão
    switch (template) {
      case 'inicial':
        return TEMPLATE_PETICAO_INICIAL;
      case 'contestacao':
        return TEMPLATE_CONTESTACAO;
      case 'recurso':
        return TEMPLATE_RECURSO;
      case 'memorial':
        return TEMPLATE_MEMORIAL;
      case 'blank':
        return '';
      default:
        // Se não for modelo padrão, buscar nos modelos customizados
        const modeloCustomizado = modelosCustomizados.find(m => m.id === template);
        return modeloCustomizado?.conteudo || '';
    }
  };

  const getTemplateTipo = (template: string): string => {
    switch (template) {
      case 'inicial': return 'Petição Inicial';
      case 'contestacao': return 'Contestação';
      case 'recurso': return 'Recurso';
      case 'memorial': return 'Memorial';
      case 'blank': return 'Outro';
      default:
        // Se não for modelo padrão, buscar tipo do modelo customizado
        const modeloCustomizado = modelosCustomizados.find(m => m.id === template);
        return modeloCustomizado?.tipo || 'Outro';
    }
  };

  const handleCreateDocument = async () => {
    if (!selectedTemplate) {
      toast.error('Selecione um modelo de petição');
      return;
    }

    try {
      const templateContent = getTemplateContent(selectedTemplate);
      const novaPeticao = await peticoesService.create({
        nome: `Nova Petição - ${new Date().toLocaleDateString('pt-BR')}`,
        tipo: getTemplateTipo(selectedTemplate),
        status: 'Rascunho',
        conteudo: templateContent,
        modelo: selectedTemplate,
      });

      toast.success('Petição criada com sucesso!');
      setIsDialogOpen(false);
      setSelectedTemplate('');
      onNavigate('peticoes-editor', novaPeticao.id);
    } catch (error) {
      console.error('Erro ao criar petição:', error);
      toast.error('Erro ao criar petição');
    }
  };

  const handleExport = async (format: 'pdf' | 'word', peticaoId: string) => {
    try {
      const peticao = await peticoesService.getById(peticaoId);

      if (!peticao) {
        toast.error('Petição não encontrada');
        return;
      }

      if (!peticao.conteudo.trim()) {
        toast.error('Não há conteúdo para exportar.');
        return;
      }

      const exportData: PeticaoExportData = {
        nome: peticao.nome,
        tipo: peticao.tipo,
        status: peticao.status,
        conteudo: peticao.conteudo,
        clienteNome: peticao.clienteNome,
        numeroContrato: peticao.numeroContrato,
        instituicaoFinanceira: peticao.instituicaoFinanceira,
        valorContrato: peticao.valorContrato ? `R$ ${peticao.valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined,
      };

      if (format === 'pdf') {
        await exportService.exportToPdf(exportData);
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

  const openDeleteDialog = (id: string) => {
    setSelectedDocId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocId) return;

    try {
      await peticoesService.softDelete(selectedDocId);
      toast.success('Petição excluída com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedDocId(null);
      await loadPeticoes(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir petição:', error);
      toast.error('Erro ao excluir petição');
    }
  };

  const openDeleteModeloDialog = (modeloId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que o select seja fechado
    setSelectedModeloId(modeloId);
    setDeleteModeloDialogOpen(true);
  };

  const handleDeleteModelo = async () => {
    if (!selectedModeloId) return;

    try {
      await peticoesService.softDelete(selectedModeloId);
      toast.success('Modelo excluído com sucesso!');
      setDeleteModeloDialogOpen(false);
      setSelectedModeloId(null);
      await loadModelosCustomizados(); // Recarregar lista de modelos
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
      toast.error('Erro ao excluir modelo');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Geração de Petições</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie documentos e relatórios jurídicos
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">


          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Petição
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Nova Petição</DialogTitle>
                <DialogDescription>
                  Selecione um modelo de petição para começar
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="template">Modelo de Petição</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template" className="mt-2">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inicial">Petição Inicial - Revisional</SelectItem>
                    <SelectItem value="contestacao">Contestação</SelectItem>
                    <SelectItem value="recurso">Recurso</SelectItem>
                    <SelectItem value="memorial">Memorial</SelectItem>
                    <SelectItem value="blank">Em Branco</SelectItem>
                    {modelosCustomizados.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Meus Modelos
                        </div>
                        {modelosCustomizados.map((modelo) => (
                          <SelectItem key={modelo.id} value={modelo.id}>
                            {modelo.nome}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>

                {modelosCustomizados.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Gerenciar Meus Modelos
                    </p>
                    <div className="space-y-1">
                      {modelosCustomizados.map((modelo) => (
                        <div
                          key={modelo.id}
                          className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                        >
                          <span className="text-gray-700 dark:text-gray-300">{modelo.nome}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModeloDialog(modelo.id, e);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                            title="Excluir modelo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateDocument}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Última Edição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.id}</TableCell>
                  <TableCell className="text-gray-900 dark:text-white">{doc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell>{doc.lastEdit}</TableCell>
                  <TableCell>
                    <Badge variant={doc.status === 'Concluído' ? 'default' : 'secondary'}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onNavigate('peticoes-editor', doc.id)}>
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onNavigate('peticoes-editor', doc.id)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport('pdf', doc.id)}>
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('word', doc.id)}>
                          Exportar Word
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400"
                          onClick={() => openDeleteDialog(doc.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Carregando petições...
          </p>
        </div>
      )}

      {!loading && filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum documento encontrado
          </p>
        </div>
      )}

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
              onClick={handleDeleteDocument}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteModeloDialogOpen} onOpenChange={setDeleteModeloDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir este modelo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteModelo}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}