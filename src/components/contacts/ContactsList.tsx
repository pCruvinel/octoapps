import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, MoreVertical, User, Loader2, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import type { Contact } from '../../types/contact';
import { ContactFormDialog } from './ContactFormDialog';

interface ContactsListProps {
  onNavigate: (route: string, id?: string) => void;
}

// Helper function to calculate activity status based on last update
const getStatusAtividade = (dataAtualizacao: string) => {
  const dias = Math.floor((Date.now() - new Date(dataAtualizacao).getTime()) / 86400000);
  if (dias < 90) return { label: 'Ativo', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700' };
  if (dias < 180) return { label: 'Inativo', variant: 'secondary' as const, className: 'bg-yellow-500 text-yellow-900 hover:bg-yellow-600' };
  return { label: 'Arquivado', variant: 'outline' as const, className: 'text-gray-500' };
};

// Helper function to get category display label
const getCategoriaLabel = (categoria: string | null | undefined): string => {
  const map: Record<string, string> = { 'LEAD': 'Lead', 'CLIENTE': 'Cliente', 'EX_CLIENTE': 'Ex-Cliente' };
  return categoria ? (map[categoria] || 'Lead') : 'Lead';
};

// Helper function to get category badge variant
const getCategoriaVariant = (categoria: string | null | undefined): 'default' | 'secondary' | 'outline' => {
  if (categoria === 'CLIENTE') return 'default';
  if (categoria === 'LEAD') return 'secondary';
  return 'outline';
};


export function ContactsList({ onNavigate }: ContactsListProps) {
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const itemsPerPage = 10;

  // Load contacts from Supabase when user changes or page changes
  useEffect(() => {
    loadContacts();
  }, [user, currentPage]);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);

      if (!user) {
        setContacts([]);
        setTotalContacts(0);
        return;
      }

      // Calcular o range para paginação
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Buscar contatos com paginação
      const { data, error, count } = await supabase
        .from('contatos')
        .select('*', { count: 'exact' })
        .eq('ativo', true)
        .or(`criado_por.eq.${user.id},responsavel_id.eq.${user.id}`)
        .order('data_criacao', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setContacts(data || []);
      setTotalContacts(count || 0);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoadingContacts(false);
    }
  };

  const openCreateDialog = () => {
    if (!canCreate('contacts')) {
      toast.error('Você não tem permissão para criar contatos');
      return;
    }
    setSelectedContact(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    if (!canUpdate('contacts')) {
      toast.error('Você não tem permissão para editar contatos');
      return;
    }
    setSelectedContact(contact);
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (contact: Contact) => {
    if (!canDelete('contacts')) {
      toast.error('Você não tem permissão para excluir contatos');
      return;
    }
    setSelectedContact(contact);
    setDeleteDialogOpen(true);
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    setLoading(true);
    try {
      // Soft delete (marcar como inativo)
      const { error } = await supabase
        .from('contatos')
        .update({ ativo: false })
        .eq('id', selectedContact.id);

      if (error) throw error;

      toast.success('Contato excluído com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedContact(null);
      await loadContacts();
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error(error.message || 'Erro ao excluir contato');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setCurrentPage(1);
    loadContacts();
    setSelectedContact(null);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.cpf_cnpj && contact.cpf_cnpj.includes(searchTerm))
  );

  const totalPages = Math.ceil(totalContacts / itemsPerPage);
  const startItem = totalContacts === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalContacts);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-2 border-b border-border mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-foreground font-bold text-2xl whitespace-nowrap">Gestão de Contatos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gerencie seus contatos e clientes
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-background shadow-sm border-input font-normal focus:ring-1 focus:ring-primary rounded-md"
              />
            </div>

            <Button
              onClick={openCreateDialog}
              className="gap-2 w-full sm:w-auto"
              disabled={!canCreate('contacts')}
            >
              <Plus className="w-4 h-4" />
              Novo Contato
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 pb-6 flex-1 overflow-auto">

      <div className="border border-border rounded-lg overflow-hidden">
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map(contact => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onNavigate('contact-details', contact.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          {contact.tipo === 'Pessoa Jurídica' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <span className="text-foreground">{contact.nome_completo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {contact.tipo === 'Pessoa Jurídica' ? 'PJ' : 'PF'}
                      </Badge>
                    </TableCell>
                    <TableCell>{contact.cpf_cnpj || '-'}</TableCell>
                    <TableCell>{contact.email || '-'}</TableCell>
                    <TableCell>{contact.telefone_principal || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoriaVariant(contact.categoria_contato)}>
                        {getCategoriaLabel(contact.categoria_contato)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getStatusAtividade(contact.data_atualizacao);
                        return <Badge variant={status.variant} className={status.className}>{status.label}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>
                      {new Date(contact.data_criacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate('contact-details', contact.id)}>
                            Visualizar
                          </DropdownMenuItem>
                          {canUpdate('contacts') && (
                            <DropdownMenuItem onClick={() => openEditDialog(contact)}>Editar</DropdownMenuItem>
                          )}
                          {canDelete('contacts') && (
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => openDeleteDialog(contact)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          )}
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
          <p className="text-muted-foreground">
            Nenhum contato encontrado
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {!loadingContacts && totalContacts > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {startItem} a {endItem} de {totalContacts} contatos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Contact Form Dialog - New/Edit */}
      <ContactFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        contact={selectedContact}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Contact Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato <strong>"{selectedContact?.nome_completo}"</strong>?
              Esta ação não pode ser desfeita.
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
    </div>
  );
}