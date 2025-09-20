import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1kb
      deleteOriginFile: false
    }),
    // Brotli compression (better compression than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    }),
    // Bundle analyzer (only in build mode)
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react-dom') || id.includes('react/jsx')) {
              return 'react-vendor'
            }
            if (id.includes('react-router')) {
              return 'router'
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase'
            }
            // React Query
            if (id.includes('@tanstack')) {
              return 'react-query'
            }
            // Icons - separate chunk for better caching
            if (id.includes('lucide-react')) {
              return 'icons'
            }
            // All other vendor code
            return 'vendor'
          }
        },
        // Use standard chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        passes: 2, // Reduced from 3
        // Removed unsafe optimizations
        unused: true,
        dead_code: true,
        collapse_vars: true,
        reduce_vars: true
      },
      mangle: {
        // Removed property mangling which can break runtime code
        toplevel: false // Changed to false to prevent breaking top-level names
      },
      format: {
        comments: false,
        ascii_only: true
      }
    },
    // Enable tree-shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    // Enable compression reporting to track our optimization progress
    reportCompressedSize: true,
    sourcemap: false,
    // Optimize CSS
    cssMinify: true,
    cssCodeSplit: true,
    // Set asset inline limit (4kb)
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@supabase/auth-ui-react',
      '@tanstack/react-query',
      'lucide-react'
    ],
    exclude: ['@tanstack/react-query-devtools'], // Exclude devtools from production
    esbuildOptions: {
      target: 'es2020', // Modern target for better optimization
      minify: true
    }
  },
  server: {
    port: 5173,
    strictPort: false
  },
  preview: {
    port: 4173,
    strictPort: false
  }
})