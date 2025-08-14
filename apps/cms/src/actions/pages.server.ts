// apps/cms/src/actions/pages.server.ts

import { LOCALES } from "@acme/i18n";
import * as Sentry from "@sentry/node";
import type { Locale, Page, HistoryState } from "@acme/types";
import { historyStateSchema } from "@acme/types";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";

import { env } from "@acme/config";
import { ensureAuthorized } from "./common/auth";
import {
  componentsField,
  createSchema,
  updateSchema,
  emptyTranslated,
  type PageCreateForm,
  type PageUpdateForm,
  type PageComponents,
} from "./pages/validation";
import {
  getPages,
  savePage as savePageInService,
  updatePage as updatePageInService,
  deletePage as deletePageFromService,
} from "./pages/service";

/* -------------------------------------------------------------------------- */
/*  Create Page                                                               */
/* -------------------------------------------------------------------------- */

export async function createPage(
  shop: string,
  formData: FormData
): Promise<{ page?: Page; errors?: Record<string, string[]> }> {
  const session = await ensureAuthorized();

  // tests can pass an id (e.g. "p1"); otherwise generate a ULID
  const idField = formData.get("id");
  const id =
    typeof idField === "string" && idField.trim().length
      ? idField.trim()
      : ulid();

  const parsed = createSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>
    )
  );
  if (!parsed.success) {
    const context = { shop, id };
    if (env.NODE_ENV === "development") {
      console.warn("[createPage] validation failed", {
        ...context,
        error: parsed.error,
      });
    }
    try {
      Sentry.captureException(parsed.error, { extra: context });
    } catch {
      /* ignore sentry failure */
    }
    const { fieldErrors } = parsed.error.flatten();
    return { errors: fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;

  let history: HistoryState | undefined;
  const historyStr = formData.get("history");
  if (typeof historyStr === "string") {
    try {
      history = historyStateSchema.parse(JSON.parse(historyStr));
    } catch {
      /* ignore invalid history */
    }
  }

  const title: Record<Locale, string> = {} as Record<Locale, string>;
  const description: Record<Locale, string> = {} as Record<Locale, string>;
  const image: Record<Locale, string> = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    title[l] = data[`title_${l}` as keyof PageCreateForm] as string;
    description[l] = data[`desc_${l}` as keyof PageCreateForm] as string;
    image[l] = data.image ?? "";
  });

  const now = nowIso();
  const page: Page = {
    id,
    slug: data.slug,
    status: data.status,
    components: data.components,
    seo: { title, description, image },
    createdAt: now,
    updatedAt: now,
    createdBy: session.user.email ?? "unknown",
  };

  const pages = await getPages(shop);
  const prev = pages.find((p) => p.id === id);

  try {
    const saved = await savePageInService(shop, page, prev);
    return { page: saved };
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*  Save Draft                                                                */
/* -------------------------------------------------------------------------- */

export async function savePageDraft(
  shop: string,
  formData: FormData
): Promise<{ page?: Page; errors?: Record<string, string[]> }> {
  const session = await ensureAuthorized();

  const id = (formData.get("id") as string) || ulid();
  const compStr = formData.get("components");
  let components: PageComponents;
  try {
    components = componentsField.parse(
      typeof compStr === "string" ? compStr : undefined
    );
  } catch {
    return { errors: { components: ["Invalid components"] } };
  }

  let history = undefined;
  const historyStr = formData.get("history");
  if (typeof historyStr === "string") {
    try {
      history = historyStateSchema.parse(JSON.parse(historyStr));
    } catch {
      /* ignore invalid history */
    }
  }

  const pages = await getPages(shop);
  const now = nowIso();
  const existing = pages.find((p) => p.id === id);

  const page: Page = existing
    ? {
        ...existing,
        components,
        ...(history ? { history } : {}),
        updatedAt: now,
      }
    : {
        id,
        slug: "",
        status: "draft",
        components,
        history: history ?? historyStateSchema.parse({}),
        seo: {
          title: emptyTranslated(),
          description: emptyTranslated(),
          image: emptyTranslated(),
        },
        createdAt: now,
        updatedAt: now,
        createdBy: session.user.email ?? "unknown",
      };

  try {
    const saved = await savePageInService(shop, page, existing);
    return { page: saved };
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*  Update Page                                                               */
/* -------------------------------------------------------------------------- */

export async function updatePage(
  shop: string,
  formData: FormData
): Promise<{ page?: Page; errors?: Record<string, string[]> }> {
  await ensureAuthorized();

  const parsed = updateSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>
    )
  );
  if (!parsed.success) {
    const context = { shop, id: formData.get("id") || undefined };
    if (env.NODE_ENV === "development") {
      console.warn("[updatePage] validation failed", {
        ...context,
        error: parsed.error,
      });
    }
    try {
      Sentry.captureException(parsed.error, { extra: context });
    } catch {
      /* ignore sentry failure */
    }
    const { fieldErrors } = parsed.error.flatten();
    return { errors: fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;

  let history: HistoryState | undefined;
  const historyStr = formData.get("history");
  if (typeof historyStr === "string") {
    try {
      history = historyStateSchema.parse(JSON.parse(historyStr));
    } catch {
      /* ignore invalid history */
    }
  }

  const title: Record<Locale, string> = {} as Record<Locale, string>;
  const description: Record<Locale, string> = {} as Record<Locale, string>;
  const image: Record<Locale, string> = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    title[l] = data[`title_${l}` as keyof PageUpdateForm] as string;
    description[l] = data[`desc_${l}` as keyof PageUpdateForm] as string;
    image[l] = data.image ?? "";
  });

  const patch: Partial<Page> & { id: string; updatedAt: string } = {
    id: data.id as string, // ← explicit cast
    updatedAt: data.updatedAt as string, // ← explicit cast
    slug: data.slug,
    status: data.status,
    components: data.components,
    seo: { title, description, image },
    ...(history ? { history } : {}),
  };

  const pages = await getPages(shop);
  const previous = pages.find((p) => p.id === patch.id);
  if (!previous) {
    throw new Error(`Page ${patch.id} not found`);
  }
  try {
    const saved = await updatePageInService(shop, patch, previous);
    return { page: saved };
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*  Delete Page                                                               */
/* -------------------------------------------------------------------------- */

export async function deletePage(shop: string, id: string): Promise<void> {
  await ensureAuthorized();
  try {
    await deletePageFromService(shop, id);
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}
