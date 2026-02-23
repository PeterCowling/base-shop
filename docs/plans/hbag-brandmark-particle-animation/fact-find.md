---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: hbag-brandmark-particle-animation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-brandmark-particle-animation/plan.md
Business-OS-Integration: off
Business-Unit: HBAG
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: Operator-driven brand identity enhancement -- logo animation is a core brand asset
---

# BrandMark Hourglass Dissolution Particle Animation Fact-Find Brief

## Scope

### Summary

Replace the current CSS fade+rotate animation in the Caryina BrandMark component with a Canvas 2D "hourglass dissolution" particle effect. The "y" letter dissolves into sand-like particles that fall through an implied hourglass neck at the wordmark baseline, then accumulate below to form the tagline text "Un solo dettaglio. Quello carino." -- characters materialise left-to-right as particles settle into letter-shaped target positions. Meanwhile, "Car" and "ina" slide together to form "Carina". Total duration increases from ~900ms to ~3-4 seconds.

The effect communicates: the unnecessary letter gives way, and its material becomes something more meaningful.

### Goals

- Implement a visually compelling particle dissolution + reformation effect for the BrandMark logo animation.
- Maintain the existing "Car" + "ina" slide-together motion (DOM-driven, CSS transitions).
- Achieve smooth 60fps on modern desktop and mobile browsers.
- Keep total added bundle size under 5 KB gzipped (zero external dependencies).
- Preserve full `prefers-reduced-motion` accessibility support (instant final state, no particles).
- Support both `mount` and `hover` trigger modes.

### Non-goals

- No WebGL or three.js -- Canvas 2D is sufficient for this particle count.
- No external particle library dependency (tsParticles, pixi.js, etc.).
- No changes to the BrandMark public API (`BrandMarkProps` interface).
- No font-file bundling or opentype.js glyph extraction -- use pixel-sampling approach instead.

### Constraints & Assumptions

- Constraints:
  - Must remain a "use client" component (Canvas API requires browser).
  - The caryina app uses webpack (not turbopack) -- see `package.json` scripts `--webpack`.
  - Font: Cormorant Garamond loaded via `next/font/google` with `display: "swap"`. Canvas must wait for font readiness before rendering text for pixel sampling.
  - Must not add perceptible layout shift or CLS regression.
  - Must work with the existing HSL-based token system (`--brand-mark-color`, `--brand-accent-color`).
