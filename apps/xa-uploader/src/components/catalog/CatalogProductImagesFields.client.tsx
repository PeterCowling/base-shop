"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import type { CatalogProductDraftInput } from "@acme/lib/xa/catalogAdminSchema";
import {
  normalizeXaImageRole,
  requiredImageRolesByCategory,
  type XaImageRole,
} from "@acme/lib/xa/catalogImageRoles";

import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { getCatalogApiErrorMessage } from "./catalogConsoleFeedback";
import { BTN_SECONDARY_CLASS, SELECT_CLASS } from "./catalogStyles";

const IMAGE_ROLES = ["front", "side", "top", "back", "detail", "interior", "scale"] as const;
type UploadImageRole = (typeof IMAGE_ROLES)[number];
type AutosaveStatus = "saving" | "saved" | "unsaved";
type UploadStatus = "idle" | "uploading" | "persisting" | "persisted" | "error";
type ImageEntry = { path: string; role: string; filename: string };
type RequiredRoleStatus = { role: XaImageRole; isPresent: boolean };

const ROLE_I18N_KEYS: Record<UploadImageRole, string> = {
  front: "uploadImageRoleFront",
  side: "uploadImageRoleSide",
  top: "uploadImageRoleTop",
  back: "uploadImageRoleBack",
  detail: "uploadImageRoleDetail",
  interior: "uploadImageRoleInterior",
  scale: "uploadImageRoleScale",
} as const;

const ROLE_HINTS: Record<UploadImageRole, string> = {
  front: "uploadRoleHintFront",
  side: "uploadRoleHintSide",
  top: "uploadRoleHintTop",
  back: "uploadRoleHintBack",
  detail: "uploadRoleHintDetail",
  interior: "uploadRoleHintInterior",
  scale: "uploadRoleHintScale",
};

const MAX_FILE_SIZE = 8_388_608; // 8 MB
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AUTOSAVE_PERSIST_TIMEOUT_MS = 20_000;
const AUTOSAVE_PERSIST_POLL_MS = 120;

/** Simple bag outline viewed from the selected angle. */
function RoleIllustration({ role }: { role: UploadImageRole }) {
  const cls = "size-16 text-gate-muted/50";
  switch (role) {
    case "front":
      return (
        <svg className={cls} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="14" y="24" width="36" height="30" rx="3" />
          <path d="M24 24V18a8 8 0 0 1 16 0v6" />
          <circle cx="32" cy="36" r="2.5" />
          <path d="M32 60 L32 56" strokeWidth={1} strokeDasharray="2 2" />
        </svg>
      );
    case "side":
      return (
        <svg className={cls} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="22" y="24" width="14" height="30" rx="3" />
          <path d="M26 24V18a3 3 0 0 1 6 0v6" />
          <line x1="29" y1="28" x2="29" y2="50" strokeDasharray="3 3" strokeWidth={1} />
          <path d="M46 39 L40 39" strokeWidth={1.5} />
          <path d="M44 36 L46 39 L44 42" strokeWidth={1.5} />
        </svg>
      );
    case "top":
      return (
        <svg className={cls} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="14" y="20" width="36" height="20" rx="3" />
          <line x1="18" y1="30" x2="46" y2="30" strokeDasharray="4 3" strokeWidth={1} />
          <path d="M32 8 L32 16" strokeWidth={1.5} />
          <path d="M29 14 L32 17 L35 14" strokeWidth={1.5} />
        </svg>
      );
    case "back":
      return (
        <svg className={cls} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="14" y="24" width="36" height="30" rx="3" />
          <path d="M24 24V18a8 8 0 0 1 16 0v6" />
          <rect x="20" y="32" width="24" height="14" rx="2" strokeDasharray="3 3" strokeWidth={1} />
        </svg>
      );
    case "detail":
      return (
        <svg className={cls} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="28" cy="28" r="12" />
          <line x1="36.5" y1="36.5" x2="48" y2="48" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M22 26 L34 26" strokeWidth={1} />
          <path d="M22 30 L30 30" strokeWidth={1} />
        </svg>
      );
    case "interior":
      return (
        <svg className={cls} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M14 22 L14 54 Q14 57 17 57 L47 57 Q50 57 50 54 L50 22" />
          <path d="M14 22 Q14 16 20 14 L44 14 Q50 16 50 22" strokeDasharray="3 3" />
          <rect x="20" y="34" width="10" height="16" rx="1.5" strokeWidth={1} />
          <rect x="34" y="38" width="10" height="12" rx="1.5" strokeWidth={1} />
        </svg>
      );
    case "scale":
      return (
        <svg className={cls} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="8" y="28" width="24" height="20" rx="2" />
          <path d="M14 28V24a6 6 0 0 1 12 0v4" />
          <line x1="42" y1="20" x2="42" y2="52" strokeWidth={1.5} />
          <line x1="39" y1="20" x2="45" y2="20" strokeWidth={1.5} />
          <line x1="39" y1="52" x2="45" y2="52" strokeWidth={1.5} />
          <line x1="40" y1="28" x2="44" y2="28" strokeWidth={1} />
          <line x1="40" y1="36" x2="44" y2="36" strokeWidth={1} />
          <line x1="40" y1="44" x2="44" y2="44" strokeWidth={1} />
        </svg>
      );
  }
}

