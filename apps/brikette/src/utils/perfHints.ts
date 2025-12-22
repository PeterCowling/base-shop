// /src/utils/perfHints.ts
/**
 * Returns a minimal inline script that injects human-only performance hints
 * (font preloads and optional preconnects). Bots/crawlers receive lean HTML
 * with no extra hints to avoid wasting crawl budget.
 */
export function getPerfHintsInitScript(): string {
  // Keep the payload tiny and resilient – no dependencies, minimal whitespace.
  return `(()=>{try{var d=document;var h=d && d.head; if(!h) return; var ua=(navigator&&navigator.userAgent)||"";var isBot=/\b(bot|crawl|spider|slurp|bing|duckduck|baidu|yandex|ahrefs|semrush|facebook|twitterbot|linkedin|pinterest|embedly|quora|reddit|screaming frog|crawler|fetch|python-requests|httpclient|wget|curl)\b/i.test(ua);if(isBot) return;function hasLink(sel){return !!d.querySelector(sel);}function ensurePreloadFont(href){if(!href) return; var q='link[rel="preload"][as="font"][href="'+href+'"]'; if(hasLink(q)) return; var l=d.createElement('link'); l.rel='preload'; l.as='font'; l.href=href; l.type='font/woff2'; l.crossOrigin='anonymous'; l.setAttribute('importance','low'); h.appendChild(l);} /* critical fonts */ ensurePreloadFont('/fonts/poppins-var.woff2'); ensurePreloadFont('/fonts/libre-franklin-400.woff2'); /* Cloudflare Image Resizing runs on same origin (/cdn-cgi/image) so no extra preconnect needed. */ }catch(_){}})();`;
}

export { getPerfHintsInitScript as default };

