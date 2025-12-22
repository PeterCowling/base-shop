import Head from "next/head";
import type { GetServerSideProps } from "next";

import { Grid } from "@acme/ui/atoms/Grid";
import { Section } from "@acme/ui/atoms/Section";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { BASE_URL } from "@/config/site";

type Props = {
  host: string;
};

const BOT_PATTERN =
  /(bot|crawl|spider|slurp|bing|duckduck|baidu|yandex|ahrefs|semrush|facebook|twitterbot|linkedin|pinterest|embedly|quora|reddit|screaming frog|crawler|fetch|python-requests|httpclient|wget|curl)/i;

const isBot = (ua: string | undefined): boolean => {
  if (!ua) return true;
  return BOT_PATTERN.test(ua);
};

const parseAcceptLanguage = (header: string | undefined, fallback: AppLanguage): AppLanguage => {
  const supported = new Set(i18nConfig.supportedLngs as readonly string[]);
  if (!header) return fallback;

  const parsed = header
    .split(",")
    .map((part) => part.trim())
    .map((part, index) => {
      const [tagRaw, ...params] = part.split(";").map((s) => s.trim());
      const tag = tagRaw ?? "";
      const q = params
        .map((p) => p.split("=").map((s) => s.trim()))
        .find(([k]) => (k ?? "").toLowerCase() === "q")?.[1];
      const quality = q ? Number(q) : 1;
      const base = tag.toLowerCase().split("-")[0] ?? "";
      return { base, quality: Number.isFinite(quality) ? quality : 1, index } as const;
    })
    .sort((a, b) => (b.quality - a.quality) || (a.index - b.index));

  for (const item of parsed) {
    if (supported.has(item.base)) return item.base as AppLanguage;
  }
  return fallback;
};

const absoluteUrl = (host: string, path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = host.startsWith("http") ? host : `https://${host}`;
  return `${origin}${normalizedPath}`;
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res }) => {
  const ua = req.headers["user-agent"];
  const fallback = i18nConfig.fallbackLng as AppLanguage;
  const host =
    (process.env["VITE_SITE_DOMAIN"] as string | undefined) ||
    req.headers.host ||
    BASE_URL ||
    "hostel-positano.com";

  if (isBot(Array.isArray(ua) ? ua[0] : ua)) {
    res.setHeader("Cache-Control", "public, max-age=3600"); // i18n-exempt -- LINT-1007 [ttl=2026-12-31] HTTP header value
    return { props: { host } };
  }

  const best = parseAcceptLanguage(
    Array.isArray(req.headers["accept-language"])
      ? req.headers["accept-language"][0]
      : req.headers["accept-language"],
    fallback,
  );

  res.setHeader("Vary", "Accept-Language, User-Agent"); // i18n-exempt -- LINT-1007 [ttl=2026-12-31] HTTP header value
  res.setHeader("Cache-Control", "no-store");

  return {
    redirect: {
      destination: `/${best}`,
      permanent: false,
    },
  };
};

const HomeRedirectIndex = ({ host }: Props): JSX.Element => {
  const fallback = i18nConfig.fallbackLng as AppLanguage;
  const supported = i18nConfig.supportedLngs as readonly string[];
  const title = "Hostel Brikette — Language Gateway"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Non-UI fallback title
  const canonical = absoluteUrl(host, `/${fallback}`);
  const alternates = [
    ...supported.map((lng) => ({ hreflang: lng, href: absoluteUrl(host, `/${lng}`) })),
    { hreflang: "x-default", href: canonical },
  ];

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        {/* i18n-exempt -- SEO-315 [ttl=2026-01-31] Viewport meta value */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="canonical" href={canonical} />
        {alternates.map((alt) => (
          <link
            key={`${alt.hreflang}-${alt.href}`}
            rel="alternate"
            hrefLang={alt.hreflang}
            href={alt.href}
          />
        ))}
      </Head>
      <Section
        as="main"
        width="full"
        padding="none"
        className="mx-auto max-w-3xl px-8 py-10 font-sans text-brand-text"
      >
        {/* i18n-exempt -- LINT-1007 [ttl=2026-12-31] English-only gateway label */}
        <h1 className="text-xl font-semibold">Select a language</h1>
        <Grid
          as="ul"
          columns={{ base: 2, sm: 3, md: 4 }}
          gap={2}
          className="mt-6 list-none p-0"
        >
          {supported.map((lng) => (
            <li key={lng}>
              <a
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-brand-primary hover:underline"
                href={`/${lng}`}
              >
                /{lng}
              </a>
            </li>
          ))}
        </Grid>
      </Section>
    </>
  );
};

export default HomeRedirectIndex;
