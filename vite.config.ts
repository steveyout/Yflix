import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // 1. Force Vite to look for the HMR websocket on the current host port
      // or specify the client port if you run Vite on a separate port (e.g., 5173)
      hmr: process.env.DISABLE_HMR === 'true'
          ? false
          : {
            // If you are accessing via https://yflix.online, use 'wss'
            protocol: 'ws',
            // Ensures Vite connects back to the current domain in the browser
            host: typeof window !== 'undefined' ? window.location.hostname : undefined,
          },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts: ['.yflix.online', 'yflix.online'],
    },
  };
});