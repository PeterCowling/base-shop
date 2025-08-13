// apps/cms/src/app/cms/blog/sanity/connect/ConnectForm.client.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/atoms/shadcn";
import { Toast } from "@ui";
import { saveSanityConfig } from "@cms/actions/saveSanityConfig";
import { deleteSanityConfig } from "@cms/actions/deleteSanityConfig";

interface FormState {
  message?: string;
  error?: string;
  errorCode?: string;
}

interface Props {
  shopId: string;
  initial?: { projectId: string; dataset: string; token?: string };
}

const initialState: FormState = { message: "", error: "", errorCode: "" };

const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: "Invalid Sanity credentials",
  DATASET_CREATE_ERROR: "Failed to create dataset",
  DATASET_LIST_ERROR: "Failed to list datasets",
  SCHEMA_UPLOAD_ERROR: "Failed to upload schema",
  UNKNOWN_ERROR: "An unknown error occurred",
};

const defaultDataset = "blog";

export default function ConnectForm({ shopId, initial }: Props) {
  const saveAction = saveSanityConfig.bind(null, shopId);
  const [state, formAction] = useFormState<FormState>(saveAction, initialState);

  const disconnectAction = deleteSanityConfig.bind(null, shopId);
  const [disconnectState, disconnectFormAction] = useFormState<FormState>(
    disconnectAction,
    initialState,
  );

  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [dataset, setDataset] = useState(initial?.dataset ?? defaultDataset);
  const [token, setToken] = useState(initial?.token ?? "");
  const [datasets, setDatasets] = useState<string[]>(
    initial?.dataset ? [initial.dataset] : [defaultDataset],
  );
  const [isAddingDataset, setIsAddingDataset] = useState(false);
  const [aclMode, setAclMode] = useState<"public" | "private">("public");
  const [verifyStatus, setVerifyStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [verifyError, setVerifyError] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const creatingDatasetRef = useRef(false);

  async function verify() {
    if (!projectId || !token || !dataset) {
      return;
    }
    setVerifyStatus("loading");
    setVerifyError("");
    try {
      const res = await fetch("/api/sanity/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, dataset, token }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        datasets?: string[];
        error?: string;
        errorCode?: string;
      };
      if (json.ok) {
        setDatasets(
          json.datasets && json.datasets.length
            ? json.datasets
            : [dataset || defaultDataset],
        );
        setVerifyStatus("success");
      } else {
        setDatasets(
          json.datasets && json.datasets.length
            ? json.datasets
            : [dataset || defaultDataset],
        );
        setVerifyError(
          (json.errorCode && errorMessages[json.errorCode]) ||
            json.error ||
            "Invalid Sanity credentials",
        );
        setVerifyStatus("error");
      }
    } catch {
      setDatasets([dataset || defaultDataset]);
      setVerifyError("Invalid Sanity credentials");
      setVerifyStatus("error");
    }
  }

  useEffect(() => {
    if (projectId && token) {
      void verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (projectId && token && dataset) {
      void verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  useEffect(() => {
    if (state.message) {
      if (creatingDatasetRef.current) {
        void verify();
        creatingDatasetRef.current = false;
      }
      setStep(3);
    }
  }, [state.message]);

  const message = state.message || disconnectState.message;
  const errorCode = state.errorCode || disconnectState.errorCode;
  const rawError = state.error || disconnectState.error;
  const error = errorCode ? errorMessages[errorCode] ?? rawError : rawError;
  return (
    <div className="space-y-4 max-w-md">
      {step === 1 && (
        <div className="space-y-4">
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
              className="w-full rounded border p-2"
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
              className="bg-primary text-white"
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
                <p className="text-xs text-green-600">Credentials verified</p>
                <Button type="button" onClick={() => setStep(2)}>
                  Next
                </Button>
              </>
            )}
            {verifyStatus === "error" && (
              <p className="text-xs text-red-600">{verifyError}</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <form
          action={formAction}
          className="space-y-4"
          onSubmit={() => {
            creatingDatasetRef.current =
              isAddingDataset && dataset !== defaultDataset;
          }}
        >
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="token" value={token} />
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="dataset">
              Dataset
            </label>
            {isAddingDataset ? (
              <input
                id="dataset"
                name="dataset"
                className="w-full rounded border p-2"
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                required
              />
            ) : (
              <select
                id="dataset"
                name="dataset"
                className="w-full rounded border p-2"
                value={dataset}
                onChange={(e) => {
                  if (e.target.value === "__add__") {
                    setIsAddingDataset(true);
                  } else {
                    setIsAddingDataset(false);
                    setDataset(e.target.value);
                  }
                }}
                required
              >
                <option value="" disabled>
                  Select dataset
                </option>
                {datasets.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="__add__">Add dataset</option>
              </select>
            )}
            {isAddingDataset && dataset !== defaultDataset && (
              <input type="hidden" name="createDataset" value="true" />
            )}
            <p className="text-xs text-muted-foreground">
              Dataset with read and write permissions.
            </p>
            <DatasetCreationStatus isAddingDataset={isAddingDataset} />
            {verifyStatus === "loading" && (
              <p className="text-xs text-muted-foreground">Verifying dataset...</p>
            )}
            {verifyStatus === "success" && (
              <p className="text-xs text-green-600">Dataset verified</p>
            )}
            {verifyStatus === "error" && (
              <p className="text-xs text-red-600">{verifyError}</p>
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
              onChange={(e) =>
                setAclMode(e.target.value as "public" | "private")
              }
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Public datasets are readable by anyone; private require auth.
            </p>
          </div>
          <SubmitButton isCreating={isAddingDataset} />
        </form>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <p className="text-green-600">{state.message}</p>
        </div>
      )}

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

function SubmitButton({ isCreating }: { isCreating: boolean }) {
  const { pending } = useFormStatus();
  const label = pending ? (isCreating ? "Creating dataset..." : "Saving...") : "Save";
  return (
    <Button
      type="submit"
      className="bg-primary text-white"
      disabled={pending}
    >
      {label}
    </Button>
  );
}

function DatasetCreationStatus({
  isAddingDataset,
}: {
  isAddingDataset: boolean;
}) {
  const { pending } = useFormStatus();
  if (!pending || !isAddingDataset) return null;
  return (
    <p className="text-xs text-muted-foreground">Creating dataset...</p>
  );
}
