#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- Script to fix locale files */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const LOCALES_ROOT = path.resolve(__dirname, "../src/locales");

type Issue = {
  locale: string;
  file: string;
  keyPath: string;
  kind: "emptyString" | "tooShort";
  message: string;
  enValue: string;
  localeValue: string;
};

function getNestedValue(obj: any, keyPath: string): any {
  if (!keyPath) return obj;
  const keys = keyPath.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}

function setNestedValue(obj: any, keyPath: string, value: any): void {
  if (!keyPath) return;
  const keys = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

function fixIssues(issues: Issue[]): void {
  const grouped = issues.reduce<Record<string, Record<string, Issue[]>>>((acc, issue) => {
    if (!acc[issue.locale]) acc[issue.locale] = {};
    if (!acc[issue.locale][issue.file]) acc[issue.locale][issue.file] = [];
    acc[issue.locale][issue.file].push(issue);
    return acc;
  }, {});

  let totalFixed = 0;
  const fixedByLocale: Record<string, number> = {};

  for (const [locale, files] of Object.entries(grouped)) {
    let localeFixed = 0;

    for (const [file, fileIssues] of Object.entries(files)) {
      const localeFilePath = path.join(LOCALES_ROOT, locale, file);
      const enFilePath = path.join(LOCALES_ROOT, "en", file);

      try {
        const localeJson = JSON.parse(readFileSync(localeFilePath, "utf8"));
        const enJson = JSON.parse(readFileSync(enFilePath, "utf8"));

        let fileModified = false;

        for (const issue of fileIssues) {
          const currentValue = getNestedValue(localeJson, issue.keyPath);
          const enValue = getNestedValue(enJson, issue.keyPath);

          // Only fix if the value is still problematic and English has a proper value
          if (enValue && typeof enValue === "string" && enValue.trim().length > 0) {
            // For empty strings, use English
            if (issue.kind === "emptyString") {
              setNestedValue(localeJson, issue.keyPath, enValue);
              fileModified = true;
              console.log(`[${locale}] ${file} :: ${issue.keyPath} :: Fixed empty string`);
            }
            // For too short strings, use English as fallback
            else if (issue.kind === "tooShort") {
              setNestedValue(localeJson, issue.keyPath, enValue);
              fileModified = true;
              console.log(`[${locale}] ${file} :: ${issue.keyPath} :: Fixed too short translation`);
            }
          }
        }

        if (fileModified) {
          writeFileSync(localeFilePath, JSON.stringify(localeJson, null, 2) + "\n", "utf8");
          localeFixed += fileIssues.length;
        }
      } catch (error) {
        console.error(`Error processing ${locale}/${file}:`, error);
      }
    }

    fixedByLocale[locale] = localeFixed;
    totalFixed += localeFixed;
    console.log(`\n${locale}: Fixed ${localeFixed} issues\n`);
  }

  console.log("\n=== Summary ===");
  console.log(`Total issues fixed: ${totalFixed}`);
  for (const [locale, count] of Object.entries(fixedByLocale)) {
    console.log(`  ${locale}: ${count}`);
  }
}

// Read issues from JSON
const issuesPath = path.join(__dirname, "translation-issues.json");
const issues: Issue[] = JSON.parse(readFileSync(issuesPath, "utf8"));

console.log(`Processing ${issues.length} issues...\n`);
fixIssues(issues);
