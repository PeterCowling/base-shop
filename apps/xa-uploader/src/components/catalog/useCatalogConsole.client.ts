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

const SUBMISSION_MAX = 10;
const SUBMISSION_MAX_BYTES = 250 * 1024 * 1024;
const DEFAULT_SYNC_OPTIONS = {
  strict: true,
  dryRun: false,
  replace: false,
  recursive: true,
};

function getUploaderMode() {
  return process.env.NEXT_PUBLIC_XA_UPLOADER_MODE === "vendor" ? "vendor" : "internal";
}

function getR2Destination() {
  return (
    process.env.NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION ??
    "https://<upload-domain>/upload/<one-time-link>"
  );
}

function getMinImageEdge() {
  const value = Number(process.env.NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE ?? 1600) || 1600;
  return Math.max(1, value);
}

function loadInitialStorefront(): XaCatalogStorefront {
  if (typeof window === "undefined") return DEFAULT_STOREFRONT;
  const stored = window.localStorage.getItem("xa_uploader_storefront");
  return parseStorefront(stored);
}

function resetEditorState(args: {
  storefrontConfig: ReturnType<typeof getStorefrontConfig>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  args.setSelectedSlug(null);
  args.setDraft(buildEmptyDraft(args.storefrontConfig.defaultCategory));
  args.setDraftRevision(null);
  args.setFieldErrors({});
  args.setError(null);
  args.setSyncOutput(null);
}

function selectProduct(args: {
  product: CatalogProductDraftInput;
  revisionsById: Record<string, string>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const normalized = withDraftDefaults(args.product);
  args.setSelectedSlug(normalized.slug);
  args.setDraft(normalized);
  const id = (normalized.id ?? "").trim();
  args.setDraftRevision(id ? args.revisionsById[id] ?? null : null);
  args.setFieldErrors({});
  args.setError(null);
  args.setSyncOutput(null);
}

function clearSubmission(args: {
  setSubmissionSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSubmissionStatus: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  args.setSubmissionSlugs(new Set());
  args.setSubmissionStatus(null);
}

async function fetchSessionState(): Promise<SessionState> {
  const response = await fetch("/api/uploader/session");
  const data = (await response.json()) as SessionState & { ok?: boolean };
  return { authenticated: Boolean(data.authenticated) };
}

async function fetchCatalogList(storefront: XaCatalogStorefront): Promise<CatalogListResponse> {
  const response = await fetch(`/api/catalog/products?storefront=${encodeURIComponent(storefront)}`);
  return (await response.json()) as CatalogListResponse;
}

async function handleLoginRequest(args: {
  event: React.FormEvent<HTMLFormElement>;
  token: string;
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadSession: () => Promise<void>;
}) {
  args.event.preventDefault();
  args.setBusy(true);
  args.setError(null);
  try {
    const response = await fetch("/api/uploader/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: args.token }),
    });
    if (!response.ok) {
      throw new Error(args.t("unauthorized"));
    }
    await args.loadSession();
  } catch (err) {
    args.setError(err instanceof Error ? err.message : args.t("loginFailed"));
  } finally {
    args.setBusy(false);
  }
}

async function handleLogoutRequest(args: {
  uploaderMode: "vendor" | "internal";
  t: (key: string) => string;
  storefrontConfig: ReturnType<typeof getStorefrontConfig>;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSession: React.Dispatch<React.SetStateAction<SessionState | null>>;
  setProducts: React.Dispatch<React.SetStateAction<CatalogProductDraftInput[]>>;
  setRevisionsById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  if (args.uploaderMode === "vendor") return;
  args.setBusy(true);
  args.setError(null);
  try {
    await fetch("/api/uploader/logout", { method: "POST" });
    args.setSession({ authenticated: false });
    args.setProducts([]);
    args.setRevisionsById({});
    args.setSelectedSlug(null);
    args.setDraft(buildEmptyDraft(args.storefrontConfig.defaultCategory));
    args.setDraftRevision(null);
  } catch (err) {
    args.setError(err instanceof Error ? err.message : args.t("logoutFailed"));
  } finally {
    args.setBusy(false);
  }
}

async function handleSaveRequest(args: {
  draft: CatalogProductDraftInput;
  draftRevision: string | null;
  storefront: XaCatalogStorefront;
  t: (key: string) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loadCatalog: () => Promise<void>;
  revisionsById: Record<string, string>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const parsed = catalogProductDraftSchema.safeParse(args.draft);
  if (!parsed.success) {
    args.setFieldErrors(toErrorMap(parsed.error));
    args.setError(args.t("fixValidationErrorsBeforeSaving"));
    return;
  }

  args.setBusy(true);
  args.setError(null);
  args.setFieldErrors({});
  try {
    const response = await fetch(
      `/api/catalog/products?storefront=${encodeURIComponent(args.storefront)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: args.draft,
          ifMatch: args.draftRevision ?? undefined,
        }),
      },
    );
    const data = (await response.json()) as {
      ok: boolean;
      product?: CatalogProductDraftInput;
      revision?: string;
      error?: string;
    };
    if (!response.ok || !data.ok || !data.product) {
      throw new Error(data.error || args.t("saveFailed"));
    }
    await args.loadCatalog();
    selectProduct({
      product: data.product,
      revisionsById: args.revisionsById,
      setSelectedSlug: args.setSelectedSlug,
      setDraft: args.setDraft,
      setDraftRevision: args.setDraftRevision,
      setFieldErrors: args.setFieldErrors,
      setError: args.setError,
      setSyncOutput: args.setSyncOutput,
    });
    args.setDraftRevision(data.revision ?? null);
  } catch (err) {
    args.setError(err instanceof Error ? err.message : args.t("saveFailed"));
  } finally {
    args.setBusy(false);
  }
}

async function handleDeleteRequest(args: {
  locale: UploaderLocale;
  draft: CatalogProductDraftInput;
  storefront: XaCatalogStorefront;
  t: (key: string) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
  storefrontConfig: ReturnType<typeof getStorefrontConfig>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const slug = slugify(args.draft.slug || args.draft.title);
  if (!slug) return;
  if (!confirm(getUploaderConfirmDelete(args.locale, slug))) return;

  args.setBusy(true);
  args.setError(null);
  try {
    const response = await fetch(
      `/api/catalog/products/${encodeURIComponent(slug)}?storefront=${encodeURIComponent(args.storefront)}`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      throw new Error(data.error || args.t("deleteFailed"));
    }
    await args.loadCatalog();
    resetEditorState({
      storefrontConfig: args.storefrontConfig,
      setSelectedSlug: args.setSelectedSlug,
      setDraft: args.setDraft,
      setDraftRevision: args.setDraftRevision,
      setFieldErrors: args.setFieldErrors,
      setError: args.setError,
      setSyncOutput: args.setSyncOutput,
    });
  } catch (err) {
    args.setError(err instanceof Error ? err.message : args.t("deleteFailed"));
  } finally {
    args.setBusy(false);
  }
}

async function handleSyncRequest(args: {
  storefront: XaCatalogStorefront;
  syncOptions: typeof DEFAULT_SYNC_OPTIONS;
  t: (key: string) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
}) {
  args.setBusy(true);
  args.setError(null);
  args.setSyncOutput(null);
  try {
    const response = await fetch("/api/catalog/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options: args.syncOptions, storefront: args.storefront }),
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
    args.setSyncOutput(output);

    if (!response.ok || !data.ok) {
      throw new Error(data.error || args.t("syncFailed"));
    }
    await args.loadCatalog().catch(() => null);
  } catch (err) {
    args.setError(err instanceof Error ? err.message : args.t("syncFailed"));
  } finally {
    args.setBusy(false);
  }
}

async function handleExportSubmissionRequest(args: {
  uploaderMode: "vendor" | "internal";
  storefront: XaCatalogStorefront;
  submissionSlugs: Set<string>;
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionStatus: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionAction: React.Dispatch<React.SetStateAction<SubmissionAction>>;
  setSubmissionSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  if (args.submissionSlugs.size === 0) return;
  args.setBusy(true);
  args.setError(null);
  args.setSubmissionStatus(null);
  args.setSubmissionAction("export");
  try {
    const slugs = Array.from(args.submissionSlugs);
    const { blob, filename, submissionId, r2Key } = await fetchSubmissionZip(
      slugs,
      args.t("exportFailed"),
      args.storefront,
    );
    downloadBlob(blob, filename);
    clearSubmission({ setSubmissionSlugs: args.setSubmissionSlugs, setSubmissionStatus: args.setSubmissionStatus });
    const statusParts: string[] = [];
    statusParts.push(submissionId ? args.t("submissionReady", { id: submissionId }) : filename);
    if (args.uploaderMode === "internal" && r2Key) statusParts.push(r2Key);
    args.setSubmissionStatus(statusParts.join(" · "));
  } catch (err) {
    args.setError(err instanceof Error ? err.message : args.t("exportFailed"));
  } finally {
    args.setSubmissionAction(null);
    args.setBusy(false);
  }
}

async function handleUploadSubmissionToR2Request(args: {
  uploaderMode: "vendor" | "internal";
  storefront: XaCatalogStorefront;
  submissionSlugs: Set<string>;
  submissionUploadUrl: string;
  t: (key: string, vars?: Record<string, unknown>) => string;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionStatus: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionAction: React.Dispatch<React.SetStateAction<SubmissionAction>>;
  setSubmissionSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  if (args.submissionSlugs.size === 0) return;
  if (!args.submissionUploadUrl.trim()) return;
  args.setBusy(true);
  args.setError(null);
  args.setSubmissionStatus(null);
  args.setSubmissionAction("upload");
  try {
    const slugs = Array.from(args.submissionSlugs);
    const { blob, filename, submissionId, r2Key } = await fetchSubmissionZip(
      slugs,
      args.t("exportFailed"),
      args.storefront,
    );
    const headers: Record<string, string> = { "Content-Type": "application/zip" };
    if (submissionId) headers["X-XA-Submission-Id"] = submissionId;
    const res = await fetch(args.submissionUploadUrl.trim(), {
      method: "PUT",
      headers,
      body: blob,
    });
    if (!res.ok) {
      throw new Error(`Upload failed (${res.status}).`);
    }
    clearSubmission({ setSubmissionSlugs: args.setSubmissionSlugs, setSubmissionStatus: args.setSubmissionStatus });
    const statusParts: string[] = [];
    statusParts.push(submissionId ? args.t("submissionUploaded", { id: submissionId }) : filename);
    if (args.uploaderMode === "internal" && r2Key) statusParts.push(r2Key);
    args.setSubmissionStatus(statusParts.join(" · "));
  } catch (err) {
    args.setError(err instanceof Error ? err.message : args.t("exportFailed"));
  } finally {
    args.setSubmissionAction(null);
    args.setBusy(false);
  }
}

export function useCatalogConsole() {
  const { locale, t } = useUploaderI18n();
  const uploaderMode = getUploaderMode();
  const r2Destination = getR2Destination();

  const [session, setSession] = React.useState<SessionState | null>(null);
  const [storefront, setStorefront] = React.useState<XaCatalogStorefront>(loadInitialStorefront);
  const storefrontConfig = getStorefrontConfig(storefront);
  const [token, setToken] = React.useState("");
  const [products, setProducts] = React.useState<CatalogProductDraftInput[]>([]);
  const [revisionsById, setRevisionsById] = React.useState<Record<string, string>>({});
  const [query, setQuery] = React.useState("");
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);
  const submissionMax = SUBMISSION_MAX;
  const submissionMaxBytes = SUBMISSION_MAX_BYTES;
  const minImageEdge = getMinImageEdge();
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
  const [syncOptions, setSyncOptions] = React.useState(DEFAULT_SYNC_OPTIONS);
  const [syncOutput, setSyncOutput] = React.useState<string | null>(null);

  const loadSession = React.useCallback(async () => {
    setSession(await fetchSessionState());
  }, []);

  const loadCatalog = React.useCallback(async () => {
    const data = await fetchCatalogList(storefront);
    if (!data.ok) throw new Error(data.error || t("unableToLoadCatalog"));
    setProducts(data.products ?? []);
    setRevisionsById(data.revisionsById ?? {});
  }, [storefront, t]);

  React.useEffect(() => {
    loadSession().catch(() => setSession({ authenticated: false }));
  }, [loadSession]);

  React.useEffect(() => {
    if (!session?.authenticated) return;
    loadCatalog().catch((err) =>
      setError(err instanceof Error ? err.message : t("loadFailed")),
    );
  }, [session, loadCatalog, t]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("xa_uploader_storefront", storefront);
  }, [storefront]);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) =>
    handleLoginRequest({ event, token, t, setBusy, setError, loadSession });

  const handleLogout = () =>
    handleLogoutRequest({
      uploaderMode,
      t,
      storefrontConfig,
      setBusy,
      setError,
      setSession,
      setProducts,
      setRevisionsById,
      setSelectedSlug,
      setDraft,
      setDraftRevision,
    });

  const handleNew = () =>
    resetEditorState({
      storefrontConfig,
      setSelectedSlug,
      setDraft,
      setDraftRevision,
      setFieldErrors,
      setError,
      setSyncOutput,
    });

  const handleStorefrontChange = (next: XaCatalogStorefront) => {
    if (next === storefront) return;
    setStorefront(next);
    setProducts([]);
    setRevisionsById({});
    resetEditorState({
      storefrontConfig: getStorefrontConfig(next),
      setSelectedSlug,
      setDraft,
      setDraftRevision,
      setFieldErrors,
      setError,
      setSyncOutput,
    });
    setSubmissionSlugs(new Set());
    setSubmissionStatus(null);
  };

  const handleSelect = (product: CatalogProductDraftInput) =>
    selectProduct({
      product,
      revisionsById,
      setSelectedSlug,
      setDraft,
      setDraftRevision,
      setFieldErrors,
      setError,
      setSyncOutput,
    });

  const handleToggleSubmissionSlug = (slug: string) => {
    setSubmissionSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < submissionMax) next.add(slug);
      return next;
    });
  };

  const handleClearSubmission = () => {
    clearSubmission({ setSubmissionSlugs, setSubmissionStatus });
  };

  const handleSave = () =>
    handleSaveRequest({
      draft,
      draftRevision,
      storefront,
      t,
      setBusy,
      setError,
      setFieldErrors,
      loadCatalog,
      revisionsById,
      setSelectedSlug,
      setDraft,
      setDraftRevision,
      setSyncOutput,
    });

  const handleDelete = () =>
    handleDeleteRequest({
      locale,
      draft,
      storefront,
      t,
      setBusy,
      setError,
      loadCatalog,
      storefrontConfig,
      setSelectedSlug,
      setDraft,
      setDraftRevision,
      setFieldErrors,
      setSyncOutput,
    });

  const handleSync = () =>
    handleSyncRequest({
      storefront,
      syncOptions,
      t,
      setBusy,
      setError,
      setSyncOutput,
      loadCatalog,
    });

  const handleExportSubmission = () =>
    handleExportSubmissionRequest({
      uploaderMode,
      storefront,
      submissionSlugs,
      t,
      setBusy,
      setError,
      setSubmissionStatus,
      setSubmissionAction,
      setSubmissionSlugs,
    });

  const handleUploadSubmissionToR2 = () =>
    handleUploadSubmissionToR2Request({
      uploaderMode,
      storefront,
      submissionSlugs,
      submissionUploadUrl,
      t,
      setBusy,
      setError,
      setSubmissionStatus,
      setSubmissionAction,
      setSubmissionSlugs,
    });

  return {
    uploaderMode, r2Destination, session,
    token, setToken,
    storefront, storefronts: XA_CATALOG_STOREFRONTS, setStorefront,
    products, query, setQuery,
    selectedSlug, draft, setDraft, draftRevision,
    busy, error, fieldErrors,
    syncOptions, setSyncOptions, syncOutput,
    submissionMax, submissionMaxBytes, minImageEdge,
    submissionSlugs, submissionUploadUrl, setSubmissionUploadUrl, submissionStatus, submissionAction,
    loadCatalog, storefrontConfig,
    handleStorefrontChange, handleLogin, handleLogout, handleNew, handleSelect,
    handleSave, handleDelete, handleSync,
    handleToggleSubmissionSlug, handleClearSubmission, handleExportSubmission, handleUploadSubmissionToR2,
  };
}
