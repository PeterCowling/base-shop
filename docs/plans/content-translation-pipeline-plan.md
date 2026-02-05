---
Type: Plan
Status: Active
Domain: i18n/CMS
Last-reviewed: 2026-01-20
Relates-to charter: docs/i18n/i18n-charter.md
---

# Content Translation Pipeline Plan


## Active tasks

No active tasks at this time.

## Goals
- Enable authors to write content in a primary language and generate machine translations for one or more target locales.
- Integrate translation output into existing `TranslatableText` inline content so runtime rendering stays unchanged.
- Add a Brikette i18next namespace translation workflow (git/PR-based) that preserves keys and shares TM/tokenization/glossary primitives.
- Support moderate-to-high volume translation with retries, rate limits, and auditability.
- **Keep translation costs minimal**:
  - Primary: subscription-based translation via Claude Code/Codex sessions (no pay-as-you-go API spend by default)
  - Efficiency: $0 re-runs of unchanged content via TM
  - Optional fallback: if an API overflow mode is later enabled, keep a typical-shop run under ~$5
- Avoid overwriting human-edited or already-localized content.
- Default new shops to `contentLanguages = ["en", "it"]` while allowing opting into the full Brikette locale set (including region/script variants).

## Non-goals
- Human-quality localization or editorial QA workflows.
- Replacing i18n keys in `packages/i18n/src/*.json` or `apps/brikette/src/locales/*` (Workstream B translates values only; keys are immutable).
- Introducing a new runtime i18n library or changing fallback rules.
- Real-time/synchronous translation during content editing.

## Terminology

| Term | Definition |
|------|------------|
| **Workstream A** | Shop/CMS-authored content translation (publish-gated, CMS-managed) |
| **Workstream B** | Brikette app content translation (git/PR-based, i18next namespaces) |
| **ContentLocale** | Canonical locale codes for Workstream A (e.g., `en`, `de`, `it`, `zh-Hans`) |
| **FsLocale** | Filesystem directory names for Workstream B (e.g., `no`, `zh` — may differ from canonical) |
| **TM** | Translation Memory — hash-keyed cache of previous translations |
| **MCP** | Model Context Protocol — interface for Claude Code to call translation tools |
| **Namespace** | i18next JSON file containing key-value translation pairs (e.g., `landingPage.json`) |
| **Guide content** | Nested JSON structure for Brikette travel guides (loaded via `returnObjects: true`) |
| **Tokenization** | Process of masking URLs, emails, placeholders before translation |
| **Staleness** | Translation is stale when source text has changed since translation was created |
| **Publish gate** | Validator that blocks publish if required locales are missing |

## Current State (Inventory Highlights)
- Locale support is centralized in `@acme/types/constants` (`en`, `de`, `it`) and surfaced via `packages/i18n/src/locales.ts`.
- Brikette supports a much wider locale set in `apps/brikette/src/i18n.config.ts`:
  `en, es, de, fr, it, ja, ko, pt, ru, zh, ar, hi, vi, pl, sv, no, da, hu`.
- CMS/page-builder content uses `TranslatableText` with `{ type: "inline", value: { en: "..." } }` stored in shop JSON under the data root (for example `data/shops/*`).
- Rendering uses `resolveText` to pick locale values with fallback to primary (`en`).
- Shop-level enabled languages live in `settings.json` (`languages: ["en", "de", "it"]`).
  - Target state: UI chrome supports `en` + `it` only for now; content locales can be broader.

### Real-World Content Volume (from repo analysis)

**Brikette (content-heavy hostel/travel site):**
| Content type | File count | Translatable strings | Notes |
|--------------|------------|---------------------|-------|
| Top-level namespaces | 47 files | ~3,156 | landingPage, roomsPage, guides, howToGetHere, etc. |
| Guide content | 129 files | ~4,467 | Detailed travel guides with sections, TOC, FAQs |
| Largest namespaces | — | 823 (assistanceKeywords), 853 (howToGetHere) | High-density content |
| **Total** | **176+ files** | **~7,600 strings** | Represents upper bound for content-heavy shops |

## Workstreams (two translation domains)

Translation needs to support two different domains that look similar (“text that needs translating”) but behave very differently operationally.

### Workstream A — Shop/CMS-authored content (publish-gated)
- **Scope:** Shop data under `data/shops/*` (products, pages/sections/templates, navigation, SEO).
- **Storage:** `TranslatableText` inline values (plus migrations to get legacy formats into `TranslatableText`).
- **Operational requirement:** **Drafts must have required locales filled** (via operator-triggered machine translation or manual entry) before publish (publish gate for `requiredContentLanguages`).
- **Locale model:** Variable `contentLanguages` per shop; UI chrome remains `UiLocale = "en" | "it"` for now.

### Workstream B — Brikette app content (git/PR-based, not publish-gated)

**Two distinct content types under one workstream:**

| Type | Location | Format | i18next access | Translation unit |
|------|----------|--------|----------------|------------------|
| **Namespaces** | `locales/{locale}/*.json` | Flat key-value strings | `t('namespace:key')` | Each string value |
| **Guide content** | `locales/{locale}/guides/content/*.json` | Nested objects | `t('guides.content.{key}', { returnObjects: true })` | Leaf strings only |

**Why this matters for implementers:**
- **Namespaces** (e.g., `landingPage.json`, `footer.json`): Standard i18next flat strings. Translation walker processes every value as a string.
- **Guide content** (e.g., `guides/content/positanoBeaches.json`): Structured JSON with arrays and objects. Loaded via `returnObjects: true`. Translation walker must:
  - Traverse nested structure to find leaf strings
  - Preserve object/array structure exactly (translate values, not keys)
  - **Non-translatable fields (NEVER translate these):**
    - `id` — section anchors, TOC targets (e.g., `"id": "getting-there"`)
    - `href` — TOC link targets (e.g., `"href": "#getting-there"`)
    - `imageId` — Cloudflare Images ID
    - `videoId` — YouTube/Vimeo video ID
    - `provider` — video provider identifier (`"youtube"` or `"vimeo"`)
  - **Translatable fields (DO translate these):**
    - All string values in `seo`, `linkLabel`, `intro[]`, `tips[]`, `warnings[]`
    - `title` and `body[]` in sections
    - `q` and `a[]` in FAQs
    - `label` in TOC items (the visible text, not the href)
    - `title` and `caption` in gallery items and videos
    - `alt` in gallery items
    - `acknowledgments`

**Runtime loading distinction:**
```typescript
// Namespace (flat strings) — standard i18next
const title = t('landingPage:heroTitle');

// Guide content (nested objects) — requires returnObjects
const guide = t('guides.content.positanoBeaches', { returnObjects: true }) as GuideContent;
// Then render: guide.sections[0].title, guide.faqs[0].q, etc.
```

- **Scope:** All content under `apps/brikette/src/locales/*` (both namespaces and guide content).
- **Storage:** Git-tracked JSON files; keys/structure preserved exactly; leaf string values machine-translated.
- **Operational requirement:** No CMS publish gate (this is app content shipped via git). Translation runs create diffs/PRs and are reviewed/merged like other code changes.
- **Locales:** Driven by Brikette's i18n config (with the locale expansion policy below for `no`/`zh` handling).

### Workstream B Content Authoring — Creating new Brikette content (CMS draft + git export)

Workstream B translation operates on existing i18next namespace files in git. But **how is new content created** in the first place? This sub-workstream defines the authoring workflow.

**Model: CMS draft + operator-run publish (MCP session required)**
- Content is authored and drafted in a CMS interface (database-backed drafts).
- On approval, CMS marks draft as "ready to publish" and displays the MCP command to run.
- **Operator runs publish command** in Claude Code session (consistent with rest of plan — no headless automation):
  1. `publish-brikette-draft --draft-id {id}` — operator executes in Claude Code
  2. MCP tool fetches draft from CMS API, exports to git, translates all locales, creates PR
  3. Git operations use operator's local credentials (`gh` CLI, git config)
- **No server-side automation:** CMS has no GitHub tokens, no background jobs, no API spend authority.
- **Single approval gate:** Human approves the English draft in CMS; operator then runs publish (one action, not two separate reviews).

