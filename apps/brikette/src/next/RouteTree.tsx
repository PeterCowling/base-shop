import React, { useMemo } from "react";
import dynamic from "next/dynamic";

import { RouteDataProvider } from "@/compat/router-state";
import { routeModules } from "@/compat/route-modules";
import type { ResolvedMatch } from "@/compat/route-runtime";

const componentCache = new Map<string, React.ComponentType<Record<string, unknown>>>();

const getRouteComponent = (file: string): React.ComponentType<Record<string, unknown>> => {
  const cached = componentCache.get(file);
  if (cached) return cached;

  const loader = routeModules[file];
  if (!loader) {
    const Missing = () => null;
    componentCache.set(file, Missing);
    return Missing;
  }

  const Component = dynamic(() => loader().then((mod) => mod.default ?? (() => null)), {
    ssr: true,
  });
  componentCache.set(file, Component);
  return Component;
};

const buildRouteTree = (matches: ResolvedMatch[]): React.ReactNode => {
  let outlet: React.ReactNode = null;
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i];
    if (!match) continue;
    const Component = getRouteComponent(match.file);
    const matchId = match.id ?? match.file ?? `match-${i}`;
    outlet = (
      <RouteDataProvider key={matchId} id={matchId} data={match.data} outlet={outlet}>
        <Component />
      </RouteDataProvider>
    );
  }
  return outlet;
};

type RouteTreeProps = {
  matches: ResolvedMatch[];
};

export default function RouteTree({ matches }: RouteTreeProps): JSX.Element {
  const content = useMemo(() => buildRouteTree(matches), [matches]);
  return <>{content}</>;
}
