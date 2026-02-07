import { runSeoAudit } from "@acme/lib/seoAudit";

const argvPath = process.argv[1] ?? "";
const isDirectRun =
  // i18n-exempt -- OPS-0001 [ttl=2026-06-30]
  argvPath.endsWith("/seo-audit.ts") ||
  // i18n-exempt -- OPS-0001 [ttl=2026-06-30]
  argvPath.endsWith("\\seo-audit.ts") ||
  // i18n-exempt -- OPS-0001 [ttl=2026-06-30]
  argvPath.endsWith("/seo-audit.js") ||
  // i18n-exempt -- OPS-0001 [ttl=2026-06-30]
  argvPath.endsWith("\\seo-audit.js");

// Allow the script to be invoked directly from the command line.
if (isDirectRun) {
  const url = process.argv[2] || "http://localhost:3000";
  runSeoAudit(url)
    .then((res) => {
      console.log(JSON.stringify(res));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
