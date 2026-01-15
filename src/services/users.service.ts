// ==================================================
// SERVICE: GERENCIAMENTO DE USUÁRIOS
// ==================================================

import { supabase } from '../lib/supabase';
import type { UserStatus } from '../types/permissions';

// ==================================================
// INTERFACES
// ==================================================

export interface InviteUserData {
  nome_completo: string;
  email: string;
  role_id: string;
  cargo?: string;
  telefone?: string;
  cpf?: string;
}

export interface CreateUserData {
  nome_completo: string;
  email: string;
  password: string;
  role_id: string;
  cargo?: string;
  telefone?: string;
  cpf?: string;
}

export interface UpdateUserData {
  nome_completo?: string;
  email?: string;
  role_id?: string;
  cargo?: string;
  telefone?: string;
  cpf?: string;
  ativo?: boolean;
}

export interface UserWithRole {
  id: string;
  nome_completo: string;
  email: string;
  avatar_url?: string;
  cargo?: string;
  telefone?: string;
  cpf?: string;
  ativo: boolean;
  status: UserStatus;
  ultimo_acesso?: string;
  created_at?: string;
  roles: Array<{
    id: string;
    nome: string;
  }>;
}

export interface Role {
  id: string;
  nome: string;
  descricao?: string;
}

// ==================================================
// SERVICE
// ==================================================

