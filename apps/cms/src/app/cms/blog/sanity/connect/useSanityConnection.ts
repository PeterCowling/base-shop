// apps/cms/src/app/cms/blog/sanity/connect/useSanityConnection.ts
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useActionState,
} from "react";
import { saveSanityConfig } from "@cms/actions/saveSanityConfig";
import { defaultDataset } from "./constants";

interface FormState {
  message?: string;
  error?: string;
  errorCode?: string;
}

const initialState: FormState = { message: "", error: "", errorCode: "" };

export function useSanityConnection(
  shopId: string,
  initial?: { projectId: string; dataset: string; token?: string },
) {
  const saveAction = saveSanityConfig.bind(null, shopId);
  const [state, formAction] = useActionState<FormState, FormData>(
    async (_prevState: FormState, formData: FormData) =>
      saveAction(formData),
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
  const creatingDatasetRef = useRef(false);

  const verify = useCallback(async () => {
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
          json.error || "Invalid Sanity credentials",
        );
        setVerifyStatus("error");
      }
    } catch {
      setDatasets([dataset || defaultDataset]);
      setVerifyError("Invalid Sanity credentials");
      setVerifyStatus("error");
    }
  }, [projectId, token, dataset]);

  useEffect(() => {
    void verify();
  }, [verify]);

  useEffect(() => {
    if (state.message && creatingDatasetRef.current) {
      void verify();
      creatingDatasetRef.current = false;
    }
  }, [state.message, verify]);

  function handleDatasetSubmit() {
    creatingDatasetRef.current =
      isAddingDataset && dataset !== defaultDataset;
  }

  return {
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
  } as const;
}

export type UseSanityConnectionReturn = ReturnType<typeof useSanityConnection>;
