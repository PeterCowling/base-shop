#!/usr/bin/env node

/**
 * Automated Octorate login with Gmail MFA code fetch
 */

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

import { handleToolCall } from "./dist/tools/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_STATE = join(__dirname, ".secrets/octorate/storage-state.json");
const LOGIN_URL = "https://admin.octorate.com/";
const CALENDAR_URL = "https://admin.octorate.com/octobook/user/calendar/index.xhtml";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const parseToolJson = (result) => JSON.parse(result?.content?.[0]?.text);
const tool = async (name, args) => parseToolJson(await handleToolCall(name, args));

async function getMFACodeFromGmail() {
  console.info("Fetching MFA code from Gmail...");

  // Search for recent Octorate MFA emails
  const result = await tool("gmail_list_query", {
    query: "from:noreply@smtp.octorate.com subject:login newer_than:10m",
    maxResults: 1
  });

  if (!result.emails || result.emails.length === 0) {
    throw new Error("No recent MFA email found from Octorate");
  }

  // Extract the 6-digit code from the snippet
  const snippet = result.emails[0].snippet || "";
  const codeMatch = snippet.match(/\b\d{6}\b/);

  if (!codeMatch) {
    throw new Error(`Could not find 6-digit code in email. Snippet: ${snippet}`);
  }

  console.info(`Found MFA code: ${codeMatch[0]}`);
  return codeMatch[0];
}

async function main() {
  const username = process.env.OCTORATE_USERNAME;
  const password = process.env.OCTORATE_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing credentials: set OCTORATE_USERNAME and OCTORATE_PASSWORD");
  }

  console.info("Starting automated Octorate login...\n");

  await mkdir(dirname(STORAGE_STATE), { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.info("1. Opening Octorate login page...");
    await page.goto(LOGIN_URL);
    await sleep(2000);

    console.info("2. Entering credentials...");
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await sleep(1000);

    console.info("3. Clicking login...");
    await page.click('button[type="submit"]');
    await sleep(5000);

    console.info("4. Fetching MFA code from Gmail...");
    const mfaCode = await getMFACodeFromGmail();

    console.info("5. Entering MFA code...");
    // Try different selectors for the MFA code input
    const codeInput = await page.locator('input[name="code"], input[id*="code"], input[type="text"]:visible').first();
    await codeInput.waitFor({ timeout: 10000 });
    await codeInput.fill(mfaCode);
    await sleep(1000);

    console.info("6. Submitting MFA...");
    await page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Verify")').first().click();

    console.info("7. Waiting for login to complete...");
    await sleep(8000);

    // Check current URL
    const currentUrl = page.url();
    console.info(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('login') || currentUrl.includes('signin')) {
      throw new Error("Still on login page - MFA may have failed");
    }

    console.info("8. Saving session state...");
    await context.storageState({ path: STORAGE_STATE });

    console.info("\n✅ Login successful! Session saved to:", STORAGE_STATE);

    // Verify by navigating to calendar
    console.info("\n9. Verifying session by navigating to calendar...");
    await page.goto(CALENDAR_URL);
    await sleep(3000);

    const url = page.url();
    if (url.includes('calendar')) {
      console.info("✅ Session verified - on calendar page!");
    } else {
      console.info("⚠️  Warning: not on calendar page, on:", url);
    }

  } catch (error) {
    console.error("\n❌ Login failed:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