export const usersService = {
  /**
   * Buscar todos os usuários com seus roles
   * NOTA: Alguns campos (cargo, telefone, cpf, ultimo_acesso) podem não existir
   * no banco até que a migração seja executada
   */
  async getUsers(): Promise<UserWithRole[]> {
    // Query básica que sempre funciona - apenas campos que existem no schema
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nome_completo,
        email,
        avatar_url,
        cargo,
        telefone,
        cpf,
        ativo,
        ultimo_acesso,
        created_at,
        user_roles (
          role_id,
          roles (
            id,
            nome
          )
        )
      `)
      .order('nome_completo');

    if (error) throw error;

    // Transformar dados para o formato esperado
    return (data || []).map(user => {
      // Cast para pegar campos opcionais que podem existir
      const extendedUser = user as any;
      
      // Determinar status do usuário
      let status: UserStatus = 'ATIVO';
      if (extendedUser.ativo === false) {
        status = 'INATIVO';
      } else if (!extendedUser.ultimo_acesso) {
        status = 'PENDENTE';
      }

      return {
        id: user.id,
        nome_completo: user.nome_completo,
        email: user.email,
        avatar_url: user.avatar_url,
        cargo: extendedUser.cargo,
        telefone: extendedUser.telefone,
        cpf: extendedUser.cpf,
        ativo: extendedUser.ativo !== false,
        status,
        ultimo_acesso: extendedUser.ultimo_acesso,
        created_at: extendedUser.created_at,
        roles: user.user_roles?.map((ur: any) => ({
          id: ur.roles.id,
          nome: ur.roles.nome
        })) || []
      };
    });
  },

  /**
   * Buscar todos os roles disponíveis
   */
  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, nome, descricao')
      .order('nome');

    if (error) throw error;
    return data || [];
  },

  /**
   * Convidar novo usuário por email
   * Usa função RPC que chama auth.admin.inviteUserByEmail
   */
  async inviteUser(userData: InviteUserData): Promise<string> {
    const { data, error } = await supabase.rpc('invite_user_by_email', {
      p_email: userData.email,
      p_nome_completo: userData.nome_completo,
      p_role_id: userData.role_id,
      p_cargo: userData.cargo || null,
      p_telefone: userData.telefone || null,
      p_cpf: userData.cpf || null,
    });

    if (error) {
      console.error('Erro ao convidar usuário:', error);
      
      // Mensagens de erro específicas
      if (error.message?.includes('already registered')) {
        throw new Error('Este e-mail já está cadastrado no sistema');
      }
      if (error.message?.includes('admin')) {
        throw new Error('Você não tem permissão para convidar usuários');
      }
      
      throw new Error(error.message || 'Erro ao enviar convite');
    }

    if (!data) {
      throw new Error('Nenhum ID de usuário foi retornado');
    }

    return data as string;
  },

  /**
   * Reenviar convite para usuário pendente
   */
  async resendInvite(userId: string): Promise<void> {
    const { error } = await supabase.rpc('resend_user_invite', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Erro ao reenviar convite:', error);
      throw new Error(error.message || 'Erro ao reenviar convite');
    }
  },

  /**
   * Criar novo usuário (método legado com senha)
   * Mantido para compatibilidade, prefira inviteUser
   */
  async createUser(userData: CreateUserData): Promise<string> {
    const { data, error } = await supabase.rpc('create_user_with_role', {
      p_email: userData.email,
      p_password: userData.password,
      p_nome_completo: userData.nome_completo,
      p_role_id: userData.role_id,
      p_cargo: userData.cargo || null,
      p_telefone: userData.telefone || null,
      p_cpf: userData.cpf || null,
    });

    if (error) {
      console.error('Erro ao criar usuário:', error);
      throw new Error(error.message || 'Erro ao criar usuário');
    }

    if (!data) {
      throw new Error('Nenhum ID de usuário foi retornado');
    }

    return data as string;
  },

  /**
   * Atualizar dados de um usuário
   */
  async updateUser(userId: string, userData: UpdateUserData): Promise<void> {
    // Preparar dados para atualização
    const updateData: any = {};
    if (userData.nome_completo !== undefined) updateData.nome_completo = userData.nome_completo;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.cargo !== undefined) updateData.cargo = userData.cargo;
    if (userData.telefone !== undefined) updateData.telefone = userData.telefone;
    if (userData.cpf !== undefined) updateData.cpf = userData.cpf;
    if (userData.ativo !== undefined) updateData.ativo = userData.ativo;

    // Atualizar profile se houver dados
    if (Object.keys(updateData).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Se email mudou, atualizar também no auth usando RPC
      if (userData.email) {
        const { error: authError } = await supabase.rpc('update_user_email', {
          p_user_id: userId,
          p_new_email: userData.email,
        });
        if (authError) {
          console.warn('Não foi possível atualizar email no auth:', authError);
        }
      }
    }

    // Atualizar role se fornecida
    if (userData.role_id) {
      // Primeiro, remover roles antigas
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Depois, adicionar nova role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: userData.role_id,
        });

      if (insertError) throw insertError;
    }
  },

  /**
   * Ativar/Inativar usuário
   */
  async toggleUserStatus(userId: string, ativo: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ ativo })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao alterar status do usuário:', error);
      throw error;
    }
  },

  /**
   * Deletar usuário
   */
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.rpc('delete_user_by_id', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Erro ao deletar usuário:', error);
      throw new Error(error.message || 'Erro ao deletar usuário');
    }
  },

  /**
   * Buscar usuário por ID
   */
  async getUserById(userId: string): Promise<UserWithRole | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nome_completo,
        email,
        avatar_url,
        cargo,
        telefone,
        cpf,
        ativo,
        ultimo_acesso,
        created_at,
        user_roles (
          role_id,
          roles (
            id,
            nome
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;
    // Determinar status
    let status: UserStatus = 'ATIVO';
    if (data.ativo === false) {
      status = 'INATIVO';
    } else if (!data.ultimo_acesso) {
      status = 'PENDENTE';
    }

    return {
      id: data.id,
      nome_completo: data.nome_completo,
      email: data.email,
      avatar_url: data.avatar_url,
      cargo: data.cargo,
      telefone: data.telefone,
      cpf: data.cpf,
      ativo: data.ativo !== false,
      status,
      ultimo_acesso: data.ultimo_acesso,
      created_at: data.created_at,
      roles: data.user_roles?.map((ur: any) => ({
        id: ur.roles.id,
        nome: ur.roles.nome
      })) || []
    };
  },
};
