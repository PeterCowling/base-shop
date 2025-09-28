import Link from "next/link";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Grid as DSGrid, Stack } from "@ui/components/atoms/primitives";
import { useTranslations as serverT } from "@acme/i18n/useTranslations.server";

// cards defined from translations inside component below

export default async function DataIndex({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const t = await serverT("en");
  const { shop } = await params;
  const cards = [
    {
      title: t("cms.data.cards.inventory.title"),
      eyebrow: t("cms.data.cards.inventory.eyebrow"),
      description: t("cms.data.cards.inventory.description"),
      bullets: [
        t("cms.data.cards.inventory.bullets.0"),
        t("cms.data.cards.inventory.bullets.1"),
        t("cms.data.cards.inventory.bullets.2"),
      ],
      href: (s: string) => `/cms/shop/${s}/data/inventory`,
      cta: t("cms.data.cards.inventory.cta"),
      accent: "bg-hero-contrast",
    },
    {
      title: t("cms.data.cards.pricing.title"),
      eyebrow: t("cms.data.cards.pricing.eyebrow"),
      description: t("cms.data.cards.pricing.description"),
      bullets: [
        t("cms.data.cards.pricing.bullets.0"),
        t("cms.data.cards.pricing.bullets.1"),
        t("cms.data.cards.pricing.bullets.2"),
      ],
      href: (s: string) => `/cms/shop/${s}/data/rental/pricing`,
      cta: t("cms.data.cards.pricing.cta"),
      accent: "bg-hero-contrast",
    },
    {
      title: t("cms.data.cards.returns.title"),
      eyebrow: t("cms.data.cards.returns.eyebrow"),
      description: t("cms.data.cards.returns.description"),
      bullets: [
        t("cms.data.cards.returns.bullets.0"),
        t("cms.data.cards.returns.bullets.1"),
        t("cms.data.cards.returns.bullets.2"),
      ],
      href: (s: string) => `/cms/shop/${s}/data/return-logistics`,
      cta: t("cms.data.cards.returns.cta"),
      accent: "bg-hero-contrast",
    },
  ] as const;
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/20 to-transparent" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">{t("cms.data.tag").replace("{shop}", shop)}</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">{t("cms.data.heading")}</h1>
          <p className="text-sm text-hero-foreground/80 md:text-base">{t("cms.data.subheading")}</p>
          <DSGrid cols={1} gap={3} className="sm:grid-cols-3">
            {[
              { label: t("cms.data.stats.systems.label"), value: t("cms.data.stats.systems.value") },
              { label: t("cms.data.stats.cadence.label"), value: t("cms.data.stats.cadence.value") },
              { label: t("cms.data.stats.owner.label"), value: t("cms.data.stats.owner.value") },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/10 bg-surface-2 px-4 py-3 text-xs text-muted-foreground"
              >
                <p className="font-semibold uppercase tracking-wide">{item.label}</p>
                <p className="mt-1 text-sm text-foreground">{item.value}</p>
              </div>
            ))}
          </DSGrid>
        </div>
      </section>

      <section>
        <DSGrid cols={1} gap={4} className="md:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.title}
            className={`border border-border/10 ${card.accent} text-hero-foreground shadow-elevation-3`}
          >
            <CardContent>
              <Stack gap={4} className="h-full p-6">
                <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-hero-foreground/80">{card.eyebrow}</span>
                <h2 className="text-xl font-semibold leading-tight">{card.title}</h2>
                <p className="text-sm text-hero-foreground/80">{card.description}</p>
                </div>
              <ul className="grow list-disc space-y-2 pl-5 text-sm text-hero-foreground/80">
                {card.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <Button
                asChild
                variant="outline"
                className="group mt-auto inline-flex h-11 items-center justify-between rounded-xl px-4 text-sm font-semibold"
              >
                <Link href={card.href(shop)}>
                  <span>{card.cta}</span>
                  <ArrowRightIcon className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
        </DSGrid>
      </section>
    </div>
  );
}
