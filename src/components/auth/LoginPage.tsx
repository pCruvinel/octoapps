'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../app/auth-provider';
import { toast } from 'sonner@2.0.3';
import logoImage from 'figma:asset/3e0f2ad4ca78eae045250cdc02ec9f71955cefcc.png';
import bgImage from 'figma:asset/42d2db99b3d95605cfc2a0a4ab068b4849ea4ee8.png';

interface LoginPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function LoginPage({ isDark, onToggleTheme }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    
    // Simula delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const success = login(username, password);
    
    if (success) {
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Usuário ou senha inválidos');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay escuro para melhor contraste */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      
      {/* Toggle de tema */}
      <button
        onClick={onToggleTheme}
        className="absolute top-6 right-6 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors z-10"
        aria-label="Alternar tema"
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Logo acima do card */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10">
        <img src={logoImage} alt="Octoapps" className="h-20 w-auto drop-shadow-2xl" />
      </div>

      <Card className="w-full max-w-md z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-white/20 dark:border-gray-800/50 mt-24">
        <CardHeader className="space-y-2 text-center pb-6 pt-8">
          <div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">
              Bem-vindo ao Octoapps
            </CardTitle>
            <CardDescription className="mt-2">
              Faça login para acessar a plataforma
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading}
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                💡 Credenciais de teste: <span className="font-mono">admin</span> / <span className="font-mono">1234</span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}