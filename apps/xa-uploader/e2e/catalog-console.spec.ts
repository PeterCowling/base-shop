import { expect, type Page,test } from "@playwright/test";

import { createUploaderHarness, type UploaderHarness } from "./helpers/uploaderHarness";

let harness: UploaderHarness;

const PRODUCT_TITLE = "E2E Shopper Tote";
const PRODUCT_DESCRIPTION = "E2E operator flow coverage product.";
const PRODUCT_DESCRIPTION_UPDATED = "E2E operator flow coverage product (updated).";

async function loginViaKeyboard(page: Page): Promise<void> {
  await page.goto(harness.baseUrl, { waitUntil: "networkidle" });

  const tokenInput = page.getByTestId("catalog-login-token");
  await expect(tokenInput).toBeVisible();
  await expect(tokenInput).toBeFocused();

  await tokenInput.fill(harness.adminToken);
  await page.keyboard.press("Enter");

  await expect(page.getByText("Console active")).toBeVisible();
}

async function fillRequiredProductFields(page: Page): Promise<void> {
  await page.getByLabel("Title", { exact: true }).fill(PRODUCT_TITLE);
  await page.getByLabel("Brand handle", { exact: true }).fill("e2e-brand");
  await page.getByLabel("Collection handle", { exact: true }).fill("e2e-collection");
  await page.getByLabel("Description", { exact: true }).fill(PRODUCT_DESCRIPTION);
  await page.getByLabel("Subcategory", { exact: true }).fill("tote");
  await page
    .getByLabel("Colors (pipe, comma, or newline)", { exact: true })
    .fill("black");
  await page
    .getByLabel("Materials (pipe, comma, or newline)", { exact: true })
    .fill("leather");
  await page
    .getByLabel("Image files (paths, globs, or directories)", { exact: true })
    .fill(harness.imageRelativePath);
}

test.describe("catalog console e2e", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async () => {
    harness = await createUploaderHarness();
    await harness.start();
  });

  test.afterAll(async () => {
    await harness.stop();
  });

  test("TC-09-01 happy path login -> create/edit product -> export ZIP", async ({ page }) => {
    await loginViaKeyboard(page);

    await fillRequiredProductFields(page);

    const saveButton = page.getByTestId("catalog-save-details");
    await expect(saveButton).toBeEnabled();
    await saveButton.focus();
    await expect(saveButton).toBeFocused();
    await saveButton.click();

    const draftFeedback = page.getByTestId("catalog-draft-feedback");
    await expect(draftFeedback).toContainText("Saved product details.", {
      timeout: 120_000,
    });
    await expect(saveButton).toBeEnabled({ timeout: 120_000 });

    await page.getByLabel("Description", { exact: true }).fill(PRODUCT_DESCRIPTION_UPDATED);
    await saveButton.click();
    await expect(draftFeedback).toContainText("Saved product details.", {
      timeout: 120_000,
    });
    await expect(saveButton).toBeEnabled({ timeout: 120_000 });

    await page.getByLabel("Search").fill(PRODUCT_TITLE);
    const submissionCheckbox = page.getByLabel("Select for submission").first();
    await submissionCheckbox.check();

    const exportButton = page.getByTestId("catalog-export-zip");
    await expect(exportButton).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportButton.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^submission\.\d{4}-\d{2}-\d{2}\.[a-f0-9]{32}\.zip$/,
    );

    await expect(page.getByTestId("catalog-submission-feedback")).toContainText("Submission ID:");
  });

  test("TC-09-02 sync failure shows actionable guidance and keeps keyboard focus on retry action", async ({
    page,
  }) => {
    await loginViaKeyboard(page);

    const runSyncButton = page.getByTestId("catalog-run-sync");
    await expect(runSyncButton).toBeEnabled();
    await runSyncButton.focus();
    await expect(runSyncButton).toBeFocused();
    await page.keyboard.press("Enter");

    const syncFeedback = page.getByTestId("catalog-sync-feedback");
    await expect(syncFeedback).toContainText(
      "Sync cannot run because required scripts are missing",
    );
    await expect(syncFeedback).toContainText(
      "Restore the missing scripts in scripts/src/xa, then retry sync.",
    );
    await expect(runSyncButton).toBeFocused();
  });
});