function ImagePlaceholder() {
  return (
    <div className="flex size-full items-center justify-center">
      <svg
        className="size-10 text-gate-muted/40"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
        />
      </svg>
    </div>
  );
}

/** Renders an <img> that falls back to the placeholder on load error or invalid image data. */
function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <ImagePlaceholder />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      // i18n-exempt -- XAUP-0001 [ttl=2027-03-04] next/image sizes descriptor, non-user-facing
      sizes="(min-width: 640px) 33vw, 50vw"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function parseImageEntries(files: string, roles: string): ImageEntry[] {
  const fileParts = files
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
  const roleParts = roles
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  return fileParts.map((path, index) => ({
    path,
    role: roleParts[index] ?? "",
    filename: path.split("/").pop() ?? path,
  }));
}

function removePipeEntry(pipeStr: string, index: number): string {
  return pipeStr
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((_, itemIndex) => itemIndex !== index)
    .join("|");
}

export function reorderPipeEntry(pipeStr: string, fromIndex: number, direction: "up" | "down"): string {
  const parts = pipeStr
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (toIndex < 0 || toIndex >= parts.length || fromIndex < 0 || fromIndex >= parts.length) {
    return pipeStr
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean)
      .join("|");
  }
  const next = [...parts];
  [next[fromIndex], next[toIndex]] = [next[toIndex]!, next[fromIndex]!];
  return next.join("|");
}

function resolveImageSrc(entryPath: string, previews: Map<string, string>): string | undefined {
  const blob = previews.get(entryPath);
  if (blob) return blob;

  const normalized = entryPath.trim();
  if (!normalized) return undefined;
  if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("/")) {
    return normalized;
  }
  return `/${normalized}`;
}

function appendImageDraftEntry(
  draft: CatalogProductDraftInput,
  imageKey: string,
  selectedRole: UploadImageRole,
): CatalogProductDraftInput {
  const currentFiles = (draft.imageFiles ?? "").trim();
  const currentRoles = (draft.imageRoles ?? "").trim();
  const currentAlts = (draft.imageAltTexts ?? "").trim();

  const nextFiles = currentFiles ? `${currentFiles}|${imageKey}` : imageKey;
  const nextRoles = currentRoles ? `${currentRoles}|${selectedRole}` : selectedRole;
  const altText = `${selectedRole} view`;
  const nextAlts = currentAlts ? `${currentAlts}|${altText}` : altText;

  return {
    ...draft,
    imageFiles: nextFiles,
    imageRoles: nextRoles,
    imageAltTexts: nextAlts,
  };
}

function reorderImageDraft(
  draft: CatalogProductDraftInput,
  index: number,
  direction: "up" | "down",
): CatalogProductDraftInput {
  return {
    ...draft,
    imageFiles: reorderPipeEntry(draft.imageFiles ?? "", index, direction),
    imageRoles: reorderPipeEntry(draft.imageRoles ?? "", index, direction),
    imageAltTexts: reorderPipeEntry(draft.imageAltTexts ?? "", index, direction),
  };
}

