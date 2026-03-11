import { describe, expect, it, jest } from "@jest/globals";

import { getUploaderMessage, type UploaderMessageKey } from "../../../lib/uploaderI18n";
import {
  endBusyAction,
  getCatalogApiErrorMessage,
  tryBeginBusyAction,
} from "../catalogConsoleFeedback";

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

// ---------------------------------------------------------------------------
// tryBeginBusyAction / endBusyAction — suppressUiBusy option
// ---------------------------------------------------------------------------
describe("tryBeginBusyAction / endBusyAction — suppressUiBusy", () => {
  it("default: acquires lock and calls setBusy(true)", () => {
    const busyLockRef = { current: false };
    const setBusy = jest.fn();
    const result = tryBeginBusyAction(busyLockRef, setBusy);
    expect(result).toBe(true);
    expect(busyLockRef.current).toBe(true);
    expect(setBusy).toHaveBeenCalledWith(true);
  });

  it("default: endBusyAction releases lock and calls setBusy(false)", () => {
    const busyLockRef = { current: true };
    const setBusy = jest.fn();
    endBusyAction(busyLockRef, setBusy);
    expect(busyLockRef.current).toBe(false);
    expect(setBusy).toHaveBeenCalledWith(false);
  });

  it("suppressUiBusy: acquires lock but does NOT call setBusy", () => {
    const busyLockRef = { current: false };
    const setBusy = jest.fn();
    const result = tryBeginBusyAction(busyLockRef, setBusy, { suppressUiBusy: true });
    expect(result).toBe(true);
    expect(busyLockRef.current).toBe(true);
    expect(setBusy).not.toHaveBeenCalled();
  });

  it("suppressUiBusy: endBusyAction releases lock but does NOT call setBusy", () => {
    const busyLockRef = { current: true };
    const setBusy = jest.fn();
    endBusyAction(busyLockRef, setBusy, { suppressUiBusy: true });
    expect(busyLockRef.current).toBe(false);
    expect(setBusy).not.toHaveBeenCalled();
  });

  it("returns false and leaves setBusy uncalled when lock is already held", () => {
    const busyLockRef = { current: true };
    const setBusy = jest.fn();
    const result = tryBeginBusyAction(busyLockRef, setBusy);
    expect(result).toBe(false);
    expect(setBusy).not.toHaveBeenCalled();
  });
});