**Execution environment (critical for auth/permissions):**
- Publish runs on **operator's machine** via Claude Code MCP session
- Git auth: operator's existing git credentials (SSH key or credential helper)
- GitHub PR creation: `gh` CLI using operator's GitHub auth (OAuth or PAT)
- **CMS API access:** MCP tool calls `GET /api/brikette-drafts/{draftId}` to fetch draft content
  - Auth via API token (stored in operator's MCP config) or session cookie
  - CMS uses existing NextAuth infrastructure; new endpoint follows established patterns
- CMS stores draft content only; git/GitHub operations are fully client-side

**Authoring approach: LLM-assisted with external sources**
- Authors can use Claude (via MCP) to draft content based on:
  - Natural language prompts describing what to create
  - Existing guide files as style/structure references
  - **External URLs** (Google Docs, internal wiki, reference articles) — Claude fetches and adapts content
- Human reviews and edits the draft before approval.
- Claude does NOT auto-publish — human approval + operator publish action always required.

**External URL import policy (legal/compliance guardrails):**

**Allowed sources (require explicit license confirmation):**
| Source type | Example | License requirement |
|-------------|---------|---------------------|
| Internal Google Docs | `docs.google.com/*/edit?usp=sharing` | Company-owned, operator has edit access |
| Internal wiki | `notion.so/company/*`, `confluence.company.com/*` | Company-owned content |
| Public reference (CC-BY, CC-BY-SA) | Wikipedia, Wikivoyage | Attribution required in output |
| Public domain | Government sites, pre-1928 works | None required but source noted |
| Explicit permission | Partner content with written agreement | Agreement reference stored |

**Explicitly disallowed sources (domain blocklist enforced):**
| Source type | Example domains | Reason |
|-------------|-----------------|--------|
| Competitor travel sites | `lonelyplanet.com`, `tripadvisor.com`, `hostelworld.com` | Copyright, competitive intelligence |
| News/media paywalled | `nytimes.com`, `wsj.com`, `ft.com` | Paywall bypass, copyright |
| User-generated review sites | `yelp.com`, `trustpilot.com` | Copyright, potentially fake content |
| Social media | `instagram.com`, `tiktok.com`, `twitter.com` | Copyright, ephemeral content |
| AI-generated content farms | Configurable list | Quality, copyright uncertainty |
| Generic restrictive licenses | Sites with CC-ND, CC-NC (non-commercial), All Rights Reserved | License violation |

**Domain blocklist configuration:**
```typescript
// apps/cms/src/config/url-import-blocklist.ts
export const BLOCKED_DOMAINS = [
  // Competitors
  "lonelyplanet.com", "tripadvisor.com", "hostelworld.com", "booking.com",
  // Paywalled news
  "nytimes.com", "wsj.com", "ft.com", "economist.com",
  // UGC platforms
  "yelp.com", "trustpilot.com", "reddit.com",
  // Social media
  "instagram.com", "tiktok.com", "twitter.com", "facebook.com",
  // Add more as needed...
] as const;

export const ALLOWED_DOMAIN_PATTERNS = [
  /^docs\.google\.com$/,
  /^.*\.notion\.so$/,
  /^en\.wikipedia\.org$/,
  /^en\.wikivoyage\.org$/,
  // Internal domains
  /^.*\.brikette\.com$/,
] as const;
```

**Required attribution behavior:**
- **CC-BY, CC-BY-SA sources:** Output MUST include attribution in a visible location:
  - For guides: Add to `acknowledgments` field (new optional field) or footer of first section
  - Format: "Content adapted from [Source Name](URL), licensed under [License]"
- **Wikipedia/Wikivoyage:** Link back to source article in relevant section
- **Internal sources:** No public attribution required, but source URL stored in draft metadata
- **Attribution is reviewer responsibility:** Checklist item "Attribution added where required"

**CC-BY-SA ShareAlike implications for machine translation (LEGAL CONSIDERATION):**
- **Question:** Are machine translations of CC-BY-SA content considered "derivative works" that must also be licensed CC-BY-SA?
- **Analysis:**
  - CC-BY-SA requires derivative works to be licensed under the same or compatible terms.
  - A translation is generally considered a derivative work under copyright law.
  - If source content is CC-BY-SA, the translated versions may inherit the ShareAlike requirement.
- **Conservative approach (recommended until legal review):**
  - Treat CC-BY-SA translations as also CC-BY-SA licensed.
  - Ensure translated guides maintain the same `acknowledgments` text (translated appropriately).
  - Do NOT mark CC-BY-SA derived content as proprietary.
  - Store `sourceLicenseType: "cc-by-sa"` to flag content requiring ShareAlike compliance.
- **Practical impact:**
  - Most CC-BY-SA content (Wikipedia, Wikivoyage) is factual/informational — rewriting in original voice may reduce derivative-work concerns.
  - The LLM transformation step ("Rewrite this as original content in our guide style") may create sufficient distance from the original to not be a derivative work, but this is a legal determination.
- **Recommendation:** Before publishing CC-BY-SA derived content commercially, consult legal counsel on derivative work status. The plan stores all necessary audit data (`sourceUrls`, `sourceLicenseType`, transformation prompts) to support legal review.

**What gets stored for audit (critical for legal compliance):**
| Data | Stored where | Retention | Purpose |
|------|--------------|-----------|---------|
| Source URL(s) | `BriketteGuideDraft.sourceUrls[]` | Permanent | Audit trail, license verification |
| License type selected | `BriketteGuideDraft.sourceLicenseType` | Permanent | Compliance verification |
| License confirmed flag | `BriketteGuideDraft.sourceLicenseConfirmed` | Permanent | Operator attestation |
| Fetch timestamp | `BriketteGuideDraft.sourceFetchedAt` | Permanent | Temporal audit |
| **Raw fetched content** | **NOT STORED** | N/A | Privacy, storage, copyright |
| LLM transformation prompt | `BriketteGuideDraft.llmPrompt` | Permanent | Reproducibility |
| Output content | `BriketteGuideDraft.content` | Permanent | The actual draft |

**Enforcement flow:**
1. Operator pastes URL in CMS "Import from URL" field
2. Tool checks URL against blocklist — **hard reject** if blocked domain
3. Tool checks URL against allowlist patterns — **warning** if not in allowlist (can proceed with extra confirmation)
4. Tool fetches content (not stored)
5. **Operator selects license type** from dropdown: "Company-owned", "CC-BY", "CC-BY-SA", "Public domain", "Explicit permission", "Other (describe)"
6. **Operator confirms license** checkbox: "I confirm I have the right to adapt this content"
7. LLM transforms content (prompt: "Rewrite this as original content in our guide style, do not copy verbatim")
8. Transformed output populated in editor
9. Operator reviews, edits, adds attribution if required
10. Draft saved with `sourceUrls`, `sourceLicenseType`, `sourceLicenseConfirmed`
11. **Reviewer sees:** Source URL(s), license type, confirmation status — must verify attribution if required

**Content storage architecture (aligned with existing Brikette system):**

Based on repo analysis, Brikette's guide system already supports nested objects via `returnObjects: true` in i18next. The existing format uses:
- String arrays for body text (`intro: ["para1", "para2"]`)
- Objects for structured data (`sections: [{ id, title, body }]`, `faqs: [{ q, a }]`)
- Gallery metadata with alt/caption (image URLs hardcoded in route components)
- `%LINK:guideKey|label%` patterns for internal links (processed at render time)

**Decision: Use existing format, same storage location — no dual storage needed**
- New authored content goes to `apps/brikette/src/locales/en/guides/content/{guideKey}.json`
- Same format as existing 129 guides — no migration, no new loader
- Existing `guides.*` loading system already handles discovery and assembly
- i18next with `returnObjects: true` already supports the nested structure

| Content type | Storage location | Format | Loader |
|--------------|------------------|--------|--------|
| Guide content | `apps/brikette/src/locales/{locale}/guides/content/{guideKey}.json` | Existing guide JSON format | Existing guides.* + i18next |
| Static page content | `apps/brikette/src/locales/{locale}/*.json` | i18next flat strings | i18next |
| Help/assistance | `apps/brikette/src/locales/{locale}/*.json` | i18next flat strings | i18next |

**Guide content format (extended for CMS authoring):**
```json
{
  "seo": { "title": "...", "description": "..." },
  "linkLabel": "Guide display name",
  "intro": ["Paragraph 1", "Paragraph 2"],
  "sections": [
    { "id": "section-id", "title": "Section Title", "body": ["Para 1", "Para 2"] }
  ],
  "tips": ["Tip 1", "Tip 2"],
  "warnings": ["Warning 1"],
  "faqs": [{ "q": "Question?", "a": ["Answer para 1"] }],
  "gallery": {
    "title": "Photo gallery",
    "items": [
      { "imageId": "cf-image-id-123", "alt": "Description", "caption": "Caption text" }
    ]
  },
  "videos": [
    { "provider": "youtube", "videoId": "dQw4w9WgXcQ", "title": "Video title", "caption": "Optional caption" }
  ],
  "acknowledgments": "Content adapted from [Wikipedia](https://en.wikipedia.org/wiki/Example), licensed under CC-BY-SA."
}
```
**Note:** `imageId`, `videos`, and `acknowledgments` are new fields for CMS-authored content. Existing guides use route-component URLs and don't have video/acknowledgments; migration is optional.

**Rich content support (extended format for CMS-authored content):**
- **Formatted text:** Markdown supported in body strings (rendered by components)
- **Images:** Cloudflare Images ID-based system (robust long-term solution):
  - Gallery items include `imageId` field (Cloudflare Images ID, e.g., `"abc123-def456"`)
  - Build/render resolves ID to full URL via `buildCfImageUrl(imageId, variant)`
  - Benefits: automatic responsive variants, CDN optimization, no hardcoded URLs in git
  - Existing guides can migrate incrementally (route-component URLs remain valid)
  - CMS UI includes image uploader that uploads to Cloudflare and returns ID
- **Video:** Supported via structured field (robust long-term solution):
  - Optional `videos` array in guide format: `[{ provider: "youtube" | "vimeo", videoId: string, title: string, caption?: string }]`
  - Rendered by dedicated `GuideVideo` component with proper embeds and accessibility
  - **Implementation note:** `GuideVideo` component must be created in `apps/brikette/src/components/guides/` — handles YouTube/Vimeo embed iframes with lazy loading, aspect ratio, and accessibility (title attribute, keyboard navigation)
  - Alt: Markdown shortcode in body for inline video: `%VIDEO:youtube:dQw4w9WgXcQ|title%` — requires tokenization support in I18N-PIPE-00b
- **Internal links:** `%LINK:guideKey|label%` pattern — parsed by `renderGuideLinkTokens()` at render time
- **External links:** Standard Markdown `[label](url)` in body text
- **Anchors:** Section `id` fields used for TOC navigation (never translated)

**Guide key system (keep existing, no UUIDs):**
- **Guide keys are camelCase identifiers** (e.g., `fornilloBeachGuide`, `positanoBeaches`)
- Keys are stable — defined in `GENERATED_GUIDE_SLUGS` and typed as `GuideKey`
- Slugs are derived from keys via `guideHref()` with per-language variants
- Internal links use `%LINK:guideKey|label%` — human-readable and SEO-friendly
- **No migration to UUIDs** — existing system is mature and handles i18n properly
- New content uses new camelCase keys following existing naming conventions

**Why keep existing format (no dual storage):**
- 129 existing guides use this format — consistency matters
- Existing loaders (`guides.imports.ts`, `guides.fs.ts`) already handle discovery
- i18next `returnObjects: true` already supports nested structures
- No new custom loader needed — additive to existing system
- Avoids sync complexity between structured content and extracted strings

**Edit/update workflow for published content:**
- To edit: create new draft in CMS from current published content
- Edit draft; on approval + publish, MCP tool commits changes to git
- TM handles unchanged strings (cache hit); only changed strings re-translated
- **Direct git edits discouraged:** Next publish from CMS overwrites git version. Add warning in UI: "This content is CMS-managed; edit via CMS to preserve history."

**Rollback workflow:**
- Content is in git; use `git revert` on the problematic commit
- CMS can show "Revert" button that displays the git command to run
- Or: create corrective draft in CMS, approve and publish

**Content types supported for authoring (all in Phase 1):**
| Type | Storage | Example files | Authoring notes |
|------|---------|---------------|-----------------|
| Guide content | `locales/{locale}/guides/content/{guideKey}.json` | `positanoBeaches.json`, `pathOfTheGods.json` | Extended format with imageId, videos, acknowledgments |
| Namespace key additions | `locales/{locale}/*.json` | `landingPage.json`, `footer.json`, `assistanceSection.json` | Add new i18next keys to existing flat-string namespace files |

**Clarification:** "Namespace key additions" means adding NEW translation keys to existing namespaces — not creating new namespace files. Examples:
- Adding a new promotional banner text to `landingPage.json`
- Adding a new FAQ entry key to `assistanceSection.json`
- Adding a new footer link label to `footer.json`

### Shared components (used by both workstreams)
- Tokenization + format safety (placeholders/URLs/HTML/Markdown, plus Brikette `%LINK:key|label%`).
- Translation Memory (TM) + glossary/term protection.
- Locale normalization/aliasing where applicable (`no` → `nb`, `zh` handling policy).

**Scope clarification — i18next namespace files vs TranslatableText:**
| Content type | Format | In pipeline scope? | Notes |
|--------------|--------|-------------------|-------|
| Brikette `locales/*.json` | i18next JSON (flat key-value) | **Yes (Workstream B)** | Git/PR-based translation; preserve keys; never overwrite existing non-empty values unless explicitly requested |
| Shop `data/shops/*/sections.json` | `TranslatableText` inline | **Yes** | CMS-managed content |
| Shop `data/shops/*/products.json` | `Record<Locale, string>` (legacy) | **Yes** (after migration) | Requires I18N-PIPE-00c |
| Shop `data/shops/*/pages.json` SEO | `Record<Locale, string>` (legacy) | **Yes** (after migration) | Requires I18N-PIPE-00c |
| Shop navigation | Plain strings (today) | **Yes** (after migration) | Requires I18N-PIPE-03b |

**Why we don’t force Brikette namespaces into `TranslatableText`:**
- i18next namespaces are **keyed** and git-tracked; `TranslatableText` is **field/value** oriented and lives in shop data.
- Brikette namespace translation needs “preserve keys, generate PRs, don’t overwrite existing values” semantics, not publish gating.
- Keeping the two workstreams separate prevents leaking CMS/publish rules into app-localization workflows (and vice-versa).

**Typical e-commerce shop:**
| Content type | Estimated strings | Notes |
|--------------|-------------------|-------|
| Products (title + description) | ~100-200 | 50-100 products × 2 fields |
| CMS pages/sections | ~100-200 | Hero, about, policies, etc. |
| Navigation + SEO | ~50 | Menu items, meta titles/descriptions |
| **Total** | **~300-500 strings** | Represents typical shop baseline |

**Content format variations discovered:**
| Entity | Current format | TranslatableText? | Migration needed? |
|--------|---------------|-------------------|-------------------|
| CMS sections | `{ type: "inline", value: { en: "..." } }` | Yes | No |
| Products (title/desc) | `Record<Locale, string>` | No (legacy) | Yes — convert to TranslatableText |
| Pages SEO | `Record<Locale, string>` | No (legacy) | Yes — convert to TranslatableText |
| Navigation | Plain strings | No | Yes — convert to TranslatableText |

**Volume implications for cost targets:**
- Typical shop (500 strings, 50k chars, 3 locales = 150k chars): within subscription allowance (no pay-as-you-go API spend by default)
- Brikette full (7,600 strings, ~750k chars, 17 non-English locales = 12.75M chars): ~$190-255 at commercial rates
  - Self-hosted or LLM-based translation essential for Brikette-scale at reasonable cost
  - Translation Memory critical: re-runs of unchanged content must be $0

## Use Cases (derived from repo analysis)

The following use cases represent real-world requirements from Brikette and typical shop websites:

### UC-1 (Workstream A): Typical E-commerce Shop (baseline)
**Scenario:** A new shop with ~50 products, 5 CMS pages, and navigation in English wants to add German and Italian.

**Content inventory:**
- 50 products × 2 fields (title, description) = 100 strings
- 5 CMS pages × 10 sections × 3 texts avg = 150 strings
- Navigation (8 items) + SEO (10 meta descriptions) = 18 strings
- **Total: ~268 strings, ~27k characters**

**Requirements:**
- Translate all content from `en` to `de`, `it` (2 target locales)
- Total translation volume: ~54k characters
- Cost target: within subscription allowance (no pay-as-you-go API spend by default)
- Products use `Record<Locale, string>` format → migration needed to TranslatableText

**Acceptance criteria for UC-1:**
- [ ] Pipeline processes `Record<Locale, string>` product fields (after migration)
- [ ] Pipeline processes CMS sections with TranslatableText inline values
- [ ] Full shop translation completes in single run without manual chunking
- [ ] Run produces a token/usage estimate and completes within the subscription model’s expected throughput limits

### UC-2 (Workstream B): Brikette i18next namespaces at scale
**Scenario:** A content-heavy hostel website with 129 travel guides, 47 namespace files, and 18 total locales (17 non-English target locales).

**Content inventory (from actual repo):**
- 3,156 strings in top-level namespaces (landingPage, roomsPage, guides index, etc.)
- 4,467 strings in guide content (detailed articles with sections, TOC, FAQs)
- Largest files: assistanceKeywords (823 strings), howToGetHere (853 strings)
- **Total: ~7,600 strings, ~750k characters**

**Requirements:**
- Translate all content from `en` to 17 target locales
- Total translation volume: 12.75M characters
- Cost concern: commercial APIs would cost $190-255 per full run
- Self-hosted or TM-based cost reduction essential
- Guides contain links like `%LINK:pathOfTheGodsNocelle|Sentiero degli Dei%` that must be preserved

**Acceptance criteria for UC-2:**
- [ ] Workstream B can translate missing values across 7,600+ keys without timing out (batching + checkpointing)
- [ ] **Keys invariant:** Target locale files must have exactly the same keys as `en` source. Tool MAY add missing keys to target files (to match `en`), but MUST NOT add keys that don't exist in `en`, remove keys, or rename keys.
- [ ] Existing non-empty translations are preserved (no overwrites by default)
- [ ] TM achieves >90% cache hit rate on re-runs (only new/changed values trigger translation)
- [ ] Run produces a deterministic diff suitable for PR review (and can be reverted cleanly)

### UC-3 (Workstream B): Guide content with rich formatting
**Scenario:** Brikette guides contain structured JSON with SEO, intro arrays, TOC, sections with body arrays, and FAQs.

**Example structure (from `backpackerItineraries.json`):**
```json
{
  "seo": { "title": "...", "description": "..." },
  "linkLabel": "...",
  "intro": ["Pick a 1-, 2-, or 3-day plan..."],
  "toc": [{ "href": "#day1", "label": "Day 1: Positano essentials" }],
  "sections": [{ "id": "pacing", "title": "...", "body": ["...", "..."] }],
  "day1Title": "...",
  "day1": ["Morning: Spiaggia Grande...", "Lunch: pizza al taglio..."],
  "faqs": [{ "q": "What's the best 1-day plan?", "a": ["Start at..."] }]
}
```

**Requirements:**
- Translate all string values in nested structure
- Preserve JSON structure (arrays, objects)
- Handle inter-guide links: `%LINK:fornilloBeachGuide|cool down at Fornillo Beach%`
- Handle TOC anchors: `#day1`, `#savings` must not be translated

**Acceptance criteria for UC-3:**
- [ ] Walker recursively extracts strings from nested JSON (arrays, objects)
- [ ] `%LINK:key|label%` patterns are tokenized; only `label` portion is translated
- [ ] `#anchor` references in TOC are preserved unchanged
- [ ] Section IDs (`"id": "pacing"`) are never translated
- [ ] Translated guide maintains valid JSON structure

### UC-4 (Workstream A): Legacy Product Format Migration
**Scenario:** Existing shop has products with `Record<Locale, string>` format that predates TranslatableText.

**Current format (from `products.json`):**
```json
{
  "title": { "en": "Demo", "de": "", "it": "" },
  "description": { "en": "Product description", "de": "", "it": "" }
}
```

**Target format:**
```json
{
  "title": { "type": "inline", "value": { "en": "Demo" } },
  "description": { "type": "inline", "value": { "en": "Product description" } }
}
```

**Requirements:**
- Migration script converts legacy format to TranslatableText
- Existing locale values are preserved (only empty strings are eligible for translation)
- Type definitions updated to use TranslatableText

**Acceptance criteria for UC-4:**
- [ ] Migration script handles all shops in `data/shops/*/products.json`
- [ ] Non-empty locale values are preserved exactly
- [ ] Empty strings (`""`) are stripped (not stored as empty)
- [ ] Products with all locales filled are not sent for translation
- [ ] Rollback possible via undo bundle

### UC-5 (Workstream A): Publish Gate for Required Locales
**Scenario:** A shop requires `en` and `it` content before publish, but has `de` and `fr` as optional content locales.

**Shop settings:**
```json
{
  "contentLanguages": ["en", "it", "de", "fr"],
  "requiredContentLanguages": ["en", "it"],
  "primaryContentLocale": "en"
}
```

**Requirements:**
- Author creates content in English
- Before publish, operator runs translation command in Claude Code to fill Italian (required)
- Publish gate **validates** that required locales are filled — does NOT execute translation
- German and French can be added later (not blocking publish)
- "Do not machine translate" option blocks publish until manual Italian translation provided

**Workflow (operator-run, not automatic):**
1. Author creates English content in CMS
2. CMS shows: "Required locales missing: it. Run: `translate shop {shopId} section {sectionId} to it`"
3. Operator runs command in Claude Code session
4. Translation fills the Italian value
5. Operator clicks Publish — gate validates Italian is present — publish succeeds

**Acceptance criteria for UC-5:**
- [ ] Publish blocked if any `requiredContentLanguages` locale is missing
- [ ] Non-required locales (`de`, `fr`) do not block publish
- [ ] "Do not machine translate" flag per entity is respected
- [ ] Manual translation UI shows which required locales are missing

### UC-6 (Workstream A): RTL Content Locale (Arabic)
**Scenario:** Brikette wants to add Arabic (`ar`) content while UI chrome remains in English.

**Requirements:**
- `ar` is a content locale but not a UI locale
- Content renders with `dir="rtl"` and `lang="ar"`
- UI chrome (buttons, navigation labels) renders in English (fallback)
- Translation provider supports Arabic

**Acceptance criteria for UC-6:**
- [ ] `ar` can be added to `contentLanguages` without UI bundle
- [ ] `dir="rtl"` is set on content locale routes
- [ ] UI strings fall back to `uiLanguages[0]` (English)
- [ ] Provider locale mapping handles `ar` → provider's Arabic code

### UC-7 (Workstream A): Translation Memory Effectiveness
**Scenario:** Re-running translation after minor content updates should only translate new/changed strings.

**Initial run:**
- 500 strings translated, 150k chars, cost ~$3

**Second run (10 strings changed):**
- 490 strings hit TM cache (cost $0)
- 10 strings sent to provider (1k chars, cost ~$0.02)

**Acceptance criteria for UC-7:**
- [ ] TM stores tokenized translations keyed by source hash
- [ ] Unchanged content has 100% cache hit rate
- [ ] TM lookup is faster than provider API call
- [ ] TM updates `last_used_at` on cache hit for LRU tracking

## Blockers

### BLOCKER: Locale Type/Schema Expansion (I18N-PIPE-00)
The current `Locale` type in `@acme/types/constants` is hard-limited to `en | de | it`. This is a **blocking dependency** for variable-locale translation.

**Problem:** Coupling UI locales to content locales creates friction—adding a content language shouldn't require UI bundle work.

**Proposed solution: Split `UiLocale` vs `ContentLocale`**
- `UiLocale`: strict union (`en | it`) for UI string bundles in `packages/i18n/src/*.json` (no `de` for now)
- `ContentLocale`: BCP47-ish string type (or broader union) for `TranslatableText` values
- Shop settings define `uiLanguages: UiLocale[]` and `contentLanguages: ContentLocale[]`
- `resolveText` uses `ContentLocale` with fallback chain; UI chrome uses `UiLocale`
  - UI must include a **“Do not machine translate”** option for publish workflows and manual-only locales/fields.

**ContentLocale canonicalization and fallback:**
- **Canonical storage strategy: base tags + hreflang map**
  - Canonical stored keys are **base language tags** (`en`, `it`, `fr`, etc.) for most languages.
  - **Exception for script variants:** Chinese requires script distinction — store as `zh-Hans` and `zh-Hant` (not `zh`), since Simplified and Traditional are mutually unintelligible written forms.
  - Region variants (`pt-BR`, `en-GB`) are stored as-is only when the shop explicitly needs regional distinction (e.g., both `pt-PT` and `pt-BR` content).
  - **hreflang map:** Shop settings include an optional `hreflangMap: Record<ContentLocale, string>` to emit SEO-friendly region tags without changing storage keys.
    - Example: `{ "en": "en-GB", "it": "it-IT", "de": "de-DE" }` → stored as `en`, emitted as `en-GB` in `<link rel="alternate" hreflang>`.
    - **Default behavior (when `hreflangMap` is undefined or missing an entry):**
      - If `hreflangMap` is not provided: emit storage keys as-is (e.g., `en` emits as `hreflang="en"`).
      - If `hreflangMap` is provided but a specific locale is missing from it: emit that locale's storage key as-is.
      - Example: `hreflangMap: { "en": "en-GB" }` with `contentLanguages: ["en", "it"]` → `en` emits as `en-GB`, `it` emits as `it`.
    - **Validation rules (enforced on write):**
      - `hreflangMap` keys must be a subset of `contentLanguages`. Mapping to a locale not in `contentLanguages` is an error.
      - **Output values must be unique:** No two keys can map to the same hreflang value. Example: mapping both `en` and `en-GB` to `en-GB` is an error.
      - **Values must be valid BCP47-ish hreflang strings:** Basic regex validation + casing normalization via `normalizeHreflang()` helper.
      - **Casing normalization:** lowercase language, uppercase region (e.g., `en-gb` → `en-GB`).
    - **`x-default` handling (optional):**
      - Shops can set `hreflangDefault: ContentLocale` to emit `<link rel="alternate" hreflang="x-default" href="...">` for a specific locale.
      - If not set, no `x-default` is emitted (valid per spec; Google will infer).
    - **Why optional:** Many shops don't need regional distinction; base tags (`en`, `it`) are valid hreflang values per Google's spec.
- **Fallback chain:** exact match → base language → `primaryContentLocale` → `en`
  - Example for `pt-BR` request with `primaryContentLocale: "it"`: `pt-BR` → `pt` → `it` → `en`
  - Shop settings must define `primaryContentLocale` (defaults to `en` for backward compat).
- **Canonicalization (BCP47 casing):** lowercase language, TitleCase script, uppercase region
  - Examples: `pt-BR` (not `pt-br`), `zh-Hans` (not `zh-HANS` or `zh-hans`), `sr-Latn-RS`
- Unsupported variants are rejected at write time (validation), not silently normalized.
- **Aliasing:** Known aliases (e.g., `no` → `nb`) are normalized on read; new writes of aliases are rejected after migration.

**Locale traits (RTL, formatting):**
- Content locales drive `lang` attribute, `dir` attribute (RTL for `ar`, `he`), and number/date formatting — even when UI strings fall back to `UiLocale`.
- UI chrome labels fall back to `UiLocale`, but document-level traits follow the requested content locale.
- Apps must handle RTL layout when routing to RTL content locales.

**Brikette-style locale set (storage keys + hreflang recommendations)**
Shops should be able to select all Brikette locales. Storage keys use base tags (except Chinese); hreflang map provides SEO region tags:

| Storage key | hreflang recommendation | Notes |
|-------------|------------------------|-------|
| `en` | `en-GB` | Base tag stored; hreflang map emits region |
| `it` | `it-IT` | |
| `fr` | `fr-FR` | |
| `de` | `de-DE` | |
| `es` | `es-ES` | |
| `pt` | `pt-PT` | Add `pt-BR` as separate key only if needed |
| `zh-Hans` | `zh-Hans` | Script variant **required** in storage |
| `zh-Hant` | `zh-Hant` | Script variant **required** in storage |
| `ja` | `ja-JP` | |
| `ko` | `ko-KR` | |
| `ru` | `ru-RU` | |
| `ar` | `ar-SA` | |
| `hi` | `hi-IN` | |
| `vi` | `vi-VN` | |
| `pl` | `pl-PL` | |
| `sv` | `sv-SE` | |
| `da` | `da-DK` | |
| `hu` | `hu-HU` | |
| `nb` | `nb-NO` | Replaces legacy `no`; alias handled in migration |

**Default hreflang map for Brikette:** `{ "en": "en-GB", "it": "it-IT", "fr": "fr-FR", "de": "de-DE", "es": "es-ES", "pt": "pt-PT", "ja": "ja-JP", "ko": "ko-KR", "ru": "ru-RU", "ar": "ar-SA", "hi": "hi-IN", "vi": "vi-VN", "pl": "pl-PL", "sv": "sv-SE", "da": "da-DK", "hu": "hu-HU", "nb": "nb-NO" }`

**Brikette locale expansion policy (current `zh` → script variants):**
Brikette's current `i18n.config.ts` lists `zh` (undifferentiated Chinese). The pipeline requires script-specific storage keys (`zh-Hans`, `zh-Hant`) because Simplified and Traditional are mutually unintelligible.

| Current Brikette locale | Pipeline storage key | Behavior |
|------------------------|---------------------|----------|
| `en`, `es`, `de`, `fr`, `it`, `ja`, `ko`, `pt`, `ru`, `ar`, `hi`, `vi`, `pl`, `sv`, `da`, `hu` | Same (base tag) | 1:1 mapping |
| `no` | `nb` | Alias migration (Norwegian Bokmål) |
| `zh` | `zh-Hans` (default) | **Scope expansion:** existing `zh` content migrates to `zh-Hans`. To support Traditional Chinese, shop must explicitly add `zh-Hant`. |

**"Select all Brikette-compatible locales" option:**
- Adds: `en`, `it`, `fr`, `de`, `es`, `pt`, `ja`, `ko`, `ru`, `ar`, `hi`, `vi`, `pl`, `sv`, `da`, `hu`, `nb`, `zh-Hans`
- Does **not** add `zh-Hant` by default (operator must opt-in if they need Traditional Chinese)
- This matches Brikette's current 18-locale scope (including `en`) without silent scope expansion
- UI label: "Select all Brikette-compatible locales (18 total, 17 translation targets)" — explicit count avoids confusion
- **Count breakdown:** 18 total = 17 non-English targets + `en` source. Translation runs translate FROM `en` TO the other 17.

**Migration for existing `zh` content:**
- Existing `zh` keys in `TranslatableText.value` are migrated to `zh-Hans` (same content, new key).
- If shop wants both scripts: manually add `zh-Hant` and translate separately.
- Validation rejects new writes of bare `zh` after migration.

**Which list drives what:**
| Surface | Driven by | Behavior when contentLanguages ⊃ uiLanguages |
|---------|-----------|----------------------------------------------|
| URL routing / middleware | `contentLanguages` | Routes to content locale; UI chrome uses `uiLanguages[0]` fallback |
| Sitemap / hreflang | `contentLanguages` + `hreflangMap` | Includes content locales; emits region tags from hreflang map |
| Language switcher (storefront) | `contentLanguages` | Can show all content locales; UI labels render in `uiLanguages[0]` |
| CMS content editing | `contentLanguages` | Can edit content in locales without UI bundle |
| Translation pipeline targets | `requiredContentLanguages` (publish gate) or `contentLanguages` (manual run) | Translates to required locales for publish; all locales for manual |
| `resolveText` runtime | Request locale → fallback chain | Falls back: exact → base → `primaryContentLocale` (configurable, defaults to `en`) |
| UI chrome strings | `uiLanguages` | Uses `uiLanguages[0]` (typically `"en"`) when requested locale not in `uiLanguages` |

**UI locale fallback rule (deterministic):** When rendering UI chrome for a content locale not in `uiLanguages`, always use `uiLanguages[0]`. Example: user requests `de` content, but `de` is not in `uiLanguages = ["en", "it"]` → UI chrome renders in `en`.

**Required work (tracked as I18N-PIPE-00)**:
1. Define `ContentLocale` type (superset of `UiLocale`, includes Brikette locales).
2. Update `TranslatableText.value` to use `Partial<Record<ContentLocale, string>>`.
3. Update shop `settings.languages` → split into `uiLanguages` + `contentLanguages` (or single list with clear semantics).
4. Update JSON schema validation accordingly.
5. Ensure `resolveText` handles content locales gracefully (fallback to `en` if no UI bundle).
6. Document how apps declare supported content vs UI locales.
7. Default new shops to `contentLanguages = ["en", "it"]` with an option to “Select all Brikette locales”.

**Migration impact (must be addressed in I18N-PIPE-00):**
- All code that reads `settings.languages` for routing, SEO, or hreflang must choose `uiLanguages` vs `contentLanguages`.
- Backward-compat bridge:
  - Existing shops with a single `languages` array map to `contentLanguages = languages`.
  - `uiLanguages` is derived as `intersection(languages, ["en", "it"])` (fallback to `["en"]` if empty).
- Audit callsites: middleware locale detection, sitemap generation, `<link rel="alternate" hreflang>` tags, language switcher UI.
- Reduce UI locale support to `en` + `it` (remove `de` as a selectable UI locale until intentionally reintroduced).

**Definition of done:**
- Pipeline can target any `ContentLocale` without touching UI bundle code.
- CMS can display content in locales that lack full UI translation (with graceful fallback).

### Draft Content Definition
"Draft-only" requires entity-specific rules, not just `status === "draft"`:

| Entity | Status values | Translatable states | Notes |
|--------|---------------|---------------------|-------|
| CMS pages | `draft`, `published` | `draft` only | Clear binary |
| CMS sections | `draft`, `published` | `draft` only | Reusable content blocks |
| CMS templates | `draft`, `published` | `draft` only | Page layout templates |
| Products | `draft`, `review`, `scheduled`, `active`, `archived` | `draft`, `review`, `scheduled` | Pre-publish states (including scheduled) |
| Navigation | (none today) | Must be translated pre-publish | Requires draft/publish model for navigation edits |
| SEO fields (settings-level) | (none today) | Must be translated pre-publish | Requires draft/publish model for settings-level SEO edits |
| Blog posts | `draft`, `published` | `draft` only | If applicable |

**Clarification:** Navigation and settings-level SEO must have required locales filled (via operator-triggered translation or manual entry) before going live. This requires introducing a draft/publish model for settings-like entities so translation can run pre-publish (see tasks).

**Walker rules:**
1. Check entity type first to determine which status values are translatable.
2. If entity has no status field:
   - If it’s a settings-like entity (navigation / settings-level SEO), use the settings draft model; do not skip.
   - Otherwise skip (manual translation only).
3. If entity status is in translatable set → include.
4. Log skipped entities with reason ("no status field", "status=active", etc.).

**If a surface lacks draft/published distinction**, it must either (a) gain one, or (b) be excluded from “translate-before-live” publishing.

## Cost Strategy

### Budget Targets
- **Primary (subscription model):** no pay-as-you-go API spend by default; runs consume subscription allowance and operator time.
- **Re-run efficiency:** $0 incremental LLM work for unchanged content (TM cache hit).
- **Optional API overflow target (if enabled later):** keep a typical-shop run under ~$5.

**"Typical shop" definition for budget target (UC-1):**
- ~500 translatable strings
- ~50k source characters (average 100 chars/string)
- 3 target locales (e.g., `de`, `it`, `fr` from `en` source)
- Total: ~150k characters to translate per full run
- **Commercial equivalent:** at $20/1M chars, ~$3/run (for reference only; not the primary execution model)

**Brikette-scale reality (UC-2):**
- ~7,600 translatable strings (from repo analysis)
- ~750k source characters
- 17 target locales (all non-English Brikette locales)
- Total: ~12.75M characters to translate per full run
- **At $20/1M chars: ~$255/run** — far exceeds $5 target

**Cost strategy by scale (with LLM subscription approach):**
| Scale | Strings | Chars/run | Commercial cost | Subscription usage | Recommended |
|-------|---------|-----------|-----------------|-------------------|-------------|
| Typical shop | 500 | 150k | ~$3 | Low | LLM via subscription |
| Medium shop | 2,000 | 600k | ~$12 | Medium | LLM via subscription |
| Brikette-scale | 7,600 | 12.75M | ~$255 | High (cold) / Low (TM-warmed) | LLM via subscription + TM |

*May hit subscription limits on cold runs; TM ensures subsequent runs are fast and usually low-usage.

**Cost mitigation strategies:**
1. **LLM subscription plans**: Claude Pro/Team or OpenAI Plus/Team — fixed monthly cost covers all translation volume.
2. **Translation Memory (TM)**: After initial run, only new/changed content needs translation. Re-runs of unchanged content = $0 and instant (no API calls).
3. **Batching within rate limits**: For large runs, batch requests to stay within subscription rate limits; spread across sessions if needed.
4. **API fallback**: If subscription rate-limited, use Claude/OpenAI API with pay-as-you-go for overflow (still cheaper than commercial translation APIs).

### Provider Selection: LLM-Based (Claude / OpenAI)

**Decision:** Use LLM-based translation via existing monthly subscription plans (Claude Pro/Team or OpenAI Plus/Team) rather than per-character commercial translation APIs.

**Rationale:**
- Monthly plans have fixed cost regardless of translation volume — ideal for Brikette-scale (12.75M chars would cost ~$255 with commercial APIs)
- Quality is comparable to or better than commercial APIs for most language pairs
- Same models already used for development — no new vendor relationships
- Prompt engineering allows fine-tuning for domain (travel, hospitality vocabulary)

**Primary provider options:**

| Provider | Plan | Cost model | Notes |
|----------|------|------------|-------|
| Claude (Sonnet/Haiku) | Pro ($20/mo) or Team | Allocated monthly budget | High quality; excellent instruction following |
| OpenAI (GPT-4o-mini) | Plus ($20/mo) or Team | Allocated monthly budget | Fast; good for bulk content |
| Claude via API | Pay-as-you-go | ~$3/1M input tokens (Haiku) | Overflow if subscription limits exhausted |

**Cost model clarification (IMPORTANT):**
- Subscription plans are **NOT "$0 incremental"** — they have monthly usage limits that vary by tier and may change.
- Frame cost as: **allocated monthly budget** consumed per run, not "free".
- Large cold runs (Brikette-scale, 17 locales) may require **multiple operator sessions spanning multiple days** if subscription limits are hit.
- There is **no SLA, no stable rate limit headers, no deterministic throughput** for subscription usage.

**Recommended approach:**
1. **Primary:** Claude Sonnet via Pro/Team subscription for quality-critical content (SEO, product descriptions)
2. **Bulk:** Claude Haiku or GPT-4o-mini for high-volume guide content
3. **Overflow strategy (choose one):**
   - **Option A (no secrets):** Accept that large runs may span multiple sessions/days. No API keys stored.
   - **Option B (API overflow):** Store API keys; use pay-as-you-go API when subscription exhausted. This reintroduces secrets management.
   - **Current decision: Option A** — consistent with "no headless execution" model. Document that Brikette-scale cold runs may take 2-3 operator sessions.

**Integration architecture: MCP + Claude Code sessions**

The translation pipeline runs **within Claude Code sessions** using the subscription allowance, not via pay-as-you-go API:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Code Session                        │
│  (uses Pro/Team subscription allowance)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Operator: "translate shop cover-me-pretty to de, it"          │
│                        │                                        │
│                        ▼                                        │
│   ┌─────────────────────────────────────────┐                  │
│   │  MCP Tool: translate-content            │                  │
│   │  (exposed by @acme/i18n-mcp-server)     │                  │
│   └─────────────────────────────────────────┘                  │
│                        │                                        │
│         ┌──────────────┼──────────────┐                        │
│         ▼              ▼              ▼                        │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│   │ Extract  │  │ TM Check │  │ Translate│                    │
│   │ (walker) │  │ (cache)  │  │ (Claude) │                    │
│   └──────────┘  └──────────┘  └──────────┘                    │
│         │              │              │                        │
│         └──────────────┼──────────────┘                        │
│                        ▼                                        │
│   ┌─────────────────────────────────────────┐                  │
│   │  Apply translations to content files    │                  │
│   │  + Update TM + Create undo bundle       │                  │
│   └─────────────────────────────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**How it works:**

1. **MCP server (`@acme/i18n-mcp-server`)** exposes translation tools:
   - `translate-content`: Extract → TM lookup → translate misses → apply
   - `translation-status`: Check job progress, view failures
   - `translation-undo`: Revert a translation run

2. **Operator triggers via Claude Code**:
   ```
   > translate the draft content for shop "brikette" to German and Italian
   ```
   Claude Code calls the MCP tool, which:
   - Extracts translatable strings from draft content
   - Checks TM for cached translations (instant, no LLM call)
   - For cache misses: Claude (the same session) translates inline
   - Applies results to content files
   - Updates TM for future runs

3. **Translation happens within the session**:
   - No external API calls for translation — Claude does it directly
   - Uses subscription allowance (Pro/Team)
   - Batching handled naturally by session context limits

4. **For large runs (Brikette-scale)**:
   - Session may need multiple turns (7,600 strings won't fit in one prompt)
   - MCP tool handles batching internally, resuming across turns
   - TM ensures only new/changed content needs translation after first run

**Why MCP + Claude Code is the right architecture:**
- **Uses subscription, not API**: Translation is "Claude talking to itself" within a session
- **Fits existing workflow**: Operators already use Claude Code
- **Extensible**: Same pattern works for Codex (OpenAI) sessions
- **Auditable**: Session transcript shows what was translated
- **TM integration**: Cache misses are the only strings needing LLM translation

**Rate limit considerations:**
- Subscription plans have usage limits (varies by plan tier)
- For Brikette full run (7,600 strings), translation batches across multiple turns within a session
- Translation Memory (TM) critical: after initial run, subsequent runs should hit TM cache (no LLM calls for unchanged content)
- If session hits limits: save checkpoint, operator resumes in next session

**Throughput expectations (MCP/subscription model):**

| Metric | Typical shop (500 strings) | Brikette-scale (7,600 strings) | Notes |
|--------|---------------------------|-------------------------------|-------|
| Strings/minute | ~50-100 | ~50-100 | Bottleneck is LLM generation, not extraction |
| Strings/turn | ~100-200 | ~100-200 | Context window limits batch size |
| Turns/session | 3-5 | 40-80 | Varies by subscription tier |
| Sessions for full run | 1 | 1-2 (cold) / 0-1 (TM-warmed) | TM hit rate critical |
| Max locales/run | No limit | No limit | Per-locale batching is automatic |

**First-run vs subsequent runs:**
- **Cold run (no TM):** Brikette 7,600 strings × 1 locale ≈ 40-80 turns ≈ 1-2 sessions. Full 17-locale run ≈ 2-3 sessions (labels dedupe across locales).
- **Warmed run (TM populated):** Only changed content needs translation. Typical delta <5% → completes in 1 turn.

**Failure modes when limits hit:**
| Failure | Detection | Recovery |
|---------|-----------|----------|
| Session context exhausted | Turn fails to complete | MCP saves checkpoint; operator runs `translation-resume(jobId)` in a new session |
| Subscription rate limit | Provider returns 429 | MCP pauses 60s; if persistent, saves checkpoint for next day |
| Session timeout | No response in 5min | MCP saves checkpoint with last successful batch |

**Locale type definitions (distinct types prevent misuse):**
```typescript
// Workstream A: canonical locale codes from @acme/types
// Used for shop content (CMS, products, navigation, SEO)
type ContentLocale = "en" | "de" | "it";  // From LOCALES constant (expandable)

// Workstream B: filesystem directory names in apps/brikette/src/locales/
// These are the ACTUAL directory names, not canonical codes
type FsLocale = "en" | "de" | "it" | "es" | "fr" | "ja" | "ko" | "pt" | "ru" | "zh" | "ar" | "hi" | "vi" | "pl" | "sv" | "no" | "da" | "hu";

// Filesystem → Canonical mapping (used for TM keys and translation logic)
const fsToCanonicalMap: Partial<Record<FsLocale, string>> = {
  "no": "nb",        // Norwegian Bokmål (directory is "no", canonical is "nb")
  "zh": "zh-Hans",   // Simplified Chinese (directory is "zh", canonical is "zh-Hans")
  // All other FsLocale values map to themselves
};

// Helper to get canonical code from filesystem locale
function fsToCanonical(fs: FsLocale): string {
  return fsToCanonicalMap[fs] ?? fs;
}
```

**Why distinguish these:**
- Passing `nb` to Workstream B tool fails — no `locales/nb/` directory exists (it's `locales/no/`)
- Passing `no` to Workstream A tool fails — not a valid `ContentLocale`
- TM keys use canonical codes so translations are reusable across systems
- Strongly-typed parameters prevent operator error

**Checkpoint schema:**
```typescript
interface TranslationCheckpoint {
  workstream: "A" | "B";
  toolName: "translate-content" | "translate-i18n-namespaces";
  jobId: string;
  shopHandle?: string;          // Workstream A
  appId?: string;               // Workstream B (e.g., "brikette")
  // Distinct locale types per workstream:
  targetContentLocales?: ContentLocale[];  // Workstream A only
  targetFsLocales?: FsLocale[];            // Workstream B only
  completedStrings: number;
  totalStrings: number;
  lastBatchIndex: number;
  pendingStringIds: string[];  // Field paths remaining (e.g., "pages[0].sections[3].headline")
  createdAt: string;           // ISO timestamp
}
```

**Translation protocol (MCP ↔ Claude session):**

The batch protocol uses **ID-keyed structured JSON**, not line-based format. This is critical for:
- Strings containing newlines
- Translations that include numbered lists
- Detecting reordering, dropped lines, or extra commentary
- Auditable, resumable job state

**Batch request format (MCP tool returns to session):**
```json
{
  "batchId": "b-abc123",
  "sourceLocale": "en",
  "targetLocale": "de",
  "items": [
    { "id": "pages[0].sections[3].headline", "text": "Hello ⟦TP001⟧" },
    { "id": "pages[0].sections[3].body[0]", "text": "Welcome to ⟦TG001⟧" },
    { "id": "products[12].title", "text": "Summer sale" }
  ]
}
```

**Expected response format (Claude returns to MCP tool):**
```json
{
  "batchId": "b-abc123",
  "translations": [
    { "id": "pages[0].sections[3].headline", "text": "Hallo ⟦TP001⟧" },
    { "id": "pages[0].sections[3].body[0]", "text": "Willkommen bei ⟦TG001⟧" },
    { "id": "products[12].title", "text": "Sommerverkauf" }
  ]
}
```

**Validation rules:**
- `batchId` must match request
- All `id` values from request must be present in response (no drops)
- No extra `id` values in response (no hallucinated translations)
- Token multiset in each translation must match source (see I18N-PIPE-06)

### MCP Tool Inventory (AUTHORITATIVE)

**Translation execution:**
- `translate-content(shopId, targetLocales, options)` — Workstream A translation executor (I18N-PIPE-04)
- `translation-preview(shopId, targetLocales)` — Workstream A dry-run (extract + TM only; no LLM) (I18N-PIPE-04)
- `translate-i18n-namespaces(appId, targetLocales, options)` — Workstream B i18next namespaces (git/PR-based) (I18N-PIPE-07)

**Job management:**
- `translation-status(jobId, options)` — Job status for both workstreams; with `--export-tm` flag exports TM to file (I18N-PIPE-03)
- `translation-resume(jobId)` — Resume from last saved checkpoint for both workstreams (I18N-PIPE-03)
- `translation-undo(jobId)` — Undo bundle apply (I18N-PIPE-03c)

**Content authoring (Workstream B):**
- `author-brikette-content(contentType, prompt, options)` — LLM-assisted draft generation from prompts or URLs (I18N-PIPE-08)
- `publish-brikette-draft(draftId, options)` — Guide export + translate + PR creation (operator-run in Claude Code) (I18N-PIPE-08)
- `publish-brikette-namespace(draftId, options)` — Namespace key additions export + translate + PR creation (operator-run in Claude Code) (I18N-PIPE-08)

### CMS API Endpoints (for MCP tools)

These endpoints are called by MCP tools running in operator's Claude Code session:

| Endpoint | Method | Auth | Purpose | Task |
|----------|--------|------|---------|------|
| `/api/brikette-drafts` | GET | API token | List drafts with status filter | I18N-PIPE-08 |
| `/api/brikette-drafts/{draftId}` | GET | API token | Fetch draft content for export | I18N-PIPE-08 |
| `/api/brikette-drafts/{draftId}/status` | PATCH | API token | Update draft status (e.g., mark as published) | I18N-PIPE-08 |
| `/api/translation-jobs` | GET | API token | List translation jobs for CMS display | I18N-PIPE-05 |
| `/api/translation-jobs/{jobId}` | GET | API token | Job details and summary | I18N-PIPE-05 |

**Auth model:** MCP tools authenticate using operator-provided API token (stored in MCP config, not in repo). CMS validates token using existing NextAuth infrastructure.

**Prompt template (wraps the batch JSON):**
```
Translate each item from {sourceLocale} to {targetLocale}.
Preserve all tokens in the format ⟦T...⟧ exactly as they appear.
Do not translate proper nouns marked with ⟦TG...⟧.
Return ONLY valid JSON matching the response schema. No explanation.

Request:
{batch_json}

Response schema:
{
  "batchId": "<same as request>",
  "translations": [{ "id": "<same as request item>", "text": "<translated text>" }, ...]
}
```

**Error handling:**
- If response is not valid JSON: mark batch as `failed_parse`, retry once with explicit JSON instruction
- If `batchId` mismatch: mark batch as `failed_mismatch`, log and skip
- If missing/extra IDs: mark affected items as `failed_incomplete`, apply successful items, retry failed items in next batch

### Legacy Provider Comparison (for reference)

> **Note:** These commercial options remain available as fallback if LLM quality is insufficient for specific language pairs.

| Provider | Cost (approx) | Batch/Array API | Notes |
|----------|---------------|-----------------|-------|
| DeepL Pro | ~$20/1M chars | Yes (array, 50 texts/request) | Best quality for European languages |
| Google Cloud Translation | ~$20/1M chars | Yes (array) | Wide language support |
| AWS Translate | ~$15/1M chars | Yes (async batch) | Good for large batches |
| LibreTranslate (self-hosted) | ~$0 (compute) | Yes (array) | Quality varies by language pair |

### Data Handling & Security Policy

**What can be sent to external providers:**
- Product descriptions (draft/review status only), page/section/template content (draft status only)
- Navigation + SEO fields **in their draft form** (after introducing a draft/publish model for settings-like entities)
- Only content explicitly selected for machine translation (UI option: “Do not machine translate” keeps the content eligible for manual translation but prevents external send)

**What must NOT be sent:**
- PII (customer names, emails, addresses) — should not appear in translatable content anyway
- API keys, credentials, internal URLs
- Content marked with `freezeTranslations: true` (see schema below)

**`freezeTranslations` schema** (distinct from "Do not machine translate"):
- **Purpose:** Completely exclude content from translation pipeline — neither machine nor manual translation runs affect it. Used for archival content, legally locked text, or content managed externally.
- **Storage:** Entity-level boolean field `freezeTranslations: boolean` (default: `false`).
- **Where it lives:**
  - Products: `product.freezeTranslations`
  - CMS pages/sections: `page.freezeTranslations`, `section.freezeTranslations`
  - Shop-wide: `settings.translation.freezeAll` (optional shop-level override)
- **Behavior:**
  - When `true`, walker skips the entity entirely (no extraction, no TM lookup, no apply).
  - Unlike `machineTranslation.enabled: false`, frozen content is also excluded from manual translation job targeting.
  - Frozen entities are not counted in "missing translations" reports.
- **Publish gate interaction (CRITICAL — prevents deadlock):**
  - **Rule:** Frozen entities are **exempt from required-locale enforcement**.
  - Rationale: If an entity is frozen, the operator has explicitly decided to manage its translations externally (or not at all). Requiring locales that can't be filled via the pipeline would create a deadlock.
  - **Behavior on publish:**
    - If `freezeTranslations: true` and entity is missing required locales → publish **succeeds** (frozen entities are exempt).
    - If `freezeTranslations: false` and entity is missing required locales → publish **blocked** (normal enforcement).
  - **CMS warning:** When freezing an entity with missing required locales, show: "This entity has missing translations for [locales]. Freezing will allow publish without these translations."
- **Use cases:**
  - Archival content that must remain as-is for legal/compliance reasons.
  - Content with externally managed translations (imported from another system).
  - Temporary freeze during content audit/review.
  - English-only content that shouldn't block multilingual publish.
- **Access control (admin escape hatch):**
  - `freezeTranslations` is an **elevated permission** — only users with `admin` or `ShopAdmin` role can enable it.
  - Rationale: Freezing bypasses required-locale enforcement; must not be used casually to ship incomplete content.
  - **Audit requirement:** When enabling freeze, operator must provide a reason (free text, stored in audit log).
  - **Audit log entry:** `{ action: "freeze_translations", entityType, entityId, reason, userId, timestamp }`.
- **hreflang interaction (CRITICAL — prevents false advertising):**
  - If an entity is frozen AND missing required locales, **do not emit hreflang for missing locales on that entity's pages**.
  - Example: Product page frozen with only `en` content → emit `hreflang="en"` only, NOT `hreflang="de"` or `hreflang="it"`.
  - This requires hreflang generation to be **page-coverage-aware**, not just driven by shop `contentLanguages`.
  - **Implementation:** When rendering hreflang tags, check each entity on the page for coverage; emit only locales where ALL entities have content.
- **CMS UI:** Toggle "Freeze translations" in entity settings (admin-only); show warning that entity will be excluded from all translation operations and required-locale enforcement. Require reason input on enable.

**Provider-specific considerations:**
- **Cloud APIs (Google, AWS, DeepL):** Review DPA/data processing terms; content may be logged for quality improvement unless opted out
- **Self-hosted (LibreTranslate, Argos):** No external data transfer; preferred for sensitive content if quality acceptable
- **LLMs (Haiku):** Check Anthropic's data retention policy; consider API options that disable training on inputs

**Guardrails:**
- `freezeTranslations` flag at shop or entity level excludes content from automatic runs
- Audit logs store metadata (hashes, counts, locales) but **not raw source/translated text** to avoid sensitive data in logs
- CMS UI shows warning before first translation run explaining external data transfer

**Content filtering before external send:**
- **Tokenization strategy for preservable content** (preferred over blanket blocking):
  - Emails, phone numbers, URLs, and placeholders are **masked before translation** with tokens
  - **Token format** (designed for robustness):
    - Format: `⟦T<type><seq>⟧` where `<type>` is single letter (`U`=URL, `E`=email, `P`=generic placeholder, `I`=i18next interpolation `{{var}}`, `H`=HTML), `<seq>` is digits
    - Examples: `⟦TU001⟧`, `⟦TE002⟧`, `⟦TP003⟧`, `⟦TI004⟧`
    - Uses Unicode brackets `⟦⟧` (U+27E6, U+27E7) — extremely unlikely to appear in source content or be mutated by translation
    - Digits-only payload avoids CJK transliteration issues
    - **Collision avoidance**: if source already contains `⟦T...⟧` pattern, escape as `⟦⟦T...⟧⟧` before tokenization, unescape after
  - After translation, tokens are replaced with original values from token map
  - This avoids false-positive blocking of legitimate marketing copy like "contact us at support@example.com"
  - Fallback: if tokens are mangled/missing in output, mark string as `failed` (not `blocked`)
- **PII scanner** (secondary safety net):
  - Regex-based detection for patterns that should never appear in marketing content (SSN-like patterns, credit card formats)
  - On detection: block string, flag as `blocked_pii`
- **CMS display of blocked/failed strings**: UI reads raw source text via field path lookup (job results store field path + hash, not raw text)
- **Length limits**: Strings exceeding 10k characters flagged for review (may indicate data dump or malformed content)
- **Allowlist mode** (optional): Shop setting to only translate strings matching specific field paths

### Artifact Storage Strategy (AUTHORITATIVE)

All translation pipeline artifacts are stored in defined locations with explicit git-tracking policy. This prevents ambiguity about where data lives and whether it should be committed.

**Artifact locations:**

| Artifact | Location | Git-tracked | Rationale |
|----------|----------|-------------|-----------|
| Translation Memory (TM) | `data/translation-memory.json` | **NO** | Content-bearing; too large; changes on every run. Add to `.gitignore`. |
| Undo bundles (Workstream A) | `data/shops/{handle}/translation-undo/{jobId}.json` | **NO** | Operational recovery only; shop-scoped for multi-tenant. Add to `.gitignore`. |
| Undo bundles (Workstream B) | `data/translation-undo/brikette/{jobId}.json` | **NO** | Operational recovery only; app-scoped. Add to `.gitignore`. |
| Job audit logs | `data/translation-jobs/{jobId}.json` | **NO** | Metadata-only but grows indefinitely. Add to `.gitignore`. |
| Brikette staleness meta | `apps/brikette/src/locales/.translation-meta.json` | **YES** | Enables staleness detection; shared across team; merge conflicts are acceptable. |
| Glossary terms | `data/shops/{handle}/glossary.json` (Workstream A) | **YES** | Content definition; human-edited. |
| Glossary terms | `apps/brikette/glossary.json` (Workstream B) | **YES** | Content definition; human-edited. |
| Workstream B lock file | `apps/brikette/.translation-lock` | **NO** | Ephemeral advisory lock; auto-deleted on job completion. Add to `.gitignore`. |

**Directory structure:**
```
data/
├── translation-memory.json      # NOT git-tracked
├── translation-undo/            # NOT git-tracked (Workstream B)
│   └── brikette/
│       └── {jobId}.json
├── translation-jobs/            # NOT git-tracked
│   └── {jobId}.json
└── shops/{handle}/
    ├── glossary.json            # git-tracked
    └── translation-undo/        # NOT git-tracked (Workstream A)
        └── {jobId}.json

apps/brikette/
├── glossary.json                # git-tracked
├── .translation-lock            # NOT git-tracked (ephemeral)
└── src/locales/
    └── .translation-meta.json   # git-tracked
```

**`.gitignore` additions (required for this plan):**
```gitignore
# Translation pipeline artifacts (operational, not source of truth)
data/translation-memory.json
data/translation-undo/
data/translation-jobs/
data/shops/*/translation-undo/
apps/brikette/.translation-lock
```

**Backup strategy for non-git artifacts:**
- TM: Export command available via MCP tool `translation-status --export-tm`; recommend periodic backup to cloud storage for disaster recovery.
- Undo bundles: Ephemeral; only retained for 90 days (configurable via `TRANSLATION_UNDO_RETENTION_DAYS`). No backup needed.
- Job logs: Ephemeral; only retained for 90 days. Export to external logging system (e.g., Datadog) if long-term audit required.

**Lock file behavior (Workstream B):**
- Lock file is created at job start: `apps/brikette/.translation-lock`
- Contains: `{ "jobId": "...", "pid": ..., "startedAt": "...", "operator": "..." }`
- Deleted on job completion (success or failure)
- If job crashes: stale lock detected by checking if PID is still running; stale locks auto-removed after 10 minutes
- Lock acquisition timeout: 60 seconds (configurable via `TRANSLATION_LOCK_TIMEOUT_MS`)

### Git/PR Workflow Boundaries (AUTHORITATIVE)

Multiple MCP tools create git branches. This section defines which tool owns which workflow to prevent conflicts.

**Branch ownership:**

| Tool | Branch pattern | Purpose | Allowed operations |
|------|----------------|---------|-------------------|
| `translate-i18n-namespaces` | `work/i18n-{app}-{timestamp}` | Translate existing namespace values | Read locale files, write translations, commit, create PR |
| `publish-brikette-draft` | `work/guide-{guideKey}-{timestamp}` | Export new guide from CMS to git | Write new guide file, commit, create PR |
| `publish-brikette-namespace` | `work/namespace-{namespace}-{timestamp}` | Add new keys to namespace | Write to namespace file, commit, create PR |

**Conflict prevention rules:**
1. **One branch per job:** Each tool invocation creates its own branch. Never reuse branches across jobs.
2. **Base branch check:** Before creating a branch, verify `HEAD` is on `main` (or configured base branch). Fail if on a feature branch.
3. **Lock file for Workstream B:** Before any git operation, acquire advisory lock `apps/brikette/.translation-lock`. Timeout after 60s. Prevents concurrent runs from racing.
4. **No force push:** Tools MUST NOT force-push. If branch exists, fail and prompt operator to resolve.
5. **PR per job:** Each job creates one PR. Combining multiple jobs into one PR is operator responsibility (manual merge).

**Concurrent run behavior:**
- **Workstream A (CMS content):** No git involvement; concurrent runs are safe (different shops or different fields within shop).
- **Workstream B (git-based):** Lock file prevents true concurrency. Second run waits for lock or times out.
- **Cross-workstream:** Safe; they operate on different storage (CMS DB vs git files).

**Branch cleanup:**
- PRs merged or closed → branch deleted automatically (GitHub setting).
- Stale branches (>7 days, no PR) → operator manually deletes or automated cleanup job.

### Canonical Tokenization Pipeline (AUTHORITATIVE ORDER)

Tokenization must happen in a **fixed order** to prevent tokens from stepping on each other and to ensure deterministic hashing. This is the single source of truth for implementers.

**Pipeline stages (executed in order):**

```
1. ESCAPE EXISTING TOKENS
   - If source contains `⟦T...⟧` patterns, escape as `⟦⟦T...⟧⟧`
   - Prevents user content from being interpreted as tokens

1b. ESCAPE BRIKETTE SHORTCODE LITERALS
   - If source contains `%%LINK:` or `%%VIDEO:`, these are escaped literals (user wants literal `%LINK:` in output)
   - Replace `%%LINK:` → `⟦TESC001⟧` (escape token for LINK)
   - Replace `%%VIDEO:` → `⟦TESC002⟧` (escape token for VIDEO)
   - Store in token map: { seq, escaped: "%%LINK:" or "%%VIDEO:" }
   - Must happen BEFORE %LINK/%VIDEO tokenization (stage 5) to avoid double-processing

2. DETECT CONTENT TYPE
   - Detect if string contains HTML (via tag patterns) or Markdown (via syntax patterns)
   - Set mode flag: { html: boolean, markdown: boolean }
   - If HTML: subsequent tokenization operates on text nodes only (via parse)
   - If Markdown: subsequent tokenization operates on text content only (via AST)

3. PARSE STRUCTURED CONTENT (if detected)
   - HTML: Parse into DOM, identify text nodes vs tags/attributes
   - Markdown: Parse into AST, identify text vs code/links/etc.
   - Tokenization in subsequent steps ONLY applies to text portions

4. GLOSSARY TOKENIZATION (TG)
   - Apply glossary term matching (see I18N-PIPE-02c)
   - Replace matched terms with `⟦TG<seq>⟧`
   - Store in token map: { seq, term, translations }
   - ORDER MATTERS: Glossary before other tokens to protect brand names

5. %LINK PATTERN TOKENIZATION (TL) — Brikette-specific
   - Regex: `%LINK:([^|]+)\|([^%]+)%`
   - Replace with `⟦TL<seq>⟧`
   - Store in token map: { seq, key, labelText }
   - **Literal `%` in content:** If content contains a literal `%` that is NOT part of a `%LINK:` or `%VIDEO:` pattern, it should pass through untouched. The regex is specific enough (`%LINK:` prefix) that false positives are unlikely. If a user needs to write literal `%LINK:` text that should NOT be tokenized, escape as `%%LINK:` (double percent). Unescape `%%` → `%` after restoration.

5b. %VIDEO PATTERN TOKENIZATION (TV) — Brikette-specific (optional inline video)
   - Regex: `%VIDEO:(youtube|vimeo):([^|]+)\|([^%]+)%`
   - Replace with `⟦TV<seq>⟧`
   - Store in token map: { seq, provider, videoId, titleText }
   - On restore: translate titleText separately (same as %LINK label), reconstruct pattern
   - **Escape handling:** Same as TL — `%%VIDEO:` escapes to literal `%VIDEO:`

6. I18NEXT INTERPOLATION TOKENIZATION (TI)
   - Patterns (i18next variants — all must be captured):
     - `{{name}}` — standard interpolation
     - `{{ name }}` — with internal whitespace
     - `{{- name}}` — unescaped interpolation (dash prefix)
     - `{{name, format}}` — with formatting options
   - **Regex:** `\{\{-?\s*[\w,.\s]+\s*\}\}` (captures raw token including whitespace/dash)
   - Replace with `⟦TI<seq>⟧`
   - Store in token map: `{ seq, raw: "{{ name }}" }` — store the EXACT original form for perfect restoration
   - ORDER MATTERS: `{{...}}` must be detected before `{...}` (longer match first) to avoid brace collisions
   - **Restoration:** use `raw` field verbatim — never normalize whitespace or strip dash
   - **i18next config verification (REQUIRED before first run):**
     - Verify Brikette's i18next config (`apps/brikette/src/i18n.ts` or `i18n.config.ts`) uses default interpolation settings:
       - `interpolation.prefix` should be `{{` (default)
       - `interpolation.suffix` should be `}}` (default)
       - If custom delimiters are configured, update the TI regex to match
     - Add integration test: extract known interpolations from sample namespace, verify all captured correctly

7. PLACEHOLDER TOKENIZATION (TP)
   - Patterns: `{name}`, `{0}`, `%s`, etc. (non-i18next placeholders)
   - Replace with `⟦TP<seq>⟧`
   - Store in token map: { seq, raw: "{name}", kind: "brace" | "positional" | "printf" }
   - **Restoration rule:** restore the exact original placeholder syntax from `raw` (do not normalize `{name}` ↔ `{{name}}`)

8. EMAIL TOKENIZATION (TE)
   - Regex for email patterns
   - Replace with `⟦TE<seq>⟧`
   - Store in token map: { seq, email }

9. URL TOKENIZATION (TU)
   - Regex for http(s):// and common URL patterns
   - Replace with `⟦TU<seq>⟧`
   - Store in token map: { seq, url }

10. HTML TAG TOKENIZATION (TH) — only if not using provider tag mode
   - Only if HTML detected AND not using provider's native tag handling
   - Replace tags with `⟦TH<seq>⟧`
   - Store in token map: { seq, tag }

11. COMPUTE TOKENIZED HASH
    - Hash the fully tokenized string (for TM lookup)
    - Include glossary_version in hash key

12. TM LOOKUP
    - Check TM for cached translation of tokenized hash
    - If hit: skip to step 16 (restore)
    - If miss: proceed to translation

13. TRANSLATE
    - Send tokenized string to LLM/provider
    - Include script instructions if zh-Hans/zh-Hant/etc.

14. VALIDATE TOKEN PRESERVATION
    - Check that output contains same multiset of tokens as input
    - Order may differ (languages reorder); count must match
    - If validation fails: mark as `failed`, do not apply

15. VALIDATE STRUCTURE (if HTML/Markdown)
    - Parse output as HTML/Markdown
    - Verify structure is valid (no broken tags, etc.)
    - If validation fails: mark as `failed`, do not apply

16. RESTORE TOKENS (reverse order of tokenization)
    - TH → TU → TE → TP → TI → TV → TL → TG (reverse order)
    - For TV: also translate titleText (separate TM lookup/translate cycle), reconstruct `%VIDEO:provider:videoId|translatedTitle%`
    - For TL: also translate label text (separate TM lookup/translate cycle), reconstruct `%LINK:key|translatedLabel%`
    - For TG: use translated term if available, else original

17. RESTORE SHORTCODE ESCAPE TOKENS (TESC)
    - `⟦TESC001⟧` → `%LINK:` (the user wanted literal `%LINK:`, not a tokenized link)
    - `⟦TESC002⟧` → `%VIDEO:` (the user wanted literal `%VIDEO:`)
    - Note: restores to single `%`, not `%%` — the `%%` was the escape sequence in source

18. UNESCAPE
    - Convert `⟦⟦T...⟧⟧` back to `⟦T...⟧`

19. APPLY
    - Write translated string to content
    - Update TM with new translation
    - Store staleness metadata
```

**Why this order matters:**
- Glossary (TG) first: Brand names protected before other patterns might match
- Links (TL) before placeholders (TP): `%LINK:foo|{bar}%` would break if TP ran first
- Emails (TE) before URLs (TU): Some URLs contain email-like patterns
- Restore in reverse: Ensures nested patterns reconstruct correctly

### Recommended Approach: Tiered Translation
1. **Translation Memory first** — lookup cached translations before any API call
2. **Bulk content** — use cheapest viable option (LibreTranslate/Argos or Haiku)
3. **High-value content** (product descriptions, SEO) — option to use DeepL/Google for quality

### Cost Reduction Techniques
- **Translation Memory (TM)**: Hash-based deduplication; re-running on unchanged content = $0
- **Provider-native batch arrays**: Use array/batch APIs where available (Google: 128 texts, DeepL: 50 texts). Preferred over delimiter concatenation.
- **Async batch APIs**: AWS Translate batch mode is ~40% cheaper than synchronous
- **Incremental runs**: Only translate strings added/changed since last run

### Batching Strategy

**When provider supports array/batch API:**
- Use native array API with provider-specific limits — **TBD per provider in I18N-PIPE-02**
- Request sizing limits — **TBD per provider verification** (placeholder: ~100 strings or ~50k chars)
- Partial batch failure: mark failed strings individually; successful strings in same batch are applied

**When provider lacks array API (e.g., DeepL Free):**
- Sequential calls with rate limiting — **TBD per provider** (placeholder: ~5 req/sec)
- Respect `Retry-After` and `X-RateLimit-*` headers if present
- Backoff strategy — **TBD per provider** (placeholder: exponential 1s→60s, max 5 retries)
- On quota exhaustion mid-run: save progress, mark job as `paused`, surface in CMS for manual resume

**Note on delimiter concatenation:** Previously considered concatenating strings with delimiters to reduce API calls. This is **not recommended** because:
- Most providers charge per-character, not per-request, so no cost savings
- Risk of breaking placeholder/HTML/URL preservation
- Segmentation errors if delimiter appears in content
- Provider-native array APIs are safer and equally efficient

## Proposed Pipeline Shape

### Trigger Model (DECIDED: Publish gate = validator only; translation is operator-triggered)

**Key clarification:** The MCP + Claude Code architecture means translation requires an active operator session. The publish gate does **not** auto-translate headlessly.

| Trigger | How it works | When to use |
|---------|--------------|-------------|
| **Manual run (MCP)** | Operator triggers via Claude Code: `"translate shop X to de, it"` | Bulk translation before publishing; adding new locales |
| **Publish gate** | **Validator only** — checks if required locales are filled; blocks if missing | Every publish attempt |

**Why not auto-translate on publish?**
- MCP architecture requires an operator session — no headless background translation
- Auto-translation would need API keys + secrets + background jobs (complexity we chose to avoid)
- Operator-triggered translation gives visibility into what's being translated and cost

**Workflow for publishing with required locales:**

```
1. Author creates/edits content in primaryContentLocale (e.g., "en")
2. Author clicks "Publish"
3. Publish gate checks: are all requiredContentLanguages filled?
   ├─ YES → Publish succeeds
   └─ NO → Publish blocked with message:
           "Missing translations for: de, it.
            Options:
            - Run translation via Claude Code: 'translate shop X to de, it'
            - Add manual translations in CMS
            - Mark entity as 'Do not machine translate' and fill manually"
4. Author triggers translation (MCP session) or fills manually
5. Author clicks "Publish" again → succeeds
```

**What if operator wants one-click publish + translate?**
- They can use Claude Code: `"translate and publish draft content for shop X"`
- MCP tool runs translation, then (if successful) triggers publish via CMS API
- This is still operator-initiated, just combined into one command

- **Trigger A (manual)**: explicit action in CMS ("Translate missing locales") or Claude Code command against draft content.
- **Trigger B (publish gate)**: **validator only** — checks if required locales are filled; does NOT auto-translate (requires MCP session).
  - If required locales are missing, publish is blocked with actionable guidance.
  - If the operator chooses **"Do not machine translate"**, publish is blocked until required locales are filled manually.
- **Required locale semantics (publish gate)**:
  - Shop settings define **two lists** (part of initial I18N-PIPE-00 schema, not a future extension):
    - `contentLanguages: ContentLocale[]` — all enabled content locales (available for editing, routing, translation).
    - `requiredContentLanguages: ContentLocale[]` — subset that **must** be filled before publish (defaults to `[primaryContentLocale]` if not set).
  - Publish gate enforces: all `requiredContentLanguages` must have content (via machine translation or manual entry).
  - Non-required locales in `contentLanguages` can remain empty at publish time (translated later, or never).
  - This prevents "select all Brikette locales" from blocking every publish.
  - "Do not machine translate" does **not** remove the requirement; it only changes the method (manual-only).
- **"Do not machine translate" data model**:
  - **Storage location:** Entity-level metadata field `machineTranslation: { enabled: boolean, excludedLocales?: ContentLocale[] }`.
    - `enabled: false` → entire entity is manual-only for all locales.
    - `excludedLocales: ["de", "fr"]` → those locales are manual-only; others use machine translation.
  - **Default:** `{ enabled: true }` (machine translation allowed).
  - **Granularity:** Entity-level only (not per-field). Rationale: per-field adds schema complexity; operators can split sensitive content into separate entities if needed.
  - **Where it lives:**
    - Products: `product.machineTranslation`
    - CMS pages/sections: `page.machineTranslation`, `section.machineTranslation`
    - Navigation/SEO: `settings.navigation.machineTranslation`, `settings.seo.machineTranslation`
  - **Walker behavior:**
    - On extraction: check `machineTranslation.enabled` and `excludedLocales` for each entity.
    - If machine translation disabled for a target locale, skip that entity/locale pair.
    - If publish gate requires that locale, block publish with message: "Manual translation required for [locale]".
  - **CMS UI:**
    - Toggle per entity: "Allow machine translation" (default on).
    - Optional: locale-specific exclusions in advanced settings.
    - Publish dialog shows which locales require manual translation and their completion status.
- **Draft check**: walker verifies each entity is in a translatable pre-publish state (see "Draft Content Definition"). Settings-like entities (navigation/SEO) must use the settings draft model.
- **TM Lookup**: check translation memory for cached translations; only send cache misses to provider.
- **Extraction**: walk CMS/shop JSON data to collect inline values lacking target locale entries.
- **Format detection**: identify strings containing placeholders (`{name}`, `{{name}}`, `{0}`), URLs, HTML tags, or Markdown; tag for preservation validation.
- **Batching**: use provider-native array APIs (not delimiter concatenation) to batch requests efficiently.
- **Translation**: batch requests to configured provider with throttling; support provider switching per content tier.
- **Format validation**: verify placeholders/URLs/HTML/Markdown round-trip unchanged; reject and flag translations that fail.
- **TM Write**: store new translations in translation memory for future deduplication.
- **Apply**: write back translations only where the target locale is missing or empty; **never overwrite manual/reviewed translations**. Stale machine translations (source changed, `reviewed: false`) may be overwritten on explicit operator request.
- **Audit**: store per-run metadata (source locale, target locale, provider, timestamps, content hashes, cost estimate) for traceability.
- **Locale set**: derive target locales from shop settings and per-app language configs; requires locale type expansion blocker to be resolved first.

## Active Tasks

### Task Dependency Graph

```
Phase 1 (Foundations - no dependencies):
  I18N-PIPE-00   Locale model + schema migration (BLOCKER)
  I18N-PIPE-00b  Content filtering and tokenization
  I18N-PIPE-01   Audit translatable content surfaces

Phase 2 (depends on Phase 1):
  I18N-PIPE-00c  Legacy format migration (depends: 00)
  I18N-PIPE-02   MCP translation server (depends: 01) — @acme/i18n-mcp-server
  I18N-PIPE-02c  Glossary support (depends: 00b) — MOVED UP: must be before TM
  I18N-PIPE-03b  Nav/SEO draft model (depends: 00, 01)

Phase 3 (depends on Phase 2):
  I18N-PIPE-02b  Translation Memory (depends: 00, 00b, 02c) — glossary affects TM hash
  I18N-PIPE-03   Job model (depends: 01)

Phase 4 (Core pipeline — integrates into MCP server):
  I18N-PIPE-04   Extraction + apply pipeline (depends: 00, 00b, 02, 02b, 02c, 03, 03b)
  I18N-PIPE-03c  Rollback/undo bundles (depends: 03, 04)
  I18N-PIPE-07   Brikette i18n namespaces translation (depends: 02, 02b, 02c, 03, 00b)

Phase 5 (UI + Testing):
  I18N-PIPE-05   CMS UI + API endpoints (depends: 03, 04)
  I18N-PIPE-06   Validation and test coverage (depends: 04)

Phase 6 (Content Authoring — Workstream B):
  I18N-PIPE-08   Brikette content authoring (depends: 05, 07)
```

**Glossary → TM sequencing rationale:** Glossary terms are tokenized BEFORE computing `source_hash` for TM lookup. This means:
- Glossary schema/storage must exist before TM is implemented
- TM lookup key includes `glossary_version` hash
- Changing the glossary invalidates relevant TM entries (by design)

**Note on I18N-PIPE-03a (Async job infrastructure):** With the MCP + Claude Code architecture, async infrastructure is handled by the session itself (multi-turn conversations, checkpointing). The MCP server stores job state for resumability, but doesn't need external job queues. Task merged into I18N-PIPE-02/03.

### Task Details

- [ ] **I18N-PIPE-00: Locale model + schema migration (BLOCKER)**
  - Scope:
    - Set `UiLocale` to **`"en" | "it"`** (no `de` for now) for UI string bundles in `packages/i18n/src/*.json`.
    - Define `ContentLocale` type (BCP47-ish string) separate from `UiLocale` and include:
      - Brikette base locales
      - Script variants for Chinese (`zh-Hans`, `zh-Hant`) — stored as-is, not base `zh`
    - Update `TranslatableText.value` typing to use `Partial<Record<ContentLocale, string>>`.
    - **New shop settings schema (all fields required in schema, with sensible defaults):**
      ```typescript
      {
        uiLanguages: UiLocale[];              // e.g., ["en", "it"]
        contentLanguages: ContentLocale[];    // e.g., ["en", "it", "de", "fr"]
        requiredContentLanguages: ContentLocale[]; // subset of contentLanguages; must be filled before publish
        primaryContentLocale: ContentLocale;  // source language for authoring; defaults to "en"
        hreflangMap?: Record<ContentLocale, string>; // optional; maps storage keys to SEO region tags
      }
      ```
      - Default new shops to: `contentLanguages = ["en", "it"]`, `requiredContentLanguages = ["en", "it"]`, `primaryContentLocale = "en"`.
        - **Rationale:** If Italian is enabled by default, it should be required for publish — otherwise operators see Italian in the language switcher but get empty/fallback content. Enabling without requiring creates a poor UX.
      - Provide a one-click "Select all Brikette-compatible locales" option (see locale expansion policy below).
      - Validation rules:
        - `requiredContentLanguages ⊆ contentLanguages`
        - `primaryContentLocale ∈ contentLanguages`
        - `primaryContentLocale ∈ requiredContentLanguages` — **the source language must always be required**, otherwise publish could succeed without the authored content being present
    - Update JSON schema validation for settings and content.
    - **UI locale fallback rule:** When a content locale has no UI bundle, UI chrome uses `uiLanguages[0]` (typically `"en"`). This is deterministic and documented.
    - Update `resolveText` fallback logic:
      - Fallback chain: exact match → base language → `primaryContentLocale` → `en`.
      - Handle content locales without UI bundles gracefully.
    - **Implement `normalizeLocale(input): ContentLocale` function:**
      - Used everywhere: routing, storage, settings validation, TM keys.
      - Applies BCP47 casing rules (lowercase language, TitleCase script, uppercase region).
      - Resolves known aliases (`no` → `nb`).
    - **Locale traits:** Ensure apps set `lang`, `dir` (RTL for `ar`, `he`), and formatting locale based on content locale, not UI locale.
    - Document locale model in `docs/architecture.md` or dedicated i18n doc.
    - Norwegian migration:
      - Treat legacy `no` as an alias of Norwegian Bokmål during reads (`no` → `nb`), then migrate stored content keys to `nb`.
      - Add validation to reject new writes of `no` once migration is complete.
  - Dependencies: none
  - Definition of done:
    - `UiLocale` is limited to `en/it` and UI chrome uses `uiLanguages[0]` as fallback for non-UI locales.
    - `ContentLocale` includes all Brikette-supported locales (Chinese stored as `zh-Hans`/`zh-Hant`).
    - `primaryContentLocale`, `requiredContentLanguages`, and `hreflangMap` are in the settings schema.
    - `normalizeLocale` function exists and is used consistently.
    - RTL locales correctly set `dir="rtl"` even when UI strings fall back to English.
    - Pipeline can write translations for any `ContentLocale` without type errors.
    - CMS gracefully handles content in locales without full UI translation.
    - Existing `en/de/it` content continues to work (backward compatible).

- [ ] **I18N-PIPE-00b: Content filtering and tokenization**
  - Scope:
    - **Tokenization layer** (primary strategy to avoid false positives):
      - Detect and mask preservable content before translation: emails, phone numbers, URLs, placeholders (`{name}`, `{{name}}`, `{0}`, etc.)
      - **Token format**: `⟦T<type><seq>⟧` (Unicode brackets U+27E6/U+27E7, type letter, digits)
        - Examples: `⟦TU001⟧` (URL), `⟦TE002⟧` (email), `⟦TI003⟧` (i18next `{{var}}` interpolation), `⟦TP004⟧` (generic placeholder), `⟦TH001⟧` (HTML tag), `⟦TL001⟧` (link key, see below)
        - Collision avoidance: escape existing `⟦T...⟧` patterns as `⟦⟦T...⟧⟧`
      - After translation, restore original values from token map
      - If tokens are mangled/missing in output, mark string as `failed` (not blocked)
    - **Brikette guide link pattern (UC-3)**:
      - Pattern: `%LINK:guideKey|visible label%` (e.g., `%LINK:fornilloBeachGuide|cool down at Fornillo Beach%`)
      - **Algorithm (single-pass with label translation):**
        1. **Extract:** Regex `%LINK:([^|]+)\|([^%]+)%` finds all link patterns in string.
        2. **Replace:** Each match → `⟦TL<seq>⟧`. Store in token map: `{ seq, key: "guideKey", labelText: "visible label" }`.
        3. **Translate:** Send tokenized string to provider (e.g., `"Check out ⟦TL001⟧ for details"`).
        4. **Restore:** For each `⟦TL<seq>⟧` in output:
           - Look up `{ key, labelText }` from token map.
           - **Translate the label separately:** Make a second provider call (or batch) with just the `labelText` values.
           - Reconstruct as `%LINK:key|translatedLabel%`.
        5. **TM behavior:** The outer string (with `⟦TL...⟧` tokens) gets one TM entry. Each unique label gets its own TM entry (keyed by label text hash). This maximizes reuse — same label in different strings shares TM.
      - **Provider call count:** 1 call for the outer string + 1 batched call for all unique labels in the job. Labels are deduped across the entire job, so "cool down at Fornillo Beach" appearing 5 times = 1 translation.
      - **Edge case — label embedded in sentence:** If the pattern appears mid-sentence (`"Try %LINK:foo|the beach% today"`), the outer translation preserves sentence flow while label is translated independently. Works because token position is preserved.
      - **Known quality limitation — label-isolated translation:** Translating link labels independently (without sentence context) can produce incorrect grammatical case, gender, or inflection in some languages. Examples:
        - German: "Gehen Sie zu [der Strand]" vs "[dem Strand]" (dative case required after "zu")
        - Russian: Noun case depends on surrounding preposition
        - Arabic: Definite article agreement
        This is an accepted tradeoff: the alternative (full sentence re-translation per link) has worse TM efficiency and higher cost. **Mitigation:** For high-quality locales, human review of link labels is recommended. CMS can flag strings containing `%LINK` for review.
      - **Validation:** After restore, verify all `%LINK:...|...%` patterns are well-formed (no unterminated patterns, no missing labels).
    - **HTML handling:**
      - **Preferred:** Use provider tag-handling mode if supported (e.g., DeepL `tag_handling=html`, Google `mimeType=text/html`).
      - **Fallback:** Parse HTML, tokenize tags/attributes, translate text nodes only, reconstruct.
      - Do NOT rely on regex "unchanged" validation for HTML — parse-based validation required.
    - **Markdown handling:**
      - Parse using CommonMark parser.
      - Protect: code spans/blocks, link URLs, image URLs.
      - Translate: visible text content, alt text.
      - Reconstruct after translation; validate structure matches.
    - **PII scanner** (secondary safety net for content that should never exist):
      - Regex patterns for SSN-like formats, credit card numbers, etc.
      - On detection: block string, flag as `blocked_pii`
    - Add string length validation (default 10k char limit, configurable).
    - Integrate filtering into extraction phase (before any external API call).
    - Surface blocked/failed strings in job results with reason codes and field paths (not raw text).
    - CMS UI reads raw source text via field path lookup for display.
  - Dependencies: none
  - Definition of done:
    - Emails, URLs, and placeholders in marketing copy are tokenized and round-trip correctly.
    - HTML content is handled via provider tag mode or parse-based translation (not regex).
    - Markdown code blocks and link URLs are preserved; visible text is translated.
    - Strings containing true PII (SSN, credit card) are blocked from external providers.
    - Blocked/failed strings are visible in CMS with actionable next steps.
    - False positive blocking rate <1% for typical marketing content (tokenization handles emails/phones).

- [ ] I18N-PIPE-02c: Glossary / term overrides
  - Scope:
    - Support per-shop (or shop-group) term lists to keep brand/place names stable (for example property names, neighborhood names).
    - **Glossary storage schema:**
      ```typescript
      // Location: data/shops/{shopId}/glossary.json (or settings.translation.glossary)
      {
        version: string,          // SHA-256 hash of terms array (for TM invalidation)
        updatedAt: ISO timestamp,
        terms: Array<{
          source: string,         // Term in source language (case-sensitive match)
          translations?: Record<ContentLocale, string>, // Optional: locale-specific translations
          // If translations provided: term is replaced with translated version
          // If no translations: term is protected (not translated, kept as-is)
          caseSensitive: boolean, // Default: true
          matchWholeWord: boolean // Default: true (prevents "Positano" matching "Positanos")
        }>
      }
      ```
    - **Example glossary:**
      ```json
      {
        "version": "abc123...",
        "updatedAt": "2026-01-20T12:00:00Z",
        "terms": [
          { "source": "Hostel Brikette", "caseSensitive": true, "matchWholeWord": true },
          { "source": "Positano", "caseSensitive": true, "matchWholeWord": true },
          { "source": "Path of the Gods", "translations": { "it": "Sentiero degli Dei", "de": "Götterweg" }, "caseSensitive": false, "matchWholeWord": true }
        ]
      }
      ```
    - **Implementation: Tokenization-based** (recommended over provider-native glossary for portability):
      - Glossary terms are tokenized as `⟦TG<seq>⟧` before sending to provider.
      - On restore:
        - If term has target locale in `translations`: use that translation.
        - Otherwise: restore original source term (protected from translation).
      - This approach works with any provider, unlike provider-native glossaries.
    - **Glossary matching constraints (IMPORTANT for CJK languages):**
      - `matchWholeWord: true` relies on whitespace word boundaries — **this fails for Chinese, Japanese, Korean, and Thai** which have no whitespace between words.
      - **Current scope:** Glossary matching is designed for **proper nouns in Latin/Cyrillic scripts** (brand names, place names). This covers the primary use case (Brikette, Positano, etc.).
      - **CJK limitation (documented, not solved):**
        - For CJK source text, `matchWholeWord: true` is effectively ignored (no whitespace boundaries).
        - For CJK terms in English source text, whole-word matching works normally.
        - Example: Matching "東京" (Tokyo) in Japanese source text will match substrings; matching "Tokyo" in English source text works correctly.
      - **If CJK whole-word matching becomes needed later:**
        - Requires segmentation library (e.g., `Intl.Segmenter` for JS, or external like kuromoji for Japanese).
        - Out of scope for initial implementation; add as enhancement if real need arises.
      - **Unicode normalization policy:** All glossary matching uses **NFC normalization** before comparison.
        - `caseSensitive: false` uses Unicode case-folding, not ASCII lowercase.
        - Accented characters match correctly: "café" matches "Café" when case-insensitive.
      - **Limits to prevent pathological tokenization:**
        - Maximum terms per glossary: 500 (configurable via `MAX_GLOSSARY_TERMS`).
        - Maximum total tokenized characters: 10% of source text length (prevents glossary that tokenizes everything).
        - Terms longer than 200 characters are rejected (likely input error).
    - **Provider-native glossary** (optional enhancement):
      - If using DeepL Pro or Google Cloud, can additionally register glossary via provider API.
      - Tokenization still runs as fallback; provider glossary is a quality boost, not a requirement.
    - Ensure glossary/term protection is applied consistently across publish gate and manual runs.
    - **Glossary + TM interaction (CRITICAL):**
      - Glossary terms must be tokenized **before** computing `source_hash` for TM lookup.
      - This ensures TM entries are glossary-aware: changing the glossary invalidates relevant TM entries.
      - Include `glossary_version` (glossary content hash) in TM lookup key to prevent stale translations when glossary changes.
      - Example: "Visit Hostel Brikette" → tokenized as "Visit ⟦TG001⟧" → hashed → TM lookup.
    - **CMS UI:**
      - Glossary editor in shop settings: add/edit/remove terms.
      - Bulk import from CSV/JSON.
      - Warning when changing glossary: "This will invalidate cached translations for affected terms."
  - Dependencies: I18N-PIPE-00b (tokenization infrastructure)
  - **Note:** This task must complete BEFORE I18N-PIPE-02b (TM), because glossary tokenization affects `source_hash` computation.
  - Definition of done:
    - Glossary schema is defined and stored per-shop.
    - Glossary terms are tokenized before translation and correctly restored/translated.
    - `glossary_version` hash is computed and available for TM to include in lookup key.
    - CMS provides UI to manage glossary terms.

- [ ] I18N-PIPE-00c: Legacy format migration (Record<Locale, string> → TranslatableText)
  - Scope:
    - **Problem (UC-4):** Products and page-level SEO fields currently use `Record<Locale, string>` format, not `TranslatableText`. The translation walker needs a uniform format.
    - **Scope boundary (important):**
      - This task covers: **Products** and **Page-level SEO** (fields stored in `pages.json`).
      - This task does NOT cover: **Navigation** or **Settings-level SEO** — those are addressed in I18N-PIPE-03b because they also need draft/publish model introduction.
    - **Migration script** to convert legacy formats:
      - Products: `title: { en: "...", de: "", it: "" }` → `title: { type: "inline", value: { en: "..." } }`
      - Page-level SEO: same transformation
      - Strip empty string values (`""`) during migration — they indicate "not yet translated"
      - Preserve non-empty values exactly
    - **Type updates:**
      - Update Product type in `@acme/types` to use `TranslatableText` for `title`, `description`
      - Update Page SEO type to use `TranslatableText`
    - **Rollback story:** migration script creates backup files; undo via restore
    - **Validation:** post-migration, all shops pass JSON schema validation
  - Dependencies: I18N-PIPE-00
  - Definition of done:
    - All `data/shops/*/products.json` files use TranslatableText format
    - All `data/shops/*/pages.json` SEO fields use TranslatableText format
    - Type definitions updated and compile
    - Backup files created for rollback
    - CI passes with new format
    - (Navigation and settings-level SEO are NOT in scope — see I18N-PIPE-03b)

- [ ] I18N-PIPE-01: Audit translatable content surfaces and storage paths
  - Scope:
    - Enumerate all `TranslatableText` usage in CMS/page-builder, product fields, navigation, SEO, and settings.
    - Map the JSON files in the data root that carry inline content.
    - Document how each app defines its supported locales (for example Brikette's `i18n.config.ts`) and how shop settings intersect.
    - **Include Brikette locale files** (47 namespaces + 129 guide content files) in inventory
    - **Document field path patterns** for walker to extract strings from nested structures (arrays of objects, FAQ arrays, etc.)
  - Dependencies: none
  - Definition of done:
    - Inventory list with file paths and field examples documented in this plan.
    - Brikette namespace and guide content patterns documented.
    - Field path extraction rules documented for nested JSON structures.

- [ ] I18N-PIPE-02: Estimate volume and implement MCP translation server
  - Scope:
    - Count total translatable strings and characters across all shops/locales (use I18N-PIPE-01 inventory).
    - **Provider decision (MADE):** Use LLM-based translation via Claude/OpenAI subscription plans, executed within Claude Code sessions.
    - **Implement `@acme/i18n-mcp-server`** (new package):
      - MCP server exposing translation tools for Claude Code / Codex sessions
      - Tools:
        - `translate-content(shopId, targetLocales, options)`: Main translation workflow
        - `translate-i18n-namespaces(appId, targetLocales, options)`: i18next JSON workflow (Workstream B; Brikette)
        - `translation-status(jobId)`: Check progress of in-flight translation
        - `translation-resume(jobId)`: Resume from last checkpoint (both workstreams)
        - `translation-undo(jobId)`: Revert a translation run (Workstream A only; Workstream B uses git revert/PR rollback)
        - `translation-preview(shopId, targetLocales)`: Dry-run showing what would be translated + cost estimate
        - `author-brikette-content(contentType, prompt, options)`: LLM-assisted content authoring from prompts or URLs (I18N-PIPE-08)
        - `publish-brikette-draft(draftId, options)`: **Operator-run** export + translate + PR creation (I18N-PIPE-08) — NOT headless; requires active Claude Code session
      - Internal components:
        - Walker: extracts translatable strings from draft content
        - TM client: checks/updates translation memory
        - Tokenizer: masks URLs, emails, placeholders, glossary terms
        - Validator: ensures tokens round-trip correctly
        - Applier: writes translations back to content files
      - **Translation flow within MCP tool:**
        1. Walker extracts strings → returns list of `{ fieldPath, sourceText, tokenizedText }`
        2. TM lookup → splits into cache hits (instant) and cache misses
        3. For cache misses: return prompt to Claude Code session for translation
        4. Claude translates (uses subscription allowance, not API)
        5. Validator checks token preservation
        6. Applier writes to files + updates TM + creates undo bundle
      - **Batching strategy:**
        - Group strings into batches of ~50 (fits comfortably in context)
        - Return batch prompt to session; session translates; tool processes results
        - For large runs: checkpoint after each batch; resumable if session ends
    - Document MCP tool contract (parameters, return values, error codes).
    - **Provider locale-code mapping:**
      - Define `providerLocaleMap: ContentLocale → ProviderLocaleCode` for each selected provider.
      - Providers accept different formats (BCP47, ISO 639-1, custom codes); document the mapping.
      - Example: `zh-Hans` may need to be sent as `zh-CN` or `zh` depending on provider.
      - **Unsupported locale behavior (DECIDED: Option B — fallback with warning, EXCEPT scripts):**
        - **General rule:** If a `ContentLocale` isn't directly supported, fall back to base language code with warning logged.
        - **EXCEPTION for script variants (zh-Hans, zh-Hant, sr-Latn, sr-Cyrl):**
          - Script locales are **non-fallbackable** — `zh-Hans` MUST NOT fall back to bare `zh`.
          - Chinese scripts are mutually unintelligible; "fallback to zh" can silently produce the wrong script.
          - **Required behavior for script locales:**
            - `zh-Hans` → send as `zh-CN` or include explicit prompt instruction: "Use Simplified Chinese (Hans)"
            - `zh-Hant` → send as `zh-TW` or include explicit prompt instruction: "Use Traditional Chinese (Hant)"
            - `sr-Latn` → explicit prompt instruction: "Use Serbian in Latin script"
            - `sr-Cyrl` → explicit prompt instruction: "Use Serbian in Cyrillic script"
          - If provider cannot guarantee correct script output, **fail the translation** (do not silently produce wrong script).
        - **For LLM prompts specifically:** Always include explicit script instruction regardless of provider locale code mapping:
          ```
          Translate to {targetLocale}. {scriptInstruction}
          ```
          Where `scriptInstruction` is:
          - `zh-Hans`: "Use Simplified Chinese characters (简体中文)."
          - `zh-Hant`: "Use Traditional Chinese characters (繁體中文)."
          - Other scripts: similar explicit instruction.
        - Rationale: LLMs handle most language variants well, but script variants require explicit instruction to avoid wrong output.
      - Document idempotency strategy for retries (request IDs / idempotency keys) to avoid double-billing.
    - **Batching strategy per provider:**
      - Document array API support (yes/no), max batch size, max chars per request.
      - Define fallback for providers without array API (sequential with rate limiting).
      - Document rate limit headers to respect (`Retry-After`, `X-RateLimit-*`).
      - Define backoff strategy: exponential starting at 1s, max 60s, max 5 retries.
      - Define quota exhaustion handling: pause job, save progress, surface for manual resume.
  - Dependencies: I18N-PIPE-01
  - Definition of done:
    - Volume estimate documented (string count, character count, locale matrix).
    - Provider decision with pricing breakdown and cost projection per run.
    - API integration contract documented.
    - Batching and rate limit strategy documented per selected provider(s).
    - Provider locale-code mapping documented with unsupported-locale behavior.

- [ ] I18N-PIPE-02b: Implement Translation Memory (TM) for deduplication
  - Scope:
    - **Scope decision: Global TM with default shop-group isolation** — `context_key` defaults to shop group ID to prevent cross-tenant phrasing leakage. Same text within a shop group reuses translations; different shop groups get independent translations.
    - **Multi-tenant consideration:** For single-tenant deployments, `context_key` can be set to a constant (e.g., `"default"`) to maximize cache hits.
    - **Workstream separation (intentional):**
      - Workstream A uses `context_key = shop_group_id`.
      - Workstream B uses `context_key = "app:brikette"`.
      - This avoids accidental reuse where “app UI copy” and “shop marketing copy” may require different tone/terminology.
      - Future enhancement (not required for v1): optional “global fallback lookup” when a context miss occurs, gated by an operator confirmation flag.
    - Design TM storage schema with context for safe reuse:
      ```
      {
        source_hash: string,        // SHA-256 of **tokenized** source text (see below)
        source_text_tokenized?: string, // optional: stored for debugging/editing; contains tokens, not raw PII
        source_locale: string,
        target_locale: string,
        provider: string,           // e.g., "deepl", "google", "haiku-3.5"
        provider_version: string,   // for model versioning (LLMs)
        context_key: string,        // default: shop group ID; required field
        translated_text_tokenized: string, // **CRITICAL**: stores tokenized translation (tokens still present)
        created_at: ISO timestamp,
        last_used_at: ISO timestamp, // for LRU eviction
        // Versioning fields for future-proofing:
        tokenization_version: string,   // e.g., "1.0" — bump when token format changes
        normalization_version: string,  // e.g., "1.0" — bump when locale normalization rules change
        hash_version: string,           // e.g., "sha256-v1" — bump if hashing algorithm changes
        glossary_version: string        // SHA-256 hash of glossary terms; ensures glossary changes trigger re-translation
      }
      ```
    - **Schema versioning:** If any versioning field doesn't match current system version, treat as cache miss (re-translate). This prevents silent corruption when tokenization/normalization rules evolve.
    - **TM stores tokenized translations (CRITICAL for correctness):**
      - `translated_text_tokenized` contains the translation **with tokens still present** (e.g., `"Kontaktieren Sie ⟦TE001⟧"`)
      - On cache hit, the caller restores tokens using the **current** token map (from current source text)
      - This ensures "Contact support@foo.com" and "Contact support@bar.com" share a TM entry without replaying the wrong email
      - Apply flow: tokenize source → TM lookup → take `translated_text_tokenized` → restore tokens from current map → validate → apply
    - **Hashing strategy**: `source_hash` is computed on **tokenized text** (after emails/URLs/placeholders are replaced with tokens), not raw text. This ensures:
      - "Contact support@foo.com" and "Contact support@bar.com" both hash to "Contact ⟦TE001⟧" → same TM entry
      - Maximizes cache hit rate for strings that differ only in tokenized content
    - **Storage location:** Start with JSON file in data root (`data/translation-memory.json`). Migrate to DB if file exceeds 10MB or 50k entries.
    - **Security note:** TM is **content-bearing storage** (unlike audit logs which store only metadata). Treat TM with same access controls as content files. The `source_text_tokenized` and `translated_text_tokenized` fields contain actual content (with PII masked as tokens).
    - **Concurrency & crash safety:**
      - Use file locking (e.g., `proper-lockfile` or OS-level flock) to prevent corruption under parallel jobs.
      - Write to temp file + atomic rename to ensure crash-safe updates.
      - Lock timeout: default 5s (configurable via env, for example `TRANSLATION_TM_LOCK_TIMEOUT_MS`).
      - **Lock failure behavior (differs by operation type):**
        - **TM read (lookup):** On lock timeout, treat as cache miss and proceed with translation. Log warning. Rationale: TM is an optimization; read contention shouldn't block publishing.
        - **TM write (after successful translation):** On lock timeout, **best-effort skip** — log warning, do not fail the job. The translation was successful; TM write is an optimization for future runs. Rationale: failing a publish because TM write is contended creates unnecessary operational outages.
        - **Translation/apply failure:** These are not TM-related and should still fail the job as before.
      - **Summary:** TM lock contention never blocks publish; only actual translation or apply failures do.
    - **Size limits & eviction:**
      - Soft limit: 50k entries (~10MB estimated)
      - Eviction: LRU based on `last_used_at`; prune entries unused for >6 months on each run
      - Manual clear command for full reset
    - Implement lookup before API calls; only translate cache misses.
    - Lookup key: `(source_hash, source_locale, target_locale, provider, provider_version, context_key, tokenization_version, normalization_version, hash_version, glossary_version)` — any version mismatch invalidates cache.
    - **Note:** `glossary_version` is the hash of the shop's glossary terms; ensures glossary changes trigger re-translation.
    - Update `last_used_at` on cache hits.
  - Dependencies: I18N-PIPE-00, I18N-PIPE-00b, I18N-PIPE-02c (glossary must be tokenized before TM hash)
  - Definition of done:
    - TM lookup integrated into pipeline.
    - Re-running translation on unchanged content with same provider results in zero incremental work (TM cache hit).
    - Switching providers correctly triggers re-translation (no stale cache).
    - LRU eviction keeps TM size bounded.
    - TM can be inspected/exported for debugging.
    - Concurrent jobs do not corrupt TM file (verified by test with parallel writes).

- [ ] I18N-PIPE-03: Define translation job model and persistence
  - Scope:
    - Define job payload that supports **both workstreams**:
      ```typescript
      interface TranslationJob {
        jobId: string;
        workstream: "A" | "B";
        // Workstream A (shop content):
        shopHandle?: string;
        targetContentLocales?: ContentLocale[];  // Workstream A only
        // Workstream B (i18n namespaces):
        appId?: string;
        paths?: string[];  // Glob patterns for partial runs
        targetFsLocales?: FsLocale[];            // Workstream B only
        // Common fields:
        sourceLocale: string;  // "en" for both workstreams (primary content locale)
        status: "pending" | "in_progress" | "completed" | "failed" | "partial" | "paused";
        pausedReason?: "rate_limit" | "quota_exhausted" | "operator_requested";  // If status=paused
        pausedAt?: string;          // ISO timestamp when paused
        resumableAfter?: string;    // ISO timestamp when safe to resume (e.g., rate limit reset)
        createdAt: string;
        completedAt?: string;
        summary?: {
          translated: number;      // Strings successfully translated
          skipped: number;         // Strings skipped (already filled, not stale)
          failed: number;          // Strings that failed validation/translation
          stale: number;           // Stale strings detected (source changed since last translation)
          protectedStale: number;  // Stale strings with doNotOverwrite=true (need human review)
        };
      }
      ```
    - Decide where jobs and results live (new JSON under data root, DB, or existing logs).
    - **Translation staleness metadata (per-field-per-locale):**
      - **Problem:** "Never overwrite existing translations" creates stale translations when source changes. Publish gate may pass (locales filled), but translations may be outdated.
      - **Solution:** Store metadata alongside translations to detect staleness and support "manually reviewed" flag.
      - **Schema:**
        ```typescript
        // Stored alongside TranslatableText, e.g., in entity metadata or a sibling field
        interface TranslationMetaFile {
          version: "1";  // Schema version for migration support
          entries: TranslationMeta;
        }

        interface TranslationMeta {
          [fieldPath: string]: {
            [locale in ContentLocale]?: {
              sourceHashAtTranslation: string;  // Hash of source text when translation was created
              translatedAt: string;             // ISO timestamp
              provider: string;                 // "claude-sonnet", "manual", "imported", etc.
              providerVersion?: string;         // Model version if LLM
              reviewed: boolean;                // True if human-reviewed; prevents auto-re-translation
              reviewedAt?: string;              // ISO timestamp of review
              reviewedBy?: string;              // User ID of reviewer (optional)
              doNotOverwrite?: boolean;         // If true, never auto-overwrite even if stale
            };
          };
        }
        ```
        - **Schema evolution:** If `version` is missing or doesn't match current (`"1"`), run migration before processing. Migrations are idempotent and upgrade in place.
      - **Staleness detection:**
        - On read: compare current source hash to `sourceHashAtTranslation`.
        - If different: translation is **stale** — source changed after translation.
        - CMS shows stale indicator; translation is still displayed but flagged.
      - **Re-translation workflow:**
        - **Auto re-translate (if `reviewed: false`):** Next translation run overwrites stale translation.
        - **Manual re-translate (if `reviewed: true`):** Stale translation is flagged but NOT auto-overwritten. Operator must:
          1. Mark as "needs re-translation" (clears `reviewed`), OR
          2. Manually update the translation in CMS, OR
          3. Accept the staleness (keep `reviewed: true`, ignore warning).
      - **hreflang and content coverage interaction:**
        - Stale translations are still "filled" for publish gate purposes — content exists, just outdated.
        - However, consider adding `staleLocales` to publish warning: "Translations for [de, it] may be outdated."
      - **Storage location:** `data/shops/{shopId}/translation-meta.json` (separate from content for cleaner diffs).
  - Dependencies: I18N-PIPE-01
  - Definition of done:
    - Job schema and storage location documented with sample JSON.
    - Translation staleness metadata schema defined and storage location specified.
    - Staleness detection algorithm documented.

- [ ] I18N-PIPE-03c: Rollback / undo bundles for applied translations
  - Scope:
    - Persist an "undo bundle" per translation run so bad machine output can be reverted:
      - Store a list of applied field paths and their previous values (before apply) plus new values (after apply).
      - Prefer a JSON Patch-like format for deterministic reversibility.
    - **Undo bundle storage and lifecycle:**
      - **Location (Workstream A):** `data/shops/{handle}/translation-undo/{jobId}.json` — shop-scoped for multi-tenant isolation.
      - **Location (Workstream B):** `data/translation-undo/brikette/{jobId}.json` — app-scoped.
      - **Content:** Contains raw before/after text values (this is content-bearing storage, like TM).
      - **Access controls:** Same as shop content files; not publicly accessible.
      - **Retention/TTL:** Keep for 90 days by default (configurable via `TRANSLATION_UNDO_RETENTION_DAYS`).
      - **Cleanup:** Background job or on-demand script prunes bundles older than TTL.
      - **Size limit:** Warn if bundle exceeds 1MB; consider compression for large runs.
    - Add a CMS action "Revert translation run" that restores previous values for the selected run.
    - Ensure undo bundles do not appear in audit logs; audit logs reference bundle by `jobId` only.
  - Dependencies: I18N-PIPE-03, I18N-PIPE-04
  - Definition of done:
    - Any applied run can be reverted without manual JSON editing.
    - Undo bundles are stored with defined location, retention policy, and access controls.
    - Bundles older than TTL are automatically pruned.

- [ ] I18N-PIPE-03b: Draft/publish model for navigation + SEO, with publish gate
  - Scope:
    - Introduce a draft/publish model for settings-like entities so they can be translated pre-live:
      - Navigation labels
      - Settings-level SEO fields
    - **Data shape migration (critical):**
      - **Current state:** Navigation labels are often plain strings; SEO fields may be `Record<Locale, string>` or plain strings.
      - **Target state:** Convert to `TranslatableText` inline values (`{ type: "inline", value: { en: "...", it: "..." } }`).
      - This aligns navigation/SEO with CMS content and enables the translation walker to process them uniformly.
      - **Migration steps:**
        1. Audit existing navigation/SEO field shapes in I18N-PIPE-01.
        2. Write migration script to convert plain strings to `TranslatableText` (using `primaryContentLocale` as the source locale key).
        3. Convert `Record<Locale, string>` fields to `TranslatableText.value` shape.
        4. Update TypeScript types and JSON schema.
    - **Draft/publish storage (DECIDED: Option A — co-located objects):**
      - Structure: `settings.navigation.draft` and `settings.navigation.published` objects within the same settings file.
      - Same pattern for SEO: `settings.seo.draft` and `settings.seo.published`.
      - **Atomic publish:** Copy `draft` → `published` in a single write operation.
      - **Rationale:** Co-location keeps related data together; no sync risk between files; simpler to reason about.
    - Define publish semantics (validator-only, NOT executor):
      - **Publish gate validates** that required locales are filled — does NOT execute translation.
      - CMS shows missing locales and the command to run: `translate shop {shopId} nav to it`
      - Operator runs translation in Claude Code session **before** clicking Publish.
      - If any required locale values are missing, publish is blocked.
      - "Do not machine translate" flag requires manual translation before publish.
    - Update CMS UI to expose:
      - Draft editing view
      - Translation status: which required locales are filled vs missing
      - Command display: shows exact Claude Code command to run for missing locales
      - Publish action that **validates** (not executes) the translation gate
      - Per-entity option: "Do not machine translate" (with optional per-locale exclusions)
  - Dependencies: I18N-PIPE-00, I18N-PIPE-01
  - Definition of done:
    - Navigation labels and SEO fields use `TranslatableText` shape (not plain strings or ad-hoc locale records).
    - Existing data is migrated without data loss.
    - Navigation + settings-level SEO can be edited as draft, translated, and published atomically.
    - Publish never promotes content with missing required locale values for `requiredContentLanguages`.

- [ ] I18N-PIPE-04: Implement extraction + apply pipeline for inline content
  - Scope:
    - Build a translation walker that finds inline values with missing locales.
    - **Pre-live enforcement**: walker only operates on draft/pre-publish states (see "Draft Content Definition").
      - For settings-like entities (navigation/SEO), use the draft/publish model from I18N-PIPE-03b (do not skip).
    - **Content filtering integration**: run tokenization + PII scan before any external API call (I18N-PIPE-00b).
    - Integrate TM lookup (I18N-PIPE-02b) before provider calls.
    - Use provider-native array/batch APIs (not delimiter concatenation).
    - Ensure non-destructive updates (do not overwrite existing locale values).
    - Add a dry-run mode for previewing changes and cost estimates.
    - Write new translations back to TM after successful API calls.
    - **Optimistic concurrency on apply (stale source detection):**
      - During extraction, store `source_hash` per field path in the job payload.
      - On apply, re-read current source text and recompute hash.
      - If hash differs (source changed between extraction and apply), skip that field and mark as `stale_source_changed`.
      - This prevents applying translations for outdated source text when editors make concurrent changes.
  - Dependencies: I18N-PIPE-00, I18N-PIPE-00b, I18N-PIPE-02, I18N-PIPE-02b, I18N-PIPE-03, I18N-PIPE-03b
  - Definition of done:
    - Translation pass can generate and apply localized values for a known shop dataset.
    - Walker correctly skips live/published content and only processes pre-live states.
    - Dry-run outputs: string count, estimated cost, cache hit rate.
    - TM is populated after successful runs.
    - Stale source detection prevents applying translations when source changed mid-job.

- [ ] I18N-PIPE-07: Brikette i18n namespaces translation (Workstream B)
  - Scope:
    - Implement translation for Brikette i18next namespace JSON under `apps/brikette/src/locales/*` (git/PR-based).
    - Add MCP tool `translate-i18n-namespaces(appId, targetLocales, options)`:
      - `appId`: initially `"brikette"` only (hardcoded paths acceptable for v1)
      - `sourceLocale`: default `"en"` (configurable)
      - `targetLocales`: list of **filesystem locale identifiers** (e.g., `["de", "it", "no", "zh"]`) — NOT canonical `ContentLocale` values. The tool maps these internally to canonical locales for TM/translation logic (see "Locale aliasing" below).
      - `paths`: optional glob(s) (namespaces/guide files) for partial runs
      - `mode`:
        - `"fill-missing"` (default): create missing keys and fill missing/empty values; never overwrite non-empty values
        - `"overwrite-empty-only"`: treat `""` as missing; never overwrite non-empty values
        - `"overwrite-stale"`: overwrite values whose stored source hash no longer matches the current English source (see staleness tracking below) — **respects `doNotOverwrite` flag**
        - `"overwrite-all"` (dangerous): overwrite all values in target locale (requires explicit confirmation flag) — **respects `doNotOverwrite` flag**
      - `forceOverwriteProtected`: boolean (default false) — if true, overwrite even values with `doNotOverwrite: true`; requires confirmation prompt
      - `dryRun`: report only (no file writes)
    - Extraction/apply rules:
      - Walk JSON and translate leaf string values (support nested objects/arrays; key paths preserved).
      - Never modify keys; preserve object/array shape and non-string primitives.
      - Preserve interpolation/tokens (examples): i18next `{{var}}` (tokenized as `⟦TI...⟧` and restored exactly), existing `⟦T...⟧` tokens, HTML/Markdown constructs, and Brikette `%LINK:key|label%`.
    - Locale aliasing and filesystem mapping (Workstream B specific):
      - Brikette’s i18n config and filesystem may use legacy/non-canonical locale tags as identifiers (directory names).
      - **Decision (v1): keep filesystem locales stable, map to canonical locales for TM/logic.**
        - Directory `apps/brikette/src/locales/no/**` is treated as canonical locale `nb` for translation logic/TM keys.
        - Directory `apps/brikette/src/locales/zh/**` is treated as canonical locale `zh-Hans` (Simplified) for translation logic/TM keys.
      - The MCP tool targets filesystem locales (`no`, `zh`) so it can read/write without forcing a repo-wide rename migration.
      - Future migration (optional): rename `no/` → `nb/` and `zh/` → `zh-Hans/` and update Brikette i18n config accordingly.
    - Staleness detection for i18next (prevents silent drift):
      - Problem: “never overwrite existing values” means translations can become stale when the English source changes.
      - **Solution:** maintain a sidecar meta index tracking the source hash used when each translation was last produced.
      - File: `apps/brikette/src/locales/.translation-meta.json` (git-tracked)
      - **Loader safety:** Brikette's i18next loader MUST ignore dotfiles. Verify `apps/brikette/src/i18n.ts` or equivalent uses a glob/loader that excludes `.*` files. If the loader uses `dot: true` or similar, store meta outside the locale load path (e.g., `apps/brikette/.translation-meta.json` at app root instead).
      - Schema (keyPath uses dot/bracket notation within the JSON file):
        ```json
        {
          "version": "1",
          "sourceLocale": "en",
          "entries": {
            "common.json:checkout.button": {
              "de": {
                "sourceHash": "sha256:...",
                "translatedAt": "2026-01-20T12:00:00Z",
                "reviewed": false,
                "doNotOverwrite": false
              },
              "it": {
                "sourceHash": "sha256:...",
                "translatedAt": "2026-01-20T12:00:00Z",
                "reviewed": true,
                "reviewedAt": "2026-01-21T10:00:00Z",
                "reviewedBy": "translator@example.com",
                "doNotOverwrite": true
              }
            }
          }
        }
        ```
      - **Protection flags (prevents clobbering manual translation fixes):**
        - `reviewed: boolean` — true if a human has reviewed and approved this translation
        - `reviewedAt`, `reviewedBy` — audit trail for reviews
        - `doNotOverwrite: boolean` — if true, this value is NEVER overwritten by machine translation (even in `overwrite-stale` or `overwrite-all` modes)
        - **Setting protection:** CMS UI or CLI command can mark entries as reviewed/protected after manual correction
        - **Respecting protection:** All translation modes (including `overwrite-all`) skip entries with `doNotOverwrite: true`. Only explicit `--force-overwrite-protected` flag can override (requires confirmation).
      - **Size and merge conflict mitigation:**
        - **Current estimate:** ~7,600 strings × ~18 locales = ~137k entries worst case. At ~150 bytes/entry = ~20MB. This is large but manageable for git.
        - **Merge conflict risk:** High when multiple translators work in parallel. Conflicts are **structural** (same key path, different locales) rather than semantic.
        - **Mitigation strategy (v1 — accepted tradeoff):** Single file with deterministic key ordering (sorted). Conflicts are resolvable with standard git merge (take both changes if different locales; take newer timestamp if same locale).
        - **Future optimization (if conflicts become burdensome):** Split into per-namespace meta files: `.translation-meta/{namespace}.json`. This reduces conflict surface to namespace-level. Implement when ≥3 concurrent translators regularly conflict.
        - **Compression note:** Meta file is highly repetitive (same field names); compresses well in git packfiles. Actual repo size impact is ~2-5MB after compression.
      - Behavior:
        - On any value that the tool translates (fill/overwrite), update the meta entry with the current source hash.
        - On subsequent runs, if a target value is non-empty but stored `sourceHash` differs from current source, mark it as **stale**.
        - Default behavior is **report stale** (tool output + PR description) but do **not** overwrite unless `mode = "overwrite-stale"` or `"overwrite-all"`.
        - **Protected entries are never auto-overwritten** even when stale — they appear in a separate "protected stale" report suggesting human review.
    - Reuse shared safety infrastructure:
      - Tokenization + validators from I18N-PIPE-00b (including `%LINK:key|label%` label translation + validation).
      - TM from I18N-PIPE-02b (`context_key = "app:brikette"`).
      - Glossary from I18N-PIPE-02c (Brikette glossary stored under app path or shared schema with `context_key`).
    - Git workflow (PR-based):
      - MCP tool creates branch `work/i18n-brikette-{timestamp}` from current `HEAD`.
      - Preconditions:
        - Worktree must be clean; if dirty, abort with a clear instruction (stash/commit first).
        - Never force-push; if branch exists remotely with an open PR, abort and ask operator to close/merge or pick a new timestamp.
      - Conflict handling:
        - If target files have changed on `HEAD` since branch creation, rebase/merge is left to the operator; the tool does not auto-resolve conflicts.
      - Failure surfacing:
        - Tool prints a summary suitable for PR description: files changed, keys filled, stale keys detected, failures with `{filePath, keyPath, locale, reason}`.
  - Dependencies: I18N-PIPE-02, I18N-PIPE-02b, I18N-PIPE-02c, I18N-PIPE-03, I18N-PIPE-00b
  - Definition of done:
    - Can translate missing values for a chosen set of Brikette namespaces and locales and produce a clean PR.
    - **Keys invariant:** Target locale files have exactly the same keys as `en` source after run. Tool MAY add missing keys to target files (to sync with `en`), but MUST NOT invent new keys, remove keys, or rename keys.
    - Existing non-empty translations are preserved by default (mode `fill-missing`).
    - Placeholder/token validation failures are surfaced with `{filePath, keyPath, locale, reason}`.
    - Stale translations are detected via `.translation-meta.json` and reported without overwriting by default.

- [ ] I18N-PIPE-08: Brikette content authoring (CMS draft + operator-run publish)
  - Scope:
    - Implement content authoring workflow for Brikette guides and namespace additions.
    - **Architecture:** CMS stores drafts; operator runs publish via MCP (no server-side automation).
    - **Authoring approach:** LLM-assisted — Claude helps draft content from prompts or external sources.
    - **Single approval gate:** Approve in CMS → operator runs `publish-brikette-draft` in Claude Code → MCP handles export + translate + PR.
  - Architecture decisions (based on repo analysis):
    - **Operator-run, not server-run:** Consistent with rest of plan — no headless automation, no server-side GitHub tokens.
    - **CMS role:** Draft storage + approval workflow + "show command to run". CMS does NOT execute git/translation.
    - **MCP role:** `publish-brikette-draft` tool runs in Claude Code session, uses operator's local git/gh credentials.
    - **No dual storage:** Use existing guide format in `locales/*/guides/content/`. i18next with `returnObjects: true` already supports nested structures.
    - **No UUIDs:** Use existing camelCase guide keys (e.g., `newBeachGuide`). Existing slug system handles URL generation.
  - CMS API for draft access:
    - **New endpoint:** `GET /api/brikette-drafts/{draftId}`
      - Returns draft content JSON
      - Auth: API token (stored in operator's MCP config) or NextAuth session
      - Follows existing CMS API patterns (`/api/page-draft/[shop]`, etc.)
    - **Endpoint for updating draft status:** `PATCH /api/brikette-drafts/{draftId}`
      - Updates `prUrl`, `publishedAt`, `exportedCommit` after publish
  - Draft storage model:
    - **Database schema for drafts:**
      ```typescript
      interface BriketteGuideDraft {
        id: string;                    // Internal draft ID (UUID for CMS use only)
        guideKey: string;              // camelCase key (e.g., "newBeachGuide") — used in git path
        locale: "en";                  // Drafts are always in English (source language)
        content: GuideContent;         // Matches existing guide JSON format exactly
        status: "draft" | "review" | "approved" | "ready_to_publish" | "published";
        authorId: string;
        llmAssisted: boolean;
        llmPrompt?: string;
        // External URL import audit fields:
        sourceUrls?: string[];         // External URLs used (for audit)
        sourceLicenseType?: SourceLicenseType; // License type selected by operator
        sourceLicenseConfirmed: boolean; // Operator attestation
        sourceFetchedAt?: string;      // When external content was fetched (ISO timestamp)
        createdAt: string;
        updatedAt: string;
        approvedAt?: string;
        approvedBy?: string;
        publishedAt?: string;
        exportedCommit?: string;
        prUrl?: string;
      }

      // License type enum for external URL imports
      type SourceLicenseType =
        | "company-owned"      // Internal Google Docs, wiki, etc.
        | "cc-by"              // Creative Commons Attribution
        | "cc-by-sa"           // Creative Commons Attribution-ShareAlike
        | "public-domain"      // Government sites, pre-1928 works
        | "explicit-permission" // Partner content with written agreement
        | "other";             // Requires description in separate field

      // Extended guide format with imageId, videos, and acknowledgments support
      interface GuideContent {
        seo: { title: string; description: string };
        linkLabel: string;
        intro: string[];
        sections: Array<{ id: string; title: string; body: string[] }>;
        tips?: string[];
        warnings?: string[];
        faqs?: Array<{ q: string; a: string[] }>;
        gallery?: {
          title: string;
          items: Array<{
            imageId?: string;           // Cloudflare Images ID (new for CMS-authored)
            alt: string;
            caption?: string;
          }>;
        };
        videos?: Array<{                // Video support (new for CMS-authored)
          provider: "youtube" | "vimeo";
          videoId: string;
          title: string;
          caption?: string;
        }>;
        acknowledgments?: string;       // Attribution text for CC-BY/CC-BY-SA sources (rendered at end of guide)
      }
      ```
    - **Guide key rules:**
      - Must be valid camelCase (start lowercase, alphanumeric only)
      - Must be unique across all guides
      - Becomes the file name: `{guideKey}.json`
      - Used in `%LINK:guideKey|label%` patterns
      - Registered in `GENERATED_GUIDE_SLUGS` on publish (see slug registration below)
    - **Draft lifecycle:**
      1. **Create:** Author starts new draft (empty, LLM-generated, or imported from URL)
      2. **Edit:** Author edits content in CMS UI; assigns `guideKey`
      3. **Review:** Reviewer approves or requests changes
      4. **Approved → Ready to publish:** CMS shows command: `publish-brikette-draft --draft-id {id}`
      5. **Operator runs publish:** In Claude Code session (not automatic)
      6. **Published:** After PR merge + deploy, content is live
    - **Where drafts live:**
      - CMS database (Prisma) — allows concurrent editing, version history, approval workflow
      - Drafts NOT visible to site visitors until published + PR merged + deployed
  - Content format (extended for CMS authoring):
    - **Compatible with existing 129 guides** — extends format with optional new fields
    - Supports: `seo`, `linkLabel`, `intro[]`, `sections[]`, `tips[]`, `warnings[]`, `faqs[]`, `gallery`, `videos`
    - Markdown in body text (bold, italic, lists, links)
    - Internal links: `%LINK:guideKey|label%` — rendered by existing `renderGuideLinkTokens()`
    - External links: Standard Markdown `[label](url)`
    - **Images:** Gallery items include optional `imageId` (Cloudflare Images ID) — resolved to URL at render time
    - **Video:** Optional `videos` array with YouTube/Vimeo embeds — rendered by `GuideVideo` component
    - Existing guides without `imageId`/`videos` continue to work (backward compatible)
  - LLM-assisted authoring workflow:
    - **MCP tool `author-brikette-content(contentType, prompt, options)`:**
      - `contentType`: "guide" | "namespace-keys"
      - `prompt`: Natural language description of what to create
      - `referenceKeys`: optional array of existing guide keys to use as style/structure reference
      - `sourceUrls`: optional array of external URLs to import/adapt content from
      - Returns: draft content JSON matching `GuideContent` schema
    - **External URL import policy (legal/compliance):**
      - **Allowed:** Internal Google Docs, internal wiki, public reference material (with attribution), explicitly licensed content
      - **Prohibited:** Competitor websites, paywalled content, restrictively licensed content
      - **Enforcement:** Domain blocklist in MCP config; tool refuses to fetch from blocked domains
      - **Required:** Operator confirms `sourceLicenseConfirmed: true` before approval
      - **Audit:** Source URLs stored in draft metadata
      - **No raw storage:** Only adapted output stored
    - **Content schema validation:**
      - Validates against `GuideContent` schema (derived from existing guide files)
      - Invalid output surfaced with specific schema violations
  - Approval → Publish workflow (operator-run):
    - **On approval in CMS:**
      - Draft status changes to `ready_to_publish`
      - CMS displays: "Run this command in Claude Code: `publish-brikette-draft --draft-id {id}`"
      - CMS does NOT execute anything
    - **MCP tool `publish-brikette-draft(draftId, options)`:**
      - Runs in Claude Code session on operator's machine
      - **Auth:**
        - CMS API: token from MCP config (env var `CMS_API_TOKEN`)
        - Git: operator's credentials (SSH/credential helper)
        - GitHub: `gh` CLI (OAuth/PAT)
      - Steps:
        1. Fetch draft from CMS API: `GET /api/brikette-drafts/{draftId}`
        2. Validate `guideKey` is unique (not already in `GENERATED_GUIDE_SLUGS`)
        3. Validate content against `GuideContent` schema
        4. Write English content to `apps/brikette/src/locales/en/guides/content/{guideKey}.json`
        5. Register guide key: update `apps/brikette/src/data/generate-guide-slugs.ts` to include new key
        6. Call I18N-PIPE-07 translation for all target locales
        7. Create git branch `work/content/{guideKey}-{timestamp}`
        8. Commit all files with message: `content(brikette): Add guide {guideKey}`
        9. Create PR via `gh pr create`
        10. Update draft in CMS: `PATCH /api/brikette-drafts/{draftId}` with PR URL, commit SHA
      - Returns: PR URL
    - **Edit/update existing content:**
      - Create draft in CMS "from existing" — loads current git content into new draft
      - Edit and approve as normal
      - Publish overwrites the file in git (same key, updated content)
      - TM caches unchanged strings; only changed text re-translated
      - **Warning in CMS:** "This guide exists in git. Direct git edits will be lost on next CMS publish."
    - **Conflict handling:**
      - If `guideKey` already exists but content differs from draft, tool shows diff
      - Operator confirms: overwrite (update) or abort
    - **PR review scope:**
      - Single PR contains: English content + all translated locales + slug registration
      - Reviewer can fix translation issues directly in PR
      - On merge → content goes live on next deploy
  - CMS UI for authoring:
    - **Shared infrastructure with I18N-PIPE-05:** Same CMS app, separate UI section for Brikette authoring
    - **Content list view:**
      - Filter by status, author
      - Status badges: draft / review / approved / ready_to_publish / published
      - For `ready_to_publish`: "Copy command" button
      - For `published`: PR link
    - **Guide draft editor:**
      - Form-based editor matching guide structure (seo, intro, sections, faqs, gallery, videos)
      - Markdown support in body fields
      - Guide key input (validated for uniqueness on save)
      - Internal link picker: search guides by title, inserts `%LINK:guideKey|label%`
      - **Image uploader:** Upload to Cloudflare Images, returns `imageId` for gallery items
      - **Video embedder:** Paste YouTube/Vimeo URL, extracts provider + videoId
      - JSON editor toggle for advanced users
      - Preview pane (renders with existing guide components if possible)
    - **Namespace key additions editor:**
      - Select target namespace from list (e.g., `landingPage`, `footer`, `guides`)
      - Add key/value pairs (key is the i18next path, value is the English source text)
      - Conflict detection: warns if key already exists in namespace
      - Preview shows where new keys will appear in namespace JSON
    - **"Generate with Claude" panel:**
      - Prompt input for natural language description
      - URL input for importing from external sources
      - **License confirmation checkbox:** required before import
      - Reference picker for selecting existing guides as style examples
      - "Generate" button → calls MCP tool → populates editor
    - **Review workflow:**
      - Side-by-side: draft JSON vs rendered preview
      - Schema validation warnings
      - Source license checklist (if `sourceUrls` present)
      - Approve/reject with comments
    - **Approve → Ready to publish:**
      - Shows: "Draft approved. Run in Claude Code:"
      - Command: `publish-brikette-draft --draft-id {id}`
      - Copy button
  - Namespace key additions (Phase 1 scope — included with guides):
    - For adding new keys to existing namespaces (e.g., `landingPage.json`, `footer.json`)
    - **Merge strategy:** Error on key conflict; new keys appended to existing namespace
    - **Draft model:** Similar to guides — CMS stores draft key/value pairs, publish merges into namespace JSON
    - **MCP tool:** `publish-brikette-namespace --draft-id {id}` — merges new keys, translates, creates PR
    - **Validation:** Keys must not conflict with existing keys; values validated for i18next compatibility
    - **Supported namespaces:** All `locales/{locale}/*.json` files (not just top-level)
  - Dependencies:
    - I18N-PIPE-05 (CMS infrastructure — shared app, Prisma schema extension)
    - I18N-PIPE-07 (translation — called by publish tool)
    - **External:** Cloudflare Images API access (for image uploader). Assumes existing CF account with Images enabled. Configuration: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_API_TOKEN` env vars.
    - **External:** `GuideVideo` component in Brikette (new component for video embeds). Can be built in parallel with CMS authoring; required before video-containing guides can render.
  - Definition of done:
    - Authors can create Brikette guide drafts in CMS
    - Guide format extends existing structure with optional `imageId` (Cloudflare Images) and `videos` fields
    - LLM-assisted drafting works from prompts or external URLs (with license enforcement)
    - Guide keys are camelCase, validated for uniqueness
    - Approval marks draft as `ready_to_publish` and shows MCP command
    - Operator runs `publish-brikette-draft` in Claude Code (no server-side automation)
    - Publish writes to existing `locales/*/guides/content/` path (no new directories)
    - Publish registers new guide key in `generate-guide-slugs.ts`
    - Single PR contains English + all translated locales
    - On PR merge + deploy, content is live
    - Full audit trail: author, LLM flag, source URLs, license confirmation, approver, PR URL
    - **Namespace key additions:** Authors can add new keys to existing namespace files
    - **Namespace validation:** Key conflicts detected before publish; new keys appended
    - **Image uploader:** CMS UI can upload images to Cloudflare Images and return ID for use in guides

- [ ] I18N-PIPE-05: CMS UI + API endpoints for translation (STATUS/PLANNING DASHBOARD — not executor)
  - Scope:
    - **Architecture clarification (CRITICAL):** CMS is a **planner and status dashboard**, not a translation executor. Translation execution happens in Claude Code sessions via MCP. This is consistent with the subscription model (no server-side API keys, no headless background jobs).
    - **What CMS does:**
      - **Status dashboard:** Shows translation coverage, staleness, failures — all read from artifacts written by MCP.
      - **Job planning:** Generates job specs and shows the exact Claude Code command to run.
      - **Manual editing:** Allows operators to fill/correct translations directly in CMS (no MCP needed).
      - **Undo:** Reads undo bundles written by MCP; applies them via CMS write operations.
    - **What CMS does NOT do:**
      - ~~Trigger translation execution~~ — CMS cannot call LLMs; MCP tool is the only executor.
      - ~~Show real-time progress~~ — Progress is visible in the Claude Code session, not CMS.
    - **Translation status dashboard (read-only from MCP artifacts):**
      - Overview of translation status per entity type (products, pages, sections, navigation, SEO)
      - Per-locale completion percentage
      - Last translation run timestamp and summary (read from `translation-runs/{jobId}.json`)
      - **Staleness indicators:** Fields where source changed after translation (see staleness metadata)
      - **Protected stale indicator:** Separate count/list of stale entries with `doNotOverwrite: true` — these need human review and won't be auto-updated. Shows: "X translations are stale but protected from auto-update. [Review manually]"
    - **Job planning (generates spec, does not execute):**
      - Select target locales and entity scope
      - Preview what will be translated (count, estimated tokens) — calls read-only preview endpoint
      - Generate job spec file: `data/shops/{shopId}/translation-jobs/{jobId}-pending.json`
      - **Show Claude Code command:** `"translate shop {shopId} using job {jobId}"` or `"translate shop {shopId} to de, it"`
      - Option: "Do not machine translate" (manual-only) toggle — sets flag in entity metadata
    - **Failure management (reads MCP-written failure logs):**
      - List of failed strings with failure reason (token mismatch, PII blocked, etc.)
      - Show Claude Code command for re-run: `"retry failed translations for job {jobId}"`
      - Manual override: edit translation directly in CMS (this IS a CMS write, not MCP)
    - **Per-field manual translation editor (CMS-native, no MCP):**
      - Side-by-side view: source locale | target locale
      - Inline editing for manual corrections
      - Mark as "manually reviewed" (prevents re-translation on future runs) — persisted in staleness metadata
    - **Bulk operations (job specs, not execution):**
      - "Plan translation for all products" / "Plan translation for all pages"
      - "Plan translation for entire shop to [locale]"
      - Generates job spec; shows command for operator to run in Claude Code
    - **Preview before apply (read-only):**
      - CMS can call MCP's `translation-preview` tool via a read-only endpoint (no writes, no LLM calls)
      - Diff view: current value vs proposed translation (from preview output)
      - Accept/reject per string before apply
    - **Cost/usage tracking:**
      - Estimated tokens for proposed run
      - Historical usage per shop (for subscription limit awareness)
    - **API endpoints (read-only status + manual edits only — no execution):**
      - `GET /api/shops/{shopId}/translations/status` — overall translation coverage
      - `GET /api/shops/{shopId}/translations/status/{jobId}` — job details (reads MCP-written artifact)
      - `GET /api/shops/{shopId}/translations/preview` — dry-run (extraction + TM check, no LLM)
      - `POST /api/shops/{shopId}/translations/plan` — create job spec file for MCP to execute
      - `POST /api/shops/{shopId}/translations/undo/{jobId}` — apply undo bundle (CMS write, not MCP)
      - `PATCH /api/shops/{shopId}/translations/{fieldPath}` — manual edit (CMS write, not MCP)
      - ~~`POST /api/shops/{shopId}/translations/run`~~ — **removed**: execution is MCP-only
  - Dependencies: I18N-PIPE-03, I18N-PIPE-04
  - Definition of done:
    - Translation status dashboard available in CMS showing coverage, staleness, and failures
    - Operators can plan jobs, view status, undo runs, and manually edit translations in CMS
    - **Execution requires Claude Code session** — CMS shows the exact command to run
    - Failed strings are actionable with re-run command displayed and manual edit options
    - Bulk job planning works for shop-wide translation specs

- [ ] I18N-PIPE-06: Validation, safety, and test coverage
  - Scope:
    - Unit tests for the walker (no overwrites, empty string handling, draft-only enforcement).
    - **Format safety validation** (first-class requirement):
      - Detect placeholders in all forms used by the repo:
        - `{name}` — @acme/i18n interpolation (most common)
        - `{{name}}` — i18next/Handlebars-style interpolation (preserve braces exactly; tokenized as `⟦TI...⟧`)
        - `{0}`, `{1}` — positional
        - `%s`, `%d` — printf-style (if used)
        - ICU MessageFormat (`{count, plural, ...}`) — if used, treat ICU segments as protected tokens or disallow in CMS content
      - Detect URLs, HTML tags, Markdown syntax in source.
      - **Tokenization before translation** (integrated with I18N-PIPE-00b): placeholders/URLs are masked with tokens before sending to provider, then restored after.
      - **Token validation rule: multiset equality, not positional**
        - Languages reorder sentences; tokens may move positions.
        - Validation checks that the **same multiset of tokens** exists in the output (order may differ).
        - Reject translations where tokens are missing, duplicated beyond expected count, or malformed.
      - Test cases: `"Hello {name}"`, `"Hello {{name}}"`, `"Visit https://example.com"`, `"Click <a href='#'>here</a>"`, `"**bold** text"`, `"Contact {email} for help"`, `"{greeting}, {name}!"` (reordering test).
    - **Failure handling strategy:**
      - On format validation failure: do NOT apply translation; mark string as `failed` in job result.
      - No automatic retry with different provider (avoid cost spiral); surface failure for manual review.
      - Job completes as `partial_success` if some strings failed; CMS shows count of failures.
      - **Failure tracking granularity**: failures are stored at **field path level** (not deduped hash level). This ensures:
        - Each failing field path is individually actionable in CMS
        - Same tokenized hash failing in multiple places shows as multiple failures
        - Re-run targets specific field paths, not abstract hashes
      - Failed strings listed in job audit with: field path, source text hash (for debugging), failure reason.
      - CMS UI allows re-running failed field paths only (after manual review/provider change).
      - **Field path stability for arrays (handles reordering):**
        - **Problem:** Index-based paths like `faqs[2].answer` break when arrays are reordered (FAQ at index 2 moves to index 5).
        - **Solution for guide content (Workstream B):**
          - **Sections:** Have stable `id` fields. Path: `sections[id=getting-there].body[0]`
          - **FAQs:** No `id` field in current schema. Use **question text hash** as disambiguator: `faqs[qhash=sha256:abc...].a[0]`
          - **TOC items:** Have `href` field which serves as stable ID. Path: `toc[href=#day1].label`
          - **Gallery items:** Use `imageId` or `alt` hash as disambiguator: `gallery.items[imageId=cf-123].caption`
          - **Tips/warnings:** ID-less string arrays. Use content hash: `tips[hash=sha256:abc...]`
        - **Solution for CMS content (Workstream A):** CMS sections/blocks have stable UUIDs. Field paths use: `sections[uuid=abc123].content` instead of `sections[2].content`.
        - **Fallback for any ID-less array:** Use content hash as disambiguator. This handles reordering but requires re-keying if content is edited (acceptable tradeoff).
        - **Implementation:** Walker extracts strings with stable paths; job results store stable paths; undo bundles reference stable paths.
        - **Migration note:** Existing jobs with index-based paths remain valid for their original content snapshot. New runs use stable paths.
    - Integration test for a sample shop translation run.
    - Add guardrails for `freezeTranslations` or equivalent setting if present.
  - Dependencies: I18N-PIPE-04
  - Definition of done:
    - Tests pass; translation output is deterministic and reversible.
    - **Format safety tests pass**: placeholders/URLs/HTML/Markdown round-trip with correct token multiset.
    - Token reordering is permitted; only missing/extra tokens cause failure.
    - Failed format validation blocks apply and surfaces in audit log.
    - CMS shows clear failure counts and allows targeted re-runs.

## Risks & Open Questions
- ~~Locale expansion beyond `en/de/it` requires updating `@acme/types/constants` and adding locale bundles for UI.~~ → **Promoted to blocker task I18N-PIPE-00**.
- Large content batches may require async queueing to avoid request timeouts.
- Machine translation quality varies by domain; we may need glossary support or term overrides.
- ~~If the translation pipeline supports more locales than UI bundles, we need clear fallback/visibility rules in CMS and runtime.~~ → Addressed by `UiLocale`/`ContentLocale` split in I18N-PIPE-00.
- ~~**Self-hosted options** (LibreTranslate/Argos) require Docker/compute infrastructure—worth it only if volume is high enough.~~ → Not needed; LLM subscription approach chosen.
- ~~**LLM translation** (Haiku) may have different rate limits and requires prompt engineering for consistent output format and placeholder preservation.~~ → Addressed: LLM via subscription chosen as primary provider; prompt template defined in I18N-PIPE-02.
- ~~**TM storage size** could grow large over time; may need pruning strategy or move to DB if JSON becomes unwieldy.~~ → Addressed: LRU eviction + 50k entry limit in I18N-PIPE-02b.
- ~~**TM context granularity**: Global TM chosen for cost savings; add `context_key` if "same text, different meaning" becomes a real issue.~~ → Addressed: `context_key` now defaults to shop group ID for cross-tenant isolation.
- **Provider pricing volatility**: table is placeholder; must verify before committing to budget targets.
- **Partial failure UX**: Need clear CMS design for surfacing failed strings and enabling targeted re-runs without re-translating successful strings.
- ~~**PII false positives**: Content filtering may flag legitimate marketing content (e.g., "contact us at support@...").~~ → Addressed: tokenization strategy masks emails/URLs before translation instead of blocking them.
- ~~**Tokenization robustness**: Some providers may translate or mangle tokens (e.g., `__URL_1__` → `__URL_一__` for CJK).~~ → Addressed: new token format uses Unicode brackets `⟦T...⟧` with digits-only payload to avoid CJK transliteration.

## Acceptance Criteria

### Core Functionality
- Authors can translate missing locales for a shop with one action.
- Shops can select the full Brikette locale set (including recommended region/script variants), with defaults `contentLanguages = ["en", "it"]`.
- UI chrome supports `UiLocale = "en" | "it"` only for now; content locales beyond UI are still routable and render with UI fallback.
- Translations only fill missing locale values by default; **manual/reviewed translations are never overwritten** without explicit operator action. Stale machine translations (where source changed since translation) may be overwritten when `reviewed: false` and operator requests re-translation.

### Content Safety & Filtering
- **Content filtering**: Strings with detected PII are blocked from external providers; blocked strings are surfaced in CMS for review.
- **Format safety**: placeholders, URLs, HTML, and Markdown round-trip unchanged; failures are flagged and blocked from apply.
- **Brikette link patterns** (`%LINK:key|label%`) are tokenized correctly; only label portion is translated (UC-3).

### Publish Gate
- **Publish gate**: drafts must have required locale content filled (via operator-triggered translation or manual entry) before going live; publish blocks if required locales are missing (UC-5).
- **Publish gate is validator only**: it does NOT auto-translate. Translation requires an active MCP/Claude Code session.
- **Navigation + SEO**: navigation labels and settings-level SEO fields are draftable, can be translated pre-publish via MCP, and cannot go live with missing required locales.
- **"Do not machine translate"**: operators can opt out of machine translation (manual-only) while publish still enforces completeness.
- **Runs operate on pre-live content only**; published/live content is never modified by the machine translation pipeline.

### Cost & Efficiency
- **Re-running translation on unchanged content with same provider requires zero incremental work** (TM cache hit) (UC-7).
- Typical-shop runs complete within subscription allowance (no pay-as-you-go API spend by default) (UC-1).
- **Dry-run mode** shows token/usage estimate before committing.
- **Provider change triggers re-translation**: TM cache is keyed by provider to avoid stale translations.

### Scale & Reliability
- Workstream B handles Brikette-scale namespace volume (7,600+ strings) without timeout or manual chunking (UC-2).
- Runs are auditable (who/when/what locales, counts of fields translated, cost incurred).
- Walker correctly extracts strings from nested JSON structures (arrays, FAQs, TOC) (UC-3).

### Workstream B (Brikette i18n Translation)
- Can translate missing namespace values and generate a PR (I18N-PIPE-07).
- Keys are never modified; existing non-empty translations are preserved by default.
- `{{var}}` interpolation is preserved exactly (tokenized as `⟦TI...⟧` and restored).
- Stale translations are detected and reported (via `apps/brikette/src/locales/.translation-meta.json`) without overwriting by default.

### Workstream B Content Authoring (I18N-PIPE-08)
- New Brikette content (guides, namespace keys) can be authored in CMS as drafts with rich text, images, video, and links.
- LLM-assisted authoring generates content from prompts OR imports/adapts from external URLs (with license confirmation).
- Human review of English draft is always required before approval.
- **Single approval gate:** Approve in CMS → operator runs `publish-brikette-draft` in Claude Code → MCP handles export + translate + PR.
- **Operator-run publish (not automatic):** Consistent with MCP-only execution model; uses operator's local git/gh credentials.
- **Same storage location as existing guides:** Content goes to `apps/brikette/src/locales/{locale}/guides/content/{guideKey}.json` — no new directories, no dual storage.
- **Existing guide key system:** Uses camelCase guide keys (e.g., `newBeachGuide`), not UUIDs. Existing slug generation via `guideHref()` handles URL routing.
- PR contains English content + all translated locales; reviewer can fix issues directly in PR.
- On PR merge, content goes live on next deploy.
- Clear lifecycle: Draft → Review → Approve → Ready to Publish → (operator runs MCP) → PR → Merge → Live.
- Full audit trail: author, LLM flag, source URLs, license type, license confirmation, approver, PR URL.

### RTL & Locale Support
- RTL locales (`ar`, `he`) set `dir="rtl"` even when UI strings fall back to English (UC-6).
- Content locales drive `lang` attribute and formatting, independent of UI locale.

### Migration & Backward Compatibility
- Legacy `Record<Locale, string>` format in products/SEO is migrated to TranslatableText (UC-4).
- Existing `en/de/it` content continues to work after migration.
