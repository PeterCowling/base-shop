import { coreEnv as env } from "@acme/config/env/core";
import { nowIso } from "@acme/date-utils";
import type { Page } from "@acme/types";
import { ulid } from "ulid";
import { formDataToObject } from "../../utils/formData";
import { ensureAuthorized } from "../common/auth";
import { createSchema } from "./validation";
import { getPages, savePage } from "./service";
import { computeRevisionId, mapLocales, reportError } from "./utils";
import { recordMetric } from "@acme/platform-core/utils";
import { incrementOperationalError } from "@acme/platform-core/shops/health";

export async function createPage(
  shop: string,
  formData: FormData
): Promise<{ page?: Page; errors?: Record<string, string[]> }> {
  const session = await ensureAuthorized();
  const idField = formData.get("id");
  const parsed = createSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const context = {
      shop,
      id:
        typeof idField === "string" && idField.trim().length
          ? idField.trim()
          : undefined,
    };
    if (env.NODE_ENV === "development") {
      console.warn("[createPage] validation failed", {
        ...context,
        error: parsed.error,
      });
    }
    await reportError(parsed.error, context);
    const { fieldErrors } = parsed.error.flatten();
    return { errors: fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;
  const id =
    typeof idField === "string" && idField.trim().length
      ? idField.trim()
      : ulid();

  

  const { title, description, image } = mapLocales(data);

  const now = nowIso();
  const page: Page = {
    id,
    slug: data.slug,
    status: data.status,
    ...(data.status === "published"
      ? {
          publishedAt: now,
          publishedBy: session.user.email ?? "unknown",
          publishedRevisionId: computeRevisionId(data.components),
          lastPublishedComponents: data.components,
        }
      : {}),
    ...(data.stableId ? { stableId: data.stableId } : {}),
    components: data.components,
    seo: { title, description, image },
    createdAt: now,
    updatedAt: now,
    createdBy: session.user.email ?? "unknown",
  };

  const pages = await getPages(shop);
  const prev = pages.find((p) => p.id === id);

  try {
    const saved = await savePage(shop, page, prev);
    if (page.status === "published") {
      recordMetric("cms_page_publish_total", {
        shopId: shop,
        service: "cms",
        status: "success",
      });
    }
    return { page: saved };
  } catch (err) {
    if (page.status === "published") {
      recordMetric("cms_page_publish_total", {
        shopId: shop,
        service: "cms",
        status: "failure",
      });
      incrementOperationalError(shop);
    }
    await reportError(err);
    throw err;
  }
}
