---
Type: Idea
ID: PLAT-OPP-0003
Business: PLAT
Status: Draft
Owner: Unassigned
Created-Date: 2026-02-06
Tags: [content, pipeline, ai, seo, translation, guides, multi-business]
---

# Article Generation Pipeline

Repeatable, human+AI pipeline for taking a business from catalog-only (L1) to content commerce (L2). Covers the full lifecycle: idea generation, EN content production, and multi-locale translation. Supersedes the CMS blog system.

## The problem

Every business on the platform hits the same wall after launch: it can transact but can't grow cheaply or serve customers efficiently.

**Customer acquisition is expensive.** An L1 business has no organic traffic. Every visitor comes from paid ads or direct referrals. Spend stops, traffic stops. There's nothing compounding.

**Customer service is expensive.** Every question requires a human response. "How do I get to you from the airport?", "What's your cancellation policy?", "What's nearby?" -- these get asked repeatedly, and each time someone writes the answer from scratch or memory.

**There are no reusable data assets beyond the product catalog.** No standing knowledge base, no structured content for bots or email systems to draw on, no self-service layer.

Guides solve all three:
- **Each guide is a low-maintenance SEO asset** that drives organic traffic at low marginal distribution cost. Content does require ongoing maintenance (facts change, policies change, competitors move), but the cost of maintaining a guide is far lower than the cost of the equivalent paid traffic. A 200-guide library in 18 locales is 3,600 publishable pages with correct locale targeting and automated QA; actual ranking depends on site authority and content usefulness, but coverage is the prerequisite.
- **Each guide is standing, reusable customer service data.** The same structured content powers self-service on the website, email autodraft responses, chatbot answers, and (at L3) reception/ops tools. Extractable FAQ pairs, short-answer snippets, and contextual surfaces (e.g., cancellation policy shown at checkout) all derive from the same guide data. The more guides exist, the more questions are already answered without human involvement.
- **Content compounds.** Unlike ads, guides are durable assets. The library grows, per-guide cost falls (the pipeline gets faster), and cumulative value increases -- provided there's a maintenance loop to keep content accurate (see Maintenance below).

The blocker is **speed of content creation.** The old approach (CMS blog: human writes from scratch, no AI, no templates, no automated translation) is too slow to build a meaningful library. Brikette's 168 guides were built manually over months. That can't be repeated for every new business.

This pipeline replaces the blog approach with a human+AI collaborative process: AI proposes ideas from data, AI drafts structured content from templates, human reviews and finalises, pipeline translates and validates automatically. Hours per guide, not days.

**Guides replace blogs as the primary content format going forward.** The CMS Sanity blog system (Portable Text editor, manual publish workflow) is superseded for guide content. Guides are structured JSON -- machine-readable, templated, translatable -- not free-form rich text.

See `docs/business-os/strategy/business-maturity-model.md` for the full maturity model and how this fits into L1/L2/L3 progression.

## Non-goals

- **Replacing all editorial content.** Some businesses may still need announcements, news, or opinion content that doesn't fit structured templates. This pipeline is for guides (structured, templated, fact-based). If a lightweight editorial/announcement capability is needed, that's a separate, simpler concern -- not in scope here.
- **Fully autonomous content.** Human review of EN content is non-negotiable. The pipeline makes humans faster, not optional.
- **Real-time content.** Guides are for standing information, not live feeds or dynamic data.
- **CMS feature parity with Sanity.** We're not rebuilding a general-purpose CMS. The guide editor is purpose-built for structured JSON templates.

## MVP definition

**Scope:** 3 article types, 1 pilot shop (Brikette) + 1 additional shop, EN + 2 target locales initially.

**Article types for MVP:**
1. How to get here (transport/directions)
2. Local experience (things to do, beaches, hikes)
3. Operational info (policies, check-in, amenities)

**Success criteria:**
- Publish 30 guides across both shops in 4 weeks
- P50 human review time < 20 minutes per guide
- < 5% drafts require full rewrite (vs light edit)
- < 3% validation failure rate (schema/links/SEO)
- Translation parity issues < 2% per locale
- Cost per published guide (EN + target locales) measured and tracked

