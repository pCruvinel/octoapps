import { useState } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner@2.0.3';
import { Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function PermissionsManagement() {
  const [loading, setLoading] = useState(false);

  const users = [
    { id: '1', name: 'Ana Admin', role: 'Administrador' },
    { id: '2', name: 'Diego Perito', role: 'Perito' },
    { id: '3', name: 'Maria Advogada', role: 'Advogado' },
  ];

  const modules = [
    { id: 'crm', name: 'Pipeline' },
    { id: 'contacts', name: 'Contatos' },
    { id: 'calculations', name: 'Cálculo Revisional' },
    { id: 'petitions', name: 'Geração de Petições' },
  ];

  const permissions = ['create', 'read', 'update', 'delete'];
  const permissionLabels: Record<string, string> = {
    create: 'Criar',
    read: 'Ler',
    update: 'Editar',
    delete: 'Deletar',
  };

  const [userPermissions, setUserPermissions] = useState<Record<string, Record<string, string[]>>>({
    '1': {
      crm: ['create', 'read', 'update', 'delete'],
      contacts: ['create', 'read', 'update', 'delete'],
      calculations: ['create', 'read', 'update', 'delete'],
      petitions: ['create', 'read', 'update', 'delete'],
    },
    '2': {
      crm: ['read'],
      contacts: ['read'],
      calculations: ['create', 'read', 'update'],
      petitions: ['create', 'read'],
    },
    '3': {
      crm: ['create', 'read', 'update'],
      contacts: ['create', 'read', 'update'],
      calculations: ['read'],
      petitions: ['create', 'read', 'update', 'delete'],
    },
  });

  const togglePermission = (userId: string, moduleId: string, permission: string) => {
    setUserPermissions(prev => {
      const userPerms = prev[userId] || {};
      const modulePerms = userPerms[moduleId] || [];
      const hasPermission = modulePerms.includes(permission);

      return {
        ...prev,
        [userId]: {
          ...userPerms,
          [moduleId]: hasPermission
            ? modulePerms.filter(p => p !== permission)
            : [...modulePerms, permission],
        },
      };
    });
  };

  const hasPermission = (userId: string, moduleId: string, permission: string) => {
    return userPermissions[userId]?.[moduleId]?.includes(permission) || false;
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success('Permissões salvas com sucesso!');
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Gerenciamento de Permissões</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Defina permissões granulares por usuário e módulo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões</CardTitle>
          <CardDescription>
            Configure as permissões de CLED - Criar, Ler, Editar, Deletar para cada módulo e usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Usuário</TableHead>
                  {modules.map(module => (
                    <TableHead key={module.id} className="text-center">
                      <div>{module.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2 mt-1">
                        {permissions.map(perm => (
                          <span key={perm}>{permissionLabels[perm].charAt(0)}</span>
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
                      <div>
                        <div className="text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
                      </div>
                    </TableCell>
                    {modules.map(module => (
                      <TableCell key={module.id}>
                        <div className="flex items-center justify-center gap-2">
                          {permissions.map(permission => (
                            <Checkbox
                              key={permission}
                              checked={hasPermission(user.id, module.id, permission)}
                              onCheckedChange={() => togglePermission(user.id, module.id, permission)}
                              title={permissionLabels[permission]}
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
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar Permissões'}
        </Button>
      </div>
    </div>
  );
}