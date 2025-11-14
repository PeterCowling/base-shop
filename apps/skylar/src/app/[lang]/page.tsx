import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import PageShell from "@/components/PageShell";
import ServicesSection from "@/components/ServicesSection";
import { getMessages, createTranslator } from "@/lib/messages";
import { resolveLocale, type Locale } from "@/lib/locales";
import { localizedPath } from "@/lib/routes";

type PageParams = Promise<{
  lang?: string[] | string;
}>;

export default async function HomePage({ params }: { params?: PageParams }) {
  const code = await params;
  const lang: Locale = resolveLocale(code?.lang);
  const messages = getMessages(lang);
  const translator = createTranslator(messages);
  const isZh = lang === "zh";
  const join = (...classes: Array<string | false | undefined>) =>
    classes.filter(Boolean).join(" ");
  const baseCard = ["rounded-3xl", "border", "p-6", "md:p-8"];
  const zhCard = ["border-accent/60", "bg-zinc-900/60", "text-zinc-100"];
  const enCard = ["border-slate-200", "bg-white/80", "text-slate-900"];
  const linkBase = [
    "inline-flex",
    "items-center",
    "justify-center",
    "rounded-full",
    "border",
    "px-5",
    "py-2",
    "text-xs",
    "font-semibold",
    "uppercase",
    "skylar-button-tracking",
  ];
  const zhLink = ["border-accent/70", "text-accent"];
  const enLink = ["border-slate-900", "text-slate-900"];

  return (
    <PageShell lang={lang} messages={messages} active="home">
      <HeroSection lang={lang} isZh={isZh} translator={translator} />
      <ServicesSection translator={translator} isZh={isZh} />
      <div
        className={join(...baseCard, ...(isZh ? zhCard : enCard))}
      >
        <p className="font-display text-3xl uppercase skylar-heading-tracking">
          {translator("realEstate.heading")}
        </p>
        <p className={`mt-4 font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-slate-700"}`}>
          {translator("realEstate.intro")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={localizedPath(lang, "realEstate")}
            className={join(...linkBase, ...(isZh ? zhLink : enLink))}
          >
            {translator("realEstate.cta")}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
