// apps/cms/src/app/cms/blog/posts/[id]/page.tsx

import Link from "next/link";
import { Button } from "@ui";
import { notFound } from "next/navigation";
import PostForm from "../PostForm.client";
import PublishButton from "../PublishButton.client";
import { getPost, updatePost } from "@cms/actions/blog.server";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { getSanityConfig } from "@platform-core/src/shops";

interface Params {
  params: { id: string };
}

export default async function EditPostPage({ params }: Params) {
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

  const post = await getPost(params.id);
  if (!post) return notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Post</h1>
      <PostForm action={updatePost} submitLabel="Save" post={post} />
      <PublishButton id={post._id} />
    </div>
  );
}
