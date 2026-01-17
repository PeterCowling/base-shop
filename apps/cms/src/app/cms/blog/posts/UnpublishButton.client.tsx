// apps/cms/src/app/cms/blog/posts/UnpublishButton.client.tsx
"use client";

import { useFormState } from "react-dom";
import { Button, Toast } from "@acme/ui/components/atoms";
import { unpublishPost } from "@cms/actions/blog.server";
import type { FormState } from "./PostForm.client";

interface Props {
  id: string;
  shopId: string;
}

export default function UnpublishButton({ id, shopId }: Props) {
  const action = unpublishPost.bind(null, shopId, id);
  const [state, formAction] = useFormState<FormState>(action, {
    message: "",
    error: "",
  });
  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" variant="outline">
          Unpublish
        </Button>
      </form>
      <Toast
        open={Boolean(state.message || state.error)}
        message={state.message || state.error || ""}
      />
    </div>
  );
}
