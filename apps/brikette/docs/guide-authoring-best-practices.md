# Guide Authoring Best Practices

## Overview

This document provides editorial patterns and technical guidelines for authoring travel guides in the Brikette system. Following these practices ensures consistent cross-referencing, correct link formatting, and discoverable content.

## Related Guides (Cross-Referencing)

### How Related Guides Work

When you add guide keys to `manifest.relatedGuides` in `guide-manifest.ts`, they automatically render in the "Other relevant guides" footer section. You don't need to declare a `relatedGuides` block—the system applies it by default.

```typescript
// Example from guide-manifest.ts
{
  key: "positanoMainBeach",
  title: "Positano's Main Beach",
  relatedGuides: ["positanoBeaches", "fornilloBeachGuide", "arrivingByFerry"],
  // ... other fields
}
```

### Curation Guidelines

For each guide, pick **2–6** related guides that match one of these intents:

1. **Overview** — "See all X" / "Start here" guide
2. **Next step** — What a user will do immediately after reading
3. **Alternative** — A comparable option (bus vs walk; beach A vs beach B)
4. **Return journey** — Outbound guides should link to return guides where applicable
5. **Prerequisite** — Tickets, timing, booking, safety, seasonal constraints

**Avoid:**
- Linking to everything (creates noise)
- Linking to `draftOnly` guides from live guides (validation will catch this)
- Self-references (validation will catch this)

### Patterns by Guide Type

Use these starting patterns to reduce editorial guesswork:

#### Beach Guide
- Beaches overview guide ("Compare beaches")
- Primary "get there" guides (walk + bus) from the hostel
- Primary "get back" guides (walk + bus) to the hostel
- One "nearby/alternative beach" guide

**Example:**
```typescript
relatedGuides: [
  "positanoBeaches",         // overview
  "briketteToMainBeach",     // get there (walk)
  "mainBeachToBrikette",     // get back
  "fornilloBeachGuide"       // alternative beach
]
```

#### Directions / Route Guide (A → B)
- Destination guide (what to do once you arrive)
- Return guide (B → A) if it exists
- One alternative route (walk vs bus vs ferry) when relevant
- An overview hub (e.g., "How to get here" / "Getting around")

**Example:**
```typescript
relatedGuides: [
  "positanoMainBeach",       // destination
  "mainBeachToBrikette",     // return journey
  "chiesaNuovaToBrikette",   // alternative route
  "gettingToPositano"        // overview hub
]
```

#### Overview / Hub Guide
- The top 5–10 leaf guides it summarizes
- One "start here" guide and one "planning" guide (tickets/seasonality)

**Note:** Keep the related block small; use inline links (see below) to deepen coverage within the content.

#### Experience / Activity Guide
- Where it happens (beach/town/attraction guide)
- How to get there (directions guide)
- An alternative similar experience (optional)

### Reciprocity

