"use client";

import * as React from "react";

import type { CatalogProductDraftInput } from "@acme/lib/xa/catalogAdminSchema";

import {
  DEFAULT_STOREFRONT,
  getStorefrontConfig,
  parseStorefront,
  XA_CATALOG_STOREFRONTS,
} from "../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import {
  handleClearSubmissionImpl,
  handleDeleteImpl,
  handleExportSubmissionImpl,
  handleLoginImpl,
  handleLogoutImpl,
  handleNewImpl,
  handleSaveImpl,
  handleSelectImpl,
  handleStorefrontChangeImpl,
  handleSyncImpl,
  handleUploadSubmissionToR2Impl,
  toggleSubmissionSlug,
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
  type SubmissionAction,
  type SyncReadinessResponse,
  type SyncScriptId,
  updateActionFeedback,
} from "./catalogConsoleFeedback";
import { buildEmptyDraft } from "./catalogDraft";

export type { ActionFeedback, ActionFeedbackState };
export { createInitialActionFeedbackState, getSyncFailureMessage };

function toPositiveInt(raw: string | undefined, fallback: number, min = 1): number {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, parsed);
}

type SyncReadinessState = {
  checking: boolean;
  ready: boolean;
  missingScripts: SyncScriptId[];
  error: string | null;
  checkedAt: string | null;
  contractConfigured: boolean;
  contractConfigErrors: string[];
};

function useCatalogConsoleState() {
  const { locale, t } = useUploaderI18n();
  const uploaderMode: "vendor" | "internal" =
    process.env.NEXT_PUBLIC_XA_UPLOADER_MODE === "vendor" ? "vendor" : "internal";
  const r2Destination =
    process.env.NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION ??
    "https://<upload-domain>/upload/<one-time-link>";

  const [session, setSession] = React.useState<SessionState | null>(null);
  const [storefront, setStorefront] = React.useState<XaCatalogStorefront>(() => {
    if (typeof window === "undefined") return DEFAULT_STOREFRONT;
    const stored = window.localStorage.getItem("xa_uploader_storefront");
    return parseStorefront(stored);
  });
  const storefrontConfig = getStorefrontConfig(storefront);

  const [token, setToken] = React.useState("");
  const [products, setProducts] = React.useState<CatalogProductDraftInput[]>([]);
  const [revisionsById, setRevisionsById] = React.useState<Record<string, string>>({});
  const [query, setQuery] = React.useState("");
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);

  const submissionMax = 10;
  const submissionMaxMb = toPositiveInt(
    process.env.NEXT_PUBLIC_XA_UPLOADER_SUBMISSION_MAX_MB ?? "25",
    25,
    1,
  );
  const submissionMaxBytes = submissionMaxMb * 1024 * 1024;
  const minImageEdge = toPositiveInt(
    process.env.NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE ?? "1600",
    1600,
    1,
  );
  const [submissionSlugs, setSubmissionSlugs] = React.useState<Set<string>>(() => new Set());
  const [submissionUploadUrl, setSubmissionUploadUrl] = React.useState(
    process.env.NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL ?? "",
  );
  const [submissionAction, setSubmissionAction] = React.useState<SubmissionAction>(null);

  const [draft, setDraft] = React.useState<CatalogProductDraftInput>(() =>
    buildEmptyDraft(storefrontConfig.defaultCategory),
  );
  const [draftRevision, setDraftRevision] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const busyLockRef = React.useRef(false);
  const [actionFeedback, setActionFeedback] = React.useState<ActionFeedbackState>(
    createInitialActionFeedbackState,
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [syncOptions, setSyncOptions] = React.useState({
    strict: true,
    dryRun: false,
    replace: false,
    recursive: true,
  });
  const [syncOutput, setSyncOutput] = React.useState<string | null>(null);
  const [syncReadiness, setSyncReadiness] = React.useState<SyncReadinessState>({
    checking: false,
    ready: false,
    missingScripts: [],
    error: null,
    checkedAt: null,
    contractConfigured: false,
    contractConfigErrors: [],
  });

  const loadSession = React.useCallback(async () => {
    const response = await fetch("/api/uploader/session");
    const data = (await response.json()) as SessionState & { ok?: boolean };
    setSession({ authenticated: Boolean(data.authenticated) });
  }, []);

  const loadCatalog = React.useCallback(async () => {
    const response = await fetch(
      `/api/catalog/products?storefront=${encodeURIComponent(storefront)}`,
    );
    const data = (await response.json()) as CatalogListResponse;
    if (!response.ok || !data.ok) {
      throw new Error(getCatalogApiErrorMessage(data.error, "unableToLoadCatalog", t));
    }
    setProducts(data.products ?? []);
    setRevisionsById(data.revisionsById ?? {});
  }, [storefront, t]);

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
    loadCatalog().catch((err) =>
      updateActionFeedback(setActionFeedback, "draft", {
        kind: "error",
        message: errorToMessage(err, t("loadFailed")),
      }),
    );
  }, [loadCatalog, session, t, setActionFeedback]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("xa_uploader_storefront", storefront);
  }, [storefront]);

  React.useEffect(() => {
    if (uploaderMode !== "internal") return;
    if (!session?.authenticated) {
      setSyncReadiness({
        checking: false,
        ready: false,
        missingScripts: [],
        error: null,
        checkedAt: null,
        contractConfigured: false,
        contractConfigErrors: [],
      });
      return;
    }
    loadSyncReadiness().catch(() => null);
  }, [loadSyncReadiness, session?.authenticated, storefront, uploaderMode]);

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
    submissionMax,
    submissionMaxBytes,
    minImageEdge,
    submissionSlugs,
    setSubmissionSlugs,
    submissionUploadUrl,
    setSubmissionUploadUrl,
    submissionAction,
    setSubmissionAction,
    draft,
    setDraft,
    draftRevision,
    setDraftRevision,
    busy,
    busyLockRef,
    setBusy,
    actionFeedback,
    setActionFeedback,
    fieldErrors,
    setFieldErrors,
    syncOptions,
    setSyncOptions,
    syncOutput,
    setSyncOutput,
    syncReadiness,
    setSyncReadiness,
    loadSession,
    loadCatalog,
    loadSyncReadiness,
  };
}

