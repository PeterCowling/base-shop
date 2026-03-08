"use client";

import * as React from "react";

import { type CatalogProductDraftInput, slugify } from "@acme/lib/xa/catalogAdminSchema";

import {
  DEFAULT_STOREFRONT,
  getStorefrontConfig,
  parseStorefront,
  XA_CATALOG_STOREFRONTS,
} from "../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import {
  handleDeleteImpl,
  handleLoginImpl,
  handleLogoutImpl,
  handleNewImpl,
  handlePublishImpl,
  handleSaveImpl,
  handleSelectImpl,
  handleStorefrontChangeImpl,
  handleSyncImpl,
  mergeAutosaveImageTuples,
  type PublishResult,
  type SaveResult,
  shouldTriggerAutosync,
  type SyncActionResult,
} from "./catalogConsoleActions";
import {
  type ActionFeedback,
  type ActionFeedbackState,
  type CatalogListResponse,
  createInitialActionFeedbackState,
  errorToMessage,
  getCatalogApiErrorMessage,
  getSyncFailureMessage,
  type SessionState,
  type SyncReadinessResponse,
  type SyncResponse,
  type SyncScriptId,
  updateActionFeedback,
} from "./catalogConsoleFeedback";
import { buildEmptyDraft, withDraftDefaults } from "./catalogDraft";

export type { ActionFeedback, ActionFeedbackState };
export { createInitialActionFeedbackState, getSyncFailureMessage };

type SyncReadinessState = {
  checking: boolean;
  ready: boolean;
  mode: "unknown" | "local" | "cloud";
  missingScripts: SyncScriptId[];
  error: string | null;
  checkedAt: string | null;
  contractConfigured: boolean;
  contractConfigErrors: string[];
};

type AutosaveStatus = "saving" | "saved" | "unsaved";

function getUploaderRuntimeConfig(): {
  uploaderMode: "vendor" | "internal";
  r2Destination: string;
} {
  return {
    uploaderMode:
      process.env.NEXT_PUBLIC_XA_UPLOADER_MODE === "vendor" ? "vendor" : "internal",
    r2Destination:
      process.env.NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION ??
      "https://<upload-domain>/upload/<one-time-link>",
  };
}

function getInitialStorefront(): XaCatalogStorefront {
  if (typeof window === "undefined") return DEFAULT_STOREFRONT;
  const stored = window.localStorage.getItem("xa_uploader_storefront");
  return parseStorefront(stored);
}

function createInitialSyncReadinessState(): SyncReadinessState {
  return {
    checking: false,
    ready: false,
    mode: "unknown",
    missingScripts: [],
    error: null,
    checkedAt: null,
    contractConfigured: false,
    contractConfigErrors: [],
  };
}

function reconcileSelectedDraftFromCatalog(params: {
  selectedSlug: string | null;
  nextProducts: CatalogProductDraftInput[];
  nextRevisionsById: Record<string, string>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  draftImageBaselineRef: React.MutableRefObject<CatalogProductDraftInput | null>;
}): void {
  if (!params.selectedSlug) return;
  const nextSelected = params.nextProducts.find((product) => product.slug === params.selectedSlug);
  if (!nextSelected) return;
  const normalized = withDraftDefaults(nextSelected);
  params.setDraft(normalized);
  const id = (normalized.id ?? "").trim();
  params.setDraftRevision(id ? params.nextRevisionsById[id] ?? null : null);
  params.draftImageBaselineRef.current = normalized;
}

async function loadCatalogFromServer(params: {
  storefront: XaCatalogStorefront;
  t: ReturnType<typeof useUploaderI18n>["t"];
  selectedSlug: string | null;
  setProducts: React.Dispatch<React.SetStateAction<CatalogProductDraftInput[]>>;
  setRevisionsById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  draftImageBaselineRef: React.MutableRefObject<CatalogProductDraftInput | null>;
}): Promise<CatalogListResponse> {
  const response = await fetch(
    `/api/catalog/products?storefront=${encodeURIComponent(params.storefront)}`,
  );
  const data = (await response.json()) as CatalogListResponse;
  if (!response.ok || !data.ok) {
    throw new Error(getCatalogApiErrorMessage(data.error, "unableToLoadCatalog", params.t));
  }
  const nextProducts = data.products ?? [];
  const nextRevisionsById = data.revisionsById ?? {};
  params.setProducts(nextProducts);
  params.setRevisionsById(nextRevisionsById);
  reconcileSelectedDraftFromCatalog({
    selectedSlug: params.selectedSlug,
    nextProducts,
    nextRevisionsById,
    setDraft: params.setDraft,
    setDraftRevision: params.setDraftRevision,
    draftImageBaselineRef: params.draftImageBaselineRef,
  });
  return data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForBusyToClear(
  busyLockRef: React.MutableRefObject<boolean>,
  maxAttempts = 250,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!busyLockRef.current) return;
    await sleep(16);
  }
}

