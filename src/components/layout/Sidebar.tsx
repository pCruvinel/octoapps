'use client';

import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Shield, 
  Contact, 
  Kanban, 
  Calculator, 
  FileText,
  Upload,
  ChevronDown,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ currentRoute, onNavigate, isMobileOpen, onMobileClose }: SidebarProps) {
  const { profile } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    settings: false,
    calculations: false,
  });

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isAdmin = profile?.roles?.includes('Administrador') || false;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard, route: 'dashboard', adminOnly: false },
    { id: 'crm', label: 'Pipeline', icon: Kanban, route: 'crm', adminOnly: false },
    { id: 'contacts', label: 'Contatos', icon: Contact, route: 'contacts', adminOnly: false },
    {
      id: 'calculations',
      label: 'Cálculo Revisional',
      icon: Calculator,
      adminOnly: false,
      submenu: [
        { id: 'calculations', label: 'Lista de Casos', route: 'calculations' },
        { id: 'upload-contratos', label: 'Upload de Contratos', route: 'upload-contratos' },
      ]
    },
    { id: 'peticoes', label: 'Geração de Petições', icon: FileText, route: 'peticoes', adminOnly: false },
    { id: 'users', label: 'Usuários', icon: Users, route: 'users', adminOnly: true },
    { id: 'permissions', label: 'Permissões', icon: Shield, route: 'permissions', adminOnly: true },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      adminOnly: true,
      submenu: [
        { id: 'settings-general', label: 'Opções Gerais', route: 'settings-general' },
        { id: 'settings-funnel', label: 'Funil e Cards', route: 'settings-funnel' },
      ]
    },
  ];

  const NavItem = ({ item }: { item: any }) => {
    const isActive = currentRoute === item.route;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.id];

    if (item.adminOnly && !isAdmin) return null;

    if (hasSubmenu) {
      return (
        <div className="px-2">
          <button
            onClick={() => toggleMenu(item.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-300 dark:text-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.submenu.map((subItem: any) => (
                <button
                  key={subItem.id}
                  onClick={() => onNavigate(subItem.route)}
                  className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-sm transition-colors ${
                    currentRoute === subItem.route
                      ? 'bg-[#3D96FF] text-white'
                      : 'text-gray-600 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  {subItem.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="px-2">
        <button
          onClick={() => onNavigate(item.route)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive
              ? 'bg-[#3D96FF] text-white'
              : 'text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
          }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span>{item.label}</span>
        </button>
      </div>
    );
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-300 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-gray-900 dark:text-white font-semibold">Octoapps</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map(item => (
          <NavItem key={item.id} item={item} />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-300 dark:border-gray-800">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {profile?.nome_completo || 'Usuário'}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#DDDDDD] dark:bg-black border-r border-gray-300 dark:border-gray-800">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#DDDDDD] dark:bg-black border-r border-gray-300 dark:border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-white font-semibold">Octoapps</span>
              </div>
              <button onClick={onMobileClose} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4">
              {menuItems.map(item => (
                <NavItem key={item.id} item={item} />
              ))}
            </nav>

            <div className="p-4 border-t border-gray-300 dark:border-gray-800">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {currentUser}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}