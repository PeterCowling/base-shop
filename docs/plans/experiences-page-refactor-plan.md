---
Type: Plan
Last-reviewed: 2026-02-05
Status: Active
Domain: UI / CMS
Relates-to charter: none
Created: 2026-01-26
Last-updated: 2026-01-26
Overall-confidence: 87%
---

# Experiences Page Intro & Guides Section Refactor


## Active tasks

No active tasks at this time.

## Summary

Refactor the Experiences page (`/en/experiences`) to:

1. **Rewrite the intro copy** — Lead with utility, cut atmospheric preamble, deliver the point in 40-70 words
2. **Redesign the guides section** — Group guides by experience type with visual headers (title + image)

The goal is to immediately communicate what visitors get (curated itineraries, local picks) and motivate scrolling into the guides section.

---

## Current State Analysis

### Existing Intro Copy (Hero Section)

**Location:** [experiencesPage.json:6-19](apps/brikette/src/locales/en/experiencesPage.json#L6-L19)

| Field       | Current Copy                                                                                                                    | Issue                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Eyebrow     | "Experiences"                                                                                                                   | Fine                           |
| Title       | "Sunsets, slow mornings, and local know-how"                                                                                    | Atmospheric, not utility-first |
| Description | "Pair your stay with terrace drinks, curated hikes, and a digital concierge that keeps you in the loop before you even arrive." | Buries the value prop          |
| Supporting  | "Everything is open to registered guests; message us if you're travelling with friends staying elsewhere."                      | Fine as secondary info         |

**Current word count:** ~55 words (title + description + supporting)

### Existing Guides Section

**Location:** [GuideCollection.tsx](apps/brikette/src/components/guides/GuideCollection.tsx)

- **Layout:** Flat grid of cards, 2 columns on desktop
- **Filtering:** Topic pills at top (beaches, hiking, cuisine, etc.)
- **Cards:** Title, summary, tags, optional direction links, CTA button
- **No visual grouping** — all guides appear in one list regardless of type

### Available Topics (from guideTopics.ts)

| Topic ID    | Associated Tags                           |
| ----------- | ----------------------------------------- |
| beaches     | beaches                                   |
| hiking      | hiking                                    |
| cuisine     | cuisine                                   |
| day-trip    | day-trip                                  |
| boat        | boat                                      |
| transport   | transport, bus, ferry, train, car, passes |
| itinerary   | itinerary                                 |
| photography | photography                               |
| culture     | culture, event, events, seasonal          |

---

## Deliverables

### Part A: Intro Copy Variants

Three variants of rewritten intro block, each with:

- Headline (max 8 words)
- Description (40-70 words)
- Micro-CTA transition to guides section

### Part B: Grouped Guides Section

Visual redesign where guides are grouped by experience type, each group led by a title + hero image block.

---

## Part A: Intro Copy Variants

### Requirements Checklist

- [x] Lead with utility, not atmosphere
- [x] 40-70 words for opening block
- [x] Explicit scroll nudge toward guides
- [x] Brand voice: confident, local, curated, helpful
- [x] No clichés (nestled, hidden gem, breathtaking)
- [x] Mention 2-4 concrete categories
- [x] No new factual claims

---

### Variant A: Most Direct, Minimal

**Headline:** "Get the most out of your Time"

**Description (48 words):**

> Curated itineraries, beach guides, hiking routes, and local restaurant picks—written by our team and updated for the current season. Whether you're here for two days or two weeks, these guides help you skip the tourist traps and find what's worth your time.

**Micro-CTA:**

> Scroll to browse guides by category.

**Alternate headline option:** "Your Amalfi planning toolkit"

---

### Variant B: Slightly Warmer, Still Concise

**Headline:** "Local know-how for your Amalfi days"

**Description (62 words):**

> We've walked the trails, tested the transportation, and eaten at the trattorias. Our guides cover beach access, day hikes, boat trips, and budget-friendly eats—all updated for the current season. You get itineraries that actually work, not generic listicles. Pick a category below and start planning.

**Micro-CTA:**

> Browse by experience type below.

**Alternate headline option:** "Guides from people who live here"

---

### Variant C: Curated/Local Credibility Emphasis

**Headline:** "Staff-tested guides for the Amalfi Coast"

**Description (58 words):**

> Every hike, ferry route, and cheap-eats spot in these guides has been verified by our team. We cover beaches, day trips, walking routes, and food—organised so you can grab what you need and go. No fluff, no sponsored recommendations. Just practical info from locals who want you to have better days.

**Micro-CTA:**

> Explore guides by category.

**Alternate headline option:** "Practical guides, no fluff"

---

### Copy Comparison Summary

| Variant | Word Count | Tone              | Key Differentiator                       |
| ------- | ---------- | ----------------- | ---------------------------------------- |
| A       | 48         | Direct, efficient | Minimal, action-oriented                 |
| B       | 62         | Warm, personal    | "We've walked these trails" first-person |
| C       | 58         | Authoritative     | "Staff-tested", credibility emphasis     |

---

## Part B: Grouped Guides Section

### Design Concept

Replace the flat guide list with **grouped sections by experience type**. Each group has:

1. **Header block** — Full-width on mobile, split on desktop
   - Left: Hero image (topic-relevant)
   - Right: Topic title + brief description + "View all X guides" count
2. **Guide cards** — 2-column grid within each group

### Visual Layout (Mobile)

```
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Topic image (16:9)
├─────────────────────────────┤
│ 🏖 Beaches                  │  ← Topic title + icon
│ Find your perfect stretch   │  ← Brief description
│ of sand                     │
│ 8 guides                    │  ← Count badge
├─────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ │
│ │ Guide 1   │ │ Guide 2   │ │  ← Guide cards (2-col)
│ └───────────┘ └───────────┘ │
│ ┌───────────┐ ┌───────────┐ │
│ │ Guide 3   │ │ Guide 4   │ │
│ └───────────┘ └───────────┘ │
└─────────────────────────────┘
```

### Visual Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────┐
│ ┌─────────────────────┐ ┌──────────────────────────────────┐ │
│ │                     │ │ 🏖 Beaches                       │ │
│ │                     │ │                                  │ │
│ │   [Topic Image]     │ │ Find your perfect stretch of    │ │
│ │                     │ │ sand and plan your beach day.   │ │
│ │                     │ │                                  │ │
│ │                     │ │ 8 guides →                       │ │
│ └─────────────────────┘ └──────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐     │
│ │ Fornillo Beach │ │ Arienzo Beach  │ │ Beach Clubs    │     │
│ │ Guide          │ │ Club           │ │ Compared       │     │
│ └────────────────┘ └────────────────┘ └────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### Topic Headers Content

| Topic     | Title          | Description                                        | Suggested Image        |
| --------- | -------------- | -------------------------------------------------- | ---------------------- |
| beaches   | Beaches        | Find the right stretch of sand and plan your day   | Beach/coastline shot   |
| hiking    | Hikes & Trails | Walking routes from easy strolls to full-day treks | Path of the Gods vista |
| day-trip  | Day Trips      | Capri, Amalfi, Ravello—how to get there and back   | Ferry or scenic view   |
| boat      | Boat Tours     | Private charters, group trips, and sunset cruises  | Boat on water          |
| cuisine   | Food & Drink   | Where to eat well without overpaying               | Local food/restaurant  |
| itinerary | Itineraries    | Multi-day plans for different trip lengths         | Map or planning visual |

**Note:** `transport`, `photography`, and `culture` topics have fewer guides—consider grouping under "More Guides" or showing only if 3+ guides exist.

---

## Tasks

### TASK-01: Update intro copy in translation file

- **Affects:** `apps/brikette/src/locales/en/experiencesPage.json`
- **Confidence:** 95%
  - Implementation: 98% — straightforward JSON update
  - Approach: 95% — copy variants provided, user chooses
  - Impact: 92% — copy-only change, no structural risk
- **Acceptance:**
  - Hero section uses new utility-first copy (selected variant)
  - Word count 40-70 words
  - Includes scroll nudge CTA

### TASK-02: Add micro-CTA component for scroll nudge

- **Affects:** `apps/brikette/src/app/[lang]/experiences/ExperiencesHero.tsx`
- **Confidence:** 90%
  - Implementation: 95% — simple text + anchor link
  - Approach: 88% — deciding placement (below supporting text vs separate row)
  - Impact: 88% — minor DOM addition
- **Acceptance:**
  - Visible scroll nudge linking to `#guides` section
  - Subtle styling (not spammy)
  - Accessible (proper anchor semantics)

### TASK-03: Create GroupedGuideSection component

- **Affects:** New file: `apps/brikette/src/components/guides/GroupedGuideSection.tsx`
- **Confidence:** 88%
  - Implementation: 90% — follows existing component patterns
  - Approach: 85% — responsive image+text layout decisions
  - Impact: 90% — new component, no existing code modified
- **Acceptance:**
  - Renders topic header (image + title + description + count)
  - Responsive: stacked mobile, split desktop
  - Accepts topic config and guide list as props

### TASK-04: Create GroupedGuideCollection component

- **Affects:** New file: `apps/brikette/src/components/guides/GroupedGuideCollection.tsx`
- **Confidence:** 85%
  - Implementation: 88% — orchestrates grouping logic
  - Approach: 82% — decisions on empty groups, ordering, minimum thresholds
  - Impact: 85% — integrates with existing guide data
- **Acceptance:**
  - Groups guides by topic using existing `matchesGuideTopic`
  - Renders `GroupedGuideSection` for each non-empty topic
  - Handles topics with <3 guides (skip or group under "More")
  - Maintains filter functionality via URL params

### TASK-05: Add topic header content to translation file

- **Affects:** `apps/brikette/src/locales/en/experiencesPage.json`
- **Confidence:** 92%
  - Implementation: 95% — JSON structure addition
  - Approach: 90% — content for each topic provided
  - Impact: 90% — additive, no breaking changes
- **Acceptance:**
  - Each topic has: title, description, imageAlt
  - Follows existing translation file patterns

### TASK-06: Add/source topic header images

- **Affects:** `apps/brikette/public/img/` (or existing image references)
- **Confidence:** 78%
  - Implementation: 85% — may need to source/create images
  - Approach: 75% — depends on available assets
  - Impact: 75% — visual quality depends on image availability
- **Acceptance:**
  - Each displayed topic has a relevant hero image
  - Images optimized (WebP/AVIF, appropriate sizes)
  - Fallback strategy if image missing

### TASK-07: Integrate GroupedGuideCollection into ExperiencesPageContent

- **Affects:** `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`
- **Confidence:** 85%
  - Implementation: 88% — replace GuideCollection with new component
  - Approach: 82% — preserve filter behavior, handle edge cases
  - Impact: 85% — significant render change, needs testing
- **Acceptance:**
  - Guides section shows grouped layout
  - Topic filtering still works (via URL params)
  - No regression in guide card functionality
  - Section has `id="guides"` for scroll anchor

### TASK-08: Test responsive behavior

- **Affects:** Visual testing across breakpoints
- **Confidence:** 90%
  - Implementation: 92% — manual + Playwright snapshot
  - Approach: 90% — standard responsive testing
  - Impact: 88% — catch layout issues before deploy
- **Acceptance:**
  - Mobile (375px): stacked layout, readable
  - Tablet (768px): transitional layout
  - Desktop (1280px): split layout, proper spacing

---

## Patterns to Follow

### Existing Component Patterns

- [ExperienceFeatureSection.tsx](apps/brikette/src/app/[lang]/experiences/ExperienceFeatureSection.tsx) — Split image+content layout
- [GuideCollection.tsx](apps/brikette/src/components/guides/GuideCollection.tsx) — Guide listing with filtering
- [GuideCollectionCard.tsx](apps/brikette/src/components/guides/GuideCollectionCard.tsx) — Individual guide cards

### Translation File Patterns

- [experiencesPage.json](apps/brikette/src/locales/en/experiencesPage.json) — Nested objects for sections

### Image Handling

- Use `CfImage` component with appropriate presets
- Support WebP/AVIF formats
- Provide meaningful alt text

---

## Risks & Mitigations

| Risk                                  | Impact | Mitigation                                                      |
| ------------------------------------- | ------ | --------------------------------------------------------------- |
| Topic images not available            | Medium | Use existing terrace/panorama images as fallbacks; source later |
| Grouped layout increases page height  | Low    | Each group is scannable; users can jump via topic links         |
| Filter behavior unclear with grouping | Medium | When filter active, show only matching group (or flat list)     |
| Translation burden for other locales  | Medium | Start with English only; mark other locales for translation     |

---

## Acceptance Criteria (Overall)

- [ ] Intro copy delivers the point in first 2 sentences
- [ ] Word count 40-70 words (excluding heading)
- [ ] Scroll nudge visible and functional
- [ ] Guides grouped by experience type
- [ ] Each group has visual header (image + title)
- [ ] Responsive layout works on mobile and desktop
- [ ] No regression in guide filtering
- [ ] No regression in guide card links/CTAs

---

## Decisions (Confirmed)

| Decision                  | Choice                                                                      |
| ------------------------- | --------------------------------------------------------------------------- |
| Intro copy variant        | **Variant B** — warm/personal, 62 words ("Local know-how for your Amalfi days") |
| Small topics (<3 guides)  | **"More Guides" catchall** section for transport, photography, culture      |
| Topic images              | **Source stock/new images** during implementation                           |

---

## File Summary

| File                                                                  | Action                                |
| --------------------------------------------------------------------- | ------------------------------------- |
| `apps/brikette/src/locales/en/experiencesPage.json`                   | Modify (intro + topic headers)        |
| `apps/brikette/src/app/[lang]/experiences/ExperiencesHero.tsx`        | Modify (add scroll nudge)             |
| `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx` | Modify (integrate grouped collection) |
| `apps/brikette/src/components/guides/GroupedGuideSection.tsx`         | **Create**                            |
| `apps/brikette/src/components/guides/GroupedGuideCollection.tsx`      | **Create**                            |
| `apps/brikette/public/img/topics/`                                    | Add images (or reference existing)    |
