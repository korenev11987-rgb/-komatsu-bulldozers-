import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// База публикации настраивается переменной окружения:
//  - по умолчанию './' — сборка открывается из любой папки (и локально через file-сервер);
//  - для GitHub Pages workflow передаёт VITE_BASE=/<имя-репозитория>/.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react()],
  server: { port: 5173, open: false },
});