function notifyImageDraftChange(
  nextDraft: CatalogProductDraftInput,
  onChange: (next: CatalogProductDraftInput) => void,
  onImageUploaded: (nextDraft: CatalogProductDraftInput) => void,
) {
  onChange(nextDraft);
  onImageUploaded(nextDraft);
}

function isDeletableCatalogPath(pathValue: string): boolean {
  const normalized = pathValue.trim().replace(/^\/+/, "");
  if (!normalized) return false;
  if (/^https?:\/\//i.test(normalized)) return false;
  return true;
}

function usePersistedImageCleanup(params: {
  lastAutosaveSavedAt: number | null;
  storefront: XaCatalogStorefront;
}) {
  const lastAutosaveSavedAtRef = useRef<number | null>(params.lastAutosaveSavedAt);

  useEffect(() => {
    lastAutosaveSavedAtRef.current = params.lastAutosaveSavedAt;
  }, [params.lastAutosaveSavedAt]);

  return useCallback(async (pathValue: string, queuedAt: number) => {
    const key = pathValue.trim().replace(/^\/+/, "");
    if (!isDeletableCatalogPath(key)) return;

    const persistedAlready = typeof lastAutosaveSavedAtRef.current === "number" &&
      lastAutosaveSavedAtRef.current >= queuedAt;
    if (!persistedAlready) {
      const deadline = Date.now() + AUTOSAVE_PERSIST_TIMEOUT_MS;
      let persisted = false;
      while (Date.now() < deadline) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, AUTOSAVE_PERSIST_POLL_MS);
        });
        persisted = typeof lastAutosaveSavedAtRef.current === "number" &&
          lastAutosaveSavedAtRef.current >= queuedAt;
        if (persisted) break;
      }
      if (!persisted) return;
    }

    const requestParams = new URLSearchParams({ storefront: params.storefront, key });
    try {
      const response = await fetch(`/api/catalog/images?${requestParams.toString()}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        console.warn({
          scope: "catalog-image-delete",
          status: response.status,
          key,
        });
      }
    } catch {
      console.warn({
        scope: "catalog-image-delete",
        status: "network_error",
        key,
      });
    }
  }, [params.storefront]);
}

function useDropZoneDragHandlers(setDragOver: React.Dispatch<React.SetStateAction<boolean>>) {
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  }, [setDragOver]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, [setDragOver]);

  return { handleDragOver, handleDragLeave };
}

function buildRequiredRoleStatus(draft: CatalogProductDraftInput): RequiredRoleStatus[] {
  const requiredRoles = requiredImageRolesByCategory(draft.taxonomy.category);
  const existingRoles = new Set(
    (draft.imageRoles ?? "")
      .split("|")
      .map((value) => normalizeXaImageRole(value))
      .filter((value): value is XaImageRole => value !== undefined),
  );
  return requiredRoles.map((role) => ({
    role,
    isPresent: existingRoles.has(role),
  }));
}

function RoleSelector({
  selectedRole,
  onRoleChange,
  t,
}: {
  selectedRole: UploadImageRole;
  onRoleChange: (role: UploadImageRole) => void;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  return (
    <label className="block text-xs uppercase tracking-label text-gate-muted">
      {t("uploadImageRoleLabel")}
      <select
        value={selectedRole}
        onChange={(event) => onRoleChange(event.target.value as UploadImageRole)}
        className={SELECT_CLASS}
      >
        {IMAGE_ROLES.map((role) => (
          <option key={role} value={role}>
            {t(ROLE_I18N_KEYS[role] as Parameters<typeof t>[0])}
          </option>
        ))}
      </select>
    </label>
  );
}

function RequiredRolesChecklist({
  requiredRoleStatus,
  t,
}: {
  requiredRoleStatus: RequiredRoleStatus[];
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  return (
    <div className="rounded-md border border-gate-border bg-gate-surface px-3 py-2">
      <div className="text-2xs uppercase tracking-label text-gate-muted">
        {t("uploadRequiredRolesTitle")}
      </div>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool compact checklist layout */}
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {requiredRoleStatus.map(({ role, isPresent }) => (
          <li
            key={role}
            className={`rounded px-2 py-1 text-2xs ${
              isPresent
                ? "bg-success-bg text-success-fg"
                : "bg-gate-accent-soft text-gate-accent"
            }`}
          >
            {t(ROLE_I18N_KEYS[role] as Parameters<typeof t>[0])}
            {": "}
            {isPresent ? t("uploadRequiredRoleDone") : t("uploadRequiredRoleMissing")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageDropZone({
  canUpload,
  isUploading,
  dragOver,
  selectedRole,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
  t,
}: {
  canUpload: boolean;
  isUploading: boolean;
  dragOver: boolean;
  selectedRole: UploadImageRole;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  return (
    <button
      type="button"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => canUpload && fileInputRef.current?.click()}
      disabled={!canUpload}
      className={`flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-8 py-6 text-center transition-colors ${
        dragOver
          ? "border-gate-accent bg-gate-accent-soft"
          : "border-gate-border bg-gate-surface"
      } ${
        canUpload
          ? "cursor-pointer hover:border-gate-accent hover:bg-gate-accent-soft"
          : "cursor-not-allowed opacity-50"
      }`}
      // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
      data-testid="image-drop-zone"
    >
      <RoleIllustration role={selectedRole} />

      <span className="text-sm text-gate-muted">
        {isUploading
          ? t("uploadImageUploading")
          : dragOver
            ? t("uploadDropZoneActive")
            : t("uploadDropZone")}
      </span>

      <span className="text-2xs text-gate-accent">
        {t(ROLE_HINTS[selectedRole] as Parameters<typeof t>[0])}
      </span>

      <span className="text-2xs text-gate-muted">{t("imageGuidelines")}</span>

      <input
        ref={fileInputRef}
        type="file"
        // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 MIME type constraint, not user-visible copy
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileInput}
        disabled={!canUpload}
        className="sr-only"
      />
    </button>
  );
}

function ImageGallery({
  entries,
  previews,
  onRemove,
  onReorder,
  t,
}: {
  entries: ImageEntry[];
  previews: Map<string, string>;
  onRemove: (index: number) => void;
  onReorder: (index: number, direction: "up" | "down") => void;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs text-gate-muted">
        {t("uploadImageCount").replace("{count}", String(entries.length))}
      </div>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool thumbnail grid */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {entries.map((entry, index) => {
          const src = resolveImageSrc(entry.path, previews);
          return (
            <li
              key={`${entry.path}-${index}`}
              className="group relative overflow-hidden rounded-lg border border-gate-border bg-gate-surface"
            >
              {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool fixed aspect ratio */}
              <div className="relative aspect-[4/5] w-full bg-gate-bg">
                {src ? (
                  <ImageWithFallback
                    src={src}
                    alt={entry.role ? `${entry.role} view` : entry.filename}
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>

              <div className="flex items-center gap-1 px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-2xs text-gate-ink">{entry.filename}</span>
                {entry.role ? (
                  <span className="shrink-0 rounded bg-gate-accent-soft px-1 py-0.5 text-2xs text-gate-accent">
                    {entry.role}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onReorder(index, "up")}
                  disabled={index === 0}
                  className={`${BTN_SECONDARY_CLASS} inline-flex min-h-11 min-w-11 items-center justify-center`}
                  data-testid={`image-move-up-${index}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onReorder(index, "down")}
                  disabled={index === entries.length - 1}
                  className={`${BTN_SECONDARY_CLASS} inline-flex min-h-11 min-w-11 items-center justify-center`}
                  data-testid={`image-move-down-${index}`}
                >
                  ↓
                </button>
              </div>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1.5 me-1.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-gate-bg/80 px-2 py-1 text-2xs text-gate-muted opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-danger-fg"
                data-testid={`image-remove-${index}`}
              >
                {t("uploadImageRemove")}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function useImageUploadController({
  draft,
  storefront,
  selectedRole,
  hasSlug,
  imageEntries,
  autosaveStatus,
  lastAutosaveSavedAt,
  onChange,
  onImageUploaded,
  t,
}: {
  draft: CatalogProductDraftInput;
  storefront: XaCatalogStorefront;
  selectedRole: UploadImageRole;
  hasSlug: boolean;
  imageEntries: ImageEntry[];
  autosaveStatus: AutosaveStatus;
  lastAutosaveSavedAt: number | null;
  onChange: (next: CatalogProductDraftInput) => void;
  onImageUploaded: (nextDraft: CatalogProductDraftInput) => void;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState("");
  const [pendingAutosaveStartedAt, setPendingAutosaveStartedAt] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cleanupRemovedImage = usePersistedImageCleanup({
    lastAutosaveSavedAt,
    storefront,
  });
  const { handleDragOver, handleDragLeave } = useDropZoneDragHandlers(setDragOver);

  useEffect(() => {
    return () => {
      for (const url of previews.values()) {
        URL.revokeObjectURL(url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- XAUP-0001 cleanup on unmount only
  }, []);

  useEffect(() => {
    if (uploadStatus !== "persisting") return;
    if (!pendingAutosaveStartedAt) return;
    if (
      typeof lastAutosaveSavedAt === "number" &&
      lastAutosaveSavedAt >= pendingAutosaveStartedAt
    ) {
      setUploadStatus("persisted");
      setPendingAutosaveStartedAt(null);
    }
  }, [lastAutosaveSavedAt, pendingAutosaveStartedAt, uploadStatus]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setUploadStatus("error");
        setUploadError(t("uploadImageErrorType"));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadStatus("error");
        setUploadError(t("uploadImageErrorTooLarge"));
        return;
      }

      if (!hasSlug) {
        setUploadStatus("error");
        setUploadError(t("uploadImageErrorNoSlug"));
        return;
      }

      setUploadStatus("uploading");
      setUploadError("");

      const previewUrl = URL.createObjectURL(file);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const params = new URLSearchParams({
          storefront,
          slug: (draft.slug ?? "").trim(),
          role: selectedRole,
        });

        const response = await fetch(`/api/catalog/images?${params.toString()}`, {
          method: "POST",
          body: formData,
        });
        const json = (await response.json()) as {
          ok?: boolean;
          key?: string;
          error?: string;
        };

        if (!response.ok || !json.ok || !json.key) {
          URL.revokeObjectURL(previewUrl);
          setUploadStatus("error");
          const errorCode =
            typeof json.error === "string" && json.error.trim().length > 0
              ? json.error
              : response.status === 429
                ? "rate_limited"
                : undefined;
          const message =
            errorCode === "rate_limited"
              ? t("uploadImageErrorRateLimited")
              : getCatalogApiErrorMessage(errorCode, "uploadImageErrorFailed", t);
          setUploadError(message);
          return;
        }

        setPreviews((prev) => {
          const next = new Map(prev);
          next.set(json.key!, previewUrl);
          return next;
        });

        const nextDraft = appendImageDraftEntry(draft, json.key, selectedRole);
        notifyImageDraftChange(nextDraft, onChange, onImageUploaded);
        setPendingAutosaveStartedAt(Date.now());
        setUploadStatus("persisting");
      } catch {
        URL.revokeObjectURL(previewUrl);
        setPendingAutosaveStartedAt(null);
        setUploadStatus("error");
        setUploadError(t("uploadImageErrorFailed"));
      }
    },
    [draft, hasSlug, onChange, onImageUploaded, selectedRole, storefront, t],
  );
  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleUpload(file);
      }
      event.target.value = "";
    },
    [handleUpload],
  );
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
      if (file) {
        void handleUpload(file);
      }
    },
    [handleUpload],
  );
  const handleRemoveImage = useCallback(
    (index: number) => {
      const entry = imageEntries[index];
      const removedPath = entry?.path ?? "";
      if (entry) {
        const blobUrl = previews.get(entry.path);
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          setPreviews((prev) => {
            const next = new Map(prev);
            next.delete(entry.path);
            return next;
          });
        }
      }

      const nextDraft = {
        ...draft,
        imageFiles: removePipeEntry(draft.imageFiles ?? "", index),
        imageRoles: removePipeEntry(draft.imageRoles ?? "", index),
        imageAltTexts: removePipeEntry(draft.imageAltTexts ?? "", index),
      };
      const queuedAt = Date.now();
      notifyImageDraftChange(nextDraft, onChange, onImageUploaded);
      if (removedPath) {
        void cleanupRemovedImage(removedPath, queuedAt);
      }
    },
    [cleanupRemovedImage, draft, imageEntries, onChange, onImageUploaded, previews],
  );
  const handleReorderImage = useCallback(
    (index: number, direction: "up" | "down") => {
      const nextDraft = reorderImageDraft(draft, index, direction);
      notifyImageDraftChange(nextDraft, onChange, onImageUploaded);
    },
    [draft, onChange, onImageUploaded],
  );
  return {
    fileInputRef,
    previews,
    dragOver,
    uploadStatus,
    uploadError,
    autosaveStatus,
    canUpload: hasSlug && uploadStatus !== "uploading",
    isUploading: uploadStatus === "uploading",
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleRemoveImage,
    handleReorderImage,
  };
}

