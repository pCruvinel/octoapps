import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Calendar, Edit, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../lib/supabase';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { useTasks } from '../../hooks/useTasks';
import type { Opportunity } from '../../types/opportunity';
import type { Contact } from '../../types/contact';
import type { TipoTarefa } from '../../types/task';
import { getTipoColor } from '../../types/task';

interface OpportunityDetailsProps {
  opportunityId: string | null;
  onNavigate: (route: string, id?: string) => void;
}

export function OpportunityDetails({ opportunityId, onNavigate }: OpportunityDetailsProps) {
  const { etapas, loading: loadingEtapas } = useEtapasFunil();
  const { tasks, loading: loadingTasks, createTask, loadTasksByOpportunity } = useTasks();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<TipoTarefa>('Tarefa');
  const [scheduleForm, setScheduleForm] = useState({
    titulo: '',
    data_vencimento: '',
    observacoes: '',
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

  useEffect(() => {
    if (opportunityId) {
      loadOpportunity();
      loadContacts();
      loadProfiles();
      loadTasksByOpportunity(opportunityId);
    }
  }, [opportunityId, loadTasksByOpportunity]);

  const loadOpportunity = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('oportunidades')
        .select(`
          *,
          contatos:contato_id (
            id,
            nome_completo,
            cpf_cnpj,
            email,
            telefone_principal
          ),
          responsavel:responsavel_id (
            id,
            nome_completo,
            avatar_url
          )
        `)
        .eq('id', opportunityId)
        .single();

      if (error) throw error;
      setOpportunity(data);
    } catch (error: any) {
      console.error('Error loading opportunity:', error);
      toast.error('Erro ao carregar oportunidade');
      onNavigate('crm');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contatos')
        .select('id, nome_completo, email, telefone_principal')
        .eq('ativo', true)
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, email')
        .eq('ativo', true)
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleOpenEditDialog = () => {
    if (!opportunity) return;

    setEditOpportunity({
      titulo: opportunity.titulo,
      contato_id: opportunity.contato_id || '',
      tipo_acao: opportunity.tipo_acao || '',
      valor_estimado: opportunity.valor_estimado?.toString() || '',
      etapa_funil_id: opportunity.etapa_funil_id || '',
      responsavel_id: opportunity.responsavel_id || '',
      origem: opportunity.origem || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditOpportunity = async () => {
    if (!editOpportunity.titulo) {
      toast.error('Preencha o nome da oportunidade');
      return;
    }

    setActionLoading(true);
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
        .eq('id', opportunityId);

      if (error) throw error;

      toast.success('Oportunidade atualizada com sucesso!');
      setIsEditDialogOpen(false);
      await loadOpportunity();
    } catch (error: any) {
      console.error('Error updating opportunity:', error);
      toast.error(error.message || 'Erro ao atualizar oportunidade');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!opportunityId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('oportunidades')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;

      toast.success('Oportunidade excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      onNavigate('crm');
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      toast.error(error.message || 'Erro ao excluir oportunidade');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleForm.titulo) {
      toast.error('Preencha o título da interação');
      return;
    }

    if (!scheduleForm.data_vencimento) {
      toast.error('Preencha a data e hora');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await createTask({
        titulo: scheduleForm.titulo,
        tipo: currentTab,
        oportunidade_id: opportunityId!,
        contato_id: opportunity?.contato_id || null,
        responsavel_id: '', // Será preenchido pelo hook com user atual
        data_vencimento: scheduleForm.data_vencimento,
        observacoes: scheduleForm.observacoes || null,
      });

      if (error) throw new Error(error);

      toast.success('Interação agendada com sucesso!');
      setIsScheduleDialogOpen(false);
      setScheduleForm({
        titulo: '',
        data_vencimento: '',
        observacoes: '',
      });

      // Recarregar tarefas
      if (opportunityId) {
        await loadTasksByOpportunity(opportunityId);
      }
    } catch (error: any) {
      console.error('Erro ao agendar interação:', error);
      toast.error(error.message || 'Erro ao agendar interação');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getEtapaLabel = () => {
    if (!opportunity?.etapa_funil_id) return 'Sem etapa';
    const etapa = etapas.find(e => e.id === opportunity.etapa_funil_id);
    return etapa?.nome || 'Sem etapa';
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="p-4 lg:p-8">
        <p className="text-gray-500">Oportunidade não encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => onNavigate('crm')}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Pipeline
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-white mb-2">{opportunity.titulo}</h1>
            <div className="flex gap-2">
              <Badge variant="outline">{getEtapaLabel()}</Badge>
              {opportunity.tipo_acao && <Badge>{opportunity.tipo_acao}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleOpenEditDialog}>
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            <Button variant="destructive" className="gap-2" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Nome</div>
              <div className="text-gray-900 dark:text-white">
                {opportunity.contatos?.nome_completo || 'Sem contato'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">CPF/CNPJ</div>
              <div className="text-gray-900 dark:text-white">
                {opportunity.contatos?.cpf_cnpj || 'Não informado'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tipo de Ação</div>
              <div className="text-gray-900 dark:text-white">
                {opportunity.tipo_acao || 'Não especificado'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Funil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Etapa</div>
              <div className="text-gray-900 dark:text-white">{getEtapaLabel()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Valor da Proposta</div>
              <div className="text-green-600 dark:text-green-400">
                {formatCurrency(opportunity.valor_estimado)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Origem</div>
              <div className="text-gray-900 dark:text-white">{opportunity.origem || 'Não informado'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Responsável</div>
              <div className="text-gray-900 dark:text-white">
                {opportunity.responsavel?.nome_completo || 'Não atribuído'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Data de Criação</div>
              <div className="text-gray-900 dark:text-white">{formatDate(opportunity.data_criacao)}</div>
            </div>
            {opportunity.observacoes && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Observações</div>
                <div className="text-gray-900 dark:text-white text-sm">{opportunity.observacoes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Interações</CardTitle>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendar Interação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Agendar Interação</DialogTitle>
                  <DialogDescription>
                    Escolha o tipo de interação e preencha os detalhes
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="Tarefa" onValueChange={(value) => setCurrentTab(value as TipoTarefa)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Tarefa">Tarefa</TabsTrigger>
                    <TabsTrigger value="Follow-up">Follow-up</TabsTrigger>
                    <TabsTrigger value="Reunião">Reunião</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Tarefa" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-title">Título da Tarefa</Label>
                      <Input
                        id="task-title"
                        value={scheduleForm.titulo}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ex: Enviar documentação"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-date">Data e Hora</Label>
                      <Input
                        id="task-date"
                        type="datetime-local"
                        value={scheduleForm.data_vencimento}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-notes">Observações</Label>
                      <Textarea
                        id="task-notes"
                        value={scheduleForm.observacoes}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Detalhes da tarefa..."
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="Follow-up" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="followup-title">Título do Follow-up</Label>
                      <Input
                        id="followup-title"
                        value={scheduleForm.titulo}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ex: Retornar contato"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="followup-date">Data e Hora</Label>
                      <Input
                        id="followup-date"
                        type="datetime-local"
                        value={scheduleForm.data_vencimento}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="followup-notes">Observações</Label>
                      <Textarea
                        id="followup-notes"
                        value={scheduleForm.observacoes}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Detalhes do follow-up..."
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="Reunião" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meeting-title">Título da Reunião</Label>
                      <Input
                        id="meeting-title"
                        value={scheduleForm.titulo}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ex: Apresentação de proposta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meeting-date">Data e Hora</Label>
                      <Input
                        id="meeting-date"
                        type="datetime-local"
                        value={scheduleForm.data_vencimento}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meeting-notes">Observações</Label>
                      <Textarea
                        id="meeting-notes"
                        value={scheduleForm.observacoes}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Detalhes da reunião..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsScheduleDialogOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSchedule} disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      'Agendar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTasks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Carregando interações...
              </span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhuma interação agendada ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getTipoColor(task.tipo)}>
                        {task.tipo}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {task.data_vencimento ? formatDateTime(task.data_vencimento) : 'Sem data'}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white mb-1">{task.titulo}</p>
                    {task.observacoes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{task.observacoes}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Por {task.responsavel?.nome_completo || 'Não atribuído'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleEditOpportunity} disabled={actionLoading}>
              {actionLoading ? (
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

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {actionLoading ? (
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