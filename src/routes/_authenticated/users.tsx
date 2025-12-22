import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { UserManagement } from '@/components/users/UserManagement';

export const Route = createFileRoute('/_authenticated/users')({
  component: UsersPage,
});

function UsersPage() {
  const navigate = useNavigate();

  return (
    <UserManagement
      onNavigate={(route: string) => {
        if (route === 'permissions') {
          navigate({ to: '/permissions' });
        }
      }}
    />
  );
}
