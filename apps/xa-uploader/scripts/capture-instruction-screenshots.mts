import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

import { createUploaderHarness } from "../e2e/helpers/uploaderHarness";
import type { UploaderLocale } from "../src/lib/uploaderI18n";

const REPO_ROOT = "/Users/petercowling/base-shop";
const APP_ROOT = path.join(REPO_ROOT, "apps/xa-uploader");
const OUTPUT_DIR = path.join(APP_ROOT, "src/app/instructions/assets");
const VIEWPORT = { width: 1280, height: 1800 };
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
  await page.waitForSelector('[data-testid="catalog-save-details"]', {
    timeout: 120_000,
  });
}

async function login(
  page: import("@playwright/test").Page,
  baseUrl: string,
  adminToken: string,
): Promise<void> {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await waitForLogin(page);
  await page.fill('[data-testid="catalog-login-token"]', adminToken);
  await page.click('[data-testid="catalog-login-submit"]');
  await waitForAuthenticated(page);
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
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `login-screen-${locale}.png`),
    fullPage: true,
  });

  await login(page, baseUrl, adminToken);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `add-product-screen-${locale}.png`),
    fullPage: true,
  });

  const screenTabs = page.locator("div.flex.items-center.border-b.border-gate-border").first();
  await screenTabs.locator("button").nth(1).click();
  await Promise.race([
    page.waitForSelector('[data-testid="catalog-search"]', { timeout: 60_000 }),
    page.getByText(EDIT_EMPTY_MESSAGE[locale]).waitFor({ state: "visible", timeout: 60_000 }),
  ]);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `edit-screen-${locale}.png`),
    fullPage: true,
  });

  await page.getByRole("button", { name: CURRENCY_LABEL[locale] }).first().click();
  await page.waitForSelector('[data-testid="catalog-run-sync"]', { timeout: 60_000 });
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `currency-screen-${locale}.png`),
    fullPage: true,
  });

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