- Assumptions:
  - Particle count of 300-800 is a viable initial range; local prototype benchmarks support this range under emulation, but final acceptance still requires real-device confirmation on iPhone Safari and Android Chrome.
  - The pixel-sampling approach (render text to offscreen canvas, scan `getImageData` for non-transparent pixels) provides adequate glyph shape fidelity without needing opentype.js.
  - The canvas overlay can be positioned absolutely over the DOM text layer without z-index conflicts in the Header component.

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/components/Header.tsx` -- renders `<BrandMark trigger="mount" />` inside a header link.
- `apps/caryina/src/components/BrandMark/BrandMark.tsx` -- the component itself (249 lines).

### Key Modules / Files

1. `apps/caryina/src/components/BrandMark/BrandMark.tsx` -- current component with CSS transition animation, font measurement system, and state machine (`from` | `to`).
2. `apps/caryina/src/components/BrandMark/BrandMark.module.css` -- CSS transitions for y fade/rotate, ina slide, tagline fade-in. Includes `prefers-reduced-motion` media query override.
3. `apps/caryina/src/app/layout.tsx` -- font loading via `next/font/google` (Cormorant_Garamond, DM_Sans), CSS variable injection (`--font-cormorant-garamond`, `--font-dm-sans`).
4. `apps/caryina/src/styles/global.css` -- imports theme tokens from `@themes/caryina/tokens.css`, sets `--brand-mark-color` and `--brand-accent-color`.
5. `packages/themes/caryina/tokens.css` -- HSL color tokens (primary: `355 55% 75%`, accent: `130 18% 72%`).
6. `apps/caryina/next.config.mjs` -- extends shared config, uses webpack.
7. `apps/caryina/package.json` -- dependencies include `react@19.2.1`, `next@^16.1.6`, no Canvas or animation libraries.

### Patterns & Conventions Observed

- **Font measurement before animation**: The component waits for `document.fonts.ready` promise, then uses `requestAnimationFrame` + `getBoundingClientRect` to compute pixel-precise segment positions (`--pos-y`, `--pos-i-final`, `--shift`). Evidence: `BrandMark.tsx` lines 119-143.
- **CSS custom properties for animation parameters**: Duration, delay, and computed positions are injected as inline `--var` styles. Evidence: `BrandMark.tsx` lines 192-203.
- **State machine pattern**: Binary `from`/`to` state drives CSS data-attribute selectors. Evidence: `BrandMark.tsx` line 86, `BrandMark.module.css` lines 78-86.
- **Reduced motion respect**: `usePrefersReducedMotion` hook + CSS `@media (prefers-reduced-motion: reduce)` with `!important` overrides. Evidence: `BrandMark.tsx` lines 43-59, `BrandMark.module.css` lines 135-152.
- **Measurement probe pattern**: Hidden off-screen spans for width computation. Evidence: `BrandMark.tsx` lines 234-239.
- **ResizeObserver for responsive remeasurement**: Evidence: `BrandMark.tsx` lines 145-152.

### Data & Contracts

- Types/schemas:
  - `BrandMarkProps` interface (9 optional props): `className`, `trigger`, `animate`, `delayMs`, `durationMs`, `reserveWidth`, `ariaLabel`, `tagline`, `showTagline`.
  - `Metrics` type: `{ posY: number; posIFinal: number; shift: number }`.
  - `Trigger` type: `"mount" | "hover"`.
- No persistence, API calls, or external data dependencies.

### Dependency & Impact Map

- Upstream dependencies:
  - `react@19.2.1`, `react-dom@19.2.1` -- hooks, refs, client component.
  - `next/font/google` -- font loading (Cormorant Garamond, DM Sans).
  - `@themes/caryina/tokens.css` -- HSL color tokens.
- Downstream dependents:
  - `Header.tsx` -- sole consumer, renders `<BrandMark trigger="mount" />`.
  - No other components import BrandMark.
- Likely blast radius:
  - **Low**: BrandMark is a leaf component with one consumer. The new Canvas layer is additive; the existing DOM text structure and CSS transitions for `car`/`ina` slide remain.
  - The `y` element's CSS fade/rotate transition would be replaced by the canvas particle effect, but the DOM element itself can remain (hidden when canvas is active) for fallback.

### Delivery & Channel Landscape

Not investigated: pure engineering change with no external delivery channel.

### Website Upgrade Inputs

Not investigated: not a website-upgrade-backlog item.

### Best-Of Synthesis Matrix

Not investigated: not a competitive analysis item.

### Prioritized Website Upgrade Backlog Candidates

Not investigated: not applicable.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Canvas 2D can render 300-800 particles at 60fps on mobile Safari/Chrome | Browser Canvas 2D performance | Low (prototype) | 2-4 hours |
| H2 | Pixel-sampling of rendered text produces visually adequate glyph shapes for the tagline at the target font size (0.55em of wordmark) | Canvas font rendering fidelity | Low (prototype) | 1-2 hours |
| H3 | The hourglass neck + accumulation visual reads clearly at the component's typical rendered size (~1.6rem base) | Visual design judgment | Low (prototype) | 1-2 hours |
| H4 | 3-4 second animation duration feels intentional rather than slow in the header context | UX perception | Low (A/B with timing variants) | 1 hour |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Local prototype benchmark completed across 300/500/800 particles with Playwright desktop + mobile emulation (Chromium and WebKit profiles) | `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/benchmark-results.json` | Medium -- emulated engines are informative but not equal to physical devices |
| H2 | Pixel-sampling approach validated in the standalone prototype; sampled tagline points render legibly at target size in captured runs | `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/hourglass-particle-prototype.html`, screenshots under `artifacts/prototype/screenshots/` | Medium-High |
| H3 | Hourglass funnel + accumulation visual demonstrated in prototype screenshots and replayable artifact | `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/screenshots/` | Medium -- still needs operator aesthetic sign-off in header context |
| H4 | No evidence | None | Low |

#### Falsifiability Assessment

- Easy to test:
  - H1: Build a standalone Canvas 2D particle demo, measure fps on target devices.
  - H2: Render tagline text to offscreen canvas, visualise sampled pixel positions.
- Hard to test:
  - H3, H4: Subjective visual/UX judgment -- requires prototype in situ.
- Validation seams needed:
  - The existing `durationMs` prop can drive particle timings without changing the `BrandMarkProps` shape.
  - A debug mode showing particle target positions would aid H2/H3 validation.

#### Recommended Validation Approach

- Quick probes (completed):
  - Standalone prototype built: `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/hourglass-particle-prototype.html`.
  - Automated benchmark runner built and executed: `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs`.
  - Recorded outputs: `benchmark-results.json`, `benchmark-summary.md`, and per-profile screenshots.
  - Observed baseline: Chromium profiles sustained ~120 fps (headless cadence); WebKit profile sustained ~60 fps with p95 frame ~18ms.
- Structured tests:
  - Integration test: verify BrandMark renders without error with `animate={true}` and canvas initialises.
  - Visual regression: screenshot test in Playwright at `data-state="to"` (final frame).
- Deferred validation:
  - Physical-device confirmation for iPhone Safari and Android Chrome before implementation sign-off.
  - H4 (duration feel) validated by operator review in live header context.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit via shared preset), Playwright (prototype benchmarking + future visual checks)
- Commands: `pnpm --filter @apps/caryina typecheck`, `pnpm --filter @apps/caryina lint`, `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark.test.tsx'`
- CI integration: monorepo CI via Turborepo; caryina included in build matrix.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| BrandMark | Unit (baseline seam) | `apps/caryina/src/components/BrandMark/BrandMark.test.tsx` | Validates static final-state rendering path (`animate={false}`) |
| Particle Prototype | Perf probe artifact | `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/run-benchmark.mjs` | Produces repeatable fps/frame-time metrics and screenshots for 300/500/800 particle runs |

