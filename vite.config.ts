import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/pookiemistakes/',
  plugins: [react()],
  server: {
    open: true,
    port: 3000,
  },
  preview: {
    port: 3000,
  },
}); 