**Post-publish tracking (measured but not gated for MVP):**
- Impressions, clicks, CTR per guide (Search Console)
- Support ticket deflection: guide topics vs ticket frequency before/after
- Bounce rate per guide (high traffic + high bounce = content mismatch)

## Pipeline stages

### 1. Idea Generation (humans + AI)

Both humans and AI contribute ideas. The pipeline maintains a backlog of guide ideas per business, prioritised by expected impact.

**AI-generated ideas:**
- **Catalog coverage gaps** (highest ROI, lowest dependency) -- Cross-reference the business's product/service catalog with content gaps using a taxonomy of guide types per catalog category. For a hostel: "things to do near us", "how to get here from X", "local food guide". For a fashion brand: "care instructions for Y material", "styling guide for Z category". Coverage = which guide types exist for which catalog items.
- **Support topic clustering** -- Mine support emails and common questions to find topics where content would deflect inquiries. Brikette's email autodraft system (BRIK-ENG-0020) will generate data here. AI clusters and prioritises recurring themes. **Requires PII stripping and shop-level data isolation before any model sees the data.**
- **SEO gap analysis** -- Where Search Console data is available: identify keywords where the business has impressions but no content. Where it's not available (new businesses): use catalog coverage gaps + site search queries (if available) + "adjacent terms" derived from structured location/category data. Full keyword research tooling (volume estimates, difficulty scores) is a later enhancement, not MVP.

**Human-submitted ideas:**
- Business owner spots a gap from customer conversations, local knowledge, or seasonal opportunities
- Team members flag topics from competitor research or industry trends

**Output:** A prioritised backlog of guide ideas, each with a brief. Human review before any idea enters production -- AI proposes, human disposes.

### Brief contract (minimum fields)

| Field | Required | Description |
|-------|----------|-------------|
| `guideKey` | Yes | Unique key for the guide |
| `articleType` | Yes | Template type (e.g., `how-to-get-here`, `local-experience`, `operational-info`) |
| `primaryIntent` | Yes | What the user is trying to do (e.g., "get from Naples airport to Positano") |
| `targetKeywords` | Yes | Primary + secondary keywords |
| `audience` | Yes | First-time vs returning, domestic vs international |
| `facts` | Yes | Structured source-of-truth inputs: addresses, times, prices, policy URLs, transport schedules. **AI must use these, not generate from memory.** |
| `internalLinks` | No | Links to catalog objects, other guides, categories |
| `requiredSections` | No | Override template defaults if needed |
| `riskTier` | Yes | 0/1/2 (see Content risk tiers below) |
| `localeScope` | Yes | Which locales get this guide |

### 2. EN Content Production (AI drafts, human finalises)

The pipeline generates a structured draft from the brief. A human reviews, corrects, and finalises.

