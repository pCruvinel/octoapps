import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true,
      // Disable auto-generation of route files - only generate routeTree
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['buffer'],
      globals: {
        Buffer: true,
      },
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'figma:asset/42d2db99b3d95605cfc2a0a4ab068b4849ea4ee8.png': path.resolve(__dirname, './src/assets/42d2db99b3d95605cfc2a0a4ab068b4849ea4ee8.png'),
      'figma:asset/3e0f2ad4ca78eae045250cdc02ec9f71955cefcc.png': path.resolve(__dirname, './src/assets/3e0f2ad4ca78eae045250cdc02ec9f71955cefcc.png'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3003,
    open: true,
  },
});
