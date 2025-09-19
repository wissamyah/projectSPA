# Vercel Deployment Guide

This project has been optimized for deployment on Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI (optional): `npm i -g vercel`

## Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Deployment Methods

### Method 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel Dashboard
3. Vercel will automatically detect the framework (Vite)
4. Add environment variables in the Vercel dashboard
5. Deploy!

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Method 3: Manual Import

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure environment variables
4. Deploy

## Configuration Details

The project includes:

- `vercel.json`: Vercel-specific configuration
  - SPA routing (redirects all routes to index.html)
  - Security headers (XSS protection, frame options, etc.)
  - Cache control for static assets
  - Build optimization settings

- `vite.config.ts`: Vite build optimizations
  - Code splitting for vendor and Supabase libraries
  - Terser minification
  - Console/debugger removal in production
  - Disabled source maps for production

## Build Commands

- Development: `npm run dev`
- Production build: `npm run build`
- Preview production build: `npm run preview`
- Type checking: `npm run lint`
- Clean build: `npm run clean`

## Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] TypeScript errors resolved (optional, build skips type checking)
- [ ] Build succeeds locally (`npm run build`)
- [ ] All sensitive data in `.env` (not committed)
- [ ] Repository pushed to GitHub

## Performance Optimizations

The deployment configuration includes:

1. **Code Splitting**: Separates vendor and Supabase dependencies
2. **Caching**: Long-term caching for static assets (JS, CSS, images)
3. **Security Headers**: XSS protection, frame options, content type options
4. **Minification**: JavaScript minified with Terser
5. **Console Removal**: Console logs removed in production

## Troubleshooting

### Build Failures

If the build fails due to TypeScript errors:
- The current configuration skips TypeScript checking during build
- To enforce type checking: use `npm run build:strict`
- Fix type errors with `npm run lint`

### Environment Variables

Ensure all `VITE_` prefixed variables are set in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add each variable with its value
- Redeploy after adding variables

### 404 Errors on Routes

The `vercel.json` includes SPA routing configuration. All routes are redirected to `index.html` for client-side routing.