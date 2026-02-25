import { expect, type Page, test } from "playwright/test";

const STORYBOOK_IFRAME_BASE = "http://localhost:6007/iframe.html?id=";

// Allow heavy Storybook startup and on-demand story compiles.
test.describe.configure({ timeout: 420000 });

async function ensureStorybookRootReady(page: Page, timeout = 60000): Promise<void> {
  await page.waitForSelector("#storybook-root", { state: "attached", timeout });
  await page.evaluate(() => {
    const root = document.getElementById("storybook-root");
    const main = document.querySelector(".sb-show-main");
    if (root) (root as HTMLElement).style.visibility = "visible";
    if (main) (main as HTMLElement).style.visibility = "visible";
  });
}

async function openStory(page: Page, id: string, timeout = 240000): Promise<void> {
  const res = await page.goto(`${STORYBOOK_IFRAME_BASE}${id}`, {
    waitUntil: "domcontentloaded",
    timeout,
  });
  expect(res?.ok()).toBeTruthy();
}

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await openStory(page, "health-smoke--ok", 240000);
  await ensureStorybookRootReady(page, 240000);
  await page.close();
});

const stories: Array<{
  id: string;
  timeoutMs?: number;
  assertion: (page: Page) => Promise<void>;
}> = [
  {
    id: "atoms-tooltip--default",
    assertion: async (page: Page) => {
      const trigger = page.locator("#storybook-root button.min-h-10").first();
      await expect(trigger).toBeVisible();
      await trigger.hover({ timeout: 10000 });
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
    timeoutMs: 300000,
    assertion: async (page: Page) => {
      await expect(page.locator("#storybook-root [data-component-id]").first()).toBeVisible({ timeout: 180000 });
      await expect(page.locator("text=The component failed to render properly").first()).toBeHidden();
    },
  },
];

for (const story of stories) {
  test(
    `ci surface: ${story.id}`,
    async ({ page }) => {
      const timeout = story.timeoutMs ?? 240000;
      await openStory(page, story.id, timeout);
      await ensureStorybookRootReady(page, timeout);
      await story.assertion(page);
    },
    story.timeoutMs,
  );
}
