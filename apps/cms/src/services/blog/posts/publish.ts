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
    return { message: "Post published" };
  } catch (err) {
    console.error("Failed to publish post", err);
    return { error: "Failed to publish post" };
  }
}
