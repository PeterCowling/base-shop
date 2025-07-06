// eslint.config.js
import { fixupPluginRules } from "@eslint/compat";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    plugins: {
      "react-hooks": fixupPluginRules(reactHooks),
    },
    rules: {
      // Re-export the legacy preset rules but with
      // getSource() → sourceCode.getText() rewired.
      ...reactHooks.configs.recommended.rules,
    },
  },
];
