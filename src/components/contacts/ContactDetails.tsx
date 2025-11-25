import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Edit, Trash2, Plus, MoreVertical, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useEtapasFunil } from '../../hooks/useEtapasFunil';
import { useAuth } from '../../hooks/useAuth';
import type { Contact } from '../../types/contact';

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
          etapa_funil:etapa_funil_id (
            id,
            nome,
            cor
          ),
          responsavel:responsavel_id (
            id,
            nome_completo
          )
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

  const handleEditContact = () => {
    toast.success('Contato atualizado com sucesso!');
    setEditDialogOpen(false);
  };

  const handleDeleteContact = async () => {
    try {
      if (!contactId) return;

      // Soft delete (marcar como inativo)
      const { error } = await supabase
        .from('contatos')
        .update({ ativo: false })
        .eq('id', contactId);

      if (error) throw error;

      toast.success('Contato excluído com sucesso!');
      setDeleteDialogOpen(false);

      // Navegar de volta para a lista de contatos
      onNavigate('contacts');
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      toast.error('Erro ao excluir contato. Tente novamente.');
    }
  };

  const handleDeleteOpportunity = async () => {
    try {
      if (!selectedOppId) return;

      // Soft delete (marcar como inativo)
      const { error } = await supabase
        .from('oportunidades')
        .update({ ativo: false })
        .eq('id', selectedOppId);

      if (error) throw error;

      toast.success('Oportunidade excluída com sucesso!');
      setDeleteOppDialogOpen(false);
      setSelectedOppId(null);

      // Recarregar oportunidades
      await loadOpportunities();
    } catch (error) {
      console.error('Erro ao excluir oportunidade:', error);
      toast.error('Erro ao excluir oportunidade. Tente novamente.');
    }
  };

  const handleEditOpportunity = async () => {
    try {
      if (!selectedOppId) return;

      // Validação
      if (!editOpportunity.titulo.trim()) {
        toast.error('Por favor, informe o título da oportunidade');
        return;
      }

      if (!editOpportunity.etapa_funil_id) {
        toast.error('Por favor, selecione a etapa do funil');
        return;
      }

      if (!editOpportunity.responsavel_id) {
        toast.error('Por favor, selecione o responsável');
        return;
      }

      setUpdatingOpportunity(true);

      // Preparar dados para atualização
      const opportunityData: any = {
        titulo: editOpportunity.titulo.trim(),
        etapa_funil_id: editOpportunity.etapa_funil_id,
        responsavel_id: editOpportunity.responsavel_id,
      };

      // Adicionar campos opcionais se preenchidos
      if (editOpportunity.tipo_acao) {
        opportunityData.tipo_acao = editOpportunity.tipo_acao;
      }

      if (editOpportunity.valor_estimado && parseFloat(editOpportunity.valor_estimado) > 0) {
        opportunityData.valor_estimado = parseFloat(editOpportunity.valor_estimado);
      }

      if (editOpportunity.origem) {
        opportunityData.origem = editOpportunity.origem;
      }

      // Atualizar oportunidade no Supabase
      const { error } = await supabase
        .from('oportunidades')
        .update(opportunityData)
        .eq('id', selectedOppId);

      if (error) throw error;

      toast.success('Oportunidade atualizada com sucesso!');

      // Fechar dialog
      setEditOppDialogOpen(false);
      setSelectedOppId(null);

      // Recarregar oportunidades
      await loadOpportunities();
    } catch (error) {
      console.error('Erro ao atualizar oportunidade:', error);
      toast.error('Erro ao atualizar oportunidade. Tente novamente.');
    } finally {
      setUpdatingOpportunity(false);
    }
  };

  const openDeleteOppDialog = (oppId: string) => {
    setSelectedOppId(oppId);
    setDeleteOppDialogOpen(true);
  };

  const openEditOppDialog = (oppId: string) => {
    setSelectedOppId(oppId);
    const opp = opportunities.find(o => o.id === oppId);
    if (opp) {
      setEditOpportunity({
        titulo: opp.titulo || '',
        tipo_acao: opp.tipo_acao || '',
        valor_estimado: opp.valor_estimado?.toString() || '',
        etapa_funil_id: opp.etapa_funil_id || '',
        responsavel_id: opp.responsavel_id || '',
        origem: opp.origem || '',
      });
    }
    setEditOppDialogOpen(true);
  };

  const getSelectedOpportunity = () => {
    return opportunities.find(opp => opp.id === selectedOppId);
  };

  const handleCreateOpportunity = async () => {
    try {
      // Validação
      if (!newOpportunity.titulo.trim()) {
        toast.error('Por favor, informe o título da oportunidade');
        return;
      }

      if (!newOpportunity.etapa_funil_id) {
        toast.error('Por favor, selecione a etapa do funil');
        return;
      }

      if (!newOpportunity.responsavel_id) {
        toast.error('Por favor, selecione o responsável');
        return;
      }

      setCreatingOpportunity(true);

      // Preparar dados para inserção
      const opportunityData: any = {
        titulo: newOpportunity.titulo.trim(),
        etapa_funil_id: newOpportunity.etapa_funil_id,
        responsavel_id: newOpportunity.responsavel_id,
        contato_id: contactId,
        criado_por: user?.id,
      };

      // Adicionar campos opcionais se preenchidos
      if (newOpportunity.tipo_acao) {
        opportunityData.tipo_acao = newOpportunity.tipo_acao;
      }

      if (newOpportunity.valor_estimado && parseFloat(newOpportunity.valor_estimado) > 0) {
        opportunityData.valor_estimado = parseFloat(newOpportunity.valor_estimado);
      }

      if (newOpportunity.origem) {
        opportunityData.origem = newOpportunity.origem;
      }

      // Criar oportunidade no Supabase
      const { data, error } = await supabase
        .from('oportunidades')
        .insert(opportunityData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Oportunidade criada com sucesso!');

      // Limpar formulário
      setNewOpportunity({
        titulo: '',
        tipo_acao: '',
        valor_estimado: '',
        etapa_funil_id: '',
        responsavel_id: '',
        origem: '',
      });

      // Fechar dialog
      setNewOppDialogOpen(false);

      // Recarregar oportunidades
      await loadOpportunities();
    } catch (error) {
      console.error('Erro ao criar oportunidade:', error);
      toast.error('Erro ao criar oportunidade. Tente novamente.');
    } finally {
      setCreatingOpportunity(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Contato não encontrado</p>
          <Button onClick={() => onNavigate('contacts')} className="mt-4">
            Voltar para Contatos
          </Button>
        </div>
      </div>
    );
  }

  const formatAddress = () => {
    const parts = [
      contact.endereco,
      contact.numero,
      contact.bairro,
      contact.cidade,
      contact.estado
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => onNavigate('contacts')}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Contatos
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-white mb-2">{contact.nome_completo}</h1>
            <Badge variant={
              contact.status_contato === 'Ativo' || contact.status_contato === 'Cliente'
                ? 'default'
                : 'secondary'
            }>
              {contact.status_contato}
            </Badge>
          </div>
          <Button variant="destructive" className="gap-2" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tipo</div>
              <div className="text-gray-900 dark:text-white">{contact.tipo}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">CPF/CNPJ</div>
              <div className="text-gray-900 dark:text-white">{contact.cpf_cnpj || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">E-mail</div>
              <div className="text-gray-900 dark:text-white">{contact.email || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Telefone Principal</div>
              <div className="text-gray-900 dark:text-white">{contact.telefone_principal || '-'}</div>
            </div>
            {contact.telefone_secundario && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Telefone Secundário</div>
                <div className="text-gray-900 dark:text-white">{contact.telefone_secundario}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Endereço</div>
              <div className="text-gray-900 dark:text-white">{formatAddress()}</div>
            </div>
            {contact.observacoes && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Observações</div>
                <div className="text-gray-900 dark:text-white">{contact.observacoes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 dark:text-white">Oportunidades Vinculadas</h2>
          <Button className="gap-2" onClick={() => setNewOppDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nova Oportunidade
          </Button>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {loadingOpportunities ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma oportunidade vinculada a este contato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map(opp => (
                  <TableRow key={opp.id}>
                    <TableCell className="text-gray-900 dark:text-white font-medium">{opp.titulo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ backgroundColor: opp.etapa_funil?.cor + '20', borderColor: opp.etapa_funil?.cor }}>
                        {opp.etapa_funil?.nome || 'Sem etapa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-600 dark:text-green-400">
                      {opp.valor_estimado ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.valor_estimado) : '-'}
                    </TableCell>
                    <TableCell>{opp.responsavel?.nome_completo || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate('opportunity-details', opp.id)}>
                            Ver Processo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditOppDialog(opp.id)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => openDeleteOppDialog(opp.id)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
            <DialogDescription>
              Atualize as informações do contato.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={contact.name} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" value={contact.cpf} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={contact.email} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={contact.phone} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={contact.address} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status">Status</Label>
              <Select value={contact.status} onValueChange={(value) => {}}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleEditContact}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Opportunity Dialog */}
      <AlertDialog open={deleteOppDialogOpen} onOpenChange={setDeleteOppDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oportunidade</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOppDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOpportunity} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Opportunity Dialog */}
      <Dialog open={editOppDialogOpen} onOpenChange={setEditOppDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Oportunidade</DialogTitle>
            <DialogDescription>
              Atualize os dados da oportunidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_titulo">Título da Oportunidade</Label>
              <Input
                id="edit_titulo"
                placeholder="Ex: Proposta de Consultoria"
                value={editOpportunity.titulo}
                onChange={(e) => setEditOpportunity({ ...editOpportunity, titulo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_tipo_acao">Tipo de Ação</Label>
              <Select
                value={editOpportunity.tipo_acao}
                onValueChange={(value) => setEditOpportunity({ ...editOpportunity, tipo_acao: value })}
              >
                <SelectTrigger>
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
              <Label htmlFor="edit_valor_estimado">Valor Estimado (R$)</Label>
              <Input
                id="edit_valor_estimado"
                type="number"
                placeholder="0.00"
                value={editOpportunity.valor_estimado}
                onChange={(e) => setEditOpportunity({ ...editOpportunity, valor_estimado: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_etapa">Etapa do Funil</Label>
              <Select
                value={editOpportunity.etapa_funil_id}
                onValueChange={(value) => setEditOpportunity({ ...editOpportunity, etapa_funil_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {loadingEtapas ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    etapas.map((etapa) => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_responsavel">Responsável</Label>
              <Select
                value={editOpportunity.responsavel_id}
                onValueChange={(value) => setEditOpportunity({ ...editOpportunity, responsavel_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {user && (
                    <SelectItem value={user.id}>
                      {profile?.nome_completo || user.email}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_origem">Origem</Label>
              <Input
                id="edit_origem"
                value={editOpportunity.origem}
                onChange={(e) => setEditOpportunity({ ...editOpportunity, origem: e.target.value })}
                placeholder="Ex: Indicação, Website, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditOppDialogOpen(false);
                setSelectedOppId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleEditOpportunity}
              disabled={updatingOpportunity}
            >
              {updatingOpportunity ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Opportunity Dialog */}
      <Dialog open={newOppDialogOpen} onOpenChange={setNewOppDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova oportunidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Oportunidade</Label>
              <Input
                id="titulo"
                placeholder="Ex: Proposta de Consultoria"
                value={newOpportunity.titulo}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, titulo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_acao">Tipo de Ação</Label>
              <Select
                value={newOpportunity.tipo_acao}
                onValueChange={(value) => setNewOpportunity({ ...newOpportunity, tipo_acao: value })}
              >
                <SelectTrigger>
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
              <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
              <Input
                id="valor_estimado"
                type="number"
                placeholder="0.00"
                value={newOpportunity.valor_estimado}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, valor_estimado: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="etapa">Etapa do Funil</Label>
              <Select
                value={newOpportunity.etapa_funil_id}
                onValueChange={(value) => setNewOpportunity({ ...newOpportunity, etapa_funil_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {loadingEtapas ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    etapas.map((etapa) => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Select
                value={newOpportunity.responsavel_id}
                onValueChange={(value) => setNewOpportunity({ ...newOpportunity, responsavel_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {user && (
                    <SelectItem value={user.id}>
                      {profile?.nome_completo || user.email}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem</Label>
              <Input
                id="origem"
                value={newOpportunity.origem}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, origem: e.target.value })}
                placeholder="Ex: Indicação, Website, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewOppDialogOpen(false);
                setNewOpportunity({
                  titulo: '',
                  tipo_acao: '',
                  valor_estimado: '',
                  etapa_funil_id: '',
                  responsavel_id: '',
                  origem: '',
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateOpportunity}
              disabled={creatingOpportunity}
            >
              {creatingOpportunity ? (
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
  );
}