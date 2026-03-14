# Proposal: Design System Creative Expressiveness

**Date:** 2026-03-14
**Status:** Draft v3 — revised after second operator critique

---

## Thesis

Across the apps in this monorepo, agent-built UI repeatedly converges on the same visual formula: rounded elevated cards, token-default typography, medium padding, and `shadow-md`. Brikette diverges because it introduces theme-local assets (fonts, gradients, named colors), art-direction defaults (flat vs elevated, type contrast, spacing density), and branded recipes (`.hero-panel`, `.cta-light`, `.bg-header-gradient`) outside the shared system.

This suggests the current system is missing at least three expression layers, not one. This proposal introduces them as:

1. **Theme Assets** — fonts, gradient definitions, shadow palettes, keyframes, named brand colors
2. **Design Profile** — art-direction defaults and policies for how tokens are used
3. **Recipes** — reusable branded surface compositions and page motifs

The profile layer is the most novel addition. The asset and recipe layers formalize patterns that already exist ad-hoc in Brikette but are absent everywhere else.

### Why This Matters

Visual sameness across apps is not a cosmetic problem. It has three practical consequences:

1. **Brand credibility.** Caryina sells premium handbag accessories to women who own Gucci and LV. Its brand dossier specifies Cormorant Garamond headings, restrained pastel palette, editorial imagery. If the storefront looks like a generic SaaS dashboard with rounded cards and blue buttons, the product positioning is undermined before the customer sees a product. The same applies to Facilella (cochlear implant headbands for parents — needs to feel warm and reassuring, not clinical) and BRIK's guest portal (young female travelers — needs to feel inviting, not institutional).

2. **Operator efficiency.** When every styling request produces generic output that requires multiple revision rounds, the cost of UI work is dominated by rework. The operator spends more time rejecting and re-requesting than reviewing and approving. A system that produces brand-appropriate output on the first pass reduces the feedback loop from 3-4 rounds to 1-2.

3. **Agent capability.** The current system teaches agents that "design system compliance" means "use the same defaults everywhere." This is a learned behavior — agents that produce distinctive results get corrected by skills that enforce generic token usage. Fixing the system fixes the training signal.

---

## Phase 0: Audit and Benchmark

Before building anything, prove the problem with evidence.

### 0a. Pattern Inventory

For each app with a consumer-facing surface (brikette, caryina, reception, prime, business-os), catalogue:

| Dimension | What to capture |
|-----------|----------------|
| **Component defaults** | Which radius, shadow, border, padding values appear most frequently? |
| **Token palette usage** | Which color tokens are actually used? How many distinct colors appear? |
| **Layout conventions** | Symmetric grids, single-column, asymmetric? Consistent or varied? |
| **Typography range** | Ratio between largest heading and body text. Number of distinct type sizes used. |
| **Motion** | Which animations exist? Durations? Easing curves? |
| **Custom assets** | App-local fonts, gradients, keyframes, named colors, utility classes |
| **Recipes** | App-local component classes (`.hero-panel`, `.cta-light`, etc.) |

Classify each finding as:
- **Impossible today** — the token/component system cannot express this
- **Possible but unsystematized** — tokens exist but no default guides usage
- **Codified** — exists in a theme package or skill and is actively consumed

### 0b. Benchmark Screens

Select 3 screens per app (marketing hero, content/list page, form/dashboard). For each:
1. Screenshot at 375px and 1440px
2. Annotate: which visual choices are token-derived, which are component defaults, which are app-local
3. Score brand-fit (does this look like the brand dossier says it should?)
4. Score distinctiveness (could you tell which app this is with the logo removed?)

### 0c. Brikette Lever Classification

Reclassify the 18 Brikette-local levers into the three layers:

| Layer | Brikette examples | Count |
|-------|-------------------|-------|
| **Assets** | Franklin Gothic ATF, `--color-brand-bougainvillea`, 3-stop gradient system, `drop-shadow-brand-primary-40`, 6 keyframes, Poppins variable font | ~10 |
| **Defaults/Policy** | Flat elevation on some surfaces, 200ms transition timing, `tracking-eyebrow` letter-spacing convention, photo aspect ratio 4:3 | ~4 |
| **Recipes** | `.hero-panel` (gradient + blur + ring), `.cta-light`/`.cta-dark`, `.bg-header-gradient`, `.hero-gradient-overlay`, accordion styling | ~5 |

Determine which levers drive the most visual differentiation. Not all 18 are equally important.

### 0d. Root Cause Separation

For each instance of "generic-looking output," determine whether the cause is:

