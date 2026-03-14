/**
 * Movement Fidelity Probe — Phase 3 Eval
 *
 * Three implementations of the same newsletter signup component,
 * each applying a different style movement from the translation table.
 *
 * Target brand: Caryina (premium handbag accessories)
 * Fonts: Cormorant Garamond (heading), DM Sans (body)
 * Brand colors: strawberryMilk, warmSage, warmIvory
 *
 * THIS IS AN EVAL ARTIFACT — not production code.
 */

import React from "react";

// ═══════════════════════════════════════════════════════════════
// Version A: Swiss / International Style
// ═══════════════════════════════════════════════════════════════
//
// Movement settings applied:
//   scaleRatio: 1.333
//   defaultRadius: "sm"
//   defaultElevation: "flat"
//   defaultBorder: "defined"
//   displayTransform: "uppercase"
//   labelTracking: tight (0.12em on labels)
//   colorStrategy: "restrained" with spot accent
//   gridCharacter: "asymmetric"
//   whitespace: "generous"
//   motion: none (Swiss restraint)

export function SwissNewsletter() {
  return (
    <section
      className="bg-surface-1 px-6 py-24 md:px-12 md:py-32"
      aria-labelledby="swiss-heading"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-12 gap-6">
        {/* Asymmetric grid: heading in left 5 cols, form in right 6 cols offset by 1 */}
        <div className="col-span-12 md:col-span-5 flex flex-col justify-center">
          <p
            className="font-body text-xs font-medium uppercase text-fg-muted"
            style={{ letterSpacing: "0.12em" }}
          >
            Newsletter
          </p>

          <h2
            id="swiss-heading"
            className="mt-3 font-heading text-3xl font-normal uppercase leading-tight text-fg md:text-4xl"
            style={{ letterSpacing: "0.04em" }}
          >
            Stay in the Loop
          </h2>

          <div
            className="mt-4 h-px w-16 bg-fg"
            aria-hidden="true"
          />

          <p className="mt-6 max-w-[40ch] font-body text-base leading-relaxed text-fg-muted">
            Curated updates on new collections, styling notes, and
            limited-edition releases delivered to your inbox.
          </p>
        </div>

        {/* 1-col gutter gap */}
        <div className="hidden md:col-span-1 md:block" />

        <div className="col-span-12 md:col-span-6 flex flex-col justify-center">
          <form
            className="rounded-sm border border-border bg-surface-2 p-8"
            onSubmit={(e) => e.preventDefault()}
          >
            <label
              htmlFor="swiss-email"
              className="block font-body text-xs font-medium uppercase text-fg-muted"
              style={{ letterSpacing: "0.12em" }}
            >
              Email Address
            </label>

            <input
              id="swiss-email"
              type="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-sm border border-border bg-surface-1 px-4 py-3 font-body text-sm text-fg placeholder:text-fg-muted/50 focus:border-fg focus:outline-none"
            />

            <button
              type="submit"
              className="mt-4 w-full rounded-sm bg-fg px-6 py-3 font-body text-xs font-medium uppercase text-bg"
              style={{ letterSpacing: "0.12em" }}
            >
              Subscribe
            </button>

            <p className="mt-4 font-body text-xs leading-normal text-fg-muted/60">
              No spam. Unsubscribe at any time. We respect your privacy.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// Version B: Editorial Style
// ═══════════════════════════════════════════════════════════════
//
// Movement settings applied:
//   scaleRatio: 1.5+
//   displayWeight: 300 (light)
//   bodyMeasure: "58ch"
//   defaultRadius: "sm" (from brand baseline)
//   defaultElevation: "subtle" (from brand baseline, not flat)
//   defaultBorder: "subtle" (from brand baseline)
//   gridCharacter: "single-column"
//   whitespace: "extreme"
//   motionPersonality: "dramatic" (staggered entry)
//   imageRelationship: "full-bleed" (not used here, no images)
//   Dramatic size contrast: heading 4xl-6xl vs body base

export function EditorialNewsletter() {
  return (
    <section
      className="bg-surface-1 px-6 py-32 md:px-12 md:py-48"
      aria-labelledby="editorial-heading"
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        {/* Dramatic display type — light weight, huge size */}
        <h2
          id="editorial-heading"
          className="font-heading text-5xl leading-none text-fg md:text-7xl"
          style={{
            fontWeight: 300,
            animationName: "editorialFadeUp",
            animationDuration: "800ms",
            animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            animationFillMode: "both",
          }}
        >
          Stay in the Loop
        </h2>

        {/* Body — sharp contrast from heading size, narrow measure */}
        <p
          className="mt-10 max-w-[58ch] font-body text-base leading-relaxed text-fg-muted md:mt-14 md:text-lg"
          style={{
            animationName: "editorialFadeUp",
            animationDuration: "800ms",
            animationDelay: "200ms",
            animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            animationFillMode: "both",
          }}
        >
          Curated updates on new collections, styling notes, and
          limited-edition releases delivered to your inbox.
        </p>

        {/* Inline form — single column, centred */}
        <form
          className="mt-12 flex w-full max-w-md flex-col gap-3 md:mt-16"
          onSubmit={(e) => e.preventDefault()}
          style={{
            animationName: "editorialFadeUp",
            animationDuration: "800ms",
            animationDelay: "400ms",
            animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            animationFillMode: "both",
          }}
        >
          <input
            type="email"
            placeholder="Your email address"
            aria-label="Email address"
            className="w-full rounded-sm border-b border-border bg-transparent px-1 py-3 font-body text-base text-fg placeholder:text-fg-muted/40 focus:border-fg focus:outline-none"
          />

          <button
            type="submit"
            className="mt-2 rounded-sm bg-fg px-8 py-4 font-heading text-base font-normal tracking-wide text-bg shadow-sm transition-shadow duration-300 hover:shadow-md"
            style={{ fontWeight: 300, letterSpacing: "0.06em" }}
          >
            Subscribe
          </button>
        </form>

        <p
          className="mt-8 font-body text-sm leading-normal text-fg-muted/50"
          style={{
            animationName: "editorialFadeUp",
            animationDuration: "800ms",
            animationDelay: "600ms",
            animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            animationFillMode: "both",
          }}
        >
          No spam. Unsubscribe at any time.
        </p>
      </div>

      {/* Staggered entry keyframes */}
      <style>{`
        @keyframes editorialFadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// Version C: Minimalist Style
// ═══════════════════════════════════════════════════════════════
//
// Movement settings applied:
//   scaleRatio: 1.125
//   defaultElevation: "flat"
//   defaultBorder: "none"
//   defaultRadius: "sm"
//   colorStrategy: "monochromatic"
//   accentUsage: "spot" (CTA only)
//   whitespace: "extreme"
//   motionPersonality: "none"
//   gridCharacter: "single-column"
//   No shadows, no borders on containers, no transforms, no animation

export function MinimalistNewsletter() {
  return (
    <section
      className="bg-surface-1 px-6 py-32 md:px-12 md:py-40"
      aria-labelledby="minimalist-heading"
    >
      <div className="mx-auto flex max-w-lg flex-col items-start">
        <h2
          id="minimalist-heading"
          className="font-heading text-2xl font-normal leading-snug text-fg md:text-3xl"
        >
          Stay in the Loop
        </h2>

        <p className="mt-6 max-w-[54ch] font-body text-sm leading-relaxed text-fg-muted">
          Curated updates on new collections, styling notes, and
          limited-edition releases delivered to your inbox.
        </p>

        <form
          className="mt-10 flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:gap-3"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Email"
            aria-label="Email address"
            className="flex-1 rounded-sm border-0 bg-transparent px-0 py-2 font-body text-sm text-fg placeholder:text-fg-muted/40 focus:outline-none"
            style={{ borderBottom: "1px solid var(--color-fg-muted, #999)" }}
          />

          {/* Spot accent: CTA is the ONLY coloured element */}
          <button
            type="submit"
            className="rounded-sm bg-accent px-6 py-2 font-body text-sm font-medium text-bg"
          >
            Subscribe
          </button>
        </form>

        <p className="mt-6 font-body text-xs leading-normal text-fg-muted/40">
          No spam. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