function useCatalogConsoleState() {
  const { locale, t } = useUploaderI18n();
  const { uploaderMode, r2Destination } = getUploaderRuntimeConfig();

  const [session, setSession] = React.useState<SessionState | null>(null);
  const [storefront, setStorefront] = React.useState<XaCatalogStorefront>(getInitialStorefront);
  const storefrontConfig = getStorefrontConfig(storefront);

  const [token, setToken] = React.useState("");
  const [products, setProducts] = React.useState<CatalogProductDraftInput[]>([]);
  const [revisionsById, setRevisionsById] = React.useState<Record<string, string>>({});
  const [query, setQuery] = React.useState("");
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);

  const [draft, setDraft] = React.useState<CatalogProductDraftInput>(() =>
    buildEmptyDraft(storefrontConfig.defaultCategory),
  );
  const [draftRevision, setDraftRevision] = React.useState<string | null>(null);
  const draftImageBaselineRef = React.useRef<CatalogProductDraftInput | null>(null);
  const [busy, setBusy] = React.useState(false);
  const busyLockRef = React.useRef(false);
  const pendingAutosaveDraftRef = React.useRef<CatalogProductDraftInput | null>(null);
  const autosaveFlushInProgressRef = React.useRef(false);
  const [isAutosaveDirty, setIsAutosaveDirty] = React.useState(true);
  const [isAutosaveSaving, setIsAutosaveSaving] = React.useState(false);
  const [lastAutosaveSavedAt, setLastAutosaveSavedAt] = React.useState<number | null>(null);
  const [autosaveInlineMessage, setAutosaveInlineMessage] = React.useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = React.useState<ActionFeedbackState>(
    createInitialActionFeedbackState,
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [syncOptions, setSyncOptions] = React.useState({
    strict: false,
    dryRun: false,
    replace: false,
    recursive: true,
  });
  const [syncOutput, setSyncOutput] = React.useState<string | null>(null);
  const [lastSyncData, setLastSyncData] = React.useState<SyncResponse | null>(null);
  const [syncReadiness, setSyncReadiness] = React.useState<SyncReadinessState>(
    createInitialSyncReadinessState,
  );

  const [isCatalogHydrating, setIsCatalogHydrating] = React.useState(false);
  const catalogHydrationCounterRef = React.useRef(0);

  const loadSession = React.useCallback(async () => {
    const response = await fetch("/api/uploader/session");
    const data = (await response.json()) as SessionState & { ok?: boolean };
    setSession({ authenticated: Boolean(data.authenticated) });
  }, []);

  const loadCatalog = React.useCallback(async () => {
    await loadCatalogFromServer({
      storefront,
      t,
      selectedSlug,
      setProducts,
      setRevisionsById,
      setDraft,
      setDraftRevision,
      draftImageBaselineRef,
    });
  }, [selectedSlug, storefront, t]);

  const loadSyncReadiness = React.useCallback(async () => {
    if (uploaderMode !== "internal") return;
    setSyncReadiness((prev) => ({ ...prev, checking: true, error: null }));
    try {
      const response = await fetch(
        `/api/catalog/sync?storefront=${encodeURIComponent(storefront)}`,
      );
      const data = (await response.json()) as SyncReadinessResponse;
      if (!response.ok || !data.ok) {
        throw new Error(t("syncReadinessCheckFailed"));
      }
      setSyncReadiness({
        checking: false,
        ready: Boolean(data.ready),
        mode: data.mode ?? "local",
        missingScripts: data.missingScripts ?? [],
        error: null,
        checkedAt: data.checkedAt ?? null,
        contractConfigured: Boolean(data.contractConfigured),
        contractConfigErrors: data.contractConfigErrors ?? [],
      });
    } catch {
      setSyncReadiness({
        checking: false,
        ready: false,
        mode: "unknown",
        missingScripts: [],
        error: t("syncReadinessCheckFailed"),
        checkedAt: null,
        contractConfigured: false,
        contractConfigErrors: [],
      });
    }
  }, [storefront, t, uploaderMode]);

  React.useEffect(() => {
    loadSession().catch(() => setSession({ authenticated: false }));
  }, [loadSession]);

  React.useEffect(() => {
    if (!session?.authenticated) return;
    const requestId = ++catalogHydrationCounterRef.current;
    setIsCatalogHydrating(true);
    loadCatalog()
      .catch((err) =>
        updateActionFeedback(setActionFeedback, "draft", {
          kind: "error",
          message: errorToMessage(err, t("loadFailed")),
        }),
      )
      .finally(() => {
        if (catalogHydrationCounterRef.current === requestId) {
          setIsCatalogHydrating(false);
        }
      });
  }, [loadCatalog, session, t, setActionFeedback]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("xa_uploader_storefront", storefront);
  }, [storefront]);

  React.useEffect(() => {
    if (uploaderMode !== "internal") return;
    if (!session?.authenticated) {
      setSyncReadiness(createInitialSyncReadinessState());
      return;
    }
    loadSyncReadiness().catch(() => null);
  }, [loadSyncReadiness, session?.authenticated, storefront, uploaderMode]);

  const resetAutosaveState = React.useCallback(() => {
    pendingAutosaveDraftRef.current = null;
    setIsAutosaveDirty(true);
    setIsAutosaveSaving(false);
    setLastAutosaveSavedAt(null);
    setAutosaveInlineMessage(null);
  }, []);

  const autosaveStatus: AutosaveStatus = isAutosaveSaving
    ? "saving"
    : isAutosaveDirty
      ? "unsaved"
      : "saved";

  return {
    locale,
    t,
    uploaderMode,
    r2Destination,
    session,
    setSession,
    storefront,
    setStorefront,
    storefrontConfig,
    token,
    setToken,
    products,
    setProducts,
    revisionsById,
    setRevisionsById,
    query,
    setQuery,
    selectedSlug,
    setSelectedSlug,
    draft,
    setDraft,
    draftRevision,
    setDraftRevision,
    draftImageBaselineRef,
    busy,
    busyLockRef,
    pendingAutosaveDraftRef,
    autosaveFlushInProgressRef,
    isAutosaveDirty,
    setIsAutosaveDirty,
    isAutosaveSaving,
    setIsAutosaveSaving,
    lastAutosaveSavedAt,
    setLastAutosaveSavedAt,
    autosaveInlineMessage,
    setAutosaveInlineMessage,
    autosaveStatus,
    resetAutosaveState,
    setBusy,
    actionFeedback,
    setActionFeedback,
    fieldErrors,
    setFieldErrors,
    syncOptions,
    setSyncOptions,
    syncOutput,
    setSyncOutput,
    lastSyncData,
    setLastSyncData,
    syncReadiness,
    setSyncReadiness,
    isCatalogLoading: isCatalogHydrating,
    loadSession,
    loadCatalog,
    loadSyncReadiness,
  };
}

