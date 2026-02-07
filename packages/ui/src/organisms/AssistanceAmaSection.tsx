// packages/ui/src/organisms/AssistanceAmaSection.tsx
/* AMA search – accepts an `initialQuery` so deep-links work. */
import { type ChangeEvent, type JSX,memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Fuse, { type IFuseOptions } from "fuse.js";

import { Section } from "../atoms/Section";
import type { AssistanceKeyword, AssistanceKeywordResource } from "../utils/parseAmaKeywords";
import { parseAssistanceKeywords } from "../utils/parseAmaKeywords";

const clean = (s?: string): string => (s ? s.trim() : "");

const renderLinks = (item: AssistanceKeyword): JSX.Element[] =>
  item.links.map(({ href, text }) => (
    <div key={`${item.slug}-${href}`} className="mt-1">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block min-h-10 min-w-10 break-all font-medium text-brand-primary decoration-brand-primary underline underline-offset-2 transition-colors hover:decoration-brand-bougainvillea dark:text-brand-secondary dark:decoration-brand-secondary"
      >
        {text}
      </a>
    </div>
  ));

const fuseOpts: IFuseOptions<AssistanceKeyword> = {
  keys: ["synonyms", "question", "answer"],
  threshold: 0.3,
};

export interface AmaSectionProps {
  initialQuery?: string;
  lang?: string;
}

function AssistanceAmaSection({ initialQuery = "", lang }: AmaSectionProps): JSX.Element {
  const { t, i18n } = useTranslation(["assistanceSection", "assistanceKeywords"], { lng: lang });
  const [term, setTerm] = useState<string>(initialQuery);

  useEffect(() => setTerm(initialQuery), [initialQuery]);

  const effectiveLang = lang ?? i18n.language;
  const fallbackLangOption = i18n.options?.fallbackLng;
  const fallbackLang = Array.isArray(fallbackLangOption)
    ? fallbackLangOption[0]
    : typeof fallbackLangOption === "string"
      ? fallbackLangOption
      : "en";
  const getResourceBundle = (lng: string): AssistanceKeywordResource | undefined => {
    const data = i18n.getDataByLanguage?.(lng);
    if (!data) return undefined;
    const resource = data["assistanceKeywords"];
    return (resource as AssistanceKeywordResource) ?? undefined;
  };

  const primaryResource = getResourceBundle(effectiveLang);
  const fallbackResource = getResourceBundle(fallbackLang);

  const data = useMemo<AssistanceKeyword[]>(
    () => parseAssistanceKeywords(primaryResource, fallbackResource),
    [primaryResource, fallbackResource],
  );
  const fuse = useMemo(() => new Fuse(data, fuseOpts), [data]);

  const results = useMemo<AssistanceKeyword[]>(
    () => (term.trim() ? fuse.search(term.trim()).map((r) => r.item) : []),
    [fuse, term]
  );

  const clear = useCallback(() => setTerm(""), []);
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setTerm(e.target.value), []);

  return (
    <section id="ama" data-testid="ama-section" className="py-12 text-brand-text dark:text-brand-surface">
      <Section as="div" padding="none" className="max-w-4xl space-y-10 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
          {t("amaHeadingPart1")}<span className="font-extrabold text-brand-primary dark:text-brand-secondary">{t("amaHeadingPart2")}</span>?
        </h2>

        <div className="relative flex">
          <label htmlFor="textSearch" className="sr-only">
            {t("askPlaceholder")}
          </label>
          <input
            id="textSearch"
            type="text"
            placeholder={t("askPlaceholder")}
            className="peer w-full rounded-md border border-brand-surface bg-brand-bg px-4 py-2 pr-10 text-base leading-tight text-brand-text shadow-sm transition focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:border-brand-text dark:bg-brand-text dark:text-brand-surface"
            value={term}
            onChange={onChange}
          />
          {term && (
            <button
              type="button"
              onClick={clear}
              aria-label={t("clearLabel")}
              className="absolute inset-y-0 end-0 inline-flex min-h-10 min-w-10 items-center justify-center px-3 text-2xl font-light text-brand-text/60 transition hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              ×
            </button>
          )}
        </div>

        <div id="results" className="space-y-6">
          {results.length > 0 && (
            <p className="text-sm text-brand-text/70 dark:text-brand-surface/70">
              {results.length} {t("answersFoundLabel")}
            </p>
          )}

          {results.map((item) => (
            <article
              key={item.slug}
              className="rounded-lg border border-brand-surface bg-brand-surface p-6 shadow-sm transition-colors dark:border-brand-surface/20 dark:bg-brand-text"
            >
              <h3 className="text-lg font-semibold leading-tight">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text/90 dark:text-brand-surface/90">
                {clean(item.answer)}
              </p>
              <div className="mt-3 space-y-1">{renderLinks(item)}</div>
            </article>
          ))}

          {results.length === 0 && (
            <p className="text-sm text-brand-text/70 dark:text-brand-surface/70">{t("noMatchesFound")}</p>
          )}
        </div>

        <div className="space-y-3">
          <p>{t("amaParagraph1")}</p>
          <p>{t("amaParagraph2")}</p>
          <p>{t("amaParagraph3")}</p>
        </div>
      </Section>
    </section>
  );
}

export default memo(AssistanceAmaSection);
export { AssistanceAmaSection };
