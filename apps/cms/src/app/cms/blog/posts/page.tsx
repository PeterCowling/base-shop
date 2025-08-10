// apps/cms/src/app/cms/blog/posts/page.tsx

import Link from "next/link";
import { Button } from "@ui";
import { getPosts } from "@cms/actions/blog.server";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { getSanityConfig } from "@platform-core/src/shops";

export default async function BlogPostsPage() {
  const shopId =
    process.env.NEXT_PUBLIC_SHOP_ID ||
    process.env.NEXT_PUBLIC_DEFAULT_SHOP ||
    "shop";
  const shop = await readShop(shopId);
  const config = getSanityConfig(shop);

  if (!config) {
    return (
      <div className="space-y-4">
        <p>Sanity is not connected for this shop.</p>
        <Button asChild>
          <Link href="/cms/blog/sanity/connect">Connect Sanity</Link>
        </Button>
      </div>
    );
  }

  const posts = await getPosts();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blog Posts</h1>
        <Button asChild>
          <Link href="/cms/blog/posts/new">New Post</Link>
        </Button>
      </div>
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post._id}>
            <Link
              href={`/cms/blog/posts/${post._id}`}
              className="text-primary underline"
            >
              {post.title || "(untitled)"}
            </Link>
            {post.published && (
              <span className="ml-2 text-sm text-muted-foreground">published</span>
            )}
          </li>
        ))}
        {posts.length === 0 && <li>No posts found.</li>}
      </ul>
    </div>
  );
}
