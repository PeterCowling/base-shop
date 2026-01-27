/**
 * Transport drop-in block handler (TASK-04).
 *
 * Renders transport-specific drop-in components like Chiesa Nuova arrivals/departures.
 * Used by transport routes that need embedded travel information.
 */

import ChiesaNuovaArrivalDropIn from "@/routes/how-to-get-here/chiesaNuovaArrivals/DropIn";

import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import type { TransportDropInBlockOptions } from "../types";

import type { BlockAccumulator } from "./BlockAccumulator";

/**
 * Renders the specified transport drop-in component.
 * Currently supports:
 * - chiesaNuovaArrivals: Chiesa Nuova arrivals timetable
 */
export function applyTransportDropInBlock(
  acc: BlockAccumulator,
  options: TransportDropInBlockOptions,
): void {
  acc.addSlot("after", (context: GuideSeoTemplateContext) => {
    const { component } = options;
    const { lang } = context;

    switch (component) {
      case "chiesaNuovaArrivals":
        return <ChiesaNuovaArrivalDropIn lang={lang} />;
      default:
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.warn(`[transportDropInBlock] Unsupported component: ${component}`);
        }
        return null;
    }
  });
}
