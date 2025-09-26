// Minimal logical properties plugin for Tailwind (CommonJS)
// Provides ms-*/me-* utilities mapping to margin-inline-start/end
const plugin = require("tailwindcss/plugin");

module.exports = plugin(({ matchUtilities, theme }) => {
  const spacing = theme("spacing");
  matchUtilities(
    {
      ms: (value) => ({ marginInlineStart: value }),
      me: (value) => ({ marginInlineEnd: value }),
    },
    { values: spacing, supportsNegativeValues: true }
  );
});
