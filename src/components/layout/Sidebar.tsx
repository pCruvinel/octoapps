'use client';

import {
  LayoutDashboard,
  Settings,
  Users,
  Shield,
  Kanban,
  Calculator,
  FileText,
  ChevronDown,
  X,
  Zap,
  Briefcase,
  List,
  Calendar,
  Package,
  BarChart3,
  Sparkles,
  PieChart,
  Tag,
} from 'lucide-react';
import { useState } from 'react';
import LogoAzuk from '../../assets/Logo azuk.svg';
import { Link, useLocation } from '@tanstack/react-router';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

// Route mapping from old routes to new TanStack Router paths
const routeMap: Record<string, string> = {
  'dashboard': '/dashboard',
  'triagem': '/triagem',
  'crm/dashboard': '/crm/dashboard',
  'crm/oportunidades': '/crm/oportunidades',
  'crm/contatos': '/crm/contatos',
  'crm/calendario': '/crm/calendario',
  'crm/services': '/crm/services',
  'lista-casos': '/calc/lista',
  'peticoes': '/peticoes',
  'users': '/users',
  'permissions': '/permissions',
  'settings-ocr': '/settings/ocr',
  'settings-documents': '/settings/documents',
  'settings-event-categories': '/settings/event-categories',
};

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { profile } = useAuth();
  const { canRead } = usePermissions();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    executive: true, 
    settings: false,
    calculations: false,
    crm: false,
    sistema: false,
  });

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isAdmin = 
    profile?.roles?.includes('Administrador') || 
    profile?.roles?.includes('Admin Master') ||
    profile?.roles?.includes('Gestor') ||
    profile?.role === 'Gestor' || 
    profile?.role === 'Admin Master' || 
    profile?.role === 'Administrador' ||
    false;


  // Check if current path matches route
  const isActive = (route: string) => {
    const path = routeMap[route] || `/${route}`;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      id: 'executive',
      label: 'Painel Executivo',
      icon: LayoutDashboard,
      adminOnly: false,
      module: null,
      submenu: [
        { id: 'dashboard', label: 'Visão Geral', route: 'dashboard', icon: PieChart },
        { id: 'users', label: 'Usuários', route: 'users', icon: Users, adminOnly: true },
      ]
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: Briefcase,
      adminOnly: false,
      module: null,
      submenu: [
        { id: 'crm-dashboard', label: 'Dashboard Comercial', route: 'crm/dashboard', icon: BarChart3, module: 'crm' as const },
        { id: 'crm-opportunities', label: 'Oportunidades', route: 'crm/oportunidades', icon: Kanban, module: 'crm' as const },
        { id: 'crm-contacts', label: 'Contatos', route: 'crm/contatos', icon: Users, module: 'contacts' as const },
        { id: 'crm-calendar', label: 'Calendário', route: 'crm/calendario', icon: Calendar, module: 'crm' as const },
        { id: 'crm-services', label: 'Serviços', route: 'crm/services', icon: Package, module: 'crm' as const },
      ]
    },
    {
      id: 'calculations',
      label: 'Cálculo Revisional',
      icon: Calculator,
      adminOnly: false,
      module: 'calculations' as const,
      submenu: [
        { id: 'triagem', label: 'Análise Prévia', route: 'triagem', icon: Zap },
        { id: 'lista-casos', label: 'Lista de Casos', route: 'lista-casos', icon: List },
      ]
    },
    { id: 'peticoes', label: 'Geração de Petições', icon: FileText, route: 'peticoes', adminOnly: false, module: 'petitions' as const },
    {
      id: 'sistema',
      label: 'Sistema',
      icon: Settings,
      adminOnly: true,
      module: null,
      submenu: [
        { id: 'settings-documents', label: 'Documentos', route: 'settings-documents', icon: FileText, adminOnly: true },
        { id: 'settings-ocr', label: 'OCR & IA', route: 'settings-ocr', icon: Sparkles, adminOnly: true },
        { id: 'settings-event-categories', label: 'Categorias de Eventos', route: 'settings-event-categories', icon: Tag, adminOnly: true },
      ]
    },
  ];

  const NavItem = ({ item }: { item: any }) => {
    const itemIsActive = isActive(item.route);
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.id];

    // Verificar se é adminOnly
    if (item.adminOnly && !isAdmin) return null;

    // Verificar permissão de leitura do módulo
    if (item.module && !canRead(item.module)) return null;

    if (hasSubmenu) {
      return (
        <div className="px-2">
          <button
            onClick={() => toggleMenu(item.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.submenu.map((subItem: any) => {
                if (subItem.module && !canRead(subItem.module)) return null;
                const subPath = routeMap[subItem.route] || `/${subItem.route}`;

                return (
                  <Link
                    key={subItem.id}
                    to={subPath as any}
                    onClick={onMobileClose}
                    className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-sm transition-colors ${isActive(subItem.route)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                  >
                    {subItem.icon && <subItem.icon className="w-4 h-4" />}
                    {subItem.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const path = routeMap[item.route] || `/${item.route}`;

    return (
      <div className="px-2">
        <Link
          to={path as any}
          onClick={onMobileClose}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${itemIsActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span>{item.label}</span>
        </Link>
      </div>
    );
  };

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-border bg-white">
        <img src={LogoAzuk} alt="Azuk" className="h-6" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map(item => (
          <NavItem key={item.id} item={item} />
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
          {profile?.nome_completo || 'Usuário'}
        </div>

    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-border">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
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

            <div className="p-4 border-t border-sidebar-border">
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