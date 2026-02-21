# Phase 4: Technical SEO Audit

**Loads**: `phase-base-contract.md` (output location, common inputs, inter-phase handoff, quality requirements)
**Prerequisites**: Can run independently; benefits from knowing target keywords (Phase 1) and content strategy (Phase 2)
**Output**: `docs/business-os/strategy/<BIZ>/seo/<YYYY-MM-DD>-tech-audit-<BIZ>.user.md`

Audit technical SEO foundations to ensure content can rank. Covers crawlability, indexability, site speed, mobile-friendliness, structured data, and core web vitals.

## Workflow

1. **Scope determination**:
   - If `--existing-content` flag provided: Audit existing site/content inventory
   - If new site/pre-launch: Audit planned tech stack and configuration
   - Use business context to understand site type (e.g., Next.js SSG, WordPress, Shopify)

2. **Crawlability audit**:
   - Check robots.txt configuration (use WebSearch to find site's robots.txt if existing)
   - Review sitemap.xml presence and structure
   - Identify crawl budget issues (large sites: pagination, infinite scroll, duplicate URLs)

3. **Indexability audit**:
   - Check for noindex tags (intentional or accidental)
   - Canonical tag usage and correctness
   - Duplicate content risks (URL parameters, www vs non-www, http vs https)

4. **Page speed and Core Web Vitals**:
   - If existing site: Use WebSearch to check PageSpeed Insights data
   - If new site: Review tech stack for speed best practices (SSG vs SSR, image optimization, lazy loading)
   - Target benchmarks: LCP <2.5s, FID <100ms, CLS <0.1

5. **Mobile-friendliness**:
   - Responsive design check
   - Touch target sizes, viewport configuration
   - Mobile page speed (often slower than desktop)

6. **Structured data**:
   - Identify relevant schema types for business (e.g., Organization, Product, Article, LocalBusiness, FAQ)
   - Check implementation if existing site
   - Recommend schema types if new site

7. **HTTPS and security**:
   - Verify SSL certificate
   - Check for mixed content issues

8. **International/multilingual SEO** (if applicable):
   - Hreflang tags for multi-locale sites
   - URL structure (subdomain vs subdirectory vs ccTLD)

9. **Checklist creation**:
   - Prioritized action items (Critical, High, Medium, Low)
   - Link to relevant documentation or tools

## Output Template

```markdown
# Technical SEO Audit: <BUSINESS_NAME>

**Generated**: YYYY-MM-DD
**Site/Product**: [URL if existing, or "Pre-launch" if new]
**Audit Scope**: [Existing site / Planned architecture]

## Executive Summary

**Overall Health**: [Red/Yellow/Green]

**Critical Issues**: [Count] - [Brief description of blockers]
**High Priority**: [Count]
**Medium Priority**: [Count]
**Low Priority**: [Count]

[2-3 sentences: Biggest risks, quick wins, overall recommendation]

## Audit Findings

### 1. Crawlability

**Status**: [Pass / Needs Attention / Fail]

| Item | Status | Notes | Priority | Action Required |
|------|--------|-------|----------|-----------------|
| robots.txt configured | [Pass/Fail] | [Details] | [C/H/M/L] | [Action] |
| Sitemap.xml present | [Pass/Fail] | [Details] | [C/H/M/L] | [Action] |
| No orphan pages | [Pass/Fail] | [Details] | [M] | [Action] |
| Crawl budget optimization | [Pass/Fail] | [Details] | [M/L] | [Action] |

### 2. Indexability

**Status**: [Pass / Needs Attention / Fail]

| Item | Status | Notes | Priority | Action Required |
|------|--------|-------|----------|-----------------|
| No unintentional noindex | [Pass/Fail] | [Details] | [C] | [Action] |
| Canonical tags correct | [Pass/Fail] | [Details] | [H] | [Action] |
| No duplicate content | [Pass/Fail] | [Details] | [H] | [Action] |
| URL structure clean | [Pass/Fail] | [Details] | [M] | [Action] |

### 3. Page Speed & Core Web Vitals

**Status**: [Pass / Needs Attention / Fail]

| Metric | Current | Target | Status | Priority |
|--------|---------|--------|--------|----------|
| LCP (Largest Contentful Paint) | [X]s | <2.5s | [Pass/Fail] | [C/H] |
| FID (First Input Delay) | [X]ms | <100ms | [Pass/Fail] | [H] |
| CLS (Cumulative Layout Shift) | [X] | <0.1 | [Pass/Fail] | [H] |
| Time to First Byte (TTFB) | [X]ms | <600ms | [Pass/Fail] | [M] |

**Key Issues**:
- [e.g., Unoptimized images slowing LCP]
- [e.g., No lazy loading for below-fold content]

**Recommendations**:
- [Action: Implement next/image or equivalent for automatic optimization]
- [Action: Enable CDN for static assets]
- [Action: Minimize JavaScript bundle size]

### 4. Mobile-Friendliness

**Status**: [Pass / Needs Attention / Fail]

| Item | Status | Notes | Priority |
|------|--------|-------|----------|
| Responsive design | [Pass/Fail] | [Details] | [C] |
| Viewport configured | [Pass/Fail] | [Details] | [C] |
| Touch targets >48px | [Pass/Fail] | [Details] | [H] |
| No horizontal scroll | [Pass/Fail] | [Details] | [H] |
| Mobile page speed | [Pass/Fail] | [Details] | [H] |

### 5. Structured Data

**Status**: [Pass / Needs Attention / Fail]

**Implemented Schema Types**: [e.g., Organization, Article, BreadcrumbList]

**Recommended Schema Types** (not yet implemented):
- [ ] Organization (sitewide)
- [ ] WebSite (with sitelinks search box)
- [ ] Article (for blog posts)
- [ ] Product (if e-commerce)
- [ ] FAQ (for FAQ sections - targets featured snippets)
- [ ] LocalBusiness (if local business)
- [ ] Review/AggregateRating (if applicable)

### 6. HTTPS & Security

**Status**: [Pass / Needs Attention / Fail]

| Item | Status | Notes | Priority |
|------|--------|-------|----------|
| Valid SSL certificate | [Pass/Fail] | [Details] | [C] |
| All resources HTTPS | [Pass/Fail] | [Details] | [C] |
| No mixed content warnings | [Pass/Fail] | [Details] | [H] |
| HTTP to HTTPS redirect | [Pass/Fail] | [Details] | [H] |

### 7. International/Multilingual SEO

**Status**: [Pass / Needs Attention / Fail / N/A]

| Item | Status | Notes | Priority |
|------|--------|-------|----------|
| Hreflang tags implemented | [Pass/Fail/N/A] | [Details] | [H if multilingual] |
| Locale URL structure | [Pass/Fail/N/A] | [Details] | [M] |
| Language switcher UX | [Pass/Fail/N/A] | [Details] | [M] |

## Prioritized Action Checklist

### Critical (Launch Blockers)
- [ ] [Action item - e.g., Fix noindex on main pages]
- [ ] [Action item - e.g., Install SSL certificate]

### High Priority (Ranking Impact)
- [ ] [Action item - e.g., Optimize LCP to <2.5s]
- [ ] [Action item - e.g., Implement canonical tags]

### Medium Priority (Incremental Gains)
- [ ] [Action item - e.g., Add FAQ schema for snippet optimization]
- [ ] [Action item - e.g., Compress images to WebP format]

### Low Priority (Nice-to-Have)
- [ ] [Action item - e.g., Implement breadcrumb schema]
- [ ] [Action item - e.g., Add social meta tags (OG, Twitter)]

## Tools & Resources

- **Crawl Testing**: Screaming Frog, Google Search Console
- **Page Speed**: PageSpeed Insights, WebPageTest, Lighthouse
- **Structured Data**: Google Rich Results Test, Schema.org validator
- **Mobile**: Google Mobile-Friendly Test
- **Security**: SSL Labs, Why No Padlock

## Recommendations Summary

1. [Top recommendation - usually critical issue]
2. [Second priority]
3. [Third priority]

**Timeline**: Address critical items before launch, high-priority within 1 month, medium within 3 months.
```

## Quality Checks

- [ ] All 7 audit categories completed (crawlability, indexability, speed, mobile, structured data, HTTPS, i18n if applicable)
- [ ] Issues prioritized by severity (Critical, High, Medium, Low)
- [ ] Actionable recommendations provided for each issue
- [ ] Core Web Vitals benchmarked against targets
- [ ] Structured data recommendations tied to content strategy (Phase 2 clusters)
- [ ] Launch-blocker issues clearly flagged
- [ ] Relevant tools and documentation linked
