---
Type: Reference
Status: Canonical
Domain: Business-OS
Last-reviewed: 2026-02-09
---

# Business Maturity Model

Standing reference for how businesses on the platform progress through capability levels.
Used as context for kanban cards, resource allocation, and platform investment decisions.

**Owner:** Pete
**Created:** 2026-02-06
**Status:** Active

---

## Overview

Every business on the platform follows a three-level maturity path. Each level unlocks new revenue and operational capabilities but requires specific platform investments. The goal is to make progression from one level to the next as repeatable and low-friction as possible, especially the L1-to-L2 transition which is currently the primary bottleneck.

The central theme across levels is **building reusable data assets that reduce operating costs**. At L1 the business has product data. At L2 it adds content data (guides) -- structured, machine-readable content that simultaneously drives organic traffic (reducing acquisition cost) and provides standing answers for customer service (reducing support cost). At L3 those data assets plug into each other and into operational systems, so the same verified content powers the website, email responses, chatbots, guest portals, and reception tools. Each asset created is durable (though not zero-maintenance -- facts change and content needs periodic revalidation), and can be consumed by multiple channels.

---

## Level 1 -- Catalog Commerce (Launch)

**Archetype:** XA apps (xa, xa-b, xa-j)

A functional storefront with products, collections, cart, and checkout. The site exists and can transact but does not yet attract organic traffic or build authority.

### Capabilities
- Product catalog with categories, departments, and brand/designer pages
- Shopping cart and checkout flow
- Account management (login, register, order tracking)
- Wishlist and search
- Responsive design via shared design system
- Cloudflare Pages deployment
- Stealth/access-gated mode for pre-launch

### The L1 problem

An L1 business can transact but is expensive to run and hard to grow:

- **Customer acquisition is paid-only.** No organic traffic, no SEO authority. Every visitor costs money (ads, social, referrals). This doesn't compound -- spend stops, traffic stops.
- **Customer service is fully manual.** Every question requires a human response. There's no self-service content for customers to find answers themselves, and no knowledge base for bots or email systems to draw on.
- **No reusable content assets.** The only structured data the business has is its product catalog. There's nothing to power a help centre, FAQ section, or automated responses.
- **Apps are isolated.** No shared data between front-of-house and back-of-house.

### Platform prerequisites
- Shared packages: `@acme/platform-core`, `@acme/design-system`, `@acme/ui`, `@acme/i18n`
- Site config driven by env vars (brand, domain, catalog shape)
- Rapid Shop Launch plan (`launch-3hr-v2`)

---

## Level 2 -- Content Commerce (Growth)

**Archetype:** Brikette (current state)

The business builds a library of structured, multilingual content (guides) that solves multiple problems simultaneously.

### What L2 solves

**Customer service costs go down.** Every guide is standing, reusable data. When a customer asks "how do I get from Naples airport to Positano?", the answer already exists as a guide. This works across channels:
- **Self-service** -- Customer finds the guide on the website and never contacts support.
- **Email/bot responses** -- The email autodraft system (or a future chatbot) draws on guide content to generate accurate answers. The human doesn't write the response from memory; the system pulls from verified, structured data.
- **Reception/ops staff** -- At L3, the same guide data is surfaced in internal tools so staff give consistent answers.

The more guides exist, the more questions are already answered. This compounds: support costs trend down as the guide library grows.

**Customer acquisition costs go down.** Guides are SEO assets. Each one targets keywords, includes structured data (FAQ schema, how-to markup), and exists in 18 languages. Organic traffic displaces paid traffic over time:
- Each guide is a durable ranking opportunity with low marginal distribution cost. Content does need maintenance (facts change, competitors move), but the maintenance cost is far lower than equivalent paid traffic.
- Multilingual coverage means international traffic at marginal cost (automated translation with QA).
- FAQ schema and structured data improve visibility in search results.
- Cross-referencing between guides keeps visitors on site longer and builds topical authority.

**Sales and conversion improve.** Content builds trust and reduces friction in the buying journey:
- "How to get here" guides reduce uncertainty for hostel bookings.
- Product care guides reduce post-purchase returns for fashion businesses.
- Local experience guides give customers reasons to book/buy beyond the core product.

