// apps/cms/src/actions/pages.ts

"use server";

import { authOptions } from "@cms/auth/options";
import {
  deletePage as deletePageFromRepo,
  savePage as savePageInRepo,
  updatePage as updatePageInRepo,
} from "@platform-core/repositories/pages/index.server";
import * as Sentry from "@sentry/node";
import type { Page, PageComponent } from "@types";
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

const baseSchema = z.object({
  slug: z.string().min(1, "Required"),
  status: z.enum(["draft", "published"]).default("draft"),
  title: z.string().min(1, "Required"),
  description: z.string().optional().default(""),
  components: componentsField,
});

const createSchema = baseSchema;
const updateSchema = baseSchema.extend({
  id: z.string(),
  updatedAt: z.string(),
});

export type PageCreateForm = z.infer<typeof createSchema>;
export type PageUpdateForm = z.infer<typeof updateSchema>;

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
  const now = new Date().toISOString();
  const page: Page = {
    id: ulid(),
    slug: data.slug,
    status: data.status,
    components: data.components,
    seo: { title: data.title, description: data.description },
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
  const patch: Partial<Page> & { id: string; updatedAt: string } = {
    id: data.id,
    updatedAt: data.updatedAt,
    slug: data.slug,
    status: data.status,
    components: data.components,
    seo: { title: data.title, description: data.description },
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
