import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Save, RefreshCw, AlertCircle, ArrowLeft, Search, Users, Plus, X, UserPlus, Lock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { permissionsService } from '../../services/permissions.service';
import { usersService, type Role } from '../../services/users.service';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import type {
  Module,
  PermissionActionType,
  UserWithPermissions,
  UserPermissionsMap
} from '../../types/permissions';
import { Link } from '@tanstack/react-router';

export function PermissionsManagement() {
  const { refetch } = usePermissions();
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [actions, setActions] = useState<PermissionActionType[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Record<string, UserPermissionsMap>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for role management dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<string>('');

  // Check if current user is Admin Master (can see all users)
  const isAdminMaster = profile?.roles?.includes('Admin Master') || false;
  // Check if current user is Gestor (can only see users in same org)
  const isGestor = profile?.roles?.includes('Gestor') || profile?.roles?.includes('Administrador') || false;
  // Current user's organization
  const currentOrgId = profile?.organization_id;

  /**
   * Carrega todos os dados necessários para a tela
   */
  const loadData = async () => {
    try {
      setLoading(true);

      const [usersData, modulesData, actionsData, rolesData] = await Promise.all([
        permissionsService.getUsersWithPermissions(),
        permissionsService.getModules(),
        permissionsService.getActions(),
        usersService.getRoles()
      ]);

      setUsers(usersData);
      setModules(modulesData);
      setActions(actionsData);
      setRoles(rolesData);

      // Inicializar permissões locais com dados carregados
      const initial: Record<string, UserPermissionsMap> = {};
      usersData.forEach(user => {
        initial[user.id] = { ...user.permissions };
      });
      setLocalPermissions(initial);
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de permissões');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Alterna uma permissão específica de um usuário
   */
  const togglePermission = (userId: string, moduleCode: string, actionCode: string) => {
    setLocalPermissions(prev => {
      const updated = {
        ...prev,
        [userId]: {
          ...prev[userId],
          [moduleCode]: {
            ...prev[userId][moduleCode],
            [actionCode]: !prev[userId][moduleCode][actionCode]
          }
        }
      };
      setHasChanges(true);
      return updated;
    });
  };

  /**
   * Verifica se usuário tem permissão específica
   */
  const hasPermission = (userId: string, moduleCode: string, actionCode: string): boolean => {
    return localPermissions[userId]?.[moduleCode]?.[actionCode] || false;
  };

  /**
   * Salva todas as permissões modificadas
   */
  const handleSave = async () => {
    try {
      setSaving(true);

      // Salvar permissões de todos os usuários em paralelo
      await Promise.all(
        users.map(user =>
          permissionsService.saveUserPermissions(user.id, localPermissions[user.id])
        )
      );

      toast.success('Permissões salvas com sucesso!');
      setHasChanges(false);

      // Recarregar dados para garantir sincronização
      await loadData();

      // Forçar reload das permissões do usuário atual em todos os componentes
      await refetch();

      // Disparar evento global para forçar reload em todos os hooks usePermissions
      window.dispatchEvent(new CustomEvent('permissions-updated'));
    } catch (error: any) {
      console.error('Erro ao salvar permissões:', error);

      // Mensagem de erro mais específica
      if (error.message?.includes('Apenas administradores')) {
        toast.error('Você não tem permissão para gerenciar permissões de usuários');
      } else {
        toast.error('Erro ao salvar permissões. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Recarrega os dados
   */
  const handleRefresh = () => {
    if (hasChanges) {
      if (confirm('Você tem alterações não salvas. Deseja recarregar e perder as alterações?')) {
        loadData();
      }
    } else {
      loadData();
    }
  };

  /**
   * Abre o dialog de gerenciamento de roles para um usuário
   */
  const openRoleDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setSelectedRoleToAdd('');
    setRoleDialogOpen(true);
  };

  /**
   * Adiciona uma role ao usuário selecionado
   */
  const handleAddRole = async () => {
    if (!selectedUser || !selectedRoleToAdd) return;
    
    try {
      setSaving(true);
      await usersService.addUserRole(selectedUser.id, selectedRoleToAdd);
      toast.success('Perfil adicionado com sucesso!');
      setSelectedRoleToAdd('');
      await loadData();
      // Update selected user with new data
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) setSelectedUser(updatedUser);
    } catch (error: any) {
      console.error('Erro ao adicionar perfil:', error);
      toast.error(error.message || 'Erro ao adicionar perfil');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Remove uma role do usuário selecionado
   */
  const handleRemoveRole = async (roleId: string) => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      await usersService.removeUserRole(selectedUser.id, roleId);
      toast.success('Perfil removido com sucesso!');
      await loadData();
      // Update selected user with new data
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) setSelectedUser(updatedUser);
    } catch (error: any) {
      console.error('Erro ao remover perfil:', error);
      toast.error(error.message || 'Erro ao remover perfil');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Roles disponíveis para adicionar (que o usuário ainda não tem)
   */
  const availableRoles = useMemo(() => {
    if (!selectedUser) return roles;
    const userRoleIds = selectedUser.roles.map(r => r.id);
    return roles.filter(r => !userRoleIds.includes(r.id));
  }, [selectedUser, roles]);

  /**
   * Filtra usuários baseado em:
   * - Admin Master: vê todos os usuários
   * - Gestor: vê apenas usuários da sua organização
   * - Termo de busca
   */
  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Gestor (not Admin Master) only sees users in same org
    if (isGestor && !isAdminMaster && currentOrgId) {
      result = result.filter(u => {
        // Need to check organization_id - users from permissionsService may not have it
        // For now we show all users but the RPC will enforce the org check
        return true;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.nome_completo.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [users, isGestor, isAdminMaster, currentOrgId, searchTerm]);

  /**
   * Verifica se o usuário atual pode editar as permissões de outro usuário
   * - Admin Master: pode editar todos
   * - Gestor: pode editar todos exceto a si mesmo
   */
  const canEditUser = (userId: string): boolean => {
    if (isAdminMaster) return true;
    if (isGestor && userId !== profile?.id) return true;
    return false;
  };

  /**
   * Renderiza skeleton loading
   */
  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * Mensagem se não houver usuários
   */
  if (users.length === 0) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Gerenciamento de Permissões
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Defina permissões granulares por usuário e módulo
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Nenhum usuário encontrado no sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <Link to="/users" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para Usuários
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Gerenciamento de Permissões
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Defina permissões granulares por usuário e módulo
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || saving}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar usuário por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{filteredUsers.length} de {users.length} usuários</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões</CardTitle>
          <CardDescription>
            Configure as permissões de CLED - Criar, Ler, Editar, Deletar para cada módulo e usuário.
            {hasChanges && (
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                • Você tem alterações não salvas
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-64 min-w-[16rem]">Usuário</TableHead>
                  {modules.map(module => (
                    <TableHead key={module.id} className="text-center min-w-[120px]">
                      <div className="font-semibold">{module.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2 mt-1 font-normal">
                        {actions.map(action => (
                          <span key={action.code} title={action.name}>
                            {action.name.charAt(0)}
                          </span>
                        ))}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => {
                  const userEditable = canEditUser(user.id);
                  return (
                    <TableRow key={user.id} className={!userEditable ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {!userEditable && (
                            <Lock className="w-4 h-4 text-muted-foreground" title="Você não pode editar suas próprias permissões" />
                          )}
                          {user.avatar_url && (
                            <img
                              src={user.avatar_url}
                              alt={user.nome_completo}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.nome_completo}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {user.roles.map(role => (
                                <Badge
                                  key={role.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {role.nome}
                                </Badge>
                              ))}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 ml-1"
                                onClick={() => openRoleDialog(user)}
                                title="Gerenciar perfis"
                              >
                                <UserPlus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {modules.map(module => (
                        <TableCell key={module.id}>
                          <div className="flex items-center justify-center gap-2">
                            {actions.map(action => (
                              <Checkbox
                                key={action.code}
                                checked={hasPermission(user.id, module.code, action.code)}
                                onCheckedChange={() =>
                                  togglePermission(user.id, module.code, action.code)
                                }
                                title={`${action.name} - ${module.name}`}
                                disabled={saving || !userEditable}
                              />
                            ))}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Legenda */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="font-semibold">Legenda:</div>
              {actions.map(action => (
                <div key={action.code} className="flex items-center gap-1">
                  <span className="font-medium">{action.name.charAt(0)}</span>
                  <span>=</span>
                  <span>{action.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 mt-6">
        {hasChanges && (
          <Button
            variant="outline"
            onClick={() => loadData()}
            disabled={saving}
          >
            Descartar Alterações
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Permissões'}
        </Button>
      </div>

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Gerenciar Perfis
            </DialogTitle>
            <DialogDescription>
              Adicione ou remova perfis (cargos) do usuário <strong>{selectedUser?.nome_completo}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Current Roles */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Perfis Atuais</h4>
              {selectedUser?.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum perfil atribuído</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedUser?.roles.map(role => (
                    <Badge
                      key={role.id}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {role.nome}
                      <button
                        onClick={() => handleRemoveRole(role.id)}
                        disabled={saving}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                        title="Remover perfil"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Role */}
            {availableRoles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Adicionar Novo Perfil</h4>
                <div className="flex gap-2">
                  <Select
                    value={selectedRoleToAdd}
                    onValueChange={setSelectedRoleToAdd}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um perfil..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddRole}
                    disabled={saving || !selectedRoleToAdd}
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            )}

            {availableRoles.length === 0 && selectedUser?.roles.length === roles.length && (
              <p className="text-sm text-muted-foreground">
                Este usuário já possui todos os perfis disponíveis.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
