// apps/cms/src/app/cms/blog/posts/[id]/page.tsx

import { notFound } from "next/navigation";
import PostForm from "../PostForm.client";
import PublishButton from "../PublishButton.client";
import { getPost, updatePost } from "@cms/actions/blog.server";

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
      <PublishButton id={post._id} shopId={shopId} />
    </div>
  );
}
