import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { isValidEmail } from '../ui/utils';

interface SignupFormProps {
  onSuccess?: () => void;
  onToggleLogin?: () => void;
}

export function SignupForm({ onSuccess, onToggleLogin }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Por favor, insira um email válido');
      toast.error('Email inválido');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error('Erro ao criar conta: ' + error.message);
        }
        return;
      }

      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      onSuccess?.();
    } catch (error) {
      toast.error('Erro inesperado ao criar conta');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome Completo</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Seu nome completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          required
        />
      </div>

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
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Digite a senha novamente"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          'Criar Conta'
        )}
      </Button>

      {onToggleLogin && (
        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Já tem uma conta?{' '}
          </span>
          <button
            type="button"
            onClick={onToggleLogin}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Fazer login
          </button>
        </div>
      )}
    </form>
  );
}