| Cause category | Test |
|----------------|------|
| **Token limitation** | Does the needed value exist in any token file? |
| **Missing default** | Could the right value be chosen from existing tokens, but nothing tells the agent which one? |
| **Missing asset** | Is a font, gradient, or animation needed that doesn't exist in the theme? |
| **Missing recipe** | Is a reusable branded composition needed? |
| **Component rigidity** | Does the component hardcode a value the profile would want to override? |
| **Skill wording** | Does the skill actively discourage the right choice? |
| **Model conservatism** | Does the agent default to safe choices even when given latitude? |

This separation matters because each cause has a different fix.

### 0e. Success Criteria

Define measurable outcomes before building:

| Metric | Measurement method | Target |
|--------|-------------------|--------|
| Brand-fit score | Operator review of benchmark screens against dossier | Improvement on 2+ apps |
| Distinctiveness | Blind A/B: "which app is this?" identification rate | >70% correct |
| Movement fidelity | Request same page in Swiss/editorial/minimalist, compare screenshots | Visually different outputs |
| Token compliance | Automated: no arbitrary hex/rgb in component code | Maintained (no regression) |
| Accessibility | Automated contrast + touch-target checks | Maintained (no regression) |

---

## Architecture: Three Layers

```
Brand Dossier (narrative creative intent)
  │
  ├─→ Theme Assets (what the brand has)
  │     fonts, gradients, shadow palettes, keyframes, named colors
  │
  ├─→ Design Profile (how the brand uses its tools)
  │     defaults, policies, art-direction parameters
  │
  └─→ Recipes (what the brand's surfaces look like)
        reusable compositions, page motifs, branded patterns
          │
          ▼
      Token Values (concrete CSS values — what exists today)
          │
          ▼
      Generated CSS + Tailwind Config
          │
          ▼
      Components (consume all of the above)
```

### Layer 1: Theme Assets (`assets.ts`)

Things the brand *has*. Concrete, named, importable.

```typescript
// packages/themes/{name}/src/assets.ts

export const assets: ThemeAssets = {
  fonts: {
    heading: {
      family: '"Franklin Gothic ATF", "Poppins", ui-sans-serif',
      source: "local",                // or "google" with URL
      weights: [400, 700],
    },
    body: {
      family: '"Poppins", ui-sans-serif, system-ui, sans-serif',
      source: "local",
      variableFont: true,
      weights: [100, 900],            // range for variable
    },
  },

  gradients: {
    hero: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "var(--color-brand-gradient-start)", position: "0%" },
        { color: "var(--color-brand-primary)", position: "100%" },
      ],
    },
    header: {
      type: "linear",
      angle: 180,
      stops: [
        { color: "var(--color-brand-gradient-start)", position: "0%" },
        { color: "var(--color-brand-gradient-mid)", position: "40%" },
        { color: "var(--color-brand-gradient-end)", position: "100%" },
      ],
    },
  },

  shadows: {
    brandPrimary10: "0 8px 20px rgba(var(--rgb-brand-primary), 0.10)",
    brandPrimary40: "0 10px 24px rgba(var(--rgb-brand-primary), 0.40)",
  },

  keyframes: {
    "fade-up": {
      from: { opacity: "0", transform: "translateY(0.5rem)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
    "slide-down": {
      from: { opacity: "0", transform: "translateY(-10%)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
  },

  // Named brand colors beyond the semantic palette
  brandColors: {
    terra: { light: "#c4572e", dark: "#ff5722" },
    bougainvillea: { light: "#9b1b33", dark: "#e85070" },
    ratingHostelworld: "#ff6a00",
    ratingBooking: "#003580",
  },
};
```

**What this replaces:** The ad-hoc font imports in `fonts.css`, hardcoded gradient stops in `global.css`, keyframe definitions in `tailwind.config.mjs`, and brand color blocks scattered across CSS and config files. Currently only Brikette has these; this layer makes them available to every theme.

**Build output:** The asset file feeds into token generation to produce CSS `@font-face`, `@keyframes`, gradient custom properties, and brand color variables.

**Themes without brand assets:** When a theme has no custom fonts, gradients, or brand colors (as is currently the case for prime, business-os, and most themes), `assets.ts` exports empty collections. The generated CSS contains no `@font-face` or `@keyframes` blocks. Components fall back to base token values (`font-sans` resolves to the base Geist Sans stack, gradients are unavailable). This is the current behavior — the asset layer doesn't change it, it just provides a structured path for adding assets when the brand is ready. An agent reading an empty `assets.ts` knows immediately: this brand has no custom fonts or gradients. That's more useful than discovering the absence by searching through CSS files.

### Layer 2: Design Profile (`design-profile.ts`)

Art-direction defaults and policies. How the brand uses its tools.

Each field is classified into one of three categories:

