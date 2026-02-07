import { useMemo } from "react";

import { romeRoutes } from "./routes-data";
import type {
  Direction,
  PreferenceKey,
  RouteOption,
  ScoreResult,
} from "./types";

interface UseRomeRouteFilterArgs {
  direction: Direction;
  selected: ReadonlySet<PreferenceKey>;
}

export function useRomeRouteFilter({
  direction,
  selected,
}: UseRomeRouteFilterArgs): {
  routes: RouteOption[];
  top: ScoreResult | null;
  scoreAll: ScoreResult[];
} {
  const routes = useMemo(
    () => romeRoutes.filter((route) => route.direction === direction),
    [direction],
  );

  const scoreAll = useMemo<ScoreResult[]>(() => {
    const has = (key: PreferenceKey) => selected.has(key);

    const scored = routes.map((route) => {
      let score = 0;
      const reasonKeys: string[] = [];

      if (has("cheapest")) {
        if (route.mode === "bus" || route.mode === "bus-train") {
          score += 2;
          reasonKeys.push("romePlanner.reasons.cheapest.busTrain");
        }
        if (route.mode === "ferry") {
          score -= 2;
          reasonKeys.push("romePlanner.reasons.cheapest.ferry");
        }
      }

      if (has("scenic") && route.mode === "ferry") {
        score += 2;
        reasonKeys.push("romePlanner.reasons.scenic.ferry");
      }

      if (has("heavy_luggage")) {
        if (direction === "from-rome" && route.mode === "ferry") {
          score -= 2;
          reasonKeys.push("romePlanner.reasons.heavy_luggage.ferryFromRome");
        }
        if (direction === "from-rome" && (route.mode === "bus" || route.mode === "bus-train")) {
          score += 1;
          reasonKeys.push("romePlanner.reasons.heavy_luggage.busStopClose");
        }
      }

      return { route, score, reasonKeys } satisfies ScoreResult;
    });

    return scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.route.changes !== b.route.changes) {
        return a.route.changes - b.route.changes;
      }

      return a.route.titleKey.localeCompare(b.route.titleKey);
    });
  }, [direction, routes, selected]);

  const top = scoreAll[0] ?? null;
  const visibleRoutes = top
    ? scoreAll.slice(1).map(({ route }) => route)
    : scoreAll.map(({ route }) => route);

  return { routes: visibleRoutes, top, scoreAll };
}
