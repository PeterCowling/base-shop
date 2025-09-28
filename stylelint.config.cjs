// stylelint.config.cjs — Phase 1 token enforcement in CSS (no TS plugin)
module.exports = {
  plugins: ["stylelint-declaration-strict-value"],
  overrides: [
    {
      files: ["apps/**/src/**/*.css", "packages/ui/src/**/*.css"],
      rules: {
        // Enforce tokens / fluid functions for spacing and radius
        "scale-unlimited/declaration-strict-value": [
          [
            "/^(margin|margin-block|margin-inline|margin-(top|right|bottom|left))$/",
            "/^(padding|padding-block|padding-inline|padding-(top|right|bottom|left))$/",
            "/^(gap|row-gap|column-gap)$/",
            "/^border-radius$/",
          ],
          { ignoreValues: ["inherit", "initial", "unset", "var", "clamp", "min", "max"] },
        ],
      },
    },
  ],
};