type CatalogConsoleState = ReturnType<typeof useCatalogConsoleState>;

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
    handleLogoutImpl({
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
      setSubmissionSlugs: state.setSubmissionSlugs,
      setSubmissionAction: state.setSubmissionAction,
      setSyncOutput: state.setSyncOutput,
      defaultCategory: state.storefrontConfig.defaultCategory,
    });

  return { handleLogin, handleLogout };
}

function useCatalogDraftHandlers(state: CatalogConsoleState) {
  const handleNew = () =>
    handleNewImpl({
      defaultCategory: state.storefrontConfig.defaultCategory,
      setSelectedSlug: state.setSelectedSlug,
      setDraft: state.setDraft,
      setDraftRevision: state.setDraftRevision,
      setFieldErrors: state.setFieldErrors,
      setActionFeedback: state.setActionFeedback,
      setSyncOutput: state.setSyncOutput,
    });

  const handleStorefrontChange = (next: XaCatalogStorefront) =>
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
      setSubmissionSlugs: state.setSubmissionSlugs,
      setSyncOutput: state.setSyncOutput,
    });

  const handleSelect = (product: CatalogProductDraftInput) =>
    handleSelectImpl({
      product,
      revisionsById: state.revisionsById,
      setSelectedSlug: state.setSelectedSlug,
      setDraft: state.setDraft,
      setDraftRevision: state.setDraftRevision,
      setFieldErrors: state.setFieldErrors,
      setActionFeedback: state.setActionFeedback,
      setSyncOutput: state.setSyncOutput,
    });

  const handleSave = async () =>
    handleSaveImpl({
      draft: state.draft,
      draftRevision: state.draftRevision,
      storefront: state.storefront,
      t: state.t,
      busyLockRef: state.busyLockRef,
      setBusy: state.setBusy,
      setActionFeedback: state.setActionFeedback,
      setFieldErrors: state.setFieldErrors,
      setDraftRevision: state.setDraftRevision,
      loadCatalog: state.loadCatalog,
      handleSelect,
    });

  const handleDelete = async () =>
    handleDeleteImpl({
      locale: state.locale,
      draft: state.draft,
      storefront: state.storefront,
      t: state.t,
      busyLockRef: state.busyLockRef,
      setBusy: state.setBusy,
      setActionFeedback: state.setActionFeedback,
      loadCatalog: state.loadCatalog,
      handleNew,
    });

  return { handleNew, handleStorefrontChange, handleSelect, handleSave, handleDelete };
}

