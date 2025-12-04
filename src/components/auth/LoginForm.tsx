import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { isValidEmail } from '../ui/utils';

interface LoginFormProps {
  onSuccess?: () => void;
  onToggleSignup?: () => void;
}

export function LoginForm({ onSuccess, onToggleSignup }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Por favor, insira um email válido');
      toast.error('Email inválido');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error('Erro ao fazer login: ' + error.message);
        }
        return;
      }

      toast.success('Login realizado com sucesso!');
      onSuccess?.();
    } catch (error) {
      toast.error('Erro inesperado ao fazer login');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => {
            const emailValue = e.target.value;
            setEmail(emailValue);
            if (emailValue && !isValidEmail(emailValue)) {
              setEmailError('Por favor, insira um email válido');
            } else {
              setEmailError('');
            }
          }}
          onBlur={(e) => {
            if (e.target.value && !isValidEmail(e.target.value)) {
              setEmailError('Por favor, insira um email válido');
            }
          }}
          disabled={loading}
          required
          aria-invalid={emailError ? 'true' : 'false'}
        />
        {emailError && (
          <p className="text-sm text-destructive">{emailError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>

      {onToggleSignup && (
        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
          </span>
          <button
            type="button"
            onClick={onToggleSignup}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Criar conta
          </button>
        </div>
      )}
    </form>
  );
}
