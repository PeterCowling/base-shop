// apps/cms/src/app/cms/blog/posts/page.tsx

import Link from "next/link";
import { getPosts } from "@cms/actions/blog.server";

import { formatTimestamp } from "@acme/date-utils";
import { Button } from "@acme/design-system/shadcn";
import { getShopById } from "@acme/platform-core/repositories/shop.server";
import { getSanityConfig } from "@acme/platform-core/shops";

export default async function BlogPostsPage(props: {
  searchParams?: Promise<{ shopId?: string }>;
}) {
  const sp = (await props.searchParams) ?? undefined;
  const shopId = sp?.shopId;
  if (!shopId) return <p>No shop selected.</p>;
  const shop = await getShopById(shopId);
  if (!shop) return <p>Shop not found.</p>;
  const sanity = getSanityConfig(shop);
  if (!sanity) {
    return (
      <p>
        Sanity is not connected.{" "}
        <Link
          href={`/cms/blog/sanity/connect?shopId=${shopId}`}
          className="text-link underline"
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
                className="text-link underline"
              >
                {post.title || "(untitled)"}
              </Link>
              <span className="ms-2 text-sm text-muted-foreground">
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