```typescript
// packages/themes/{name}/src/design-profile.ts

export const profile: DesignProfile = {

  // ═══════════════════════════════════════════
  // CATEGORY A: Compile-time variables
  // These emit CSS custom properties directly.
  // Validated at build time. Deterministic output.
  // ═══════════════════════════════════════════

  typography: {
    scaleRatio: 1.25,              // generates --type-{step} variables
    bodySize: "1rem",              // base font size
    bodyLeading: 1.5,              // base line-height
    bodyMeasure: "65ch",           // max-inline-size for prose
    displayWeight: 700,            // font-weight for display headings
    labelTracking: "0.05em",       // letter-spacing for labels/captions
  },

  motion: {
    durationFast: "150ms",
    durationNormal: "250ms",
    durationSlow: "400ms",
    easing: "cubic-bezier(0.2, 0, 0, 1)",
  },

  space: {
    sectionGap: "var(--space-12)",         // gap between page sections
    componentGap: "var(--space-4)",        // gap within component groups
    contentMaxWidth: "var(--size-5xl)",     // prose container max-width
    cardPadding: "var(--space-6)",          // internal card padding
  },


  // ═══════════════════════════════════════════
  // CATEGORY B: Enum-to-token mappings
  // These resolve to existing token values
  // via a mapping table in the build step.
  // Build-time validated: invalid enums are errors.
  // ═══════════════════════════════════════════

  surface: {
    defaultRadius: "md",           // → var(--radius-md)
    defaultElevation: "subtle",    // → var(--shadow-sm) | "none" | var(--shadow-md)
    defaultBorder: "subtle",       // → border-border-muted | border-border | border-border-strong | none
  },

  components: {
    buttonTone: "solid",           // → default tone prop for Button
    inputStyle: "outlined",        // → outlined | filled | underlined treatment
    tableStyle: "minimal",         // → minimal | striped | bordered
  },


  // ═══════════════════════════════════════════
  // CATEGORY C: Agent-only guidance
  // NOT compiled to CSS. Read by agents and
  // skills as decision-making heuristics.
  // See "Category C: Rationale and Fallback"
  // section below.
  // ═══════════════════════════════════════════

  guidance: {
    colorStrategy: "restrained",
    // "monochromatic" — primary + neutrals only
    // "restrained"    — primary + one accent, used sparingly
    // "expressive"    — primary + accent + warm/cool pair
    // "bold"          — full palette, multiple accent colors

    accentUsage: "spot",
    // "spot"       — accent on CTAs + 1-2 highlights only
    // "structural" — accent in headers, dividers, key UI
    // "pervasive"  — accent throughout (gradients, tints)

    whitespace: "generous",
    // "dense"     — compact, information-rich
    // "balanced"  — standard
    // "generous"  — breathing room between sections
    // "extreme"   — dramatic negative space

    gridCharacter: "asymmetric",
    // "symmetric"     — equal columns
    // "asymmetric"    — 1:2, 2:3 ratios
    // "single-column" — content-first, prose-driven

    imageRelationship: "contained",
    // "full-bleed"   — edge to edge
    // "contained"    — padded, framed
    // "overlapping"  — break grid, overlap adjacent elements

    motionPersonality: "precise",
    // "playful"  — spring-like, overshoot
    // "precise"  — ease-out, no bounce
    // "dramatic" — slow reveals, staggered entry
    // "none"     — instant (default for reduced-motion)

    displayTransform: "none",
    // "none"      — sentence case
    // "uppercase" — all caps for display text and labels
  },
};
```

### Category C: Rationale and Fallback

Category C fields are the highest-risk part of this proposal. They depend on agents reading the file, interpreting the heuristics, and making different implementation choices as a result. This is structurally similar to what brand dossiers already do — and dossiers are frequently ignored or loosely interpreted.

**Why Category C may work better than dossiers:**

1. **Structure over narrative.** A dossier says "the brand feels sophisticated, curated, feminine, confident." An agent must interpret what "sophisticated" means in CSS. A profile says `colorStrategy: "restrained"` and `accentUsage: "spot"`. The interpretation is narrower — the agent knows which dimension to constrain and how.

2. **Skill enforcement.** The `frontend-design` skill will include explicit if/then rules: "If `colorStrategy` is `restrained`, do not use accent color on more than 2 elements per page." This is a checkable instruction, not a personality adjective.

3. **Smaller decision space.** Each Category C field has 3-5 valid values. Dossier personality has unbounded interpretation.

**However, this is unproven.** The structural argument is plausible but not demonstrated.

