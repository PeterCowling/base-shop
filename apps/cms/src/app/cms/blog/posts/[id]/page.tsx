// apps/cms/src/app/cms/blog/posts/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { formatTimestamp } from "@acme/date-utils";
import { getPost, updatePost } from "@cms/actions/blog.server";
import { getSanityConfig } from "@platform-core/shops";
import { getShopById } from "@platform-core/repositories/shop.server";
import PostForm from "../PostForm.client";
import PublishButton from "../PublishButton.client";
import UnpublishButton from "../UnpublishButton.client";
import DeleteButton from "../DeleteButton.client";

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
          className="text-link underline"
        >
          Connect Sanity
        </Link>
      </p>
    );
  }
  const post = await getPost(shopId, params.id);
  if (!post) return notFound();
  const status = post.published
    ? post.publishedAt && new Date(post.publishedAt) > new Date()
      ? `Scheduled for ${formatTimestamp(post.publishedAt)}`
      : `Published${
          post.publishedAt ? ` on ${formatTimestamp(post.publishedAt)}` : ""
        }`
    : "Draft";
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Post</h1>
      <p className="text-sm text-muted-foreground">Status: {status}</p>
      <PostForm
        action={updatePost.bind(null, shopId)}
        submitLabel="Save"
        post={post}
      />
      <div className="flex items-center space-x-4">
        {post.published ? (
          <UnpublishButton id={post._id} shopId={shopId} />
        ) : (
          <PublishButton id={post._id} shopId={shopId} />
        )}
        <DeleteButton id={post._id} shopId={shopId} />
      </div>
    </div>
  );
}
