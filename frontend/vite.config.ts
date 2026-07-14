import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    watch: {
      ignored: ['**/.git/**', '**/dist/**', '**/coverage/**'],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@monaco-editor/react']
  },
});
