import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The production build ships a Content Security Policy that forbids every network
// connection (connect-src 'none'), so the browser itself enforces "nothing leaves your
// device". It is build-only because the dev server needs a websocket for hot reload.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "worker-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const cspPlugin = (): Plugin => ({
  name: 'tipoff-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

// BASE is set to "/buildwithai/" for the GitHub Pages build (see scripts/deploy.mjs).
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react(), cspPlugin()],
  worker: { format: 'es' },
  build: { target: 'es2022', sourcemap: true },
  test: {
    include: ['tests/engine/**/*.test.ts'],
    environment: 'node',
  },
});