Jest config now exists for caryina: `apps/caryina/jest.config.cjs`. Package test script added: `apps/caryina/package.json` (`test`).

#### Coverage Gaps

- Untested paths:
  - Canvas animation path in BrandMark is still unimplemented and therefore untested.
  - Font-measurement failure fallback path is untested.
  - Reduced-motion path for future canvas branch is untested.
- Canvas animation (new) will need testing strategy.
- Extinct tests:
  - None.

#### Testability Assessment

- Easy to test:
  - Props/state seams: `animate`, `trigger`, `delayMs`, `durationMs` in Jest + React Testing Library.
  - Pure particle lifecycle math once engine is extracted (`tick`, attractor convergence, phase transitions).
  - Prototype benchmark command is executable and deterministic for local regression checks.
- Hard to test:
  - Particle visual fidelity in production context requires visual regression snapshots and operator review.
  - Real-device timing smoothness requires physical Safari/Android runs; emulation alone is insufficient.
  - Canvas pixel content: `getImageData` assertions possible but fragile.
- Test seams needed:
  - Extract particle engine into a pure module for deterministic unit tests.
  - Expose `data-particle-state` (`idle` | `dissolving` | `settling` | `done`) for integration hooks.

#### Recommended Test Approach

- Unit tests for:
  - BrandMark static/fallback paths (seeded by `BrandMark.test.tsx`).
  - Particle engine: initialisation, gravity physics, attractor convergence, lifecycle.
  - Pixel sampling utility: verify sampled positions are non-empty and bounded.
- Integration tests for:
  - BrandMark renders with canvas overlay when `animate={true}`.
  - BrandMark shows final state without canvas when `prefers-reduced-motion` is active.
  - BrandMark handles missing font gracefully (fallback measurement).
