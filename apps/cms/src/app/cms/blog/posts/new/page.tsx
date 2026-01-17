// apps/cms/src/app/cms/blog/posts/new/page.tsx

import Link from "next/link";
import PostForm from "../PostForm.client";
import { createPost } from "@cms/actions/blog.server";
import { getSanityConfig } from "@acme/platform-core/shops";
import { getShopById } from "@acme/platform-core/repositories/shop.server";

export default async function NewPostPage(props: {
  searchParams?: Promise<{ shopId?: string }>;
}) {
  const sp = (await props.searchParams) ?? undefined;
  const shopId = sp?.shopId;
  if (!shopId) return <p>No shop selected.</p>;
  const shop = await getShopById(shopId);
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
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Post</h1>
      <PostForm
        action={createPost.bind(null, shopId)}
        submitLabel="Create"
      />
    </div>
  );
}
