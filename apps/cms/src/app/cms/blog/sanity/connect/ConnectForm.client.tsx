// apps/cms/src/app/cms/blog/sanity/connect/ConnectForm.client.tsx
"use client";

import { useEffect,useState } from "react";
import { useFormState } from "react-dom";
import { deleteSanityConfig } from "@cms/actions/deleteSanityConfig";

import { useTranslations } from "@acme/i18n";
import { Toast } from "@acme/ui/components/atoms";

import { Button } from "@/components/atoms/shadcn";

import ConfirmationStep from "./ConfirmationStep";
import CredentialsStep from "./CredentialsStep";
import DatasetStep from "./DatasetStep";
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

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  INVALID_CREDENTIALS: "cms.sanity.connect.errors.INVALID_CREDENTIALS",
  DATASET_CREATE_ERROR: "cms.sanity.connect.errors.DATASET_CREATE_ERROR",
  DATASET_LIST_ERROR: "cms.sanity.connect.errors.DATASET_LIST_ERROR",
  SCHEMA_UPLOAD_ERROR: "cms.sanity.connect.errors.SCHEMA_UPLOAD_ERROR",
  UNKNOWN_ERROR: "cms.sanity.connect.errors.UNKNOWN_ERROR",
};
export default function ConnectForm({ shopId, initial }: Props) {
  const t = useTranslations();
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
  const [disconnectState, disconnectFormAction] = useFormState<FormState>(
    disconnectAction,
    initialState,
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (state.message) {
      setStep(3);
    }
  }, [state.message]);

  const message = state.message || disconnectState.message;
  const errorCode = state.errorCode || disconnectState.errorCode;
  const rawError = state.error || disconnectState.error;
  const error = errorCode
    ? (ERROR_MESSAGE_KEYS[errorCode]
        ? (t(ERROR_MESSAGE_KEYS[errorCode]) as string)
        : rawError)
    : rawError;

  return (
    <div className="space-y-4">
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
            {t("cms.sanity.connect.actions.disconnect")}
          </Button>
        </form>
      )}
      <Toast open={Boolean(message || error)} message={message || error || ""} />
    </div>
  );
}
