import rootConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["postcss.config.cjs", "next.config.mjs", "public/sw.js"],
  },
  ...rootConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // XA-B is in active migration; keep these as non-blocking while refactors land.
      "ds/no-raw-color": "warn",
      "ds/no-raw-tailwind-color": "warn",
      "max-lines-per-function": "off",
      complexity: "off",
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "import/first": "warn",
      "import/newline-after-import": "warn",
      "import/no-duplicates": "warn",
      "ds/no-raw-font": "warn",
      "react/no-unescaped-entities": "warn",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message:
            "Use centralized design-system controls (Button/IconButton) instead of native <button> in xa-b.",
        },
        {
          selector: "JSXOpeningElement[name.name='input']",
          message:
            "Use centralized design-system controls (Input) instead of native <input> in xa-b.",
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message:
            "Use centralized design-system controls (Textarea) instead of native <textarea> in xa-b.",
        },
      ],
    },
  },
];

export default config;
