"use server";

// apps/cms/src/actions/maintenance.server.ts

import {
  startMaintenanceScheduler,
  runMaintenanceScan,
} from "@acme/platform-machine/maintenanceScheduler";
import { logger } from "@platform-core/utils";

let timer: NodeJS.Timeout | undefined;

export async function updateMaintenanceSchedule(formData: FormData) {
  const freqStr = formData.get("frequency");
  const freq = Number(freqStr);
  if (!freq || freq <= 0) return;
  if (timer) {
    clearInterval(timer);
  }
  const initial = startMaintenanceScheduler();
  clearInterval(initial);
  const run = () =>
    runMaintenanceScan().catch((err: unknown) =>
      logger.error("maintenance scan failed", { err }),
    );
  timer = setInterval(run, freq);
  timer.unref?.();
}
