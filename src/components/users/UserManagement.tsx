import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, MoreVertical, User, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { usersService, type UserWithRole, type Role } from '../../services/users.service';
import { isValidEmail } from '../ui/utils';

interface UserManagementProps {
  onNavigate: (page: string, id?: string) => void;
}

export function UserManagement({ onNavigate }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role_id: '',
    password: '',
  });

  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role_id: '',
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

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isValidEmail(newUser.email)) {
      setEmailError('Por favor, insira um email válido');
      toast.error('E-mail inválido');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setCreating(true);

      const userId = await usersService.createUser({
        nome_completo: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role_id: newUser.role_id,
      });

      toast.success('Usuário criado com sucesso!');
      setIsDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        role_id: '',
        password: '',
      });

      // Recarregar lista de usuários
      await loadData();

      // Navegar para a página de permissões
      onNavigate('permissions');
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);

      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Este e-mail já está em uso');
      } else if (error.message?.includes('admin')) {
        toast.error('Você não tem permissão para criar usuários');
      } else {
        toast.error(`Erro ao criar usuário: ${error.message || 'Tente novamente'}`);
      }
    } finally {
      setCreating(false);
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
      setEditUser({
        name: user.nome_completo,
        email: user.email,
        role_id: user.roles[0]?.id || '',
      });
      setEditDialogOpen(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser.name || !editUser.email || !editUser.role_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isValidEmail(editUser.email)) {
      setEditEmailError('Por favor, insira um email válido');
      toast.error('E-mail inválido');
      return;
    }

    if (!selectedUserId) return;

    try {
      setUpdating(true);

      await usersService.updateUser(selectedUserId, {
        nome_completo: editUser.name,
        email: editUser.email,
        role_id: editUser.role_id,
      });

      toast.success('Usuário atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedUserId(null);

      // Recarregar lista
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

      // Recarregar lista
      await loadData();
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles.some(role => role.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Gerenciamento de Usuários</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie os usuários do sistema
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário. Após criar, você será redirecionado para configurar as permissões.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do usuário"
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => {
                    const emailValue = e.target.value;
                    setNewUser(prev => ({ ...prev, email: emailValue }));
                    if (emailValue && !isValidEmail(emailValue)) {
                      setEmailError('Por favor, insira um email válido');
                    } else {
                      setEmailError('');
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value && !isValidEmail(e.target.value)) {
                      setEmailError('Por favor, insira um email válido');
                    }
                  }}
                  placeholder="email@exemplo.com"
                  disabled={creating}
                  aria-invalid={emailError ? 'true' : 'false'}
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select
                  value={newUser.role_id}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, role_id: value }))}
                  disabled={creating}
                >
                  <SelectTrigger id="role">
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
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  disabled={creating}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-gray-900 dark:text-white">{user.nome_completo}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.map(role => (
                          <Badge key={role.id} variant="outline">{role.nome}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(user.id)}>Visualizar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(user.id)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleDeleteClick(user.id)}
                          >
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Visualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <div className="text-sm text-gray-900 dark:text-white">{selectedUser.nome_completo}</div>
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <div className="text-sm text-gray-900 dark:text-white">{selectedUser.email}</div>
              </div>

              <div className="space-y-2">
                <Label>Perfil</Label>
                <div className="flex gap-1">
                  {selectedUser.roles.map(role => (
                    <Badge key={role.id} variant="outline">{role.nome}</Badge>
                  ))}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                value={editUser.name}
                onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do usuário"
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) => {
                  const emailValue = e.target.value;
                  setEditUser(prev => ({ ...prev, email: emailValue }));
                  if (emailValue && !isValidEmail(emailValue)) {
                    setEditEmailError('Por favor, insira um email válido');
                  } else {
                    setEditEmailError('');
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value && !isValidEmail(e.target.value)) {
                    setEditEmailError('Por favor, insira um email válido');
                  }
                }}
                placeholder="email@exemplo.com"
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
                value={editUser.role_id}
                onValueChange={(value) => setEditUser(prev => ({ ...prev, role_id: value }))}
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
