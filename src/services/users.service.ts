// ==================================================
// SERVICE: GERENCIAMENTO DE USUÁRIOS
// ==================================================

import { supabase } from '../lib/supabase';

export interface CreateUserData {
  nome_completo: string;
  email: string;
  password: string;
  role_id: string;
}

export interface UpdateUserData {
  nome_completo?: string;
  email?: string;
  role_id?: string;
}

export interface UserWithRole {
  id: string;
  nome_completo: string;
  email: string;
  avatar_url?: string;
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

export const usersService = {
  /**
   * Buscar todos os usuários com seus roles
   */
  async getUsers(): Promise<UserWithRole[]> {
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

    if (error) throw error;

    // Transformar dados para o formato esperado
    return (data || []).map(user => ({
      id: user.id,
      nome_completo: user.nome_completo,
      email: user.email,
      avatar_url: user.avatar_url,
      roles: user.user_roles?.map((ur: any) => ({
        id: ur.roles.id,
        nome: ur.roles.nome
      })) || []
    }));
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
   * Criar novo usuário
   * 1. Cria usuário no auth.users
   * 2. Cria profile
   * 3. Associa role ao usuário
   *
   * NOTA: Usa uma função RPC do Supabase para criar o usuário de forma segura
   */
  async createUser(userData: CreateUserData): Promise<string> {
    // Chamar função RPC do Supabase que tem privilégios de service_role
    const { data, error } = await supabase.rpc('create_user_with_role', {
      p_email: userData.email,
      p_password: userData.password,
      p_nome_completo: userData.nome_completo,
      p_role_id: userData.role_id,
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
    // Atualizar profile
    if (userData.nome_completo || userData.email) {
      const updateData: any = {};
      if (userData.nome_completo) updateData.nome_completo = userData.nome_completo;
      if (userData.email) updateData.email = userData.email;

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
        if (authError) throw authError;
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
   * Deletar usuário
   * Deleta do auth.users (cascade deleta profile e user_roles)
   *
   * NOTA: Usa uma função RPC do Supabase para deletar o usuário de forma segura
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

    return {
      id: data.id,
      nome_completo: data.nome_completo,
      email: data.email,
      avatar_url: data.avatar_url,
      roles: data.user_roles?.map((ur: any) => ({
        id: ur.roles.id,
        nome: ur.roles.nome
      })) || []
    };
  },
};
