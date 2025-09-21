// apps/cms/src/app/cms/blog/sanity/connect/CredentialsStep.tsx
"use client";

import { Button } from "@/components/atoms/shadcn";

interface Props {
  projectId: string;
  token: string;
  setProjectId: (v: string) => void;
  setToken: (v: string) => void;
  verify: () => Promise<void>;
  verifyStatus: "idle" | "loading" | "success" | "error";
  verifyError: string;
  onNext: () => void;
}

export default function CredentialsStep({
  projectId,
  token,
  setProjectId,
  setToken,
  verify,
  verifyStatus,
  verifyError,
  onNext,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="projectId">
          Project ID
        </label>
        <input
          id="projectId"
          name="projectId"
          className="w-full rounded-md border border-input bg-background p-2"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Find this in your Sanity project settings.
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
          className="w-full rounded-md border border-input bg-background p-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Token with write scope for the default dataset.
        </p>
      </div>
      <div className="space-y-2">
        <Button
          type="button"
          className="bg-primary text-primary-foreground"
          onClick={() => void verify()}
        >
          Verify
        </Button>
        {verifyStatus === "loading" && (
          <p className="text-xs text-muted-foreground">
            Verifying credentials...
          </p>
        )}
        {verifyStatus === "success" && (
          <>
            <p className="text-xs text-success">Credentials verified</p>
            <Button type="button" onClick={onNext}>
              Next
            </Button>
          </>
        )}
        {verifyStatus === "error" && (
          <p className="text-xs text-danger-foreground">{verifyError}</p>
        )}
      </div>
    </div>
  );
}
