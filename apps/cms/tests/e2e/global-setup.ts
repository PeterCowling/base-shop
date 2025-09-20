import { chromium, type FullConfig } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ADMIN_EMAIL = process.env.CMS_E2E_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.CMS_E2E_PASSWORD ?? "admin";

export default async function globalSetup(config: FullConfig) {
  const project = config.projects[0];
  const baseURL = project?.use?.baseURL ?? "http://127.0.0.1:3006";
  const storageStatePath = path.join(__dirname, ".auth/admin.json");
  await mkdir(path.dirname(storageStatePath), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    const page = await context.newPage();
    const loginUrl = new URL("/login?callbackUrl=%2Fcms", baseURL);
    await page.goto(loginUrl.toString(), { waitUntil: "networkidle" });

    await page.getByLabel(/Email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/Password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL("**/cms", { timeout: 15_000 });

    await context.storageState({ path: storageStatePath });
  } finally {
    await browser.close();
  }
}
