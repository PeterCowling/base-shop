import type * as React from "react";

import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  slugify,
} from "@acme/lib/xa/catalogAdminSchema";

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
  type SyncResponse,
  tryBeginBusyAction,
  updateActionFeedback,
} from "./catalogConsoleFeedback";
import { buildLogBlock, toErrorMap } from "./catalogConsoleUtils";
import { buildEmptyDraft, withDraftDefaults } from "./catalogDraft";

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
  clearActionFeedbackDomains(setActionFeedback, ["draft", "sync"]);
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
  confirmUnpublish,
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
  confirmUnpublish: (message: string) => boolean;
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

  const doSave = async (confirm?: boolean): Promise<void> => {
    const response = await fetch(`/api/catalog/products?storefront=${encodeURIComponent(storefront)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: draft,
        ifMatch: draftRevision ?? undefined,
        ...(confirm ? { confirmUnpublish: true } : {}),
      }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      product?: CatalogProductDraftInput;
      revision?: string;
      error?: string;
      requiresConfirmation?: boolean;
    };

    if (response.status === 409 && data.error === "would_unpublish" && data.requiresConfirmation) {
      const confirmed = confirmUnpublish(t("saveConfirmUnpublish"));
      if (!confirmed) return;
      await doSave(true);
      return;
    }

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
  };

  try {
    await doSave();
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
  confirmEmptyCatalogSync,
}: {
  storefront: XaCatalogStorefront;
  syncOptions: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean };
  t: Translator;
  busyLockRef: BusyLockRef;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setActionFeedback: React.Dispatch<React.SetStateAction<ActionFeedbackState>>;
  setSyncOutput: React.Dispatch<React.SetStateAction<string | null>>;
  loadCatalog: () => Promise<void>;
  confirmEmptyCatalogSync: (message: string) => boolean;
}): Promise<void> {
  if (!tryBeginBusyAction(busyLockRef, setBusy)) return;
  clearActionFeedbackDomains(setActionFeedback, ["sync"]);
  setSyncOutput(null);

  const runSyncRequest = async (confirmEmptyInput: boolean): Promise<{ response: Response; data: SyncResponse }> => {
    const response = await fetch("/api/catalog/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        options: { ...syncOptions, confirmEmptyInput },
        storefront,
      }),
    });
    const data = (await response.json()) as SyncResponse;
    return { response, data };
  };

  try {
    let syncAttempt = await runSyncRequest(false);

    const CONFIRMABLE_SYNC_ERRORS: readonly string[] = ["catalog_input_empty", "no_publishable_products"];
    if (
      syncAttempt.response.status === 409 &&
      syncAttempt.data.requiresConfirmation &&
      syncAttempt.data.error &&
      CONFIRMABLE_SYNC_ERRORS.includes(syncAttempt.data.error)
    ) {
      const confirmMessage =
        syncAttempt.data.error === "no_publishable_products"
          ? t("syncConfirmNoPublishableProducts")
          : t("syncConfirmEmptyCatalogSync");
      const confirmed = confirmEmptyCatalogSync(confirmMessage);
      if (!confirmed) return;
      syncAttempt = await runSyncRequest(true);
    }

    const output =
      [
        buildLogBlock("validate", syncAttempt.data.logs?.validate),
        buildLogBlock("sync", syncAttempt.data.logs?.sync),
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim() || null;
    setSyncOutput(output);

    if (!syncAttempt.response.ok || !syncAttempt.data.ok) {
      throw new Error(getSyncFailureMessage(syncAttempt.data, t));
    }
    await loadCatalog().catch(() => null);
    const syncSuccessMessage =
      syncAttempt.data.display?.requiresXaBBuild === true
        ? t("syncSucceededRebuildRequired")
        : t("syncSucceeded");
    updateActionFeedback(setActionFeedback, "sync", {
      kind: "success",
      message: syncSuccessMessage,
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

