// apps/cms/src/app/cms/blog/posts/PostForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { Button, Input, Textarea, Toast } from "@ui";

export interface FormState {
  message?: string;
  error?: string;
  id?: string;
}

interface Props {
  action: (_state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  post?: { _id?: string; title?: string; body?: string };
}

export default function PostForm({ action, submitLabel, post }: Props) {
  const [state, formAction] = useFormState(action, { message: "", error: "" });
  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4 max-w-xl">
        <Input name="title" label="Title" defaultValue={post?.title ?? ""} required />
        <Textarea
          name="content"
          label="Content"
          defaultValue={post?.body ?? ""}
          className="min-h-[200px]"
        />
        {post?._id && <input type="hidden" name="id" value={post._id} />}
        <Button type="submit">{submitLabel}</Button>
      </form>
      <Toast open={Boolean(state.message || state.error)} message={state.message || state.error || ""} />
    </div>
  );
}
