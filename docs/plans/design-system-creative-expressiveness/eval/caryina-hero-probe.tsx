/**
 * Caryina Product Hero — Phase 3 Eval Probe
 *
 * Surface mode: marketing (above-fold, conversion-focused)
 * Theme: caryina (packages/themes/caryina)
 * Profile overrides (marketing mode):
 *   scaleRatio: 1.5, displayWeight: 300,
 *   whitespace: extreme, imageRelationship: full-bleed
 *
 * This is an eval artifact, not production code.
 */

import React from "react";

// --- Color token reference (from tokens.ts) ---
// bg:           hsl(38 18% 98%)   — warm ivory
// fg:           hsl(355 12% 20%)  — warm near-black
// fg-muted:     hsl(355 8% 52%)
// primary:      hsl(355 55% 75%)  — strawberry milk
// primary-fg:   hsl(355 12% 20%)
// accent:       hsl(130 18% 72%)  — warm sage
// border:       hsl(355 12% 90%)
// surface:      hsl(0 0% 100%)

// --- Font reference (from assets.ts) ---
// heading: "Cormorant Garamond", Georgia, serif  (weights: 300-700)
// body:    "DM Sans", ui-sans-serif, system-ui    (weights: 400, 500, 700)

interface MaterialOption {
  name: string;
  swatch: string; // Tailwind class for the swatch color
}

interface ProductHeroProps {
  productName?: string;
  description?: string;
  price?: string;
  materials?: MaterialOption[];
}

const defaultMaterials: MaterialOption[] = [
  { name: "Cognac", swatch: "bg-amber-800" },
  { name: "Noir", swatch: "bg-neutral-900" },
  { name: "Blush", swatch: "bg-primary" },
];

export function CaryinaProductHero({
  productName = "The Riviera Strap",
  description = "Hand-finished Italian calfskin strap with brushed brass hardware. Designed to complement your favourite structured bag with effortless polish.",
  price = "\u20AC245",
  materials = defaultMaterials,
}: ProductHeroProps) {
  return (
    <section className="relative min-h-screen bg-bg text-fg overflow-hidden">
      {/* --- Full-bleed product image (marketing mode: imageRelationship full-bleed) --- */}
      <div className="absolute inset-0 md:left-1/2 md:right-0 md:top-0 md:bottom-0">
        {/* Placeholder for product image - warm ivory tint to suggest editorial photography */}
        <div
          className="h-full w-full bg-primary-soft"
          role="img"
          aria-label={`${productName} product photograph`}
        >
          {/* In production: Next.js Image with priority, fill, object-cover */}
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-fg-muted text-sm font-sans tracking-widest uppercase">
              Product Image
            </span>
          </div>
        </div>
      </div>

      {/* Soft gradient veil so text reads over the image on mobile */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/90 to-transparent md:bg-gradient-to-r md:from-bg md:via-bg/80 md:to-transparent pointer-events-none" />

      {/* --- Content column (single-column text, marketing mode) --- */}
      <div className="relative z-10 flex min-h-screen items-center">
        <div className="w-full max-w-4xl px-6 py-24 md:py-32 md:pl-16 lg:pl-24 xl:pl-32">
          {/* Eyebrow — label tracking from profile (0.08em), uppercase avoided (displayTransform: none) */}
          <p
            className="text-fg-muted font-sans text-xs font-medium mb-6"
            style={{ letterSpacing: "0.08em" }}
          >
            New Arrival
          </p>

          {/* Display heading — Cormorant Garamond, weight 300, scale ratio 1.5 */}
          <h1
            className="font-heading font-light leading-none mb-8"
            style={{
              fontSize: "clamp(2.25rem, 5vw + 1rem, 4.5rem)",
              fontWeight: 300,
              lineHeight: 1.05,
            }}
          >
            {productName}
          </h1>

          {/* Body — DM Sans, max-width 60ch (bodyMeasure), leading 1.6 */}
          <p className="font-sans text-fg-muted text-base leading-relaxed max-w-[60ch] mb-10">
            {description}
          </p>

          {/* Price — prominent but restrained, Cormorant Garamond for editorial feel */}
          <p className="font-heading text-2xl font-normal text-fg mb-10">
            {price}
          </p>

          {/* Material options — spot accent usage, restrained color strategy */}
          <div className="mb-12">
            <p
              className="text-fg-muted font-sans text-xs font-medium mb-4"
              style={{ letterSpacing: "0.08em" }}
            >
              Material
            </p>
            <div className="flex gap-3">
              {materials.map((mat, i) => (
                <button
                  key={mat.name}
                  className="group flex flex-col items-center gap-2"
                  aria-label={`Select ${mat.name}`}
                >
                  <span
                    className={`
                      block h-8 w-8 rounded-sm ${mat.swatch}
                      ring-1 ring-border
                      transition-all duration-[250ms]
                      ${i === 0 ? "ring-2 ring-fg" : ""}
                      group-hover:ring-2 group-hover:ring-primary
                    `}
                    style={{
                      transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
                    }}
                  />
                  <span className="font-sans text-xs text-fg-muted">
                    {mat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CTA — solid button tone, sm radius, subtle elevation, strawberry milk primary */}
          <button
            className="
              inline-flex items-center justify-center
              bg-primary text-primary-fg
              font-sans text-sm font-medium
              px-10 py-4
              rounded-sm shadow-sm
              transition-all duration-[250ms]
              hover:bg-primary-hover
              active:bg-primary-active
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
            "
            style={{
              letterSpacing: "0.08em",
              transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            Add to Bag
          </button>

          {/* Subtle trust line beneath CTA */}
          <p className="mt-6 font-sans text-xs text-fg-muted">
            Complimentary shipping &middot; 30-day returns
          </p>
        </div>
      </div>

      {/* Thin decorative border at bottom edge — subtle, precise */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </section>
  );
}

export default CaryinaProductHero;