- **Content templates** -- Structured JSON schemas (already proven in Brikette's guide system) that define sections, TOC, FAQ, images, and SEO metadata. Templates are parameterised by article type. This is the key speed advantage over the blog approach: structured templates mean AI can produce a complete first draft, not a blank page.
- **AI drafting with grounding** -- Given the brief and template, AI generates a draft. Critically, **the AI is constrained to the brief's `facts` field and linked sources** -- it does not generate factual claims from its own knowledge. The draft uses the business's tone of voice and links to existing site content via `%LINK:key|text%` tokens. The draft populates all template fields: intro, sections, FAQs, SEO metadata.
- **Human review** -- Business owner reviews for accuracy, local knowledge, and tone. Review requirements vary by risk tier (see below). The goal is that most drafts need light editing, not rewriting.
- **Image source** -- Per article type: Wikimedia Commons (existing `download-commons-image.ts`), business photography, stock images, AI-generated infographics (existing `generate-guide-infographics.ts`). Each image needs alt text, caption, dimensions, and licensing verification.
- **Validation** -- Automated checks before a guide enters translation: JSON schema validation, link integrity, SEO metadata completeness, image references resolve, risk-tier-appropriate review sign-off recorded.

**Output:** A validated, human-approved EN JSON file ready for translation.

### Template contract (minimum spec)

| Field | Description |
|-------|-------------|
| `articleType` | Template identifier |
| `schemaVersion` | For migration when templates evolve |
| `requiredSections` | Section IDs + order + allowed components per section |
| `fieldGuidance` | Per-field prompts for the AI: tone, constraints, examples, max length |
| `validationRules` | Intent-specific rules (e.g., "how-to-get-here" must include >= 2 routes and a `lastUpdated` field) |
| `riskTierDefault` | Default risk tier for this article type |
| `sourceRequirements` | Which fields require structured source-of-truth inputs vs AI generation |

### 3. Translation (automated with sampling)

Once the EN version is finalised, the pipeline translates to all target locales and validates the results. Hands-off by default, with sampling and escalation for high-risk content.

- **Translation engine** -- Current: Claude API via `translate-guides.ts` (Sonnet model, ~$3-5 per batch, 10-15 mins). This works well and should be the default. The pipeline makes it trivial: point at a guide, get all target locales back.
- **Token preservation** -- Special tokens (`%LINK:...%`, `%IMAGE:...%`, `%COMPONENT:...%`) must survive translation intact. The existing prompt engineering in `translate-guides.ts` handles this but needs to be generalised.
- **Quality checks** -- Post-translation validation: JSON schema match, no missing keys, no untranslated segments, special tokens intact. Existing scripts: `check-guides-translations.ts`, `report-i18n-parity-issues.ts`, `collect-translation-issues.ts`.
- **Sampling and escalation** -- Programmatic validation catches structural errors and token breakage, but not "polite but wrong" translation, cultural issues, or legally sensitive phrasing. Risk tier 2 guides require human spot-check of at least the top 3 traffic locales before publish. All tiers: sample 10% of translated guides per batch for human review.
- **Drift detection** -- When the EN source is updated, flag which locales are stale and re-translate only the changed sections. Currently manual; should be automated.
- **Locale failure policy** -- If a locale translation fails validation: publish all passing locales, flag the failures, retry automatically once. If still failing after retry, publish without that locale (EN fallback) and alert for manual intervention. Never block all locales for one locale's failure.
- **Future: localisation upgrade path** -- Literal translation often underperforms in SEO and can feel unnatural. Plan for a later "localisation rewrite" capability for top-traffic locales (rewrite titles/meta, adjust examples, tweak terminology). Not in MVP.

**Output:** Complete set of validated locale JSON files for the guide. Per-locale performance tracked separately after publish.

### 4. Maintenance loop

Guides are assets, and assets require maintenance. Without this, content decays and trust erodes.

- **Scheduled revalidation** -- Tier 0 (marketing): annual. Tier 1 (operational): quarterly. Tier 2 (policy/safety): monthly.
- **Drift triggers** -- Catalog changes (product added/removed), policy changes, address/hours changes, transport schedule changes should flag affected guides for review.
- **Performance triggers** -- High impressions + low CTR: rewrite title/meta. High traffic + high bounce: content mismatch, needs rewrite. Low traffic on a guide targeting a high-volume keyword: SEO review.
- **Staleness tracking** -- Each guide has a `lastValidated` timestamp. Dashboard shows guides past their revalidation SLA.

### Speed comparison: blog vs guide pipeline

| Step | Blog (old) | Guide pipeline (new) |
|------|-----------|---------------------|
| Idea | Human thinks of a topic | AI proposes from data, human approves |
| Draft | Human writes from scratch in rich text editor | AI generates structured draft from template + brief, grounded in facts |
| Review | N/A (human wrote it) | Human reviews and corrects AI draft (risk-tier-gated) |
| Translation | Manual or not done | Automated, all locales, validated with sampling |
| Validation | Manual | Automated (schema, links, SEO, coverage) |
| Maintenance | Ad-hoc or forgotten | Scheduled by risk tier, triggered by data changes |
| Time to publish (1 guide, 18 locales) | Days to weeks | Hours |

## Content risk tiers

Not all guides are equal. A "Top cafes nearby" guide is low stakes. A "Cancellation policy" guide can create refunds and disputes.

| Tier | Description | Examples | Reviewer | Sources required | Revalidation |
|------|-------------|----------|----------|-----------------|--------------|
| 0 | Marketing / editorial | "Best of" lists, seasonal guides, photo spots | Any team member | AI + general knowledge OK | Annual |
| 1 | Operational info | Check-in procedures, amenities, transport routes, "how to get here" | Business owner | Structured facts in brief required | Quarterly |
| 2 | Contractual / legal / safety | Cancellation policy, visa requirements, safety rules, insurance, medical | Business owner + explicit sign-off | Canonical source URL or document required per claim | Monthly |

Risk tier is set in the brief and determines: required reviewer role, required sources per field, review SLA, and revalidation frequency.

## Pipeline KPIs

Track these to iterate on pipeline quality:

**Production metrics:**
- Median human review time per guide (target: < 20 min for tier 0-1)
- % drafts requiring rewrite vs light edit (target: < 5% rewrite)
- Validation failure rate per stage (target: < 3%)
- Translation parity issues per locale (target: < 2%)
- Time-to-publish P50 / P90 (idea to live in all locales)
- Cost per published guide (EN only, and EN + all locales)

**Outcome metrics (post-publish):**
- Organic impressions and clicks per guide (Search Console)
- Support ticket deflection rate (guide topic frequency vs ticket frequency)
- Bounce rate and time-on-page per guide
- Guide content reuse rate (how often guide data is served via email/bot/portal vs website)

## Existing assets to build on

Brikette has extensive tooling that can be generalised:

| Capability | Brikette script | Generalisation needed |
|------------|----------------|----------------------|
| Guide scaffold | `create-guide.ts` | Parameterise by business + article type |
| Translation | `translate-guides.ts` | Extract from brikette, move to shared package |
| SEO audit | `audit-guide-seo.ts` | Already generic enough |
| Content validation | `validate-guide-content.ts` | Parameterise JSON schema + add schemaVersion |
| Link validation | `validate-guide-links.ts` | Parameterise link resolution |
| Translation QA | `check-guides-translations.ts` | Already generic enough |
| Image download | `download-commons-image.ts` | Already generic enough |
| Coverage report | `report-guide-coverage.ts` | Parameterise locale list |

## Architectural prerequisite: centralise guide data

Before the pipeline can serve multiple businesses, guide storage and authoring must move out of Brikette and into the platform -- the same way products are already centralised.

### Current state (superimposed on Brikette)

The entire guide authoring system currently lives inside the Brikette app:

| Concern | Location | Problem |
|---------|----------|---------|
| Content storage | `apps/brikette/src/locales/{locale}/guides/content/*.json` | Coupled to one app's locale tree |
| Draft dashboard | `apps/brikette/src/app/[lang]/draft/page.tsx` | Only sees Brikette guides |
| Guide editor (WYSIWYG) | `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/` | TipTap editor, Brikette-only |
| SEO audit + editorial panel | `apps/brikette/src/routes/guides/guide-seo/` | Shows on draft guides, Brikette-scoped |
| Manifest + status workflow | `apps/brikette/src/routes/guides/guide-manifest.ts` (~4700 lines) | Draft/review/live lifecycle, hardcoded to Brikette |
| Content API (read/write) | `apps/brikette/src/app/api/guides/[guideKey]/route.ts` | Preview-token gated, writes to Brikette's filesystem |
| Manifest API | `apps/brikette/src/app/api/guides/[guideKey]/manifest/route.ts` | Quality gate (SEO >= 9.0 for "live") |
| Shared URL helpers | `packages/guides-core/` | Already extracted, but only does slug/URL resolution |
| CMS blog (Sanity) | `apps/cms/src/app/cms/blog/`, `@acme/plugin-sanity`, `@acme/sanity` | Full CRUD stack being superseded |
| CMS app | `apps/cms/` | **Has zero guide functionality** -- blog exists but guides don't |

### Target state: follow the product pattern

Products are centralised via a well-proven pattern in `@acme/platform-core`:

1. **Types** in `@acme/types` (`ProductCore`, `ProductPublication`)
2. **Repository interface** in `platform-core/src/repositories/products.types.ts`
3. **JSON backend** reads/writes `data/shops/{shopId}/products.json`
4. **Prisma backend** as optional upgrade path
5. **Server facade** (`products.server.ts`) with lazy backend resolution
6. **CMS consumes** via `readRepo(shopId)` with a `[shop]` dynamic route -- manages products for any shop

Guides should replicate this:

1. **Types** -- `GuideContent`, `GuidePublication` (with status, locale data, SEO metadata, `schemaVersion`, `riskTier`, `lastValidated`) in `@acme/types`
2. **Repository** -- `GuidesRepository` interface with `read(shop)`, `write(shop, guide)`, `getByKey(shop, key)`, etc.
3. **JSON backend** -- `data/shops/{shopId}/guides/{guideKey}/{locale}.json` (multi-tenant, per-locale)
4. **Server facade** -- `@acme/platform-core/guides` export, same pattern as products
5. **CMS guide management** -- Replace the Sanity blog pages with guide management pages in `apps/cms/` under `cms/shop/[shop]/guides/`. Move the draft dashboard, editor, SEO audit, and publish workflow here.
6. **Storefront rendering** -- Each app imports guide data from the centralised store at build/request time. Rendering components stay in the app, content comes from one place.

### Architectural decisions to make during fact-find

**Content-as-code vs CMS-first:** File-based JSON (mirroring the product pattern) works well for read-heavy, single-author workflows. Guides are more editorial and collaborative, which may need: concurrency handling, version history, review audit trails, partial saves. Two options:
- **Option A (content-as-code):** CMS writes commits/PRs; review is Git-based; publishing is merge-based. Simple, auditable, but clunky UX for non-developers.
- **Option B (CMS-first):** Store drafts + revisions in DB; export to JSON for build/runtime consumption. Better UX, but more infrastructure.
Decide during fact-find based on who the editors are and how often they edit.

**Locale atomicity:** Translating to 17 locales is a batch operation. Either the translation set is complete and valid, or it's not published. Partial locale failures need retry mechanics and clear status visibility. The locale failure policy (publish passing locales, flag failures, retry once, then EN fallback) needs to be enforced at the repository level.

**Schema evolution:** Templates will evolve. Every guide needs a `schemaVersion` field. When templates change: migration script auto-migrates content, then revalidates. Without this, validation scripts break old content.

**Preview:** For multi-tenant CMS: preview per shop, per locale, per guide revision. Ability to view "EN draft + translated draft" before go-live. Immutable published snapshots.

### Delivery slices

This is too large to ship as one initiative. Four slices, each independently valuable:

**Slice 1: Centralise read path + data model** (lowest risk)
- Create `@acme/types` guide types + `GuidesRepository` + JSON backend under `data/shops/`
- Add read-only consumption from storefronts
- Seed Brikette guides into new storage
- Keep existing Brikette authoring temporarily
- **Deliverable:** Content is centralised. Zero CMS UI required.

**Slice 2: Translation + validation as shared tooling**
- Extract and generalise translation scripts from Brikette
- Add drift detection + locale staleness tracking
- Add schema validation with `schemaVersion` support
- Reporting (CLI output is fine for MVP)
- **Deliverable:** "Guide set in 18 locales" becomes cheap and repeatable for any shop.

**Slice 3: CMS authoring + workflow**
- Draft editor, review workflow (risk-tier-gated), SEO panel, publish controls
- Role-based access per shop
- Preview modes (per shop, per locale, per revision)
- Maintenance dashboard (staleness tracking, revalidation SLAs)
- **Deliverable:** Cross-business authoring is real. Brikette draft routes can be retired.

**Slice 4: AI pipeline (idea generation + drafting)**
- Brief and template contracts implemented
- AI idea generation from catalog coverage + support topics
- AI drafting with grounding constraints
- Pipeline orchestrator (brief -> draft -> validate -> translate -> validate)
- **Deliverable:** Human+AI content production at speed. This is the slice that changes the economics.

**Blog retirement** happens naturally after Slice 3 -- only retire Sanity blog once guide authoring is fully operational. If lightweight announcements/news are still needed, evaluate separately rather than assuming guides cover everything.

### What centralisation unlocks

- **Any business gets content commerce.** New businesses get guide authoring for free via the CMS, same as products. No bespoke build per business.
- **One pipeline, many businesses.** The pipeline stages operate on centralised data. Build the pipeline once, every business benefits.
- **Reusable data from day one.** Because guides are centralised structured JSON, they're immediately consumable by email systems, bots, guest portals, and ops tools -- not locked inside one app's locale files. Extractable FAQ pairs with stable IDs for chatbot grounding. Short-answer snippets for email responses. Contextual surfaces on transactional pages (e.g., cancellation policy at checkout).
- **Guide infrastructure becomes a platform capability.** Manifest, SEO audit, publish workflow, validation -- all platform-level, not Brikette-specific.

## Risk register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI-generated content contains factual errors | High (customer trust, legal) | Medium | Grounding constraints in brief; human review gated by risk tier; source requirements for tier 1-2 |
| Auto-generated content penalised by search engines | High (defeats the purpose) | Low-Medium | Ensure guides are genuinely useful, not thin; human review for quality; monitor Search Console for manual actions |
| Translation produces culturally inappropriate or legally wrong content | Medium-High | Medium | Sampling + escalation for tier 2; human spot-check top locales; locale-specific review for legal content |
| Image licensing violations | Medium | Low | Licensing verification step in validation; Wikimedia Commons has clear licensing; own photography is safe |
| Multi-tenant access control bugs (shop A sees shop B's drafts) | High | Low | Repository pattern enforces shop scoping; test coverage for isolation |
| Schema evolution breaks existing guides | Medium | High (will happen) | `schemaVersion` field; migration scripts; backward-compatible validation |
| Pipeline cost overruns (AI API costs at scale) | Medium | Medium | Track cost per guide; set per-batch budget alerts; model selection flexibility (cheaper models for translation) |
| Scope creep ("the pipeline should also do X") | High | High | Non-goals section enforced; sliced delivery; each slice ships independently |

## Relationship to other work

- **CMS blog (Sanity)** -- Superseded for guide content. The Sanity integration (`@acme/plugin-sanity`, `@acme/sanity`, blog service layer, blog repository) can be retired after Slice 3. If announcements/news are needed, evaluate separately.
- `BRIK-ENG-0020` (Email Autodraft) -- Will generate support topic data that feeds idea generation. Also a consumer of guide data (autodraft responses grounded in guide content).
- `BRIK-ENG-0003` (Content Translation Pipeline) -- Overlaps with Slice 2; should merge or supersede.
- `BRIK-ENG-0008` (Guide System Improvements) -- Rendering and structural improvements; these become storefront-level concerns once guides are centralised.
- `PLAT-ENG-0010` (Rapid Shop Launch) -- L1 launch plan; this pipeline is the natural next step after launch.
- Business Maturity Model -- this idea is the key enabler for L1-to-L2 progression.

## Next steps

1. Fact-find: audit Brikette scripts -- which can be extracted vs. rewritten? Estimate effort per script.
2. Fact-find: define the 3 MVP article type templates (how-to-get-here, local-experience, operational-info) with concrete schema, field guidance, and validation rules.
3. Fact-find: decide content-as-code vs CMS-first (who are the editors? how often? how collaborative?).
4. Prototype: run catalog coverage gap analysis against one XA business to validate idea generation approach.
5. Estimate: cost and time per guide through the full pipeline (idea -> published in target locales).
6. Decide: L2 readiness thresholds per business type (how many guides, what coverage dimensions, what outcome metrics).
