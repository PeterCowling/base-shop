// apps/cms/src/app/cms/blog/posts/new/page.tsx

import PostForm from "../PostForm.client";
import { createPost } from "@cms/actions/blog.server";

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Post</h1>
      <PostForm action={createPost} submitLabel="Create" />
    </div>
  );
}
