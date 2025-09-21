"use client";

import Link from "next/link";
import { Tooltip } from "@/components/atoms";
import { cn } from "@ui/utils/style";
import type { TagProps } from "@ui/components/atoms/Tag";
import type { LaunchPanelData } from "../hooks/useConfiguratorDashboardState";
import { ButtonElement, CardRoot, CardSection, TagElement } from "./DashboardPrimitives";
import type { LaunchStepStatus } from "../hooks/useLaunchShop";

type LaunchPanelProps = LaunchPanelData;

const launchStatusMeta: Record<
  LaunchStepStatus,
  { label: string; variant: TagProps["variant"] }
> = {
  idle: { label: "Idle", variant: "default" },
  pending: { label: "Running", variant: "warning" },
  success: { label: "Complete", variant: "success" },
  failure: { label: "Failed", variant: "destructive" },
};

const launchStepLabels: Record<string, string> = {
  create: "Create shop",
  init: "Initialise workspace",
  deploy: "Deploy infrastructure",
  seed: "Seed demo data",
};

export function LaunchPanel({
  allRequiredDone,
  tooltipText,
  onLaunch,
  launchStatus,
  launchError,
  failedStepLink,
}: LaunchPanelProps) {
  return (
    <CardRoot className="border border-primary/20 bg-surface-2 text-primary-foreground shadow-2xl">
      <CardSection className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Launch readiness</h2>
          <p className="text-sm text-primary-foreground/70">
            When every essential step is marked complete, you can launch directly from here.
          </p>
        </div>
        <Tooltip text={tooltipText}>
          <ButtonElement
            onClick={onLaunch}
            disabled={!allRequiredDone}
            className={cn(
              "h-11 w-full px-5 text-sm font-semibold",
              !allRequiredDone && "cursor-not-allowed opacity-60"
            )}
          >
            Launch shop
          </ButtonElement>
        </Tooltip>
        {!allRequiredDone && (
          <p className="text-xs text-primary-foreground/70">
            Complete the remaining essential steps to unlock launch.
          </p>
        )}
        {launchStatus ? (
          <div className="space-y-3">
            {Object.entries(launchStatus).map(([key, status]) => (
              <div
                key={key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-3 py-2"
              >
                <span className="min-w-0 text-sm font-medium">
                  {launchStepLabels[key] ?? key}
                </span>
                <TagElement className="shrink-0" variant={launchStatusMeta[status].variant}>
                  {launchStatusMeta[status].label}
                </TagElement>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border/15 bg-surface-2 px-3 py-2 text-sm text-primary-foreground/70">
            Launch progress will appear here once you kick things off.
          </p>
        )}
        {launchError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            <p>{launchError}</p>
            {failedStepLink && (
              <p className="mt-1">
                <Link href={failedStepLink.href} className="underline">
                  Review {failedStepLink.label}
                </Link>{" "}
                and retry the launch.
              </p>
            )}
          </div>
        )}
      </CardSection>
    </CardRoot>
  );
}

export default LaunchPanel;
