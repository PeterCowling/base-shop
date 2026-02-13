---
name: lp-design-spec
description: Translate a feature requirement into a concrete frontend design specification mapped to the design system, theme tokens, and per-business brand language. Sits between fact-find and plan.
---

# Design Spec

Produce a design specification that maps a feature requirement to concrete design-system components, semantic tokens, and layout decisions — grounded in the business's brand language. Feeds directly into `/lp-plan` to raise confidence on UI tasks.

## Operating Mode

**ALLOWED:** Read codebase, read docs, read theme tokens, create/update design spec docs, create/update brand language docs.
**NOT ALLOWED:** Write application code, modify components, change tokens, run builds. Design only — implementation is `/lp-build`'s job.

## When to Use

- New page, section, or significant UI component
- Visual refresh or rebrand work
- Any feature where fact-find flags `Design-Spec-Required: yes`
- When `/lp-plan` produces low-confidence UI tasks (design decisions unmade)
- Standalone brand language bootstrapping for a new business

## Invocation

### Fast Path

```
/lp-design-spec <feature-slug>
```

Expects `docs/plans/<feature-slug>-fact-find.md` to exist. Reads it, resolves the business unit, loads brand language, and begins spec creation.

### Discovery Path

```
/lp-design-spec
```

No argument — presents the app-to-business mapping and asks what you're designing for.

### Brand Bootstrap Mode

```
/lp-design-spec --bootstrap <BIZ-CODE>
```

Creates or updates the brand language doc for a business unit without producing a feature design spec. Use when onboarding a new business or after a brand pivot.

## Inputs

| Source | Path | Purpose |
|--------|------|---------|
| Business registry | `docs/business-os/strategy/businesses.json` | Resolve app → business unit → theme package |
| Brand language | `docs/business-os/strategy/<BIZ>/brand-language.user.md` | Per-business visual identity, tone, audience |
| Theme tokens | `packages/themes/<theme>/src/tokens.ts` | Concrete token values for the target app |
| Base tokens | `packages/themes/base/src/tokens.ts` | Default token system (overridden by theme) |
| Design system handbook | `docs/design-system-handbook.md` | Component catalog, atomic design layers |
| Token reference | `.claude/skills/lp-design-system/SKILL.md` | Quick-reference for token classes |
| Typography & color | `docs/typography-and-color.md` | Font model, HSL system, dark mode |
| Fact-find (optional) | `docs/plans/<slug>-fact-find.md` | Feature context, audience, requirements |

### App-to-Business Resolution

Use `businesses.json` to resolve which business owns the target app, then locate:
1. **Brand language doc**: `docs/business-os/strategy/<BIZ>/brand-language.user.md`
2. **Theme package**: `packages/themes/<theme>/` (mapped from app name)
3. **Strategy context**: `docs/business-os/strategy/<BIZ>/plan.user.md`

**Current mapping:**

| Business | Code | Apps | Theme Package |
|----------|------|------|---------------|
| Brikette | BRIK | brikette, prime, reception | `base` (brikette), `prime` (prime) |
| Headband | HEAD | cochlearfit | _(needs creation)_ |
| Pet Product | PET | _(none yet)_ | _(needs creation)_ |
| Handbag Accessory | HBAG | cover-me-pretty | _(TBD)_ |
| XA | XA | xa | _(TBD)_ |
| Platform | PLAT | design-system, storybook, etc. | `base` |

**When theme package doesn't exist:** Note this in the spec as a prerequisite task for `/lp-plan`.

## Workflow

### Step 0: Context Resolution

1. **Identify the target app** from the feature slug, fact-find, or user input.
2. **Resolve business unit** via `businesses.json`.
3. **Load brand language** doc. If it doesn't exist:
   - Ask: _"No brand language exists for {BIZ}. Create one now (recommended) or proceed without?"_
   - If yes → run **Brand Bootstrap** (Step 6) first, then return here.
   - If no → proceed using base design system defaults only. Note this as a risk.
4. **Load theme tokens** for the target app's theme package.
5. **Load fact-find** if a feature slug was provided.

### Step 1: Audience and Intent

Extract from brand language + fact-find:

- **Who sees this?** Target demographic, device context, usage scenario.
- **What feeling?** Brand personality (from brand language `## Voice & Tone`).
- **What action?** Primary CTA or user goal for this feature.
- **Where in the app?** Navigation context — is this a new page, a section in an existing page, a modal, a flow?

If any of these are unclear, ask the user. Do not assume.

### Step 2: Current State Audit (Modification Only)

Skip this step for net-new pages/components.

For modifications to existing UI:
1. **Read the current component(s)** being modified.
2. **Identify existing patterns**: layout structure, component choices, token usage.
3. **Flag violations**: arbitrary values, hardcoded colors, missing dark mode, accessibility gaps.
4. **Note reusable elements**: what should be preserved vs. replaced.

