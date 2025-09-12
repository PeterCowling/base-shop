import { coreEnv as env } from "@acme/config/env/core";
import type { Page } from "@acme/types";
import { formDataToObject } from "../../utils/formData";
import { ensureAuthorized } from "../common/auth";
import { updateSchema } from "./validation";
import { getPages, updatePage as updatePageInService } from "./service";
import { mapLocales, parseHistory, reportError } from "./utils";

export async function updatePage(
  shop: string,
  formData: FormData
): Promise<{ page?: Page; errors?: Record<string, string[]> }> {
  await ensureAuthorized();
  const parsed = updateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const context = { shop, id: formData.get("id") || undefined };
    if (env.NODE_ENV === "development") {
      console.warn("[updatePage] validation failed", {
        ...context,
        error: parsed.error,
      });
    }
    await reportError(parsed.error, context);
    const { fieldErrors } = parsed.error.flatten();
    return { errors: fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;
  const history = await parseHistory(formData.get("history"));
  const { title, description, image } = mapLocales(data);
  const patch: Partial<Page> & { id: string; updatedAt: string } = {
    id: data.id as string,
    updatedAt: data.updatedAt as string,
    slug: data.slug,
    status: data.status,
    components: data.components,
    seo: { title, description, image },
    history,
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
    await reportError(err);
    throw err;
  }
}
