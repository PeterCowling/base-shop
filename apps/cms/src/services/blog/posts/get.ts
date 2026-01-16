import { getPost as repoGetPost, type SanityPost } from "@acme/platform-core/repositories/blog.server";
import { ensureCanRead } from "../../../actions/common/auth";
import { getConfig } from "../config";

export async function getPost(
  shopId: string,
  id: string,
): Promise<SanityPost | null> {
  await ensureCanRead();
  const config = await getConfig(shopId);
  return repoGetPost(config, id);
}
