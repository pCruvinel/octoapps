'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Loader2, FileText, Zap, MoreHorizontal, Layers, Archive, Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { useFunis } from '../../hooks/useFunis';
import type { EtapaFunil } from '../../types/funnel';
import type { Opportunity } from '../../types/opportunity';
import type { Contact } from '../../types/contact';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { SortableOpportunityCard } from './SortableOpportunityCard';
import { DroppableColumn } from './DroppableColumn';
import { useKanbanDnd } from '../../hooks/useKanbanDnd';
import { OpportunityCard } from './OpportunityCard';
import { NewLeadDialog } from './NewLeadDialog';
import { KanbanFiltersBar, KanbanFilters } from './KanbanFilters';
// EtapaDetailSheet removido - agora usa visualização inline com EtapaOpportunitiesTable
import { EtapaOpportunitiesTable } from './EtapaOpportunitiesTable';
import { ContactCombobox } from '../shared/ContactCombobox';

interface CRMKanbanProps {
  onNavigate: (route: string, id?: string) => void;
}

export function CRMKanban({ onNavigate }: CRMKanbanProps) {
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const { funis, funilAtivo, setFunilAtivo, loading: loadingFunis } = useFunis();
  const { etapas, loading: loadingEtapas } = useEtapasFunil({ funilId: funilAtivo });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);

  // Estado para controlar qual etapa está expandida (null = Kanban view)
  const [expandedEtapaId, setExpandedEtapaId] = useState<string | null>(null);

  // Derivar a etapa expandida dos dados já carregados
  const expandedEtapa = expandedEtapaId 
    ? etapas.find(e => e.id === expandedEtapaId) 
    : null;





  // Edit Opportunity State
  const initialFormState = {
    titulo: '',
    contato_id: '',
    tipo_acao: '',
    valor_estimado: '',
    etapa_funil_id: '',
    responsavel_id: '',
    origem: '',
  };

  const [editOpportunity, setEditOpportunity] = useState(initialFormState);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunityCounts, setOpportunityCounts] = useState<Record<string, { comments: number; attachments: number }>>({}); 

  const [profiles, setProfiles] = useState<any[]>([]);

  // Filtros do Kanban (v2)
  const [kanbanFilters, setKanbanFilters] = useState<KanbanFilters>({});

  // DND Hook
  const { handleDragEnd, handleDragStart, activeId } = useKanbanDnd(opportunities, setOpportunities);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Load data when user ID changes (not entire user object)
  useEffect(() => {
    if (!user?.id) return;
    
    loadOpportunities();

    loadProfiles();
    // ensureDefaultFunil já é chamado automaticamente pelo useFunis
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOpportunities = async () => {
    try {
      setLoadingOpportunities(true);

      if (!user) {
        setOpportunities([]);
        return;
      }

      // Buscar apenas oportunidades do usuário (criado por ele ou onde ele é responsável)
      const { data, error } = await supabase
        .from('oportunidades')
        .select(`
          *,
          contatos:contato_id (
            id,
            nome_completo,
            cpf_cnpj,
            email,
            telefone_principal,
            ativo
          ),
          responsavel:responsavel_id (
            id,
            nome_completo,
            avatar_url
          )
        `)
        .eq('ativo', true)
        .or(`criado_por.eq.${user.id},responsavel_id.eq.${user.id}`)
        .order('ordem', { ascending: true })
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      // Filtrar oportunidades cujos contatos estão ativos e lidar com contatos null
      const activeOpportunities = (data || []).map((opp: any) => ({
        ...opp,
        contatos: opp.contatos ? { ...opp.contatos, ativo: opp.contatos.ativo ?? true } : null
      })).filter((opp: any) => {
        // Se não tem contato vinculado, mantém a oportunidade
        if (!opp.contatos) return true;
        // Se tem contato, só mantém se o contato estiver ativo
        return opp.contatos.ativo === true;
      });

      setOpportunities(activeOpportunities);

      // Load counts for all opportunities
      loadCounts(activeOpportunities.map((o: Opportunity) => o.id));
    } catch (error) {
      console.error('Error loading opportunities:', error);
      toast.error('Erro ao carregar oportunidades');
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const loadCounts = async (oppIds: string[]) => {
    if (oppIds.length === 0) return;

    try {
      // Fetch comment counts
      const { data: commentData } = await supabase
        .from('comentarios_oportunidade')
        .select('oportunidade_id')
        .in('oportunidade_id', oppIds);

      // Fetch attachment counts
      const { data: attachmentData } = await supabase
        .from('anexos_oportunidade')
        .select('oportunidade_id')
        .in('oportunidade_id', oppIds);

      // Aggregate counts
      const counts: Record<string, { comments: number; attachments: number }> = {};
      oppIds.forEach(id => {
        counts[id] = { comments: 0, attachments: 0 };
      });

      commentData?.forEach((c: any) => {
        if (counts[c.oportunidade_id]) {
          counts[c.oportunidade_id].comments++;
        }
      });

      attachmentData?.forEach((a: any) => {
        if (counts[a.oportunidade_id]) {
          counts[a.oportunidade_id].attachments++;
        }
      });

      setOpportunityCounts(counts);
    } catch (error) {
      console.warn('Error loading counts:', error);
    }
  };



  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, avatar_url')
        .eq('ativo', true)
        .order('nome_completo');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleOpenEdit = (opp: Opportunity) => {
    if (!canUpdate('crm')) {
      toast.error('Você não tem permissão para editar oportunidades');
      return;
    }
    if (opp) {
      setEditOpportunity({
        titulo: opp.titulo,
        contato_id: opp.contato_id || '',
        tipo_acao: opp.tipo_acao || '',
        valor_estimado: opp.valor_estimado ? String(opp.valor_estimado) : '',
        etapa_funil_id: opp.etapa_funil_id || '',
        responsavel_id: opp.responsavel_id || '',
        origem: opp.origem || '',
      });
      setSelectedOpportunityId(opp.id);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditOpportunity = async () => {
    if (!canUpdate('crm')) {
      toast.error('Você não tem permissão para editar oportunidades');
      return;
    }
    if (!editOpportunity.titulo) {
      toast.error('Preencha o nome da oportunidade');
      return;
    }

    setLoading(true);
    try {
      // Get current opportunity data for logging
      const currentOpp = opportunities.find(o => o.id === selectedOpportunityId);

      const { error } = await supabase
        .from('oportunidades')
        .update({
          titulo: editOpportunity.titulo,
          contato_id: editOpportunity.contato_id || null,
          tipo_acao: editOpportunity.tipo_acao || null,
          valor_estimado: editOpportunity.valor_estimado ? parseFloat(editOpportunity.valor_estimado) : null,
          etapa_funil_id: editOpportunity.etapa_funil_id || null,
          responsavel_id: editOpportunity.responsavel_id || null,
          origem: editOpportunity.origem || null,
          data_atualizacao: new Date().toISOString(),
        })
        .eq('id', selectedOpportunityId);

      if (error) throw error;

      // Log activity (non-blocking)
      supabase.from('log_atividades').insert({
        user_id: user?.id,
        acao: 'EDITAR_OPORTUNIDADE',
        entidade: 'oportunidades',
        entidade_id: selectedOpportunityId,
        dados_anteriores: {
          titulo: currentOpp?.titulo,
          tipo_acao: currentOpp?.tipo_acao,
          valor_estimado: currentOpp?.valor_estimado
        },
        dados_novos: {
          titulo: editOpportunity.titulo,
          tipo_acao: editOpportunity.tipo_acao || null,
          valor_estimado: editOpportunity.valor_estimado ? parseFloat(editOpportunity.valor_estimado) : null
        }
      }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

      toast.success('Oportunidade atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedOpportunityId(null);
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error updating opportunity:', error);
      toast.error(error.message || 'Erro ao atualizar oportunidade');
      setLoading(false);
    }
  };

  const handleArchiveOpportunity = async (id: string) => {
    if (!canUpdate('crm')) {
      toast.error('Você não tem permissão para arquivar oportunidades');
      return;
    }

    setLoading(true);
    try {
      // Find opportunity to log
      const opp = opportunities.find(o => o.id === id);

      const { error } = await supabase
        .from('oportunidades')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      // Log activity
      if (user?.id) {
        supabase.from('log_atividades').insert({
          user_id: user.id,
          acao: 'ARQUIVAR_OPORTUNIDADE',
          entidade: 'oportunidades',
          entidade_id: id,
          dados_anteriores: { status: 'ativo' },
          dados_novos: { status: 'arquivado', titulo: opp?.titulo }
        }).then(() => { }).catch(e => console.warn('Log error:', e));
      }

      toast.success('Oportunidade arquivada!');
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error archiving:', error);
      toast.error('Erro ao arquivar oportunidade');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (opp: Opportunity) => {
    if (!canDelete('crm')) {
      toast.error('Você não tem permissão para excluir oportunidades');
      return;
    }
    setSelectedOpportunityId(opp.id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!canDelete('crm')) {
      toast.error('Você não tem permissão para excluir oportunidades');
      return;
    }
    if (!selectedOpportunityId) return;

    setLoading(true);
    try {
      // Get opportunity data for logging before delete
      const deletedOpp = opportunities.find(o => o.id === selectedOpportunityId);

      // 1. Delete dependent tasks
      await supabase.from('tarefas').delete().eq('oportunidade_id', selectedOpportunityId);
      
      // 2. Delete logs (activity history)
      await supabase.from('log_atividades').delete().eq('entidade_id', selectedOpportunityId);
      
      // 3. Delete comments
      await supabase.from('comentarios_oportunidade').delete().eq('oportunidade_id', selectedOpportunityId);
      
      // 4. Delete attachments metadata (files remain in storage unless handled by trigger, but we delete record)
      await supabase.from('anexos_oportunidade').delete().eq('oportunidade_id', selectedOpportunityId);

      // 5. Finally delete the opportunity
      const { error } = await supabase
        .from('oportunidades')
        .delete()
        .eq('id', selectedOpportunityId);

      if (error) throw error;

      // Log activity (non-blocking) - we log BEFORE clearing the ID
      if (user?.id) {
        supabase.from('log_atividades').insert({
          user_id: user.id,
          acao: 'EXCLUIR_OPORTUNIDADE',
          entidade: 'oportunidades',
          entidade_id: selectedOpportunityId, // ID might not exist anymore, but keeping for log integrity if table allows UUID
          dados_anteriores: {
            titulo: deletedOpp?.titulo,
            contato: deletedOpp?.contatos?.nome_completo || null,
            valor_estimado: deletedOpp?.valor_estimado
          },
          dados_novos: null
        }).then(() => { }).catch(e => console.warn('Log activity failed:', e));
      }

      toast.success('Oportunidade excluída permanentemente!');
      setIsDeleteDialogOpen(false);
      setSelectedOpportunityId(null);
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      toast.error(error.message || 'Erro ao excluir oportunidade');
    } finally {
      setLoading(false);
    }
  };

  const getStageOpportunities = (etapaId: string) => {
    // Apply filters (v2)
    let filtered = opportunities.filter(opp => opp.etapa_funil_id === etapaId);
    
    // Date filter
    if (kanbanFilters.dateRange?.from) {
      const fromDate = kanbanFilters.dateRange.from;
      const toDate = kanbanFilters.dateRange.to || fromDate;
      filtered = filtered.filter(opp => {
        const oppDate = new Date(opp.data_criacao);
        return oppDate >= fromDate && oppDate <= toDate;
      });
    }
    
    // Product filter (multi-select)
    if (kanbanFilters.productIds && kanbanFilters.productIds.length > 0) {
      filtered = filtered.filter(opp => 
        opp.produto_servico_id && kanbanFilters.productIds!.includes(opp.produto_servico_id)
      );
    }
    
    // Responsible filter (multi-select)
    if (kanbanFilters.responsibleIds && kanbanFilters.responsibleIds.length > 0) {
      filtered = filtered.filter(opp => 
        opp.responsavel_id && kanbanFilters.responsibleIds!.includes(opp.responsavel_id)
      );
    }
    
    return filtered;
  };

  // Handler para navegar para visualização detalhada de uma etapa
  // Handler para expandir visualização detalhada de uma etapa (View Toggle)
  const handleEtapaClick = (etapa: EtapaFunil) => {
    setExpandedEtapaId(etapa.id);
  };

  // Handler para voltar ao Kanban
  const handleBackToKanban = () => {
    setExpandedEtapaId(null);
  };



  // Find the active opportunity for DragOverlay
  const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-2 border-b border-border">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Funis Tabs */}
            {funis.length > 1 ? (
              <Tabs value={funilAtivo || ''} onValueChange={setFunilAtivo}>
                <TabsList className="h-10 bg-muted">
                  {funis.map(f => (
                    <TabsTrigger key={f.id} value={f.id} className="gap-2 px-4">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: f.cor }}
                      />
                      {f.nome}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            ) : (
              <div className="flex flex-col gap-1">
                <h1 className="text-foreground font-bold text-2xl whitespace-nowrap flex items-center gap-2">
                  {funis[0] && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: funis[0].cor }}
                    />
                  )}
                  {funis[0]?.nome || 'Pipeline de Oportunidades'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gerencie e acompanhe suas oportunidades de negócio
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
            <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <KanbanFiltersBar
                filters={kanbanFilters}
                onFiltersChange={setKanbanFilters}
                responsibles={profiles}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                className="gap-2 w-full sm:w-auto"
                disabled={!canCreate('crm')}
                onClick={(e) => {
                  if (!canCreate('crm')) {
                    e.preventDefault();
                    toast.error('Você não tem permissão para criar oportunidades');
                  } else {
                    setIsCreateDialogOpen(true);
                  }
                }}
              >
                <Plus className="w-4 h-4" />
                Nova Oportunidade
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 bg-background">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onNavigate('etapas-funil')}>
                    <Layers className="w-4 h-4 mr-2" />
                    Funil & Etapas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('campos-oportunidade')}>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Campos do Card
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('oportunidades-arquivadas')}>
                    <Archive className="w-4 h-4 mr-2" />
                    Arquivados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <NewLeadDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={loadOpportunities}

            profiles={profiles}
            funilId={funilAtivo}
          />

        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 lg:p-6">
        {loadingOpportunities || loadingEtapas || loadingFunis ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : expandedEtapaId && expandedEtapa ? (
          /* DataTable View - Etapa Expandida */
          <EtapaOpportunitiesTable
            etapa={expandedEtapa}
            opportunities={getStageOpportunities(expandedEtapa.id)}
            onSelectOpportunity={(id) => onNavigate('opportunity-details', id)}
            onBack={handleBackToKanban}
          />
        ) : etapas.length === 0 ? (
          /* Empty State - Funil sem etapas */
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-300">
            <Layers className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Nenhuma etapa configurada
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-sm mb-4">
              Este funil ainda não possui etapas. Configure as etapas para começar a gerenciar suas oportunidades.
            </p>
            <Button onClick={() => onNavigate('etapas-funil')} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Etapas
            </Button>
          </div>
        ) : (
          /* Kanban View */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full overflow-x-auto pb-2">
              {etapas.map(etapa => {
                const etapaOpps = getStageOpportunities(etapa.id);
                return (
                  <DroppableColumn
                    key={etapa.id}
                    etapa={etapa}
                    opportunities={etapaOpps}
                    onHeaderClick={() => handleEtapaClick(etapa)}
                  >
                    {etapaOpps.map(opp => (
                      <SortableOpportunityCard
                        key={opp.id}
                        opportunity={opp}
                        onNavigate={onNavigate}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                        onArchive={handleArchiveOpportunity}
                        canUpdate={canUpdate('crm')}
                        canDelete={canDelete('crm')}
                        commentCount={opportunityCounts[opp.id]?.comments || 0}
                        attachmentCount={opportunityCounts[opp.id]?.attachments || 0}
                      />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
            <DragOverlay>
              {activeOpportunity ? (
                <div
                  className="cursor-grabbing shadow-2xl rotate-2 z-50 rounded-lg overflow-hidden ring-2 ring-blue-500/50"
                  style={{ cursor: 'grabbing' }}
                >
                  <OpportunityCard
                    opportunity={activeOpportunity}
                    onNavigate={() => onNavigate('opportunity-details', activeOpportunity.id)}
                    onEdit={() => handleOpenEdit(activeOpportunity)}
                    onDelete={() => handleOpenDelete(activeOpportunity)}
                    onArchive={() => handleArchiveOpportunity(activeOpportunity.id)}
                    canUpdate={canUpdate('crm')}
                    canDelete={canDelete('crm')}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Oportunidade</DialogTitle>
            <DialogDescription>Atualize os dados da oportunidade</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Nome da Oportunidade *</Label>
              <Input
                id="edit-titulo"
                value={editOpportunity.titulo}
                onChange={(e) => setEditOpportunity(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contato_id">Contato</Label>
              <ContactCombobox
                value={editOpportunity.contato_id}
                onChange={(value) => setEditOpportunity(prev => ({ ...prev, contato_id: value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tipo_acao">Tipo de Ação</Label>
              <Select
                value={editOpportunity.tipo_acao}
                onValueChange={(value) => setEditOpportunity(prev => ({ ...prev, tipo_acao: value }))}
              >
                <SelectTrigger id="edit-tipo_acao"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Revisional">Revisional</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Empréstimo">Empréstimo</SelectItem>
                  <SelectItem value="Financiamento Imobiliário">Financiamento Imobiliário</SelectItem>
                  <SelectItem value="Consultoria">Consultoria</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-valor_estimado">Valor (R$)</Label>
              <Input type="number" id="edit-valor_estimado" value={editOpportunity.valor_estimado} onChange={e => setEditOpportunity(prev => ({ ...prev, valor_estimado: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-etapa_funil_id">Etapa</Label>
              <Select value={editOpportunity.etapa_funil_id} onValueChange={v => setEditOpportunity(prev => ({ ...prev, etapa_funil_id: v }))}>
                <SelectTrigger id="edit-etapa_funil_id"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                <SelectContent>{etapas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-responsavel_id">Responsável</Label>
              <Select value={editOpportunity.responsavel_id} onValueChange={v => setEditOpportunity(prev => ({ ...prev, responsavel_id: v }))}>
                <SelectTrigger id="edit-responsavel_id"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-origem">Origem</Label>
              <Input id="edit-origem" value={editOpportunity.origem} onChange={e => setEditOpportunity(prev => ({ ...prev, origem: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={handleEditOpportunity} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Atualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Excluir Permanentemente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-500">
                <span>Esta ação não pode ser desfeita. Isso excluirá permanentemente a oportunidade <strong className="text-gray-700">e todos os dados vinculados</strong>:</span>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2">
                  <li>Tarefas e Agendamentos</li>
                  <li>Histórico de Atividades e Logs</li>
                  <li>Comentários e Anotações</li>
                  <li>Anexos e Arquivos</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



    </div>
  );
}