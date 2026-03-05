import { describe, expect, it } from "@jest/globals";

import { getUploaderMessage, type UploaderMessageKey } from "../../../lib/uploaderI18n";
import { getCatalogApiErrorMessage } from "../catalogConsoleFeedback";

function translate(
  key: UploaderMessageKey,
  vars?: Record<string, string | number | boolean | null | undefined>,
) {
  let message = getUploaderMessage("en", key);
  if (!vars) return message;
  for (const [varName, value] of Object.entries(vars)) {
    message = message.replaceAll(`{${varName}}`, String(value ?? ""));
  }
  return message;
}

describe("catalog console feedback helpers", () => {
  it("maps rate-limited API errors to localized actionable copy", () => {
    expect(getCatalogApiErrorMessage("rate_limited", "saveFailed", translate)).toContain(
      "Too many requests",
    );
  });

  it("maps payload-too-large API errors to localized actionable copy", () => {
    expect(getCatalogApiErrorMessage("payload_too_large", "saveFailed", translate)).toContain(
      "payload is too large",
    );
  });

  it("maps storage-busy API errors to actionable copy", () => {
    expect(getCatalogApiErrorMessage("storage_busy", "saveFailed", translate)).toContain(
      "in use by another app",
    );
  });

  it("maps upload-specific machine codes to image guidance copy", () => {
    expect(getCatalogApiErrorMessage("invalid_file_type", "uploadImageErrorFailed", translate)).toBe(
      "Only JPG, PNG, and WebP files are accepted.",
    );
    expect(getCatalogApiErrorMessage("file_too_large", "uploadImageErrorFailed", translate)).toBe(
      "File exceeds 8 MB limit.",
    );
    expect(getCatalogApiErrorMessage("r2_unavailable", "uploadImageErrorFailed", translate)).toContain(
      "storage is unavailable",
    );
  });
});