- E2E tests for:
  - Visual regression of final animation frame via Playwright screenshot.
- Contract tests for:
  - `BrandMarkProps` interface remains backward-compatible (no breaking changes).

### Recent Git History (Targeted)

- `7822b2e23d` -- "fix: include remaining outstanding updates and validator path handling" (recent)
- `53b5e61fab` -- "chore: checkpoint outstanding work and stabilize CI tests"

Only 2 commits touch BrandMark, both are stabilisation commits. The component is stable and not under active development by others.

## External Research

### Approach A: Pure Canvas 2D (Recommended)

**Zero-dependency particle system using native Canvas 2D API.**

- **Technique**: Render text to an offscreen canvas using `fillText()` with the same font (Cormorant Garamond). Call `getImageData()` to scan pixel alpha values. Sample every Nth pixel (step = 2-4) to build a particle position array. Each particle is a small filled arc or rect on the visible canvas.
- **Performance**: Local benchmark artifacts are now available (`benchmark-results.json`, `benchmark-summary.md`) and show stable frame-time behavior in desktop/mobile-emulated runs at 300/500/800 particles. Real-device Safari/Chrome measurements are still required before release sign-off.
- **Bundle cost**: Zero added bytes for Canvas 2D (native browser API). The particle engine would be ~2-3 KB of application code (gzipped).
- **SSR**: Canvas is a client-only API. The component already uses `"use client"` directive. No additional `dynamic()` import needed since the existing component already handles pre-ready state with fallback text.
- **Pixel sampling reference**: [CSS-Tricks: Adding Particle Effects to DOM Elements with Canvas](https://css-tricks.com/adding-particle-effects-to-dom-elements-with-canvas/), [MDN: Pixel manipulation with canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas), [Mamboleoo: Convert image into particles](https://www.mamboleoo.be/articles/how-to-convert-an-image-into-particles).

### Approach B: opentype.js Glyph Extraction (Rejected)

- **Technique**: Load .otf/.ttf font file, parse glyph outlines to get bezier path commands, sample points along paths.
- **Bundle cost**: Substantial runtime overhead versus a native Canvas 2D approach; disproportionate for a single header logo animation.
- **Complexity**: Requires bundling the font file separately (next/font/google serves WOFF2 via CDN, not a raw .otf accessible to JS). Would need a separate font asset pipeline.
- **Verdict**: Over-engineered for this use case. Pixel sampling achieves equivalent visual result at zero bundle cost.

### Approach C: tsParticles / @tsparticles/react (Rejected)

- **Bundle cost**: Material dependency overhead relative to the small custom engine needed here.
- **Fit**: Designed for background decorative particles, not tightly choreographed text-to-text morphing. Would require extensive custom plugin code anyway.
- **Verdict**: Massive bundle overhead for functionality we can implement in ~200 lines of custom code.

### Approach D: pixi.js / three.js (Rejected)

- **Bundle cost**: Large rendering-engine overhead for a single logo animation use case.
- **Fit**: Both are full rendering engines. Using them for a single logo animation is like using a crane to hang a picture frame.
- **Verdict**: Grossly disproportionate bundle cost.

### Recommended Architecture

**Canvas 2D overlay with DOM text underneath.**

1. **Canvas element**: Absolutely positioned over the BrandMark composed layer. Same dimensions as the root span. Created via React ref. Canvas dimensions must be updated via the existing `ResizeObserver` pattern when the root span resizes.
2. **Particle engine** (pure class/function, no React dependency):
   - `ParticlePool`: pre-allocated typed arrays for x, y, vx, vy, targetX, targetY, alpha, size, settled.
   - `sampleTextPixels(text, font, size)`: renders text to offscreen canvas, returns `Float32Array` of `[x, y]` pairs.
   - `tick(dt)`: updates positions with gravity, hourglass funnel constraint, and target attractor forces.
   - `render(ctx)`: draws all active particles as small circles with brand colors.
3. **Animation phases**:
   - Phase 1 (0-800ms): "y" dissolves -- particles spawn from y's bounding box, fall under gravity.
   - Phase 2 (500-2000ms): particles funnel through hourglass neck (narrow band at baseline y-coordinate).
   - Phase 3 (1500-3500ms): particles converge on tagline glyph positions, characters materialise left-to-right as density thresholds are met per character cell.
   - Phase 4 (3000-4000ms): remaining particles settle; tagline DOM text fades in to replace canvas rendering for crisp final display.
4. **DOM text remains authoritative for final state**: Canvas is removed/hidden after animation completes. Tagline text is DOM, not canvas-rendered, ensuring consistent font rendering and accessibility.

## Questions

### Resolved

- Q: Does the caryina app use turbopack or webpack?
  - A: Webpack. Both `dev` and `build` scripts pass `--webpack` flag explicitly.
  - Evidence: `apps/caryina/package.json` lines 5-6.

- Q: Are there any existing Canvas-based components in the caryina app?
  - A: No. The caryina app has no Canvas usage. The monorepo has Canvas usage in the page-builder (CMS), but those are unrelated UI components in `packages/ui` and `packages/cms-ui`.
  - Evidence: Grep for "canvas|Canvas" in `apps/caryina` returned zero results.

- Q: What fonts are used and how are they loaded?
  - A: Cormorant Garamond (heading, weight 300/400/500, normal+italic) and DM Sans (body, weight 300/400/500). Loaded via `next/font/google` with `display: "swap"` and injected as CSS variables.
  - Evidence: `apps/caryina/src/app/layout.tsx` lines 10-23.

- Q: Is the BrandMark component tested?
  - A: Yes (baseline seam established). caryina now has Jest config and a passing BrandMark static-path unit test.
  - Evidence: `apps/caryina/jest.config.cjs`, `apps/caryina/src/components/BrandMark/BrandMark.test.tsx`, `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern='BrandMark.test.tsx'`.

- Q: Should this direct-inject feature be attached to a BOS card before planning?
  - A: Not for this cycle. Keep `Business-OS-Integration: off` and proceed as a direct-inject engineering brief.
  - Evidence: Frontmatter decision in this artifact (`Business-OS-Integration: off`, `Card-ID: none`) and operator request to unblock planning directly.

### Open (User Input Needed)

- Q: Should the particle color transition from primary (pink, `355 55% 75%`) to accent (sage, `130 18% 72%`) during the fall, or maintain primary throughout?
  - Why it matters: Affects the visual storytelling. A color shift from pink to sage reinforces "transformation". Maintaining pink keeps visual continuity.
  - Decision impacted: Particle rendering code, color interpolation logic.
  - Decision owner: Operator (brand decision).
  - Default assumption: Particles start as primary and gradually shift to accent during Phase 2-3. Risk: may look muddy if HSL interpolation crosses through desaturated midpoint.

- Q: What is the minimum viewport width where the particle animation should play (vs. showing instant final state)?
  - Why it matters: On very small screens, 300+ particles in a tiny area may look cluttered rather than elegant.
  - Decision impacted: Responsive breakpoint for animation disable.
  - Decision owner: Operator.
  - Default assumption: Disable particle animation below 480px viewport width (show CSS fallback or instant state). Risk: misses brand moment on mobile.

- Q: Should the hover trigger replay the full dissolution+reformation, or a shorter variant?
  - Why it matters: 3-4 seconds is acceptable on mount but may feel sluggish on hover interaction.
  - Decision impacted: Animation duration/phase configuration per trigger mode.
  - Decision owner: Operator.
  - Default assumption: Hover trigger uses a 1.5-2 second abbreviated version (faster gravity, skip hourglass neck, direct attraction to targets). Risk: may lose the hourglass metaphor.

## Confidence Inputs

- Implementation: 82%
  - Evidence: Standalone prototype and benchmark runner are implemented and reproducible (`artifacts/prototype/hourglass-particle-prototype.html`, `run-benchmark.mjs`). Existing BrandMark architecture still provides clean extension seams.
  - To reach >=90: Verify the same behavior in the actual React BrandMark integration and complete real-device checks.

- Approach: 86%
  - Evidence: Canvas 2D + pixel sampling remains the best complexity/bundle tradeoff, now backed by working prototype artifacts and benchmark outputs.
  - To reach >=90: Complete operator sign-off on H3/H4 in the real header context.

- Impact: 72%
  - Evidence: Brand signal upside is still plausible but not yet tied to business metrics.
  - To reach >=80: Capture operator confirmation on brand fit plus post-launch qualitative feedback plan.
  - To reach >=90: Collect user-facing feedback signal after rollout.

- Delivery-Readiness: 82%
  - Evidence: caryina now has Jest config, package test script, and a passing baseline BrandMark unit test seam.
  - To reach >=90: Add particle-engine unit tests and one integration test for the future canvas path.

- Testability: 80%
  - Evidence: Jest harness is active and executable; prototype benchmark tooling provides repeatable perf evidence.
  - To reach >=90: Extract particle engine as pure module and add deterministic lifecycle tests + visual regression baseline.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Mobile Safari Canvas 2D performance degrades below 60fps with particle rendering + DOM transitions simultaneous | Low-Medium | Medium | Prototype on real device. Fallback: reduce particle count dynamically based on `navigator.hardwareConcurrency` or frame-time monitoring. |
| Pixel-sampled tagline glyph shapes look blobby at small font sizes (0.55em of 1.6rem = ~14px) | Medium | Medium | Increase sampling resolution on offscreen canvas (render at 2-3x size, scale positions down). Test at multiple DPR values. |
| Animation feels slow (3-4s) in header context where users expect instant branding | Low | Medium | Make duration configurable via existing `durationMs` prop. Provide abbreviated timing for hover mode. |
| Canvas z-index conflicts with header dropdown/nav elements | Low | Low | Canvas receives `pointer-events: none` and is removed from DOM after animation completes. |
| Font not loaded when pixel sampling runs, producing incorrect glyph shapes | Low | High | Existing `document.fonts.ready` wait pattern (lines 123-129) already handles this. Extend to cover canvas sampling. |
| JSDOM Canvas limitations block unit testing of particle engine | Medium | Low | Extract particle physics as pure math functions (no Canvas dependency). Mock Canvas context for rendering tests. |
| CLS (Cumulative Layout Shift) from canvas element insertion | Low | Medium | Canvas is absolutely positioned over existing content; does not participate in flow layout. Verify with Lighthouse. |
| Canvas `ctx.font` renders different glyphs than DOM text because CSS variable `var(--font-cormorant-garamond)` cannot be used directly in Canvas font string | Medium | Medium | Resolve CSS variable to computed font family name via `getComputedStyle` before setting `ctx.font`. Test by comparing offscreen canvas text rendering against DOM. |
| Canvas dimensions not updated on responsive resize, causing particle positions to drift from DOM text | Low-Medium | Low | Extend existing `ResizeObserver` pattern to update canvas width/height and re-sample target positions when root span resizes. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Maintain existing `BrandMarkProps` interface (no breaking changes).
  - Continue using CSS custom properties for animation parameters.
  - Continue respecting `prefers-reduced-motion` (skip all particle animation).
  - Keep particle engine as a pure, framework-agnostic module for testability.
- Rollout/rollback expectations:
  - Feature can be gated by the existing `animate` prop (`animate={false}` skips all animation).
  - Rollback: revert to CSS-only animation by removing canvas layer and restoring y-element CSS transitions.
- Observability expectations:
  - No server-side observability needed (client-only visual effect).
  - Optional: log animation frame rate in development mode for perf monitoring.

## Suggested Task Seeds (Non-binding)

1. **Extract particle engine module** -- `ParticlePool`, `sampleTextPixels`, `tick`, `render` as a pure TypeScript module in `apps/caryina/src/lib/particle-engine.ts`.
2. **Expand unit tests from baseline seam** -- add particle lifecycle and sampling tests on top of existing BrandMark static-path test.
3. **Integrate canvas overlay into BrandMark** -- add `<canvas>` layer, wire animation phases to existing state machine, and ensure cleanup.
4. **Wire pixel sampling to font-ready signal** -- extend existing `document.fonts.ready` pattern to trigger target point computation.
5. **Implement animation phase sequencing** -- dissolution, funnel, reformation, cleanup coordinated with existing `car`/`ina` slide.
6. **Add responsive breakpoint gate** -- disable particle animation below chosen threshold width.
7. **Add reduced-motion handling for canvas path** -- ensure canvas is never created when reduced motion is active.
8. **Add Playwright visual regression test** -- screenshot final frame and compare against baseline.
9. **Run physical-device validation pass** -- capture iPhone Safari + Android Chrome fps traces before release.

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build` (code change)
- Supporting skills:
  - none
- Deliverable acceptance package:
  - BrandMark renders hourglass dissolution effect on mount.
  - Particles dissolve from "y" position, funnel through baseline, reform into tagline text positions.
  - "Car" + "ina" slide together concurrently (existing behavior preserved).
  - 60fps on latest Chrome, Safari, Firefox (desktop). 60fps on iPhone Safari, Android Chrome (mobile).
  - `prefers-reduced-motion` shows instant final state, no canvas created.
  - No external runtime dependencies added.
  - Total added JS bundle < 5 KB gzipped.
  - BrandMarkProps interface unchanged (backward compatible).
  - Unit tests for particle engine pass.
  - Playwright visual regression screenshot matches expected final frame.
- Post-delivery measurement plan:
  - Lighthouse CLS audit confirms no regression.
  - Frame rate logging in dev mode confirms 60fps target.
  - Operator visual review of animation on target devices.

## Evidence Gap Review

### Gaps Addressed

- Build setup confirmed: webpack, not turbopack. Evidence: `package.json` scripts.
- Font loading mechanism confirmed: `next/font/google` with `display: "swap"`. Canvas font rendering will use the same CSS variable. Evidence: `layout.tsx`.
- No existing Canvas usage in caryina app confirmed. This is greenfield for the app. Evidence: Grep search.
- Standalone prototype + benchmark pipeline implemented and executed. Evidence: `docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/hourglass-particle-prototype.html`, `run-benchmark.mjs`, `benchmark-results.json`, `benchmark-summary.md`, screenshots.
- caryina test harness decision implemented: Jest config and package test script are now in place, with one passing BrandMark baseline test seam.
- All four alternative library approaches (opentype.js, tsParticles, pixi.js, three.js) evaluated and rejected with documented rationale.
- BOS decision made for this cycle: remain in direct-inject mode (`Business-OS-Integration: off`).
- Decision trace persisted: `docs/plans/hbag-brandmark-particle-animation/artifacts/decision-log.md`.

### Confidence Adjustments

- Implementation raised to 82% after prototype + benchmark artifacts demonstrated a working end-to-end effect path.
- Delivery-Readiness raised to 82% after establishing Jest config/test script and validating one passing BrandMark test seam.
- Testability raised to 80% with executable harness + repeatable prototype benchmark command.
- Approach raised to 86% due prototype confirmation of the selected architecture.

### Remaining Assumptions

- Physical iPhone Safari and Android Chrome checks are still required before release sign-off (current evidence is emulation-based).
- H4 (perceived pacing at 3-4s) still needs operator review inside the real header context.
- Canvas `ctx.font` resolution and resize resampling still need integration verification inside BrandMark, not just prototype.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None for plan creation.
- Residual execution risks (to schedule early in plan):
  - Perform physical-device validation for iPhone Safari + Android Chrome.
  - Complete H4 pacing review in live header context.
  - Validate canvas font/resize behavior in integrated BrandMark implementation.
- Recommended next step:
  - Proceed to `/lp-do-plan` with early tasks for real-device perf validation and integration-level visual QA.
