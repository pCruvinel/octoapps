
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';

import { ArrowLeft, Calendar, Edit, Trash2, Loader2, FileText, User, Activity, Zap, Paperclip, MessageSquare, Send, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/currency-input';
// import { TipoOperacaoSelect } from '@/components/shared/TipoOperacaoSelect'; // Replaced to fix value type
import { useTiposOperacao } from '../../hooks/useTiposOperacao';
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

// --- Interfaces & Schemas ---

import { LogMessageFormatter } from './LogMessageFormatter';
import type { ActivityLog } from '../../types/activity-log';

interface OpportunityDetailsProps {
  opportunityId: string | null;
  onNavigate: (route: string, id?: string) => void;
  onBack?: () => void;
}

interface Comment {
  id: string;
  texto: string;
  data_criacao: string;
  user_id: string;
  profiles?: { email: string; nome_completo: string }; // Join with profiles table
}

interface Attachment {
  id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
  url_storage: string;
  data_upload: string;
  uploader_id: string;
  descricao?: string; // New field
  profiles?: { email: string; nome_completo: string };
}

const editFormSchema = z.object({
  contato_id: z.string().min(1, 'Selecione um contato'),
  tipo_operacao: z.string().min(1, 'Selecione o tipo de operação'),
  valor_estimado: z.number().optional().default(0),
  responsavel_id: z.string().min(1, 'Selecione um responsável'),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

const ORIGEM_OPTIONS = [
  { value: 'Indicação', label: 'Indicação' },
  { value: 'Ads', label: 'Ads' },
  { value: 'Meta', label: 'Meta' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Google', label: 'Google' },
  { value: 'Outro', label: 'Outro' },
];

const ITEMS_PER_PAGE = 10;

// --- Main Component ---

export function OpportunityDetails({ opportunityId, onNavigate, onBack }: OpportunityDetailsProps) {
  const { etapas } = useEtapasFunil();
  const { tasks, loading: loadingTasks, createTask, loadTasksByOpportunity } = useTasks();
  const { createAgendamento } = useAgendamentos();
  const { user } = useAuth();

  // Custom Hook for Operation Types (names)
  const { tiposOperacao, loading: loadingTipos } = useTiposOperacao({
    categoria: ['EMPRESTIMO', 'VEICULO', 'IMOBILIARIO', 'CARTAO', 'OUTROS', 'EMPRESARIAL']
  });

  // Dialog States
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null); // New state
  const [newDescription, setNewDescription] = useState(''); // New state

  // Data States
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Logs Pagination
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);

  // Comments & Attachments
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Tabs & Interaction
  const [currentTab, setCurrentTab] = useState<string>('timeline');
  const [interactionType, setInteractionType] = useState<TipoTarefa>('Tarefa');

  // Schedule Form
  const [scheduleForm, setScheduleForm] = useState({
    titulo: '',
    data_vencimento: '',
    observacoes: '',
  });

  // Edit Form Link
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      contato_id: '',
      tipo_operacao: '',
      valor_estimado: 0,
      responsavel_id: '',
      origem: '',
      observacoes: '',
    }
  });

  // --- Effects ---

  useEffect(() => {
    if (opportunityId) {
      loadOpportunity();
      loadContacts();
      loadProfiles();
      loadTasksByOpportunity(opportunityId);
    }
  }, [opportunityId, loadTasksByOpportunity]);

  useEffect(() => {
    if (opportunityId) {
      if (currentTab === 'timeline') loadLogs(opportunityId, page);
      if (currentTab === 'comments') loadComments(opportunityId);
      if (currentTab === 'attachments') loadAttachments(opportunityId);
    }
  }, [opportunityId, page, currentTab]);

  // Set form values on open
  useEffect(() => {
    if (isEditDialogOpen && opportunity) {
      editForm.reset({
        contato_id: opportunity.contato_id || '',
        tipo_operacao: opportunity.tipo_acao || '', // Here we expect the Name from DB, which matches new Select behavior
        valor_estimado: opportunity.valor_estimado || 0,
        responsavel_id: opportunity.responsavel_id || '',
        origem: opportunity.origem || '',
        observacoes: opportunity.observacoes || '',
      });
    }
  }, [isEditDialogOpen, opportunity, editForm]);


  // --- Loaders ---

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

  const loadLogs = async (id: string, pageIndex: number) => {
    try {
      setLoadingLogs(true);
      const from = pageIndex * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('log_atividades')
        .select(`*, users:user_id (email), profiles:user_id(nome_completo, email)`, { count: 'exact' })
        .eq('entidade_id', id)
        .order('data_criacao', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setLogs(data as any || []);
      setHasMoreLogs(count ? (from + data.length) < count : false);
    } catch (error) {
      console.error("Error loading logs", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadComments = async (id: string) => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('comentarios_oportunidade')
        .select(`*, profiles:user_id (email, nome_completo)`)
        .eq('oportunidade_id', id)
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      setComments(data as any || []);
    } catch (error) {
      console.error("Error loading comments", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadAttachments = async (id: string) => {
    try {
      setLoadingAttachments(true);
      const { data, error } = await supabase
        .from('anexos_oportunidade')
        .select(`*, profiles:uploader_id (email, nome_completo)`)
        .eq('oportunidade_id', id)
        .order('data_upload', { ascending: false });

      if (error) throw error;
      setAttachments(data as any || []);
    } catch (error) {
      console.error("Error loading attachments", error);
    } finally {
      setLoadingAttachments(false);
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
    } catch (error: any) { console.error(error); }
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
    } catch (error: any) { console.error(error); }
  };

  // --- Handlers ---

  const onSubmitEdit = async (values: EditFormValues) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('oportunidades')
        .update({
          contato_id: values.contato_id,
          tipo_acao: values.tipo_operacao, // This is now a Name string!
          valor_estimado: values.valor_estimado,
          responsavel_id: values.responsavel_id,
          origem: values.origem,
          observacoes: values.observacoes,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', opportunityId);

      if (error) throw error;

      // Log activity (non-blocking)
      const responsavelNome = profiles.find(p => p.id === values.responsavel_id)?.nome_completo || null;
      supabase.from('log_atividades').insert({
        user_id: user?.id,
        acao: 'EDITAR_OPORTUNIDADE',
        entidade: 'oportunidades',
        entidade_id: opportunityId,
        dados_anteriores: {
          tipo_acao: opportunity?.tipo_acao,
          valor_estimado: opportunity?.valor_estimado,
          responsavel: opportunity?.responsavel?.nome_completo
        },
        dados_novos: {
          tipo_acao: values.tipo_operacao,
          valor_estimado: values.valor_estimado,
          responsavel: responsavelNome
        }
      }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

      toast.success('Oportunidade atualizada!');
      setIsEditDialogOpen(false);
      await loadOpportunity();
      setPage(0);
      loadLogs(opportunityId!, 0);

    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Erro ao atualizar');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim()) return;

    try {
      const { error } = await supabase
        .from('comentarios_oportunidade')
        .insert({
          oportunidade_id: opportunityId,
          user_id: user?.id,
          texto: newCommentText.trim()
        });

      if (error) throw error;

      // Log activity (non-blocking)
      supabase.from('log_atividades').insert({
        user_id: user?.id,
        acao: 'ADICIONAR_COMENTARIO',
        entidade: 'oportunidades',
        entidade_id: opportunityId,
        dados_anteriores: null,
        dados_novos: {
          texto: newCommentText.trim().substring(0, 100) + (newCommentText.length > 100 ? '...' : '')
        }
      }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

      setNewCommentText('');
      loadComments(opportunityId!);
      toast.success('Comentário enviado');
    } catch (error) {
      toast.error('Erro ao enviar comentário');
    }
  };

  const handleConfirmDelete = async () => {
    if (!opportunityId) return;

    setActionLoading(true);
    try {
      await supabase.from('tarefas').delete().eq('oportunidade_id', opportunityId);
      await supabase.from('log_atividades').delete().eq('entidade_id', opportunityId);
      await supabase.from('comentarios_oportunidade').delete().eq('oportunidade_id', opportunityId);
      await supabase.from('anexos_oportunidade').delete().eq('oportunidade_id', opportunityId);

      const { error } = await supabase.from('oportunidades').delete().eq('id', opportunityId);
      if (error) throw error;

      toast.success('Oportunidade excluída');
      setIsDeleteDialogOpen(false);
      onNavigate('crm');
    } catch (error: any) {
      toast.error('Erro ao excluir oportunidade');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleForm.titulo || !scheduleForm.data_vencimento) {
      toast.error('Preencha título e data');
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await createTask({
        titulo: scheduleForm.titulo,
        tipo: interactionType,
        oportunidade_id: opportunityId!,
        contato_id: opportunity?.contato_id || null,
        responsavel_id: '',
        data_vencimento: scheduleForm.data_vencimento,
        observacoes: scheduleForm.observacoes || null,
      });
      if (error) throw new Error(error);

      const startDate = new Date(scheduleForm.data_vencimento);
      const endDate = new Date(startDate.getTime() + 3600000); // 1h

      await createAgendamento({
        titulo: `[${interactionType}] ${scheduleForm.titulo}`,
        descricao: scheduleForm.observacoes || undefined,
        data_inicio: startDate.toISOString(),
        data_fim: endDate.toISOString(),
        cor: '#3D96FF',
        contato_id: opportunity?.contato_id || undefined,
        oportunidade_id: opportunityId!,
        user_id: user?.id,
      });

      // Log activity (non-blocking)
      supabase.from('log_atividades').insert({
        user_id: user?.id,
        acao: 'AGENDAR_INTERACAO',
        entidade: 'oportunidades',
        entidade_id: opportunityId,
        dados_anteriores: null,
        dados_novos: {
          tipo: interactionType,
          titulo: scheduleForm.titulo,
          data: new Date(scheduleForm.data_vencimento).toLocaleDateString('pt-BR')
        }
      }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

      toast.success('Agendado com sucesso!');
      setIsScheduleDialogOpen(false);
      setScheduleForm({ titulo: '', data_vencimento: '', observacoes: '' });
      loadTasksByOpportunity(opportunityId!);
      setPage(0);
      loadLogs(opportunityId!, 0);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao agendar');
    } finally {
      setActionLoading(false);
    }
  };

  // --- File Handlers ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !opportunityId) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máximo 10MB)');
      return;
    }

    setLoadingAttachments(true);
    try {
      const fileName = `${opportunityId}/${Date.now()}_${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('oportunidades-anexos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('oportunidades-anexos')
        .getPublicUrl(fileName);

      // Insert record in DB
      const { error: dbError } = await supabase
        .from('anexos_oportunidade')
        .insert({
          oportunidade_id: opportunityId,
          uploader_id: user?.id,
          nome_arquivo: file.name,
          tipo_arquivo: file.type,
          tamanho_bytes: file.size,
          url_storage: urlData.publicUrl
        });

      if (dbError) throw dbError;

      // Log activity
      supabase.from('log_atividades').insert({
        user_id: user?.id,
        acao: 'ANEXAR_ARQUIVO',
        entidade: 'oportunidades',
        entidade_id: opportunityId,
        dados_anteriores: null,
        dados_novos: {
          arquivo: file.name,
          tipo: file.type,
          tamanho: `${(file.size / 1024).toFixed(1)} KB`
        }
      }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

      toast.success('Arquivo anexado!');
      loadAttachments(opportunityId);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao fazer upload');
    } finally {
      setLoadingAttachments(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!opportunityId) return;

    try {
      // Extract file path from URL
      const urlParts = attachment.url_storage.split('/');
      const filePath = `${opportunityId}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage
        .from('oportunidades-anexos')
        .remove([filePath]);

      // Delete from DB
      const { error } = await supabase
        .from('anexos_oportunidade')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;

      // Log activity
      supabase.from('log_atividades').insert({
        user_id: user?.id,
        acao: 'EXCLUIR_ANEXO',
        entidade: 'oportunidades',
        entidade_id: opportunityId,
        dados_anteriores: { arquivo: attachment.nome_arquivo },
        dados_novos: null
      }).then(() => { }).catch(e => console.warn('Log activity failed:', e));

      toast.success('Anexo removido!');
      loadAttachments(opportunityId);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erro ao excluir anexo');
    }
  };

  const handleUpdateDescription = async () => {
    if (!editingAttachment) return;

    try {
      const { error } = await supabase
        .from('anexos_oportunidade')
        .update({ descricao: newDescription })
        .eq('id', editingAttachment.id);

      if (error) throw error;

      toast.success('Descrição atualizada!');
      setEditingAttachment(null);
      setNewDescription('');
      loadAttachments(opportunityId!);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Erro ao atualizar descrição');
    }
  };

  // --- Helpers ---
  const formatCurrency = (val: number | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const getEtapaLabel = () => etapas.find(e => e.id === opportunity?.etapa_funil_id)?.nome || 'Sem etapa';

  const CustomCard = ({ title, icon: Icon, children, className }: any) => (
    <div className={`bg-card-opacity text-card-foreground flex flex-col gap-6 rounded-xl py-6 shadow-none border border-slate-200 ${className}`}>
      <div className="grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 border-b-2 border-slate-100 bg-slate-50/30 px-6 pb-4 -mt-2">
        <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          {title}
        </div>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (!opportunity) return <div className="p-8 text-slate-500">Oportunidade não encontrada</div>;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => onBack ? onBack() : onNavigate('crm')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => onNavigate('triagem')}>
              <Zap className="w-4 h-4" /> Análise Prévia
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="w-4 h-4" /> Editar
            </Button>
            <Button variant="destructive" className="gap-2" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4" /> Excluir
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card-opacity dark:bg-gray-900 p-4 rounded-xl border border-slate-200 shadow-none">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{opportunity.titulo}</h1>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">{getEtapaLabel()}</Badge>
              {opportunity.tipo_acao && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200">{opportunity.tipo_acao}</Badge>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Valor Estimado</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(opportunity.valor_estimado)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <CustomCard title="Detalhes do Contato" icon={User}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{opportunity.contatos?.nome_completo || 'Sem contato'}</p>
                <p className="text-xs text-gray-500">{opportunity.contatos?.email || 'Sem email'}</p>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-gray-800">
              <div>
                <span className="text-xs text-slate-500 block">CPF/CNPJ</span>
                <span className="text-sm text-slate-700">{opportunity.contatos?.cpf_cnpj || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Telefone</span>
                <span className="text-sm text-slate-700">{opportunity.contatos?.telefone_principal || '-'}</span>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Descrição da Oportunidade" icon={FileText}>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block">Etapa Atual</span>
                <span className="text-sm font-medium text-slate-700">{getEtapaLabel()}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Operação de Interesse</span>
                <span className="text-sm text-slate-700">{opportunity.tipo_acao || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Responsável</span>
                <div className="flex items-center gap-2 mt-1">
                  {opportunity.responsavel?.avatar_url ? (
                    <img src={opportunity.responsavel.avatar_url} className="w-5 h-5 rounded-full" alt="Avatar" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">R</div>
                  )}
                  <span className="text-sm text-slate-700">{opportunity.responsavel?.nome_completo || 'Não atribuído'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Origem</span>
                <span className="text-sm text-slate-700">{opportunity.origem || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Data de Criação</span>
                <span className="text-sm text-slate-700">{new Date(opportunity.data_criacao).toLocaleDateString()}</span>
              </div>
              {opportunity.observacoes && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Observações</span>
                  <div className="text-sm bg-slate-50 dark:bg-gray-800 p-2 rounded text-slate-600 dark:text-gray-300">
                    {opportunity.observacoes}
                  </div>
                </div>
              )}
            </div>
          </CustomCard>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1 rounded-lg">
              <TabsTrigger value="timeline" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Activity className="w-4 h-4" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MessageSquare className="w-4 h-4" /> Comentários
              </TabsTrigger>
              <TabsTrigger value="attachments" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Paperclip className="w-4 h-4" /> Anexos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              {/* Timeline Content */}
              <div className="bg-card-opacity rounded-xl border border-slate-200 shadow-none overflow-hidden">
                <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" /> Histórico
                  </h3>
                  <span className="text-xs text-slate-400">Pág. {page + 1}</span>
                </div>
                {loadingLogs ? <div className="p-8 text-center"><Loader2 className="animate-spin inline" /></div> :
                  logs.length === 0 ? <div className="p-8 text-center text-slate-400">Nenhuma atividade.</div> :
                    <div>
                      <ul className="divide-y divide-slate-100">
                        {logs.map(log => {
                          const displayName = log.profiles?.nome_completo || log.users?.email || 'Sistema';
                          return (
                            <li key={log.id} className="p-4 hover:bg-slate-50">
                              <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                                  {displayName.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <p className="text-sm text-slate-900"><span className="font-medium">{displayName}</span></p>
                                    <span className="text-[10px] text-slate-400">{new Date(log.data_criacao).toLocaleString()}</span>
                                  </div>
                                  <div className="mt-1">
                                    <LogMessageFormatter log={log} />
                                  </div>
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/30 border-t border-slate-100">
                        <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Anterior</Button>
                        <Button size="sm" variant="ghost" disabled={!hasMoreLogs} onClick={() => setPage(p => p + 1)}>Próximo <ChevronRight className="w-4 h-4 ml-1" /></Button>
                      </div>
                    </div>
                }
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Escreva um comentário..."
                    className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" className="gap-2" onClick={handlePostComment} disabled={!newCommentText.trim()}>
                      <Send className="w-3 h-3" /> Enviar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {loadingComments ? <Loader2 className="mx-auto animate-spin" /> :
                  comments.length === 0 ? <p className="text-center text-slate-400 py-4">Nenhum comentário.</p> :
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {(comment.profiles?.nome_completo || comment.profiles?.email || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-xs font-semibold text-slate-700">{comment.profiles?.nome_completo || comment.profiles?.email}</span>
                            <span className="text-xs text-slate-400">{new Date(comment.data_criacao).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{comment.texto}</p>
                        </div>
                      </div>
                    ))
                }
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <div className="bg-card-opacity rounded-xl border border-slate-200 p-6 text-center">
                <label className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    disabled={loadingAttachments}
                  />
                  {loadingAttachments ? (
                    <Loader2 className="w-10 h-10 text-slate-300 mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-slate-300 mb-2" />
                  )}
                  <p className="text-sm font-medium text-slate-700">Clique para fazer upload</p>
                  <p className="text-xs text-slate-500">PDF, Word, Excel, Imagens (máx. 10MB)</p>
                </label>

                <div className="mt-6 text-left">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 px-2">Arquivos Anexados</h3>
                  {loadingAttachments ? <Loader2 className="mx-auto animate-spin" /> :
                    attachments.length === 0 ? <p className="text-sm text-slate-400 px-2">Nenhum anexo encontrado.</p> :
                      <ul className="space-y-2">
                        {attachments.map(att => (
                          <li key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-indigo-500" />
                              <div>
                                <p className="text-sm font-medium text-slate-700">{att.nome_arquivo}</p>
                                {att.descricao && <p className="text-xs text-slate-500 italic">"{att.descricao}"</p>}
                                <p className="text-xs text-slate-400">{(att.tamanho_bytes / 1024).toFixed(1)} KB • {new Date(att.data_upload).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                onClick={() => window.open(att.url_storage, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                onClick={() => {
                                  setEditingAttachment(att);
                                  setNewDescription(att.descricao || '');
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                onClick={() => handleDeleteAttachment(att)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                  }
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (Actions) */}
        <div className="lg:col-span-1 space-y-6">
          <CustomCard title="Próximas Interações" icon={Calendar}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">Agendamentos futuros</p>
              <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-slate-100 rounded-full">
                    <Edit className="w-3 h-3 text-slate-400" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Agendar Interação</DialogTitle>
                    <DialogDescription>Crie uma nova tarefa, follow-up ou reunião para esta oportunidade.</DialogDescription>
                  </DialogHeader>
                  <Tabs value={interactionType} onValueChange={(v) => setInteractionType(v as TipoTarefa)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="Tarefa">Tarefa</TabsTrigger>
                      <TabsTrigger value="Follow-up">Follow-up</TabsTrigger>
                      <TabsTrigger value="Reunião">Reunião</TabsTrigger>
                    </TabsList>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input value={scheduleForm.titulo} onChange={e => setScheduleForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Ligar..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Data e Hora</Label>
                        <Input type="datetime-local" value={scheduleForm.data_vencimento} onChange={e => setScheduleForm(p => ({ ...p, data_vencimento: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea value={scheduleForm.observacoes} onChange={e => setScheduleForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Detalhes" />
                      </div>
                    </div>
                  </Tabs>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSchedule} disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : 'Agendar'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingTasks ? <Loader2 className="mx-auto animate-spin" /> :
              tasks.length === 0 ? <div className="text-center py-4 text-xs text-slate-400 border border-dashed rounded-lg">Sem agendamentos.</div> :
                <div className="space-y-3">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-lg transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className={`${getTipoColor(task.tipo)} text-[10px] h-5 border-0 font-medium`}>{task.tipo}</Badge>
                        <span className="text-[10px] text-slate-400">{new Date(task.data_vencimento!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{task.titulo}</p>
                    </div>
                  ))}
                  <Button variant="link" size="sm" className="w-full text-xs text-slate-500 h-6">Ver todas</Button>
                </div>
            }
            <Button className="w-full mt-4 bg-slate-900 text-white" size="sm" onClick={() => setIsScheduleDialogOpen(true)}>
              Agendar Nova
            </Button>
          </CustomCard>
        </div>

      </div>

      {/* --- EDIT DIALOG (REFACTORED) --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Oportunidade</DialogTitle>
            <DialogDescription>Atualize os dados da oportunidade</DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4 py-4">

              <div className="grid grid-cols-2 gap-4">
                {/* Contact */}
                <div className="col-span-2">
                  <FormField
                    control={editForm.control}
                    name="contato_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                          <SelectContent>{contacts.map(c => (<SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Operation */}
                <div className="col-span-1">
                  <FormField
                    control={editForm.control}
                    name="tipo_operacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto / Operação</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full" disabled={loadingTipos}>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Fallback option if current value is not in list (legacy data) */}
                            {field.value && !tiposOperacao.some(t => t.nome === field.value) && (
                              <SelectItem value={field.value}>{field.value}</SelectItem>
                            )}
                            {tiposOperacao.map(t => (
                              <SelectItem key={t.codigo} value={t.nome}>{t.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Value */}
                <div className="col-span-1">
                  <FormField
                    control={editForm.control}
                    name="valor_estimado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado</FormLabel>
                        <FormControl>
                          <CurrencyInput className="w-full" value={field.value} onChange={(v) => field.onChange(v || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Responsible */}
                <div className="col-span-1">
                  <FormField
                    control={editForm.control}
                    name="responsavel_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Responsável" /></SelectTrigger></FormControl>
                          <SelectContent>{profiles.map(p => (<SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Origin */}
                <div className="col-span-1">
                  <FormField
                    control={editForm.control}
                    name="origem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Origem" /></SelectTrigger></FormControl>
                          <SelectContent>{ORIGEM_OPTIONS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Observations */}
                <div className="col-span-2">
                  <FormField
                    control={editForm.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="resize-none h-24 w-full" placeholder="Detalhes..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>Cancelar</Button>
                <Button type="submit" disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}</Button>
              </DialogFooter>
            </form>
          </Form>

        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir?</AlertDialogTitle>
            <AlertDialogDescription>Ação irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Attachment Description Dialog */}
      <Dialog open={!!editingAttachment} onOpenChange={(open) => {
        if (!open) {
          setEditingAttachment(null);
          setNewDescription('');
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Descrição</DialogTitle>
            <DialogDescription>
              Adicione uma descrição para manter o histórico organizado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição do Anexo</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ex: Comprovante de renda atualizado..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAttachment(null)}>Cancelar</Button>
            <Button onClick={handleUpdateDescription}>Salvar Descrição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}