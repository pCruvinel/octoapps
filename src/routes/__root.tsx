import { createRootRouteWithContext, Outlet, Link, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from '@/components/ui/sonner';
import { Home, AlertTriangle } from 'lucide-react';

// Import useAuth type for context
import type { useAuth } from '@/hooks/useAuth';

interface RouterContext {
    auth: ReturnType<typeof useAuth>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
    errorComponent: GlobalErrorBoundary,
    notFoundComponent: NotFoundPage,
});

// Loading bar component
function LoadingBar() {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-100">
            <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%' }} />
        </div>
    );
}

function RootComponent() {
    const isLoading = useRouterState({ select: (s) => s.isLoading });

    return (
        <>
            {isLoading && <LoadingBar />}
            <Outlet />
            <Toaster position="top-center" />
            <TanStackRouterDevtools position="bottom-right" />
        </>
    );
}

// Global Error Boundary
function GlobalErrorBoundary({ error }: { error: Error }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Erro Inesperado</h1>
                <p className="text-slate-600 mb-4">{error.message}</p>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Home className="w-4 h-4" />
                    Voltar ao Início
                </Link>
            </div>
        </div>
    );
}

// Not Found Page (404)
function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <h1 className="text-6xl font-bold text-slate-300 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Página não encontrada</h2>
                <p className="text-slate-600 mb-6">A página que você está procurando não existe ou foi movida.</p>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Home className="w-4 h-4" />
                    Voltar ao Início
                </Link>
            </div>
        </div>
    );
}
