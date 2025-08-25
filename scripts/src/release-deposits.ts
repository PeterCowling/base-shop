import { releaseDepositsOnce } from "@acme/platform-machine";

releaseDepositsOnce().catch((err) => {
  console.error(err);
  process.exit(1);
});
