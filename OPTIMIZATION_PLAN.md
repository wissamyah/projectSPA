# Vercel Free Tier Optimization Plan

## Overview
This document outlines a phased approach to optimize your SPA for Vercel's free tier limitations, focusing on reducing bandwidth usage, improving performance, and staying within resource limits.

## Current Baseline Metrics
- **Total Bundle Size**: ~655KB (uncompressed)
- **Initial Load**: 4 files (vendor, supabase, main, CSS)
- **Database Queries per Page**: 6-8 separate calls
- **Caching Strategy**: Static assets only
- **Code Splitting**: Manual chunks only

## Phase 1: Quick Wins - Compression & Build Optimization
**Timeline**: 30 minutes
**Impact**: 50-60% bandwidth reduction
**Risk**: Low

### Tasks:
1. Enable Vite compression plugin
2. Optimize Terser settings
3. Add build-time compression
4. Update Vercel headers for gzip/brotli

### Expected Results:
- Bundle size: 655KB → ~260KB (60% reduction)
- Bandwidth saved: ~400KB per visit
- Free tier headroom: 150k → 380k visits/month

---

## Phase 2: Route-Based Code Splitting
**Timeline**: 2 hours
**Impact**: 40% reduction in initial bundle
**Risk**: Medium

### Tasks:
1. Implement React.lazy() for admin routes
2. Create loading components
3. Split admin components from main bundle
4. Separate staff-only features

### Routes to Split:
- `/admin/*` - Admin dashboard and sub-pages
- `/staff-schedule` - Staff-only view
- `/setup` - One-time setup page
- `/email-viewer` - Development tool

### Expected Results:
- Initial bundle: 421KB → ~250KB
- Admin bundle: ~170KB (loaded on demand)
- Faster initial page load for customers

---

## Phase 3: Client-Side Caching with React Query
**Timeline**: 3-4 hours
**Impact**: 70% reduction in API calls
**Risk**: Medium

### Tasks:
1. Install and configure React Query
2. Wrap Supabase calls with useQuery hooks
3. Implement cache invalidation strategy
4. Add optimistic updates for bookings

### Key Areas:
- Services list (cache: 5 minutes)
- Staff availability (cache: 1 minute)
- Bookings grid (cache: 30 seconds)
- User session (cache: until logout)

### Expected Results:
- API calls: 6-8 per page → 1-2 per page
- Reduced Supabase bandwidth usage
- Improved perceived performance

---

## Phase 4: Bundle Optimization
**Timeline**: 2 hours
**Impact**: 20-30% additional size reduction
**Risk**: Low

### Tasks:
1. Analyze bundle with rollup-plugin-visualizer
2. Tree-shake unused Lucide icons
3. Optimize React imports
4. Externalize rarely-used dependencies
5. Implement dynamic imports for heavy components

### Specific Optimizations:
- Replace moment.js with date-fns (if used)
- Import only needed Lucide icons
- Lazy load auth UI components
- Split PDF/print functionality

### Expected Results:
- Further 50-100KB reduction
- Better chunk distribution
- Improved cache hit rates

---

## Phase 5: Performance Monitoring
**Timeline**: 1 hour
**Impact**: Visibility into usage patterns
**Risk**: Low

### Tasks:
1. Add basic analytics to track:
   - Page load times
   - Bundle cache hits
   - API call patterns
   - Error rates
2. Create bandwidth usage dashboard
3. Set up alerts for limits

### Metrics to Track:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Cumulative Layout Shift (CLS)
- API response times
- Cache hit ratios

---

## Phase 6: Progressive Enhancement
**Timeline**: 3-4 hours
**Impact**: Better UX and resilience
**Risk**: Medium

### Tasks:
1. Add service worker for offline support
2. Implement stale-while-revalidate caching
3. Add loading skeletons
4. Implement virtual scrolling for long lists
5. Add image lazy loading (future images)

### Features:
- Offline booking view
- Background sync for bookings
- Predictive prefetching
- Progressive image loading

---

## Implementation Strategy

### Week 1: Foundation
- Day 1: Phase 1 (Compression)
- Day 2-3: Phase 2 (Code Splitting)
- Day 4-5: Testing & refinement

### Week 2: Optimization
- Day 1-3: Phase 3 (Caching)
- Day 4-5: Phase 4 (Bundle Optimization)

### Week 3: Enhancement
- Day 1-2: Phase 5 (Monitoring)
- Day 3-5: Phase 6 (Progressive Features)

## Success Metrics

### Immediate Goals (Week 1):
- [ ] Initial bundle < 300KB compressed
- [ ] Admin routes lazy loaded
- [ ] 50% bandwidth reduction

### Medium-term Goals (Week 2):
- [ ] 70% reduction in API calls
- [ ] Page load time < 2 seconds
- [ ] Bundle size < 500KB total

### Long-term Goals (Week 3+):
- [ ] Support 500k+ visits/month on free tier
- [ ] Offline functionality
- [ ] Sub-second interactions

## Rollback Plan
Each phase is independent and can be rolled back:
1. Keep git commits atomic per phase
2. Test on dev branch first
3. Monitor metrics after each deployment
4. Have previous build ready for quick revert

## Notes
- Always test on dev branch first
- Monitor Vercel dashboard after each deployment
- Keep CLAUDE.md updated with changes
- Document any issues or learnings