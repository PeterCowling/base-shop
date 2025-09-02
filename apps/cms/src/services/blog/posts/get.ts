import { getPost as repoGetPost, type SanityPost } from "@platform-core/repositories/blog.server";
import { ensureAuthorized } from "../../../actions/common/auth";
import { getConfig } from "../config";

export async function getPost(
  shopId: string,
  id: string,
): Promise<SanityPost | null> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  return repoGetPost(config, id);
}
