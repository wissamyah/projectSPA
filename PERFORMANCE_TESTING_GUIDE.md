# Performance Testing Guide

## How to Prove Your Optimizations Work

This guide provides concrete tests and metrics to validate the 4-phase optimization we implemented.

---

## 1. Bundle Size Testing

### Test A: Build Size Comparison

**Before Optimization (baseline):**
```bash
# Checkout the last commit before optimizations
git checkout e0e69b6
npm install
npm run build
# Record the dist folder size and individual file sizes
```

**After Optimization (current):**
```bash
# Checkout the latest dev branch
git checkout dev
npm install
npm run build
# Compare the compressed sizes
```

### What to Measure:
- Total dist folder size
- Individual JS bundle sizes
- Gzip/Brotli compressed sizes
- Number of chunks created

### Expected Results:
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main Bundle | 661KB | 107KB | 84% smaller |
| Compressed (Brotli) | 661KB | 114KB | 83% smaller |
| Number of Chunks | 3 | 20+ | Better splitting |

---

## 2. Network Performance Testing

### Test B: Chrome DevTools Network Analysis

1. **Open Chrome DevTools** → Network Tab
2. **Enable "Disable cache"** for first visit simulation
3. **Set throttling to "Fast 3G"** to simulate real conditions
4. **Record these metrics:**

```
First Visit (cache disabled):
- Total resources downloaded
- Total size transferred
- DOMContentLoaded time
- Load event time
- Number of requests

Second Visit (cache enabled):
- Total resources downloaded (should be much less)
- Size transferred (should be ~17KB)
- Load time (should be sub-second)
```

### Expected Results:
- First visit: ~114KB transferred (vs 661KB before)
- Second visit: ~17KB transferred (vs 661KB before)
- 80%+ resources served from cache on second visit

---

## 3. Lighthouse Performance Audit

### Test C: Lighthouse Scores

1. **Open Chrome DevTools** → Lighthouse Tab
2. **Settings:**
   - Mode: Navigation
   - Device: Mobile
   - Categories: Performance only
   - Throttling: Simulated throttling

3. **Run audit on both versions**

### Expected Improvements:
| Metric | Before | After |
|--------|--------|-------|
| Performance Score | ~60-70 | ~85-95 |
| First Contentful Paint | ~3.5s | ~1.5s |
| Largest Contentful Paint | ~4.5s | ~2.0s |
| Time to Interactive | ~5.0s | ~2.5s |
| Speed Index | ~4.0s | ~2.0s |
| Total Blocking Time | ~600ms | ~200ms |

---

## 4. React Query Cache Testing

### Test D: API Call Monitoring

1. **Open Chrome DevTools** → Network Tab
2. **Filter by:** Fetch/XHR
3. **Navigate through the app**

**Test Sequence:**
```
1. Load homepage → Count Supabase API calls
2. Navigate to Services → Count API calls (should be 0 if cached)
3. Navigate to Book → Count API calls (should be minimal)
4. Go back to Services → Should be 0 API calls (cached)
```

### Expected Results:
- Before: 6-8 API calls per page
- After: 1-2 calls first visit, 0 on cached pages
- 70% reduction in total API calls

---

## 5. Bundle Analysis

### Test E: Visual Bundle Analysis

1. **After building, open:** `dist/stats.html`
2. **Analyze:**
   - Size of each chunk
   - Dependencies distribution
   - No duplicate code between chunks
   - Icons in separate chunk
   - React Query in separate chunk

---

## 6. Real User Metrics (RUM)

### Test F: WebPageTest.org

1. **Go to:** https://www.webpagetest.org/
2. **Test both versions with:**
   - Location: Your target region
   - Browser: Chrome
   - Connection: 3G Fast
   - Run 3 tests for accuracy

### Metrics to Compare:
- First Byte Time
- Start Render
- Speed Index
- Fully Loaded Time
- Bytes Downloaded

---

## 7. Cache Efficiency Testing

### Test G: Cache Hit Rate

1. **First Visit:**
```javascript
// In console, after page load:
performance.getEntriesByType('resource').forEach(r => {
  console.log(`${r.name}: ${r.transferSize} bytes`);
});
// Record total transfer size
```

