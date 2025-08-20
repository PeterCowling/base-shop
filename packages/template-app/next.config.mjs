// packages/template-app/next.config.mjs
// Re-export shared Next.js configuration
export { default } from "@acme/next-config/next.config.mjs";


export default { transpilePackages: ["@acme/ui","@acme/platform-core"] };
