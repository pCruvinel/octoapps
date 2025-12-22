import { createFileRoute } from '@tanstack/react-router';
import { PermissionsManagement } from '@/components/users/PermissionsManagement';

export const Route = createFileRoute('/_authenticated/permissions')({
  component: PermissionsPage,
});

function PermissionsPage() {
  return <PermissionsManagement />;
}
