# lp-measure

Bootstrap measurement infrastructure for a startup before or just after website launch.

---

## Invocation

```bash
/lp-measure --business <BIZ> [--mode pre-website|website-live]
```

**Parameters:**
- `--business`: Business code (e.g., `BRIK`, `SEG`, `XA`)

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

- `--mode`: Operating mode. Defaults to `website-live`. Use `pre-website` for measurement setup before a production site exists.

**Example:**
```bash
/lp-measure --business NEWCO --mode pre-website
```

---

## Purpose

Bootstrap measurement infrastructure for a startup before or just after website launch. Covers analytics setup, event taxonomy, UTM governance, and baseline dashboards. This skill ensures that when experiments start (S10), there's already a measurement foundation in place.

---

## Operating Mode

**AUDIT + SETUP + DOCUMENT**

This skill audits existing measurement state, produces setup checklists for analytics/search/pixel infrastructure, defines event taxonomy and UTM governance, and outputs a baseline dashboard template.

---

## Two Modes

### pre-website
Measurement setup before a production site exists. Focus on:
- Form tracking (if landing page or social media lead gen)
- Social DM tracking (manual log or CRM entry)
- Manual sales log (spreadsheet or lightweight CRM)
- Basic UTMs for any landing pages or social posts
- Placeholder event taxonomy (for future website)

**Omits:** GA4 property setup, GSC verification, pixel/tag installation (unless landing page exists).

### website-live
Full measurement setup for a live site. Focus on:
- GA4 property setup (property naming, data streams, enhanced measurement, conversions)
- GSC setup (property verification, sitemap submission, coverage monitoring)
- Pixel/tag setup (Meta Pixel, Google Ads tag, any other channel pixels)
- Full event taxonomy (standard events + custom events for the business)
- UTM governance (naming conventions, campaign tracking, link builder template)
- Baseline dashboard template (key metrics to track from day 1)

---

## Inputs

1. **Business context:**
   - Launch surface (website, app, social-only, etc.)
   - Channels planned (organic, paid social, email, etc.)
   - Products/services offered
   - Key conversion actions (purchase, lead form, signup, etc.)

2. **Existing measurement setup (if any):**
   - GA4 property ID (if exists)
   - GSC property URL (if exists)
   - Pixel/tag IDs (Meta, Google Ads, etc.)
   - Any event tracking already in place

3. **lp-readiness output (which channels were identified):**
   - Channel priorities (e.g., Meta Ads, Google Ads, SEO, email)
   - Expected traffic sources

---

## Workflow

### Stage 1: Audit Existing Measurement State
- Check for existing GA4 property (if website-live mode)
- Check for existing GSC property (if website-live mode)
- Check for existing pixels/tags (Meta Pixel, Google Ads, etc.)
- Check for existing event tracking or analytics setup
- Document what's already configured vs. what needs setup

### Stage 2: GA4 Setup Checklist (website-live mode only)
- Property creation (naming convention: `<Business Name> - Production`)
- Data stream setup (web stream, measurement ID capture)
- Enhanced measurement configuration (page views, scrolls, outbound clicks, site search, video engagement, file downloads)
- Conversion events definition (purchase, lead, signup, etc.)
- Data retention settings (2 months standard, 14 months if needed)
- User properties (if custom segmentation needed)

### Stage 3: GSC Setup Checklist (website-live mode only)
- Property creation (URL prefix or domain property)
- Verification method (HTML tag, DNS record, GA4 linking)
- Sitemap submission (primary sitemap URL)
- Coverage monitoring setup (index status, errors)
- URL inspection for key pages

### Stage 4: Pixel/Tag Setup (website-live mode only)
- Meta Pixel (if Facebook/Instagram ads planned)
- Google Ads tag (if Google Ads planned)
- LinkedIn Insight Tag (if LinkedIn ads planned)
- TikTok Pixel (if TikTok ads planned)
- Tag manager vs. direct implementation decision

### Stage 5: Event Taxonomy Definition (both modes)
- **Standard events** (common across businesses):
  - `page_view` (GA4 automatic)
  - `scroll` (GA4 enhanced measurement)
  - `click` (outbound links)
  - `form_start`
  - `form_submit`
  - `file_download`
- **Business-specific events** (custom for this startup):
  - Conversion events (e.g., `purchase`, `lead`, `signup`)
  - Engagement events (e.g., `video_play`, `add_to_cart`, `begin_checkout`)
  - Navigation events (e.g., `menu_click`, `search`)
- **Event parameters** (per event):
  - Event name
  - Trigger condition
  - Custom parameters (e.g., `product_id`, `category`, `value`)
  - Event category (conversion, engagement, navigation)

