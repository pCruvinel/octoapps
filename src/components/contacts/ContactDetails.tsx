'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  Loader2,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { useAuth } from '../../hooks/useAuth';
import type { Contact } from '../../types/contact';
import { ContactFormDialog } from './ContactFormDialog';

interface ContactDetailsProps {
  contactId: string | null;
  onNavigate: (route: string, id?: string) => void;
}

export function ContactDetails({ contactId, onNavigate }: ContactDetailsProps) {
  const { etapas, loading: loadingEtapas } = useEtapasFunil();
  const { user, profile } = useAuth();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newOppDialogOpen, setNewOppDialogOpen] = useState(false);
  const [editOppDialogOpen, setEditOppDialogOpen] = useState(false);
  const [deleteOppDialogOpen, setDeleteOppDialogOpen] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOpportunity, setCreatingOpportunity] = useState(false);
  const [updatingOpportunity, setUpdatingOpportunity] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');

  const [newOpportunity, setNewOpportunity] = useState({
    titulo: '',
    tipo_acao: '',
    valor_estimado: '',
    etapa_funil_id: '',
    responsavel_id: '',
    origem: '',
  });

  const [editOpportunity, setEditOpportunity] = useState({
    titulo: '',
    tipo_acao: '',
    valor_estimado: '',
    etapa_funil_id: '',
    responsavel_id: '',
    origem: '',
  });

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (contactId) {
      loadContact();
      loadOpportunities();
    }
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      setContact(data);
      setNotes(data?.observacoes || '');
    } catch (error) {
      console.error('Error loading contact:', error);
      toast.error('Erro ao carregar contato');
      onNavigate('contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunities = async () => {
    try {
      setLoadingOpportunities(true);
      const { data, error } = await supabase
        .from('oportunidades')
        .select(`
          *,
          etapa_funil:etapa_funil_id (id, nome, cor),
          responsavel:responsavel_id (id, nome_completo)
        `)
        .eq('contato_id', contactId)
        .eq('ativo', true)
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      toast.error('Erro ao carregar oportunidades');
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const handleDeleteContact = async () => {
    try {
      if (!contactId) return;

      const { error } = await supabase
        .from('contatos')
        .update({ ativo: false })
        .eq('id', contactId);

      if (error) throw error;

      toast.success('Contato excluído com sucesso!');
      setDeleteDialogOpen(false);
      onNavigate('contacts');
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      toast.error('Erro ao excluir contato');
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const { error } = await supabase
        .from('contatos')
        .update({ observacoes: notes })
        .eq('id', contactId);

      if (error) throw error;
      toast.success('Observações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar observações');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteOpportunity = async () => {
    try {
      if (!selectedOppId) return;

      const { error } = await supabase
        .from('oportunidades')
        .update({ ativo: false })
        .eq('id', selectedOppId);

      if (error) throw error;

      toast.success('Oportunidade excluída com sucesso!');
      setDeleteOppDialogOpen(false);
      setSelectedOppId(null);
      await loadOpportunities();
    } catch (error) {
      console.error('Erro ao excluir oportunidade:', error);
      toast.error('Erro ao excluir oportunidade');
    }
  };

  const handleEditOpportunity = async () => {
    try {
      if (!selectedOppId) return;

      if (!editOpportunity.titulo.trim()) {
        toast.error('Informe o título da oportunidade');
        return;
      }

      if (!editOpportunity.etapa_funil_id) {
        toast.error('Selecione a etapa do funil');
        return;
      }

      setUpdatingOpportunity(true);

      const opportunityData: any = {
        titulo: editOpportunity.titulo.trim(),
        etapa_funil_id: editOpportunity.etapa_funil_id,
        responsavel_id: editOpportunity.responsavel_id || user?.id,
      };

      if (editOpportunity.tipo_acao) opportunityData.tipo_acao = editOpportunity.tipo_acao;
      if (editOpportunity.valor_estimado) opportunityData.valor_estimado = parseFloat(editOpportunity.valor_estimado);
      if (editOpportunity.origem) opportunityData.origem = editOpportunity.origem;

      const { error } = await supabase
        .from('oportunidades')
        .update(opportunityData)
        .eq('id', selectedOppId);

      if (error) throw error;

      toast.success('Oportunidade atualizada!');
      setEditOppDialogOpen(false);
      setSelectedOppId(null);
      await loadOpportunities();
    } catch (error) {
      console.error('Erro ao atualizar oportunidade:', error);
      toast.error('Erro ao atualizar oportunidade');
    } finally {
      setUpdatingOpportunity(false);
    }
  };

  const handleCreateOpportunity = async () => {
    try {
      if (!newOpportunity.titulo.trim()) {
        toast.error('Informe o título da oportunidade');
        return;
      }

      if (!newOpportunity.etapa_funil_id) {
        toast.error('Selecione a etapa do funil');
        return;
      }

      setCreatingOpportunity(true);

      const opportunityData: any = {
        titulo: newOpportunity.titulo.trim(),
        etapa_funil_id: newOpportunity.etapa_funil_id,
        responsavel_id: newOpportunity.responsavel_id || user?.id,
        contato_id: contactId,
        criado_por: user?.id,
      };

      if (newOpportunity.tipo_acao) opportunityData.tipo_acao = newOpportunity.tipo_acao;
      if (newOpportunity.valor_estimado) opportunityData.valor_estimado = parseFloat(newOpportunity.valor_estimado);
      if (newOpportunity.origem) opportunityData.origem = newOpportunity.origem;

      const { error } = await supabase
        .from('oportunidades')
        .insert(opportunityData);

      if (error) throw error;

      toast.success('Oportunidade criada!');
      setNewOpportunity({ titulo: '', tipo_acao: '', valor_estimado: '', etapa_funil_id: '', responsavel_id: '', origem: '' });
      setNewOppDialogOpen(false);
      await loadOpportunities();
    } catch (error) {
      console.error('Erro ao criar oportunidade:', error);
      toast.error('Erro ao criar oportunidade');
    } finally {
      setCreatingOpportunity(false);
    }
  };

  const openEditOppDialog = (oppId: string) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (opp) {
      setSelectedOppId(oppId);
      setEditOpportunity({
        titulo: opp.titulo || '',
        tipo_acao: opp.tipo_acao || '',
        valor_estimado: opp.valor_estimado?.toString() || '',
        etapa_funil_id: opp.etapa_funil_id || '',
        responsavel_id: opp.responsavel_id || '',
        origem: opp.origem || '',
      });
      setEditOppDialogOpen(true);
    }
  };

  // Helpers
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const formatCurrency = (value: number | null) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR');

  const totalOportunidades = opportunities.length;
  const valorTotal = opportunities.reduce((acc, opp) => acc + (opp.valor_estimado || 0), 0);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Not found
  if (!contact) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Contato não encontrado</p>
          <Button onClick={() => onNavigate('contacts')}>Voltar para Contatos</Button>
        </div>
      </div>
    );
  }

  const isPJ = contact.tipo === 'Pessoa Jurídica';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => onNavigate('contacts')} className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Contatos
        </Button>

        {/* Header Card */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarFallback className={`text-2xl ${isPJ ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                  {isPJ ? <Building2 className="w-8 h-8" /> : getInitials(contact.nome_completo)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{contact.nome_completo}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </span>
                      )}
                      {contact.telefone_principal && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {contact.telefone_principal}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={contact.categoria_contato === 'CLIENTE' ? 'default' : contact.categoria_contato === 'LEAD' ? 'secondary' : 'outline'}>
                        {contact.categoria_contato === 'LEAD' ? 'Lead' : contact.categoria_contato === 'CLIENTE' ? 'Cliente' : 'Ex-Cliente'}
                      </Badge>
                      <Badge variant="outline">{isPJ ? 'PJ' : 'PF'}</Badge>
                      <span className="text-xs text-slate-400">
                        Criado em {formatDate(contact.data_criacao)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setEditDialogOpen(true)}>
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Tabs */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dados" className="gap-2">
                      <User className="w-4 h-4" />
                      Dados
                    </TabsTrigger>
                    <TabsTrigger value="oportunidades" className="gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Oportunidades
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="gap-2">
                      <Clock className="w-4 h-4" />
                      Histórico
                    </TabsTrigger>
                    <TabsTrigger value="notas" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Notas
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Tab: Dados */}
                  <TabsContent value="dados" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900">Informações Pessoais</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-slate-500">Tipo</span>
                            <p className="text-slate-900">{contact.tipo || 'Não informado'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500">{isPJ ? 'CNPJ' : 'CPF'}</span>
                            <p className="text-slate-900 font-mono">{contact.cpf_cnpj || '-'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500">E-mail</span>
                            <p className="text-slate-900">{contact.email || '-'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500">Telefone Principal</span>
                            <p className="text-slate-900">{contact.telefone_principal || '-'}</p>
                          </div>
                          {contact.telefone_secundario && (
                            <div>
                              <span className="text-sm text-slate-500">Telefone Secundário</span>
                              <p className="text-slate-900">{contact.telefone_secundario}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900">Endereço</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-slate-500">Logradouro</span>
                            <p className="text-slate-900">{contact.endereco || '-'} {contact.numero ? `, ${contact.numero}` : ''}</p>
                          </div>
                          {contact.complemento && (
                            <div>
                              <span className="text-sm text-slate-500">Complemento</span>
                              <p className="text-slate-900">{contact.complemento}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-sm text-slate-500">Bairro</span>
                            <p className="text-slate-900">{contact.bairro || '-'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500">Cidade/Estado</span>
                            <p className="text-slate-900">{contact.cidade || '-'} {contact.estado ? `- ${contact.estado}` : ''}</p>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500">CEP</span>
                            <p className="text-slate-900 font-mono">{contact.cep || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab: Oportunidades */}
                  <TabsContent value="oportunidades" className="mt-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">Oportunidades Vinculadas</h3>
                      <Button className="gap-2" onClick={() => setNewOppDialogOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Nova Oportunidade
                      </Button>
                    </div>

                    {loadingOpportunities ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      </div>
                    ) : opportunities.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        Nenhuma oportunidade vinculada
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Título</TableHead>
                              <TableHead>Etapa</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Responsável</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {opportunities.map(opp => (
                              <TableRow key={opp.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onNavigate('opportunity-details', opp.id)}>
                                <TableCell className="font-medium">{opp.titulo}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" style={{ backgroundColor: opp.etapa_funil?.cor + '20', borderColor: opp.etapa_funil?.cor }}>
                                    {opp.etapa_funil?.nome || 'Sem etapa'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-green-600 font-medium">
                                  {opp.valor_estimado ? formatCurrency(opp.valor_estimado) : '-'}
                                </TableCell>
                                <TableCell>{opp.responsavel?.nome_completo || '-'}</TableCell>
                                <TableCell onClick={e => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="p-1 hover:bg-slate-100 rounded">
                                        <MoreVertical className="w-4 h-4 text-slate-400" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => onNavigate('opportunity-details', opp.id)}>Ver</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openEditOppDialog(opp.id)}>Editar</DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedOppId(opp.id); setDeleteOppDialogOpen(true); }}>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab: Histórico */}
                  <TabsContent value="historico" className="mt-0">
                    <h3 className="font-semibold text-slate-900 mb-4">Histórico de Atividades</h3>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                        <div>
                          <p className="text-slate-900">Contato criado</p>
                          <p className="text-sm text-slate-500">{formatDate(contact.data_criacao)}</p>
                        </div>
                      </div>
                      {contact.data_atualizacao && contact.data_atualizacao !== contact.data_criacao && (
                        <div className="flex gap-4">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0" />
                          <div>
                            <p className="text-slate-900">Última atualização</p>
                            <p className="text-sm text-slate-500">{formatDate(contact.data_atualizacao)}</p>
                          </div>
                        </div>
                      )}
                      {opportunities.map(opp => (
                        <div key={opp.id} className="flex gap-4">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0" />
                          <div>
                            <p className="text-slate-900">Oportunidade criada: {opp.titulo}</p>
                            <p className="text-sm text-slate-500">{formatDate(opp.data_criacao)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Tab: Notas */}
                  <TabsContent value="notas" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Observações</h3>
                        <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
                          {savingNotes ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Salvar
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Adicione observações sobre este contato..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={8}
                        className="resize-none"
                      />
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{totalOportunidades}</p>
                    <p className="text-sm text-slate-500">Oportunidades</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(valorTotal)}</p>
                    <p className="text-sm text-slate-500">Valor Total</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formatDate(contact.data_atualizacao || contact.data_criacao)}</p>
                    <p className="text-sm text-slate-500">Última Atualização</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setNewOppDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Nova Oportunidade
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="w-4 h-4" />
                  Editar Contato
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Contact Dialog - Using ContactFormDialog */}
      <ContactFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contact={contact}
        onSuccess={loadContact}
      />

      {/* Delete Contact Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{contact.nome_completo}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Opportunity Dialog */}
      <AlertDialog open={deleteOppDialogOpen} onOpenChange={setDeleteOppDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oportunidade</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta oportunidade?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOpportunity} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Opportunity Dialog */}
      <Dialog open={editOppDialogOpen} onOpenChange={setEditOppDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Oportunidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={editOpportunity.titulo} onChange={(e) => setEditOpportunity({ ...editOpportunity, titulo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Ação</Label>
              <Select value={editOpportunity.tipo_acao} onValueChange={(v) => setEditOpportunity({ ...editOpportunity, tipo_acao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" value={editOpportunity.valor_estimado} onChange={(e) => setEditOpportunity({ ...editOpportunity, valor_estimado: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Etapa do Funil *</Label>
              <Select value={editOpportunity.etapa_funil_id} onValueChange={(v) => setEditOpportunity({ ...editOpportunity, etapa_funil_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {etapas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOppDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditOpportunity} disabled={updatingOpportunity}>
              {updatingOpportunity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Opportunity Dialog */}
      <Dialog open={newOppDialogOpen} onOpenChange={setNewOppDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={newOpportunity.titulo} onChange={(e) => setNewOpportunity({ ...newOpportunity, titulo: e.target.value })} placeholder="Ex: Revisional Bancário" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Ação</Label>
              <Select value={newOpportunity.tipo_acao} onValueChange={(v) => setNewOpportunity({ ...newOpportunity, tipo_acao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" value={newOpportunity.valor_estimado} onChange={(e) => setNewOpportunity({ ...newOpportunity, valor_estimado: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Etapa do Funil *</Label>
              <Select value={newOpportunity.etapa_funil_id} onValueChange={(v) => setNewOpportunity({ ...newOpportunity, etapa_funil_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {etapas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Input value={newOpportunity.origem} onChange={(e) => setNewOpportunity({ ...newOpportunity, origem: e.target.value })} placeholder="Ex: Indicação, Website" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOppDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOpportunity} disabled={creatingOpportunity}>
              {creatingOpportunity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}