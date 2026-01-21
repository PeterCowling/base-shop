"use client";

import * as React from "react";

import {
  catalogProductDraftSchema,
  slugify,
  type CatalogProductDraftInput,
} from "../../lib/catalogAdminSchema";
import { getUploaderConfirmDelete } from "../../lib/uploaderI18n";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";
import {
  DEFAULT_STOREFRONT,
  XA_CATALOG_STOREFRONTS,
  getStorefrontConfig,
  parseStorefront,
} from "../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";

import { downloadBlob, fetchSubmissionZip } from "./catalogSubmissionClient";
import { buildLogBlock, toErrorMap } from "./catalogConsoleUtils";
import { buildEmptyDraft, withDraftDefaults } from "./catalogDraft";

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

export function useCatalogConsole() {
  const { locale, t } = useUploaderI18n();
  const uploaderMode =
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
    loadCatalog().catch((err) =>
      setError(err instanceof Error ? err.message : t("loadFailed")),
    );
  }, [session, loadCatalog, t]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("xa_uploader_storefront", storefront);
  }, [storefront]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
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
      setError(err instanceof Error ? err.message : t("loginFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    if (uploaderMode === "vendor") return;
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/uploader/logout", { method: "POST" });
      setSession({ authenticated: false });
      setProducts([]);
      setRevisionsById({});
      setSelectedSlug(null);
      setDraft(buildEmptyDraft(storefrontConfig.defaultCategory));
      setDraftRevision(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("logoutFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleNew = () => {
    setSelectedSlug(null);
    setDraft(buildEmptyDraft(storefrontConfig.defaultCategory));
    setDraftRevision(null);
    setFieldErrors({});
    setError(null);
    setSyncOutput(null);
  };

  const handleStorefrontChange = (next: XaCatalogStorefront) => {
    if (next === storefront) return;
    setStorefront(next);
    setProducts([]);
    setRevisionsById({});
    setSelectedSlug(null);
    setDraft(buildEmptyDraft(getStorefrontConfig(next).defaultCategory));
    setDraftRevision(null);
    setFieldErrors({});
    setError(null);
    setSubmissionSlugs(new Set());
    setSubmissionStatus(null);
    setSyncOutput(null);
  };

  const handleSelect = (product: CatalogProductDraftInput) => {
    const normalized = withDraftDefaults(product);
    setSelectedSlug(normalized.slug);
    setDraft(normalized);
    const id = (normalized.id ?? "").trim();
    setDraftRevision(id ? revisionsById[id] ?? null : null);
    setFieldErrors({});
    setError(null);
    setSyncOutput(null);
  };

  const handleToggleSubmissionSlug = (slug: string) => {
    setSubmissionSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < submissionMax) next.add(slug);
      return next;
    });
  };

  const handleClearSubmission = () => {
    setSubmissionSlugs(new Set());
    setSubmissionStatus(null);
  };

  const handleSave = async () => {
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
      const response = await fetch(
        `/api/catalog/products?storefront=${encodeURIComponent(storefront)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: draft,
            ifMatch: draftRevision ?? undefined,
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
        throw new Error(data.error || t("saveFailed"));
      }
      await loadCatalog();
      handleSelect(data.product);
      setDraftRevision(data.revision ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
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
      setError(err instanceof Error ? err.message : t("deleteFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
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
      setError(err instanceof Error ? err.message : t("syncFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleExportSubmission = async () => {
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
      setError(err instanceof Error ? err.message : t("exportFailed"));
    } finally {
      setSubmissionAction(null);
      setBusy(false);
    }
  };

  const handleUploadSubmissionToR2 = async () => {
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
      setError(err instanceof Error ? err.message : t("exportFailed"));
    } finally {
      setSubmissionAction(null);
      setBusy(false);
    }
  };

  return {
    uploaderMode,
    r2Destination,
    session,
    token,
    setToken,
    storefront,
    storefronts: XA_CATALOG_STOREFRONTS,
    setStorefront,
    products,
    query,
    setQuery,
    selectedSlug,
    draft,
    setDraft,
    draftRevision,
    busy,
    error,
    fieldErrors,
    syncOptions,
    setSyncOptions,
    syncOutput,
    submissionMax,
    submissionMaxBytes,
    minImageEdge,
    submissionSlugs,
    submissionUploadUrl,
    setSubmissionUploadUrl,
    submissionStatus,
    submissionAction,
    loadCatalog,
    storefrontConfig,
    handleStorefrontChange,
    handleLogin,
    handleLogout,
    handleNew,
    handleSelect,
    handleSave,
    handleDelete,
    handleSync,
    handleToggleSubmissionSlug,
    handleClearSubmission,
    handleExportSubmission,
    handleUploadSubmissionToR2,
  };
}
