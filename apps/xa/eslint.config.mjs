import rootConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["postcss.config.cjs", "next.config.mjs", "public/sw.js"],
  },
  ...rootConfig,
];

export default config;
