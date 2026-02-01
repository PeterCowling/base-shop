# Manual Testing Guide: SEO Audit Scores Fix

## Quick Verification

Run the automated verification script:
```bash
pnpm tsx apps/brikette/scripts/verify-audit-score-fix.ts
```

Expected output: All checks pass ✅

## Browser Testing

### Prerequisites
1. Start dev server: `pnpm dev`
2. Ensure you have a preview token configured in `.env.local`
3. Test guide: `chiesaNuovaDepartures` (has audit score 7.9/10)

### Test 1: Audit Scores Display Immediately

**URL**: `http://localhost:3001/en/draft/chiesa-nuova-departures`

**Expected Behavior**:
1. Page loads
2. Editorial panel (right sidebar) visible immediately
3. "SEO Audit" section shows badge: **"SEO: 7.9/10"** in **amber** color
4. Warning text: "Score must be ≥9.0 to publish"
5. **No loading delay** - score visible on first render

**What to Check**:
- Open browser DevTools → Network tab
- Look for `/api/guides/chiesaNuovaDepartures/manifest` request
- If serverOverrides work: **request should NOT appear** (or console shows "Using server-loaded overrides")
- If it appears: check response time is fast and doesn't block rendering

### Test 2: Audit Details Expand Correctly

**Steps**:
1. In editorial panel, find "SEO Audit" checklist item
2. Click to expand diagnostic details

**Expected**:
- **Critical Issues** section (red): 1 item
  - "Content too short (1488 words, localGuide template needs 1600+)" -1.0
- **Improvements** section (amber): 4 items
  - "Too few images..." -0.5
  - "Meta description long..." -0.3
  - etc.
- **Strengths** section (green): 13 items

### Test 3: Run Audit Button Works

**Steps**:
1. Click "Run SEO Audit" button
2. Wait for completion (button shows loading state)
3. Page reloads with cache-bust param (`?_audit=...`)

**Expected**:
- Audit completes successfully
- Page reloads
- Score still displays immediately (no delay on reload)
- If score changed, new score shows

### Test 4: Guide Without Audit

**URL**: `http://localhost:3001/en/draft/[any-guide-without-audit]`

**Expected**:
- Editorial panel shows "No audit completed. Run an audit to check SEO quality."
- "Run SEO Audit" button available
- No errors in console

### Test 5: SSR / Initial HTML Check

**Steps**:
1. Open `http://localhost:3001/en/draft/chiesa-nuova-departures`
2. View page source (Cmd+Option+U / Ctrl+U)
3. Search for "GuideEditorialPanel" or "SEO Audit"

**Expected**:
- If SSR enabled: Editorial panel HTML should be in initial HTML
- Console shows no hydration warnings

### Test 6: Network Performance

**Check**:
1. Open DevTools → Network tab → Filter by XHR/Fetch
2. Load guide page
3. Count API requests to `/api/guides/*/manifest`

**Expected**:
- **0-1 requests** (down from 2+ before fix)
- If serverOverrides present: 0 requests (uses server data)
- If missing: 1 request (fallback to client fetch)

## Regression Testing

### Guides to Test

Test various audit states:

| Guide Key | Expected Score | Expected Status | Notes |
|-----------|----------------|-----------------|-------|
| `chiesaNuovaDepartures` | 7.9/10 | inProgress (amber) | Has audit, below threshold |
| (Any guide with score ≥9.0) | ≥9.0 | complete (green) | Ready to publish |
| (Any guide without audit) | N/A | missing | Shows "No audit completed" |

### Cross-Browser Testing

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)

### Device Testing

- [ ] Desktop (1920x1080+)
- [ ] Tablet (768px)
- [ ] Mobile (375px) - panel should be hidden or collapsed

## Troubleshooting

### Issue: Score Not Displaying

**Check**:
1. Console for errors
2. Network tab: is `/api/guides/*/manifest` failing?
3. `guide-manifest-overrides.json` exists and contains auditResults
4. Run verification script to confirm server-side loading works

### Issue: Hydration Mismatch Warning

**Symptoms**: Console shows "Hydration failed" or "Text content does not match"

**Fix**:
- If persistent, may need to revert `ssr: true` to `ssr: false` in `GuideSeoTemplateBody.tsx`
- Report issue with browser, guide key, and steps to reproduce

### Issue: Score Updates Don't Persist

**Symptoms**: Run audit, score updates, but disappears on page reload

**Check**:
1. Audit API response: did it return `ok: true`?
2. File write: check `apps/brikette/src/data/guides/guide-manifest-overrides.json` was updated
3. Permissions: ensure write permissions on data directory

## Performance Benchmarks

### Before Fix
- Time to first score display: **500-2000ms** (client fetch delay)
- API requests per page load: **2-3**
- Occasional: Score never appears (race condition)

### After Fix
- Time to first score display: **0ms** (SSR with server data)
- API requests per page load: **0-1**
- Score always appears if audit exists

## Success Criteria

✅ All automated checks pass
✅ Score displays immediately on first render (no delay)
✅ Expanding diagnostics shows full audit breakdown
✅ "Run SEO Audit" button works and updates display
✅ No hydration warnings in console
✅ Network tab shows 0-1 API requests (down from 2+)
✅ Works across different guides and audit states

## Rollback Plan

If issues occur, revert these commits:

```bash
git log --oneline --grep="seo audit" -n 5
# Find commit hash, then:
git revert <commit-hash>
```

Files to watch:
- `apps/brikette/src/app/[lang]/draft/[...slug]/page.tsx`
- `apps/brikette/src/routes/guides/guide-seo/template/useGuideManifestState.ts`
- `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx`
