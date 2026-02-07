// scripts/src/add-locale.ts
import { existsSync,readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function usage(): never {
  console.error("Usage: pnpm add-locale <code>");
  process.exit(1);
}

function main() {
  const code = process.argv[2];
  if (!code || !/^[a-z]{2}$/i.test(code)) usage();
  const locale = code.toLowerCase();

  const root = process.cwd();
  const i18nSrc = path.join(root, "packages", "i18n", "src");

  // Update locales.ts
  const localesPath = path.join(i18nSrc, "locales.ts");
  const localesSrc = readFileSync(localesPath, "utf8");
  const match = localesSrc.match(/LOCALES = \[([^\]]*)\] as const;/);
  if (!match) {
    console.error("Could not locate LOCALES array in locales.ts");
    process.exit(1);
  }
  const list = match[1]
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
  if (list.includes(locale)) {
    console.log(`Locale '${locale}' already present.`);
  } else {
    list.push(locale);
    list.sort();
    const arrayStr = `[${list.map((l) => `"${l}"`).join(", ")}]`;
    const updated = localesSrc.replace(
      /LOCALES = \[[^\]]*\] as const;/,
      `LOCALES = ${arrayStr} as const;`
    );
    writeFileSync(localesPath, updated);
  }

  // Update useTranslations.server.ts regex
  const serverPath = path.join(i18nSrc, "useTranslations.server.ts");
  if (existsSync(serverPath)) {
    let serverSrc = readFileSync(serverPath, "utf8");
    const regex = /webpackInclude: \/\(([^)]+)\)\.json\$\//;
    const localesPattern = list.join("|");
    if (regex.test(serverSrc)) {
      serverSrc = serverSrc.replace(
        regex,
        `webpackInclude: /(${localesPattern})\\.json$/`
      );
      writeFileSync(serverPath, serverSrc);
    }
  }

  // Create translation stub
  const templatePath = path.join(i18nSrc, "en.json");
  const template = JSON.parse(readFileSync(templatePath, "utf8")) as Record<string, string>;
  const stub = Object.fromEntries(Object.keys(template).map((k) => [k, ""]));
  const target = path.join(i18nSrc, `${locale}.json`);
  if (!existsSync(target)) {
    writeFileSync(target, JSON.stringify(stub, null, 2) + "\n");
  }

  console.log(`Added locale '${locale}'.`);
}

main();