**Content is a compounding asset, not an expense.** Unlike paid ads (spend stops, traffic stops), each guide is durable. The library grows, the per-guide cost falls (pipeline gets faster), and the cumulative value increases. A 200-guide library in 18 locales is 3,600 publishable pages with correct locale targeting and automated QA. Actual ranking and traffic depend on site authority and content usefulness, but topical coverage is the prerequisite -- you can't rank for keywords you don't have pages for.

### Content format: guides (not blogs)

The platform's content unit is the **guide** -- a structured, templated, multilingual article -- not a traditional blog post. The CMS currently has a Sanity-backed blog system (Portable Text editor, manual publish workflow), but this is being superseded by the guide pipeline. The difference is speed: blogs are written from scratch by a human; guides are produced collaboratively by humans and AI using structured templates, then automatically translated and validated. A guide that would take days as a blog post takes hours through the pipeline.

Crucially, because guides are structured JSON (not free-form rich text), the data is machine-readable. This is what makes it reusable across channels -- the same guide data that renders a web page can also populate an email response, feed a chatbot, or display in a reception app.

### Capabilities
- Full guide system (168+ guides in Brikette's case)
- 18-locale translation coverage, automated via Claude API
- SEO-optimised metadata, structured data, FAQ schema
- Tag taxonomy and cross-referencing between articles
- Content as reusable data: consumable by website, email systems, bots, and ops apps
- AI-assisted idea generation (SEO gaps, customer service gaps, catalog mapping)
- AI-assisted content drafting from structured templates
- Automated validation, auditing, link checking, and translation
- Image pipeline (Wikimedia Commons downloads, alt-text backfill, infographics)

### What's needed to get here from L1

Two platform investments, in order:

1. **Centralise guide data and authoring** -- Guide content is currently superimposed on the Brikette app (stored in its locale tree, edited via Brikette-only draft routes, manifest hardcoded to Brikette). Before a second business can have guides, this must move to the platform layer following the same pattern as products: types in `@acme/types`, a `GuidesRepository` in `platform-core` with a `data/shops/{shopId}/guides/` filesystem layout, and guide management pages in the CMS app (`apps/cms/`). The CMS already manages products, pages, blogs, and themes for any shop -- guides should be the same.

2. **Article generation pipeline** (see `PLAT-OPP-0003`) -- Once guides are centralised, the pipeline can serve any business:
   - Idea generation: AI-assisted identification of SEO gaps and customer service opportunities
   - Content production: templates and workflow for EN article creation (text + images)
   - Translation: automated multi-locale translation with quality checks

Supporting work:
- Guide JSON schema and rendering components (per-business, consuming centralised data)
- Validation and auditing tooling (already largely exists in Brikette scripts, needs extracting)
- Content deployment: storefronts read from the centralised store at build/request time

### When is a business "L2 ready"?

L2 isn't a binary switch -- it's a gradient. But the business should be able to demonstrate measurable outcomes, not just content volume. Indicative thresholds (to be refined per business type during fact-find):

**Coverage thresholds:**
- Guide library covers the top customer intents (top 20 support questions have corresponding guides)
- Guide library covers the top acquisition routes (primary transport/access guides, core product/service guides)
- At least 3 target locales fully translated with automated QA passing

**Outcome thresholds:**
- Organic sessions growing month-on-month (absolute number depends on the business and market)
- Measurable support deflection: guide topics showing up in analytics with corresponding decrease in ticket frequency for those topics
- Guide content being reused in at least one non-website channel (email autodraft, chatbot, or portal)

These thresholds exist to prevent "we published 50 guides, therefore L2" -- the point is that the content is actually reducing costs and driving traffic, not just existing.

### Key lesson from Brikette
The L1-to-L2 transition was done manually for Brikette: guides written by hand, translations generated locally with AI tools, scripts built ad-hoc as needs arose. The guide authoring system (draft dashboard, WYSIWYG editor, SEO audit, publish workflow) was bolted onto the Brikette app itself because it was the only business that needed it. This produced good results but doesn't scale -- each new business would need its own copy of the authoring system. The platform needs centralised guide management (like products) plus a repeatable content pipeline.

---

## Level 3 -- Integrated Operations (Maturity)

**Archetype:** Brikette (next phase -- reception app + prime app + storefront)

The data assets built at L1 (products) and L2 (guides) stop being isolated website content and start flowing between applications. The storefront, reception app, prime app, and email systems all draw on the same data.

### What L3 solves

**The data created at L2 becomes operational infrastructure.** Guide content isn't just web pages any more -- it's the knowledge base that powers:
- The email autodraft system pulling guide data to answer customer inquiries
- The guest portal showing relevant guides based on booking details (check-in info, local transport, nearby experiences)
- Reception staff seeing the same verified information customers see online
- Chatbots and AI assistants grounded in structured, accurate, multilingual content

**Operational costs go down further.** Cross-app data sharing eliminates duplicate work and manual data transfer between systems. Stock levels, cash, bookings, and guest information flow automatically rather than being re-entered.

**The business runs more consistently.** When every channel (website, email, reception desk, guest portal) draws from the same data, customers get the same answer regardless of how they ask.

### Capabilities
- Cross-app data flow (product, guide, booking, and guest data shared between apps)
- Operational dashboards aggregating data from multiple sources
- Automated customer communication: email autodraft and chatbot responses grounded in guide data
- Guest portal / self-service layer backed by shared data (guides + booking + availability)
- Stock and cash control integrated with front-of-house
- Analytics spanning content performance, booking conversion, and operational efficiency

### What's needed to get here from L2
- Data layer: shared schemas, APIs, or event bus between apps
- Auth and identity spanning multiple apps (SSO or shared session)
- Integration with external systems (PMS, payment processors, email providers)
- Operational tooling: reception app, stock control, cash reconciliation
- Business-specific workflow automation

### Current Brikette L3 work
- `BRIK-ENG-0017`: Prime Guest Portal gap review
- `BRIK-ENG-0019`: Reception stock + cash control
- `BRIK-ENG-0020`: Email autodraft response system
- `BRIK-ENG-0018`: Dashboard upgrade aggregator

---

## Progression Summary

| Dimension | L1: Catalog | L2: Content | L3: Integrated |
|-----------|------------|-------------|----------------|
| **Acquisition cost** | High (paid only) | Falling (organic replaces paid) | Low (organic + referral + ops) |
| **CS cost per query** | High (every question is manual) | Falling (self-service + reusable data) | Low (automated responses from guide data) |
| **Reusable data assets** | Products only | Products + guides (structured, multilingual) | Same data consumed by all apps |
| **Content** | Product pages only | Guides (human+AI pipeline) | + operational data surfaces |
| **Languages** | UI chrome only | Full content in 18 locales (auto-translated) | + ops UI localisation |
| **Apps** | Storefront only | Storefront + content system | Storefront + content + ops apps |
| **Data flow** | Isolated | Isolated | Cross-app (guides, products, bookings, guests) |
| **Customer service** | Manual, per-question | Content deflection + email/bot drafts | Fully automated where data exists |
| **Platform effort** | Low (template deploy) | Medium (pipeline + tooling) | High (integration + custom) |

---

## Current Business Positions

| Business | Current Level | Next Milestone |
|----------|--------------|----------------|
| Brikette (BRIK) | L2, transitioning to L3 | Complete cross-app integrations |
| XA / Product Pipeline (PIPE) | L1 | Build article generation pipeline for L2 |
| Future businesses | Pre-L1 | Launch via Rapid Shop Launch, then follow this model |

---

## Key Blockers and Investments

### L1 to L2: Guide Centralisation + Article Generation Pipeline (PLAT-OPP-0003)

Two sequential investments:

1. **Centralise guide data** -- Extract guide storage, authoring, and publish workflow from Brikette into the platform layer. Follow the product repository pattern (`platform-core` + CMS). This is prerequisite infrastructure -- without it, each new business needs its own bespoke guide system.

2. **Build the article generation pipeline** -- AI-assisted idea generation, content production templates, and automated translation. This is the capability that makes L2 achievable at scale rather than a manual grind per business.

See `PLAT-OPP-0003` for the full idea including current-state audit, target architecture, and migration path.

### L2 to L3: Integration Architecture
Not yet a blocker -- Brikette is pioneering this path and the patterns will inform the platform approach. Current work is business-specific but should produce reusable patterns.
