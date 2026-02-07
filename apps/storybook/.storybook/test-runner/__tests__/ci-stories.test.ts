import { expect, type Page,test } from "playwright/test";

// Allow heavy stories (PageBuilder) extra time to render
test.describe.configure({ timeout: 300000 });

const stories = [
  {
    id: "atoms-tooltip--default",
    assertion: async (page: Page) => {
      // hover should reveal tooltip content
      const trigger = page.locator('button[class*="min-h-10"]').first();
      await trigger.hover({ timeout: 5000 });
      await expect(page.getByRole("tooltip")).toContainText("Info");
    },
  },
  {
    id: "molecules-formfield--default",
    assertion: async (page: Page) => {
      await expect(page.getByLabel("Name")).toBeVisible();
    },
  },
  {
    id: "cms-blocks-showcasesection-matrix--default",
    assertion: async (page: Page) => {
      await expect(page.locator("#storybook-root section")).toBeVisible();
    },
  },
  {
    id: "cms-pagebuilder--add-and-reorder",
    assertion: async (page: Page) => {
      await page.waitForLoadState("networkidle", { timeout: 300000 });
      await page.waitForTimeout(2000);
      await expect(page.locator("#storybook-root")).toHaveCount(1);
    },
  },
];

for (const story of stories) {
  test(`ci surface: ${story.id}`, async ({ page }) => {
    const url = `http://localhost:6007/iframe.html?id=${story.id}`;
    const res = await page.goto(url, { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    if (story.id.includes("cms-pagebuilder")) {
      await story.assertion(page);
    } else {
      await page.waitForSelector("#storybook-root", { timeout: 60000 });
      await story.assertion(page);
    }
  }, story.id.includes("cms-pagebuilder") ? 300000 : undefined);
}