type CatalogConsoleState = ReturnType<typeof useCatalogConsoleState>;

type SaveRunnerParams = {
  state: CatalogConsoleState;
  draft: CatalogProductDraftInput;
  draftRevision: string | null;
  suppressSuccessFeedback: boolean;
  confirmUnpublish: (message: string) => boolean;
  handleSelect: (product: CatalogProductDraftInput) => void;
};

async function runCatalogSave({
  state,
  draft,
  draftRevision,
  suppressSuccessFeedback,
  confirmUnpublish,
  handleSelect,
}: SaveRunnerParams): Promise<SaveResult> {
  return await handleSaveImpl({
    draft,
    draftRevision,
    storefront: state.storefront,
    t: state.t,
    busyLockRef: state.busyLockRef,
    setBusy: state.setBusy,
    setActionFeedback: state.setActionFeedback,
    setFieldErrors: state.setFieldErrors,
    setDraftRevision: state.setDraftRevision,
    loadCatalog: state.loadCatalog,
    handleSelect,
    confirmUnpublish,
    suppressSuccessFeedback,
  });
}

async function loadLatestDraftForConflict(params: {
  state: CatalogConsoleState;
  draft: CatalogProductDraftInput;
}): Promise<{ product: CatalogProductDraftInput; revision: string | null } | null> {
  const response = await fetch(`/api/catalog/products?storefront=${encodeURIComponent(params.state.storefront)}`);
  const data = (await response.json()) as CatalogListResponse;
  if (!response.ok || !data.ok || !data.products?.length) return null;

  const targetId = (params.draft.id ?? "").trim();
  const targetSlug = slugify(params.draft.slug || params.draft.title);
  const matched = data.products.find((product) => {
    const productId = (product.id ?? "").trim();
    if (targetId) return productId === targetId;
    return slugify(product.slug || product.title) === targetSlug;
  });
  if (!matched) return null;

  const matchedId = (matched.id ?? "").trim();
  const revision = matchedId ? data.revisionsById?.[matchedId] ?? null : null;
  return { product: matched, revision };
}

