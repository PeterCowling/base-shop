// packages/ui/src/organisms/AssistanceArticleSection.tsx
import type { TFunction } from "i18next";
import { memo, useMemo, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Section } from "../atoms/Section";

export interface MediaItem {
  src: string;
  alt: string;
}

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode;
}

export interface ArticleSectionProps {
  namespace: string;
  media?: Record<string, MediaItem>;
  lang?: string;
}

const ExternalLink = memo(({ children, ...rest }: ExternalLinkProps): JSX.Element => (
  <a
    {...rest}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block min-h-10 min-w-10 font-medium text-brand-primary decoration-brand-primary underline underline-offset-2 transition-colors hover:decoration-brand-bougainvillea focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:text-brand-secondary dark:decoration-brand-secondary"
  >
    {children}
  </a>
));
ExternalLink.displayName = "ExternalLink";

type Bundle = Record<string, unknown> & { headings?: Record<string, unknown> };

const getSectionKeys = (bundle: Bundle | undefined): string[] =>
  bundle?.headings && typeof bundle.headings === "object"
    ? Object.keys(bundle.headings)
    : Object.keys(bundle ?? {})
        .filter((k) => k.startsWith("headings."))
        .map((k) => k.replace(/^headings\./u, ""));

const getH1 = (t: TFunction, ns: string): string =>
  (t(`nav.${ns}`, {
    ns: "assistanceCommon",
    defaultValue: t("title", {
      ns,
      defaultValue: ns.replace(/([A-Z])/gu, " $1").replace(/^./u, (c: string) => c.toUpperCase()),
    }),
  }) as string) || ns;

function AssistanceArticleSection({ namespace, media, lang }: ArticleSectionProps): JSX.Element {
  const { t, i18n, ready } = useTranslation([namespace, "assistanceCommon"], { lng: lang });
  const effectiveLang = lang ?? i18n.language;

  const sectionKeys = useMemo(() => {
    if (!ready) return [];
    return getSectionKeys(i18n.getResourceBundle(effectiveLang, namespace) as Bundle | undefined);
  }, [i18n, namespace, ready, effectiveLang]);

  const h1 = useMemo(() => {
    if (!ready) return "";
    return getH1(t, namespace);
  }, [t, namespace, ready]);

  const linkComponents = useMemo(
    () => ({
      a: <ExternalLink />,
      em: <em className="italic" />,
    }),
    []
  );

  const sections = useMemo(
    () =>
      sectionKeys.map((key, idx) => {
        const img = media?.[key];
        const even = idx % 2 === 0;
        const heading = t(`headings.${key}`, { ns: namespace }) as string;

        return (
          <article key={key} id={key} className="mb-16 scroll-mt-30 first:mt-0 last:mb-0">
            {heading.trim() !== "" && (
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-brand-heading dark:text-brand-surface lg:text-3xl">
                {heading}
              </h2>
            )}

            <div
              className={
                img
                  ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
                    "grid gap-6 md:grid-cols-12 md:gap-10"
                  : /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
                    "flex flex-col"
              }
            >
              {img && (
                <figure
                  className={`${
                    even ? "md:order-1" : "md:order-2"
                  } aspect-[4/3] md:col-span-5 lg:col-span-4 overflow-hidden rounded-xl shadow-lg`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- UI-1000 [ttl=2026-12-31] UI package is not Next-only; media can be remote/static */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center"
                  />
                </figure>
              )}

              <p
                className={`leading-relaxed ${
                  img ? `${even ? "md:order-2" : "md:order-1"} md:col-span-7 lg:col-span-8` : ""
                }`}
              >
                <Trans i18nKey={`content.${key}`} ns={namespace} components={linkComponents} t={t} />
              </p>
            </div>
          </article>
        );
      }),
    [sectionKeys, namespace, t, media, linkComponents]
  );

  return (
    <Section as="section" padding="none" className="prose max-w-4xl px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-8 dark:prose-invert">
      <h1 className="mb-14 text-3xl font-bold tracking-tight lg:text-4xl">{h1}</h1>
      {sections}
    </Section>
  );
}

export default memo(AssistanceArticleSection);