**Phase 3 exit criterion for Category C:** During the eval round, score Category C compliance for each benchmark screen:
- For each Category C field, check whether the agent's output is consistent with the guidance value
- If Category C compliance is below 60% across benchmark screens (i.e., agents ignore guidance more often than they follow it), then:
  - **Option A:** Promote the highest-impact Category C fields to Category B (find a way to compile them to CSS). For example, `colorStrategy: "monochromatic"` could generate a CSS layer that hides accent-color utilities.
  - **Option B:** Replace Category C with a prescriptive recipe system — instead of "use restrained color," provide a recipe for "restrained card" that the agent applies directly.
  - **Option C:** Accept that agent-only guidance at this granularity does not work and remove Category C, relying on Categories A and B plus recipes.

The point of Phase 3 is to answer this question before investing in compilation (Phase 4).

### Precedence Model

When sources disagree, this order applies (highest priority first):

| Priority | Source | Example |
|----------|--------|---------|
| 1 | **Page-level design spec** | `/lp-design-spec` output for a specific feature |
| 2 | **Surface mode** (see below) | `mode: "marketing"` overrides baseline profile |
| 3 | **Design profile** | Theme-level defaults and policies |
| 4 | **Theme assets** | Available fonts, gradients, colors |
| 5 | **Component API defaults** | Button default tone, radius prop |
| 6 | **Brand dossier** | Narrative direction (informational, not binding on implementation) |
| 7 | **Base tokens** | Fallback values |

**Simplified version for skill documentation:** In practice, agents will encounter two common conflicts, not seven:

1. **Profile vs component default** (priorities 3 vs 5): Profile wins. If the profile says `defaultRadius: "sm"` and the component defaults to `rounded-lg`, use `rounded-sm`.
2. **Design spec vs profile** (priorities 1 vs 3): Spec wins. If a design spec for a specific page says "use large radius for this card," that overrides the profile's `defaultRadius: "sm"`.

The full precedence table lives in architecture docs. The skill documentation presents only the two-rule version:

> **Rule 1:** Profile overrides component defaults.
> **Rule 2:** Design spec overrides profile.
> When in doubt, the more specific source wins.

### Surface Modes

A single profile per theme is too coarse. Brands need different art-direction for different surface types.

```typescript
export const profile: DesignProfile = {
  // ... baseline defaults above ...

  modes: {
    marketing: {
      // Override baseline for landing pages, hero sections
      typography: { scaleRatio: 1.5, displayWeight: 300 },
      guidance: { whitespace: "extreme", imageRelationship: "full-bleed" },
    },
    editorial: {
      // Override for content pages, guides, blog
      typography: { bodyMeasure: "60ch", scaleRatio: 1.333 },
      guidance: { gridCharacter: "single-column", whitespace: "generous" },
    },
    operations: {
      // Override for staff/admin interfaces
      space: { sectionGap: "var(--space-6)", cardPadding: "var(--space-3)" },
      surface: { defaultElevation: "flat", defaultBorder: "defined" },
      guidance: { whitespace: "dense", colorStrategy: "restrained" },
    },
    campaign: {
      // Override for time-limited promotional surfaces
      guidance: { colorStrategy: "bold", accentUsage: "pervasive", motionPersonality: "dramatic" },
    },
  },
};
```

The mode merges over the baseline — unspecified fields inherit from baseline.

**Mode selection: who decides and how.**

Mode is determined at three levels, in priority order:

1. **Design spec (explicit).** The `lp-design-spec` template includes a required `Surface-Mode` field. When a design spec exists for the feature, its mode is authoritative. The operator sets it when reviewing the spec.

2. **Route convention (structural).** Apps can map route patterns to modes in their config. This provides a stable default without requiring a design spec for every page:
   ```typescript
   // Example route-to-mode mapping (app-level config)
   const routeModes: Record<string, SurfaceMode> = {
     "/": "marketing",
     "/guides/*": "editorial",
     "/book/*": "marketing",
     "/admin/*": "operations",
     "/campaigns/*": "campaign",
   };
   ```
   This is optional. Apps without route mappings use the baseline profile everywhere.

3. **Agent inference (fallback).** When no design spec exists and no route mapping applies, the agent selects a mode based on content type. The `frontend-design` skill provides criteria:
   - **marketing:** Hero sections, landing pages, conversion-focused flows, above-fold CTAs
   - **editorial:** Long-form content, guides, blogs, documentation
   - **operations:** Dashboards, admin panels, data tables, staff-facing tools
   - **campaign:** Time-limited promotions, seasonal pages, launch announcements

   The agent states which mode it selected and why. If the operator disagrees, they specify the correct mode and the agent rebuilds.

### Layer 3: Recipes (`recipes.ts`)

Reusable branded surface compositions. Named patterns that combine assets, tokens, and profile defaults into concrete CSS.

