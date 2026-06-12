import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // self-signed HTTPS — needed so getUserMedia works on LAN devices
  ],
  server: {
    host: true,       // listen on 0.0.0.0 — exposes to LAN so phone can connect
    port: 5173,
    strictPort: true,
  },
});
