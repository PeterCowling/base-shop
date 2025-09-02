import { unpublishPost as repoUnpublishPost } from "@platform-core/repositories/blog.server";
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
    return { message: "Post unpublished" };
  } catch (err) {
    console.error("Failed to unpublish post", err);
    return { error: "Failed to unpublish post" };
  }
}
