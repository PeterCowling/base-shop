"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";

import {
  type CatalogProductDraftInput,
  splitList,
} from "@acme/lib/xa/catalogAdminSchema";

import type { XaCatalogStorefront } from "../../lib/catalogStorefront.types";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { getCatalogApiErrorMessage } from "./catalogConsoleFeedback";
import { BTN_SECONDARY_CLASS } from "./catalogStyles";

type AutosaveStatus = "saving" | "saved" | "unsaved";
type UploadStatus = "idle" | "uploading" | "persisting" | "persisted" | "error";
type ImageEntry = { path: string; filename: string; isMain: boolean };

const MAX_FILE_SIZE = 8_388_608; // 8 MB
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AUTOSAVE_PERSIST_TIMEOUT_MS = 20_000;
const AUTOSAVE_PERSIST_POLL_MS = 120;

function UploadIllustration() {
  return (
    <svg
      className="size-16 text-gate-muted/50"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="10" y="16" width="44" height="32" rx="4" />
      <path d="m18 40 10-10 8 8 6-6 8 8" />
      <circle cx="24" cy="24" r="3" />
      <path d="M32 8v8" />
      <path d="m28 12 4 4 4-4" />
    </svg>
  );
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

function splitPipeEntries(pipeStr: string): string[] {
  return splitList(pipeStr);
}

function parseImageEntries(files: string): ImageEntry[] {
  return splitPipeEntries(files).map((path, index) => ({
    path,
    filename: path.split("/").pop() ?? path,
    isMain: index === 0,
  }));
}

function removePipeEntry(pipeStr: string, index: number): string {
  return splitPipeEntries(pipeStr)
    .filter((_, itemIndex) => itemIndex !== index)
    .join("|");
}

export function reorderPipeEntry(pipeStr: string, fromIndex: number, direction: "up" | "down"): string {
  const parts = splitPipeEntries(pipeStr);
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (toIndex < 0 || toIndex >= parts.length || fromIndex < 0 || fromIndex >= parts.length) {
    return parts.join("|");
  }
  const next = [...parts];
  [next[fromIndex], next[toIndex]] = [next[toIndex]!, next[fromIndex]!];
  return next.join("|");
}

function movePipeEntryToFront(pipeStr: string, index: number): string {
  const parts = splitPipeEntries(pipeStr);
  if (index <= 0 || index >= parts.length) {
    return parts.join("|");
  }
  const next = [...parts];
  const [selected] = next.splice(index, 1);
  if (!selected) {
    return parts.join("|");
  }
  next.unshift(selected);
  return next.join("|");
}

function resolveImageSrc(entryPath: string, previews: Map<string, string>): string | undefined {
  const blob = previews.get(entryPath);
  if (blob) return blob;

  const normalized = entryPath.trim();
  if (!normalized) return undefined;
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }
  return `/${normalized}`;
}

function buildDefaultImageAltText(draft: CatalogProductDraftInput, imageIndex: number): string {
  const baseTitle = (draft.title ?? "").trim() || "Product";
  if (imageIndex === 0) return `${baseTitle} main image`;
  return `${baseTitle} photo ${imageIndex + 1}`;
}

function appendImageDraftEntry(
  draft: CatalogProductDraftInput,
  imageKey: string,
): CatalogProductDraftInput {
  const currentFiles = splitPipeEntries(draft.imageFiles ?? "");
  const currentAlts = splitPipeEntries(draft.imageAltTexts ?? "");
  const nextIndex = currentFiles.length;

  return {
    ...draft,
    imageFiles: [...currentFiles, imageKey].join("|"),
    imageAltTexts: [...currentAlts, buildDefaultImageAltText(draft, nextIndex)].join("|"),
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
    imageAltTexts: reorderPipeEntry(draft.imageAltTexts ?? "", index, direction),
  };
}

