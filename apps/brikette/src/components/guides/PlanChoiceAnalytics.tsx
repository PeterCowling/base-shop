// src/components/guides/PlanChoiceAnalytics.tsx
import { useEffect } from "react";

import { IS_DEV } from "@/config/env";

type PlanChoiceDetail = {
  plan?: string;
};

export default function PlanChoiceAnalytics(): null {
  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<PlanChoiceDetail>;
      const detail: PlanChoiceDetail = ce.detail ?? {};
      const path = (() => {
        if (typeof window === "undefined") {
          return "/";
        }

        const { location } = window;

        if (!location) {
          return "/";
        }

        if (typeof location.href === "string" && location.href.length > 0) {
          try {
            const parsed = new URL(location.href);
            if (parsed.pathname) {
              return parsed.pathname;
            }
          } catch {
            // ignore and fall back to other checks
          }
        }

        if (typeof location.pathname === "string" && location.pathname.length > 0) {
          return location.pathname;
        }

        return "/";
      })();
      try {
        const w = window as Window & { dataLayer?: Array<Record<string, unknown>> };
        w.dataLayer = w.dataLayer ?? [];
        w.dataLayer.push({
          event: "plan_choice",
          plan: detail.plan,
          path,
        });
      } catch {
        if (IS_DEV) {
          console.info("plan_choice", { plan: detail.plan, path });
        }
      }
    }

    window.addEventListener("plan-choice", handler as EventListener);
    return () => window.removeEventListener("plan-choice", handler as EventListener);
  }, []);

  return null;
}
