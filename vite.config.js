import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true, // Mengekspos dev server ke jaringan lokal (HP / Wi-Fi)
    port: 5173
  }
});
