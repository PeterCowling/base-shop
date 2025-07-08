// apps/cms/src/actions/pages.server.ts
"use server";

import { LOCALES } from "@acme/i18n";
import { authOptions } from "@cms/auth/options";
import {
  deletePage as deletePageFromRepo,
  getPages,
  savePage as savePageInRepo,
  updatePage as updatePageInRepo,
} from "@platform-core/repositories/pages/index.server";
import * as Sentry from "@sentry/node";
import type { Locale, Page, PageComponent } from "@types";
import { getServerSession } from "next-auth";
import { ulid } from "ulid";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

async function ensureAuthorized() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role === "viewer") throw new Error("Forbidden");
  return session;
}

const emptyTranslated = (): Record<Locale, string> =>
  LOCALES.reduce(
    (acc, l) => ({ ...acc, [l]: "" }),
    {} as Record<Locale, string>
  );

const componentsField = z
  .string()
  .optional()
  .default("[]")
  .transform((val, ctx) => {
    try {
      const arr = val ? JSON.parse(val) : [];
      if (!Array.isArray(arr)) throw new Error();
      return arr as PageComponent[];
    } catch {
      const snippet = val.length > 100 ? `${val.slice(0, 100)}...` : val;
      console.error(
        `Malformed components field: \"${snippet}\". ` +
          `Ensure the components field is valid JSON.`
      );
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid components",
      });
      return [] as PageComponent[];
    }
  });

/* -------------------------------------------------------------------------- */
/*  Validation Schemas                                                        */
/* -------------------------------------------------------------------------- */

const localeFields: z.ZodRawShape = {};
for (const l of LOCALES) {
  localeFields[`title_${l}`] = z.string().optional().default("");
  localeFields[`desc_${l}`] = z.string().optional().default("");
}

const baseSchema = z
  .object({
    slug: z.string().optional().default(""), // allow empty slug on create
    status: z.enum(["draft", "published"]).default("draft"),
    image: z
      .string()
      .optional()
      .default("")
      .refine((v) => !v || /^https?:\/\/\S+$/.test(v), {
        message: "Invalid image URL",
      }),
    components: componentsField,
  })
  .extend(localeFields as Record<string, z.ZodTypeAny>);

export const createSchema = baseSchema;
export type PageCreateForm = z.infer<typeof createSchema>;

export const updateSchema = baseSchema
  .extend({
    id: z.string(),
    updatedAt: z.string(),
  })
  .refine((data) => data.slug.trim().length > 0, {
    message: "Slug required",
    path: ["slug"],
  });
export type PageUpdateForm = z.infer<typeof updateSchema>;

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
    if (process.env.NODE_ENV === "development") {
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

  const title: Record<Locale, string> = {} as Record<Locale, string>;
  const description: Record<Locale, string> = {} as Record<Locale, string>;
  const image: Record<Locale, string> = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    title[l] = data[`title_${l}` as keyof PageCreateForm] as string;
    description[l] = data[`desc_${l}` as keyof PageCreateForm] as string;
    image[l] = data.image ?? "";
  });

  const now = new Date().toISOString();
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

  try {
    const saved = await savePageInRepo(shop, page);
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
): Promise<{ page: Page }> {
  const session = await ensureAuthorized();

  const id = (formData.get("id") as string) || ulid();
  let components: PageComponent[] = [];
  const compStr = formData.get("components");
  if (typeof compStr === "string") {
    try {
      const parsed = JSON.parse(compStr);
      if (Array.isArray(parsed)) components = parsed as PageComponent[];
    } catch {
      /* ignore – keep components empty */
    }
  }

  const pages = await getPages(shop);
  const now = new Date().toISOString();
  const existing = pages.find((p) => p.id === id);

  const page: Page = existing
    ? { ...existing, components, updatedAt: now }
    : {
        id,
        slug: "",
        status: "draft",
        components,
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
    const saved = await savePageInRepo(shop, page);
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
    if (process.env.NODE_ENV === "development") {
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
  };

  try {
    const saved = await updatePageInRepo(shop, patch);
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
    await deletePageFromRepo(shop, id);
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}
