import { listPosts, type SanityPost } from "@platform-core/repositories/blog.server";
import { ensureCanRead } from "../../../actions/common/auth";
import { getConfig } from "../config";

export async function getPosts(shopId: string): Promise<SanityPost[]> {
  await ensureCanRead();
  const config = await getConfig(shopId);
  return listPosts(config);
}
