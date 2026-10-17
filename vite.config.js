import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue2';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/logicflow-vue-exp/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}));
