import { nowIso } from "@date-utils";

import { publishPost as repoPublishPost } from "@acme/platform-core/repositories/blog.server";
import { incrementOperationalError } from "@acme/platform-core/shops/health";
import { recordMetric } from "@acme/platform-core/utils";

import { ensureAuthorized } from "../../../actions/common/auth";
import { getConfig } from "../config";

export async function publishPost(
  shopId: string,
  id: string,
  formData?: FormData,
): Promise<{ message?: string; error?: string }> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  const publishedAtInput = formData?.get("publishedAt");
  const publishedAt = publishedAtInput
    ? new Date(String(publishedAtInput)).toISOString()
    : nowIso();
  try {
    await repoPublishPost(config, id, publishedAt);
    recordMetric("cms_page_publish_total", {
      shopId,
      service: "cms",
      status: "success",
    });
    return { message: "Post published" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  } catch (err) {
    recordMetric("cms_page_publish_total", {
      shopId,
      service: "cms",
      status: "failure",
    });
    incrementOperationalError(shopId);
    console.error("Failed to publish post", err); // i18n-exempt -- developer log; not user-facing; CMS-1010
    return { error: "Failed to publish post" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  }
}
