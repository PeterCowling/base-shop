import { createRequire } from "node:module";
import path from "node:path";

import { beforeEach } from "vitest";

import i18n from "@/i18n";
import { __setGuidesModulesForTests, getGuidesBundle, type GuidesNamespace } from "@/locales/guides";
import { guidesTestStubBundle } from "@/locales/guides.stub";
import {
  ensureGuideMocks,
  resetGuideTestState,
  setTranslations,
} from "@/test/routes/guides/__tests__/guides.test-utils";

type GuidesTagsBundle = Record<string, unknown>;

const require = createRequire(import.meta.url);

const readLocaleJson = (lang: string, filename: string): Record<string, unknown> => {
  try {
    const filePath = path.resolve(
      process.cwd(),
      "apps/brikette/src/locales",
      lang,
      filename,
    );
    return require(filePath) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const baseGuides = getGuidesBundle("en") ?? guidesTestStubBundle;
export const baseGuidesBundle: GuidesNamespace = structuredClone
  ? structuredClone(baseGuides)
  : (JSON.parse(JSON.stringify(baseGuides)) as GuidesNamespace);

export const baseGuidesTagsBundle: GuidesTagsBundle = readLocaleJson("en", "guides.tags.json");

const guideBundleOverrides = new Map<string, GuidesNamespace>();

const applyGuidesOverrides = () => {
  const legacy: Record<string, GuidesNamespace> = {};
  for (const [lang, bundle] of guideBundleOverrides.entries()) {
    legacy[`./${lang}/guides.json`] = bundle;
  }
  __setGuidesModulesForTests({ legacy });
};

export const clone = <T>(value: T): T =>
  typeof structuredClone === "function" ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T);

export const registerGuidesBundle = (lang: string, bundle: GuidesNamespace) => {
  guideBundleOverrides.set(lang, bundle);
  applyGuidesOverrides();
  setTranslations(lang, "guides", bundle as unknown as Record<string, unknown>);
};

export const registerGuidesTagsBundle = (lang: string, bundle: GuidesTagsBundle) => {
  setTranslations(lang, "guides.tags", bundle);
};

let hooksInstalled = false;

const seedBaseBundles = () => {
  guideBundleOverrides.clear();
  registerGuidesBundle("en", clone(baseGuidesBundle));
  registerGuidesTagsBundle("en", clone(baseGuidesTagsBundle));
};

export const setupGuideCoverageTests = () => {
  if (hooksInstalled) return;
  hooksInstalled = true;
  beforeEach(() => {
    resetGuideTestState();
    seedBaseBundles();
    void i18n.changeLanguage("en");
  });
};

export { ensureGuideMocks, i18n };