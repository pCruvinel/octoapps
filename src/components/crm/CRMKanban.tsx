'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Loader2, FileText, Zap, MoreHorizontal, Layers, Archive, Settings2, LayoutGrid, List } from 'lucide-react';
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
import { OpportunitiesDataTable } from './OpportunitiesDataTable';

interface CRMKanbanProps {
  onNavigate: (route: string, id?: string) => void;
}

export function CRMKanban({ onNavigate }: CRMKanbanProps) {
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const { etapas, loading: loadingEtapas } = useEtapasFunil();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Filtros do Kanban (v2)
  const [kanbanFilters, setKanbanFilters] = useState<KanbanFilters>({});
  
  // View mode: 'kanban' ou 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // DND Hook
  const { handleDragEnd, handleDragStart, activeId } = useKanbanDnd(opportunities, setOpportunities);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Load data when user changes
  useEffect(() => {
    loadOpportunities();
    loadContacts();
    loadProfiles();
  }, [user]);

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

  const loadContacts = async () => {
    try {
      if (!user) {
        setContacts([]);
        return;
      }

      const { data, error } = await supabase
        .from('contatos')
        .select('id, nome_completo, email')
        .eq('ativo', true)
        .or(`criado_por.eq.${user.id},responsavel_id.eq.${user.id}`)
        .order('nome_completo');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
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

  // Get all filtered opportunities for table view (applies same filters but across all stages)
  const getFilteredOpportunitiesForTable = () => {
    let filtered = [...opportunities];
    
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

  // Find the active opportunity for DragOverlay
  const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-2 border-b border-border">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground font-bold text-2xl whitespace-nowrap">
              Pipeline de Oportunidades
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie e acompanhar suas oportunidades de negócio
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'table')} className="hidden sm:block">
              <TabsList className="h-9 bg-muted">
                <TabsTrigger value="kanban" className="gap-1.5 text-xs">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-1.5 text-xs">
                  <List className="w-3.5 h-3.5" />
                  Tabela
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
                    Etapas do Funil
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
            contacts={contacts}
            profiles={profiles}
          />

        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 lg:p-6">
        {loadingOpportunities || loadingEtapas ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : viewMode === 'table' ? (
          /* DataTable View */
          <OpportunitiesDataTable
            opportunities={getFilteredOpportunitiesForTable()}
            loading={loadingOpportunities}
            onNavigate={onNavigate}
            onDelete={handleOpenDelete}
            onArchive={handleArchiveOpportunity}
            etapas={etapas}
          />
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
              <Select
                value={editOpportunity.contato_id}
                onValueChange={(value) => setEditOpportunity(prev => ({ ...prev, contato_id: value }))}
              >
                <SelectTrigger id="edit-contato_id"><SelectValue placeholder="Selecione um contato" /></SelectTrigger>
                <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}</SelectContent>
              </Select>
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