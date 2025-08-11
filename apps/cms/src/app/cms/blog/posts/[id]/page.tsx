// apps/cms/src/app/cms/blog/posts/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "../PostForm.client";
import PublishButton from "../PublishButton.client";
import DeleteButton from "../DeleteButton.client";
import { getPost, updatePost } from "@cms/actions/blog.server";
import { getSanityConfig } from "@platform-core/src/shops";
import { getShopById } from "@platform-core/src/repositories/shop.server";

interface Params {
  params: { id: string };
  searchParams?: { shopId?: string };
}

export default async function EditPostPage({
  params,
  searchParams,
}: Params) {
  const shopId = searchParams?.shopId;
  if (!shopId) return notFound();
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
  const post = await getPost(shopId, params.id);
  if (!post) return notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Post</h1>
      <PostForm
        action={updatePost.bind(null, shopId)}
        submitLabel="Save"
        post={post}
      />
      <div className="flex items-center space-x-4">
        <PublishButton id={post._id} shopId={shopId} />
        <DeleteButton id={post._id} shopId={shopId} />
      </div>
    </div>
  );
}