function markAutosaveFailure(state: CatalogConsoleState, detailMessage: string): true {
  updateActionFeedback(state.setActionFeedback, "draft", {
    kind: "error",
    message: state.t("autosaveNeedsManualSave"),
  });
  state.setAutosaveInlineMessage(detailMessage);
  state.setIsAutosaveDirty(true);
  return true;
}

function getAutosaveValidationInlineMessage(state: CatalogConsoleState): string {
  return Object.values(state.fieldErrors)[0] ?? state.t("fixValidationErrorsBeforeSaving");
}

function resetAutosaveAndBaseline(state: CatalogConsoleState): void {
  state.resetAutosaveState();
  state.draftImageBaselineRef.current = null;
}

function applyAutosaveQueueSaveSuccess(
  state: CatalogConsoleState,
  result: Extract<SaveResult, { status: "saved" }>,
): void {
  state.draftImageBaselineRef.current = result.product;
  state.setAutosaveInlineMessage(null);
  state.setIsAutosaveDirty(Boolean(state.pendingAutosaveDraftRef.current));
  state.setLastAutosaveSavedAt(Date.now());
}

function finalizeAutosaveSuccess(
  state: CatalogConsoleState,
  result: Extract<SaveResult, { status: "saved" }>,
): CatalogProductDraftInput | null {
  applyAutosaveQueueSaveSuccess(state, result);
  return state.pendingAutosaveDraftRef.current === null ? result.product : null;
}

function createAutosyncTrigger(
  state: CatalogConsoleState,
  handleAutosync?: () => Promise<SyncActionResult>,
) {
  return async (currentDraft: CatalogProductDraftInput): Promise<void> => {
    if (!handleAutosync) return;
    if (
      !shouldTriggerAutosync({
        pendingAutosaveDraftRef: state.pendingAutosaveDraftRef,
        busyLockRef: state.busyLockRef,
        syncReadinessReady: state.syncReadiness.ready,
        syncReadinessChecking: state.syncReadiness.checking,
        draft: currentDraft,
      })
    ) {
      return;
    }
    try {
      await handleAutosync();
    } catch {
      // Autosync feedback is surfaced through the shared sync action state.
    }
  };
}

type AutosaveConflictRetryResult =
  | {
      status: "saved";
      revision: string | null;
      autosyncCandidate: CatalogProductDraftInput | null;
    }
  | {
      status: "busy";
      requeuedDraft: CatalogProductDraftInput;
    }
  | {
      status: "failed";
      preserveDirty: true;
    };

async function retryAutosaveAfterConflict(params: {
  state: CatalogConsoleState;
  pendingDraft: CatalogProductDraftInput;
  handleSelect: (product: CatalogProductDraftInput) => void;
}): Promise<AutosaveConflictRetryResult> {
  const latest = await loadLatestDraftForConflict({ state: params.state, draft: params.pendingDraft });
  if (!latest) {
    return {
      status: "failed",
      preserveDirty: markAutosaveFailure(params.state, params.state.t("apiErrorConflict")),
    };
  }

  const mergedDraft = mergeAutosaveImageTuples({
    serverDraft: latest.product,
    localDraft: params.pendingDraft,
    baselineDraft: params.state.draftImageBaselineRef.current,
  });

  const retryAttempt = await runCatalogSave({
    state: params.state,
    draft: mergedDraft,
    draftRevision: latest.revision,
    suppressSuccessFeedback: true,
    confirmUnpublish: () => false,
    handleSelect: params.handleSelect,
  });

  if (retryAttempt.status === "saved") {
    return {
      status: "saved",
      revision: retryAttempt.revision,
      autosyncCandidate: finalizeAutosaveSuccess(params.state, retryAttempt),
    };
  }

  if (retryAttempt.status === "busy") {
    return {
      status: "busy",
      requeuedDraft: mergedDraft,
    };
  }

  if (retryAttempt.status === "validation_error") {
    return {
      status: "failed",
      preserveDirty: markAutosaveFailure(
        params.state,
        getAutosaveValidationInlineMessage(params.state),
      ),
    };
  }

  if (retryAttempt.status === "conflict") {
    return {
      status: "failed",
      preserveDirty: markAutosaveFailure(params.state, params.state.t("apiErrorConflict")),
    };
  }

  return {
    status: "failed",
    preserveDirty: markAutosaveFailure(params.state, params.state.t("autosaveNeedsManualSave")),
  };
}