```typescript
// packages/themes/{name}/src/recipes.ts

export const recipes: ThemeRecipes = {
  heroPanel: {
    description: "Primary hero surface with gradient, blur, and subtle ring",
    applicableModes: ["marketing", "campaign"],
    base: {
      classes: "rounded-2xl p-6 md:p-8 backdrop-blur-sm ring-1 ring-white/20",
      css: {
        backgroundImage: "linear-gradient(135deg, var(--gradient-hero-from) 0%, var(--color-primary) 100%)",
        opacity: "0.96",
      },
    },
    variants: {
      dark: {
        css: { opacity: "1" },
      },
      compact: {
        classes: "rounded-xl p-4 md:p-6 backdrop-blur-sm ring-1 ring-white/20",
      },
    },
    responsive: {
      "md": { classes: "p-8" },
    },
    usage: "Full-width hero sections, above-fold CTAs",
    doNotUseWhen: "Content-heavy pages where the gradient competes with readability",
  },

  ctaLight: {
    description: "Secondary CTA pill on dark backgrounds",
    applicableModes: ["marketing", "campaign"],
    base: {
      classes: "rounded-full px-6 py-2.5 bg-brand-secondary text-brand-on-accent font-medium transition-opacity",
      hover: "hover:opacity-90",
    },
    usage: "Header nav, secondary actions on gradient backgrounds",
    doNotUseWhen: "Light backgrounds where the secondary color lacks contrast",
  },

  contentSection: {
    description: "Standard content section with profile-derived spacing",
    applicableModes: ["editorial", "marketing"],
    base: {
      classes: "mx-auto",
      css: {
        paddingInline: "var(--profile-space-page-margin, var(--space-6))",
        maxInlineSize: "var(--profile-content-max-width, var(--size-5xl))",
        paddingBlock: "var(--profile-section-gap, var(--space-12))",
      },
    },
    usage: "All page sections on content/marketing surfaces",
  },
};
```

**How recipes handle complexity:**

| Question | Answer |
|----------|--------|
| When to use a recipe vs compose from tokens? | Agents check `recipes.ts` first. If a recipe matches the surface being built (via `applicableModes` and `usage`), use it. If no recipe fits, compose from profile defaults and tokens. Good compositions that emerge can be promoted to recipes afterward. |
| Recipe conflicts with profile? | Recipes are pre-composed with profile values in mind. `contentSection` references `var(--profile-section-gap)` — it adapts when the profile changes. If a recipe hardcodes a value that contradicts the profile (e.g., `rounded-2xl` when profile says `defaultRadius: "sm"`), the recipe is intentional — it represents a branded exception. Recipes are more specific than profile defaults, so they win. |
| Can recipes reference other recipes? | No. Recipes are flat — each is self-contained. Composition happens at the component/page level, not within recipe definitions. This keeps recipes simple to reason about and avoids a dependency graph. |
| Dark mode, responsive, state variants? | Recipes support a `variants` map (dark, compact, etc.) and a `responsive` map for breakpoint-specific overrides. The `hover` field handles hover state. This covers the 80% case. Complex conditional logic (state machines, dynamic data-driven styling) belongs in components, not recipes. |
| How does an agent apply a recipe? | By reading the `classes` and `css` fields and applying them to the element. Recipes are not generated utility classes at Phase 1 — they're reference data. At Phase 5, the build system can optionally generate utility classes from them. |

**Recipe growth model:** Recipes start sparse. Most themes will have 0-3 recipes at Phase 1. As agents build pages and produce good compositions, the operator promotes successful patterns to recipes. This is the same way Brikette's recipes emerged — `.hero-panel` was written once for a specific page, then reused. The difference is that recipes become discoverable and theme-scoped instead of buried in `global.css`.

---

## What Currently Works vs What's Missing

From the Phase 0 root-cause separation, here is a preliminary classification. The audit will validate or revise this.

| Capability | Current state | Missing layer |
|------------|--------------|---------------|
| "Use no shadows" | **Possible:** `shadow-none` exists | **Default** — nothing tells the agent to prefer it |
| "Use small radius" | **Possible:** `rounded-sm` exists | **Default** — component hardcodes `rounded-lg` |
| "Use restrained color" | **Possible:** just use `primary` + neutrals | **Guidance** — skill says "use semantic tokens" but doesn't say "only two" |
| "Use flat surfaces" | **Possible:** omit shadow, use `bg-bg` | **Default** — components add shadow by convention |
| "Use editorial type scale" | **Partially possible:** `text-xs` through `text-5xl` exist | **Asset** — the ratio/relationship between sizes is not encoded |
| "Use asymmetric grid" | **Possible:** Tailwind grid utilities exist | **Guidance** — nothing suggests when to use `grid-cols-[2fr_1fr]` |
| "Use brand gradient" | **Impossible in most apps:** only Brikette defines gradients | **Asset** — gradient definitions don't exist per-theme |
| "Use custom heading font" | **Impossible in most apps:** only Brikette/Caryina have custom fonts | **Asset** — font definitions don't exist per-theme |
| "Use branded hero composition" | **Impossible in most apps:** only Brikette has `.hero-panel` | **Recipe** — branded surface compositions don't exist per-theme |
| "Use brand-colored shadow" | **Impossible in most apps:** only Brikette defines them | **Asset** — shadow palettes don't exist per-theme |

