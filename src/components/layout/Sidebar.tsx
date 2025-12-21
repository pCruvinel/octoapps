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
  X,
  Zap,
  Briefcase,
  List,
  Calendar
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ currentRoute, onNavigate, isMobileOpen, onMobileClose }: SidebarProps) {
  const { profile } = useAuth();
  const { canRead, canManagePermissions } = usePermissions();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    settings: false,
    calculations: false,
    crm: false,
  });

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isAdmin = profile?.roles?.includes('Administrador') || false;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard, route: 'dashboard', adminOnly: false, module: null },
    { id: 'triagem-express', label: 'Triagem Rápida', icon: Zap, route: 'triagem', adminOnly: false, module: 'calculations' as const },
    {
      id: 'crm',
      label: 'CRM',
      icon: Briefcase,
      adminOnly: false,
      module: null,
      submenu: [
        { id: 'crm-opportunities', label: 'Oportunidades', route: 'crm/oportunidades', icon: Kanban, module: 'crm' as const },
        { id: 'crm-contacts', label: 'Contatos', route: 'crm/contatos', icon: Users, module: 'contacts' as const },
        { id: 'crm-calendar', label: 'Calendário', route: 'crm/calendario', icon: Calendar, module: 'crm' as const },
      ]
    },
    {
      id: 'calculations',
      label: 'Cálculo Revisional',
      icon: Calculator,
      adminOnly: false,
      module: 'calculations' as const,
      submenu: [
        { id: 'triagem', label: 'Triagem Rápida', route: 'triagem', icon: Zap },
        { id: 'lista-casos', label: 'Lista de Casos', route: 'lista-casos', icon: List },
      ]
    },
    { id: 'peticoes', label: 'Geração de Petições', icon: FileText, route: 'peticoes', adminOnly: false, module: 'petitions' as const },
    { id: 'users', label: 'Usuários', icon: Users, route: 'users', adminOnly: true, module: null },
    { id: 'permissions', label: 'Permissões', icon: Shield, route: 'permissions', adminOnly: true, module: null },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      adminOnly: true,
      module: null,
      submenu: [
        { id: 'settings-general', label: 'Opções Gerais', route: 'settings-general' },
        { id: 'settings-documents', label: 'Documentos', route: 'settings-documents' },
        { id: 'settings-funnel', label: 'Funil e Cards', route: 'settings-funnel' },
        { id: 'settings-ocr', label: 'OCR & IA', route: 'settings-ocr' },
      ]
    },
  ];

  const NavItem = ({ item }: { item: any }) => {
    const isActive = currentRoute === item.route;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.id];

    // Verificar se é adminOnly
    if (item.adminOnly && !isAdmin) return null;

    // Verificar permissão de leitura do módulo (se o item tiver módulo associado)
    if (item.module && !canRead(item.module)) return null;

    if (hasSubmenu) {
      return (
        <div className="px-2">
          <button
            onClick={() => toggleMenu(item.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-300 hover:text-gray-900 transition-colors"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.submenu.map((subItem: any) => {
                // Check permissions for sub-items if they have specific module requirements
                if (subItem.module && !canRead(subItem.module)) return null;

                return (
                  <button
                    key={subItem.id}
                    onClick={() => onNavigate(subItem.route)}
                    className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-sm transition-colors ${currentRoute === subItem.route
                      ? 'bg-[#3D96FF] text-white'
                      : 'text-gray-600 hover:bg-gray-300 hover:text-gray-900'
                      }`}
                  >
                    {subItem.icon && <subItem.icon className="w-4 h-4" />}
                    {subItem.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="px-2">
        <button
          onClick={() => onNavigate(item.route)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
            ? 'bg-[#3D96FF] text-white'
            : 'text-gray-700 hover:bg-gray-300 hover:text-gray-900'
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
      <div className="p-4 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-semibold">Octoapps</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map(item => (
          <NavItem key={item.id} item={item} />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-300">
        <div className="text-xs text-gray-600">
          {profile?.nome_completo || 'Usuário'}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#EEEEEE] border-r border-gray-300">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#EEEEEE] border-r border-gray-300 flex flex-col">
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-semibold">Octoapps</span>
              </div>
              <button onClick={onMobileClose} className="text-gray-600 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              {menuItems.map(item => (
                <NavItem key={item.id} item={item} />
              ))}
            </nav>

            <div className="p-4 border-t border-gray-300">
              <div className="text-xs text-gray-600">
                {profile?.nome_completo || 'Usuário'}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}