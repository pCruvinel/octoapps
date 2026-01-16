'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  Calendar,
  Tag,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';

import { useEventCategories, CATEGORY_COLORS, type EventCategoryInsert } from '../../hooks/useEventCategories';
import type { EventCategory } from '../../types/task';

// =====================================================
// SORTABLE ITEM
// =====================================================

interface SortableCategoryItemProps {
  category: EventCategory;
  onEdit: (category: EventCategory) => void;
  onDelete: (category: EventCategory) => void;
}

function SortableCategoryItem({ category, onEdit, onDelete }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border ${
        isDragging ? 'shadow-lg border-blue-300 z-50' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </button>

      {/* Color Indicator */}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: category.color }}
      />

      {/* Name & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-white truncate">
            {category.name}
          </span>
          {category.is_system && (
            <Badge variant="secondary" className="text-xs">Sistema</Badge>
          )}
          {category.is_all_day && (
            <Badge variant="outline" className="text-xs">Dia inteiro</Badge>
          )}
        </div>
        {category.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {category.description}
          </p>
        )}
      </div>

      {/* Duration */}
      <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
        {category.default_duration_minutes} min
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(category)}
          className="h-8 w-8"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(category)}
          disabled={category.is_system}
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function EventCategorySettings() {
  const {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useEventCategories();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<EventCategoryInsert>({
    name: '',
    description: '',
    color: CATEGORY_COLORS[0].value,
    is_all_day: false,
    default_duration_minutes: 60,
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: CATEGORY_COLORS[0].value,
      is_all_day: false,
      default_duration_minutes: 60,
    });
  };

  // Handlers
  const handleOpenCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (category: EventCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
      is_all_day: category.is_all_day,
      default_duration_minutes: category.default_duration_minutes,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (category: EventCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name?.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await createCategory(formData);
      if (error) throw new Error(error);

      toast.success('Categoria criada com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar categoria');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory || !formData.name?.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await updateCategory(selectedCategory.id, formData);
      if (error) throw new Error(error);

      toast.success('Categoria atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar categoria');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setActionLoading(true);
    try {
      const { error } = await deleteCategory(selectedCategory.id);
      if (error) throw new Error(error);

      toast.success('Categoria excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir categoria');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex).map((c) => c.id);
      
      const { error } = await reorderCategories(newOrder);
      if (error) {
        toast.error('Erro ao reordenar categorias');
      }
    }
  };

  // Form Content
  const FormContent = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Nome *</Label>
        <Input
          id="category-name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Reunião com Cliente"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-description">Descrição</Label>
        <Input
          id="category-description"
          value={formData.description || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição opcional"
        />
      </div>

      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((cor) => (
            <button
              key={cor.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, color: cor.value }))}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                formData.color === cor.value
                  ? 'border-slate-900 scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: cor.value }}
            >
              {formData.color === cor.value && (
                <Check className="w-4 h-4 text-white drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duração padrão (min)</Label>
          <Input
            id="duration"
            type="number"
            min={15}
            max={480}
            step={15}
            value={formData.default_duration_minutes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                default_duration_minutes: parseInt(e.target.value) || 60,
              }))
            }
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="all-day"
            checked={formData.is_all_day}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, is_all_day: checked }))
            }
          />
          <Label htmlFor="all-day">Dia inteiro por padrão</Label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 lg:p-8">
      <div className="flex-1">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Tag className="w-7 h-7 text-slate-600" />
              Categorias de Eventos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure os tipos de eventos do calendário com cores e durações padrão
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias Disponíveis</CardTitle>
            <CardDescription>
              Arraste para reordenar. Você tem controle total sobre suas categorias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">Nenhuma categoria cadastrada ainda</p>
                <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar primeira categoria
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria de evento para o calendário
            </DialogDescription>
          </DialogHeader>
          <FormContent />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações da categoria
            </DialogDescription>
          </DialogHeader>
          <FormContent />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria{' '}
              <strong>"{selectedCategory?.name}"</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. Eventos existentes com esta
              categoria serão mantidos, mas a categoria não estará mais disponível
              para novos eventos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
