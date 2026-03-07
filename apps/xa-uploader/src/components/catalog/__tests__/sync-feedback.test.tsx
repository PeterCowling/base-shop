/** @jest-environment jsdom */

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { getUploaderMessage, type UploaderMessageKey } from "../../../lib/uploaderI18n";
import { UploaderI18nProvider } from "../../../lib/uploaderI18n.client";
import { shouldTriggerAutosync } from "../catalogConsoleActions";
import { deriveCatalogSiteStatus } from "../catalogConsoleFeedback";
import { CatalogSyncPanel } from "../CatalogSyncPanel.client";
import * as catalogWorkflowModule from "../catalogWorkflow";
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

const PUBLISH_READY_WORKFLOW = {
  isDataReady: true,
  isPublishReady: true,
  missingFieldPaths: [],
  missingRoles: [],
};

const MINIMAL_DRAFT = { slug: "studio-jacket" } as CatalogProductDraftInput;

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

    expect(message).toContain("CSV is empty");
    expect(message).toContain("empty storefront publish");
  });

  it("builds actionable localized message for missing catalog CSV guard", () => {
    const message = getSyncFailureMessage(
      {
        ok: false,
        error: "catalog_input_missing",
        recovery: "create_catalog_input",
      },
      translate,
    );

    expect(message).toContain("CSV file is missing");
    expect(message).toContain("Create or restore");
  });

  it("builds actionable localized message for missing/invalid currency rates", () => {
    const missing = getSyncFailureMessage(
      {
        ok: false,
        error: "currency_rates_missing",
        recovery: "save_currency_rates",
      },
      translate,
    );
    const invalid = getSyncFailureMessage(
      {
        ok: false,
        error: "currency_rates_invalid",
        recovery: "save_currency_rates",
      },
      translate,
    );

    expect(missing).toContain("Currency rates are missing");
    expect(missing).toContain("Save");
    expect(invalid).toContain("file is invalid");
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

  it("builds actionable localized message for sync rate limiting", () => {
    const message = getSyncFailureMessage(
      {
        ok: false,
        error: "rate_limited",
      },
      translate,
    );

    expect(message).toContain("rate limited");
    expect(message).toContain("one minute");
  });

  it("renders scoped sync feedback in the sync panel", () => {
    render(
      <UploaderI18nProvider initialLocale="en">
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
      <UploaderI18nProvider initialLocale="en">
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

describe("catalog site status derivation", () => {
  it("returns none states when no sync data exists", () => {
    expect(deriveCatalogSiteStatus(null)).toEqual({ catalog: "none", site: "none" });
  });

  it("marks triggered deploys as awaiting verification", () => {
    expect(
      deriveCatalogSiteStatus({
        ok: true,
        deploy: { status: "triggered" },
      }),
    ).toEqual({ catalog: "published", site: "triggered" });
  });

  it("marks cooldown deploys as pending", () => {
    expect(
      deriveCatalogSiteStatus({
        ok: true,
        deploy: { status: "skipped_cooldown" },
      }),
    ).toEqual({ catalog: "published", site: "cooldown" });
  });

  it("marks failed deploy triggers as failed", () => {
    expect(
      deriveCatalogSiteStatus({
        ok: true,
        deploy: { status: "failed" },
      }),
    ).toEqual({ catalog: "published", site: "failed" });
  });

  it("marks xa-b rebuild requirements when no deploy was triggered", () => {
    expect(
      deriveCatalogSiteStatus({
        ok: true,
        display: { requiresXaBBuild: true },
      }),
    ).toEqual({ catalog: "published", site: "rebuild_required" });
  });

  it("marks successful syncs without deploy metadata as site none", () => {
    expect(
      deriveCatalogSiteStatus({
        ok: true,
      }),
    ).toEqual({ catalog: "published", site: "none" });
  });
});

describe("catalog sync panel status strip", () => {
  it("renders catalog and site status indicators from the last successful sync", () => {
    const { container } = render(
      <UploaderI18nProvider initialLocale="en">
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
          lastSyncData={{ ok: true, deploy: { status: "triggered" } }}
          feedback={null}
          onSync={() => undefined}
          onRefreshReadiness={() => undefined}
          onChangeSyncOptions={() => undefined}
        />
      </UploaderI18nProvider>,
    );

    const catalogStatus = container.querySelector('[data-cy="catalog-status-strip-catalog"]');
    const siteStatus = container.querySelector('[data-cy="catalog-status-strip-site"]');

    expect(catalogStatus).toHaveTextContent("Catalog: Published");
    expect(siteStatus).toHaveTextContent("Site: Rebuild triggered");
  });

  it("does not render the status strip before any successful sync data exists", () => {
    const { container } = render(
      <UploaderI18nProvider initialLocale="en">
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
          lastSyncData={null}
          feedback={null}
          onSync={() => undefined}
          onRefreshReadiness={() => undefined}
          onChangeSyncOptions={() => undefined}
        />
      </UploaderI18nProvider>,
    );

    expect(container.querySelector('[data-cy="catalog-status-strip-catalog"]')).toBeNull();
    expect(container.querySelector('[data-cy="catalog-status-strip-site"]')).toBeNull();
  });
});

describe("autosync coalescing", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not fire while the autosave queue still has a pending draft", () => {
    jest
      .spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness")
      .mockReturnValue(PUBLISH_READY_WORKFLOW);

    expect(
      shouldTriggerAutosync({
        pendingAutosaveDraftRef: { current: { slug: "queued-draft" } },
        busyLockRef: { current: false },
        syncReadinessReady: true,
        syncReadinessChecking: false,
        draft: MINIMAL_DRAFT,
      }),
    ).toBe(false);
  });

  it("fires once the queue drains and the product is publish-ready", () => {
    jest
      .spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness")
      .mockReturnValue(PUBLISH_READY_WORKFLOW);

    expect(
      shouldTriggerAutosync({
        pendingAutosaveDraftRef: { current: null },
        busyLockRef: { current: false },
        syncReadinessReady: true,
        syncReadinessChecking: false,
        draft: MINIMAL_DRAFT,
      }),
    ).toBe(true);
  });
});
