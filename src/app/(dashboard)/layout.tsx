'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { AppProviders, useApp } from '../providers';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, theme, toggleTheme } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Convert pathname to route
  const currentRoute = pathname === '/' ? 'dashboard' : pathname.slice(1);

  const navigate = (route: string) => {
    if (route === 'dashboard') {
      router.push('/');
    } else {
      router.push(`/${route}`);
    }
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <Sidebar
        currentRoute={currentRoute}
        currentUser={currentUser}
        onNavigate={navigate}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          currentUser={currentUser}
          onUserChange={setCurrentUser}
          theme={theme}
          onThemeToggle={toggleTheme}
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AppProviders>
  );
}
