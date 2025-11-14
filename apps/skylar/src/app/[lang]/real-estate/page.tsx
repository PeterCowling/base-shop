import Image from "next/image";
import PageShell from "@/components/PageShell";
import { createTranslator, getMessages } from "@/lib/messages";
import { resolveLocale, type Locale } from "@/lib/locales";

const SECTIONS = [
  {
    title: "realEstate.sections.location.title",
    body: "realEstate.sections.location.body",
  },
  {
    title: "realEstate.sections.guests.title",
    body: "realEstate.sections.guests.body",
  },
  {
    title: "realEstate.sections.experience.title",
    body: "realEstate.sections.experience.body",
  },
];

type PageParams = Promise<{
  lang?: string[] | string;
}>;

const joinClasses = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export default async function RealEstatePage({ params }: { params?: PageParams }) {
  const code = await params;
  const lang: Locale = resolveLocale(code?.lang);
  const messages = getMessages(lang);
  const translator = createTranslator(messages);
  const isZh = lang === "zh";
  const basePanel = ["rounded-3xl", "border", "p-6", "md:p-8"];
  const zhPanel = ["border-accent/50", "bg-zinc-900/60", "text-zinc-100"];
  const enPanel = ["border-slate-200", "bg-white/80", "text-slate-900"];
  const ctaLinkBase = [
    "mt-6",
    "inline-flex",
    "w-full",
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
    <PageShell lang={lang} messages={messages} active="realEstate">
      <section className="space-y-6">
        <p className="font-display text-4xl uppercase skylar-heading-tracking">
          {translator("realEstate.heading")}
        </p>
        <p className={`font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-slate-700"}`}>
          {translator("realEstate.intro")}
        </p>
      </section>
      <section className="grid gap-8 skylar-real-grid">
        <div className="space-y-6">
          {SECTIONS.map((section) => (
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
        </div>
        <div className="space-y-6">
          <div
            className={joinClasses("rounded-3xl", "border", "p-6", ...(isZh ? zhPanel : enPanel))}
          >
            <Image
              src="/hostel-positano.svg" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("realEstate.imageAlt")}
              width={320}
              height={220}
              className="h-auto w-full rounded-2xl"
              priority
            />
            <p
              className={joinClasses(
                "mt-6",
                "font-body",
                "text-base",
                "leading-6",
                isZh ? "text-zinc-200" : "text-slate-700"
              )}
            >
              {translator("realEstate.note")}
            </p>
            <a
              href="https://hostel-positano.com"
              target="_blank"
              rel="noreferrer"
              className={joinClasses(...ctaLinkBase, ...(isZh ? ctaZh : ctaEn))}
            >
              {translator("realEstate.cta")}
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
