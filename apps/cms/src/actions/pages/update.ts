import { coreEnv as env } from "@acme/config/env/core";
import { nowIso } from "@acme/date-utils";
import { incrementOperationalError } from "@acme/platform-core/shops/health";
import { recordMetric } from "@acme/platform-core/utils";
import type { Page } from "@acme/types";

import { formDataToObject } from "../../utils/formData";
import { ensureAuthorized } from "../common/auth";

import { getPages, updatePage as updatePageInService } from "./service";
import { computeRevisionId, mapLocales, parseHistory, reportError } from "./utils";
import { updateSchema } from "./validation";

export async function updatePage(
  shop: string,
  formData: FormData
): Promise<{ page?: Page; errors?: Record<string, string[]> }> {
  const session = await ensureAuthorized();
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
    ...(data.stableId ? { stableId: data.stableId } : {}),
    components: data.components,
    seo: { title, description, image },
    history,
  };
  const pages = await getPages(shop);
  const previous = pages.find((p) => p.id === patch.id);
  if (!previous) {
    throw new Error(`Page ${patch.id} not found`);
  }
  const isPublishing =
    previous.status !== "published" && patch.status === "published";
  if (isPublishing) {
    const publishedAt = nowIso();
    patch.publishedAt = publishedAt;
    patch.publishedBy = session.user?.email ?? "unknown";
    patch.publishedRevisionId = computeRevisionId(data.components);
    patch.lastPublishedComponents = data.components;
  }
  try {
    const saved = await updatePageInService(shop, patch, previous);
    if (isPublishing) {
      recordMetric("cms_page_publish_total", {
        shopId: shop,
        service: "cms",
        status: "success",
      });
    }
    return { page: saved };
  } catch (err) {
    // Attempt a single conflict-resolution retry by refreshing the latest
    // page and updating the optimistic concurrency token (updatedAt).
    const message = (err as Error)?.message || String(err);
    const isConflict = typeof message === "string" && message.includes("Conflict: page has been modified");
    if (isConflict) {
      try {
        const latestPages = await getPages(shop);
        const latest = latestPages.find((p) => p.id === patch.id);
        if (!latest) throw new Error(`Page ${patch.id} not found`);
        // Bump the patch's updatedAt to the latest server value and retry once.
        const retryPatch = { ...patch, updatedAt: latest.updatedAt } as typeof patch;
        const saved = await updatePageInService(shop, retryPatch, latest);
        if (
          previous.status !== "published" &&
          retryPatch.status === "published"
        ) {
          recordMetric("cms_page_publish_total", {
            shopId: shop,
            service: "cms",
            status: "success",
          });
        }
        return { page: saved };
      } catch (retryErr) {
        if (isPublishing) {
          recordMetric("cms_page_publish_total", {
            shopId: shop,
            service: "cms",
            status: "failure",
          });
          incrementOperationalError(shop);
        }
        await reportError(retryErr);
        throw retryErr;
      }
    }
    if (isPublishing) {
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
