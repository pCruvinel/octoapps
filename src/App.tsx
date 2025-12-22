import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { Toaster } from './components/ui/sonner';

function InnerApp() {
  const auth = useAuth();

  // Show loading screen while checking auth
  if (auth.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return <RouterProvider router={router} context={{ auth }} />;
}

export default function App() {
  return <InnerApp />;
}