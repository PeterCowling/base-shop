import type * as React from "react";

import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  slugify,
} from "../../lib/catalogAdminSchema";
import { getStorefrontConfig } from "../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { getUploaderConfirmDelete, type UploaderLocale } from "../../lib/uploaderI18n";

import {
  type ActionFeedbackState,
  type BusyLockRef,
  clearActionFeedbackDomains,
  createInitialActionFeedbackState,
  endBusyAction,
  errorToMessage,
  getCatalogApiErrorMessage,
  getSyncFailureMessage,
  type SubmissionAction,
  type SyncResponse,
  tryBeginBusyAction,
  updateActionFeedback,
} from "./catalogConsoleFeedback";
import { buildLogBlock, toErrorMap } from "./catalogConsoleUtils";
import { buildEmptyDraft, withDraftDefaults } from "./catalogDraft";
import { downloadBlob, fetchSubmissionZip } from "./catalogSubmissionClient";

type Translator = (key: string, vars?: Record<string, unknown>) => string;

export function handleNewImpl({
  defaultCategory,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setActionFeedback,
  setSyncOutput,
}: {
  defaultCategory: CatalogProductDraftInput["taxonomy"]["category"];
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  setSelectedSlug(null);
  setDraft(buildEmptyDraft(defaultCategory));
  setDraftRevision(null);
  setFieldErrors({});
  clearActionFeedbackDomains(setActionFeedback, ["draft", "sync"]);
  setSyncOutput(null);
}

export function handleStorefrontChangeImpl({
  nextStorefront,
  currentStorefront,
  setStorefront,
  setProducts,
  setRevisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setActionFeedback,
  setSubmissionSlugs,
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
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSubmissionSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
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
  clearActionFeedbackDomains(setActionFeedback, ["draft", "submission", "sync"]);
  setSubmissionSlugs(new Set());
  setSyncOutput(null);
}

export function handleSelectImpl({
  product,
  revisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setActionFeedback,
  setSyncOutput,
}: {
  product: CatalogProductDraftInput;
  revisionsById: Record<string, string>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
}): void {
  const normalized = withDraftDefaults(product);
  setSelectedSlug(normalized.slug);
  setDraft(normalized);
  const id = (normalized.id ?? "").trim();
  setDraftRevision(id ? revisionsById[id] ?? null : null);
  setFieldErrors({});
  clearActionFeedbackDomains(setActionFeedback, ["draft", "sync"]);
  setSyncOutput(null);
}

export function toggleSubmissionSlug(
  previous: Set<string>,
  slug: string,
  submissionMax: number,
): Set<string> {
  const next = new Set(previous);
  if (next.has(slug)) next.delete(slug);
  else if (next.size < submissionMax) next.add(slug);
  return next;
}

export function handleClearSubmissionImpl({
  setSubmissionSlugs,
  setActionFeedback,
}: {
  setSubmissionSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
}): void {
  setSubmissionSlugs(new Set());
  clearActionFeedbackDomains(setActionFeedback, ["submission"]);
}

export async function handleLoginImpl({
  event,
  token,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  loadSession,
}: {
  event: React.FormEvent<HTMLFormElement>;
  token: string;
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  loadSession: () => Promise<void>;
}): Promise<void> {
  event.preventDefault();
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["login"]);
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
    updateActionFeedback(setActionFeedback, "login", {
      kind: "error",
      message: errorToMessage(err, t("loginFailed")),
    });
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleLogoutImpl({
  uploaderMode,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  setSession,
  setProducts,
  setRevisionsById,
  setSelectedSlug,
  setDraft,
  setDraftRevision,
  setFieldErrors,
  setSubmissionSlugs,
  setSubmissionAction,
  setSyncOutput,
  defaultCategory,
}: {
  uploaderMode: "vendor" | "internal";
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSession: React.Dispatch<React.SetStateAction<{ authenticated: boolean } | null>>;
  setProducts: React.Dispatch<React.SetStateAction<CatalogProductDraftInput[]>>;
  setRevisionsById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<CatalogProductDraftInput>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSubmissionSlugs: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSubmissionAction: React.Dispatch<React.SetStateAction<SubmissionAction>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
  defaultCategory: CatalogProductDraftInput["taxonomy"]["category"];
}): Promise<void> {
  if (uploaderMode === "vendor") return;
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["login"]);
  try {
    await fetch("/api/uploader/logout", { method: "POST" });
    setSession({ authenticated: false });
    setProducts([]);
    setRevisionsById({});
    setSelectedSlug(null);
    setDraft(buildEmptyDraft(defaultCategory));
    setDraftRevision(null);
    setFieldErrors({});
    setSubmissionSlugs(new Set());
    setSubmissionAction(null);
    setSyncOutput(null);
    setActionFeedback(createInitialActionFeedbackState());
  } catch (err) {
    updateActionFeedback(setActionFeedback, "login", {
      kind: "error",
      message: errorToMessage(err, t("logoutFailed")),
    });
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleSaveImpl({
  draft,
  draftRevision,
  storefront,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  setFieldErrors,
  setDraftRevision,
  loadCatalog,
  handleSelect,
}: {
  draft: CatalogProductDraftInput;
  draftRevision: string | null;
  storefront: XaCatalogStorefront;
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDraftRevision: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
  handleSelect: (product: CatalogProductDraftInput) => void;
}): Promise<void> {
  const parsed = catalogProductDraftSchema.safeParse(draft);
  if (!parsed.success) {
    setFieldErrors(toErrorMap(parsed.error, t));
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "error",
      message: t("fixValidationErrorsBeforeSaving"),
    });
    return;
  }

  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["draft"]);
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
      throw new Error(getCatalogApiErrorMessage(data.error, "saveFailed", t));
    }
    await loadCatalog();
    handleSelect(data.product);
    setDraftRevision(data.revision ?? null);
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "success",
      message: t("saveSucceeded"),
    });
  } catch (err) {
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "error",
      message: errorToMessage(err, t("saveFailed")),
    });
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleDeleteImpl({
  locale,
  draft,
  storefront,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  loadCatalog,
  handleNew,
}: {
  locale: UploaderLocale;
  draft: CatalogProductDraftInput;
  storefront: XaCatalogStorefront;
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  loadCatalog: () => Promise<void>;
  handleNew: () => void;
}): Promise<void> {
  const slug = slugify(draft.slug || draft.title);
  if (!slug) return;
  if (!confirm(getUploaderConfirmDelete(locale, slug))) return;

  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["draft"]);
  try {
    const response = await fetch(
      `/api/catalog/products/${encodeURIComponent(slug)}?storefront=${encodeURIComponent(storefront)}`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      throw new Error(getCatalogApiErrorMessage(data.error, "deleteFailed", t));
    }
    await loadCatalog();
    handleNew();
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "success",
      message: t("deleteSucceeded", { slug }),
    });
  } catch (err) {
    updateActionFeedback(setActionFeedback, "draft", {
      kind: "error",
      message: errorToMessage(err, t("deleteFailed")),
    });
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleSyncImpl({
  storefront,
  syncOptions,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  setSyncOutput,
  loadCatalog,
}: {
  storefront: XaCatalogStorefront;
  syncOptions: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean };
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
}): Promise<void> {
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["sync"]);
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
      throw new Error(getSyncFailureMessage(data, t));
    }
    await loadCatalog().catch(() => null);
    updateActionFeedback(setActionFeedback, "sync", {
      kind: "success",
      message: t("syncSucceeded"),
    });
  } catch (err) {
    updateActionFeedback(setActionFeedback, "sync", {
      kind: "error",
      message: errorToMessage(err, t("syncFailed")),
    });
  } finally {
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleExportSubmissionImpl({
  submissionSlugs,
  storefront,
  uploaderMode,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  setSubmissionAction,
  handleClearSubmission,
}: {
  submissionSlugs: Set<string>;
  storefront: XaCatalogStorefront;
  uploaderMode: "vendor" | "internal";
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSubmissionAction: React.Dispatch<React.SetStateAction<SubmissionAction>>;
  handleClearSubmission: () => void;
}): Promise<void> {
  if (submissionSlugs.size === 0) return;
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["submission"]);
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
    updateActionFeedback(setActionFeedback, "submission", {
      kind: "success",
      message: statusParts.join(" · "),
    });
  } catch (err) {
    updateActionFeedback(setActionFeedback, "submission", {
      kind: "error",
      message: getCatalogApiErrorMessage(err instanceof Error ? err.message : undefined, "exportFailed", t),
    });
  } finally {
    setSubmissionAction(null);
    endBusyAction(busyLockRef, setBusy);
  }
}

