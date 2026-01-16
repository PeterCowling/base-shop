// src/utils/rootGateway.ts
import { i18nConfig, type AppLanguage } from "../i18n.config";

const BOT_UA_PATTERN =
  /(bot|crawl|spider|slurp|bing|duckduck|baidu|yandex|ahrefs|semrush|facebook|twitterbot|linkedin|pinterest|embedly|quora|reddit|screaming frog|crawler|fetch|python-requests|httpclient|wget|curl)/i;

export function isBotUserAgent(ua: string | null): boolean {
  if (!ua) return true;
  return BOT_UA_PATTERN.test(ua);
}

export function parseAcceptLanguageHeader(
  header: string | null,
  fallback: AppLanguage,
): AppLanguage {
  const supported = new Set(i18nConfig.supportedLngs as readonly string[]);
  if (!header) return fallback;
  const parsed = header
    .split(",")
    .map((part) => part.trim())
    .map((part, index) => {
      const [tagRaw, ...params] = part.split(";").map((s) => s.trim());
      const qParam = params
        .map((p) => p.split("=").map((s) => s.trim()))
        .find(([k]) => k.toLowerCase() === "q")?.[1];
      const quality = qParam ? Number(qParam) : 1;
      const base = tagRaw.toLowerCase().split("-")[0];
      return { base, quality: Number.isFinite(quality) ? quality : 1, index } as const;
    })
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  for (const candidate of parsed) {
    if (supported.has(candidate.base)) {
      return candidate.base as AppLanguage;
    }
  }
  return fallback;
}

export function absoluteUrl(host: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = host.startsWith("http") ? host : `https://${host}`;
  return `${origin}${normalizedPath}`;
}

export function buildBotIndexHTML(host: string): string {
  const { supportedLngs, fallbackLng } = i18nConfig;
  const title = "Hostel Brikette — Language Gateway";
  const alternates = [
    ...supportedLngs.map((lng) => ({ hreflang: lng, href: absoluteUrl(host, `/${lng}`) })),
    { hreflang: "x-default", href: absoluteUrl(host, `/${fallbackLng}`) },
  ];
  const links = alternates
    .map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
    .join("\n    ");
  const list = (supportedLngs as readonly string[])
    .map((lng) => `<li><a href="/${lng}">/${lng}</a></li>`)
    .join("\n        ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
    <link rel="canonical" href="${absoluteUrl(host, `/${fallbackLng}`)}" />
    ${links}
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;line-height:1.5;margin:0;padding:2rem;color:#1b1b1b}
      main{max-width:720px;margin:0 auto}
      h1{font-size:1.25rem;margin:0 0 1rem}
      ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.5rem;padding:0;list-style:none}
      a{color:#00629a;text-decoration:none}
      a:hover{text-decoration:underline}
    </style>
  </head>
  <body>
    <main>
      <h1>Select a language</h1>
      <ul>
        ${list}
      </ul>
    </main>
  </body>
</html>`;
}