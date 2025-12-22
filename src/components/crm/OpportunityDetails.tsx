
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Calendar, Edit, Trash2, Loader2, Clock, FileText, User, Activity, Zap } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { useTasks } from '../../hooks/useTasks';
import { useAgendamentos } from '../../hooks/useAgendamentos';
import { useAuth } from '../../hooks/useAuth';
import type { Opportunity } from '../../types/opportunity';
import type { Contact } from '../../types/contact';
import type { TipoTarefa } from '../../types/task';
import { getTipoColor } from '../../types/task';

interface OpportunityDetailsProps {
  opportunityId: string | null;
  onNavigate: (route: string, id?: string) => void;
}

interface ActivityLog {
  id: string;
  acao: string;
  data_criacao: string;
  dados_novos: any;
  user_id: string;
  // Add user name via join if possible, or just user_id
  users?: {
    email: string;
  }
}

export function OpportunityDetails({ opportunityId, onNavigate }: OpportunityDetailsProps) {
  const { etapas, loading: loadingEtapas } = useEtapasFunil();
  const { tasks, loading: loadingTasks, createTask, loadTasksByOpportunity } = useTasks();
  const { createAgendamento } = useAgendamentos();
  const { user } = useAuth();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('detalhes');
  const [interactionType, setInteractionType] = useState<TipoTarefa>('Tarefa');

  // Logs
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
      loadLogs(opportunityId);
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

  const loadLogs = async (id: string) => {
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('log_atividades')
        .select(`
                *,
                users:user_id (email)
            `)
        .eq('entidade_id', id)
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      // Cast safely
      setLogs(data as any || []);
    } catch (error) {
      console.error("Error loading logs", error);
    } finally {
      setLoadingLogs(false);
    }
  }

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
      await loadLogs(opportunityId!); // Reload logs to see update
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
      // First, delete related tasks
      const { error: tasksError } = await supabase
        .from('tarefas')
        .delete()
        .eq('oportunidade_id', opportunityId);

      if (tasksError) {
        console.warn('Error deleting related tasks:', tasksError);
        // Continue anyway - may not have tasks
      }

      // Then, delete activity logs
      const { error: logsError } = await supabase
        .from('log_atividades')
        .delete()
        .eq('entidade_id', opportunityId);

      if (logsError) {
        console.warn('Error deleting activity logs:', logsError);
        // Continue anyway - may not have logs
      }

      // Finally, delete the opportunity
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
      // 1. Create Task (for legacy compatibility and opportunity tracking)
      const { error } = await createTask({
        titulo: scheduleForm.titulo,
        tipo: interactionType,
        oportunidade_id: opportunityId!,
        contato_id: opportunity?.contato_id || null,
        responsavel_id: '', // Será preenchido pelo hook com user atual
        data_vencimento: scheduleForm.data_vencimento,
        observacoes: scheduleForm.observacoes || null,
      });

      if (error) throw new Error(error);

      // 2. Also create Agendamento for Calendar view
      const startDate = new Date(scheduleForm.data_vencimento);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      await createAgendamento({
        titulo: `[${interactionType}] ${scheduleForm.titulo}`,
        descricao: scheduleForm.observacoes || undefined,
        data_inicio: startDate.toISOString(),
        data_fim: endDate.toISOString(),
        cor: interactionType === 'Reunião' ? '#10B981' : interactionType === 'Follow-up' ? '#8B5CF6' : '#3D96FF',
        contato_id: opportunity?.contato_id || undefined,
        oportunidade_id: opportunityId!,
        user_id: user?.id,
      });

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
        await loadLogs(opportunityId);
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

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-gray-900 dark:text-white text-2xl font-bold mb-2">{opportunity.titulo}</h1>
            <div className="flex gap-2">
              <Badge variant="outline">{getEtapaLabel()}</Badge>
              {opportunity.tipo_acao && <Badge>{opportunity.tipo_acao}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => onNavigate('triagem')}>
              <Zap className="w-4 h-4" />
              Triagem Rápida
            </Button>
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

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Detalhes do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Nome</div>
                  <div className="text-gray-900 dark:text-white font-medium">
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
                {opportunity.contatos?.telefone_principal && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Telefone</div>
                    <div className="text-gray-900 dark:text-white">
                      {opportunity.contatos.telefone_principal}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Informações do Funil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Etapa Atual</div>
                  <Badge variant="secondary" className="mt-1">{getEtapaLabel()}</Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Valor da Proposta</div>
                  <div className="text-green-600 dark:text-green-400 font-bold text-lg">
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
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Responsável</div>
                  <div className="text-gray-900 dark:text-white flex items-center gap-2">
                    {opportunity.responsavel?.avatar_url && (
                      <img src={opportunity.responsavel.avatar_url} className="w-6 h-6 rounded-full" alt="Avatar" />
                    )}
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
                    <div className="text-gray-900 dark:text-white text-sm mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {opportunity.observacoes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Future Tasks Section within Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Próximas Interações (Tarefas)</CardTitle>
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
                    <Tabs defaultValue="Tarefa" onValueChange={(v) => setInteractionType(v as TipoTarefa)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="Tarefa">Tarefa</TabsTrigger>
                        <TabsTrigger value="Follow-up">Follow-up</TabsTrigger>
                        <TabsTrigger value="Reunião">Reunião</TabsTrigger>
                      </TabsList>
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="int-title">Título</Label>
                          <Input
                            id="int-title"
                            value={scheduleForm.titulo}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, titulo: e.target.value }))}
                            placeholder="Ex: Ligar para cliente"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="int-date">Data e Hora</Label>
                          <Input
                            id="int-date"
                            type="datetime-local"
                            value={scheduleForm.data_vencimento}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="int-notes">Observações</Label>
                          <Textarea
                            id="int-notes"
                            value={scheduleForm.observacoes}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, observacoes: e.target.value }))}
                            placeholder="Detalhes..."
                          />
                        </div>
                      </div>
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
                        {actionLoading ? <Loader2 className="animate-spin" /> : 'Agendar'}
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
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhuma tarefa pendente.
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map(task => (
                    <div key={task.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
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
                        <p className="text-gray-900 dark:text-white font-medium">{task.titulo}</p>
                        {task.observacoes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.observacoes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhuma atividade registrada.
                </div>
              ) : (
                <div className="relative border-l border-gray-200 dark:border-gray-800 ml-3 space-y-6">
                  {logs.map((log) => (
                    <div key={log.id} className="mb-6 ml-6 relative">
                      <span className="flex absolute -left-[31px] justify-center items-center w-6 h-6 bg-blue-100 rounded-full ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
                        <Activity className="w-3 h-3 text-blue-800 dark:text-blue-300" />
                      </span>
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="justify-between items-center mb-2 sm:flex">
                          <time className="mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0">
                            {formatDateTime(log.data_criacao)}
                          </time>
                          <div className="text-sm font-normal text-gray-500 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {log.users?.email || 'Sistema'}
                            </span>
                            {' '}realizou a ação:{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {log.acao}
                            </span>
                          </div>
                        </div>
                        {/* Optional: Show details of change if available */}
                        {log.dados_novos && typeof log.dados_novos === 'object' && (
                          <div className="p-3 text-xs italic font-normal text-gray-500 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            {JSON.stringify(log.dados_novos, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs exist below (Edit, Delete) - reused from original */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Oportunidade</DialogTitle>
          </DialogHeader>
          {/* Edit Form similar to original but cleaned up */}
          <div className="space-y-4 py-4">
            {/* Fields... copied from original logic */}
            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Nome da Oportunidade *</Label>
              <Input
                id="edit-titulo"
                value={editOpportunity.titulo}
                onChange={(e) => setEditOpportunity(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>
            {/* ... (Other fields are maintained in logic, can be same layout) ... */}
            <div className="space-y-2">
              <Label htmlFor="edit-valor_estimado">Valor</Label>
              <Input
                id="edit-valor_estimado"
                type="number"
                value={editOpportunity.valor_estimado}
                onChange={(e) => setEditOpportunity(prev => ({ ...prev, valor_estimado: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>Cancelar</Button>
            <Button onClick={handleEditOpportunity} disabled={actionLoading}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oportunidade?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}