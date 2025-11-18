import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, MoreVertical, User, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import InputMask from 'react-input-mask';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Contact } from '../../types/contact';

interface ContactsListProps {
  onNavigate: (route: string, id?: string) => void;
}

export function ContactsList({ onNavigate }: ContactsListProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [newContact, setNewContact] = useState({
    name: '',
    cpfCnpj: '',
    email: '',
    phone: '',
    status: 'Lead' as 'Ativo' | 'Inativo' | 'Lead' | 'Cliente' | 'Ex-Cliente',
  });
  const [editContact, setEditContact] = useState({
    name: '',
    cpfCnpj: '',
    email: '',
    phone: '',
    status: 'Lead' as 'Ativo' | 'Inativo' | 'Lead' | 'Cliente' | 'Ex-Cliente',
  });

  const [contacts, setContacts] = useState<Contact[]>([]);

  // Load contacts from Supabase
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('ativo', true)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Determinar tipo baseado no tamanho do CPF/CNPJ
      const cleanCpfCnpj = newContact.cpfCnpj.replace(/\D/g, '');
      const tipo = cleanCpfCnpj.length === 14 ? 'Pessoa Jurídica' : 'Pessoa Física';

      const { data, error } = await supabase
        .from('contatos')
        .insert([{
          tipo,
          nome_completo: newContact.name,
          email: newContact.email,
          cpf_cnpj: newContact.cpfCnpj || null,
          telefone_principal: newContact.phone || null,
          status_contato: newContact.status,
          responsavel_id: user?.id || null,
          criado_por: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Contato criado com sucesso!');
      setIsDialogOpen(false);
      setNewContact({
        name: '',
        cpfCnpj: '',
        email: '',
        phone: '',
        status: 'Lead',
      });

      // Reload contacts
      await loadContacts();
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast.error(error.message || 'Erro ao criar contato');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este contato?')) {
      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast.success('Contato excluído com sucesso!');
    }
  };

  const openEditDialog = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      setSelectedContactId(id);
      setEditContact({
        name: contact.nome_completo,
        cpfCnpj: contact.cpf_cnpj || '',
        email: contact.email || '',
        phone: contact.telefone_principal || '',
        status: contact.status_contato,
      });
      setEditDialogOpen(true);
    }
  };

  const openDeleteDialog = (id: string) => {
    setSelectedContactId(id);
    setDeleteDialogOpen(true);
  };

  const handleEditContact = async () => {
    if (!editContact.name || !editContact.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Determinar tipo baseado no tamanho do CPF/CNPJ
      const cleanCpfCnpj = editContact.cpfCnpj.replace(/\D/g, '');
      const tipo = cleanCpfCnpj.length === 14 ? 'Pessoa Jurídica' : 'Pessoa Física';

      const { error } = await supabase
        .from('contatos')
        .update({
          tipo,
          nome_completo: editContact.name,
          email: editContact.email,
          cpf_cnpj: editContact.cpfCnpj || null,
          telefone_principal: editContact.phone || null,
          status_contato: editContact.status,
          data_atualizacao: new Date().toISOString(),
        })
        .eq('id', selectedContactId);

      if (error) throw error;

      toast.success('Contato atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedContactId(null);

      // Reload contacts
      await loadContacts();
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast.error(error.message || 'Erro ao atualizar contato');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async () => {
    setLoading(true);
    try {
      // Soft delete (marcar como inativo)
      const { error } = await supabase
        .from('contatos')
        .update({ ativo: false })
        .eq('id', selectedContactId);

      if (error) throw error;

      toast.success('Contato excluído com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedContactId(null);

      // Reload contacts
      await loadContacts();
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error(error.message || 'Erro ao excluir contato');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.cpf_cnpj && contact.cpf_cnpj.includes(searchTerm))
  );

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Gestão de Contatos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie seus contatos e clientes
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
              <DialogDescription>
                Preencha os dados do contato
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do contato"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <InputMask
                  mask={newContact.cpfCnpj.replace(/\D/g, '').length <= 11 ? "999.999.999-999" : "99.999.999/9999-99"}
                  value={newContact.cpfCnpj}
                  onChange={(e) => setNewContact(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                  formatChars={{
                    '9': '[0-9]',
                    '?': '[0-9 ]'
                  }}
                >
                  {(inputProps: any) => (
                    <Input
                      {...inputProps}
                      id="cpfCnpj"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                  )}
                </InputMask>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <InputMask
                  mask="(99) 99999-9999"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                >
                  {(inputProps: any) => (
                    <Input
                      {...inputProps}
                      id="phone"
                      placeholder="(00) 00000-0000"
                    />
                  )}
                </InputMask>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={newContact.status}
                  onValueChange={(value: any) => setNewContact(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Ex-Cliente">Ex-Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleCreateContact} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Contato'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {loadingContacts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-gray-900 dark:text-white">{contact.nome_completo}</span>
                      </div>
                    </TableCell>
                    <TableCell>{contact.cpf_cnpj || '-'}</TableCell>
                    <TableCell>{contact.email || '-'}</TableCell>
                    <TableCell>{contact.telefone_principal || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        contact.status_contato === 'Ativo' || contact.status_contato === 'Cliente'
                          ? 'default'
                          : 'secondary'
                      }>
                        {contact.status_contato}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(contact.data_criacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate('contact-details', contact.id)}>
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(contact.id)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => openDeleteDialog(contact.id)}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!loadingContacts && filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum contato encontrado
          </p>
        </div>
      )}

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
            <DialogDescription>
              Atualize os dados do contato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                value={editContact.name}
                onChange={(e) => setEditContact(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do contato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cpfCnpj">CPF/CNPJ</Label>
              <InputMask
                mask={editContact.cpfCnpj.replace(/\D/g, '').length <= 11 ? "999.999.999-999" : "99.999.999/9999-99"}
                value={editContact.cpfCnpj}
                onChange={(e) => setEditContact(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                formatChars={{
                  '9': '[0-9]',
                  '?': '[0-9 ]'
                }}
              >
                {(inputProps: any) => (
                  <Input
                    {...inputProps}
                    id="edit-cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                )}
              </InputMask>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editContact.email}
                onChange={(e) => setEditContact(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <InputMask
                mask="(99) 99999-9999"
                value={editContact.phone}
                onChange={(e) => setEditContact(prev => ({ ...prev, phone: e.target.value }))}
              >
                {(inputProps: any) => (
                  <Input
                    {...inputProps}
                    id="edit-phone"
                    placeholder="(00) 00000-0000"
                  />
                )}
              </InputMask>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={editContact.status}
                onValueChange={(value: any) => setEditContact(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Ex-Cliente">Ex-Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleEditContact} disabled={loading}>
              {loading ? (
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

      {/* Delete Contact Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
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