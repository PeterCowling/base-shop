// apps/cms/src/app/cms/blog/sanity/connect/ConnectForm.client.tsx
"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/atoms/shadcn";
import { Toast } from "@ui";
import { deleteSanityConfig } from "@cms/actions/deleteSanityConfig";
import CredentialsStep from "./CredentialsStep";
import DatasetStep from "./DatasetStep";
import ConfirmationStep from "./ConfirmationStep";
import { useSanityConnection } from "./useSanityConnection";

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
export default function ConnectForm({ shopId, initial }: Props) {
  const {
    state,
    formAction,
    projectId,
    setProjectId,
    dataset,
    setDataset,
    token,
    setToken,
    datasets,
    isAddingDataset,
    setIsAddingDataset,
    aclMode,
    setAclMode,
    verifyStatus,
    verifyError,
    verify,
    handleDatasetSubmit,
  } = useSanityConnection(shopId, initial);

  const disconnectAction = deleteSanityConfig.bind(null, shopId);
  const [disconnectState, disconnectFormAction] = useActionState<
    FormState,
    FormData
  >(disconnectAction, initialState);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (state.message) {
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
        <CredentialsStep
          projectId={projectId}
          token={token}
          setProjectId={setProjectId}
          setToken={setToken}
          verify={verify}
          verifyStatus={verifyStatus}
          verifyError={verifyError}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <DatasetStep
          projectId={projectId}
          token={token}
          dataset={dataset}
          setDataset={setDataset}
          datasets={datasets}
          isAddingDataset={isAddingDataset}
          setIsAddingDataset={setIsAddingDataset}
          aclMode={aclMode}
          setAclMode={setAclMode}
          verifyStatus={verifyStatus}
          verifyError={verifyError}
          formAction={formAction}
          handleSubmit={handleDatasetSubmit}
        />
      )}

      {step === 3 && <ConfirmationStep message={state.message || ""} />}

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
