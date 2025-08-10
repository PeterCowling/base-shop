// apps/cms/src/app/cms/blog/sanity/connect/ConnectForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/atoms/shadcn";
import { Toast } from "@ui";
import { saveSanityConfig } from "@cms/actions/saveSanityConfig";

interface FormState {
  message?: string;
  error?: string;
}

interface Props {
  shopId: string;
}

const initialState: FormState = { message: "", error: "" };

export default function ConnectForm({ shopId }: Props) {
  const action = saveSanityConfig.bind(null, shopId);
  const [state, formAction] = useFormState<FormState>(action, initialState);
  return (
    <div className="space-y-4 max-w-md">
      <form action={formAction} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="projectId">
            Project ID
          </label>
          <input
            id="projectId"
            name="projectId"
            className="w-full rounded border p-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="dataset">
            Dataset
          </label>
          <input
            id="dataset"
            name="dataset"
            className="w-full rounded border p-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="token">
            Token
          </label>
          <input
            id="token"
            name="token"
            type="password"
            className="w-full rounded border p-2"
            required
          />
        </div>
        <Button type="submit" className="bg-primary text-white">
          Save
        </Button>
      </form>
      <Toast
        open={Boolean(state.message || state.error)}
        message={state.message || state.error || ""}
      />
    </div>
  );
}
