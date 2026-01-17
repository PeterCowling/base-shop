import { NextResponse, type NextRequest } from "next/server";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { getPages, updatePage as updatePageInRepo } from "@acme/platform-core/repositories/pages/index.server";
import type { Page, Locale } from "@acme/types";

type Visibility = "public" | "hidden";

type PatchBody = {
  updatedAt?: string;
  slug?: string;
  visibility?: Visibility | string;
  locale?: string;
  title?: string | Record<string, string>;
  seo?: {
    title?: string | Record<string, string>;
    description?: Record<string, string>;
    image?: Record<string, string>;
    noindex?: boolean | string;
  };
  // Allow additional keys for form/multipart compatibility
  [key: string]: unknown;
};

function normalizeTitle(
  input: unknown,
  locale?: string,
  previous?: Page["seo"]["title"]
): Partial<Record<Locale, string>> | undefined {
  if (!input) return undefined;
  if (typeof input === "string") {
    const l = ((locale || "en") as Locale) || ("en" as Locale);
    return { ...(previous ?? {}), [l]: input };
  }
  if (typeof input === "object") return input as Partial<Record<Locale, string>>;
  return undefined;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string; id: string }> }
) {
  try {
    const t = await getServerTranslations("en");
    const { shop, id } = await context.params;

    // Accept both JSON and multipart form bodies for flexibility
    let body: PatchBody = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      body = (json ?? {}) as PatchBody;
    } else if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const entries: [string, unknown][] = [];
      for (const [k, v] of fd.entries()) entries.push([k, v]);
      body = Object.fromEntries(entries) as PatchBody;
      // Coerce booleans
      if (typeof body["seo.noindex"] === "string") {
        body["seo.noindex"] = body["seo.noindex"] === "true";
      }
      // Try parse JSON fields if provided
      for (const k of ["seo", "title"]) {
        try {
          if (typeof body[k] === "string" && body[k].startsWith("{")) body[k] = JSON.parse(body[k]);
        } catch {
          /* ignore */
        }
      }
    } else {
      // Fallback attempt JSON
      body = await req.json().catch(() => ({}));
    }

    const updatedAt = body?.updatedAt as string | undefined;
    if (!updatedAt) {
      return NextResponse.json({ error: t("api.cms.pages.updatedAtRequired") }, { status: 400 });
    }

    const pages = await getPages(shop);
    const previous = pages.find((p) => p.id === id);
    if (!previous) {
      return NextResponse.json({ error: t("api.cms.pages.notFound") }, { status: 404 });
    }

    // Build patch respecting optional fields
    const patch: Partial<Page> & { id: string; updatedAt: string } = {
      id,
      updatedAt,
    };

    if (typeof body.slug === "string") patch.slug = body.slug;
    if (typeof body.visibility === "string" && (body.visibility === "public" || body.visibility === "hidden")) {
      patch.visibility = body.visibility as Visibility;
    }

    // SEO updates
    const locale = typeof body.locale === "string" ? body.locale : undefined;
    const nextSeo: Page["seo"] = { ...previous.seo };

    // title can arrive as seo.title (object) or title (string/object)
    const titleInput = body?.seo?.title ?? body?.title;
    const normTitle = normalizeTitle(titleInput, locale, previous.seo.title);
    if (normTitle) nextSeo.title = normTitle;

    // description/image may be provided as seo.description / seo.image objects
    if (body?.seo && typeof body.seo === "object") {
      if (body.seo.description && typeof body.seo.description === "object") {
        nextSeo.description = body.seo.description;
      }
      if (body.seo.image && typeof body.seo.image === "object") {
        nextSeo.image = body.seo.image;
      }
      if (typeof body.seo.noindex === "boolean") {
        nextSeo.noindex = !!body.seo.noindex;
      }
    }

    // If any SEO field changed, attach
    if (
      (normTitle && JSON.stringify(previous.seo.title) !== JSON.stringify(nextSeo.title)) ||
      (nextSeo.description && JSON.stringify(previous.seo.description ?? {}) !== JSON.stringify(nextSeo.description)) ||
      (nextSeo.image && JSON.stringify(previous.seo.image ?? {}) !== JSON.stringify(nextSeo.image)) ||
      (typeof nextSeo.noindex === "boolean" && previous.seo.noindex !== nextSeo.noindex)
    ) {
      patch.seo = nextSeo;
    }

    const saved = await updatePageInRepo(shop, patch, previous);
    return NextResponse.json(saved);
  } catch (err) {
    const message = (err as Error)?.message || String(err);
    const status =
      typeof message === "string" &&
      message.includes(
        "Conflict: page has been modified", // i18n-exempt -- TECH-000 error discriminator from backend [ttl=2099-12-31]
      )
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