### Step 3: Component Map

Using the three-tier architecture (`@acme/design-system` → `@acme/ui` → app-level):

1. **List existing components** that can be reused for this feature.
   - Search `packages/design-system/src/` for primitives/atoms/molecules.
   - Search `packages/ui/src/` for domain components.
   - Search the target app's `src/components/` for app-specific components.
2. **Identify gaps** — components that don't exist yet.
3. **Decide layer** for new components:
   - Pure presentation, no domain logic → `@acme/design-system`
   - Domain-specific (e-commerce, booking, etc.) → `@acme/ui`
   - App-specific, unlikely to be shared → app-level `src/components/`

Output a component tree showing the composition hierarchy.

### Step 4: Token Binding

For each visual property in the design, specify the exact semantic token:

| Property | Token | Value (from theme) | Rationale |
|----------|-------|---------------------|-----------|
| Primary action bg | `bg-primary` | `hsl(6 78% 57%)` | Brand coral per brand language |
| Body text | `text-foreground` | (from base) | Default readable text |
| Card surface | `bg-card` | (from base) | Standard card pattern |
| ... | ... | ... | ... |

**Rules:**
- Every color must map to a semantic token. No hex, no Tailwind palette colors.
- Reference `lp-design-system` skill for the canonical token list.
- If a needed token doesn't exist, document it as a prerequisite (new token to add to theme package).
- Dark mode: verify every chosen token has a dark variant. Flag gaps.

### Step 5: Layout and Behavior

Define:

1. **Layout skeleton** — CSS Grid/Flexbox structure with responsive breakpoints.
   - Mobile-first. Specify `md:` and `lg:` breakpoint changes.
   - Use design system spacing tokens only (`gap-4`, `p-6`, etc.).
2. **Interaction states** — hover, active, disabled, loading, error, empty.
   - Map each state to token classes (e.g., `hover:bg-primary-hover`).
3. **Accessibility** — WCAG AA minimum:
   - Focus order (tab sequence).
   - ARIA roles/labels for non-standard elements.
   - Contrast compliance (note if any token combinations need checking).
   - Touch target sizes (`min-h-11 min-w-11` for interactive elements).
4. **Animation** — only if required. Use `motion-safe:` prefix. Respect `prefers-reduced-motion`.

### Step 6: Brand Bootstrap (when brand language doc is missing)

When creating a new brand language doc for a business:

1. **Gather inputs:**
   - Read `docs/business-os/strategy/<BIZ>/plan.user.md` for business context.
   - Read any existing launch forecast (`*-launch-forecast*.user.md`) for demographic data.
   - Read existing theme tokens if a theme package exists.
   - Read the app's current UI (layout.tsx, key pages) for implicit brand choices.

2. **Create** `docs/business-os/strategy/<BIZ>/brand-language.user.md` using the template from `.claude/skills/_shared/brand-language-template.md`.

3. **Fill in what's known**, mark unknowns with `TBD — {what's needed to resolve}`.

4. **Present to user** for review before proceeding.

### Step 7: Write Design Spec

Create `docs/plans/<feature-slug>-design-spec.md` using the template below.

### Step 8: Brand Language Feedback Loop

After completing the spec, check if any design decisions made during this spec should feed back into the brand language doc:

- **New pattern established** (e.g., "cards in this app always use `rounded-lg shadow-sm`") → add to brand language `## Signature Patterns`.
- **Token gap filled** (e.g., new token added for this business) → update brand language `## Token Overrides`.
- **Audience insight** (e.g., fact-find revealed new demographic data) → update brand language `## Audience`.

Only update with decisions that are **stable and reusable**, not one-off feature specifics.

## Design Spec Template

