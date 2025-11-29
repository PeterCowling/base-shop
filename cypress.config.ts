// cypress.config.ts
// @ts-expect-error -- Cypress config is JS-only; TS types are not required for this entrypoint
export { default } from "./apps/cms/cypress.config.mjs";
