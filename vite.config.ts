import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built app deploys to any GitHub Pages path,
// same pattern as the Consignment / Popup agents.
export default defineConfig({
  base: './',
  plugins: [react()],
})