function promoteImageDraftToMain(
  draft: CatalogProductDraftInput,
  index: number,
): CatalogProductDraftInput {
  return {
    ...draft,
    imageFiles: movePipeEntryToFront(draft.imageFiles ?? "", index),
    imageAltTexts: movePipeEntryToFront(draft.imageAltTexts ?? "", index),
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

function useDropZoneDragHandlers(setDragOver: Dispatch<SetStateAction<boolean>>) {
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }, [setDragOver]);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, [setDragOver]);

  return { handleDragOver, handleDragLeave };
}

export function ImageDropZone({
  canUpload,
  isUploading,
  dragOver,
  hasImages,
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
  hasImages: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  const primaryCopy = isUploading
    ? t("uploadImageUploading")
    : dragOver
      ? t("uploadDropZoneActive")
      : hasImages
        ? t("uploadAddPhoto")
        : t("uploadAddMainImage");

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
      <UploadIllustration />

      <span className="text-sm text-gate-muted">{primaryCopy}</span>
      <span className="text-2xs text-gate-accent">
        {hasImages ? t("uploadAdditionalPhotosHint") : t("uploadMainImageHint")}
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

function ImageCard({
  entry,
  badge,
  alt,
  onRemove,
  removeTestId,
  removeLabel,
  makeMainButton,
  reorderButtons,
  itemTestId,
}: {
  entry: ImageEntry | undefined;
  badge: string;
  alt: string;
  onRemove?: () => void;
  removeTestId?: string;
  removeLabel?: string;
  makeMainButton?: ReactNode;
  reorderButtons?: ReactNode;
  itemTestId?: string;
}) {
  const src = entry ? resolveImageSrc(entry.path, new Map<string, string>()) : undefined;

  return (
    <li
      className="group relative overflow-hidden rounded-lg border border-gate-border bg-gate-surface"
      data-testid={itemTestId}
    >
      {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool fixed aspect ratio */}
      <div className="relative aspect-[4/5] w-full bg-gate-bg">
        {src ? (
          <ImageWithFallback
            src={src}
            alt={alt}
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      <div className="space-y-2 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-2xs text-gate-ink">
            {entry?.filename ?? alt}
          </span>
          {entry ? (
            <span className="shrink-0 rounded bg-gate-accent-soft px-1 py-0.5 text-2xs text-gate-accent">
              {badge}
            </span>
          ) : null}
        </div>
        {entry ? (
          // eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool image card controls row
          <div className="flex flex-wrap items-center gap-1">
            {makeMainButton}
            {reorderButtons}
            {onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className={`${BTN_SECONDARY_CLASS} px-3 text-2xs text-danger-fg hover:text-danger-fg`}
                data-testid={removeTestId}
              >
                {removeLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function ImageGallery({
  entries,
  previews,
  onRemove,
  onMakeMain,
  onReorder,
  t,
}: {
  entries: ImageEntry[];
  previews: Map<string, string>;
  onRemove: (index: number) => void;
  onMakeMain: (index: number) => void;
  onReorder: (index: number, direction: "up" | "down") => void;
  t: ReturnType<typeof useUploaderI18n>["t"];
}) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gate-muted">
          {t("uploadImageCount", { count: entries.length })}
        </div>
      <div className="text-2xs text-gate-muted">{t("uploadImageOrderHelp")}</div>
      </div>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool thumbnail grid */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {entries.map((entry, index) => {
          const src = resolveImageSrc(entry.path, previews);
          const badge = entry.isMain
            ? t("uploadImagePrimaryBadge")
            : t("uploadImageAdditionalBadge", { count: index });
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
                    alt={badge}
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>

              <div className="space-y-2 px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-2xs text-gate-ink">{entry.filename}</span>
                  <span className="shrink-0 rounded bg-gate-accent-soft px-1 py-0.5 text-2xs text-gate-accent">
                    {badge}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {!entry.isMain ? (
                    <button
                      type="button"
                      onClick={() => onMakeMain(index)}
                      className={`${BTN_SECONDARY_CLASS} px-3 text-2xs`}
                      data-testid={`image-make-main-${index}`}
                    >
                      {t("uploadImageMakeMain")}
                    </button>
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
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className={`${BTN_SECONDARY_CLASS} px-3 text-2xs text-danger-fg hover:text-danger-fg`}
                    data-testid={`image-remove-${index}`}
                  >
                    {t("uploadImageRemove")}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MainImagePanel({
  entry,
  pendingPreviewUrl,
  onRemove,
  onChangeClick,
}: {
  entry: ReturnType<typeof parseImageEntries>[number] | undefined;
  pendingPreviewUrl?: string | null;
  onRemove: (index: number) => void;
  onChangeClick?: () => void;
}) {
  const { t } = useUploaderI18n();
  const badge = t("uploadImagePrimaryBadge");
  const pendingBadge = t("uploadImagePendingBadge");

  // Synthesize a display entry from the pending blob URL when no real entry exists yet
  const pendingEntry = !entry && pendingPreviewUrl
    ? { path: pendingPreviewUrl, filename: t("uploadImagePendingBadge"), isMain: false }
    : undefined;
  const displayEntry = entry ?? pendingEntry;
  const displayBadge = entry ? badge : pendingBadge;

  if (!displayEntry) return null;

  return (
    <div
      className="space-y-2"
      // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test selector, not user-visible copy
      data-cy="main-image-panel"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gate-muted">{t("uploadImageCount", { count: displayEntry ? 1 : 0 })}</div>
      </div>
      {/* eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool single-image display constrained width */}
      <ul className="grid grid-cols-1 gap-3 sm:max-w-xs">
        <ImageCard
          entry={displayEntry}
          badge={displayBadge}
          alt={t("uploadAddMainImage")}
          onRemove={entry ? () => onRemove(0) : undefined}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test selector, not user-visible copy
          removeTestId="image-remove-0"
          removeLabel={t("uploadImageRemove")}
          makeMainButton={onChangeClick ? (
            <button
              type="button"
              onClick={onChangeClick}
              className={`${BTN_SECONDARY_CLASS} px-3 text-2xs`}
              // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test selector, not user-visible copy
              data-testid="image-change-0"
            >
              {t("uploadImageChange")}
            </button>
          ) : undefined}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test selector, not user-visible copy
          itemTestId="main-image-card"
        />
      </ul>
    </div>
  );
}

export function AdditionalImagesPanel({
  entries,
  onRemove,
  onMakeMain,
  onReorder,
}: {
  entries: ReturnType<typeof parseImageEntries>;
  onRemove: (index: number) => void;
  onMakeMain: (index: number) => void;
  onReorder: (index: number, direction: "up" | "down") => void;
}) {
  const { t } = useUploaderI18n();

  if (entries.length === 0) return null;

  return (
    <div
      className="space-y-2"
      // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test selector, not user-visible copy
      data-cy="additional-images-panel"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gate-muted">
          {t("uploadImageCount", { count: entries.length })}
        </div>
        <div className="text-2xs text-gate-muted">{t("uploadImageOrderHelp")}</div>
      </div>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool thumbnail grid */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {entries.map((entry, sliceIndex) => {
          const globalIndex = sliceIndex + 1;
          const badge = t("uploadImageAdditionalBadge", { count: globalIndex });

          return (
            <ImageCard
              key={`${entry.path}-${globalIndex}`}
              entry={entry}
              badge={badge}
              alt={badge}
              itemTestId={`additional-image-global-${globalIndex}`}
              removeLabel={t("uploadImageRemove")}
              makeMainButton={(
                <button
                  type="button"
                  onClick={() => onMakeMain(globalIndex)}
                  className={`${BTN_SECONDARY_CLASS} px-3 text-2xs`}
                  data-testid={`image-make-main-${globalIndex}`}
                >
                  {t("uploadImageMakeMain")}
                </button>
              )}
              reorderButtons={(
                <>
                  <button
                    type="button"
                    onClick={() => onReorder(globalIndex, "up")}
                    className={`${BTN_SECONDARY_CLASS} inline-flex min-h-11 min-w-11 items-center justify-center`}
                    data-testid={`image-move-up-${globalIndex}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorder(globalIndex, "down")}
                    disabled={sliceIndex === entries.length - 1}
                    className={`${BTN_SECONDARY_CLASS} inline-flex min-h-11 min-w-11 items-center justify-center`}
                    data-testid={`image-move-down-${globalIndex}`}
                  >
                    ↓
                  </button>
                </>
              )}
              onRemove={() => onRemove(globalIndex)}
              removeTestId={`image-remove-${globalIndex}`}
            />
          );
        })}
      </ul>
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function -- XAUP-0001 image upload state machine; extracting would fragment tightly coupled reactive state
export function useImageUploadController({
  draft,
  storefront,
  hasSlug,
  imageEntries,
  lastAutosaveSavedAt,
  onChange,
  onImageUploaded,
  t,
}: {
  draft: CatalogProductDraftInput;
  storefront: XaCatalogStorefront;
  hasSlug: boolean;
  imageEntries: ImageEntry[];
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
  const [pendingPreview, setPendingPreview] = useState<{ file: File; previewUrl: string } | null>(null);
  const pendingPreviewRef = useRef<{ file: File; previewUrl: string } | null>(null);
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

  // Keep ref in sync for auto-upload effect below
  useEffect(() => {
    pendingPreviewRef.current = pendingPreview;
  }, [pendingPreview]);

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
        const previewUrl = URL.createObjectURL(file);
        setPendingPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev.previewUrl);
          return { file, previewUrl };
        });
        setUploadStatus("idle");
        setUploadError("");
        return;
      }

      // Clear any pending preview before uploading (slug now available)
      setPendingPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });

      setUploadStatus("uploading");
      setUploadError("");

      const previewUrl = URL.createObjectURL(file);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const params = new URLSearchParams({
          storefront,
          slug: (draft.slug ?? "").trim(),
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

        const nextDraft = appendImageDraftEntry(draft, json.key);
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
    [draft, hasSlug, onChange, onImageUploaded, storefront, t],
  );
  // Auto-upload buffered file when slug becomes available
  const handleUploadRef = useRef(handleUpload);
  useEffect(() => { handleUploadRef.current = handleUpload; }, [handleUpload]);
  useEffect(() => {
    if (!hasSlug || !pendingPreviewRef.current) return;
    const { file } = pendingPreviewRef.current;
    setPendingPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    void handleUploadRef.current(file);
  }, [hasSlug]);

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleUpload(file);
      }
      event.target.value = "";
    },
    [handleUpload],
  );
  const handleDrop = useCallback(
    (event: DragEvent) => {
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
  const handleMakeMainImage = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const nextDraft = promoteImageDraftToMain(draft, index);
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
    pendingPreviewUrl: pendingPreview?.previewUrl ?? null,
    canUpload: uploadStatus !== "uploading",
    isUploading: uploadStatus === "uploading",
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleRemoveImage,
    handleMakeMainImage,
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

  const hasSlug = (draft.slug ?? "").trim().length > 0;
  const imageEntries = useMemo(
    () => parseImageEntries(draft.imageFiles ?? ""),
    [draft.imageFiles],
  );

  const {
    fileInputRef,
    previews,
    dragOver,
    uploadStatus,
    uploadError,
    canUpload,
    isUploading,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleRemoveImage,
    handleMakeMainImage,
    handleReorderImage,
  } = useImageUploadController({
    draft,
    storefront,
    hasSlug,
    imageEntries,
    lastAutosaveSavedAt,
    onChange,
    onImageUploaded,
    t,
  });

  return (
    <div className="mt-8 w-full space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">{t("imagesFieldsTitle")}</div>

      <ImageDropZone
        canUpload={canUpload}
        isUploading={isUploading}
        dragOver={dragOver}
        hasImages={imageEntries.length > 0}
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
          {autosaveStatus === "saving"
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

        <ImageGallery
          entries={imageEntries}
          previews={previews}
          onRemove={handleRemoveImage}
          onMakeMain={handleMakeMainImage}
          onReorder={handleReorderImage}
          t={t}
        />
    </div>
  );
}
