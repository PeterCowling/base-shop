import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

import { createUploaderHarness } from "../e2e/helpers/uploaderHarness";
import type { UploaderLocale } from "../src/lib/uploaderI18n";

const REPO_ROOT = "/Users/petercowling/base-shop";
const APP_ROOT = path.join(REPO_ROOT, "apps/xa-uploader");
const OUTPUT_DIR = path.join(APP_ROOT, "src/app/instructions/assets");
const VIEWPORT = { width: 1280, height: 1024 };
const CURRENCY_LABEL: Record<UploaderLocale, string> = {
  en: "Currency",
  zh: "汇率设置",
};
const EDIT_EMPTY_MESSAGE: Record<UploaderLocale, string> = {
  en: "No products in catalog. Add a product first.",
  zh: "目录中没有商品。请先添加商品。",
};

async function waitForLogin(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForSelector('[data-testid="catalog-login-token"]', {
    timeout: 120_000,
  });
}

async function waitForAuthenticated(page: import("@playwright/test").Page): Promise<void> {
  await Promise.race([
    page.waitForSelector('[data-testid="catalog-save-details"]', {
      timeout: 300_000,
    }),
    page.waitForSelector('[data-testid="catalog-login-feedback"]', {
      timeout: 300_000,
    }),
  ]);

  const feedback = page.locator('[data-testid="catalog-login-feedback"]');
  if (await feedback.isVisible()) {
    const message = (await feedback.textContent())?.trim() || "Unknown login failure";
    throw new Error(`Login failed while capturing instruction screenshots: ${message}`);
  }
}

async function login(
  page: import("@playwright/test").Page,
  baseUrl: string,
  adminToken: string,
): Promise<void> {
  const response = await page.request.post(`${baseUrl}/api/uploader/login`, {
    data: { token: adminToken },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login API failed (${response.status()}): ${body}`);
  }
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await waitForAuthenticated(page);
}

async function captureViewportScreenshot(
  page: import("@playwright/test").Page,
  fileName: string,
): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
  await page.screenshot({
    path: path.join(OUTPUT_DIR, fileName),
  });
}

async function captureLocaleScreens(
  browser: import("@playwright/test").Browser,
  locale: UploaderLocale,
  baseUrl: string,
  adminToken: string,
): Promise<void> {
  const context = await browser.newContext({ viewport: VIEWPORT });
  await context.addInitScript((localeCode: UploaderLocale) => {
    window.localStorage.setItem("xa_uploader_locale", localeCode);
  }, locale);
  const page = await context.newPage();

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await waitForLogin(page);
  await captureViewportScreenshot(page, `login-screen-${locale}.png`);

  await login(page, baseUrl, adminToken);
  await captureViewportScreenshot(page, `add-product-screen-${locale}.png`);

  const screenTabs = page.locator("div.flex.items-center.border-b.border-gate-border").first();
  await screenTabs.locator("button").nth(1).click();
  await Promise.race([
    page.waitForSelector('[data-testid="catalog-search"]', { timeout: 60_000 }),
    page.getByText(EDIT_EMPTY_MESSAGE[locale]).waitFor({ state: "visible", timeout: 60_000 }),
  ]);
  await captureViewportScreenshot(page, `edit-screen-${locale}.png`);

  await page.getByRole("button", { name: CURRENCY_LABEL[locale] }).first().click();
  await page.waitForSelector('[data-testid="catalog-run-sync"]', { timeout: 60_000 });
  await captureViewportScreenshot(page, `currency-screen-${locale}.png`);

  await context.close();
}

async function run(): Promise<void> {
  process.chdir(APP_ROOT);
  await mkdir(OUTPUT_DIR, { recursive: true });

  const harness = await createUploaderHarness();
  await harness.start();
  const browser = await chromium.launch({ headless: true });

  try {
    await captureLocaleScreens(browser, "en", harness.baseUrl, harness.adminToken);
    await captureLocaleScreens(browser, "zh", harness.baseUrl, harness.adminToken);
    console.log(`[xa-uploader] instruction screenshots captured in ${OUTPUT_DIR}`);
  } finally {
    await browser.close();
    await harness.stop();
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
