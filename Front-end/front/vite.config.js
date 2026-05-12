import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // exceljs browser compatibility
      '../../../utils/nodeBuffer': 'buffer',
    },
  },
  optimizeDeps: {
    include: ['exceljs'],
  },
})
