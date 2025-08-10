// apps/cms/src/app/cms/blog/posts/new/page.tsx

import PostForm from "../PostForm.client";
import { createPost } from "@cms/actions/blog.server";

export default function NewPostPage({
  searchParams,
}: {
  searchParams?: { shopId?: string };
}) {
  const shopId = searchParams?.shopId;
  if (!shopId) return <p>No shop selected.</p>;
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
