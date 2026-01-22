"use client";

import * as React from "react";

import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  slugify,
} from "../../lib/catalogAdminSchema";
import {
  DEFAULT_STOREFRONT,
  getStorefrontConfig,
  parseStorefront,
  XA_CATALOG_STOREFRONTS,
} from "../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { getUploaderConfirmDelete, type UploaderLocale } from "../../lib/uploaderI18n";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { buildLogBlock, toErrorMap } from "./catalogConsoleUtils";
import { buildEmptyDraft, withDraftDefaults } from "./catalogDraft";
import { downloadBlob, fetchSubmissionZip } from "./catalogSubmissionClient";

type SessionState = { authenticated: boolean };

type CatalogListResponse = {
  ok: boolean;
  products?: CatalogProductDraftInput[];
  revisionsById?: Record<string, string>;
  error?: string;
};

type SyncResponse = {
  ok: boolean;
  error?: string;
  logs?: {
    validate?: { code: number; stdout: string; stderr: string };
    sync?: { code: number; stdout: string; stderr: string };
  };
};

type SubmissionAction = "export" | "upload" | null;

function errorToMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function handleNewImpl({
  defaultCategory,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setError,
  setSyncOutput,
}: {
  defaultCategory: CatalogProductDraftInput["taxonomy"]["category"];
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  setSelectedSlug(null);
  setDraft(buildEmptyDraft(defaultCategory));
  setDraftRevision(null);
  setFieldErrors({});
  setError(null);
  setSyncOutput(null);
}

function handleStorefrontChangeImpl({
  nextStorefront,
  currentStorefront,
  setStorefront,
  setProducts,
  setRevisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setError,
  setSubmissionSlugs,
  setSubmissionStatus,
  setSyncOutput,
}: {
  nextStorefront: XaCatalogStorefront;
  currentStorefront: XaCatalogStorefront;
  setStorefront: React.Dispatch<React.SetStateAction<XaCatalogStorefront>>;
  setProducts: React.Dispatch<React.SetStateAction<CatalogProductDraftInput[]>>;
  setRevisionsById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSubmissionStatus: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  if (nextStorefront === currentStorefront) return;
  setStorefront(nextStorefront);
  setProducts([]);
  setRevisionsById({});
  setSelectedSlug(null);
  setDraft(buildEmptyDraft(getStorefrontConfig(nextStorefront).defaultCategory));
  setDraftRevision(null);
  setFieldErrors({});
  setError(null);
  setSubmissionSlugs(new Set());
  setSubmissionStatus(null);
  setSyncOutput(null);
}

function handleSelectImpl({
  product,
  revisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setError,
  setSyncOutput,
}: {
  product: CatalogProductDraftInput;
  revisionsById: Record<string, string>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  const normalized = withDraftDefaults(product);
  setSelectedSlug(normalized.slug);
  setDraft(normalized);
  const id = (normalized.id ?? "").trim();
  setDraftRevision(id ? revisionsById[id] ?? null : null);
  setFieldErrors({});
  setError(null);
  setSyncOutput(null);
}

function handleClearSubmissionImpl({
  setSubmissionSlugs,
  setSubmissionStatus,
}: {
  setSubmissionSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSubmissionStatus: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  setSubmissionSlugs(new Set());
  setSubmissionStatus(null);
}

async function handleLoginImpl({
  event,
  token,
  t,
  setBusy,
  setError,
  loadSession,
}: {
  event: React.FormEvent<HTMLFormElement>;
  token: string;
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadSession: () => Promise<void>;
}): Promise<void> {
  event.preventDefault();
  setBusy(true);
  setError(null);
  try {
    const response = await fetch("/api/uploader/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      throw new Error(t("unauthorized"));
    }
    await loadSession();
  } catch (err) {
    setError(errorToMessage(err, t("loginFailed")));
  } finally {
    setBusy(false);
  }
}

async function handleLogoutImpl({
  uploaderMode,
  t,
  setBusy,
  setError,
  setSession,
  setProducts,
  setRevisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  defaultCategory,
}: {
  uploaderMode: "vendor" | "internal";
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSession: React.Dispatch<React.SetStateAction<SessionState | null>>;
  setProducts: React.Dispatch<React.SetStateAction<CatalogProductDraftInput[]>>;
  setRevisionsById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  defaultCategory: CatalogProductDraftInput["taxonomy"]["category"];
}): Promise<void> {
  if (uploaderMode === "vendor") return;
  setBusy(true);
  setError(null);
  try {
    await fetch("/api/uploader/logout", { method: "POST" });
    setSession({ authenticated: false });
    setProducts([]);
    setRevisionsById({});
    setSelectedSlug(null);
    setDraft(buildEmptyDraft(defaultCategory));
    setDraftRevision(null);
  } catch (err) {
    setError(errorToMessage(err, t("logoutFailed")));
  } finally {
    setBusy(false);
  }
}

async function handleSaveImpl({
  draft,
  draftRevision,
  storefront,
  t,
  setBusy,
  setError,
  setFieldErrors,
  setDraftRevision,
  loadCatalog,
  handleSelect,
}: {
  draft: CatalogProductDraftInput;
  draftRevision: string | null;
  storefront: XaCatalogStorefront;
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
  handleSelect: (product: CatalogProductDraftInput) => void;
}): Promise<void> {
  const parsed = catalogProductDraftSchema.safeParse(draft);
  if (!parsed.success) {
    setFieldErrors(toErrorMap(parsed.error));
    setError(t("fixValidationErrorsBeforeSaving"));
    return;
  }

  setBusy(true);
  setError(null);
  setFieldErrors({});
  try {
    const response = await fetch(`/api/catalog/products?storefront=${encodeURIComponent(storefront)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: draft,
        ifMatch: draftRevision ?? undefined,
      }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      product?: CatalogProductDraftInput;
      revision?: string;
      error?: string;
    };
    if (!response.ok || !data.ok || !data.product) {
      throw new Error(data.error || t("saveFailed"));
    }
    await loadCatalog();
    handleSelect(data.product);
    setDraftRevision(data.revision ?? null);
  } catch (err) {
    setError(errorToMessage(err, t("saveFailed")));
  } finally {
    setBusy(false);
  }
}

async function handleDeleteImpl({
  locale,
  draft,
  storefront,
  t,
  setBusy,
  setError,
  loadCatalog,
  handleNew,
}: {
  locale: UploaderLocale;
  draft: CatalogProductDraftInput;
  storefront: XaCatalogStorefront;
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
  handleNew: () => void;
}): Promise<void> {
  const slug = slugify(draft.slug || draft.title);
  if (!slug) return;
  if (!confirm(getUploaderConfirmDelete(locale, slug))) return;

  setBusy(true);
  setError(null);
  try {
    const response = await fetch(
      `/api/catalog/products/${encodeURIComponent(slug)}?storefront=${encodeURIComponent(storefront)}`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      throw new Error(data.error || t("deleteFailed"));
    }
    await loadCatalog();
    handleNew();
  } catch (err) {
    setError(errorToMessage(err, t("deleteFailed")));
  } finally {
    setBusy(false);
  }
}

async function handleSyncImpl({
  storefront,
  syncOptions,
  t,
  setBusy,
  setError,
  setSyncOutput,
  loadCatalog,
}: {
  storefront: XaCatalogStorefront;
  syncOptions: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean };
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
}): Promise<void> {
  setBusy(true);
  setError(null);
  setSyncOutput(null);
  try {
    const response = await fetch("/api/catalog/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options: syncOptions, storefront }),
    });
    const data = (await response.json()) as SyncResponse;

    const output =
      [
        buildLogBlock("validate", data.logs?.validate),
        buildLogBlock("sync", data.logs?.sync),
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim() || null;
    setSyncOutput(output);

    if (!response.ok || !data.ok) {
      throw new Error(data.error || t("syncFailed"));
    }
    await loadCatalog().catch(() => null);
  } catch (err) {
    setError(errorToMessage(err, t("syncFailed")));
  } finally {
    setBusy(false);
  }
}

async function handleExportSubmissionImpl({
  submissionSlugs,
  storefront,
  uploaderMode,
  t,
  setBusy,
  setError,
  setSubmissionStatus,
  setSubmissionAction,
  handleClearSubmission,
}: {
  submissionSlugs: Set<string>;
  storefront: XaCatalogStorefront;
  uploaderMode: "vendor" | "internal";
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionStatus: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionAction: React.Dispatch<React.SetStateAction<SubmissionAction>>;
  handleClearSubmission: () => void;
}): Promise<void> {
  if (submissionSlugs.size === 0) return;
  setBusy(true);
  setError(null);
  setSubmissionStatus(null);
  setSubmissionAction("export");
  try {
    const slugs = Array.from(submissionSlugs);
    const { blob, filename, submissionId, r2Key } = await fetchSubmissionZip(
      slugs,
      t("exportFailed"),
      storefront,
    );
    downloadBlob(blob, filename);
    handleClearSubmission();
    const statusParts: string[] = [];
    statusParts.push(submissionId ? t("submissionReady", { id: submissionId }) : filename);
    if (uploaderMode === "internal" && r2Key) statusParts.push(r2Key);
    setSubmissionStatus(statusParts.join(" · "));
  } catch (err) {
    setError(errorToMessage(err, t("exportFailed")));
  } finally {
    setSubmissionAction(null);
    setBusy(false);
  }
}

async function handleUploadSubmissionToR2Impl({
  submissionSlugs,
  submissionUploadUrl,
  storefront,
  uploaderMode,
  t,
  setBusy,
  setError,
  setSubmissionStatus,
  setSubmissionAction,
  handleClearSubmission,
}: {
  submissionSlugs: Set<string>;
  submissionUploadUrl: string;
  storefront: XaCatalogStorefront;
  uploaderMode: "vendor" | "internal";
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionStatus: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionAction: React.Dispatch<React.SetStateAction<SubmissionAction>>;
  handleClearSubmission: () => void;
}): Promise<void> {
  if (submissionSlugs.size === 0) return;
  if (!submissionUploadUrl.trim()) return;
  setBusy(true);
  setError(null);
  setSubmissionStatus(null);
  setSubmissionAction("upload");
  try {
    const slugs = Array.from(submissionSlugs);
    const { blob, filename, submissionId, r2Key } = await fetchSubmissionZip(
      slugs,
      t("exportFailed"),
      storefront,
    );
    const headers: Record<string, string> = { "Content-Type": "application/zip" };
    if (submissionId) headers["X-XA-Submission-Id"] = submissionId;
    const res = await fetch(submissionUploadUrl.trim(), {
      method: "PUT",
      headers,
      body: blob,
    });
    if (!res.ok) {
      throw new Error(`Upload failed (${res.status}).`);
    }
    handleClearSubmission();
    const statusParts: string[] = [];
    statusParts.push(submissionId ? t("submissionUploaded", { id: submissionId }) : filename);
    if (uploaderMode === "internal" && r2Key) statusParts.push(r2Key);
    setSubmissionStatus(statusParts.join(" · "));
  } catch (err) {
    setError(errorToMessage(err, t("exportFailed")));
  } finally {
    setSubmissionAction(null);
    setBusy(false);
  }
}

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
  const submissionMaxBytes = 250 * 1024 * 1024;
  const minImageEdge = Math.max(
    1,
    Number(process.env.NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE ?? 1600) || 1600,
  );
  const [submissionSlugs, setSubmissionSlugs] = React.useState<Set<string>>(() => new Set());
  const [submissionUploadUrl, setSubmissionUploadUrl] = React.useState(
    process.env.NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL ?? "",
  );
  const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(null);
  const [submissionAction, setSubmissionAction] = React.useState<SubmissionAction>(null);

  const [draft, setDraft] = React.useState<CatalogProductDraftInput>(() =>
    buildEmptyDraft(storefrontConfig.defaultCategory),
  );
  const [draftRevision, setDraftRevision] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [syncOptions, setSyncOptions] = React.useState({
    strict: true,
    dryRun: false,
    replace: false,
    recursive: true,
  });
  const [syncOutput, setSyncOutput] = React.useState<string | null>(null);

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
      throw new Error(data.error || t("unableToLoadCatalog"));
    }
    setProducts(data.products ?? []);
    setRevisionsById(data.revisionsById ?? {});
  }, [storefront, t]);

  React.useEffect(() => {
    loadSession().catch(() => setSession({ authenticated: false }));
  }, [loadSession]);

  React.useEffect(() => {
    if (!session?.authenticated) return;
    loadCatalog().catch((err) => setError(errorToMessage(err, t("loadFailed"))));
  }, [loadCatalog, session, t]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("xa_uploader_storefront", storefront);
  }, [storefront]);

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
    submissionStatus,
    setSubmissionStatus,
    submissionAction,
    setSubmissionAction,
    draft,
    setDraft,
    draftRevision,
    setDraftRevision,
    busy,
    setBusy,
    error,
    setError,
    fieldErrors,
    setFieldErrors,
    syncOptions,
    setSyncOptions,
    syncOutput,
    setSyncOutput,
    loadSession,
    loadCatalog,
  };
}

type CatalogConsoleState = ReturnType<typeof useCatalogConsoleState>;

function useCatalogAuthHandlers(state: CatalogConsoleState) {
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) =>
    handleLoginImpl({
      event,
      token: state.token,
      t: state.t,
      setBusy: state.setBusy,
      setError: state.setError,
      loadSession: state.loadSession,
    });

  const handleLogout = async () =>
    handleLogoutImpl({
      uploaderMode: state.uploaderMode,
      t: state.t,
      setBusy: state.setBusy,
      setError: state.setError,
      setSession: state.setSession,
      setProducts: state.setProducts,
      setRevisionsById: state.setRevisionsById,
      setSelectedSlug: state.setSelectedSlug,
      setDraft: state.setDraft,
      setDraftRevision: state.setDraftRevision,
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
      setError: state.setError,
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
      setError: state.setError,
      setSubmissionSlugs: state.setSubmissionSlugs,
      setSubmissionStatus: state.setSubmissionStatus,
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
      setError: state.setError,
      setSyncOutput: state.setSyncOutput,
    });

  const handleSave = async () =>
    handleSaveImpl({
      draft: state.draft,
      draftRevision: state.draftRevision,
      storefront: state.storefront,
      t: state.t,
      setBusy: state.setBusy,
      setError: state.setError,
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
      setBusy: state.setBusy,
      setError: state.setError,
      loadCatalog: state.loadCatalog,
      handleNew,
    });

  return { handleNew, handleStorefrontChange, handleSelect, handleSave, handleDelete };
}

function useCatalogSyncHandlers(state: CatalogConsoleState) {
  const handleSync = async () =>
    handleSyncImpl({
      storefront: state.storefront,
      syncOptions: state.syncOptions,
      t: state.t,
      setBusy: state.setBusy,
      setError: state.setError,
      setSyncOutput: state.setSyncOutput,
      loadCatalog: state.loadCatalog,
    });

  return { handleSync };
}

function useCatalogSubmissionHandlers(state: CatalogConsoleState) {
  const handleToggleSubmissionSlug = (slug: string) => {
    state.setSubmissionSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < state.submissionMax) next.add(slug);
      return next;
    });
  };

  const handleClearSubmission = () =>
    handleClearSubmissionImpl({
      setSubmissionSlugs: state.setSubmissionSlugs,
      setSubmissionStatus: state.setSubmissionStatus,
    });

  const handleExportSubmission = async () =>
    handleExportSubmissionImpl({
      submissionSlugs: state.submissionSlugs,
      storefront: state.storefront,
      uploaderMode: state.uploaderMode,
      t: state.t,
      setBusy: state.setBusy,
      setError: state.setError,
      setSubmissionStatus: state.setSubmissionStatus,
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
      setBusy: state.setBusy,
      setError: state.setError,
      setSubmissionStatus: state.setSubmissionStatus,
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
    submissionStatus: state.submissionStatus,
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
    error: state.error,
    fieldErrors: state.fieldErrors,
    syncOptions: state.syncOptions,
    setSyncOptions: state.setSyncOptions,
    syncOutput: state.syncOutput,
    ...submissionState,
    loadCatalog: state.loadCatalog,
    storefrontConfig: state.storefrontConfig,
    ...authHandlers,
    ...draftHandlers,
    ...syncHandlers,
    ...submissionHandlers,
  };
}
