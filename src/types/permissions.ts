// ==================================================
// TIPOS E INTERFACES DO SISTEMA DE PERMISSÕES
// ==================================================

// Tipos de ações de permissão (CLED)
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

// Códigos dos módulos do sistema
export type ModuleCode = 'crm' | 'contacts' | 'calculations' | 'petitions';

// Interface para Módulo do Sistema
export interface Module {
  id: string;
  code: ModuleCode;
  name: string;
  description?: string;
  active: boolean;
  created_at?: string;
}

// Interface para Ação de Permissão
export interface PermissionActionType {
  id: string;
  code: PermissionAction;
  name: string;
  description?: string;
  created_at?: string;
}

// Interface para Permissão de Role (herdada)
export interface RolePermission {
  id: string;
  role_id: string;
  module_code: ModuleCode;
  action_code: PermissionAction;
  granted: boolean;
  created_at?: string;
}

// Interface para Permissão Individual de Usuário (sobrescreve role)
export interface UserPermission {
  id: string;
  user_id: string;
  module_code: ModuleCode;
  action_code: PermissionAction;
  granted: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para Permissão Efetiva (resultado da combinação role + individual)
export interface EffectivePermission {
  module_code: ModuleCode;
  action_code: PermissionAction;
  granted: boolean;
  source: 'role' | 'individual'; // Indica se veio do role ou foi definida individualmente
}

// Mapa de permissões por módulo e ação
// Estrutura: { [moduleCode]: { [actionCode]: boolean } }
export interface UserPermissionsMap {
  [moduleCode: string]: {
    [actionCode: string]: boolean;
  };
}

// Interface para Usuário com Permissões Completas
export interface UserWithPermissions {
  id: string;
  nome_completo: string;
  email: string;
  avatar_url?: string;
  roles: Array<{
    id: string;
    nome: string;
  }>;
  permissions: UserPermissionsMap;
}

// Labels traduzidos para as ações
export const PERMISSION_LABELS: Record<PermissionAction, string> = {
  create: 'Criar',
  read: 'Ler',
  update: 'Editar',
  delete: 'Deletar'
};

// Labels traduzidos para os módulos
export const MODULE_LABELS: Record<ModuleCode, string> = {
  crm: 'Pipeline',
  contacts: 'Contatos',
  calculations: 'Cálculo Revisional',
  petitions: 'Petições'
};

// Constantes para verificação rápida
export const PERMISSION_ACTIONS: PermissionAction[] = ['create', 'read', 'update', 'delete'];
export const MODULE_CODES: ModuleCode[] = ['crm', 'contacts', 'calculations', 'petitions'];

// ==================================================
// DADOS ESTÁTICOS (fallback quando tabelas não existem)
// ==================================================

/**
 * Módulos estáticos do sistema
 * Usado como fallback quando a tabela `modules` não existe
 */
export const STATIC_MODULES: Module[] = [
  {
    id: 'module-crm',
    code: 'crm',
    name: 'Pipeline',
    description: 'Gestão de oportunidades no Kanban',
    active: true
  },
  {
    id: 'module-contacts',
    code: 'contacts',
    name: 'Contatos',
    description: 'Leads e clientes do escritório',
    active: true
  },
  {
    id: 'module-calculations',
    code: 'calculations',
    name: 'Cálculos',
    description: 'Motor de cálculo revisional',
    active: true
  },
  {
    id: 'module-petitions',
    code: 'petitions',
    name: 'Petições',
    description: 'Geração de documentos',
    active: true
  }
];

/**
 * Ações de permissão estáticas
 * Usado como fallback quando a tabela `permission_actions` não existe
 */
export const STATIC_ACTIONS: PermissionActionType[] = [
  {
    id: 'action-create',
    code: 'create',
    name: 'Criar',
    description: 'Criar novos registros'
  },
  {
    id: 'action-read',
    code: 'read',
    name: 'Ler',
    description: 'Visualizar dados'
  },
  {
    id: 'action-update',
    code: 'update',
    name: 'Editar',
    description: 'Modificar registros existentes'
  },
  {
    id: 'action-delete',
    code: 'delete',
    name: 'Deletar',
    description: 'Excluir registros'
  }
];

// Status de usuário
export type UserStatus = 'PENDENTE' | 'ATIVO' | 'INATIVO';

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  PENDENTE: 'Pendente',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo'
};

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ATIVO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  INATIVO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};