function useCatalogSyncHandlers(state: CatalogConsoleState) {
  const handleSync = async () =>
    !state.syncReadiness.ready || state.syncReadiness.checking
      ? undefined
      : await handleSyncImpl({
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

  const handleRefreshSyncReadiness = async () =>
    await state.loadSyncReadiness().catch(() => null);

  return { handleSync, handleRefreshSyncReadiness };
}

function useCatalogSubmissionHandlers(state: CatalogConsoleState) {
  const handleToggleSubmissionSlug = (slug: string) => {
    state.setSubmissionSlugs((prev) => toggleSubmissionSlug(prev, slug, state.submissionMax));
  };

  const handleClearSubmission = () =>
    handleClearSubmissionImpl({
      setSubmissionSlugs: state.setSubmissionSlugs,
      setActionFeedback: state.setActionFeedback,
    });

  const handleExportSubmission = async () =>
    handleExportSubmissionImpl({
      submissionSlugs: state.submissionSlugs,
      storefront: state.storefront,
      uploaderMode: state.uploaderMode,
      t: state.t,
      busyLockRef: state.busyLockRef,
      setBusy: state.setBusy,
      setActionFeedback: state.setActionFeedback,
      setSubmissionAction: state.setSubmissionAction,
      handleClearSubmission,
    });

  const handleUploadSubmissionToR2 = async () =>
    handleUploadSubmissionToR2Impl({
      submissionSlugs: state.submissionSlugs,
      submissionUploadUrl: state.submissionUploadUrl,
      storefront: state.storefront,
      uploaderMode: state.uploaderMode,
      t: state.t,
      busyLockRef: state.busyLockRef,
      setBusy: state.setBusy,
      setActionFeedback: state.setActionFeedback,
      setSubmissionAction: state.setSubmissionAction,
      handleClearSubmission,
    });

  return {
    handleToggleSubmissionSlug,
    handleClearSubmission,
    handleExportSubmission,
    handleUploadSubmissionToR2,
  };
}

export function useCatalogConsole() {
  const state = useCatalogConsoleState();
  const authHandlers = useCatalogAuthHandlers(state);
  const draftHandlers = useCatalogDraftHandlers(state);
  const syncHandlers = useCatalogSyncHandlers(state);
  const submissionHandlers = useCatalogSubmissionHandlers(state);

  const submissionState = {
    submissionMax: state.submissionMax,
    submissionMaxBytes: state.submissionMaxBytes,
    minImageEdge: state.minImageEdge,
    submissionSlugs: state.submissionSlugs,
    submissionUploadUrl: state.submissionUploadUrl,
    setSubmissionUploadUrl: state.setSubmissionUploadUrl,
    submissionAction: state.submissionAction,
  };

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
    actionFeedback: state.actionFeedback,
    fieldErrors: state.fieldErrors,
    syncOptions: state.syncOptions,
    setSyncOptions: state.setSyncOptions,
    syncOutput: state.syncOutput,
    syncReadiness: state.syncReadiness,
    refreshSyncReadiness: state.loadSyncReadiness,
    ...submissionState,
    loadCatalog: state.loadCatalog,
    storefrontConfig: state.storefrontConfig,
    ...authHandlers,
    ...draftHandlers,
    ...syncHandlers,
    ...submissionHandlers,
  };
}
