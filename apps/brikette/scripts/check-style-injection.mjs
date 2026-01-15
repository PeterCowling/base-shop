#!/usr/bin/env node
import { chromium } from "playwright";

const baseUrl = process.env.BRIKETTE_BASE_URL || "http://localhost:3014/en";
const timeoutMs = Number(process.env.BRIKETTE_TIMEOUT_MS || 20000);

const REQUIRED_VARS = [
  "--space-2",
  "--color-bg",
  "--color-fg",
  "--rgb-brand-bg",
  "--color-brand-primary",
];

const main = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    if (!response || !response.ok()) {
      throw new Error(`[style-check] Failed to load ${baseUrl} (status ${response?.status()})`);
    }
    const diagnostics = await page.evaluate(({ requiredVars }) => {
      const errors = [];
      const vars = {};
      for (const name of requiredVars) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        vars[name] = value;
        if (!value) {
          errors.push(`Missing ${name} CSS variable`);
        }
      }

      const readComputed = (className, property) => {
        const el = document.createElement("div");
        el.className = className;
        document.body.appendChild(el);
        const value = getComputedStyle(el)[property];
        el.remove();
        return value;
      };

      const checks = {
        gap: readComputed("grid gap-4", "columnGap"),
        bgPrimary: readComputed("bg-primary", "backgroundColor"),
        textDanger: readComputed("text-danger-foreground", "color"),
        bgBrand: readComputed("bg-brand-bg", "backgroundColor"),
      };

      const gapInvalid = !checks.gap || checks.gap === "normal" || checks.gap === "0px";
      if (gapInvalid) {
        errors.push(`gap-4 computed columnGap is "${checks.gap}"`);
      }
      if (!checks.bgPrimary || checks.bgPrimary === "rgba(0, 0, 0, 0)" || checks.bgPrimary === "transparent") {
        errors.push(`bg-primary computed backgroundColor is "${checks.bgPrimary}"`);
      }
      if (!checks.textDanger || checks.textDanger === "rgba(0, 0, 0, 0)" || checks.textDanger === "transparent") {
        errors.push(`text-danger-foreground computed color is "${checks.textDanger}"`);
      }
      if (!checks.bgBrand || checks.bgBrand === "rgba(0, 0, 0, 0)" || checks.bgBrand === "transparent") {
        errors.push(`bg-brand-bg computed backgroundColor is "${checks.bgBrand}"`);
      }

      return { errors, vars, checks };
    }, { requiredVars: REQUIRED_VARS });

    if (diagnostics.errors.length > 0) {
      const error = diagnostics.errors.join("; ");
      throw new Error(`[style-check] ${error}`);
    }

    console.log("[style-check] CSS vars:", diagnostics.vars);
    console.log("[style-check] Utility checks:", diagnostics.checks);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
