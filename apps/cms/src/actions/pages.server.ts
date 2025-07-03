// apps/cms/src/actions/pages.ts

"use server";

import { authOptions } from "@cms/auth/options";
import {
  deletePage as deletePageFromRepo,
  getPages,
  savePage as savePageInRepo,
  updatePage as updatePageInRepo,
} from "@platform-core/repositories/pages/index.server";
import * as Sentry from "@sentry/node";
import type { Locale, Page, PageComponent } from "@types";
import { LOCALES } from "@types";
import { getServerSession } from "next-auth";
import { ulid } from "ulid";
import { z } from "zod";

async function ensureAuthorized() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "viewer") {
    throw new Error("Forbidden");
  }
  return session;
}

function emptyTranslated(): Record<Locale, string> {
  const obj = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    obj[l] = "";
  });
  return obj;
}

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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid components",
      });
      return [] as PageComponent[];
    }
  });

const localeFields: z.ZodRawShape = {};
for (const l of LOCALES) {
  localeFields[`title_${l}`] = z.string().min(1, "Required");
  localeFields[`desc_${l}`] = z.string().optional().default("");
}

type LocaleFields = {
  [L in Locale as `title_${L}`]: string;
} & {
  [L in Locale as `desc_${L}`]?: string;
};

const baseSchema = z

  .object({
    slug: z.string().min(1, "Required"),
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

type BasePageForm = z.infer<typeof baseSchema>;

export type PageCreateForm = BasePageForm;
export type PageUpdateForm = BasePageForm & { id: string; updatedAt: string };

const createSchema: z.ZodType<PageCreateForm> = baseSchema;
const updateSchema: z.ZodType<PageUpdateForm> = baseSchema.extend({
  id: z.string(),
  updatedAt: z.string(),
});

export async function createPage(
  shop: string,
  formData: FormData
): Promise<{ page?: Page; errors?: Record<string, string[]> }> {
  const session = await ensureAuthorized();

  const parsed = createSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>
    )
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data: PageCreateForm = parsed.data;
  const title: Record<Locale, string> = {} as Record<Locale, string>;
  const description: Record<Locale, string> = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    title[l] = data[`title_${l}` as keyof PageCreateForm] as string;
    description[l] = data[`desc_${l}` as keyof PageCreateForm] as string;
  });
  const image: Record<Locale, string> = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    image[l] = data.image ?? "";
  });

  const now = new Date().toISOString();
  const page: Page = {
    id: ulid(),
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

export async function savePageDraft(
  shop: string,
  formData: FormData
): Promise<{ page: Page }> {
  const session = await ensureAuthorized();

  const id = (formData.get("id") as string) || ulid();
  const compStr = formData.get("components");
  let components: PageComponent[] = [];
  if (typeof compStr === "string") {
    try {
      const parsed = JSON.parse(compStr);
      if (Array.isArray(parsed)) components = parsed as PageComponent[];
    } catch {
      components = [];
    }
  }

  const pages = await getPages(shop);
  const existing = pages.find((p) => p.id === id);
  const now = new Date().toISOString();
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
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data: PageUpdateForm = parsed.data;
  const title: Record<Locale, string> = {} as Record<Locale, string>;
  const description: Record<Locale, string> = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    title[l] = data[`title_${l}` as keyof PageUpdateForm] as string;
    description[l] = data[`desc_${l}` as keyof PageUpdateForm] as string;
  });
  const image: Record<Locale, string> = {} as Record<Locale, string>;
  LOCALES.forEach((l) => {
    image[l] = data.image ?? "";
  });

  const patch: Partial<Page> & { id: string; updatedAt: string } = {
    id: data.id,
    updatedAt: data.updatedAt,
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

export async function deletePage(shop: string, id: string): Promise<void> {
  await ensureAuthorized();

  try {
    await deletePageFromRepo(shop, id);
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}