export async function handleUploadSubmissionToR2Impl({
  submissionSlugs,
  submissionUploadUrl,
  storefront,
  uploaderMode,
  t,
  busyLockRef,
  setBusy,
  setActionFeedback,
  setSubmissionAction,
  handleClearSubmission,
}: {
  submissionSlugs: Set<string>;
  submissionUploadUrl: string;
  storefront: XaCatalogStorefront;
  uploaderMode: "vendor" | "internal";
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSubmissionAction: React.Dispatch<React.SetStateAction<SubmissionAction>>;
  handleClearSubmission: () => void;
}): Promise<void> {
  if (submissionSlugs.size === 0) return;
  if (!submissionUploadUrl.trim()) return;
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["submission"]);
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
      throw new Error("internal_error");
    }
    handleClearSubmission();
    const statusParts: string[] = [];
    statusParts.push(submissionId ? t("submissionUploaded", { id: submissionId }) : filename);
    if (uploaderMode === "internal" && r2Key) statusParts.push(r2Key);
    updateActionFeedback(setActionFeedback, "submission", {
      kind: "success",
      message: statusParts.join(" · "),
    });
  } catch (err) {
    updateActionFeedback(setActionFeedback, "submission", {
      kind: "error",
      message: getCatalogApiErrorMessage(err instanceof Error ? err.message : undefined, "exportFailed", t),
    });
  } finally {
    setSubmissionAction(null);
    endBusyAction(busyLockRef, setBusy);
  }
}
