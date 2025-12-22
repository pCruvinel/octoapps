import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type { useAuth } from '@/hooks/useAuth';

// Create the router instance
export const router = createRouter({
    routeTree,
    context: {
        auth: undefined!, // Will be set in App.tsx via RouterProvider context
    },
    defaultPreload: 'intent',
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

// Export the router context type
export interface RouterContext {
    auth: ReturnType<typeof useAuth>;
}
