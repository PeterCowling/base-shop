import Link from "next/link";
import type { Metadata } from "next";
import Section from "@/components/Section";
import PageHeader from "@/components/PageHeader";
import { resolveLocale } from "@/lib/locales";
import { createTranslator, loadMessages } from "@/lib/messages";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  return buildMetadata({
    locale,
    title: t("contact.meta.title"),
    description: t("contact.meta.description"),
    path: "/contact",
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  return (
    <Section>
      <PageHeader
        eyebrow={t("contact.eyebrow")}
        title={t("contact.title")}
        description={t("contact.body")}
      />
      <div className="mt-6 space-y-4">
        <div className="surface rounded-3xl border border-border-1 p-5 text-sm text-muted-foreground">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("contact.phoneLabel")}
              </div>
              <Link href={`tel:${SUPPORT_PHONE}`} className="text-base font-semibold text-foreground">
                {SUPPORT_PHONE}
              </Link>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("contact.emailLabel")}
              </div>
              <Link href={`mailto:${SUPPORT_EMAIL}`} className="text-base font-semibold text-foreground">
                {SUPPORT_EMAIL}
              </Link>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("contact.hoursLabel")}
              </div>
              <div>{t("contact.hours")}</div>
            </div>
          </div>
        </div>
        <Link
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-accent focus-visible:focus-ring"
        >
          {t("contact.cta")}
        </Link>
      </div>
    </Section>
  );
}