export function CatalogProductImagesFields({
  draft,
  storefront,
  fieldErrors,
  autosaveInlineMessage,
  autosaveStatus,
  lastAutosaveSavedAt,
  onChange,
  onImageUploaded,
}: {
  draft: CatalogProductDraftInput;
  storefront: XaCatalogStorefront;
  fieldErrors: Record<string, string>;
  autosaveInlineMessage: string | null;
  autosaveStatus: AutosaveStatus;
  lastAutosaveSavedAt: number | null;
  onChange: (next: CatalogProductDraftInput) => void;
  onImageUploaded: (nextDraft: CatalogProductDraftInput) => void;
}) {
  const { t } = useUploaderI18n();
  const [selectedRole, setSelectedRole] = useState<UploadImageRole>("front");

  const hasSlug = (draft.slug ?? "").trim().length > 0;
  const imageEntries = useMemo(
    () => parseImageEntries(draft.imageFiles ?? "", draft.imageRoles ?? ""),
    [draft.imageFiles, draft.imageRoles],
  );
  const requiredRoleStatus = useMemo(() => buildRequiredRoleStatus(draft), [draft]);

  const {
    fileInputRef,
    previews,
    dragOver,
    uploadStatus,
    uploadError,
    autosaveStatus: uploadAutosaveStatus,
    canUpload,
    isUploading,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleRemoveImage,
    handleReorderImage,
  } = useImageUploadController({
    draft,
    storefront,
    selectedRole,
    hasSlug,
    imageEntries,
    autosaveStatus,
    lastAutosaveSavedAt,
    onChange,
    onImageUploaded,
    t,
  });

  return (
    <div className="mt-8 w-full space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">{t("imagesFieldsTitle")}</div>

      <RoleSelector selectedRole={selectedRole} onRoleChange={setSelectedRole} t={t} />
      <RequiredRolesChecklist requiredRoleStatus={requiredRoleStatus} t={t} />

      <ImageDropZone
        canUpload={canUpload}
        isUploading={isUploading}
        dragOver={dragOver}
        selectedRole={selectedRole}
        fileInputRef={fileInputRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileInput={handleFileInput}
        t={t}
      />

      {!hasSlug ? <div className="text-xs text-gate-muted">{t("uploadImageErrorNoSlug")}</div> : null}
      {uploadStatus === "persisting" ? (
        <div className="text-xs text-gate-accent">
          {uploadAutosaveStatus === "saving"
            ? t("uploadImagePersisting")
            : t("uploadImagePersistPending")}
        </div>
      ) : null}
      {uploadStatus === "persisted" ? (
        <div className="text-xs text-success-fg">{t("uploadImagePersisted")}</div>
      ) : null}
      {uploadStatus === "error" && uploadError ? (
        <div className="text-xs text-danger-fg">{uploadError}</div>
      ) : null}
      {autosaveInlineMessage ? (
        <div className="text-xs text-danger-fg">{autosaveInlineMessage}</div>
      ) : null}
      {fieldErrors.imageFiles ? <div className="text-xs text-danger-fg">{fieldErrors.imageFiles}</div> : null}
      {fieldErrors.imageRoles ? <div className="text-xs text-danger-fg">{fieldErrors.imageRoles}</div> : null}

      <ImageGallery
        entries={imageEntries}
        previews={previews}
        onRemove={handleRemoveImage}
        onReorder={handleReorderImage}
        t={t}
      />
    </div>
  );
}
