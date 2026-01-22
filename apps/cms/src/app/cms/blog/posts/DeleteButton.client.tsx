// apps/cms/src/app/cms/blog/posts/DeleteButton.client.tsx
"use client";

import { useFormState } from "react-dom";
import { deletePost } from "@cms/actions/blog.server";

import { Toast } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/shadcn";

import type { FormState } from "./PostForm.client";

interface Props {
  id: string;
  shopId: string;
}

export default function DeleteButton({ id, shopId }: Props) {
  const action = deletePost.bind(null, shopId, id);
  const [state, formAction] = useFormState<FormState>(action, {
    message: "",
    error: "",
  });
  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" variant="destructive">
          Delete
        </Button>
      </form>
      <Toast
        open={Boolean(state.message || state.error)}
        message={state.message || state.error || ""}
      />
    </div>
  );
}