The right column shows that the fix is distributed across all three layers, not concentrated in one. The "Possible but unsystematized" rows (top 6) are the ones where the current system has the tools but lacks the defaults and guidance. The "Impossible" rows (bottom 4) require new assets or recipes.

---

## Changes to Agent Skills

### `frontend-design` Skill — Profile, Assets, and Recipes as Inputs

The current skill says "be bold" then restricts every lever. The revised skill would:

**Keep the hard rules for:**
- No arbitrary hex/rgb colors in component JSX (use theme assets or tokens)
- Accessibility minimums (contrast, touch targets, focus indicators)
- Use `cn()` for class merging
- Mobile-first responsive

**Revise the hard rules for:**
- Spacing: use profile-derived section/component gaps, not hardcoded `p-4`
- Radius: use profile default radius, not always `rounded-lg`
- Shadows: use profile elevation level, not always `shadow-md`
- Fonts: use theme asset fonts, not always `font-sans`

*Note: arbitrary values remain disallowed in component code. But theme-authorized values from profile/assets are not arbitrary — they are design decisions codified at the theme level.*

**Add new sections:**

1. **Profile loading** — before building, read `design-profile.ts` for the target theme
2. **Asset awareness** — check `assets.ts` for available gradients, shadows, keyframes, brand colors
3. **Recipe catalogue** — check `recipes.ts` for branded compositions before inventing new ones
4. **Surface mode selection** — pick the right mode using the criteria above; state the choice
5. **Style movement translation** — when the user requests a movement, map it to profile + mode settings

**Simplified precedence (for skill text):**

> **Rule 1:** Profile overrides component defaults.
> **Rule 2:** Design spec overrides profile.
> When in doubt, the more specific source wins.

### `tools-design-system` Skill — Profile-Aware Defaults

Add a section that makes profile values authoritative over generic examples:

- If `defaultElevation: "flat"` → do not add shadow classes unless the design spec overrides
- If `defaultBorder: "none"` → do not add border classes to cards
- If `defaultRadius: "sm"` → use `rounded-sm`, not `rounded-lg`
- If `colorStrategy: "monochromatic"` → do not use accent token

### `lp-design-spec` Skill — Profile and Mode in Context

Add to context resolution:
- Load design profile for the target theme
- Load theme assets for available fonts/gradients/colors
- Load recipe catalogue for existing branded compositions

Add to the design spec template:
- `Surface-Mode` field (**required**)
- "Design Character" section populated from profile
- "Available Assets" section listing theme fonts, gradients, brand colors
- "Applicable Recipes" section listing relevant branded compositions

---

## Implementation Phases

### Phase Dependency Diagram

```
Phase 0 (audit)
  │
  ├─→ Phase 1 (schema + data)  ──┐
  │                                ├─→ Phase 3 (eval round 1)
  └─→ Phase 2 (skill updates)  ──┘         │
                                            │
                              ┌─────────────┤
                              ▼             ▼
                   Phase 4 (profile     Phase 5 (asset
                   compilation +        compilation +
                   components)          recipes)
                              │             │
                              └──────┬──────┘
                                     ▼
                              Phase 6 (Brikette
                               migration)
                                     │
                                     ▼
                              Phase 7 (eval
                               round 2)
```

- Phases 1 and 2 are **independent** and can run in parallel after Phase 0
- Phase 3 **gates** Phases 4 and 5 (eval before investing in compilation)
- Phases 4 and 5 are **independent** and can run in parallel
- Phase 6 **depends on** both 4 and 5
- Phase 7 follows Phase 6

### Phase 0: Audit and Benchmark (no code changes)

Deliverables:
1. Pattern inventory per app (component defaults, token usage, layout conventions, type range, motion, custom assets, recipes)
2. Benchmark screenshots (3 screens x 5 apps, annotated)
3. Brikette lever classification (asset / default / recipe)
4. Root cause separation per "generic output" instance
5. Success criteria table with measurement methods

**Exit criterion:** Operator reviews audit and confirms the problem decomposition. Adjusts scope of Phases 1-7 based on findings.

### Phase 1: Schema + First Profiles (small — data files only)

