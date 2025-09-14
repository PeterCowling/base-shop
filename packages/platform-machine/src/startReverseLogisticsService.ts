/* eslint-disable security/detect-non-literal-fs-filename -- Paths are derived from internal configuration */
import { readdir } from "fs/promises";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { logger } from "@platform-core/utils";
import { processReverseLogisticsEventsOnce } from "./processReverseLogisticsEventsOnce";
import { resolveConfig, type ReverseLogisticsConfig } from "./resolveConfig";

const DATA_ROOT = resolveDataRoot();

export async function startReverseLogisticsService(
  configs: Record<string, Partial<ReverseLogisticsConfig>> = {},
  dataRoot: string = DATA_ROOT,
  processor: (
    shopId: string,
    dataRoot?: string,
  ) => Promise<void> = processReverseLogisticsEventsOnce,
): Promise<() => void> {
  try {
    const shops = await readdir(dataRoot);
    const timers: NodeJS.Timeout[] = [];

    await Promise.all(
      shops.map(async (shop) => {
        const cfg = await resolveConfig(shop, dataRoot, configs[shop]);
        if (!cfg.enabled) return;

        async function run() {
          try {
            await processor(shop, dataRoot);
          } catch (err) {
            logger.error("reverse logistics processing failed", {
              shopId: shop,
              err,
            });
          }
        }

        await run();
        timers.push(setInterval(run, cfg.intervalMinutes * 60 * 1000));
      }),
    );

    return () => timers.forEach((t) => clearInterval(t));
  } catch (err) {
    logger.error("failed to start reverse logistics service", { err });
    throw err;
  }
}

if (process.env.NODE_ENV !== "test") {
  startReverseLogisticsService().catch((err) =>
    logger.error("failed to start reverse logistics service", { err }),
  );
}