```markdown
---
Type: Design-Spec
Status: Draft
Feature-Slug: {slug}
Business-Unit: {BIZ}
Target-App: {app-name}
Theme-Package: {theme-package}
Brand-Language: docs/business-os/strategy/{BIZ}/brand-language.user.md
Created: {DATE}
---

# Design Spec: {Feature Title}

## Context

**Business:** {business name} ({BIZ})
**App:** {app name}
**Audience:** {from brand language}
**Device:** {mobile-only | responsive | desktop-first}

**Feature goal:** {one sentence — what the user accomplishes}

**Fact-find:** `docs/plans/{slug}-fact-find.md` _(or "standalone spec")_

## Visual Intent

{2-3 sentences describing the desired look and feel, referencing brand language personality and any specific inspiration. Not a mockup — a north star for implementation decisions.}

## Component Map

### Reused Components

| Component | Package | Usage |
|-----------|---------|-------|
| `Button` | `@acme/design-system` | Primary CTA |
| ... | ... | ... |

### New Components Needed

| Component | Target Package | Rationale |
|-----------|---------------|-----------|
| `{Name}` | `{package}` | {why it doesn't exist yet} |

### Composition Tree

```
PageLayout
├── Header (existing)
├── {SectionName}
│   ├── {Component}
│   │   ├── {Child}
│   │   └── {Child}
│   └── {Component}
└── Footer (existing)
```

## Token Binding

| Element | Property | Token Class | Dark Mode | Notes |
|---------|----------|-------------|-----------|-------|
| Page bg | background | `bg-background` | auto | |
| Primary CTA | background | `bg-primary` | auto | Brand: {color description} |
| ... | ... | ... | ... | ... |

**New tokens required:**
- _{none, or list with rationale}_

## Layout

### Mobile (default)
{Description or ASCII sketch of mobile layout}

### Tablet (`md:` 768px+)
{Changes from mobile}

### Desktop (`lg:` 1024px+)
{Changes from tablet}

**Spacing:** {key spacing decisions, e.g., "section padding: p-6, card gap: gap-4"}

## Interaction States

| Element | Hover | Active | Disabled | Loading | Error |
|---------|-------|--------|----------|---------|-------|
| Primary CTA | `hover:bg-primary-hover` | `active:bg-primary-active` | `opacity-50 cursor-not-allowed` | spinner | - |
| ... | ... | ... | ... | ... | ... |

## Accessibility

- **Focus order:** {tab sequence description}
- **ARIA:** {roles, labels, live regions needed}
- **Contrast:** {any combinations to verify}
- **Touch targets:** All interactive elements `min-h-11 min-w-11`
- **Screen reader:** {any visually-hidden text needed}

## Prerequisites for Plan

- [ ] Brand language doc exists: `docs/business-os/strategy/{BIZ}/brand-language.user.md`
- [ ] Theme package exists: `packages/themes/{theme}/`
- [ ] All required tokens exist (see "New tokens required" above)
- [ ] All reused components verified in component catalog

## Notes

{Any open questions, alternatives considered, or links to reference implementations}
```

## Quality Checks

- [ ] Every color references a semantic token — zero arbitrary values
- [ ] Component map distinguishes reused vs. new, with correct package layer
- [ ] Layout specifies all three breakpoints (mobile, tablet, desktop)
- [ ] Dark mode addressed for every token binding
- [ ] Accessibility section is non-empty with concrete ARIA/focus/contrast items
- [ ] Brand language doc consulted (or bootstrapped)
- [ ] Token bindings match actual values in theme package (not invented)
- [ ] Prerequisites list is complete — no hidden assumptions for `/lp-plan`

## Integration

### With `/lp-fact-find`

When a fact-find classifies a feature as UI-heavy, it should add to its output:

```yaml
Design-Spec-Required: yes
```

This signals that `/lp-design-spec` should run before `/lp-plan`.

### With `/lp-plan`

Plan reads the design spec and uses it to:
- Pre-populate `Affects` lists with component file paths from the component map
- Set higher confidence on UI tasks (design decisions already made)
- Create concrete validation contracts referencing the spec's token bindings
- Generate prerequisite tasks for missing tokens or components

### With `/lp-build`

During build, the design spec serves as a reference:
- Exact token classes to use (no guessing)
- Component composition tree to follow
- Accessibility requirements to implement and test

### With Brand Language Docs

**Reads from:** `docs/business-os/strategy/<BIZ>/brand-language.user.md`
**Writes back to:** Same file, when stable new patterns emerge (Step 8).

This creates a virtuous cycle: each design spec strengthens the brand language, which makes future specs faster and more consistent.

## Hand-off Messages

### Spec Complete (has fact-find)

> Design spec complete: `docs/plans/{slug}-design-spec.md`
>
> **Component map:** {N} reused, {M} new components needed.
> **Prerequisites:** {list any blockers for plan}.
>
> Ready for `/lp-plan {slug}`. The plan should reference this spec for UI task confidence.

### Spec Complete (standalone)

> Design spec complete: `docs/plans/{slug}-design-spec.md`
>
> This is a standalone spec (no fact-find). To proceed:
> 1. `/lp-fact-find {slug}` — if the feature needs broader investigation
> 2. `/lp-plan {slug}` — if scope is clear and you want to go straight to planning

### Brand Bootstrap Complete

> Brand language created: `docs/business-os/strategy/{BIZ}/brand-language.user.md`
>
> **Status:** {N} sections complete, {M} marked TBD.
> Review the doc and fill in TBD items before using it for design specs.

## Red Flags (Invalid Run)

1. Spec contains arbitrary color values (`[#hex]`, `bg-red-500`, etc.)
2. Component map places domain components in `@acme/design-system`
3. No accessibility section or "N/A" without justification
4. Brand language not consulted and no explicit opt-out rationale
5. Token bindings reference tokens that don't exist in the theme package without noting them as prerequisites
6. Layout section missing responsive breakpoints
