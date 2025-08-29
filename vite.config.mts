import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { analyzer } from "vite-bundle-analyzer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler"]
        ],
      },
    }), 
    tailwindcss(),
    ...(mode === "analyze" ? [analyzer({ 
      analyzerMode: 'server',
      openAnalyzer: false,
      analyzerPort: 8888
    })] : [])
  ],
  css: {
    postcss: {},
  },
  build: {
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          react: ['react', 'react-dom'],
          lucide: ['lucide-react'],
          radix: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog', 
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-slot'
          ],
          convex: ['convex']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));