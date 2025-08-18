# Template App Configuration

The Template App exposes shared configuration for Next.js, Tailwind CSS and
PostCSS so that individual shop applications don’t need to copy these files.

## Usage

In a shop application you can simply re-export the config files:

```js
// next.config.mjs
export { default } from "@acme/template-app/next.config.mjs";

// tailwind.config.mjs
export { default } from "@acme/template-app/tailwind.config.mjs";

// postcss.config.cjs
module.exports = require("@acme/template-app/postcss.config.cjs");
```

### TypeScript and Jest

New applications should also inherit the shared TypeScript and Jest presets from
`@acme/config` to avoid duplicating boilerplate.

```jsonc
// tsconfig.json
{
  "extends": "../config/tsconfig.app.json",
  "include": ["src/**/*", ".next/types/**/*.ts"]
}
```

```js
// jest.config.cjs
const preset = require("@acme/config/jest.preset.cjs");

module.exports = {
  ...preset,
  roots: ["<rootDir>/apps/my-app/src", "<rootDir>/apps/my-app/__tests__"],
};
```

## Extending

If a shop needs to customise these settings, import the base config and extend
it instead of copying the entire file:

```js
// Example: extend Next.js config
import baseConfig from "@acme/template-app/next.config.mjs";

export default {
  ...baseConfig,
  // overrides here
};

// Example: extend Tailwind config
import tailwind from "@acme/template-app/tailwind.config.mjs";

export default {
  ...tailwind,
  content: [...tailwind.content, "./src/extra/**/*.{ts,tsx}"],
};

// Example: extend PostCSS config
const postcss = require("@acme/template-app/postcss.config.cjs");

module.exports = {
  ...postcss,
  plugins: {
    ...postcss.plugins,
    // add additional plugins here
  },
};
```

This pattern keeps configuration logic in one place while still allowing each
shop to override pieces as needed.

