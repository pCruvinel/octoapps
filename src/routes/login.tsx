import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AuthPage } from '@/components/auth/AuthPage';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthPage
      onSuccess={() => navigate({ to: '/dashboard' })}
    />
  );
}