function useCatalogAuthHandlers(state: CatalogConsoleState) {
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) =>
    handleLoginImpl({
      event,
      token: state.token,
      t: state.t,
      busyLockRef: state.busyLockRef,
      setBusy: state.setBusy,
      setActionFeedback: state.setActionFeedback,
      loadSession: state.loadSession,
    });

  const handleLogout = async () =>
    (() => {
      resetAutosaveAndBaseline(state);
      return handleLogoutImpl({
        uploaderMode: state.uploaderMode,
        t: state.t,
        busyLockRef: state.busyLockRef,
        setBusy: state.setBusy,
        setActionFeedback: state.setActionFeedback,
        setSession: state.setSession,
        setProducts: state.setProducts,
        setRevisionsById: state.setRevisionsById,
        setSelectedSlug: state.setSelectedSlug,
        setDraft: state.setDraft,
        setDraftRevision: state.setDraftRevision,
        setFieldErrors: state.setFieldErrors,
        setSyncOutput: state.setSyncOutput,
        defaultCategory: state.storefrontConfig.defaultCategory,
      });
    })();

  return { handleLogin, handleLogout };
}

function createSaveAdvanceFeedbackHandler(state: CatalogConsoleState) {
  return () => {
    updateActionFeedback(state.setActionFeedback, "draft", {
      kind: "success",
      message: state.t("saveAndAdvanceFeedback"),
    });
  };
}

function createDeleteHandler(state: CatalogConsoleState, handleNew: () => void) {
  return async () =>
    (() => {
      resetAutosaveAndBaseline(state);
      return handleDeleteImpl({
        selectedSlug: state.selectedSlug,
        locale: state.locale,
        storefront: state.storefront,
        t: state.t,
        busyLockRef: state.busyLockRef,
        setBusy: state.setBusy,
        setActionFeedback: state.setActionFeedback,
        loadCatalog: state.loadCatalog,
        handleNew,
      });
    })();
}

