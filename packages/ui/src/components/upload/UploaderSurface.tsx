"use client"; // i18n-exempt -- DEV-000: Next.js directive, not user-facing
import type { ReactElement, RefObject } from "react";
import { useRef, useState } from "react";
import { Button } from "../atoms/shadcn";
import { Alert } from "../atoms";
import { cn } from "../../utils/style";
import type { ImageOrientation } from "@acme/types";
import { useTranslations } from "@acme/i18n";
// i18n-exempt -- DEV-000: file input accept types
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
  const suppressClickFromKeyboardRef = useRef(false);
  const feedbackId = "uploader-feedback"; // i18n-exempt -- DEV-000: element id
  // i18n-exempt -- DEV-000: ARIA role values
  const ROLE_STATUS = "status" as React.AriaRole;
  // i18n-exempt -- DEV-000: ARIA live region politeness
  const ARIA_LIVE_POLITE = "polite" as React.AriaAttributes["aria-live"];
  // i18n-exempt -- DEV-000: class names
  const BUTTON_CLASS = "h-auto px-3 py-1 text-sm";
  // i18n-exempt -- DEV-000: class names
  const PENDING_FILE_CLASS = "text-muted-foreground mt-2 text-sm";
  // i18n-exempt -- DEV-000: class names
  const PROGRESS_P_CLASS = "mt-2 text-sm";
  // i18n-exempt -- DEV-000: class names
  const ALERT_MARGIN_CLASS = "mt-2";
  const t = useTranslations();

  return (
    <div
      tabIndex={0}
      role="button"
      // i18n-exempt -- DEV-000: aria is translated dynamically
      aria-label={t("upload.dropHelp") as string}
      aria-describedby={feedbackId}
      onClick={() => {
        if (suppressClickFromKeyboardRef.current) {
          suppressClickFromKeyboardRef.current = false;
          return;
        }
        openFileDialog();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        setDragActive(false);
        onDrop(e);
      }}
      onKeyDown={(e) => {
        // For accessibility we need to invoke the dialog when the surface is
        // activated via keyboard. Divs with role="button" do not receive this
        // behavior automatically, so handle Space *and* Enter here while
        // preventing the default scrolling/submit semantics for those keys.
        const key = e.key;
        if (key === "Enter" || key === " " || key === "Spacebar" || key === "Space") {
          suppressClickFromKeyboardRef.current = true;
          e.preventDefault();
          openFileDialog();
          setTimeout(() => {
            suppressClickFromKeyboardRef.current = false;
          }, 0);
        }
      }}
      className={cn(
        "rounded border-2 border-dashed p-4 text-center", // i18n-exempt -- DEV-000: class names
        dragActive && "ring-2 ring-primary/60 bg-primary/5" // i18n-exempt -- DEV-000: class names
      )}
    >
      <input
        ref={inputRef}
        type="file"
        // i18n-exempt -- DEV-000: attribute not user-facing
        accept={ACCEPT}
        // i18n-exempt -- DEV-000: hint camera capture on mobile devices
        capture="environment"
        className="hidden" // i18n-exempt -- DEV-000: class names
        onChange={onFileChange}
      />

      <p className="mb-2">{t("upload.dragDropOr")}</p>
      {/* i18n-exempt -- DEV-000: class names */}
      <Button type="button" onClick={openFileDialog} className={BUTTON_CLASS}>
        {t("upload.browse")}
      </Button>

      <div id={feedbackId} role={ROLE_STATUS} aria-live={ARIA_LIVE_POLITE}>
        {pendingFile && (
          <p className={PENDING_FILE_CLASS}>{pendingFile.name}</p>
        )}

        {progress && (
          <p className={PROGRESS_P_CLASS}>{t("upload.uploading")} {progress.done}/{progress.total}</p>
        )}

        {error && (
          /* i18n-exempt -- DEV-000: class names */
          <Alert variant="danger" tone="soft" heading={error} className={ALERT_MARGIN_CLASS} />
        )}
        {isValid === false && !isVideo && (
          <Alert
            variant="warning"
            tone="soft"
            heading={t("upload.orientationWrong", { required: requiredOrientation }) as string}
            className={ALERT_MARGIN_CLASS}
          />
        )}
      </div>
    </div>
  );
}

export default UploaderSurface;
