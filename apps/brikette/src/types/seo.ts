// -----------------------------------------------------------------------------
// src/types/seo.ts
// -----------------------------------------------------------------------------
/**
 * Descriptor object for building <link> elements inside React Router's
 * <Meta/> component.
 */
export type LinkDescriptor = {
  rel: string;
  href: string;
  /** BCP‑47 language tag for alternate links (React prop: `hrefLang`) */
  hrefLang?: string;
  /** For preloads: style, script, font, etc. */
  as?: string;
};

/*   Centralised schema.org type helpers. */
export interface SearchActionSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  /** Canonical home‑page URL – include trailing slash. */
  url: string;
  potentialAction: {
    "@type": "SearchAction";
    /** Results page that a *human* can navigate to. */
    target: string;
    "query-input": string;
  };
  /** HTML lang of the results page you point Google at. */
  inLanguage: string;
}
