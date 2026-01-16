#!/usr/bin/env ts-node
import nodePlop from "node-plop";
import * as fs from "node:fs";
import * as path from "node:path";

async function run() {
  const [, , layer, name] = process.argv;
  if (!layer || !name) {
    console.error("Usage: pnpm gen <layer> <Name>"); // i18n-exempt -- ENG-1234 [ttl=2026-12-31]
    process.exit(1);
  }

  const plop = await nodePlop();

  // Helper: get first key from a comma-separated list
  plop.setHelper("firstKey", (keys) => {
    return String(keys || "").split(",")[0]?.trim() || "";
  });

  // Custom action: seed i18n keys into packages/i18n/src/{en,it,de}.json
  plop.setActionType(
    "seedI18n",
    function (
      answers,
      _cfg,
    ) {
      const raw = String(answers?.i18nKeys ?? "").trim();
      if (!raw) return "No i18n keys provided; skipping"; // i18n-exempt -- ENG-1234 [ttl=2026-12-31]
      const keys = raw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const LOCALES = ["en", "de", "it"];
      const i18nDir = path.join(__dirname, "packages", "i18n", "src");

      function readJson(file) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: file path is constructed from a fixed allowlist of locales and a static base dir
        return JSON.parse(fs.readFileSync(file, "utf8"));
      }
      function writeJson(file, obj) {
        const sorted = Object.fromEntries(
          Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
        );
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: file path is constructed from a fixed allowlist of locales and a static base dir
        fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
      }

      // Seed: first key gets a readable EN placeholder; others echo the key.
      const enPlaceholders = {};
      keys.forEach((k, idx) => {
        if (idx === 0) {
          // Prefer component name (from argv) if available
          const fallbackName = name ?? k.split(".").slice(-1)[0] ?? k;
          enPlaceholders[k] = String(fallbackName);
        } else {
          enPlaceholders[k] = k;
        }
      });

      for (const loc of LOCALES) {
        const file = path.join(i18nDir, `${loc}.json`);
        const obj = readJson(file);
        let changed = false;
        for (const k of keys) {
          if (!(k in obj)) {
            // Mirror EN placeholder into other locales initially
            obj[k] = enPlaceholders[k] ?? k;
            changed = true;
          }
        }
        if (changed) writeJson(file, obj);
      }

      return `Seeded ${keys.length} i18n key(s) to en/de/it`;
    },
  );
  plop.setGenerator("component", {
    description: "Generate a UI component", // i18n-exempt -- ENG-1234 [ttl=2026-12-31]
    prompts: [
      {
        type: "input",
        name: "i18nKeys",
        message: "Comma-separated i18n keys to seed", // i18n-exempt -- ENG-1234 [ttl=2026-12-31]
        default: () => `cms.components.${name}.label`,
      },
    ],
    actions: [
      {
        type: "add",
        path: `packages/ui/src/components/${layer}/${name}.tsx`,
        template: `import * as React from 'react';
import { useTranslations } from '@acme/i18n';

export interface ${name}Props {}

export const ${name}: React.FC<${name}Props> = () => {
  const t = useTranslations();
  return <div>{t('{{firstKey i18nKeys}}')}</div>;
};
`,
      },
      {
        type: "add",
        path: `packages/ui/src/components/${layer}/${name}.test.tsx`,
        template: `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';
import en from '@acme/i18n/en.json';
import { TranslationsProvider } from '@acme/i18n';

describe('${name}', () => {
  it('renders', () => {
    render(
      <TranslationsProvider messages={en}>
        <${name} />
      </TranslationsProvider>
    );
    expect(screen.getByText(en['{{firstKey i18nKeys}}'])).toBeInTheDocument();
  });
});
`,
      },
      {
        type: "add",
        path: `packages/ui/src/components/${layer}/${name}.stories.tsx`,
        template: `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';
import en from '@acme/i18n/en.json';
import { TranslationsProvider } from '@acme/i18n';

const meta: Meta<typeof ${name}> = {
  title: '${layer}/${name}',
  component: ${name},
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TranslationsProvider messages={en}>
        <Story />
      </TranslationsProvider>
    ),
  ],
};
export default meta;
export const Default: StoryObj<typeof ${name}> = {};
`,
      },
      {
        type: "seedI18n",
      },
    ],
  });

  // Non-interactive default for i18n keys so generated tests/stories render
  const defaultKeys = `cms.components.${name}.label`;
  await plop.getGenerator("component").runActions({ i18nKeys: defaultKeys });
}

run();