function useCatalogDraftHandlers(
  state: CatalogConsoleState,
  handleAutosync?: () => Promise<SyncActionResult>,
) {
  const handleSaveAdvanceFeedback = createSaveAdvanceFeedbackHandler(state);
  const triggerAutosync = createAutosyncTrigger(state, handleAutosync);

  const handleSelect = (product: CatalogProductDraftInput) => {
    state.resetAutosaveState();
    const normalizedProduct = withDraftDefaults(product);
    state.draftImageBaselineRef.current = normalizedProduct;
    handleSelectImpl({
      product: normalizedProduct,
      revisionsById: state.revisionsById,
      setSelectedSlug: state.setSelectedSlug,
      setDraft: state.setDraft,
      setDraftRevision: state.setDraftRevision,
      setFieldErrors: state.setFieldErrors,
      setActionFeedback: state.setActionFeedback,
      setSyncOutput: state.setSyncOutput,
    });
  };

  const handleNew = () =>
    (() => {
      resetAutosaveAndBaseline(state);
      handleNewImpl({
        defaultCategory: state.storefrontConfig.defaultCategory,
        preservedBrand: {
          brandHandle: state.draft.brandHandle,
          brandName: state.draft.brandName,
        },
        setSelectedSlug: state.setSelectedSlug,
        setDraft: state.setDraft,
        setDraftRevision: state.setDraftRevision,
        setFieldErrors: state.setFieldErrors,
        setActionFeedback: state.setActionFeedback,
        setSyncOutput: state.setSyncOutput,
      });
    })();

  const handleStorefrontChange = (next: XaCatalogStorefront) =>
    (() => {
      resetAutosaveAndBaseline(state);
      state.setLastSyncData(null);
      handleStorefrontChangeImpl({
        nextStorefront: next,
        currentStorefront: state.storefront,
        setStorefront: state.setStorefront,
        setProducts: state.setProducts,
        setRevisionsById: state.setRevisionsById,
        setSelectedSlug: state.setSelectedSlug,
        setDraft: state.setDraft,
        setDraftRevision: state.setDraftRevision,
        setFieldErrors: state.setFieldErrors,
        setActionFeedback: state.setActionFeedback,
        setSyncOutput: state.setSyncOutput,
      });
    })();

  async function flushAutosaveQueue(): Promise<void> {
    if (state.autosaveFlushInProgressRef.current) return;
    state.autosaveFlushInProgressRef.current = true;

    let workingRevision = state.draftRevision;
    let preserveDirty = false;
    let autosyncCandidate: CatalogProductDraftInput | null = null;

    try {
      while (state.pendingAutosaveDraftRef.current) {
        if (state.busyLockRef.current) {
          await waitForBusyToClear(state.busyLockRef);
          continue;
        }

        const pendingDraft = state.pendingAutosaveDraftRef.current;
        state.pendingAutosaveDraftRef.current = null;
        state.setIsAutosaveSaving(true);

        const firstAttempt = await runCatalogSave({
          state,
          draft: pendingDraft,
          draftRevision: workingRevision,
          suppressSuccessFeedback: true,
          confirmUnpublish: () => false,
          handleSelect,
        });

        if (firstAttempt.status === "saved") {
          workingRevision = firstAttempt.revision;
          autosyncCandidate = finalizeAutosaveSuccess(state, firstAttempt);
          continue;
        }

        if (firstAttempt.status === "busy") {
          state.pendingAutosaveDraftRef.current = pendingDraft;
          state.setIsAutosaveDirty(true);
          await waitForBusyToClear(state.busyLockRef);
          continue;
        }

        if (firstAttempt.status === "conflict") {
          const retryResult = await retryAutosaveAfterConflict({
            state,
            pendingDraft,
            handleSelect,
          });

          if (retryResult.status === "saved") {
            workingRevision = retryResult.revision;
            autosyncCandidate = retryResult.autosyncCandidate;
            continue;
          }

          if (retryResult.status === "busy") {
            state.pendingAutosaveDraftRef.current = retryResult.requeuedDraft;
            state.setIsAutosaveDirty(true);
            await waitForBusyToClear(state.busyLockRef);
            continue;
          }

          preserveDirty = retryResult.preserveDirty;
          break;
        }

        if (firstAttempt.status === "validation_error") {
          preserveDirty = markAutosaveFailure(state, getAutosaveValidationInlineMessage(state));
          break;
        }

        if (firstAttempt.status === "cancelled" || firstAttempt.status === "error") {
          preserveDirty = markAutosaveFailure(state, state.t("autosaveNeedsManualSave"));
          break;
        }
      }
    } finally {
      state.setIsAutosaveSaving(false);
      if (!state.pendingAutosaveDraftRef.current && !preserveDirty) {
        state.setIsAutosaveDirty(false);
      }
      state.autosaveFlushInProgressRef.current = false;
      if (autosyncCandidate && !preserveDirty && state.pendingAutosaveDraftRef.current === null) {
        void triggerAutosync(autosyncCandidate);
      }
      if (state.pendingAutosaveDraftRef.current && !state.busyLockRef.current) {
        void flushAutosaveQueue();
      }
    }
  }

  const handleSave = async (): Promise<SaveResult> => {
    state.pendingAutosaveDraftRef.current = null;
    state.setIsAutosaveDirty(false);
    state.setAutosaveInlineMessage(null);

    let result = await runCatalogSave({
      state,
      draft: state.draft,
      draftRevision: state.draftRevision,
      suppressSuccessFeedback: false,
      confirmUnpublish: (message: string) => window.confirm(message),
      handleSelect,
    });

    if (result.status === "busy") {
      await waitForBusyToClear(state.busyLockRef);
      result = await runCatalogSave({
        state,
        draft: state.draft,
        draftRevision: state.draftRevision,
        suppressSuccessFeedback: false,
        confirmUnpublish: (message: string) => window.confirm(message),
        handleSelect,
      });
    }

    if (result.status === "saved") {
      state.draftImageBaselineRef.current = result.product;
      state.setAutosaveInlineMessage(null);
      state.setLastAutosaveSavedAt(Date.now());
      return result;
    }

    if (result.status === "conflict") {
      updateActionFeedback(state.setActionFeedback, "draft", {
        kind: "error",
        message: state.t("apiErrorConflict"),
      });
    }

    return result;
  };

  const handleSaveWithDraft = async (nextDraft: CatalogProductDraftInput) => {
    state.setAutosaveInlineMessage(null);
    state.pendingAutosaveDraftRef.current = nextDraft;
    state.setIsAutosaveDirty(true);
    void flushAutosaveQueue();
  };

  const handleDelete = createDeleteHandler(state, handleNew);

  return {
    handleNew,
    handleStorefrontChange,
    handleSelect,
    handleSave,
    handleSaveWithDraft,
    handleSaveAdvanceFeedback,
    handleDelete,
  };
}

