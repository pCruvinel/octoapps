import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface AuthPageProps {
  onSuccess?: () => void;
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar nova conta'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Entre com suas credenciais para acessar o sistema'
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
