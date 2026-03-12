import type { SVGProps } from "react";
import Link from "next/link";
import { ChatBubbleIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";

import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import { XaHomeCatalogSections } from "../components/XaHomeCatalogSections.client";
import { XA_CATALOG_RUNTIME_FRESHNESS } from "../lib/catalogRuntimeMeta";
import { siteConfig } from "../lib/siteConfig";
import { xaI18n } from "../lib/xaI18n";

function HeroIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 500"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {/* draped fabric — rear layer */}
      <rect x="80" y="60" width="180" height="340" rx="2" fill="currentColor" opacity="0.07" />
      {/* mid layer — slightly rotated panel */}
      <polygon
        points="120,80 320,100 300,440 100,420"
        fill="currentColor"
        opacity="0.11"
      />
      {/* front layer — structured silhouette */}
      <polygon
        points="150,70 270,70 290,430 130,430"
        fill="currentColor"
        opacity="0.08"
      />
      {/* shoulder line */}
      <line x1="140" y1="120" x2="260" y2="120" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      {/* vertical seam */}
      <line x1="200" y1="120" x2="200" y2="420" stroke="currentColor" strokeWidth="0.8" opacity="0.18" strokeDasharray="4 6" />
      {/* hem line */}
      <line x1="132" y1="400" x2="268" y2="400" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      {/* collar notch */}
      <path
        d="M180 70 L200 110 L220 70"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HangerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4a2 2 0 0 0-2 2v1.2a3.2 3.2 0 0 0 2 2.97l.8.33c1.08.45 1.2.6 1.2 1.15V15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 17.5c0-.7.43-1.33 1.08-1.59l6.35-2.54c.36-.14.76-.14 1.12 0l6.35 2.54c.65.26 1.08.89 1.08 1.59v.5H4v-.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const staleCatalogCopy = "Catalog data may be stale."; // i18n-exempt -- XA-0090 [ttl=2026-12-31] public-safe status ribbon

  return (
    <main className="sf-content">
      {XA_CATALOG_RUNTIME_FRESHNESS.isStale ? (
        <Section padding="default" className="pt-6">
          <div className="border border-warning bg-warning-soft px-4 py-3 text-sm text-warning-fg">
            {staleCatalogCopy}
          </div>
        </Section>
      ) : null}
      <Section padding="wide" className="pt-10">
        <div className="xa-grid-home-primary">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="xa-hero-title">
                {siteConfig.heroHeadline}
              </h1>
              <p className="xa-hero-copy text-muted-foreground">
                {siteConfig.heroSubheadline}
              </p>
            </div>
            <Button
              asChild
              className="xa-hero-cta rounded-none bg-foreground px-6 text-primary-foreground hover:bg-foreground/90"
            >
              <Link href="/pages/how-to-shop">Join Us</Link>
            </Button>
          </div>
          <div className="xa-hero-media w-full md:justify-self-end xa-hero-media-max">
            <div className="p-6 md:p-10">
              <div className="relative xa-aspect-4-5 w-full">
                <HeroIllustration className="h-full w-full text-foreground" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <XaHomeCatalogSections />

      <Section padding="default">
        <Grid columns={{ base: 1, md: 3 }} gap={6}>
          <Link
            href="/pages/how-to-shop"
            className="group flex h-full flex-col gap-2 border p-6 hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div className="text-muted-foreground">
              <HangerIcon className="h-6 w-6" />
            </div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              How to shop
            </div>
            <div className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.page.l113c60")}</div>
          </Link>

          <Link
            href="/faqs"
            className="group flex h-full flex-col gap-2 border p-6 hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div className="text-muted-foreground">
              <QuestionMarkCircledIcon className="h-6 w-6" />
            </div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              FAQs
            </div>
            <div className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.page.l128c60")}</div>
          </Link>

          <Link
            href="/pages/contact-us"
            className="group flex h-full flex-col gap-2 border p-6 hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div className="text-muted-foreground">
              <ChatBubbleIcon className="h-6 w-6" />
            </div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              Need help?
            </div>
            <div className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.page.l141c60")}</div>
          </Link>
        </Grid>
      </Section>
    </main>
  );
}
