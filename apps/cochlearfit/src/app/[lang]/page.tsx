import Link from "next/link";
import type { Metadata } from "next";
import Section from "@/components/Section";
import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";
import Grid from "@/components/layout/Grid";
import Stack from "@/components/layout/Stack";
import { resolveLocale } from "@/lib/locales";
import { createTranslator, loadMessages } from "@/lib/messages";
import { getProducts } from "@/lib/catalog";
import { withLocale } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);
  const path = "/";
  const ogImage = `${SITE_URL}/images/og-home.svg`;

  return buildMetadata({
    locale,
    title: t("home.meta.title"),
    description: t("home.meta.description"),
    path,
    openGraph: {
      title: t("home.meta.title"),
      description: t("home.meta.description"),
      url: new URL(withLocale(path, locale), SITE_URL).toString(),
      type: "website",
      image: {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: t("home.meta.ogAlt"),
      },
    },
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);
  const products = getProducts();

  return (
    <div className="space-y-4">
      <Section>
        <div className="surface animate-fade-up rounded-3xl border border-border-1 p-6">
          <PageHeader
            eyebrow={t("home.hero.eyebrow")}
            title={t("home.hero.title")}
            description={t("home.hero.body")}
          />
          <Stack className="mt-6 gap-3">
            <Link
              href={withLocale("/shop", locale)}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-accent focus-visible:focus-ring"
            >
              {t("home.hero.ctaPrimary")}
            </Link>
            <Link
              href={withLocale("/sizing", locale)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-1 px-5 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-accent focus-visible:focus-ring"
            >
              {t("home.hero.ctaSecondary")}
            </Link>
          </Stack>
        </div>
      </Section>

      <Section className="pt-0">
        <Grid className="gap-4">
          <div className="surface animate-fade-up rounded-3xl border border-border-1 p-5 delay-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("home.promise.eyebrow")}
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              {t("home.promise.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("home.promise.body")}</p>
          </div>
          <Grid className="gap-3">
            {["home.promise.point1", "home.promise.point2", "home.promise.point3"].map((key) => (
              <div
                key={key}
                className="animate-fade-up rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm text-muted-foreground shadow-soft"
              >
                {t(key)}
              </div>
            ))}
          </Grid>
        </Grid>
      </Section>

      <Section className="pt-0">
        <PageHeader
          eyebrow={t("home.featured.eyebrow")}
          title={t("home.featured.title")}
          description={t("home.featured.body")}
        />
        <div className="mt-6">
          <ProductGrid products={products} />
        </div>
      </Section>

      <Section className="pt-0">
        <div className="surface animate-fade-up rounded-3xl border border-border-1 p-5">
          <h2 className="font-display text-2xl font-semibold">
            {t("home.fit.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("home.fit.body")}</p>
          <Link
            href={withLocale("/faq", locale)}
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full border border-border-1 px-5 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-accent focus-visible:focus-ring"
          >
            {t("home.fit.cta")}
          </Link>
        </div>
      </Section>
    </div>
  );
}
