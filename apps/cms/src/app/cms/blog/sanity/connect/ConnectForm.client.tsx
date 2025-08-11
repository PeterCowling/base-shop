// apps/cms/src/app/cms/blog/sanity/connect/ConnectForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/atoms/shadcn";
import { Toast } from "@ui";
import { saveSanityConfig } from "@cms/actions/saveSanityConfig";
import { deleteSanityConfig } from "@cms/actions/deleteSanityConfig";

interface FormState {
  message?: string;
  error?: string;
}

interface Props {
  shopId: string;
  initial?: { projectId: string; dataset: string; token?: string };
}

const initialState: FormState = { message: "", error: "" };

export default function ConnectForm({ shopId, initial }: Props) {
  const saveAction = saveSanityConfig.bind(null, shopId);
  const [state, formAction] = useFormState<FormState>(saveAction, initialState);

  const disconnectAction = deleteSanityConfig.bind(null, shopId);
  const [disconnectState, disconnectFormAction] = useFormState<FormState>(
    disconnectAction,
    initialState,
  );
  const message = state.message || disconnectState.message;
  const error = state.error || disconnectState.error;
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
            defaultValue={initial?.projectId ?? ""}
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
            defaultValue={initial?.dataset ?? ""}
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
            defaultValue={initial?.token ?? ""}
            required
          />
        </div>
        <Button type="submit" className="bg-primary text-white">
          Save
        </Button>
      </form>
      {initial && (
        <form action={disconnectFormAction}>
          <Button type="submit" variant="destructive">
            Disconnect
          </Button>
        </form>
      )}
      <Toast open={Boolean(message || error)} message={message || error || ""} />
    </div>
  );
}