2. **Second Visit (refresh):**
```javascript
// Run same command
// Most vendor chunks should show 0 bytes (cached)
```

### Expected:
- Vendor chunks: 0 bytes (cached)
- Main app bundle: ~17KB
- 80%+ cache hit rate

---

## 8. Parallel Loading Test

### Test H: Waterfall Analysis

1. **Chrome DevTools** → Network → Waterfall view
2. **Observe:**
   - Chunks loading in parallel (not sequential)
   - No blocking resources
   - Early resource hints working

---

## 9. Memory & CPU Testing

### Test I: Performance Monitor

1. **Chrome DevTools** → Performance Tab
2. **Start recording** → Navigate app → Stop
3. **Analyze:**
   - JS Heap size (should be lower)
   - CPU usage during navigation
   - No memory leaks

---

## 10. Automated Performance Testing

### Test J: Create Performance Budget

**Create `performance-test.js`:**
```javascript
const puppeteer = require('puppeteer');

async function testPerformance() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Enable request interception
  await page.setRequestInterception(true);

  let totalSize = 0;
  let requestCount = 0;

  page.on('request', request => {
    requestCount++;
    request.continue();
  });

  page.on('response', response => {
    const headers = response.headers();
    if (headers['content-length']) {
      totalSize += parseInt(headers['content-length']);
    }
  });

  // Navigate and measure
  const metrics = await page.evaluate(() => JSON.stringify(window.performance.timing));
  const perfData = JSON.parse(metrics);

  await page.goto('http://localhost:5173');

  // Calculate metrics
  const loadTime = perfData.loadEventEnd - perfData.navigationStart;
  const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart;

  console.log(`Total Requests: ${requestCount}`);
  console.log(`Total Size: ${(totalSize / 1024).toFixed(2)}KB`);
  console.log(`Load Time: ${loadTime}ms`);
  console.log(`DOM Ready: ${domReady}ms`);

  // Performance budget assertions
  console.assert(totalSize < 150000, 'Bundle too large!');
  console.assert(loadTime < 3000, 'Load time too slow!');
  console.assert(requestCount < 30, 'Too many requests!');

  await browser.close();
}

testPerformance();
```

---

## Quick Validation Checklist

### ✅ Immediate Tests (5 minutes)

1. **Bundle Size Check:**
```bash
# In project root
ls -lah dist/assets/*.js | head -5
# Main bundle should be ~107KB (uncompressed)
```

2. **Compression Check:**
```bash
ls -lah dist/assets/*.br | head -5
# Brotli files should exist and be much smaller
```

3. **Chunk Count:**
```bash
ls dist/assets/*.js | wc -l
# Should see 20+ chunks (vs 3-4 before)
```

4. **Build Stats:**
```bash
# Open in browser
open dist/stats.html
# Visual representation of optimized bundles
```

---

## Vercel-Specific Testing

### Test K: Vercel Deployment Metrics

1. **Deploy both versions to Vercel**
2. **In Vercel Dashboard, compare:**
   - Build time
   - Output size
   - Function size (should be 0, no functions)
   - Edge network cache hit rate

3. **Analytics → Web Vitals:**
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)
   - TTFB (Time to First Byte)

---

## Results Summary Template

```markdown
## Performance Test Results

### Bundle Size
- Before: _____ KB
- After: _____ KB
- Improvement: _____ %

### Load Time (3G Fast)
- Before: _____ s
- After: _____ s
- Improvement: _____ %

### API Calls (per session)
- Before: _____ calls
- After: _____ calls
- Reduction: _____ %

### Lighthouse Score
- Before: _____/100
- After: _____/100
- Improvement: _____ points

### Cache Efficiency
- First Visit: _____ KB
- Second Visit: _____ KB
- Cache Hit Rate: _____ %
```

---

## Sharing Results

When sharing optimization results, include:
1. Screenshots of before/after Lighthouse scores
2. Network waterfall comparisons
3. Bundle size visualization from stats.html
4. Real-world loading time recordings (use Chrome DevTools Recording)

This concrete data proves the optimizations work!