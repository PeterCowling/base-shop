#!/usr/bin/env node

/**
 * Guardrail for harness-first testing.
 *
 * Fails when route-facing test suites bypass the shared helpers by importing
 * raw `render()` / `renderHook()` from @testing-library/react or by calling
 * render-like APIs without also importing one of the documented harness helpers.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const repoRoot = process.cwd();

const routeRoots = [
  {
    baseDir: resolve(repoRoot, "src/routes"),
    label: "route test",
  },
  {
    baseDir: resolve(repoRoot, "src/test/routes"),
    label: "shared route test",
  },
];

const harnessIndicators = [
  "@tests/renderers",
  "@tests/routes",
  "withGuideMocks",
  "guideTestHarness",
  "renderPage",
  "renderRoute",
  "renderWithProviders",
  "renderCompareBasesPage",
];

// Legacy suites still awaiting harness migration. Remove entries as they are converted.
const legacyAllowlist = new Set([



  "src/routes/guides/__tests__/amalfi-coast-itineraries-no-car.test.tsx",
  "src/routes/guides/__tests__/amalfi-town-guide.test.tsx",
  "src/routes/guides/__tests__/arienzo-beach-guide.test.tsx",
  "src/routes/guides/__tests__/art-and-artisans-positano-shopping.test.tsx",
  "src/routes/guides/__tests__/camping-on-the-amalfi-coast.fallback.test.tsx",



  "src/routes/guides/__tests__/ferry-schedules/extras.anchors-toc.test.tsx",
  "src/routes/guides/__tests__/ferry-schedules/extras.fallbacks.test.tsx",
  "src/routes/guides/__tests__/ferry-schedules/extras.prefer-localized.test.tsx",
  "src/routes/guides/__tests__/ferry-schedules/extras.static-bundle.test.tsx",
  "src/routes/guides/__tests__/ferry-schedules/i18n-helpers.test.tsx",


  "src/routes/guides/__tests__/free-walking-tour-audio-positano.route.test.tsx",



  "src/routes/guides/__tests__/layout.behaviour.test.tsx",




  "src/routes/guides/__tests__/positano-on-a-backpacker-budget.createArticleLead.test.tsx",
  "src/routes/guides/__tests__/positano-travel-guide.FallbackContent.test.tsx",
  "src/routes/guides/_GuideSeoTemplate.test.tsx",
  "src/routes/guides/_path-of-the-gods.article.test.tsx",
  "src/routes/guides/blocks/composeBlocks.test.tsx",
  "src/routes/guides/cheapEatsInPositano/CheapEatsArticle.test.tsx",



  "src/routes/guides/gavitella-beach-guide.test.tsx",
  "src/routes/guides/guide-seo/components/GuideEditorialPanel.test.tsx",
  "src/routes/guides/getting-to-laurito-beach-by-bus.test.tsx",
  "src/routes/guides/positano-instagram-spots.fallback.test.tsx",
  "src/routes/guides/positano-on-a-backpacker-budget.unit.test.tsx",
  "src/routes/guides/how-to-get-to-positano.test.tsx",
  "src/routes/guides/positano-on-a-budget.behaviour.test.tsx",
  "src/routes/guides/positano-travel-guide.functions.test.tsx",
  "src/routes/guides/structured-content-fallbacks.test.tsx",
  "src/routes/guides/sunrise-hike-positano.gallery.test.tsx",
  "src/routes/guides/free-walking-tour-audio-positano.test.tsx",






  "src/test/routes/apartment.loader.test.tsx",
  "src/test/routes/assistance.arriving-by-ferry.test.tsx",
  "src/test/routes/assistance.article-factory.loader.test.tsx",
  "src/test/routes/assistance.article-factory.component.test.tsx",
  "src/test/routes/assistance.hub-links.test.tsx",
  "src/test/routes/assistance.loader.test.tsx",
  "src/test/routes/assistance.route.component.test.tsx",
  "src/test/routes/careers.test.tsx",
  "src/test/routes/bar-menu/menu-row.test.tsx",
  "src/test/routes/experiences.useExperienceGuides.test.tsx",
  "src/test/routes/experiences.useFaqContent.test.tsx",

  "src/test/routes/home.test.tsx",
  "src/test/routes/how-to-get-here.$slug-branches.test.tsx",
  "src/test/routes/how-to-get-here.slug.test.tsx",




  "src/test/routes/guides.positano-travel-guide.logic.test.tsx",
]);

const issues = [];

for (const { baseDir, label } of routeRoots) {
  walk(baseDir, (filePath) => {
    if (!filePath.endsWith(".test.tsx")) return;
    analyzeFile(filePath, label);
  });
}

if (issues.length > 0) {
  console.error("Harness guard found issues:");
  for (const issue of issues) {
    console.error(`  - ${issue.file}: ${issue.reason}`);
  }
  console.error(
    "\nRoute suites must rely on the documented helpers (withGuideMocks, renderPage, renderWithProviders) instead of raw RTL APIs.",
  );
  process.exit(1);
}

function walk(dir, onFile) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, onFile);
    } else {
      onFile(fullPath);
    }
  }
}

function analyzeFile(filePath, label) {
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  const relativePath = relativeToRoot(filePath);

  if (legacyAllowlist.has(relativePath)) {
    return;
  }

  const hasHarnessIndicator = harnessIndicators.some((indicator) => text.includes(indicator));

  const importsTestingLibrary = /from\s+["']@testing-library\/react["']/.test(text);
  const importsRender =
    /import\s+{[^}]*\brender\b[^}]*}\s+from\s+["']@testing-library\/react["']/.test(text) ||
    /import\s+{[^}]*\brenderHook\b[^}]*}\s+from\s+["']@testing-library\/react["']/.test(text);
  const importsNamespaceRTL =
    /import\s+\*\s+as\s+\w+\s+from\s+["']@testing-library\/react["']/.test(text) &&
    /\.\s*render\s*\(/.test(text);

  if (importsRender) {
    issues.push({
      file: relativePath,
      reason: `${label} imports render()/renderHook() directly from @testing-library/react`,
    });
  }

  const usesRawRenderCall = /\brender\s*\(/.test(text);
  const usesMemoryRouter = /\bMemoryRouter\b/.test(text);
  const usesCreateMemoryRouter = /\bcreateMemoryRouter\b/.test(text);
  const usesRTLNamespaceRender = importsNamespaceRTL;
  const usesRenderPageHelper = text.includes("renderPage(");

  const touchesDomOrRouter =
    importsTestingLibrary || usesRawRenderCall || usesMemoryRouter || usesCreateMemoryRouter || usesRTLNamespaceRender;

  if (touchesDomOrRouter && !hasHarnessIndicator) {
    issues.push({
      file: relativePath,
      reason: `${label} exercises DOM/router helpers without importing the shared harness`,
    });
  }

  if (
    usesRenderPageHelper &&
    relativePath.startsWith("src/routes/") &&
    !renderPageAllowlist.has(relativePath)
  ) {
    issues.push({
      file: relativePath,
      reason: `${label} should migrate from renderPage() to renderRouteModule()/withGuideMocks`,
    });
  }
}

function relativeToRoot(filePath) {
  return filePath.startsWith(repoRoot) ? filePath.slice(repoRoot.length + 1) : filePath;
}