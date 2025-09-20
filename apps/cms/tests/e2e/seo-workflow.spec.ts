import { test, expect, type Locator, type Page } from "@playwright/test";

async function isChecked(locator: Locator): Promise<boolean> {
  const dataState = await locator.getAttribute("data-state");
  if (dataState === "checked") return true;
  if (dataState === "unchecked" || dataState === "indeterminate") return false;
  const ariaChecked = await locator.getAttribute("aria-checked");
  if (ariaChecked != null) return ariaChecked === "true";
  const property = await locator.evaluate((el) => (el as HTMLInputElement).checked ?? false);
  return Boolean(property);
}

function checkboxWithin(labelText: RegExp | string, page: Page): Locator {
  return page
    .locator("label", { hasText: labelText })
    .locator('[role="checkbox"], input[type="checkbox"]');
}

test.describe("SEO workflows", () => {
  test("manages localized metadata and AI catalog settings", async ({ page }) => {
    await page.goto("/cms/shop/bcd/settings/seo");
    await expect(page.getByRole("heading", { name: "SEO – bcd" })).toBeVisible();

    const freezeToggle = page.getByLabel("Freeze translations");
    const wasFrozen = await freezeToggle.isChecked();
    const titleInput = page.getByLabel("Title");
    const originalTitle = await titleInput.inputValue();

    const advancedToggle = page.getByRole("button", { name: /advanced settings/i });
    if ((await advancedToggle.textContent())?.includes("Show")) {
      await advancedToggle.click();
    }

    const canonicalInput = page.getByLabel("Canonical Base");
    const originalCanonical = await canonicalInput.inputValue();
    const ogInput = page.getByLabel("Open Graph URL");
    const originalOg = await ogInput.inputValue();
    const twitterInput = page.getByLabel("Twitter Card");
    const originalTwitter = await twitterInput.inputValue();

    const newTitle = `SEO smoke ${Date.now()}`;
    if (!wasFrozen) {
      await freezeToggle.check();
    }

    await titleInput.fill(newTitle);
    await page.getByRole("tab", { name: "DE" }).click();
    await expect(page.getByLabel("Title")).toHaveValue(newTitle);
    await page.getByRole("tab", { name: "EN" }).click();

    await canonicalInput.fill("https://example.com");
    await ogInput.fill("https://example.com/og");
    await twitterInput.fill("summary_large_image");

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/Metadata saved/i)).toBeVisible();

    const aiToggle = checkboxWithin(/Enable AI catalog feed/i, page);
    const aiWasEnabled = await isChecked(aiToggle);
    const pageSizeInput = page.getByLabel("Page size");
    const originalPageSize = await pageSizeInput.inputValue();
    const queueButton = page.getByRole("button", { name: "Queue crawl" });

    if (!aiWasEnabled) {
      await aiToggle.click();
      await expect(aiToggle).toHaveAttribute("data-state", "checked");
    }

    const mediaCheckbox = checkboxWithin(/media/i, page);
    await mediaCheckbox.click();
    await expect(mediaCheckbox).toHaveAttribute("data-state", "unchecked");
    await mediaCheckbox.click();
    await expect(mediaCheckbox).toHaveAttribute("data-state", "checked");

    await pageSizeInput.fill("25");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText(/Queue status:\s*Active/i)).toBeVisible();

    await queueButton.click();
    await expect(page.getByText("AI catalog crawl queued")).toBeVisible();

    await page.getByRole("button", { name: "View feed" }).click();
    await expect(page.getByText("Catalog feed preview coming soon")).toBeVisible();

    if (!aiWasEnabled) {
      await aiToggle.click();
      await expect(aiToggle).toHaveAttribute("data-state", "unchecked");
    }
    await pageSizeInput.fill(originalPageSize);
    await page.getByRole("button", { name: "Save settings" }).click();
    if (!aiWasEnabled) {
      await expect(page.getByText(/Queue status:\s*Paused/i)).toBeVisible();
      await expect(queueButton).toBeDisabled();
    } else {
      await expect(page.getByText(/Queue status:\s*Active/i)).toBeVisible();
      await expect(queueButton).toBeEnabled();
    }

    await titleInput.fill(originalTitle);
    await canonicalInput.fill(originalCanonical);
    await ogInput.fill(originalOg);
    await twitterInput.fill(originalTwitter);
    if (!wasFrozen) {
      await freezeToggle.uncheck();
    }
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/Metadata saved/i)).toBeVisible();
  });
});
