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
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        // Optimize entry chunk
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
        passes: 3, // More compression passes
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unused: true, // Remove unused code
        dead_code: true, // Remove dead code
        collapse_vars: true, // Collapse single-use vars
        reduce_vars: true, // Optimize variable references
        inline: 3, // Inline functions with up to 3 uses
        hoist_funs: true // Hoist function declarations
      },
      mangle: {
        properties: {
          regex: /^_/ // Mangle properties starting with underscore
        },
        toplevel: true // Mangle top-level names
      },
      format: {
        comments: false,
        ascii_only: true,
        wrap_iife: true // Wrap IIFEs for better compression
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