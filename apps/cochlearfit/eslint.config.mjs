import rootConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["jest.config.cjs", "postcss.config.cjs", "out/**"],
  },
  ...rootConfig,
];

export default config;
