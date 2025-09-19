# Project Memory

## Development Workflow
- **Always commit to the dev branch first** before merging to main
- This ensures the project doesn't face any bugs, challenges or errors in production
- The main branch is connected to Vercel for automatic deployments

## Editor Configuration
- Main editor: Cursor

## Project Structure
- Repository: https://github.com/wissamyah/projectSPA.git
- Branches:
  - `main`: Production branch (auto-deploys to Vercel)
  - `dev`: Development branch for testing changes

## Optimization Progress (Vercel Free Tier)
### Phase 1: Compression ✅ (Dec 19, 2024)
- Added Gzip & Brotli compression
- Reduced bundle size from 661KB to 131KB (80% reduction)
- Increased capacity from 150k to 760k visits/month on free tier
- Files: `vite.config.ts` updated, `vite-plugin-compression` added

### Phase 2: Code Splitting ✅ (Dec 19, 2024)
- Implemented lazy loading for all admin routes
- Reduced initial bundle by 34% (429KB → 285KB)
- Created 10 separate chunks for on-demand loading
- Customer bundle now 18KB smaller (Brotli)
- Files: `App.tsx` updated, `RouteLoadingFallback.tsx` created

### Combined Impact:
- 90% total bandwidth reduction
- Supports ~1.5M visits/month on free tier
- Customer initial load: 65KB (vs original 661KB)

### Phase 3-6: See OPTIMIZATION_PLAN.md for roadmap