import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Save, Loader2, Edit, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import type { EtapaFunil } from '../../types/funnel';
import {
  validarEtapaFunil,
  LISTA_CORES_ETAPA,
  TIPOS_ETAPA,
  type TipoEtapaFunil,
} from '../../types/funnel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// =====================================================
// Componente de Item Arrastável (Sortable)
// =====================================================
interface SortableStageItemProps {
  etapa: EtapaFunil;
  onDelete: (id: string) => void;
  onEdit: (etapa: EtapaFunil) => void;
}

function SortableStageItem({ etapa, onDelete, onEdit }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: etapa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Cor Indicadora */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: etapa.cor }}
      />

      {/* Nome da Etapa */}
      <div className="flex-1">
        <span className="text-foreground font-medium">{etapa.nome}</span>
      </div>

      {/* Botões de Ação */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(etapa)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(etapa.id)}
        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// =====================================================
// Componente Principal
// =====================================================
export function FunnelSettings() {
  const {
    etapas,
    loading,
    error,
    getEtapas,
    createEtapa,
    updateEtapa,
    deleteEtapa,
    reordenarEtapas,
  } = useEtapasFunil();

  // Estados para o formulário
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [etapaEditando, setEtapaEditando] = useState<EtapaFunil | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#3b82f6',
    tipo: 'aberta' as TipoEtapaFunil,
  });
  const [saving, setSaving] = useState(false);

  // Estados para o modal de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [etapaParaDeletar, setEtapaParaDeletar] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estados para configuração de campos dos cards (mantido do código original)
  const [cardFields, setCardFields] = useState({
    primary: ['name', 'contact', 'value'],
    secondary: ['actionType', 'date', 'responsible'],
  });

  const availableFields = [
    { id: 'name', label: 'Nome da Oportunidade' },
    { id: 'contact', label: 'Contato' },
    { id: 'value', label: 'Valor da Proposta' },
    { id: 'actionType', label: 'Tipo de Ação' },
    { id: 'date', label: 'Data de Criação' },
    { id: 'responsible', label: 'Responsável' },
    { id: 'origin', label: 'Origem' },
    { id: 'description', label: 'Descrição' },
  ];

  // Configuração de sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Carregar etapas ao montar
  useEffect(() => {
    getEtapas();
  }, [getEtapas]);

  // Handler de drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = etapas.findIndex((e) => e.id === active.id);
    const newIndex = etapas.findIndex((e) => e.id === over.id);

    // Reordenar localmente para feedback imediato
    const reordenado = arrayMove(etapas, oldIndex, newIndex);

    // Salvar no banco
    const novaOrdem = newIndex + 1;
    const { error } = await reordenarEtapas(active.id as string, novaOrdem);

    if (error) {
      toast.error('Erro ao reordenar etapas');
      // Recarregar para reverter
      getEtapas();
    } else {
      toast.success('Etapa reordenada com sucesso!');
    }
  };

  // Abrir dialog para criar nova etapa
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setEtapaEditando(null);
    setFormData({
      nome: '',
      cor: '#3b82f6',
      tipo: 'aberta',
    });
    setIsDialogOpen(true);
  };

  // Abrir dialog para editar etapa
  const handleOpenEditDialog = (etapa: EtapaFunil) => {
    setIsEditMode(true);
    setEtapaEditando(etapa);
    setFormData({
      nome: etapa.nome,
      cor: etapa.cor,
      tipo: etapa.tipo,
    });
    setIsDialogOpen(true);
  };

  // Handler para criar/editar etapa
  const handleSubmitEtapa = async () => {
    // Validar
    const erros = validarEtapaFunil(formData);
    if (erros.length > 0) {
      toast.error(erros[0]);
      return;
    }

    setSaving(true);

    if (isEditMode && etapaEditando) {
      // Atualizar etapa existente
      const { error } = await updateEtapa(etapaEditando.id, {
        nome: formData.nome,
        cor: formData.cor,
        tipo: formData.tipo,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Etapa atualizada com sucesso!');
        setIsDialogOpen(false);
      }
    } else {
      // Criar nova etapa
      const { error } = await createEtapa({
        nome: formData.nome,
        cor: formData.cor,
        tipo: formData.tipo,
        ordem: etapas.length + 1, // Será sobrescrito pelo hook
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Etapa criada com sucesso!');
        setIsDialogOpen(false);
      }
    }

    setSaving(false);
  };

  // Abrir modal de confirmação de exclusão
  const handleOpenDeleteDialog = (id: string) => {
    setEtapaParaDeletar(id);
    setDeleteDialogOpen(true);
  };

  // Handler para deletar etapa
  const handleConfirmDelete = async () => {
    if (!etapaParaDeletar) return;

    setDeleting(true);

    const { error } = await deleteEtapa(etapaParaDeletar);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Etapa excluída com sucesso!');
      setDeleteDialogOpen(false);
      setEtapaParaDeletar(null);
    }

    setDeleting(false);
  };


  // Toggle field para configuração de cards
  const toggleField = (fieldId: string, section: 'primary' | 'secondary') => {
    setCardFields((prev) => {
      const currentFields = prev[section];
      const newFields = currentFields.includes(fieldId)
        ? currentFields.filter((id) => id !== fieldId)
        : [...currentFields, fieldId];

      return { ...prev, [section]: newFields };
    });
  };

  // Salvar configurações de cards (mock - implementar depois)
  const handleSaveCardConfig = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Configurações de campos salvas!');
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-8">
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Funil e Cards do Pipeline
          </h1>
          <p className="text-muted-foreground">
            Personalize as etapas do funil e a exibição dos cards
          </p>
        </div>

        <div className="space-y-6">
          {/* Etapas do Funil */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Etapas do Funil</CardTitle>
                  <CardDescription>
                    Adicione, reordene ou exclua etapas do funil de vendas
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleOpenCreateDialog}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Etapa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Carregando etapas...
                  </span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {!loading && !error && etapas.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhuma etapa cadastrada. Clique em "Adicionar Etapa" para começar.
                </div>
              )}

              {!loading && !error && etapas.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={etapas.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {etapas.map((etapa) => (
                        <SortableStageItem
                          key={etapa.id}
                          etapa={etapa}
                          onDelete={handleOpenDeleteDialog}
                          onEdit={handleOpenEditDialog}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Configuração de Campos dos Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Campos dos Cards</CardTitle>
              <CardDescription>
                Selecione os campos que serão exibidos nos cards do Kanban
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Campos Primários
                </h3>
                <div className="space-y-2">
                  {availableFields.slice(0, 4).map((field) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`primary-${field.id}`}
                        checked={cardFields.primary.includes(field.id)}
                        onCheckedChange={() => toggleField(field.id, 'primary')}
                      />
                      <Label htmlFor={`primary-${field.id}`} className="cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Campos Secundários
                </h3>
                <div className="space-y-2">
                  {availableFields.slice(4).map((field) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`secondary-${field.id}`}
                        checked={cardFields.secondary.includes(field.id)}
                        onCheckedChange={() => toggleField(field.id, 'secondary')}
                      />
                      <Label htmlFor={`secondary-${field.id}`} className="cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview do Card */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Preview do Card
                </h3>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-w-sm">
                  <div className="space-y-2 text-sm">
                    {cardFields.primary.map((fieldId) => {
                      const field = availableFields.find((f) => f.id === fieldId);
                      return (
                        <div key={fieldId} className="text-gray-600 dark:text-gray-400">
                          <strong className="text-gray-900 dark:text-white">
                            {field?.label}:
                          </strong>{' '}
                          Exemplo
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                      {cardFields.secondary.map((fieldId) => {
                        const field = availableFields.find((f) => f.id === fieldId);
                        return (
                          <div
                            key={fieldId}
                            className="text-xs text-gray-500 dark:text-gray-500"
                          >
                            {field?.label}: Exemplo
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCardConfig} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Configurações de Campos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para Criar/Editar Etapa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Etapa' : 'Nova Etapa'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Atualize as informações da etapa do funil'
                : 'Digite as informações da nova etapa do funil'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome da Etapa *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Análise Técnica"
                className="mt-2"
              />
            </div>

            {/* Cor */}
            <div>
              <Label htmlFor="cor-input">Cor da Etapa</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="color"
                  id="cor-picker"
                  value={formData.cor}
                  onChange={(e) =>
                    setFormData({ ...formData, cor: e.target.value })
                  }
                  className="w-8 h-8 rounded cursor-pointer"
                  style={{ border: 'none', padding: 0, outline: 'none' }}
                />
                <Input
                  id="cor-input"
                  value={formData.cor}
                  onChange={(e) =>
                    setFormData({ ...formData, cor: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitEtapa} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEditMode ? (
                'Atualizar'
              ) : (
                'Criar Etapa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Etapa Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta etapa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
