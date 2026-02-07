import Link from "next/link";

import { localizedPath } from "@/lib/routes";

import type { TypoSectionProps } from "./types";

export function TypoHeroSection({ lang, translator }: TypoSectionProps) {
  const serviceStats = [
    {
      label: translator("typo.services.strategy"),
      detail: translator("products.sections.design.body"),
    },
    {
      label: translator("typo.services.platforms"),
      detail: translator("products.sections.distribution.body"),
    },
    {
      label: translator("typo.services.launch"),
      detail: translator("products.sections.platform.body"),
    },
  ];

  return (
    <section className="loket-hero">
      <div className="loket-hero__copy">
        <p className="loket-hero__eyebrow">{translator("typo.eyebrow")}</p>
        <h1 className="loket-hero__title">{translator("typo.heroTitle")}</h1>
        <p className="loket-hero__subtitle">{translator("typo.heroSubtitle")}</p>
        <div className="loket-hero__cta">
          <Link className="loket-link primary" href={localizedPath(lang, "products")}>
            {translator("hero.cta.primary").toUpperCase()}
          </Link>
          <Link className="loket-link" href={localizedPath(lang, "realEstate")}>
            {translator("realEstate.cta").toUpperCase()}
          </Link>
        </div>
        <dl className="loket-hero__stats">
          {serviceStats.map((stat) => (
            <div key={stat.label} className="loket-hero__stat">
              <dt>{stat.label}</dt>
              <dd>{stat.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="loket-hero__visual" aria-hidden="true">
        <span className="loket-visual__badge">
          {/* i18n-exempt -- DS-000 brand lockup mirrors printed card [ttl=2026-12-31] */}
          SKYLAR
        </span>
        <div className="loket-visual-grid">
          <div className="loket-visual-cell loket-visual-cell--cable">
            <span className="loket-visual-cell__label">Electronics</span>
            <span className="loket-visual-graphic" />
          </div>
          <div className="loket-visual-cell loket-visual-cell--home">
            <span className="loket-visual-cell__label">Home</span>
            <span className="loket-visual-graphic" />
          </div>
          <div className="loket-visual-cell loket-visual-cell--bag">
            <span className="loket-visual-cell__label">Bags</span>
            <span className="loket-visual-graphic" />
          </div>
          <div className="loket-visual-cell loket-visual-cell--pet">
            <span className="loket-visual-cell__label">Pets</span>
            <span className="loket-visual-graphic" />
          </div>
        </div>
        <span className="loket-visual__tagline">
          {/* i18n-exempt -- DS-000 location/year motif stays fixed [ttl=2026-12-31] */}
          AMALFI / 2025
        </span>
        <span className="loket-visual__floating" />
      </div>
    </section>
  );
}
