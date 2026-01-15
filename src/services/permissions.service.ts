// ==================================================
// SERVICE LAYER - GERENCIAMENTO DE PERMISSÕES
// ==================================================

import { supabase } from '../lib/supabase';
import type {
  Module,
  PermissionActionType,
  UserWithPermissions,
  UserPermissionsMap,
  EffectivePermission
} from '../types/permissions';
import { STATIC_MODULES, STATIC_ACTIONS } from '../types/permissions';

export const permissionsService = {
  /**
   * Busca todos os módulos ativos do sistema
   * Com fallback para dados estáticos se a tabela não existir
   */
  async getModules(): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        // Se a tabela não existir, usar dados estáticos
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Tabela modules não existe, usando dados estáticos');
          return STATIC_MODULES;
        }
        throw error;
      }

      return data && data.length > 0 ? data : STATIC_MODULES;
    } catch (error) {
      console.warn('Erro ao buscar módulos, usando dados estáticos:', error);
      return STATIC_MODULES;
    }
  },

  /**
   * Busca todas as ações de permissão (CLED)
   * Com fallback para dados estáticos se a tabela não existir
   */
  async getActions(): Promise<PermissionActionType[]> {
    try {
      const { data, error } = await supabase
        .from('permission_actions')
        .select('*')
        .order('code');

      if (error) {
        // Se a tabela não existir, usar dados estáticos
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Tabela permission_actions não existe, usando dados estáticos');
          return STATIC_ACTIONS;
        }
        throw error;
      }

      return data && data.length > 0 ? data : STATIC_ACTIONS;
    } catch (error) {
      console.warn('Erro ao buscar ações, usando dados estáticos:', error);
      return STATIC_ACTIONS;
    }
  },

  /**
   * Busca usuários com seus roles associados
   */
  async getUsersWithRoles() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nome_completo,
        email,
        avatar_url,
        user_roles (
          role_id,
          roles (
            id,
            nome
          )
        )
      `)
      .order('nome_completo');

    if (error) {
      console.error('Erro ao buscar usuários com roles:', error);
      throw error;
    }

    // Transformar dados para formato mais amigável
    return data?.map(user => ({
      id: user.id,
      nome_completo: user.nome_completo,
      email: user.email,
      avatar_url: user.avatar_url,
      roles: user.user_roles?.map((ur: any) => ({
        id: ur.roles.id,
        nome: ur.roles.nome
      })) || []
    })) || [];
  },

  /**
   * Busca permissões efetivas de um usuário (combinação de role + individuais)
   * Usa a função RPC do banco de dados
   */
  async getUserEffectivePermissions(userId: string): Promise<EffectivePermission[]> {
    const { data, error } = await supabase
      .rpc('get_user_effective_permissions', { target_user_id: userId });

    if (error) {
      console.error('Erro ao buscar permissões efetivas:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Busca apenas as permissões individuais editáveis de um usuário
   * (não inclui as herdadas dos roles)
   */
  async getUserIndividualPermissions(userId: string) {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar permissões individuais:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Salva permissões de um usuário em batch
   * Usa a função RPC que valida se o usuário atual é admin
   */
  async saveUserPermissions(userId: string, permissions: UserPermissionsMap) {
    // Converter objeto de permissões em array para RPC
    const permissionsArray: any[] = [];

    Object.entries(permissions).forEach(([moduleCode, actions]) => {
      Object.entries(actions).forEach(([actionCode, granted]) => {
        // Apenas adicionar permissões que estão marcadas como granted
        // Para otimizar, podemos incluir todas e deixar o backend decidir
        permissionsArray.push({
          module_code: moduleCode,
          action_code: actionCode,
          granted: granted
        });
      });
    });

    const { error } = await supabase
      .rpc('save_user_permissions_batch', {
        target_user_id: userId,
        permissions_json: permissionsArray
      });

    if (error) {
      console.error('Erro ao salvar permissões:', error);
      throw error;
    }
  },

  /**
   * Busca dados completos para tela de gerenciamento de permissões
   * Retorna usuários com roles e permissões efetivas em formato de matriz
   */
  async getUsersWithPermissions(): Promise<UserWithPermissions[]> {
    try {
      // Carregar dados em paralelo para melhor performance
      const [users, modules, actions] = await Promise.all([
        this.getUsersWithRoles(),
        this.getModules(),
        this.getActions()
      ]);

      // Para cada usuário, buscar suas permissões efetivas
      const usersWithPermissions = await Promise.all(
        users.map(async (user) => {
          const effectivePerms = await this.getUserEffectivePermissions(user.id);

          // Montar mapa de permissões estruturado
          const permissionsMap: UserPermissionsMap = {};

          // Inicializar todos os módulos e ações com false
          modules.forEach(module => {
            permissionsMap[module.code] = {};
            actions.forEach(action => {
              permissionsMap[module.code][action.code] = false;
            });
          });

          // Aplicar permissões efetivas
          effectivePerms.forEach(perm => {
            if (permissionsMap[perm.module_code]) {
              permissionsMap[perm.module_code][perm.action_code] = perm.granted;
            }
          });

          return {
            ...user,
            permissions: permissionsMap
          };
        })
      );

      return usersWithPermissions;
    } catch (error) {
      console.error('Erro ao buscar usuários com permissões:', error);
      throw error;
    }
  },

  /**
   * Valida se um usuário tem uma permissão específica
   * Útil para validações pontuais
   */
  async checkUserPermission(
    userId: string,
    moduleCode: string,
    actionCode: string
  ): Promise<boolean> {
    try {
      const perms = await this.getUserEffectivePermissions(userId);
      const perm = perms.find(
        p => p.module_code === moduleCode && p.action_code === actionCode
      );
      return perm?.granted || false;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }
};
