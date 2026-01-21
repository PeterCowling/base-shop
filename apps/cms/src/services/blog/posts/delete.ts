import { deletePost as repoDeletePost } from "@acme/platform-core/repositories/blog.server";

import { ensureAuthorized } from "../../../actions/common/auth";
import { getConfig } from "../config";

export async function deletePost(
  shopId: string,
  id: string,
): Promise<{ message?: string; error?: string }> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  try {
    await repoDeletePost(config as any, id);
    return { message: "Post deleted" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  } catch (err) {
    console.error("Failed to delete post", err); // i18n-exempt -- developer log; not user-facing; CMS-1010
    return { error: "Failed to delete post" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  }
}
