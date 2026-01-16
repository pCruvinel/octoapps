import { useEffect, useState, useRef, useCallback } from 'react';
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
  role?: string | null;
  organization_id?: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Refs para evitar chamadas duplicadas
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const isLoadingProfileRef = useRef(false);

  const loadUserProfile = useCallback(async (userId: string) => {
    // Evitar carregamento duplicado
    if (isLoadingProfileRef.current || lastLoadedUserIdRef.current === userId) {
      return;
    }

    try {
      isLoadingProfileRef.current = true;
      lastLoadedUserIdRef.current = userId;

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Get roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(nome)')
        .eq('user_id', userId);

      const roles = userRoles?.map((ur: any) => ur.roles.nome) || [];

      if (profileData) {
        setProfile({
          ...profileData,
          roles,
          role: profileData.role,
          organization_id: profileData.organization_id
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      isLoadingProfileRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      if (session?.user) {
        // Resetar ref quando sessão muda (logout/login)
        if (lastLoadedUserIdRef.current !== session.user.id) {
          lastLoadedUserIdRef.current = null;
        }
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        lastLoadedUserIdRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

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