1. Define TypeScript interfaces: `ThemeAssets`, `DesignProfile` (with category A/B/C classification), `ThemeRecipes`
2. Create `assets.ts` for base theme (empty collections — base has no brand assets, but the file documents the absence)
3. Create `design-profile.ts` for base theme (neutral defaults, no modes)
4. Create `recipes.ts` for base theme (empty — base has no branded compositions)
5. Create all three files for `caryina` theme (richest brand dossier, cleanest token integration)
6. Create all three files for `reception` theme (operational character is clear, has shade color assets)

No build system changes. No CSS generation.

*Note: Phase 1 delivers the data. Phase 2 makes agents aware of it. Both are needed for agent behavior to change — the claim is not that Phase 1 alone improves output.*

### Phase 2: Agent Skill Updates (small — markdown only)

Can run in parallel with Phase 1.

1. Update `frontend-design` skill with profile/asset/recipe loading instructions
2. Update `tools-design-system` skill with profile-aware defaults
3. Update `lp-design-spec` skill with profile, mode, and recipe awareness (including required `Surface-Mode` field)
4. Add style movement translation table to `frontend-design`
5. Add simplified two-rule precedence to skill text

### Phase 3: Eval Round 1 (no code changes)

Run the evaluation harness defined in Phase 0:
1. Same benchmark screens, rebuilt with profile-aware agents
2. Screenshot comparison (before/after)
3. Score brand-fit and distinctiveness
4. Score movement fidelity (request Swiss/editorial/minimalist for same page)
5. Check accessibility (no regression)
6. **Score Category C compliance** — for each guidance field, did the agent's output follow it?

**Exit criteria:**
- Measurable improvement on 2+ apps → proceed to Phase 4
- Category C compliance below 60% → trigger fallback (promote to Category B, replace with recipes, or remove — see "Category C: Rationale and Fallback" above)
- No measurable improvement → diagnose whether the problem is profile content, skill wording, or model behavior; adjust before proceeding

### Phase 4: Profile Compilation + Component Adaptation (medium-large)

Only proceed if Phase 3 shows the profile data is being used effectively.

**4a. Build system extension:**
1. Extend `build-tokens.ts` (or new `build-profile.ts`) to emit:
   - Computed type scale from `scaleRatio` (Category A)
   - Profile CSS custom properties from Category A fields
   - Resolved enum values from Category B fields
2. CSS scoping: profile vars scoped to `[data-theme="{name}"]`, mode vars scoped to `[data-surface="{mode}"]` — not `:root`
3. Update app `globals.css` files to consume profile vars

**4b. Component adaptation:**

Components that hardcode values the profile should control need updating. Scoped to shared primitives that other components inherit from:

| Component | Current hardcoded value | Profile var to consume | Package | Consumers |
|-----------|----------------------|----------------------|---------|-----------|
| Card / surface primitives | `rounded-lg`, `shadow-md`, `p-4` | `--profile-card-radius`, `--profile-card-elevation`, `--profile-card-padding` | `design-system` | ~15 organisms in `ui` |
| `Typography` / `Heading` | Fixed `text-{size}` per level, `font-semibold`, `tracking-tight` | `--type-{step}` scale, `--profile-display-weight`, `--profile-label-tracking` | `ui` | Every page |
| `Section` / layout wrapper | `py-6` or `py-8` | `--profile-section-gap` | `ui` | Most page layouts |
| `Input` / form primitives | `rounded-md`, `bg-surface-input` | `--profile-card-radius`, `inputStyle` enum | `design-system` | Forms across all apps |
| `Button` | `tone` default is implementation-specific | `buttonTone` enum from profile | `design-system` | Every app |

**Blast radius:** Changes to card, typography, section, and input primitives affect every app. The adaptation must be backward-compatible — profile vars must have fallback values that match current behavior so apps without profiles see no change:

```css
border-radius: var(--profile-card-radius, var(--radius-lg));  /* falls back to current default */
```

**Test impact:** Snapshot tests for any component consuming these primitives will need updating. Estimated: 20-40 snapshot updates across apps.

### Phase 5: Asset Compilation + Recipe Generation (medium)

Can run in parallel with Phase 4.

1. Extend build system to emit CSS from `assets.ts`:
   - `@font-face` declarations from font definitions
   - `@keyframes` from keyframe definitions
   - Gradient and shadow custom properties from named assets
   - Brand color variables from `brandColors`
2. Optionally generate recipe utility classes from `recipes.ts` (`.recipe-hero-panel`, etc.)
3. Update app `globals.css` to import generated asset/recipe CSS

### Phase 6: Brikette Migration (medium)

Depends on both Phase 4 and Phase 5.

