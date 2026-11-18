import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Content Security Policy for the built app only (the dev server needs inline scripts for hot reload).
// The only outside address the app talks to is the currency rates API.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://open.er-api.com"

const cspPlugin = {
  name: 'calcpro-csp',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspPlugin],
  // relative asset paths so the same build works on a web host, in the Android app
  // (https://localhost) and in the Windows app (loaded from file://)
  base: './',
  // Older Android phones run old WebViews (Android 11 emulator ships Chrome 90). Without these
  // targets the CSS minifier rewrites media queries to range syntax (width>=860px), which
  // Chrome < 104 ignores, and drops the 100% height fallback for 100dvh.
  build: {
    target: ['es2020', 'chrome87', 'edge88', 'firefox78', 'safari14'],
    cssTarget: ['chrome87', 'edge88', 'firefox78', 'safari14'],
  },
})
