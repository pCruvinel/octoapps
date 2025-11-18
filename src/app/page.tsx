'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AppProviders, useApp } from './providers';

function HomeContent() {
  const router = useRouter();
  const { currentUser, setCurrentUser, theme, toggleTheme } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        currentRoute="dashboard"
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
          <Dashboard />
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppProviders>
      <HomeContent />
    </AppProviders>
  );
}
