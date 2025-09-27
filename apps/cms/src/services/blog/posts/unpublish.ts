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
    return { message: "Post unpublished" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  } catch (err) {
    console.error("Failed to unpublish post", err); // i18n-exempt -- developer log; not user-facing; CMS-1010
    return { error: "Failed to unpublish post" }; // i18n-exempt -- service-layer message; UI translates at boundary; CMS-1010
  }
}
