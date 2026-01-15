import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, MoreVertical, User, Edit, Trash2, Loader2, Mail, RefreshCw, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { usersService, type UserWithRole, type Role } from '../../services/users.service';
import { USER_STATUS_COLORS } from '../../types/permissions';
import { isValidEmail } from '../ui/utils';
import { formatPhone, formatCpf } from '../../lib/formatters';

interface UserManagementProps {
  onNavigate: (page: string, id?: string) => void;
}

// Lista de cargos disponíveis
const CARGOS = [
  'Administrador',
  'Advogado',
  'Advogado Sênior',
  'Assistente Jurídico',
  'Estagiário',
  'Perito Técnico',
  'Analista Financeiro',
  'Secretário(a)',
  'Outro'
];

export function UserManagement({ onNavigate }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resending, setResending] = useState(false);

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Formulário de convite
  const [inviteData, setInviteData] = useState({
    nome_completo: '',
    email: '',
    role_id: '',
    cargo: '',
    telefone: '',
    cpf: '',
  });

  // Formulário de edição
  const [editData, setEditData] = useState({
    nome_completo: '',
    email: '',
    role_id: '',
    cargo: '',
    telefone: '',
    cpf: '',
  });

  const [emailError, setEmailError] = useState<string>('');
  const [editEmailError, setEditEmailError] = useState<string>('');

  // Carregar usuários e roles ao montar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        usersService.getUsers(),
        usersService.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const resetInviteForm = () => {
    setInviteData({
      nome_completo: '',
      email: '',
      role_id: '',
      cargo: '',
      telefone: '',
      cpf: '',
    });
    setEmailError('');
  };

  const handleInviteUser = async () => {
    if (!inviteData.nome_completo || !inviteData.email || !inviteData.role_id) {
      toast.error('Preencha os campos obrigatórios: Nome, E-mail e Perfil');
      return;
    }

    if (!isValidEmail(inviteData.email)) {
      setEmailError('Por favor, insira um email válido');
      toast.error('E-mail inválido');
      return;
    }

    try {
      setInviting(true);

      await usersService.inviteUser({
        nome_completo: inviteData.nome_completo,
        email: inviteData.email,
        role_id: inviteData.role_id,
        cargo: inviteData.cargo || undefined,
        telefone: inviteData.telefone || undefined,
        cpf: inviteData.cpf || undefined,
      });

      toast.success('Convite enviado com sucesso! O usuário receberá um e-mail para definir sua senha.');
      setIsInviteDialogOpen(false);
      resetInviteForm();

      // Recarregar lista de usuários
      await loadData();

    } catch (error: any) {
      console.error('Erro ao convidar usuário:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      setResending(true);
      await usersService.resendInvite(userId);
      toast.success('Convite reenviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao reenviar convite:', error);
      toast.error(error.message || 'Erro ao reenviar convite');
    } finally {
      setResending(false);
    }
  };

  const handleViewUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setSelectedUserId(id);
      setViewDialogOpen(true);
    }
  };

  const openEditDialog = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setSelectedUserId(id);
      setEditData({
        nome_completo: user.nome_completo,
        email: user.email,
        role_id: user.roles[0]?.id || '',
        cargo: user.cargo || '',
        telefone: user.telefone || '',
        cpf: user.cpf || '',
      });
      setEditDialogOpen(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!editData.nome_completo || !editData.email || !editData.role_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (!isValidEmail(editData.email)) {
      setEditEmailError('Por favor, insira um email válido');
      toast.error('E-mail inválido');
      return;
    }

    if (!selectedUserId) return;

    try {
      setUpdating(true);

      await usersService.updateUser(selectedUserId, {
        nome_completo: editData.nome_completo,
        email: editData.email,
        role_id: editData.role_id,
        cargo: editData.cargo || undefined,
        telefone: editData.telefone || undefined,
        cpf: editData.cpf || undefined,
      });

      toast.success('Usuário atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedUserId(null);

      await loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Este e-mail já está em uso');
      } else {
        toast.error('Erro ao atualizar usuário');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedUserId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;

    try {
      setDeleting(true);

      await usersService.deleteUser(selectedUserId);

      toast.success('Usuário excluído com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedUserId(null);

      await loadData();
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await usersService.toggleUserStatus(userId, !currentStatus);
      toast.success(currentStatus ? 'Usuário inativado' : 'Usuário ativado');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedUser = users.find(u => u.id === selectedUserId);

  // Função para formatar telefone enquanto digita
  const handlePhoneChange = (value: string, isEdit: boolean) => {
    const formatted = formatPhone(value);
    if (isEdit) {
      setEditData(prev => ({ ...prev, telefone: formatted }));
    } else {
      setInviteData(prev => ({ ...prev, telefone: formatted }));
    }
  };

  // Função para formatar CPF enquanto digita
  const handleCpfChange = (value: string, isEdit: boolean) => {
    const formatted = formatCpf(value);
    if (isEdit) {
      setEditData(prev => ({ ...prev, cpf: formatted }));
    } else {
      setInviteData(prev => ({ ...prev, cpf: formatted }));
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gerenciamento de Usuários</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie os usuários e suas permissões no sistema
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, email, cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onNavigate('permissions')}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            Permissões
          </Button>

          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
                <DialogDescription>
                  O usuário receberá um e-mail com link para definir sua senha e acessar o sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="invite-name">Nome Completo *</Label>
                    <Input
                      id="invite-name"
                      value={inviteData.nome_completo}
                      onChange={(e) => setInviteData(prev => ({ ...prev, nome_completo: e.target.value }))}
                      placeholder="Nome do usuário"
                      disabled={inviting}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="invite-email">E-mail *</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteData.email}
                      onChange={(e) => {
                        const emailValue = e.target.value;
                        setInviteData(prev => ({ ...prev, email: emailValue }));
                        if (emailValue && !isValidEmail(emailValue)) {
                          setEmailError('Por favor, insira um email válido');
                        } else {
                          setEmailError('');
                        }
                      }}
                      placeholder="email@exemplo.com"
                      disabled={inviting}
                      aria-invalid={emailError ? 'true' : 'false'}
                    />
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Perfil *</Label>
                    <Select
                      value={inviteData.role_id}
                      onValueChange={(value) => setInviteData(prev => ({ ...prev, role_id: value }))}
                      disabled={inviting}
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-cargo">Cargo</Label>
                    <Select
                      value={inviteData.cargo}
                      onValueChange={(value) => setInviteData(prev => ({ ...prev, cargo: value }))}
                      disabled={inviting}
                    >
                      <SelectTrigger id="invite-cargo">
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARGOS.map(cargo => (
                          <SelectItem key={cargo} value={cargo}>
                            {cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-telefone">Telefone</Label>
                    <Input
                      id="invite-telefone"
                      type="tel"
                      value={inviteData.telefone}
                      onChange={(e) => handlePhoneChange(e.target.value, false)}
                      placeholder="(00) 00000-0000"
                      disabled={inviting}
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-cpf">CPF</Label>
                    <Input
                      id="invite-cpf"
                      value={inviteData.cpf}
                      onChange={(e) => handleCpfChange(e.target.value, false)}
                      placeholder="000.000.000-00"
                      disabled={inviting}
                      maxLength={14}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={inviting}>
                  Cancelar
                </Button>
                <Button onClick={handleInviteUser} disabled={inviting} className="gap-2">
                  {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Mail className="w-4 h-4" />
                  Enviar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {user.nome_completo}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {user.cargo || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map(role => (
                          <Badge key={role.id} variant="outline">{role.nome}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={USER_STATUS_COLORS[user.status]}>
                        {user.status === 'PENDENTE' ? 'Pendente' : user.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                            <User className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(user.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {user.status === 'PENDENTE' && (
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(user.id)}
                              disabled={resending}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reenviar Convite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user.id, user.ativo)}
                          >
                            {user.ativo ? 'Inativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleDeleteClick(user.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum usuário encontrado
          </p>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser.nome_completo}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  <Badge className={USER_STATUS_COLORS[selectedUser.status]}>
                    {selectedUser.status === 'PENDENTE' ? 'Pendente' : selectedUser.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-xs text-gray-500">Cargo</Label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedUser.cargo || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Perfil</Label>
                  <div className="flex gap-1">
                    {selectedUser.roles.map(role => (
                      <Badge key={role.id} variant="outline">{role.nome}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Telefone</Label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedUser.telefone || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">CPF</Label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedUser.cpf || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Último Acesso</Label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedUser.ultimo_acesso
                      ? new Date(selectedUser.ultimo_acesso).toLocaleString('pt-BR')
                      : 'Nunca acessou'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Criado em</Label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (selectedUserId) openEditDialog(selectedUserId);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={editData.nome_completo}
                  onChange={(e) => setEditData(prev => ({ ...prev, nome_completo: e.target.value }))}
                  disabled={updating}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-email">E-mail *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => {
                    const emailValue = e.target.value;
                    setEditData(prev => ({ ...prev, email: emailValue }));
                    if (emailValue && !isValidEmail(emailValue)) {
                      setEditEmailError('Por favor, insira um email válido');
                    } else {
                      setEditEmailError('');
                    }
                  }}
                  disabled={updating}
                  aria-invalid={editEmailError ? 'true' : 'false'}
                />
                {editEmailError && (
                  <p className="text-sm text-destructive">{editEmailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Perfil *</Label>
                <Select
                  value={editData.role_id}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, role_id: value }))}
                  disabled={updating}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cargo">Cargo</Label>
                <Select
                  value={editData.cargo}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, cargo: value }))}
                  disabled={updating}
                >
                  <SelectTrigger id="edit-cargo">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGOS.map(cargo => (
                      <SelectItem key={cargo} value={cargo}>
                        {cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  type="tel"
                  value={editData.telefone}
                  onChange={(e) => handlePhoneChange(e.target.value, true)}
                  disabled={updating}
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  value={editData.cpf}
                  onChange={(e) => handleCpfChange(e.target.value, true)}
                  disabled={updating}
                  maxLength={14}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={updating}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={updating}>
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir este usuário? Esta ação não pode ser desfeita e o usuário perderá acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
