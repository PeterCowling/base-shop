import { startReverseLogisticsService } from "@acme/platform-machine";
startReverseLogisticsService().catch((err) => {
  console.error(err);
  process.exit(1);
});