function useCatalogPublishHandlers(state: CatalogConsoleState) {
  const handlePublish = async (
    publishState: "live" | "out_of_stock" = "live",
  ): Promise<PublishResult> =>
    handlePublishImpl({
      draft: state.draft,
      publishState,
      storefront: state.storefront,
      t: state.t,
      busyLockRef: state.busyLockRef,
      setBusy: state.setBusy,
      setActionFeedback: state.setActionFeedback,
      loadCatalog: state.loadCatalog,
    });

  return { handlePublish };
}

function useCatalogSyncHandlers(state: CatalogConsoleState) {
  const runSync = async (): Promise<SyncActionResult> => {
    const result = await handleSyncImpl({
      storefront: state.storefront,
      syncOptions: state.syncOptions,
      t: state.t,
      busyLockRef: state.busyLockRef,
      setBusy: state.setBusy,
      setActionFeedback: state.setActionFeedback,
      setSyncOutput: state.setSyncOutput,
      loadCatalog: state.loadCatalog,
      confirmEmptyCatalogSync: (message: string) => window.confirm(message),
    });
    if (result.ok) {
      state.setLastSyncData(result.data ?? null);
    }
    return result;
  };

  const handleSync = async (): Promise<SyncActionResult> => {
    if (state.isAutosaveDirty || state.isAutosaveSaving) {
      updateActionFeedback(state.setActionFeedback, "sync", {
        kind: "error",
        message: state.t("syncBlockedAutosavePending"),
      });
      return { ok: false };
    }
    if (!state.syncReadiness.ready || state.syncReadiness.checking) return { ok: false };
    return await runSync();
  };

  const handleAutosync = async (): Promise<SyncActionResult> => {
    if (!state.syncReadiness.ready || state.syncReadiness.checking) return { ok: false };
    return await runSync();
  };

  const handleRefreshSyncReadiness = async () =>
    await state.loadSyncReadiness().catch(() => null);

  return { handleSync, handleAutosync, handleRefreshSyncReadiness };
}

export function useCatalogConsole() {
  const state = useCatalogConsoleState();
  const authHandlers = useCatalogAuthHandlers(state);
  const syncHandlers = useCatalogSyncHandlers(state);
  const publishHandlers = useCatalogPublishHandlers(state);
  const draftHandlers = useCatalogDraftHandlers(state, syncHandlers.handleAutosync);
  const { handleAutosync: _handleAutosync, ...publicSyncHandlers } = syncHandlers;

  return {
    uploaderMode: state.uploaderMode,
    r2Destination: state.r2Destination,
    session: state.session,
    token: state.token,
    setToken: state.setToken,
    storefront: state.storefront,
    storefronts: XA_CATALOG_STOREFRONTS,
    setStorefront: state.setStorefront,
    products: state.products,
    query: state.query,
    setQuery: state.setQuery,
    selectedSlug: state.selectedSlug,
    draft: state.draft,
    setDraft: state.setDraft,
    draftRevision: state.draftRevision,
    busy: state.busy,
    isAutosaveDirty: state.isAutosaveDirty,
    isAutosaveSaving: state.isAutosaveSaving,
    autosaveStatus: state.autosaveStatus,
    lastAutosaveSavedAt: state.lastAutosaveSavedAt,
    autosaveInlineMessage: state.autosaveInlineMessage,
    actionFeedback: state.actionFeedback,
    fieldErrors: state.fieldErrors,
    syncReadiness: state.syncReadiness,
    isCatalogLoading: state.isCatalogLoading,
    loadCatalog: state.loadCatalog,
    storefrontConfig: state.storefrontConfig,
    ...authHandlers,
    ...draftHandlers,
    ...publishHandlers,
    ...publicSyncHandlers,
  };
}
