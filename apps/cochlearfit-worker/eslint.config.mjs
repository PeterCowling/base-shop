import rootConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["dist", "wrangler.toml"],
  },
  ...rootConfig,
];

export default config;
