import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { AuthPage } from '@/components/auth/AuthPage';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || '/dashboard',
    };
  },
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { redirect } = useSearch({ from: '/login' });

  // Reactive redirect: if user is already logged in, go to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: redirect || '/dashboard' });
    }
  }, [user, loading, navigate, redirect]);

  // Show nothing while checking auth to avoid flash
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  // If already logged in, don't show login page
  if (user) {
    return null;
  }

  return (
    <AuthPage
      onSuccess={() => navigate({ to: redirect || '/dashboard' })}
    />
  );
}
