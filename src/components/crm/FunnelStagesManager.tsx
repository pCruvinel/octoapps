'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    ArrowLeft,
    Plus,
    GripVertical,
    Pencil,
    Trash2,
    Loader2,
    Check,
    Layers,
} from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { useAuth } from '../../hooks/useAuth';
import type { EtapaFunil, TipoEtapaFunil } from '../../types/funnel';
import { LISTA_CORES_ETAPA, TIPOS_ETAPA } from '../../types/funnel';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FunnelStagesManagerProps {
    onBack: () => void;
}

interface SortableStageItemProps {
    etapa: EtapaFunil;
    onEdit: (etapa: EtapaFunil) => void;
    onDelete: (etapa: EtapaFunil) => void;
}

function SortableStageItem({ etapa, onEdit, onDelete }: SortableStageItemProps) {
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

    const getTipoBadge = (tipo: TipoEtapaFunil) => {
        switch (tipo) {
            case 'fechada-ganha':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Ganho</Badge>;
            case 'fechada-perdida':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Perdido</Badge>;
            default:
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Aberta</Badge>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow group"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
            >
                <GripVertical className="w-5 h-5" />
            </button>

            <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: etapa.cor }}
            />

            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{etapa.nome}</p>
                <p className="text-xs text-slate-500">Ordem: {etapa.ordem}</p>
            </div>

            {getTipoBadge(etapa.tipo)}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(etapa)}
                    className="h-8 w-8 p-0"
                >
                    <Pencil className="w-4 h-4 text-slate-500" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(etapa)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export function FunnelStagesManager({ onBack }: FunnelStagesManagerProps) {
    const { user } = useAuth();
    const {
        etapas,
        loading,
        createEtapa,
        updateEtapa,
        deleteEtapa,
        reordenarEtapas,
        reordenarEtapasLocal,
    } = useEtapasFunil();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedEtapa, setSelectedEtapa] = useState<EtapaFunil | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        cor: LISTA_CORES_ETAPA[0].valor,
        tipo: 'aberta' as TipoEtapaFunil,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = etapas.findIndex((e) => e.id === active.id);
            const newIndex = etapas.findIndex((e) => e.id === over.id);

            // Local update (optimistic)
            const newEtapas = arrayMove(etapas, oldIndex, newIndex);
            const newOrder = newIndex + 1;

            reordenarEtapasLocal(active.id as string, newOrder);

            // Persist to database
            const { error } = await reordenarEtapas(active.id as string, newOrder);

            if (error) {
                toast.error('Erro ao reordenar etapas');
            } else {
                toast.success('Etapas reordenadas');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            cor: LISTA_CORES_ETAPA[0].valor,
            tipo: 'aberta',
        });
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsCreateDialogOpen(true);
    };

    const handleOpenEdit = (etapa: EtapaFunil) => {
        setSelectedEtapa(etapa);
        setFormData({
            nome: etapa.nome,
            cor: etapa.cor,
            tipo: etapa.tipo,
        });
        setIsEditDialogOpen(true);
    };

    const handleOpenDelete = (etapa: EtapaFunil) => {
        setSelectedEtapa(etapa);
        setIsDeleteDialogOpen(true);
    };

    const handleCreate = async () => {
        if (!formData.nome.trim()) {
            toast.error('Informe o nome da etapa');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await createEtapa({
                nome: formData.nome.trim(),
                cor: formData.cor,
                tipo: formData.tipo,
                ordem: etapas.length + 1,
                criado_por: user?.id,
            });

            if (error) throw new Error(error);

            toast.success('Etapa criada com sucesso!');
            setIsCreateDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar etapa');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedEtapa || !formData.nome.trim()) {
            toast.error('Informe o nome da etapa');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await updateEtapa(selectedEtapa.id, {
                nome: formData.nome.trim(),
                cor: formData.cor,
                tipo: formData.tipo,
            });

            if (error) throw new Error(error);

            toast.success('Etapa atualizada com sucesso!');
            setIsEditDialogOpen(false);
            setSelectedEtapa(null);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar etapa');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedEtapa) return;

        setActionLoading(true);
        try {
            const { error } = await deleteEtapa(selectedEtapa.id);

            if (error) throw new Error(error);

            toast.success('Etapa excluída com sucesso!');
            setIsDeleteDialogOpen(false);
            setSelectedEtapa(null);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir etapa');
        } finally {
            setActionLoading(false);
        }
    };

    const StageFormContent = () => (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="nome">Nome da Etapa *</Label>
                <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    placeholder="Ex: Qualificação"
                    className="w-full"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Etapa *</Label>
                <Select
                    value={formData.tipo}
                    onValueChange={(value: TipoEtapaFunil) =>
                        setFormData((prev) => ({ ...prev, tipo: value }))
                    }
                >
                    <SelectTrigger id="tipo" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {TIPOS_ETAPA.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                    {LISTA_CORES_ETAPA.map((cor) => (
                        <button
                            key={cor.valor}
                            type="button"
                            onClick={() =>
                                setFormData((prev) => ({ ...prev, cor: cor.valor }))
                            }
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${formData.cor === cor.valor
                                    ? 'border-slate-900 scale-110'
                                    : 'border-transparent hover:scale-105'
                                }`}
                            style={{ backgroundColor: cor.valor }}
                            title={cor.nome}
                        >
                            {formData.cor === cor.valor && (
                                <Check className="w-4 h-4 text-white drop-shadow-md" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-3xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="gap-2 mb-4 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o Kanban
                    </Button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Layers className="w-7 h-7 text-slate-600" />
                                Etapas do Funil
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Configure as etapas do seu pipeline de vendas
                            </p>
                        </div>
                        <Button onClick={handleOpenCreate} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nova Etapa
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <p className="text-sm text-slate-600">
                            Arraste as etapas para reordenar. Etapas do tipo "Fechada" aparecem
                            no final do funil.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : etapas.length === 0 ? (
                        <div className="text-center py-12">
                            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 mb-4">
                                Nenhuma etapa cadastrada ainda
                            </p>
                            <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Criar primeira etapa
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 space-y-2">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={etapas.map((e) => e.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {etapas.map((etapa) => (
                                        <SortableStageItem
                                            key={etapa.id}
                                            etapa={etapa}
                                            onEdit={handleOpenEdit}
                                            onDelete={handleOpenDelete}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {etapas.length > 0 && (
                    <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
                        <span>
                            <strong className="text-slate-700">{etapas.length}</strong> etapas
                        </span>
                        <span>
                            <strong className="text-slate-700">
                                {etapas.filter((e) => e.tipo === 'aberta').length}
                            </strong>{' '}
                            abertas
                        </span>
                        <span>
                            <strong className="text-slate-700">
                                {etapas.filter((e) => e.tipo === 'fechada-ganha').length}
                            </strong>{' '}
                            ganhas
                        </span>
                        <span>
                            <strong className="text-slate-700">
                                {etapas.filter((e) => e.tipo === 'fechada-perdida').length}
                            </strong>{' '}
                            perdidas
                        </span>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nova Etapa</DialogTitle>
                        <DialogDescription>
                            Adicione uma nova etapa ao seu funil de vendas
                        </DialogDescription>
                    </DialogHeader>
                    <StageFormContent />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} disabled={actionLoading}>
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Criar Etapa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Etapa</DialogTitle>
                        <DialogDescription>
                            Atualize as informações da etapa
                        </DialogDescription>
                    </DialogHeader>
                    <StageFormContent />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdate} disabled={actionLoading}>
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Etapa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a etapa{' '}
                            <strong>"{selectedEtapa?.nome}"</strong>?
                            <br />
                            <br />
                            <span className="text-amber-600">
                                ⚠️ Se houver oportunidades vinculadas a esta etapa, a exclusão
                                será bloqueada.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
