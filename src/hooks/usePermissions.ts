// ==================================================
// HOOK DE PERMISSÕES - usePermissions
// ==================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { UserPermissionsMap, ModuleCode, PermissionAction } from '../types/permissions';
import { permissionsService } from '../services/permissions.service';

// Flag de desenvolvimento para testar permissões com usuário admin
// ATENÇÃO: Mude para false em produção!
const ENABLE_ADMIN_PERMISSION_TESTING = true;

export function usePermissions() {
  const { user, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs para evitar carregamento duplicado
  const lastUserIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  /**
   * Carrega as permissões efetivas do usuário atual
   */
  const loadPermissions = useCallback(async () => {
    const userId = user?.id;
    
    if (!userId) {
      setPermissions({});
      setLoading(false);
      return;
    }

    // Evitar carregamento duplicado
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      // Buscar permissões efetivas do usuário
      const effectivePerms = await permissionsService.getUserEffectivePermissions(userId);

      // Converter array de permissões em mapa estruturado
      const permissionsMap: UserPermissionsMap = {};

      effectivePerms.forEach(perm => {
        if (!permissionsMap[perm.module_code]) {
          permissionsMap[perm.module_code] = {};
        }
        permissionsMap[perm.module_code][perm.action_code] = perm.granted;
      });

      setPermissions(permissionsMap);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Erro ao carregar permissões:', error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [user?.id]); // Usar user?.id em vez de user

  /**
   * Efeito para carregar permissões ao montar e configurar Realtime
   */
  useEffect(() => {
    const userId = user?.id;
    
    if (!userId) {
      setPermissions({});
      setLoading(false);
      return;
    }

    // Só recarrega se o usuário mudou
    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      loadPermissions();
    }

    // Configurar listener Realtime para mudanças de permissões
    const channel = supabase
      .channel('user_permissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_permissions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log('Permissões atualizadas via Realtime');
          loadPermissions();
        }
      )
      .subscribe();

    // Listener para evento customizado de reload forçado
    const handleForceReload = () => {
      console.log('Recarregando permissões via evento customizado');
      loadPermissions();
    };

    window.addEventListener('permissions-updated', handleForceReload);

    return () => {
      channel.unsubscribe();
      window.removeEventListener('permissions-updated', handleForceReload);
    };
  }, [user?.id, loadPermissions]); // Usar user?.id em vez de user

  /**
   * Verificação genérica de permissão
   * @param module - Código do módulo (crm, contacts, calculations, petitions)
   * @param action - Ação (create, read, update, delete)
   * @returns true se o usuário tem a permissão, false caso contrário
   */
  const can = useCallback(
    (module: ModuleCode, action: PermissionAction): boolean => {
      // Bypass do admin (pode ser desabilitado para testes)
      // Em produção, admin sempre tem todas as permissões
      if (isAdmin() && !ENABLE_ADMIN_PERMISSION_TESTING) {
        return true;
      }

      // Verificar se a permissão existe no mapa (vale para todos, incluindo admin se flag de teste ativa)
      return permissions[module]?.[action] || false;
    },
    [permissions, isAdmin]
  );

  /**
   * Métodos de conveniência para verificação rápida
   */
  const canCreate = useCallback(
    (module: ModuleCode): boolean => can(module, 'create'),
    [can]
  );

  const canRead = useCallback(
    (module: ModuleCode): boolean => can(module, 'read'),
    [can]
  );

  const canUpdate = useCallback(
    (module: ModuleCode): boolean => can(module, 'update'),
    [can]
  );

  const canDelete = useCallback(
    (module: ModuleCode): boolean => can(module, 'delete'),
    [can]
  );

  /**
   * Verifica se o usuário pode gerenciar permissões (apenas admins)
   */
  const canManagePermissions = useCallback((): boolean => {
    return isAdmin();
  }, [isAdmin]);

  /**
   * Verifica múltiplas permissões de uma vez
   * Útil para validar acesso a uma funcionalidade que requer múltiplas permissões
   */
  const canAll = useCallback(
    (checks: Array<{ module: ModuleCode; action: PermissionAction }>): boolean => {
      return checks.every(({ module, action }) => can(module, action));
    },
    [can]
  );

  /**
   * Verifica se o usuário tem PELO MENOS UMA das permissões especificadas
   */
  const canAny = useCallback(
    (checks: Array<{ module: ModuleCode; action: PermissionAction }>): boolean => {
      return checks.some(({ module, action }) => can(module, action));
    },
    [can]
  );

  /**
   * Retorna todas as permissões de um módulo específico
   */
  const getModulePermissions = useCallback(
    (module: ModuleCode) => {
      if (isAdmin()) {
        return { create: true, read: true, update: true, delete: true };
      }
      return permissions[module] || { create: false, read: false, update: false, delete: false };
    },
    [permissions, isAdmin]
  );

  return {
    // Estado
    permissions,
    loading,
    error,

    // Métodos de verificação
    can,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManagePermissions,
    canAll,
    canAny,
    getModulePermissions,

    // Utilitários
    refetch: loadPermissions
  };
}

/**
 * Hook auxiliar para componentes que precisam de permissões de um módulo específico
 * @param module - Código do módulo
 */
export function useModulePermissions(module: ModuleCode) {
  const { can, canCreate, canRead, canUpdate, canDelete, loading, error } = usePermissions();

  return {
    can: (action: PermissionAction) => can(module, action),
    canCreate: canCreate(module),
    canRead: canRead(module),
    canUpdate: canUpdate(module),
    canDelete: canDelete(module),
    loading,
    error
  };
}
