import { LEGACY_REDIRECTS } from "../generated/legacy-redirects.js";

function appendQueryParams(targetUrl, sourceUrl) {
  for (const [key, value] of sourceUrl.searchParams) {
    targetUrl.searchParams.append(key, value);
  }
}

function resolveLegacyTarget(pathname) {
  if (LEGACY_REDIRECTS.has(pathname)) return LEGACY_REDIRECTS.get(pathname);

  if (pathname !== "/" && pathname.endsWith("/")) {
    return LEGACY_REDIRECTS.get(pathname.slice(0, -1)) ?? null;
  }

  return LEGACY_REDIRECTS.get(`${pathname}/`) ?? null;
}

export async function onRequest(context) {
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    return context.next();
  }

  const sourceUrl = new URL(context.request.url);
  const redirectTarget = resolveLegacyTarget(sourceUrl.pathname);

  if (!redirectTarget) {
    return context.next();
  }

  const targetUrl = new URL(redirectTarget, sourceUrl.origin);
  if (targetUrl.pathname === sourceUrl.pathname) {
    return context.next();
  }

  appendQueryParams(targetUrl, sourceUrl);
  return Response.redirect(targetUrl.toString(), 301);
}
