import { publishPost as repoPublishPost } from "@platform-core/repositories/blog.server";
import { ensureAuthorized } from "../../../actions/common/auth";
import { nowIso } from "@date-utils";
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
    return { message: "Post published" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  } catch (err) {
    console.error("Failed to publish post", err); // i18n-exempt -- developer log; not user-facing; CMS-1010
    return { error: "Failed to publish post" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  }
}
