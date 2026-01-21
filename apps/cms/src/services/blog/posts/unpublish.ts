import { unpublishPost as repoUnpublishPost } from "@acme/platform-core/repositories/blog.server";
import { incrementOperationalError } from "@acme/platform-core/shops/health";
import { recordMetric } from "@acme/platform-core/utils";

import { ensureAuthorized } from "../../../actions/common/auth";
import { getConfig } from "../config";

export async function unpublishPost(
  shopId: string,
  id: string,
): Promise<{ message?: string; error?: string }> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  try {
    await repoUnpublishPost(config, id);
    recordMetric("cms_page_publish_total", {
      shopId,
      service: "cms",
      status: "skipped",
    });
    return { message: "Post unpublished" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  } catch (err) {
    recordMetric("cms_page_publish_total", {
      shopId,
      service: "cms",
      status: "failure",
    });
    incrementOperationalError(shopId);
    console.error("Failed to unpublish post", err); // i18n-exempt -- developer log; not user-facing; CMS-1010
    return { error: "Failed to unpublish post" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  }
}
