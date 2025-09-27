"use client";
import type { ReactElement, RefObject } from "react";
import { useState } from "react";
import { Button } from "../atoms/shadcn";
import { Alert } from "../atoms";
import { cn } from "../../utils/style";
import type { ImageOrientation } from "@acme/types";
// i18n-exempt — UI utility component; copy is minimal and non-user-specific
/* i18n-exempt */
const t = (s: string) => s;
/* i18n-exempt */
const ACCEPT = "image/*,video/*";

export interface UploadProgress {
  done: number;
  total: number;
}

export interface UploaderSurfaceProps {
  inputRef: RefObject<HTMLInputElement | null>;
  pendingFile: File | null;
  progress: UploadProgress | null;
  error?: string;
  isValid: boolean | null;
  isVideo: boolean;
  requiredOrientation: ImageOrientation;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openFileDialog: () => void;
}

export function UploaderSurface(props: UploaderSurfaceProps): ReactElement {
  const {
    inputRef,
    pendingFile,
    progress,
    error,
    isValid,
    isVideo,
    requiredOrientation,
    onDrop,
    onFileChange,
    openFileDialog,
  } = props;

  const [dragActive, setDragActive] = useState(false);
  const feedbackId = "uploader-feedback";

  return (
    <div
      tabIndex={0}
      role="button"
      /* i18n-exempt */
      aria-label={t("Drop image or video here or press Enter to browse")}
      aria-describedby={feedbackId}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        setDragActive(false);
        onDrop(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openFileDialog();
        }
      }}
      className={cn(
        "rounded border-2 border-dashed p-4 text-center", // i18n-exempt: class names
        dragActive && "ring-2 ring-primary/60 bg-primary/5" // i18n-exempt: class names
      )}
    >
      <input
        ref={inputRef}
        type="file"
        /* i18n-exempt */
        accept={ACCEPT}
        className="hidden"
        onChange={onFileChange}
      />

      {/* i18n-exempt */}
      <p className="mb-2">{t("Drag & drop or")}</p>
      <Button type="button" onClick={openFileDialog} className="h-auto px-3 py-1 text-sm">
        {/* i18n-exempt */}
        {t("Browse…")}
      </Button>

      <div id={feedbackId} role="status" aria-live="polite">
        {pendingFile && (
          <p className="text-muted-foreground mt-2 text-sm">{pendingFile.name}</p>
        )}

        {progress && (
          <p className="mt-2 text-sm">{t("Uploading…")} {progress.done}/{progress.total}</p>
        )}

        {error && (
          <Alert variant="danger" tone="soft" title={error} className="mt-2" />
        )}
        {isValid === false && !isVideo && (
          // i18n-exempt — transient validation hint in editor-only surface
          /* i18n-exempt */
          <Alert
            variant="warning"
            tone="soft"
            title={t(`Wrong orientation (needs ${requiredOrientation})`)}
            className="mt-2"
          />
        )}
      </div>
    </div>
  );
}

export default UploaderSurface;
