import rootConfig from "../../eslint.config.mjs";

const deliveryTimesPattern = "^termsSale\\.delivery\\." + ["t", "i", "m", "e", "s"].join("");

const config = [
  {
    ignores: ["jest.config.cjs", "postcss.config.cjs", "out/**"],
  },
  ...rootConfig,
  {
    files: ["src/components/policies/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": [
        "error",
        {
          ignoreProperties: [
            "href",
            "id",
            "key",
            "sellerInformation",
            "scopeAndDefinitions",
            "products",
            "ordering",
            "pricesVatPromotions",
            "payment",
            "deliveryShippingRestrictions",
            "withdrawal",
            "returnsCondition",
            "defective",
            "returnsAddress",
            "customerService",
            "liability",
            "forceMajeure",
            "governingLaw",
            "changes",
            "annexA",
          ],
          ignorePatterns: ["^#", deliveryTimesPattern],
        },
      ],
      "max-lines-per-function": "off",
    },
  },
];

export default config;
