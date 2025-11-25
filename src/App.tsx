import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { GeneralSettings } from './components/settings/GeneralSettings';
import { FunnelSettings } from './components/settings/FunnelSettings';
import { UserManagement } from './components/users/UserManagement';
import { PermissionsManagement } from './components/users/PermissionsManagement';
import { ContactsList } from './components/contacts/ContactsList';
import { ContactDetails } from './components/contacts/ContactDetails';
import { CRMKanban } from './components/crm/CRMKanban';
import { OpportunityDetails } from './components/crm/OpportunityDetails';
import { CalculationsList } from './components/calculations/CalculationsList';
import { FinanciamentoImobiliario } from './components/calculations/FinanciamentoImobiliario';
import { CartaoCredito } from './components/calculations/CartaoCredito';
import { EmprestimosFinanciamentos } from './components/calculations/EmprestimosFinanciamentos';
import { AnalisePrevia } from './components/calculations/AnalisePrevia';
import { AnalisePreviaCartao } from './components/calculations/AnalisePreviaCartao';
import { RelatorioCompleto } from './components/calculations/RelatorioCompleto';
import { UploadContratos } from './components/calculations/UploadContratos';
import { PeticoesList } from './components/peticoes/PeticoesList';
import { PeticoesEditor } from './components/peticoes/PeticoesEditor';
import { Toaster } from './components/ui/sonner';

export type ThemeMode = 'light' | 'dark';

function AppContent() {
  const { user, profile, loading } = useAuth();

  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null); // Estado para passar dados entre rotas

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const navigate = (route: string, id?: string, data?: any) => {
    setCurrentRoute(route);
    setSelectedId(id || null);
    setRouteData(data || null); // Armazenar dados da rota
    setIsMobileSidebarOpen(false);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <>
        <AuthPage onSuccess={() => setCurrentRoute('dashboard')} />
        <Toaster position="top-center" />
      </>
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard />;
      case 'settings-general':
        return <GeneralSettings />;
      case 'settings-funnel':
        return <FunnelSettings />;
      case 'users':
        return <UserManagement />;
      case 'permissions':
        return <PermissionsManagement />;
      case 'contacts':
        return <ContactsList onNavigate={navigate} />;
      case 'contact-details':
        return <ContactDetails contactId={selectedId} onNavigate={navigate} />;
      case 'crm':
        return <CRMKanban onNavigate={navigate} />;
      case 'opportunity-details':
        return <OpportunityDetails opportunityId={selectedId} onNavigate={navigate} />;
      case 'calculations':
        return <CalculationsList onNavigate={navigate} />;
      case 'calc-financiamento':
        return <FinanciamentoImobiliario calcId={selectedId} onNavigate={navigate} />;
      case 'calc-cartao':
        return <CartaoCredito calcId={selectedId} onNavigate={navigate} />;
      case 'calc-emprestimos':
        return <EmprestimosFinanciamentos calcId={selectedId} onNavigate={navigate} />;
      case 'calc-analise':
        return <AnalisePrevia calcId={selectedId} onNavigate={navigate} data={routeData} />;
      case 'calc-analise-cartao':
        // DEPRECATED: Agora usa 'calc-analise' (UI unificada)
        // Mantido para compatibilidade com casos antigos
        return <AnalisePrevia calcId={selectedId} onNavigate={navigate} data={routeData} />;
      case 'calc-relatorio':
        return <RelatorioCompleto calcId={selectedId} onNavigate={navigate} data={routeData} />;
      case 'upload-contratos':
        return <UploadContratos onNavigate={navigate} />;
      case 'peticoes':
        return <PeticoesList onNavigate={navigate} />;
      case 'peticoes-editor':
        return <PeticoesEditor documentId={selectedId} onNavigate={navigate} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={navigate}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          theme={theme}
          onThemeToggle={toggleTheme}
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          {renderContent()}
        </main>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}