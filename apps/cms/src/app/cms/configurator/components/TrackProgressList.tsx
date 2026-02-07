"use client";

import type { TrackProgressItem } from "../hooks/useConfiguratorDashboardState";

import { CardRoot, CardSection, ProgressBar, TagElement } from "./DashboardPrimitives";

interface TrackProgressListProps {
  items: TrackProgressItem[];
}

export function TrackProgressList({ items }: TrackProgressListProps) {
  return (
    <CardRoot className="border border-border/60">
      <CardSection className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Experience arcs
          </h3>
          <p className="text-sm text-muted-foreground">
            Keep an eye on each track of the configurator to ensure nothing is overlooked.
          </p>
        </div>
        <div className="space-y-4">
          {items.map((track) => (
            <div
              key={track.key}
              className="space-y-2 rounded-xl border border-border/60 bg-surface-3 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {track.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {track.description}
                  </span>
                </div>
                <TagElement className="bg-muted text-muted-foreground" variant="default">
                  {track.done}/{track.total}
                </TagElement>
              </div>
              <ProgressBar value={track.percent} />
            </div>
          ))}
        </div>
      </CardSection>
    </CardRoot>
  );
}

export default TrackProgressList;
