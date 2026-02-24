/** @jest-environment jsdom */

import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import { getUploaderMessage, type UploaderMessageKey } from "../../../lib/uploaderI18n";
import { UploaderI18nProvider } from "../../../lib/uploaderI18n.client";
import { CatalogSyncPanel } from "../CatalogSyncPanel.client";
import { getSyncFailureMessage } from "../useCatalogConsole.client";

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

describe("sync failure feedback", () => {
  it("builds actionable localized message for missing sync dependencies", () => {
    const message = getSyncFailureMessage(
      {
        ok: false,
        error: "sync_dependencies_missing",
        recovery: "restore_sync_scripts",
        missingScripts: ["validate", "sync"],
      },
      translate,
    );

    expect(message).toContain("required scripts are missing");
    expect(message).toContain("input validator");
    expect(message).toContain("sync pipeline runner");
    expect(message).toContain("scripts/src/xa");
  });

  it("builds actionable localized message for empty catalog guard", () => {
    const message = getSyncFailureMessage(
      {
        ok: false,
        error: "catalog_input_empty",
        recovery: "confirm_empty_catalog_sync",
      },
      translate,
    );

    expect(message).toContain("missing or empty");
    expect(message).toContain("empty storefront publish");
  });

  it("builds actionable localized message for catalog publish configuration failures", () => {
    const message = getSyncFailureMessage(
      {
        ok: false,
        error: "catalog_publish_unconfigured",
        recovery: "configure_catalog_contract",
      },
      translate,
    );

    expect(message).toContain("not configured");
    expect(message).toContain("XA_CATALOG_CONTRACT_BASE_URL");
  });

  it("builds actionable localized message for validation failures", () => {
    const message = getSyncFailureMessage(
      {
        ok: false,
        error: "validation_failed",
        recovery: "review_validation_logs",
      },
      translate,
    );

    expect(message).toContain("Validation failed");
    expect(message).toContain("Fix validation errors");
  });

  it("renders scoped sync feedback in the sync panel", () => {
    render(
      <UploaderI18nProvider>
        <CatalogSyncPanel
          busy={false}
          syncOptions={{ strict: true, recursive: true, replace: false, dryRun: false }}
          syncReadiness={{
            checking: false,
            ready: true,
            missingScripts: [],
            error: null,
          }}
          syncOutput={null}
          feedback={{ kind: "error", message: "Sync failed. Fix validation errors and retry." }}
          onSync={() => undefined}
          onRefreshReadiness={() => undefined}
          onChangeSyncOptions={() => undefined}
        />
      </UploaderI18nProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Fix validation errors and retry.");
  });

  it("shows readiness failure details and disables run-sync until ready", () => {
    render(
      <UploaderI18nProvider>
        <CatalogSyncPanel
          busy={false}
          syncOptions={{ strict: true, recursive: true, replace: false, dryRun: false }}
          syncReadiness={{
            checking: false,
            ready: false,
            missingScripts: ["validate", "sync"],
            error: null,
          }}
          syncOutput={null}
          feedback={null}
          onSync={() => undefined}
          onRefreshReadiness={() => undefined}
          onChangeSyncOptions={() => undefined}
        />
      </UploaderI18nProvider>,
    );

    expect(screen.getByTestId("catalog-sync-readiness")).toHaveTextContent(
      "required scripts are missing",
    );
    expect(screen.getByTestId("catalog-run-sync")).toBeDisabled();
  });
});
