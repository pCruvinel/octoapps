'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, MoreVertical, Calendar, DollarSign, User, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import type { Opportunity } from '../../types/opportunity';
import type { Contact } from '../../types/contact';

interface OpportunityCardProps {
  opportunity: any;
  onNavigate: (route: string, id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function OpportunityCard({ opportunity, onNavigate, onEdit, onDelete }: OpportunityCardProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <h4
          className="text-sm text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
          onClick={() => onNavigate('opportunity-details', opportunity.id)}
        >
          {opportunity.titulo}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onNavigate('opportunity-details', opportunity.id)}>
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(opportunity.id)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={() => onDelete(opportunity.id)}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <User className="w-3 h-3" />
          <span>{opportunity.contatos?.nome_completo || 'Sem contato'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <DollarSign className="w-3 h-3" />
          <span className="text-green-600 dark:text-green-400">
            {formatCurrency(opportunity.valor_estimado)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(opportunity.data_criacao)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <Badge variant="secondary" className="text-xs">
          {opportunity.tipo_acao || 'Sem tipo'}
        </Badge>
      </div>
    </div>
  );
}

interface CRMKanbanProps {
  onNavigate: (route: string, id?: string) => void;
}

export function CRMKanban({ onNavigate }: CRMKanbanProps) {
  const { user } = useAuth();
  const { etapas, loading: loadingEtapas } = useEtapasFunil();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);

  const [newOpportunity, setNewOpportunity] = useState({
    titulo: '',
    contato_id: '',
    tipo_acao: '',
    valor_estimado: '',
    etapa_funil_id: '',
    responsavel_id: '',
    origem: '',
  });

  const [editOpportunity, setEditOpportunity] = useState({
    titulo: '',
    contato_id: '',
    tipo_acao: '',
    valor_estimado: '',
    etapa_funil_id: '',
    responsavel_id: '',
    origem: '',
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Load data on mount
  useEffect(() => {
    loadOpportunities();
    loadContacts();
    loadProfiles();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoadingOpportunities(true);
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
        .order('ordem', { ascending: true })
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      // Filtrar oportunidades cujos contatos estão ativos
      const activeOpportunities = (data || []).filter(opp => {
        // Se não tem contato vinculado, mantém a oportunidade
        if (!opp.contatos) return true;
        // Se tem contato, só mantém se o contato estiver ativo
        return opp.contatos.ativo === true;
      });

      setOpportunities(activeOpportunities);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      toast.error('Erro ao carregar oportunidades');
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contatos')
        .select('id, nome_completo, email')
        .eq('ativo', true)
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

  const handleCreateOpportunity = async () => {
    if (!newOpportunity.titulo) {
      toast.error('Preencha o nome da oportunidade');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('oportunidades')
        .insert([{
          titulo: newOpportunity.titulo,
          contato_id: newOpportunity.contato_id || null,
          tipo_acao: newOpportunity.tipo_acao || null,
          valor_estimado: newOpportunity.valor_estimado ? parseFloat(newOpportunity.valor_estimado) : null,
          etapa_funil_id: newOpportunity.etapa_funil_id || null,
          responsavel_id: newOpportunity.responsavel_id || null,
          origem: newOpportunity.origem || null,
          criado_por: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Oportunidade criada com sucesso!');
      setIsCreateDialogOpen(false);
      setNewOpportunity({
        titulo: '',
        contato_id: '',
        tipo_acao: '',
        valor_estimado: '',
        etapa_funil_id: '',
        responsavel_id: '',
        origem: '',
      });

      // Reload opportunities
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error creating opportunity:', error);
      toast.error(error.message || 'Erro ao criar oportunidade');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (id: string) => {
    const opp = opportunities.find(o => o.id === id);
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
      setSelectedOpportunityId(id);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditOpportunity = async () => {
    if (!editOpportunity.titulo) {
      toast.error('Preencha o nome da oportunidade');
      return;
    }

    setLoading(true);
    try {
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

      toast.success('Oportunidade atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedOpportunityId(null);

      // Reload opportunities
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error updating opportunity:', error);
      toast.error(error.message || 'Erro ao atualizar oportunidade');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (id: string) => {
    setSelectedOpportunityId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOpportunityId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('oportunidades')
        .delete()
        .eq('id', selectedOpportunityId);

      if (error) throw error;

      toast.success('Oportunidade excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedOpportunityId(null);

      // Reload opportunities
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      toast.error(error.message || 'Erro ao excluir oportunidade');
    } finally {
      setLoading(false);
    }
  };

  const getStageOpportunities = (etapaId: string) => {
    // Filtrar apenas por etapa_funil_id
    return opportunities.filter(opp => opp.etapa_funil_id === etapaId);
  };

  const getStageTotal = (etapaId: string) => {
    return getStageOpportunities(etapaId).reduce((sum, opp) => sum + (opp.valor_estimado || 0), 0);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 lg:p-8 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-white mb-2">Pipeline - Kanban de Oportunidades</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie suas oportunidades de vendas
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Oportunidade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Oportunidade</DialogTitle>
                <DialogDescription>
                  Preencha os dados da oportunidade
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Nome da Oportunidade *</Label>
                  <Input
                    id="titulo"
                    value={newOpportunity.titulo}
                    onChange={(e) => setNewOpportunity(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Revisão de Financiamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato_id">Contato</Label>
                  <Select
                    value={newOpportunity.contato_id}
                    onValueChange={(value) => setNewOpportunity(prev => ({ ...prev, contato_id: value }))}
                  >
                    <SelectTrigger id="contato_id">
                      <SelectValue placeholder="Selecione um contato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_acao">Tipo de Ação</Label>
                  <Select
                    value={newOpportunity.tipo_acao}
                    onValueChange={(value) => setNewOpportunity(prev => ({ ...prev, tipo_acao: value }))}
                  >
                    <SelectTrigger id="tipo_acao">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
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
                  <Label htmlFor="valor_estimado">Valor da Proposta (R$)</Label>
                  <Input
                    id="valor_estimado"
                    type="number"
                    value={newOpportunity.valor_estimado}
                    onChange={(e) => setNewOpportunity(prev => ({ ...prev, valor_estimado: e.target.value }))}
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etapa_funil_id">Etapa do Funil</Label>
                  <Select
                    value={newOpportunity.etapa_funil_id}
                    onValueChange={(value: any) => setNewOpportunity(prev => ({ ...prev, etapa_funil_id: value }))}
                  >
                    <SelectTrigger id="etapa_funil_id">
                      <SelectValue placeholder="Selecione a etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map(etapa => (
                        <SelectItem key={etapa.id} value={etapa.id}>{etapa.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel_id">Responsável</Label>
                  <Select
                    value={newOpportunity.responsavel_id}
                    onValueChange={(value) => setNewOpportunity(prev => ({ ...prev, responsavel_id: value }))}
                  >
                    <SelectTrigger id="responsavel_id">
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Input
                    id="origem"
                    value={newOpportunity.origem}
                    onChange={(e) => setNewOpportunity(prev => ({ ...prev, origem: e.target.value }))}
                    placeholder="Ex: Indicação, Website, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateOpportunity} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Oportunidade'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 lg:p-8">
        {loadingOpportunities || loadingEtapas ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex gap-4 min-w-max">
            {etapas.map(etapa => {
              const etapaOpps = getStageOpportunities(etapa.id);
              const etapaTotal = getStageTotal(etapa.id);

              return (
                <div key={etapa.id} className="w-80 flex-shrink-0">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: etapa.cor }}
                      />
                      <h3 className="text-gray-900 dark:text-white">
                        {etapa.nome}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({etapaOpps.length})
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(etapaTotal)}
                    </div>
                  </div>

                  <div className="space-y-3 min-h-[200px] bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    {etapaOpps.map(opp => (
                      <OpportunityCard
                        key={opp.id}
                        opportunity={opp}
                        onNavigate={onNavigate}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                      />
                    ))}
                    {etapaOpps.length === 0 && (
                      <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                        Nenhuma oportunidade
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Oportunidade</DialogTitle>
            <DialogDescription>
              Atualize os dados da oportunidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Nome da Oportunidade *</Label>
              <Input
                id="edit-titulo"
                value={editOpportunity.titulo}
                onChange={(e) => setEditOpportunity(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Revisão de Financiamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contato_id">Contato</Label>
              <Select
                value={editOpportunity.contato_id}
                onValueChange={(value) => setEditOpportunity(prev => ({ ...prev, contato_id: value }))}
              >
                <SelectTrigger id="edit-contato_id">
                  <SelectValue placeholder="Selecione um contato" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo_acao">Tipo de Ação</Label>
              <Select
                value={editOpportunity.tipo_acao}
                onValueChange={(value) => setEditOpportunity(prev => ({ ...prev, tipo_acao: value }))}
              >
                <SelectTrigger id="edit-tipo_acao">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
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
              <Label htmlFor="edit-valor_estimado">Valor da Proposta (R$)</Label>
              <Input
                id="edit-valor_estimado"
                type="number"
                value={editOpportunity.valor_estimado}
                onChange={(e) => setEditOpportunity(prev => ({ ...prev, valor_estimado: e.target.value }))}
                placeholder="0,00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-etapa_funil_id">Etapa do Funil</Label>
              <Select
                value={editOpportunity.etapa_funil_id}
                onValueChange={(value: any) => setEditOpportunity(prev => ({ ...prev, etapa_funil_id: value }))}
              >
                <SelectTrigger id="edit-etapa_funil_id">
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map(etapa => (
                    <SelectItem key={etapa.id} value={etapa.id}>{etapa.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-responsavel_id">Responsável</Label>
              <Select
                value={editOpportunity.responsavel_id}
                onValueChange={(value) => setEditOpportunity(prev => ({ ...prev, responsavel_id: value }))}
              >
                <SelectTrigger id="edit-responsavel_id">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-origem">Origem</Label>
              <Input
                id="edit-origem"
                value={editOpportunity.origem}
                onChange={(e) => setEditOpportunity(prev => ({ ...prev, origem: e.target.value }))}
                placeholder="Ex: Indicação, Website, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleEditOpportunity} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Oportunidade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oportunidade</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {loading ? (
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