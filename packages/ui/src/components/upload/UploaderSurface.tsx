"use client";
import type { ReactElement, RefObject } from "react";
import { useState } from "react";
import { Button } from "../atoms/shadcn";
import { Alert } from "../atoms";
import { cn } from "../../utils/style";
import type { ImageOrientation } from "@acme/types";

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
      aria-label="Drop image or video here or press Enter to browse"
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
        "rounded border-2 border-dashed p-4 text-center",
        dragActive && "ring-2 ring-primary/60 bg-primary/5"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onFileChange}
      />

      <p className="mb-2">Drag &amp; drop or</p>
      <Button type="button" onClick={openFileDialog} className="h-auto px-3 py-1 text-sm">
        Browse…
      </Button>

      <div id={feedbackId} role="status" aria-live="polite">
        {pendingFile && (
          <p className="text-muted-foreground mt-2 text-sm">{pendingFile.name}</p>
        )}

        {progress && (
          <p className="mt-2 text-sm">Uploading… {progress.done}/{progress.total}</p>
        )}

        {error && (
          <Alert variant="danger" tone="soft" title={error} className="mt-2" />
        )}
        {isValid === false && !isVideo && (
          <Alert variant="warning" tone="soft" title={`Wrong orientation (needs ${requiredOrientation})`} className="mt-2" />
        )}
      </div>
    </div>
  );
}

export default UploaderSurface;
