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
    ChevronDown,
    Settings2,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { useFunis, type Funil, type FunilInsert } from '../../hooks/useFunis';
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

const CORES_FUNIL = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#14b8a6', // Teal
];

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
    
    // Gerenciamento de funis
    const {
        funis,
        funilAtivo,
        setFunilAtivo,
        createFunil,
        updateFunil,
        deleteFunil,
        loading: loadingFunis,
        ensureDefaultFunil,
    } = useFunis();

    // Gerenciamento de etapas - filtrado pelo funil ativo
    const {
        etapas,
        loading: loadingEtapas,
        createEtapa,
        updateEtapa,
        deleteEtapa,
        reordenarEtapas,
        reordenarEtapasLocal,
    } = useEtapasFunil({ funilId: funilAtivo });

    // Estados de dialogs
    const [isCreateStageDialogOpen, setIsCreateStageDialogOpen] = useState(false);
    const [isEditStageDialogOpen, setIsEditStageDialogOpen] = useState(false);
    const [isDeleteStageDialogOpen, setIsDeleteStageDialogOpen] = useState(false);
    const [selectedEtapa, setSelectedEtapa] = useState<EtapaFunil | null>(null);

    // Dialogs de funil
    const [isCreateFunilDialogOpen, setIsCreateFunilDialogOpen] = useState(false);
    const [isEditFunilDialogOpen, setIsEditFunilDialogOpen] = useState(false);
    const [isDeleteFunilDialogOpen, setIsDeleteFunilDialogOpen] = useState(false);
    
    const [actionLoading, setActionLoading] = useState(false);

    // Form state para etapa
    const [stageFormData, setStageFormData] = useState({
        nome: '',
        cor: LISTA_CORES_ETAPA[0].valor,
        tipo: 'aberta' as TipoEtapaFunil,
    });

    // Form state para funil
    const [funilFormData, setFunilFormData] = useState<FunilInsert>({
        nome: '',
        descricao: '',
        cor: CORES_FUNIL[0],
    });

    // Funil ativo selecionado
    const selectedFunil = funis.find(f => f.id === funilAtivo);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    // Garantir funil padrão ao montar
    useEffect(() => {
        ensureDefaultFunil();
    }, [ensureDefaultFunil]);

    // O hook useEtapasFunil já recarrega automaticamente quando funilId muda

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = etapas.findIndex((e) => e.id === active.id);
            const newIndex = etapas.findIndex((e) => e.id === over.id);
            const newOrder = newIndex + 1;

            reordenarEtapasLocal(active.id as string, newOrder);

            const { error } = await reordenarEtapas(active.id as string, newOrder);

            if (error) {
                toast.error('Erro ao reordenar etapas');
            } else {
                toast.success('Etapas reordenadas');
            }
        }
    };

    // ================== HANDLERS DE ETAPA ==================

    const resetStageForm = () => {
        setStageFormData({
            nome: '',
            cor: LISTA_CORES_ETAPA[0].valor,
            tipo: 'aberta',
        });
    };

    const handleOpenCreateStage = () => {
        resetStageForm();
        setIsCreateStageDialogOpen(true);
    };

    const handleOpenEditStage = (etapa: EtapaFunil) => {
        setSelectedEtapa(etapa);
        setStageFormData({
            nome: etapa.nome,
            cor: etapa.cor,
            tipo: etapa.tipo,
        });
        setIsEditStageDialogOpen(true);
    };

    const handleOpenDeleteStage = (etapa: EtapaFunil) => {
        setSelectedEtapa(etapa);
        setIsDeleteStageDialogOpen(true);
    };

    const handleCreateStage = async () => {
        if (!stageFormData.nome.trim()) {
            toast.error('Informe o nome da etapa');
            return;
        }

        if (!funilAtivo) {
            toast.error('Selecione um funil primeiro');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await createEtapa({
                nome: stageFormData.nome.trim(),
                cor: stageFormData.cor,
                tipo: stageFormData.tipo,
                ordem: etapas.length + 1,
                criado_por: user?.id,
                funil_id: funilAtivo,
            });

            if (error) throw new Error(error);

            toast.success('Etapa criada com sucesso!');
            setIsCreateStageDialogOpen(false);
            resetStageForm();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar etapa');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStage = async () => {
        if (!selectedEtapa || !stageFormData.nome.trim()) {
            toast.error('Informe o nome da etapa');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await updateEtapa(selectedEtapa.id, {
                nome: stageFormData.nome.trim(),
                cor: stageFormData.cor,
                tipo: stageFormData.tipo,
            });

            if (error) throw new Error(error);

            toast.success('Etapa atualizada com sucesso!');
            setIsEditStageDialogOpen(false);
            setSelectedEtapa(null);
            resetStageForm();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar etapa');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteStage = async () => {
        if (!selectedEtapa) return;

        setActionLoading(true);
        try {
            const { error } = await deleteEtapa(selectedEtapa.id);

            if (error) throw new Error(error);

            toast.success('Etapa excluída com sucesso!');
            setIsDeleteStageDialogOpen(false);
            setSelectedEtapa(null);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir etapa');
        } finally {
            setActionLoading(false);
        }
    };

    // ================== HANDLERS DE FUNIL ==================

    const resetFunilForm = () => {
        setFunilFormData({
            nome: '',
            descricao: '',
            cor: CORES_FUNIL[0],
        });
    };

    const handleOpenCreateFunil = () => {
        resetFunilForm();
        setIsCreateFunilDialogOpen(true);
    };

    const handleOpenEditFunil = () => {
        if (!selectedFunil) return;
        setFunilFormData({
            nome: selectedFunil.nome,
            descricao: selectedFunil.descricao || '',
            cor: selectedFunil.cor,
        });
        setIsEditFunilDialogOpen(true);
    };

    const handleOpenDeleteFunil = () => {
        if (funis.length <= 1) {
            toast.error('Não é possível excluir o único funil');
            return;
        }
        setIsDeleteFunilDialogOpen(true);
    };

    const handleCreateFunil = async () => {
        if (!funilFormData.nome.trim()) {
            toast.error('Informe o nome do funil');
            return;
        }

        setActionLoading(true);
        try {
            const { data, error } = await createFunil(funilFormData);
            if (error) throw new Error(error);

            // Selecionar o novo funil
            if (data) {
                setFunilAtivo(data.id);
            }

            toast.success('Funil criado com sucesso!');
            setIsCreateFunilDialogOpen(false);
            resetFunilForm();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar funil');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateFunil = async () => {
        if (!selectedFunil || !funilFormData.nome.trim()) {
            toast.error('Informe o nome do funil');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await updateFunil(selectedFunil.id, funilFormData);
            if (error) throw new Error(error);

            toast.success('Funil atualizado com sucesso!');
            setIsEditFunilDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar funil');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteFunil = async () => {
        if (!selectedFunil) return;

        setActionLoading(true);
        try {
            const { error } = await deleteFunil(selectedFunil.id);
            if (error) throw new Error(error);

            toast.success('Funil excluído com sucesso!');
            setIsDeleteFunilDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir funil');
        } finally {
            setActionLoading(false);
        }
    };

    // ================== COMPONENTES DE FORMULÁRIO ==================

    // JSX do formulário de etapa (variável em vez de função para evitar re-render)
    const stageFormJSX = (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="stage-nome">Nome da Etapa *</Label>
                <Input
                    id="stage-nome"
                    value={stageFormData.nome}
                    onChange={(e) =>
                        setStageFormData((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    placeholder="Ex: Qualificação"
                    className="w-full"
                    autoComplete="off"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="stage-tipo">Tipo de Etapa *</Label>
                <Select
                    value={stageFormData.tipo}
                    onValueChange={(value: TipoEtapaFunil) =>
                        setStageFormData((prev) => ({ ...prev, tipo: value }))
                    }
                >
                    <SelectTrigger id="stage-tipo" className="w-full">
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
                                setStageFormData((prev) => ({ ...prev, cor: cor.valor }))
                            }
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${stageFormData.cor === cor.valor
                                    ? 'border-slate-900 scale-110'
                                    : 'border-transparent hover:scale-105'
                                }`}
                            style={{ backgroundColor: cor.valor }}
                            title={cor.nome}
                        >
                            {stageFormData.cor === cor.valor && (
                                <Check className="w-4 h-4 text-white drop-shadow-md" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // JSX do formulário de funil (variável em vez de função para evitar re-render)
    const funilFormJSX = (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="funil-nome">Nome do Funil *</Label>
                <Input
                    id="funil-nome"
                    value={funilFormData.nome}
                    onChange={(e) =>
                        setFunilFormData((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    placeholder="Ex: Pipeline de Vendas"
                    className="w-full"
                    autoComplete="off"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="funil-descricao">Descrição</Label>
                <Input
                    id="funil-descricao"
                    value={funilFormData.descricao || ''}
                    onChange={(e) =>
                        setFunilFormData((prev) => ({ ...prev, descricao: e.target.value }))
                    }
                    placeholder="Descrição opcional"
                    className="w-full"
                    autoComplete="off"
                />
            </div>

            <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                    {CORES_FUNIL.map((cor) => (
                        <button
                            key={cor}
                            type="button"
                            onClick={() =>
                                setFunilFormData((prev) => ({ ...prev, cor }))
                            }
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${funilFormData.cor === cor
                                    ? 'border-slate-900 scale-110'
                                    : 'border-transparent hover:scale-105'
                                }`}
                            style={{ backgroundColor: cor }}
                        >
                            {funilFormData.cor === cor && (
                                <Check className="w-4 h-4 text-white drop-shadow-md" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const loading = loadingFunis || loadingEtapas;

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
                                Gerenciar Funis e Etapas
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Configure seus pipelines e etapas de vendas
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seletor de Funil */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Label className="text-slate-500 whitespace-nowrap">Funil:</Label>
                            <Select value={funilAtivo || ''} onValueChange={setFunilAtivo}>
                                <SelectTrigger className="w-full max-w-xs">
                                    <SelectValue placeholder="Selecione um funil" />
                                </SelectTrigger>
                                <SelectContent>
                                    {funis.map((funil) => (
                                        <SelectItem key={funil.id} value={funil.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: funil.cor }}
                                                />
                                                {funil.nome}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenCreateFunil}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Funil
                            </Button>

                            {selectedFunil && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleOpenEditFunil}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Editar Funil
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleOpenDeleteFunil}
                                            className="text-red-600"
                                            disabled={funis.length <= 1}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Excluir Funil
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>

                {/* Etapas do Funil */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="font-medium text-slate-800">
                                Etapas do Funil {selectedFunil ? `"${selectedFunil.nome}"` : ''}
                            </h2>
                            <p className="text-sm text-slate-500">
                                Arraste para reordenar. Etapas "Fechada" aparecem no final.
                            </p>
                        </div>
                        <Button onClick={handleOpenCreateStage} size="sm" className="gap-2" disabled={!funilAtivo}>
                            <Plus className="w-4 h-4" />
                            Nova Etapa
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : !funilAtivo ? (
                        <div className="text-center py-12">
                            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 mb-4">
                                Selecione ou crie um funil para gerenciar suas etapas
                            </p>
                            <Button onClick={handleOpenCreateFunil} variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Criar primeiro funil
                            </Button>
                        </div>
                    ) : etapas.length === 0 ? (
                        <div className="text-center py-12">
                            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 mb-4">
                                Nenhuma etapa cadastrada neste funil
                            </p>
                            <Button onClick={handleOpenCreateStage} variant="outline" className="gap-2">
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
                                            onEdit={handleOpenEditStage}
                                            onDelete={handleOpenDeleteStage}
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

            {/* ========== DIALOGS DE ETAPA ========== */}

            {/* Create Stage Dialog */}
            <Dialog open={isCreateStageDialogOpen} onOpenChange={setIsCreateStageDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nova Etapa</DialogTitle>
                        <DialogDescription>
                            Adicione uma nova etapa ao funil "{selectedFunil?.nome}"
                        </DialogDescription>
                    </DialogHeader>
                    {stageFormJSX}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateStageDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateStage} disabled={actionLoading}>
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Criar Etapa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Stage Dialog */}
            <Dialog open={isEditStageDialogOpen} onOpenChange={setIsEditStageDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Etapa</DialogTitle>
                        <DialogDescription>
                            Atualize as informações da etapa
                        </DialogDescription>
                    </DialogHeader>
                    {stageFormJSX}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditStageDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateStage} disabled={actionLoading}>
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Stage Dialog */}
            <AlertDialog open={isDeleteStageDialogOpen} onOpenChange={setIsDeleteStageDialogOpen}>
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
                            onClick={handleDeleteStage}
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

            {/* ========== DIALOGS DE FUNIL ========== */}

            {/* Create Funil Dialog */}
            <Dialog open={isCreateFunilDialogOpen} onOpenChange={setIsCreateFunilDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Funil</DialogTitle>
                        <DialogDescription>
                            Crie um novo pipeline de vendas
                        </DialogDescription>
                    </DialogHeader>
                    {funilFormJSX}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateFunilDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateFunil} disabled={actionLoading}>
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Criar Funil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Funil Dialog */}
            <Dialog open={isEditFunilDialogOpen} onOpenChange={setIsEditFunilDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Funil</DialogTitle>
                        <DialogDescription>
                            Atualize as informações do funil
                        </DialogDescription>
                    </DialogHeader>
                    {funilFormJSX}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditFunilDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateFunil} disabled={actionLoading}>
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Funil Dialog */}
            <AlertDialog open={isDeleteFunilDialogOpen} onOpenChange={setIsDeleteFunilDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Funil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o funil{' '}
                            <strong>"{selectedFunil?.nome}"</strong>?
                            <br />
                            <br />
                            <span className="text-amber-600">
                                ⚠️ Todas as etapas deste funil também serão excluídas.
                                Oportunidades precisarão ser movidas para outro funil.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteFunil}
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
