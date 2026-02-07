"use server";

// apps/cms/src/actions/maintenance.server.ts

import { logger } from "@acme/platform-core/utils";
import {
  runMaintenanceScan,
  startMaintenanceScheduler,
} from "@acme/platform-machine/maintenanceScheduler";

let timer: NodeJS.Timeout | undefined;

export async function updateMaintenanceSchedule(formData: FormData) {
  const freqStr = formData.get("frequency");
  const freq = Number(freqStr);
  if (!freq || freq <= 0) return;
  if (timer) {
    clearInterval(timer);
  }
  const initial = startMaintenanceScheduler() as unknown as NodeJS.Timeout;
  clearInterval(initial);
  const run = () =>
    runMaintenanceScan().catch((err: unknown) =>
      logger.error("maintenance scan failed", { err }),
    );
  timer = setInterval(run, freq);
  timer.unref?.();
}
