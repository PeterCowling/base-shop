// apps/cms/src/app/cms/blog/sanity/connect/ConnectForm.client.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { Button } from "@/components/atoms/shadcn";
import { Toast } from "@ui";
import { saveSanityConfig } from "@cms/actions/saveSanityConfig";
import { deleteSanityConfig } from "@cms/actions/deleteSanityConfig";
import { connectSanity } from "@cms/actions/sanity.server";

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

  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [dataset, setDataset] = useState(initial?.dataset ?? "");
  const [token, setToken] = useState(initial?.token ?? "");
  const [aclMode, setAclMode] = useState<"public" | "private">("public");
  const [verifyStatus, setVerifyStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function verify() {
    if (!projectId || !dataset || !token) {
      return;
    }
    setVerifyStatus("loading");
    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("dataset", dataset);
    fd.append("token", token);
    const valid = await connectSanity(fd);
    setVerifyStatus(valid ? "success" : "error");
  }

  const message = state.message || disconnectState.message;
  const error = state.error || disconnectState.error;
  return (
    <div className="space-y-4 max-w-md">
      <form
        action={formAction}
        className="space-y-4"
        onSubmit={() => void verify()}
      >
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="projectId">
            Project ID
          </label>
          <input
            id="projectId"
            name="projectId"
            className="w-full rounded border p-2"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            onBlur={verify}
            required
          />
          <p className="text-xs text-muted-foreground">
            Find this in your Sanity project settings.
          </p>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="dataset">
            Dataset
          </label>
          <input
            id="dataset"
            name="dataset"
            className="w-full rounded border p-2"
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
            onBlur={verify}
            required
          />
          <p className="text-xs text-muted-foreground">
            Dataset with read and write permissions.
          </p>
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
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onBlur={verify}
            required
          />
          <p className="text-xs text-muted-foreground">
            Token with write scope for the above dataset.
          </p>
          {verifyStatus === "loading" && (
            <p className="text-xs text-muted-foreground">Verifying...</p>
          )}
          {verifyStatus === "success" && (
            <p className="text-xs text-green-600">Credentials verified</p>
          )}
          {verifyStatus === "error" && (
            <p className="text-xs text-red-600">Invalid credentials</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="aclMode">
            Access level
          </label>
          <select
            id="aclMode"
            name="aclMode"
            className="w-full rounded border p-2"
            value={aclMode}
            onChange={(e) => setAclMode(e.target.value as "public" | "private")}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Public datasets are readable by anyone; private require auth.
          </p>
        </div>
        <SubmitButton />
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="bg-primary text-white"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}
