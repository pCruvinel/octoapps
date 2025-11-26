import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { permissionsService } from '../../services/permissions.service';
import { usePermissions } from '../../hooks/usePermissions';
import type {
  Module,
  PermissionActionType,
  UserWithPermissions,
  UserPermissionsMap
} from '../../types/permissions';
import { PERMISSION_LABELS } from '../../types/permissions';

export function PermissionsManagement() {
  const { refetch } = usePermissions(); // Hook para forçar reload das permissões
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [actions, setActions] = useState<PermissionActionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Record<string, UserPermissionsMap>>({});
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Carrega todos os dados necessários para a tela
   */
  const loadData = async () => {
    try {
      setLoading(true);

      const [usersData, modulesData, actionsData] = await Promise.all([
        permissionsService.getUsersWithPermissions(),
        permissionsService.getModules(),
        permissionsService.getActions()
      ]);

      setUsers(usersData);
      setModules(modulesData);
      setActions(actionsData);

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
      <div className="mb-8 flex items-center justify-between">
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
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.avatar_url && (
                          <img
                            src={user.avatar_url}
                            alt={user.nome_completo}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.nome_completo}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {user.roles.map(role => (
                              <Badge
                                key={role.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {role.nome}
                              </Badge>
                            ))}
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
                              disabled={saving}
                            />
                          ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
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
    </div>
  );
}
