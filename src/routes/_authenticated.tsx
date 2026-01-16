import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useState } from 'react';
import { toast } from 'sonner';

// Admin-only routes
const ADMIN_ROUTES = ['/users', '/permissions', '/settings'];

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    // Check if user is authenticated
    if (!context.auth.user) {
      throw redirect({ to: '/login' });
    }

    // Check admin-only routes
    const isAdminRoute = ADMIN_ROUTES.some(r => location.pathname.startsWith(r));
    const userRole = context.auth.profile?.roles?.[0] || context.auth.profile?.role; // Support both array (legacy) and string (new)
    
    // Roles that have admin access
    const ADMIN_ROLES = ['Administrador', 'Gestor', 'Admin Master'];
    const isAdmin = ADMIN_ROLES.includes(userRole as string) || (Array.isArray(context.auth.profile?.roles) && context.auth.profile?.roles.some((r: string) => ADMIN_ROLES.includes(r)));

    if (isAdminRoute && !isAdmin) {
      toast.error('Acesso restrito a administradores');
      throw redirect({ to: '/dashboard' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          theme={theme}
          onThemeToggle={toggleTheme}
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
