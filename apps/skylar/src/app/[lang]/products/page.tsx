import PageShell from "@/components/PageShell";
import { Grid } from "@/components/primitives/Grid";
import { createTranslator, getMessages } from "@/lib/messages";
import { resolveLocale, type Locale } from "@/lib/locales";
import { localizedPath } from "@/lib/routes";

const SECTION_KEYS = [
  {
    title: "products.sections.design.title",
    body: "products.sections.design.body",
  },
  {
    title: "products.sections.distribution.title",
    body: "products.sections.distribution.body",
  },
  {
    title: "products.sections.platform.title",
    body: "products.sections.platform.body",
  },
  {
    title: "products.sections.markets.title",
    body: "products.sections.markets.body",
  },
];

type PageParams = Promise<{
  lang?: string[] | string;
}>;

const joinClasses = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export default async function ProductsPage({ params }: { params?: PageParams }) {
  const code = await params;
  const lang: Locale = resolveLocale(code?.lang);
  const messages = getMessages(lang);
  const translator = createTranslator(messages);
  const isZh = lang === "zh";
  const basePanel = ["rounded-3xl", "border", "p-6", "md:p-8"];
  const zhPanel = ["border-accent/50", "bg-zinc-900/60", "text-zinc-100"];
  const enPanel = ["border-slate-200", "bg-white/80", "text-slate-900"];
  const ctaLinkBase = [
    "inline-flex",
    "items-center",
    "justify-center",
    "rounded-full",
    "border",
    "px-5",
    "py-3",
    "text-xs",
    "font-semibold",
    "uppercase",
    "skylar-button-tracking",
  ];
  const ctaZh = ["border-accent/70", "text-accent"];
  const ctaEn = ["border-slate-900", "text-slate-900"];

  return (
    <PageShell lang={lang} messages={messages} active="products">
      <section className="space-y-6">
        <p className="font-display text-4xl uppercase skylar-heading-tracking">
          {translator("products.heading")}
        </p>
        <p className={`font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-slate-700"}`}>
          {translator("products.intro")}
        </p>
      </section>
      <Grid cols={1} gap={6} className="md:grid-cols-2">
        {SECTION_KEYS.map((section) => (
          <article
            key={section.title}
            className={joinClasses(...basePanel, ...(isZh ? zhPanel : enPanel))}
          >
            <p className="font-display text-xl uppercase skylar-subheading-tracking">
              {translator(section.title)}
            </p>
            <p className={`mt-4 font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-slate-700"}`}>
              {translator(section.body)}
            </p>
          </article>
        ))}
      </Grid>
      <section>
        <div className={joinClasses(...basePanel, ...(isZh ? zhPanel : enPanel))}>
          <p className="font-display text-2xl uppercase skylar-subheading-tracking">
            {translator("products.cta")}
          </p>
          <p className={`mt-4 font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-slate-700"}`}>
            {translator("hero.copy")}
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href="mailto:cmcowling@me.com"
              className={joinClasses(...ctaLinkBase, ...(isZh ? ctaZh : ctaEn))}
            >
              {translator("people.cristiana.contact.emailLabel")}
            </a>
            <a
              href={localizedPath(lang, "people")}
              className={joinClasses(...ctaLinkBase, ...(isZh ? ctaZh : ctaEn))}
            >
              {translator("nav.people")}
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
