'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Loader2, FileText, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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

      const { error } = await supabase
        .from('oportunidades')
        .delete()
        .eq('id', selectedOpportunityId);

      if (error) throw error;

      // Log activity (non-blocking) - we log BEFORE clearing the ID
      supabase.from('log_atividades').insert({
        user_id: user?.id,
        acao: 'EXCLUIR_OPORTUNIDADE',
        entidade: 'oportunidades',
        entidade_id: selectedOpportunityId,
        dados_anteriores: {
          titulo: deletedOpp?.titulo,
          contato: deletedOpp?.contatos?.nome_completo || null,
          valor_estimado: deletedOpp?.valor_estimado
        },
        dados_novos: null
      }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

      toast.success('Oportunidade excluída com sucesso!');
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
    return opportunities.filter(opp => opp.etapa_funil_id === etapaId);
  };

  // Find the active opportunity for DragOverlay
  const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 lg:p-8 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-gray-900 dark:text-white mb-2 font-bold text-2xl">Pipeline - Kanban</h1>
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

      <div className="flex-1 overflow-x-auto p-4 lg:p-8">
        {loadingOpportunities || loadingEtapas ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max h-full">
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
                    onNavigate={() => { }}
                    onEdit={() => { }}
                    onDelete={() => { }}
                    canUpdate={false}
                    canDelete={false}
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
            <AlertDialogTitle>Excluir Oportunidade</AlertDialogTitle>
            <AlertDialogDescription>Você tem certeza que deseja excluir esta oportunidade?</AlertDialogDescription>
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