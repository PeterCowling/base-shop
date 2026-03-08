#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium, devices, firefox, webkit } from "playwright";

export const DEFAULT_BASE_URL = "https://hostel-positano.com";
export const DEFAULT_PROJECT_SET = "chromium";

const DEFAULT_ARTIFACT_ROOT = "test-results";

export function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function buildProjectMatrix(projectSet) {
  switch (projectSet) {
    case "chromium":
      return [
        {
          name: "chromium",
          browserType: chromium,
          contextOptions: { ...devices["Desktop Chrome"] },
          isMobile: false,
        },
      ];
    case "cross-browser":
      return [
        {
          name: "chromium",
          browserType: chromium,
          contextOptions: { ...devices["Desktop Chrome"] },
          isMobile: false,
        },
        {
          name: "firefox",
          browserType: firefox,
          contextOptions: { ...devices["Desktop Firefox"] },
          isMobile: false,
        },
        {
          name: "webkit",
          browserType: webkit,
          contextOptions: { ...devices["Desktop Safari"] },
          isMobile: false,
        },
        {
          name: "mobile-chrome",
          browserType: chromium,
          contextOptions: { ...devices["Pixel 7"] },
          isMobile: true,
        },
        {
          name: "mobile-safari",
          browserType: webkit,
          contextOptions: { ...devices["iPhone 13"] },
          isMobile: true,
        },
      ];
    default:
      throw new Error(
        `Unsupported BRIKETTE_PLAYWRIGHT_PROJECT_SET="${projectSet}". Expected "chromium" or "cross-browser".`,
      );
  }
}

export function createPageErrorTracker(page) {
  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  return pageErrors;
}

export function assertNoPageErrors(pageErrors, contextLabel) {
  assert(pageErrors.length === 0, `${contextLabel} emitted page errors:\n- ${pageErrors.join("\n- ")}`);
}

export async function waitForMain(page) {
  await page.locator("main").first().waitFor({ state: "visible" });
}

export async function gotoAndExpectReady(page, pathname) {
  const response = await page.goto(pathname, { waitUntil: "domcontentloaded" });
  assert(response?.status() === 200, `Expected ${pathname} to return HTTP 200, received ${response?.status()}`);
  await waitForMain(page);
}

function matchesUrl(urlString, matcher) {
  if (matcher instanceof RegExp) return matcher.test(urlString);
  if (typeof matcher === "function") return matcher(urlString);
  return urlString === matcher;
}

export async function clickAndExpectUrl(page, locator, matcher) {
  await locator.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL((url) => matchesUrl(url.toString(), matcher)),
    locator.click(),
  ]);
}

function sanitizeSegment(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function stopTrace(context, tracePath) {
  try {
    if (tracePath) {
      await context.tracing.stop({ path: tracePath });
      return;
    }
    await context.tracing.stop();
  } catch {
    // Best-effort artifact capture only.
  }
}

async function captureFailureArtifacts({ context, page, suiteArtifactDir, projectName, testId }) {
  await ensureDir(suiteArtifactDir);

  const baseName = `${sanitizeSegment(projectName)}-${sanitizeSegment(testId)}`;
  const screenshotPath = path.join(suiteArtifactDir, `${baseName}.png`);
  const tracePath = path.join(suiteArtifactDir, `${baseName}.zip`);

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch {
    // Best-effort artifact capture only.
  }

  await stopTrace(context, tracePath);

  return { screenshotPath, tracePath };
}

async function writeSummary({ baseUrl, projectSet, results, suiteArtifactDir, suiteName }) {
  await ensureDir(suiteArtifactDir);
  const summaryPath = path.join(suiteArtifactDir, "summary.json");
  await fs.writeFile(
    summaryPath,
    `${JSON.stringify(
      {
        suiteName,
        baseUrl,
        projectSet,
        generatedAt: new Date().toISOString(),
        results,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

async function runProject(project, { baseUrl, suiteArtifactDir, tests }) {
  const browser = await project.browserType.launch({ headless: true });
  const results = [];

  try {
    for (const testCase of tests) {
      const context = await browser.newContext({
        ...project.contextOptions,
        baseURL: baseUrl,
      });
      await context.tracing.start({ screenshots: true, snapshots: true });

      const page = await context.newPage();
      const startedAt = Date.now();

      try {
        const outcome = await testCase.run({ page, project });
        const durationMs = Date.now() - startedAt;
        await stopTrace(context);

        if (outcome?.skipped) {
          console.info(`SKIP [${project.name}] ${testCase.id} ${testCase.name} (${outcome.skipped})`);
          results.push({ project: project.name, id: testCase.id, status: "skipped", durationMs });
        } else {
          console.info(`PASS [${project.name}] ${testCase.id} ${testCase.name} (${durationMs}ms)`);
          results.push({ project: project.name, id: testCase.id, status: "passed", durationMs });
        }
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        const message = error instanceof Error ? error.message : String(error);
        const artifacts = await captureFailureArtifacts({
          context,
          page,
          suiteArtifactDir,
          projectName: project.name,
          testId: testCase.id,
        });

        console.error(`FAIL [${project.name}] ${testCase.id} ${testCase.name} (${durationMs}ms)`);
        console.error(message);
        results.push({
          project: project.name,
          id: testCase.id,
          status: "failed",
          durationMs,
          message,
          artifacts,
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}

export async function runSmokeSuite({
  suiteId,
  suiteName,
  tests,
  baseUrl = normalizeBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? DEFAULT_BASE_URL),
  projectSet = process.env.BRIKETTE_PLAYWRIGHT_PROJECT_SET ?? DEFAULT_PROJECT_SET,
}) {
  const projects = buildProjectMatrix(projectSet);
  const suiteArtifactDir = path.join(DEFAULT_ARTIFACT_ROOT, suiteId);

  console.info(`Running ${suiteName} against ${baseUrl}`);
  console.info(`Project set: ${projectSet}`);

  const results = [];
  for (const project of projects) {
    console.info(`\n== ${project.name} ==`);
    results.push(...(await runProject(project, { baseUrl, suiteArtifactDir, tests })));
  }

  await writeSummary({ baseUrl, projectSet, results, suiteArtifactDir, suiteName });

  const passed = results.filter((result) => result.status === "passed").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  const failed = results.filter((result) => result.status === "failed");

  console.info("\nSummary");
  console.info(`Passed: ${passed}`);
  console.info(`Skipped: ${skipped}`);
  console.info(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    for (const failure of failed) {
      const artifactSummary = failure.artifacts
        ? ` (artifacts: ${failure.artifacts.screenshotPath}, ${failure.artifacts.tracePath})`
        : "";
      console.error(`- [${failure.project}] ${failure.id}: ${failure.message}${artifactSummary}`);
    }
    process.exitCode = 1;
  }
}
