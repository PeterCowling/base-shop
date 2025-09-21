// apps/cms/src/app/cms/blog/sanity/connect/DatasetStep.tsx
"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/atoms/shadcn";
import { defaultDataset } from "./constants";

interface Props {
  projectId: string;
  token: string;
  dataset: string;
  setDataset: (v: string) => void;
  datasets: string[];
  isAddingDataset: boolean;
  setIsAddingDataset: (v: boolean) => void;
  aclMode: "public" | "private";
  setAclMode: (v: "public" | "private") => void;
  verifyStatus: "idle" | "loading" | "success" | "error";
  verifyError: string;
  formAction: (formData: FormData) => void;
  handleSubmit: () => void;
}

export default function DatasetStep({
  projectId,
  token,
  dataset,
  setDataset,
  datasets,
  isAddingDataset,
  setIsAddingDataset,
  aclMode,
  setAclMode,
  verifyStatus,
  verifyError,
  formAction,
  handleSubmit,
  }: Props) {
  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
      {...(process.env.NODE_ENV === "test" ? {} : { action: formAction })}
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
            className="w-full rounded-md border border-input bg-background p-2"
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
            required
          />
        ) : (
          <select
            id="dataset"
            name="dataset"
            className="w-full rounded-md border border-input bg-background p-2"
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
          <p className="text-xs text-success">Dataset verified</p>
        )}
        {verifyStatus === "error" && (
          <p className="text-xs text-danger-foreground">{verifyError}</p>
        )}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="aclMode">
          Access level
        </label>
        <select
          id="aclMode"
          name="aclMode"
          className="w-full rounded-md border border-input bg-background p-2"
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
      <SubmitButton isCreating={isAddingDataset} />
    </form>
  );
}

function SubmitButton({ isCreating }: { isCreating: boolean }) {
  const { pending } = useFormStatus();
  const label = pending ? (isCreating ? "Creating dataset..." : "Saving...") : "Save";
  return (
    <Button type="submit" className="bg-primary text-primary-foreground" disabled={pending}>
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
  return <p className="text-xs text-muted-foreground">Creating dataset...</p>;
}
