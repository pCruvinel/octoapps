'use client';

import { Bell, User, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

type ThemeMode = 'light' | 'dark';

interface TopbarProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
  onMobileMenuToggle: () => void;
}

const mockNotifications = [
  { id: 1, text: 'Nova oportunidade criada no Pipeline', read: false, time: 'há 5 min' },
  { id: 2, text: 'Cálculo revisional finalizado', read: false, time: 'há 15 min' },
  { id: 3, text: 'Petição exportada com sucesso', read: true, time: 'há 1 hora' },
  { id: 4, text: 'Novo contato adicionado', read: true, time: 'há 2 horas' },
];

export function Topbar({ theme, onThemeToggle, onMobileMenuToggle }: TopbarProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const { signOut, user, profile } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <Menu className="w-6 h-6" />
        </button>

      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm">Notificações</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(notif => (
                <DropdownMenuItem
                  key={notif.id}
                  className={`flex flex-col items-start gap-1 p-3 ${!notif.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-2 w-full">
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{notif.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <div className="border-t p-2">
              <Button variant="ghost" className="w-full text-sm">
                Ver todas
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">{profile?.nome_completo || user?.email || 'Usuário'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}