The coverage report (`pnpm report-coverage`) warns about missing reciprocals. If guide A links to guide B, consider whether B should link back to A. Not all relationships are symmetric (overview guides often don't reciprocate), but directional guides (outbound/return) should be reciprocal.

## Inline Links

### When to Use %LINK: Tokens

Use inline `%LINK:` tokens sparingly to provide contextual navigation:

- **At decision points**: "If ferries stop, %LINK:pathOfTheGodsBus|take the bus instead%."
- **Where details are omitted**: "See our %LINK:ticketingGuide|complete ticketing guide% for booking details."
- **For comparisons**: "Unlike %LINK:fornilloBeach|Fornillo Beach%, the main beach has beach clubs."

**Recommended frequency:** 2-5 inline links per guide. More than this creates visual noise.

### Syntax

```
%LINK:guideKey|link text%
```

The draft editor's link picker inserts these tokens safely. The system validates tokens at build time.

**Example:**
```markdown
Walk from the ferry dock up the stepped promenade to Piazza dei Mulini
(%LINK:ferryDockToBrikette|full walking directions%).
```

## Google Maps Links

### When to Include Maps Links

Include a Google Maps link in any guide that provides directions or describes a route:
- Walk guides
- Bus/ferry directions
- Beach access routes
- Hiking trails

### URL Format (api=1 Standard)

Use the `api=1` URL format for consistent, stable links that work across devices:

#### Directions (Most Common)
```
https://www.google.com/maps/dir/?api=1&origin=ORIGIN&destination=DESTINATION&travelmode=MODE
```

**Parameters:**
- `origin`: Starting point (address, coordinates, or place name)
- `destination`: End point (address, coordinates, or place name)
- `travelmode`: `walking`, `transit`, `driving`, or `bicycling`

**Example:**
```
https://www.google.com/maps/dir/?api=1&origin=Hostel+Brikette,Positano&destination=Positano+Main+Beach&travelmode=walking
```

#### Search (Single Location)
```
https://www.google.com/maps/search/?api=1&query=QUERY
```

**Example:**
```
https://www.google.com/maps/search/?api=1&query=Bar+Internazionale+Positano
```

#### Coordinates
Use coordinates for precise locations:
```
https://www.google.com/maps/dir/?api=1&origin=40.6296,14.4808&destination=40.6277,14.4879&travelmode=walking
```

### Label Conventions

Use consistent labels when linking to maps:

- **Walking routes**: "Google Maps walking route"
- **Transit routes**: "Google Maps transit route"
- **Driving routes**: "Google Maps driving route"
- **Single locations**: "View on Google Maps"

### Token Syntax

Use `%URL:` tokens for maps links:

```
%URL:https://www.google.com/maps/dir/?api=1&origin=Hostel+Brikette&destination=Main+Beach&travelmode=walking|Google Maps walking route%
```

**Real example from arrivingByFerry.json:**
```json
"Follow %URL:https://www.google.com/maps/dir/Positano+Spiaggia/2+Viale+Pasitea+Positano,+Campania/@40.6289096,14.4857482,18z/data=!4m14!4m13!1m5!1m1!1s0x133b976916d1a44d:0xf1e08d61658b4291!2m2!1d14.4878892!2d40.6276549!1m5!1m1!1s0x133b976f39841bc9:0x5425cf574fd9d282!2m2!1d14.4857716!2d40.6301562!3e2|these walking directions% from the Main Beach to Piazza Dei Mulini."
```

### Legacy URL Patterns

Older guides may use non-`api=1` URLs (with `/dir/` paths and encoded parameters). These still work but are harder to maintain. When updating existing guides, consider migrating to `api=1` format for consistency.

## Validation & Quality Checks

Before committing guide changes, run local validation:

### Content Schema Validation
```bash
pnpm --filter @apps/brikette validate-content
```
Validates JSON structure against Zod schemas.

### Link Token Validation
```bash
pnpm --filter @apps/brikette validate-links
```
Validates `%LINK:`, `%URL:`, and `%HOWTO:` tokens:
- Checks guide keys exist
- Validates token syntax
- Reports broken references

### Manifest Validation
```bash
pnpm --filter @apps/brikette validate-manifest
```
Validates `relatedGuides` arrays:
- All keys exist in manifest
- No duplicates
- No self-references
- Live guides don't reference draft-only guides

### Coverage Report
```bash
pnpm --filter @apps/brikette report-coverage
```
Reports on:
- Guides without related guides
- Orphan guides (no inbound links)
- Missing reciprocal links
- Inline link usage
- Google Maps URL usage

Add `--verbose` for full output or `--csv` for data export.

## Checklist for New Guides

When creating a new guide:

- [ ] Add 2-6 related guides to `manifest.relatedGuides`
- [ ] Follow guide type patterns (beach, directions, overview, experience)
- [ ] Include Google Maps link if providing directions (use `api=1` format)
- [ ] Add 2-5 inline `%LINK:` tokens at decision points
- [ ] Run `validate-content`, `validate-links`, and `validate-manifest`
- [ ] Check reciprocity: if you link to guide B, should B link back?
- [ ] Consider translation completeness (see `guide-translation-workflow.md`)

## References

- **Link token parser**: `src/routes/guides/utils/_linkTokens.tsx`
- **Related guides component**: `src/components/guides/RelatedGuides.tsx`
- **Guide manifest**: `src/routes/guides/guide-manifest.ts`
- **Validation scripts**: `scripts/validate-guide-*.ts`
- **Coverage reporting**: `scripts/report-guide-coverage.ts`
- **Translation workflow**: `docs/guide-translation-workflow.md`
- **Google Maps URLs API**: https://developers.google.com/maps/documentation/urls/get-started

## Questions or Feedback?

If you encounter edge cases or patterns not covered here, document them in this file or raise them in the team channel. These patterns evolve as we learn from guide usage analytics and user feedback.
