import Link from "next/link";
import { Inline } from "@/components/primitives/Inline";
import { type Locale } from "@/lib/locales";
import { localizedPath, type Section } from "@/lib/routes";

type NavProps = {
  lang: Locale;
  active: Section;
  translator: (key: string) => string;
  isZh: boolean;
};

const NAV_ITEMS: Array<{ key: Section; labelKey: string }> = [
  { key: "home", labelKey: "nav.home" },
  { key: "products", labelKey: "nav.products" },
  { key: "realEstate", labelKey: "nav.realEstate" },
  { key: "people", labelKey: "nav.people" },
];

const LANGUAGES: Array<{ code: Locale; labelKey: string }> = [
  { code: "en", labelKey: "langLabel.en" },
  { code: "it", labelKey: "langLabel.it" },
  { code: "zh", labelKey: "langLabel.zh" },
];

type ClassValue = string | undefined | false | Array<string | undefined | false>;

function classNames(...classes: ClassValue[]) {
  return classes
    .flatMap((cls) => (Array.isArray(cls) ? cls : [cls]))
    .filter(Boolean)
    .join(" ");
}

export default function Nav({ lang, active, translator, isZh }: NavProps) {
  const accent = isZh ? "text-accent" : "text-slate-900";
  const borderColor = isZh ? "border-accent/40" : "border-slate-200";
  const baseNavItem = [
    "transition",
    "duration-300",
    "font-display",
    "text-xs",
    "uppercase",
    "skylar-nav-text",
    "font-semibold",
  ];
  const activeLink = accent;
  const inactiveLink = isZh
    ? ["text-zinc-200/80", "hover:text-accent"]
    : ["text-slate-500", "hover:text-slate-900"];

  return (
    <nav
      className={classNames(
        "flex",
        "flex-col",
        "gap-6",
        "border-b",
        "pb-6",
        borderColor
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className={classNames(
              "font-display",
              "text-3xl",
              "uppercase",
              "skylar-heading-tracking",
              accent
            )}
          >
            {translator("hero.headline")}
          </p>
          <p className={classNames("text-xs", "uppercase", "skylar-nav-text", "text-slate-500")}>
            {translator("people.companyLine")}
          </p>
        </div>
        <LanguageSwitch
          lang={lang}
          translator={translator}
          currentSection={active}
          isZh={isZh}
        />
      </div>
      <Inline gap={6} className={classNames("text-xs", "uppercase", "skylar-nav-text")}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={localizedPath(lang, item.key)}
              className={classNames(baseNavItem, isActive ? activeLink : inactiveLink)}
            >
              {translator(item.labelKey)}
            </Link>
          );
        })}
      </Inline>
    </nav>
  );
}

function LanguageSwitch({
  lang,
  translator,
  currentSection,
  isZh,
}: {
  lang: Locale;
  translator: (key: string) => string;
  currentSection: Section;
  isZh: boolean;
}) {
  const activeLang = isZh ? ["text-accent"] : ["text-slate-900"];
  const inactiveLang = isZh
    ? ["text-zinc-200/80", "hover:text-accent"]
    : ["text-slate-500", "hover:text-slate-900"];
  return (
    <Inline gap={3} wrap={false}>
      {LANGUAGES.map((option) => {
        const isActive = option.code === lang;
        return (
          <Link
            key={option.code}
            href={localizedPath(option.code, currentSection)}
            className={classNames(
              "transition-colors",
              "skylar-caption",
              isActive ? activeLang : inactiveLang
            )}
          >
            {translator(option.labelKey)}
          </Link>
        );
      })}
    </Inline>
  );
}
