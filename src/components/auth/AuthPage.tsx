import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import backgroundImage from '../../assets/Background 2k.jpg';
import logoImage from '../../assets/Logo branco.svg';

interface AuthPageProps {
  onSuccess?: () => void;
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />

      {/* Logo no topo */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10">
        <img src={logoImage} alt="OctoApps Logo" className="h-20 w-auto" />
      </div>

      {/* Card de login */}
      <div className="min-h-screen flex items-center justify-center p-4">
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
    </div>
  );
}
