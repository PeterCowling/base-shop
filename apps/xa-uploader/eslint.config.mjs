import rootConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["postcss.config.cjs", "next.config.mjs"],
  },
  ...rootConfig,
];

export default config;

