// apps/cms/src/app/cms/blog/posts/new/page.tsx

import Link from "next/link";
import { Button } from "@ui";
import PostForm from "../PostForm.client";
import { createPost } from "@cms/actions/blog.server";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { getSanityConfig } from "@platform-core/src/shops";

export default async function NewPostPage() {
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Post</h1>
      <PostForm action={createPost} submitLabel="Create" />
    </div>
  );
}
