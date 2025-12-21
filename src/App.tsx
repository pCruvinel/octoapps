import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { GeneralSettings } from './components/settings/GeneralSettings';
import { FunnelSettings } from './components/settings/FunnelSettings';
import { OCRSettingsPage } from './components/settings/OCRSettingsPage';
import { UserManagement } from './components/users/UserManagement';
import { PermissionsManagement } from './components/users/PermissionsManagement';
import { ContactsList } from './components/contacts/ContactsList';
import { ContactDetails } from './components/contacts/ContactDetails';
import { CRMKanban } from './components/crm/CRMKanban';
import { OpportunityDetails } from './components/crm/OpportunityDetails';
import { CRMCalendar } from './components/crm/CRMCalendar';
import { ListaCasos } from './components/calculations/ListaCasos';
import { RelatorioCompleto } from './components/calculations/RelatorioCompleto';
import { ModuleSelection } from './components/calculations/ModuleSelection';

import { CalculationWizard } from './components/calculations/wizard';
import { ResultsDashboard } from './components/calculations/results';
import { TriagemRapida } from './components/triagem/TriagemRapida';
import { PeticoesList } from './components/peticoes/PeticoesList';

import { PeticoesEditor } from './components/peticoes/PeticoesEditor';
import { DocumentSettingsPage } from './components/settings/DocumentSettingsPage';
import { Toaster } from './components/ui/sonner';
import { wizardResultToResultsDashboard, resultToLaudoData } from '@/lib/calculationAdapters';
import { laudoExportService } from '@/services/laudoExport.service';

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
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Carregando...</div>
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
      case 'settings-ocr':
        return <OCRSettingsPage />;
      case 'settings-documents':
        return <DocumentSettingsPage />;
      case 'users':
        return <UserManagement onNavigate={navigate} />;
      case 'permissions':
        return <PermissionsManagement />;
      case 'contacts': // Legacy fallback/redirect if needed, but updated items use crm/contatos
      case 'crm/contatos':
        return <ContactsList onNavigate={navigate} />;
      case 'contact-details':
        return <ContactDetails contactId={selectedId} onNavigate={navigate} />;
      case 'crm': // Legacy fallback
      case 'crm/oportunidades':
        return <CRMKanban onNavigate={navigate} />;
      case 'crm/calendario':
        return <CRMCalendar onNavigate={navigate} />;
      case 'opportunity-details':
        return <OpportunityDetails opportunityId={selectedId} onNavigate={navigate} />;
      case 'calculations':
        return <ListaCasos onNavigate={navigate} />;
      case 'lista-casos':
        return <ListaCasos onNavigate={navigate} />;
      case 'calc-relatorio':
        return <RelatorioCompleto calcId={selectedId} onNavigate={navigate} data={routeData} />;
      case 'novo-calculo':
        return <ModuleSelection onNavigate={navigate} />;
      case 'triagem':
        return <TriagemRapida onNavigateToWizard={() => navigate('novo-calculo')} />;
      case 'calc-wizard':
        // Get module and optional resume data from routeData
        const wizardModule = routeData?.module || 'GERAL';
        const resumeData = routeData?.initialData || undefined;
        const resumeContratoId = routeData?.contratoId || undefined;
        return <CalculationWizard
          module={wizardModule}
          initialData={resumeData}
          existingContratoId={resumeContratoId}
          onBack={() => navigate('lista-casos')}
          onComplete={(result) => {
            navigate('calc-results', undefined, result);
          }}
        />;
      case 'calc-results':
        // Convert wizard result to dashboard data format
        if (routeData) {
          const dashboardData = wizardResultToResultsDashboard(routeData);
          return <ResultsDashboard
            data={dashboardData}
            onBack={() => navigate('calculations')}
            onExportPDF={() => {
              const laudoData = resultToLaudoData(routeData.wizardData, routeData.result);
              laudoExportService.exportToPdf(laudoData);
            }}
          />;
        }
        return <ListaCasos onNavigate={navigate} />;
      case 'peticoes':
        return <PeticoesList onNavigate={navigate} />;
      case 'peticoes-editor':
        return <PeticoesEditor documentId={selectedId} onNavigate={navigate} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
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

        <main className="flex-1 overflow-y-auto bg-slate-50">
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