### Stage 6: UTM Governance (both modes)
- **UTM naming convention:**
  - `utm_source` (e.g., `facebook`, `google`, `newsletter`)
  - `utm_medium` (e.g., `cpc`, `organic`, `email`)
  - `utm_campaign` (e.g., `spring-sale-2026`, `launch-promo`)
  - `utm_content` (e.g., `ad-variant-a`, `cta-button`)
  - `utm_term` (e.g., keyword for paid search)
- **Link builder template** (spreadsheet or tool)
- **Campaign tracking log** (master list of all active campaigns with UTMs)

### Stage 7: Baseline Dashboard Template (both modes)
- **Key metrics to track from day 1:**
  - Traffic (sessions, users, new vs. returning)
  - Conversions (conversion rate, conversion count by type)
  - Revenue (if e-commerce)
  - Top sources/mediums/campaigns
  - Top landing pages
  - Bounce rate / engagement rate
- **Dashboard update cadence** (daily, weekly, monthly)
- **Dashboard owner** (who maintains and reviews)

---

## Output Contract

Produce a **Measurement Setup Document** with the following sections:

### 1. Mode and Scope
- Operating mode (`pre-website` or `website-live`)
- Business context summary
- Existing measurement state (what's already set up)

### 2. Setup Verification Checklist
Table format:
| Tool/Platform | Setup Task | Owner | Channel (UI/API/CLI) | Required Access | Evidence of Completion | Status |
|---------------|------------|-------|----------------------|-----------------|------------------------|--------|
| GA4 | Property creation | User | UI | Admin access to Google account | Property ID captured | Pending |
| GSC | Property verification | User | UI | Site ownership verified | Green checkmark in GSC | Pending |
| Meta Pixel | Pixel installation | Agent/User | Code | Meta Business Manager access | Pixel Helper shows active | Pending |

### 3. Event Taxonomy Table
| Event Name | Trigger | Parameters | Category | Priority |
|------------|---------|------------|----------|----------|
| `page_view` | Automatic (GA4) | `page_title`, `page_location` | Standard | High |
| `lead_form_submit` | Form submission | `form_name`, `lead_source` | Conversion | High |

### 4. UTM Naming Convention
- Template: `https://example.com?utm_source=<source>&utm_medium=<medium>&utm_campaign=<campaign>&utm_content=<content>&utm_term=<term>`
- Naming rules (lowercase, hyphens for spaces, no special chars)
- Link builder template (Google Sheets or Excel)

### 5. Baseline Dashboard Template
- Key metrics (with definitions)
- Dashboard layout (sections: traffic, conversions, sources, content)
- Update cadence (daily for first month, weekly thereafter)

### 6. Mode-Specific Sections
- **pre-website mode:** Manual tracking setup (lead log, social DM log, sales log)
- **website-live mode:** Full GA4/GSC/pixel setup checklists

### 7. Blockers and Next Actions
- List of blockers (e.g., "No GA4 property created yet")
- Exact next action for each blocker (e.g., "User: Create GA4 property via analytics.google.com")

---

## Quality Checks (Self-Audit)

Before finalizing output, verify:
- [ ] Mode correctly identified (`pre-website` or `website-live`)
- [ ] Existing measurement state audited and documented
- [ ] Setup verification checklist includes all relevant tools (GA4, GSC, pixels as applicable)
- [ ] Event taxonomy table has at least 5 events with concrete triggers and parameters
- [ ] UTM naming convention is specific and follows best practices
- [ ] Baseline dashboard template lists key metrics with definitions
- [ ] Mode-specific sections present (manual tracking for pre-website, full setup for website-live)
- [ ] Blockers list has exact next actions (not vague "set up analytics")
- [ ] No secret values or credentials included in output

---

## Red Flags (Invalid Output)

Reject output if:
- `website-live` mode missing GA4 setup checklist
- No event taxonomy table (or fewer than 5 events)
- No UTM naming convention defined
- Dashboard template missing key metrics
- Blocker list is empty but setup is incomplete
- Secret values (API keys, credentials) included in document

---

## Integration

This skill feeds into:
- **lp-experiment (S10):** Event taxonomy defines experiment metrics (e.g., "track `purchase` event for revenue experiment")
- **lp-channel (S4):** UTM governance ensures channel performance can be measured
- **lp-content (S5):** Content performance tracking relies on event taxonomy (e.g., `video_play`, `download_guide`)

The measurement setup document becomes the single source of truth for analytics infrastructure and is referenced by all downstream measurement tasks.