1. Create `assets.ts` for brikette theme (extract from `global.css` and `tailwind.config.mjs`)
2. Create `design-profile.ts` for brikette theme (extract defaults from current CSS)
3. Create `recipes.ts` for brikette theme (extract `.hero-panel`, `.cta-*`, etc.)
4. Migrate Brikette to consume generated CSS instead of hand-written CSS
5. Retire the parallel `--color-brand-*` / `--rgb-brand-*` system

**Parity criteria:**
- Benchmark screens captured before migration (same 3 screens from Phase 0)
- Viewports: 375px (mobile), 768px (tablet), 1440px (desktop)
- States: default, dark mode, hover on primary CTA, one expanded accordion
- Comparison method: perceptual diff (not pixel-perfect) with <2% threshold per screen
- Tolerance: 1px border/spacing shifts are acceptable; color drift, missing elements, layout reflow, or animation changes are not
- Automated check: `pnpm typecheck && pnpm lint` passes; no new test failures

### Phase 7: Eval Round 2 + Remaining Themes

1. Full eval harness across all apps
2. Create asset/profile/recipe files for remaining themes (prime, business-os)
3. Refine schema based on Phase 3-6 learnings

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Profile schema is too rigid for edge cases | Medium | Medium | Extension fields in each section; modes handle surface-type variation |
| Agents ignore Category C guidance (same as dossiers) | **Medium-High** | High | Phase 3 eval with explicit compliance scoring; fallback plan to promote to Category B, replace with recipes, or remove |
| Profile + assets + recipes + tokens + dossier = too many inputs | Medium | Medium | Precedence model simplified to two rules in skill docs; profile *replaces* the dossier-to-token gap |
| Component adaptation scope exceeds estimate | **High** | Medium | Phase 4b scoped to 5 primitive families (see table); fallback-value pattern ensures backward compat; snapshot test updates bounded |
| CSS scoping conflicts | Medium | High | Profile vars on `[data-theme]`; mode vars on `[data-surface]`; never `:root` |
| Brikette migration introduces visual regression | Medium | High | Parity criteria with perceptual diff threshold; migration is last phase |
| Build system complexity increases | Medium | Medium | Each generation step is independent; can be enabled per-theme |
| Mode selection is inconsistent across agents | Medium | Medium | Required `Surface-Mode` field in design specs; route-to-mode config; inference criteria in skill |
| Recipe library stays sparse, agents compose ad-hoc | Medium | Low | Acceptable initially — recipes grow from successful compositions; sparse is better than wrong |

---

## What This Does NOT Propose

- **No new component library.** Existing `design-system` + `ui` packages stay. Phase 4 adapts existing components to consume profile vars.
- **No palette generation engine.** Token values are still hand-picked per brand. A generator could come later but is orthogonal.
- **No dark mode consolidation.** The `.dark` / `.theme-dark` fragmentation is a separate problem.
- **No brand dossier changes.** Dossiers remain narrative documents. The profile is derived from the dossier, not a replacement for it.

---

## Appendix: Style Movement Translation Table

For agent skill reference. Maps user requests to profile settings.

| Movement | Profile baseline | Mode suggestion | Key characteristics |
|----------|-----------------|-----------------|---------------------|
| **Swiss/International** | `scaleRatio: 1.333`, `defaultRadius: "sm"`, `defaultElevation: "flat"`, `defaultBorder: "defined"` | marketing or editorial | Tight tracking on labels, uppercase transforms, grid tension via asymmetry, restrained palette with spot accent, generous whitespace |
| **Editorial** | `scaleRatio: 1.5+`, `displayWeight: 300` (light) or `900` (black), `bodyMeasure: "58ch"` | editorial | Dramatic size contrast between display and body, single-column prose, full-bleed images, extreme whitespace, dramatic motion (staggered entry) |
| **Minimalist** | `scaleRatio: 1.125`, `defaultElevation: "flat"`, `defaultBorder: "none"`, `defaultRadius: "sm"` | editorial or marketing | Flat everything, monochromatic palette, spot accent on CTA only, extreme whitespace, no motion or instant transitions |
| **Brutalist** | `scaleRatio: 1.414`, `displayWeight: 900`, `defaultRadius: "none"`, `defaultBorder: "bold"` | marketing | All-caps display, sharp edges, heavy borders, high-contrast colors, no shadows, no motion |
| **Material/Soft** | `defaultRadius: "xl"`, `defaultElevation: "layered"`, `defaultBorder: "none"` | any | Rounded surfaces, layered shadows, no borders, playful motion (spring easing), expressive color |
| **Glass/Atmospheric** | `defaultElevation: "subtle"`, `defaultRadius: "xl"` | campaign | Backdrop blur, translucent surfaces, high background contrast, subtle ring borders, precise motion |

These are starting points, not prescriptions. The agent adapts based on brand identity and page context.
