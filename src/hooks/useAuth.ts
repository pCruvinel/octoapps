import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface UserProfile {
  id: string;
  nome_completo: string | null;
  avatar_url: string | null;
  telefone: string | null;
  cargo: string | null;
  roles?: string[];
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });

      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        // Token renovado com sucesso
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      } else if (event === 'SIGNED_OUT') {
        // Limpar estado local
        setAuthState({ user: null, session: null, loading: false });
        setProfile(null);
      } else if (event === 'USER_UPDATED') {
        // Atualizar dados do usuário
        if (session?.user) {
          loadUserProfile(session.user.id);
        }
      } else {
        // Outros eventos
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });

        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Verificação periódica de renovação de token
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const expiresAt = session.expires_at;
        if (!expiresAt) return;

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        // Se faltam menos de 5 minutos para expirar, tenta renovar
        if (timeUntilExpiry < 300) {
          const { error } = await supabase.auth.refreshSession();

          if (error) {
            // Se não conseguir renovar, faz logout
            await signOut();
          }
        }
      }
    };

    // Verifica a cada 1 minuto
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get user roles
      let roles: string[] = [];
      try {
        const { data: userRolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role_id, roles(nome)')
          .eq('user_id', userId);

        if (rolesError) {
          console.error('Error loading user roles:', rolesError);
        } else if (userRolesData) {
          roles = userRolesData
            .map((ur: any) => ur.roles?.nome)
            .filter((nome: string | null) => nome !== null);
        }
      } catch (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      setProfile({
        ...profileData,
        roles,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: fullName,
          },
        },
      });

      if (error) throw error;

      // Profile will be created automatically by trigger
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    // 1. Limpa PRIMEIRO o localStorage do Supabase (antes de chamar signOut)
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();

    // 2. Limpa o estado React (força re-render)
    setAuthState({ user: null, session: null, loading: false });
    setProfile(null);

    // 3. Tenta fazer logout no servidor (ignora erros silenciosamente)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignora erros (ex: 403 com token expirado)
    }

    return { error: null };
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id);

      if (error) throw error;

      // Reload profile
      await loadUserProfile(authState.user.id);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const hasRole = (roleName: string): boolean => {
    return profile?.roles?.includes(roleName) ?? false;
  };

  const isAdmin = (): boolean => {
    return hasRole('Administrador');
  };

  return {
    user: authState.user,
    session: authState.session,
    profile,
    loading: authState.loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole,
    isAdmin,
  };
}
