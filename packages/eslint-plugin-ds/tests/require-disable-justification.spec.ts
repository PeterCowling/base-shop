import { RuleTester } from "eslint";

// ESLint@9 RuleTester uses structuredClone in some Node versions; provide minimal polyfill
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).structuredClone = (globalThis as any).structuredClone || ((v: any) => JSON.parse(JSON.stringify(v)));

const rule = require("../src/rules/require-disable-justification.ts").default as typeof import("../src/rules/require-disable-justification").default;

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
});

tester.run("require-disable-justification", rule, {
  valid: [
    {
      code: "// eslint-disable-next-line no-console -- ABC-123",
    },
    {
      code: "/* eslint-disable eqeqeq -- ABC-123 ttl=2099-12-31 */\nconst x = 1;",
    },
    {
      code: "// eslint-disable-line no-console -- TEAM-42 Some reason",
      options: [{ ticketPattern: "[A-Z]+-\\d+" }],
    },
  ],
  invalid: [
    {
      code: "// eslint-disable-next-line no-console",
      errors: [{ messageId: "missingJustification" }],
    },
    {
      code: "/* eslint-disable eqeqeq */ const y = 2;",
      errors: [{ messageId: "missingJustification" }],
    },
    {
      code: "// eslint-disable-line no-console -- missing ticket text only",
      errors: [{ messageId: "missingTicket" }],
    },
    {
      code: "// eslint-disable -- nothing",
      errors: [{ messageId: "missingTicket" }],
    },
  ],
});
