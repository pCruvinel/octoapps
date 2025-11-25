import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { OctoAppsLogo } from './OctoAppsLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface AuthPageProps {
  onSuccess?: () => void;
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Background decorativo com formas geométricas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>

        {/* Linhas diagonais decorativas */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent transform -skew-x-12"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-slate-500/20 to-transparent transform skew-x-12"></div>
        </div>
      </div>

      {/* Logo no topo */}
      <div className="mb-12 z-10">
        <OctoAppsLogo />
      </div>

      {/* Card de login */}
      <Card className="w-full max-w-md z-10 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {mode === 'login' ? 'Bem-vindo ao Octoapps' : 'Criar nova conta'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Faça login para acessar a plataforma'
              : 'Preencha os dados abaixo para criar sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'login' ? (
            <LoginForm
              onSuccess={onSuccess}
              onToggleSignup={() => setMode('signup')}
            />
          ) : (
            <SignupForm
              onSuccess={() => setMode('login')}
              onToggleLogin={() => setMode('login')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
