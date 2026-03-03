"use client";

import { useState } from "react";

import { toPositiveInt } from "@acme/lib";
import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { BTN_PRIMARY_CLASS, INPUT_CLASS, SELECT_CLASS } from "./catalogStyles";

const IMAGE_ROLES = ["front", "side", "top", "detail", "lifestyle", "packaging"] as const;
type UploadImageRole = (typeof IMAGE_ROLES)[number];

const ROLE_I18N_KEYS: Record<UploadImageRole, string> = {
  front: "uploadImageRoleFront",
  side: "uploadImageRoleSide",
  top: "uploadImageRoleTop",
  detail: "uploadImageRoleDetail",
  lifestyle: "uploadImageRoleLifestyle",
  packaging: "uploadImageRolePackaging",
} as const;

type UploadStatus = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 8_388_608; // 8 MB

export function CatalogProductImagesFields({
  draft,
  fieldErrors,
  onChange,
}: {
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  onChange: (next: CatalogProductDraftInput) => void;
}) {
  const { t } = useUploaderI18n();
  const minEdge = toPositiveInt(
    process.env.NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE ?? 1600,
    1600,
    1,
  );

  const [selectedRole, setSelectedRole] = useState<UploadImageRole>("front");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string>("");

  const slug = (draft.slug ?? "").trim();
  const hasSlug = slug.length > 0;
  const storefront = "xa-b";

  async function handleUpload(file: File) {
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

    try {
      const formData = new FormData();
      formData.append("file", file);

      const params = new URLSearchParams({
        storefront,
        slug,
        role: selectedRole,
      });

      const response = await fetch(`/api/catalog/images?${params.toString()}`, {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as { ok?: boolean; key?: string; error?: string };

      if (!response.ok || !json.ok || !json.key) {
        setUploadStatus("error");
        setUploadError(json.error ?? t("uploadImageErrorFailed"));
        return;
      }

      // Append to pipe-delimited fields
      const currentFiles = (draft.imageFiles ?? "").trim();
      const currentRoles = (draft.imageRoles ?? "").trim();
      const currentAlts = (draft.imageAltTexts ?? "").trim();

      const nextFiles = currentFiles ? `${currentFiles}|${json.key}` : json.key;
      const nextRoles = currentRoles ? `${currentRoles}|${selectedRole}` : selectedRole;
      const altText = `${selectedRole} view`;
      const nextAlts = currentAlts ? `${currentAlts}|${altText}` : altText;

      onChange({
        ...draft,
        imageFiles: nextFiles,
        imageRoles: nextRoles,
        imageAltTexts: nextAlts,
      });

      setUploadStatus("success");
    } catch {
      setUploadStatus("error");
      setUploadError(t("uploadImageErrorFailed"));
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void handleUpload(file);
    }
    // Reset the input so the same file can be re-selected
    event.target.value = "";
  }

  return (
    // eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool constrained form
    <div className="mx-auto mt-8 max-w-prose space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">
        {t("imagesFieldsTitle")}
      </div>
      <div className="text-sm text-gate-muted">{t("imageGuidelines", { minEdge })}</div>

      {/* ── Upload section ── */}
      <div className="rounded-md border border-border-2 bg-gate-surface p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs uppercase tracking-label text-gate-muted">
            {t("uploadImageRoleLabel")}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UploadImageRole)}
              className={SELECT_CLASS}
            >
              {IMAGE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(ROLE_I18N_KEYS[role] as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col justify-end">
            <label
              className={`${BTN_PRIMARY_CLASS} inline-flex cursor-pointer items-center justify-center text-center ${
                !hasSlug || uploadStatus === "uploading"
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              {uploadStatus === "uploading" ? t("uploadImageUploading") : t("uploadImageLabel")}
              <input
                type="file"
                // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 MIME type constraint, not user-visible copy
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={!hasSlug || uploadStatus === "uploading"}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {!hasSlug ? (
          <div className="text-xs text-gate-muted">{t("uploadImageErrorNoSlug")}</div>
        ) : null}

        {uploadStatus === "success" ? (
          <div className="text-xs text-success-fg">{t("uploadImageSuccess")}</div>
        ) : null}

        {uploadStatus === "error" && uploadError ? (
          <div className="text-xs text-danger-fg">{uploadError}</div>
        ) : null}
      </div>

      {/* ── Manual entry textareas ── */}
      <div className="grid gap-4">
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("imageFiles")}
          <textarea
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-field-image-files"
            value={draft.imageFiles ?? ""}
            onChange={(event) => onChange({ ...draft, imageFiles: event.target.value })}
            rows={3}
            className={INPUT_CLASS}
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 operator-tool format hint
            placeholder="images/my-product/*.jpg"
          />
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("imageRoles")}
          <textarea
            value={draft.imageRoles ?? ""}
            onChange={(event) => onChange({ ...draft, imageRoles: event.target.value })}
            rows={2}
            className={INPUT_CLASS}
            placeholder={t("placeholderImageRoles")}
          />
          {fieldErrors.imageRoles ? (
            <div className="mt-1 text-xs text-danger-fg">{fieldErrors.imageRoles}</div>
          ) : null}
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("imageAltTexts")}
          <textarea
            value={draft.imageAltTexts ?? ""}
            onChange={(event) => onChange({ ...draft, imageAltTexts: event.target.value })}
            rows={2}
            className={INPUT_CLASS}
            placeholder={t("placeholderImageAltTexts")}
          />
          {fieldErrors.imageAltTexts ? (
            <div className="mt-1 text-xs text-danger-fg">{fieldErrors.imageAltTexts}</div>
          ) : null}
        </label>
      </div>
    </div>
  );
}
