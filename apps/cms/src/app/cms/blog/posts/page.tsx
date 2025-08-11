// apps/cms/src/app/cms/blog/posts/page.tsx

import Link from "next/link";
import { Button } from "@ui";
import { getPosts } from "@cms/actions/blog.server";
import { getSanityConfig } from "@platform-core/src/shops";
import { getShopById } from "@platform-core/src/repositories/shop.server";

export default async function BlogPostsPage({
  searchParams,
}: {
  searchParams?: { shopId?: string };
}) {
  const shopId = searchParams?.shopId;
  if (!shopId) return <p>No shop selected.</p>;
  const shop = await getShopById(shopId);
  const sanity = getSanityConfig(shop);
  if (!sanity) {
    return (
      <p>
        Sanity is not connected.{" "}
        <Link
          href={`/cms/blog/sanity/connect?shopId=${shopId}`}
          className="text-primary underline"
        >
          Connect Sanity
        </Link>
      </p>
    );
  }
  const posts = await getPosts(shopId);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blog Posts</h1>
        <Button asChild>
          <Link href={`/cms/blog/posts/new?shopId=${shopId}`}>New Post</Link>
        </Button>
      </div>
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post._id}>
            <Link
              href={`/cms/blog/posts/${post._id}?shopId=${shopId}`}
              className="text-primary underline"
            >
              {post.title || "(untitled)"}
            </Link>
            <span className="ml-2 text-sm text-muted-foreground">
              {post.published
                ? post.publishedAt && new Date(post.publishedAt) > new Date()
                  ? `scheduled for ${new Date(post.publishedAt).toLocaleString()}`
                  : "published"
                : "draft"}
            </span>
          </li>
        ))}
        {posts.length === 0 && <li>No posts found.</li>}
      </ul>
    </div>
  );
}
