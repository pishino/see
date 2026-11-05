import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SEE_BASE: where the app is served from (/ by default; /see/ on GitHub Pages)
export default defineConfig({
  base: process.env.SEE_BASE || '/',
  plugins: [react()],
});
