'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserPersona = 'Ana Admin' | 'Diego Perito' | 'Maria Advogada';
export type ThemeMode = 'light' | 'dark';

interface AppContextType {
  currentUser: UserPersona;
  setCurrentUser: (user: UserPersona) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProviders({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserPersona>('Ana Admin');
  const [theme, setTheme] = useState<ThemeMode>('light');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, theme, setTheme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProviders');
  }
  return context;
}
