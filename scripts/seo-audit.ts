import { fileURLToPath } from "node:url";
import { runSeoAudit } from "@acme/lib/seoAudit";

const __filename = fileURLToPath(import.meta.url);

// Allow the script to be invoked directly from the command line.
if (process.argv[1] === __filename) {
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
