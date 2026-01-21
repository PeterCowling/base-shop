// apps/cms/src/app/cms/blog/posts/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, updatePost } from "@cms/actions/blog.server";

import { formatTimestamp } from "@acme/date-utils";
import { getShopById } from "@acme/platform-core/repositories/shop.server";
import { getSanityConfig } from "@acme/platform-core/shops";

import DeleteButton from "../DeleteButton.client";
import PostForm from "../PostForm.client";
import PublishButton from "../PublishButton.client";
import UnpublishButton from "../UnpublishButton.client";

interface Params {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ shopId?: string }>;
}

export default async function EditPostPage({ params, searchParams }: Params) {
  const sp = (await searchParams) ?? undefined;
  const { id } = await params;
  const shopId = sp?.shopId;
  if (!shopId) return notFound();
  const shop = await getShopById(shopId);
  if (!shop) return notFound();
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
  const post = await getPost(shopId, id);
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
        post={post as any}
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
