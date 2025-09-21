// apps/cms/src/app/cms/blog/posts/page.tsx

import Link from "next/link";
import { formatTimestamp } from "@acme/date-utils";
import { Button } from "@ui/components/atoms";
import { getPosts } from "@cms/actions/blog.server";
import { getSanityConfig } from "@platform-core/shops";
import { getShopById } from "@platform-core/repositories/shop.server";

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="min-w-0 text-xl font-semibold">Blog Posts</h1>
        <Button asChild className="shrink-0">
          <Link href={`/cms/blog/posts/new?shopId=${shopId}`}>New Post</Link>
        </Button>
      </div>
      <ul className="space-y-2">
        {posts.map((post) => {
          const status =
            post.publishedAt && new Date(post.publishedAt) > new Date()
              ? `scheduled for ${formatTimestamp(post.publishedAt)}`
              : post.published
                ? "published"
                : "draft";
          return (
            <li key={post._id}>
              <Link
                href={`/cms/blog/posts/${post._id}?shopId=${shopId}`}
                className="text-primary underline"
              >
                {post.title || "(untitled)"}
              </Link>
              <span className="ml-2 text-sm text-muted-foreground">
                {status}
              </span>
            </li>
          );
        })}
        {posts.length === 0 && <li>No posts found.</li>}
      </ul>
    </div>
  );
}
