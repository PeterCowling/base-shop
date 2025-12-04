"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/atoms";
import { cn } from "@ui/utils/style";
import type { LaunchPanelData } from "../hooks/useConfiguratorDashboardState";
import { ButtonElement, CardRoot, CardSection, TagElement } from "./DashboardPrimitives";
import { Inline } from "@ui/components/atoms/primitives";
import { track } from "@acme/telemetry";
import { CmsLaunchChecklist, type CmsLaunchStatus } from "@ui/components/cms"; // UI: @ui/components/cms/CmsLaunchChecklist
import { useTranslations } from "@acme/i18n";

type LaunchPanelProps = LaunchPanelData;

export function LaunchPanel({
  allRequiredDone,
  serverReady,
  serverBlockingLabels,
  beatTarget,
  tooltipText,
  onLaunch,
  launchStatus,
  launchError,
  failedStepLink,
  launchChecklist,
  launchEnvSummary,
  launchEnv,
  onChangeLaunchEnv,
  smokeSummary,
  shopId,
  prodGateAllowed,
  prodGateReasons,
  stageSmokeStatus,
  stageSmokeAt,
  qaAckRequired,
  qaAckCompleted,
  onQaAcknowledge,
  qaAckStatus = "idle",
  qaAckError,
  missingRequiredSteps,
  onMissingStepsResolved,
  onRerunSmoke,
  rerunSmokeStatus = "idle",
  rerunSmokeMessage,
}: LaunchPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const ready = allRequiredDone && serverReady;
  const blockingText =
    serverBlockingLabels.length > 0
      ? `Blocking checks: ${serverBlockingLabels.join(", ")}`
      : tooltipText;
  const [showConfetti, setShowConfetti] = useState(false);
  const [qaNote, setQaNote] = useState("");
  const gateBlocked = prodGateAllowed === false;
  const stageSmokeLabel = stageSmokeStatus
    ? t(`cms.configurator.launchPanel.stageSmoke.status.${stageSmokeStatus}`, {
        status: stageSmokeStatus,
      }) as string
    : null;
  const gateReasons =
    prodGateReasons && prodGateReasons.length > 0
      ? prodGateReasons.map((reason) =>
          reason === "stage-tests"
            ? (t("cms.configurator.launchPanel.stageGate.reason.stageTests") as string)
            : (t("cms.configurator.launchPanel.stageGate.reason.qaAck") as string),
        )
      : null;

  useEffect(() => {
    if (beatTarget) {
      setShowConfetti(true);
      const id = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(id);
    }
    return;
  }, [beatTarget]);

  useEffect(() => {
    if (qaAckCompleted) {
      setQaNote("");
    }
  }, [qaAckCompleted]);
  return (
    <CardRoot
      className="border border-primary/20 bg-surface-2 text-foreground shadow-elevation-5"
      data-tour="quest-launch"
    >
      <CardSection className="relative space-y-5">
        {missingRequiredSteps && missingRequiredSteps.length > 0 && (
          <div className="rounded-xl border border-warning/40 bg-warning-soft/40 px-3 py-2 text-sm text-foreground">
            <div className="flex items-start gap-3">
              <span role="img" aria-hidden>
                ⚠️
              </span>
              <div className="space-y-1">
                <p className="font-semibold">
                  {t("cms.configurator.launch.tooltip.completeRequired", {
                    list: missingRequiredSteps.map((s) => s.label).join(", "),
                  }) as string}
                </p>
                {missingRequiredSteps[0]?.id && (
                  <Link
                    className="inline-flex text-sm font-semibold text-primary underline"
                    href={`/cms/configurator/${missingRequiredSteps[0].id}`}
                    onClick={() => {
                      onMissingStepsResolved?.();
                      if (shopId) {
                        track("build_flow_exit", {
                          shopId,
                          reason: "missing-steps",
                          surface: "launch-panel",
                        });
                      }
                    }}
                  >
                    {t("cms.configurator.launchPanel.error.reviewLink", {
                      label: missingRequiredSteps[0].label,
                    }) as string}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        {gateBlocked && (
          <div className="rounded-xl border border-warning/40 bg-warning-soft/30 px-3 py-2 text-sm text-foreground">
            <div className="space-y-1">
              <p className="font-semibold">
                {t("cms.configurator.launchPanel.stageGate.title") as string}
              </p>
              <p className="text-xs text-muted-foreground">
                {gateReasons && gateReasons.length > 0
                  ? gateReasons.join(" • ")
                  : (t("cms.configurator.launchPanel.stageGate.description") as string)}
              </p>
            </div>
          </div>
        )}
        {showConfetti && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-confetti pointer-events-none absolute inset-0">
              {"🎉 🎊 🎉 🎊 🎉 🎊".split(" ").map((emoji, idx) => (
                <span
                  key={idx}
                  className="absolute text-2xl"
                  style={{
                    left: `${(idx / 6) * 100}%`,
                    animationDelay: `${idx * 0.15}s`,
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}
        {showConfetti && (
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-10%) rotate(0deg); opacity: 1; }
              100% { transform: translateY(120%) rotate(540deg); opacity: 0; }
            }
            .animate-confetti span {
              animation: confetti-fall 2.5s ease-in forwards;
            }
          `}</style>
        )}
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {t("cms.configurator.launchPanel.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("cms.configurator.launchPanel.body")}
          </p>
        </div>
        {beatTarget && (
          <TagElement variant="success" className="w-fit">
            🎉 {t("cms.configurator.launchPanel.beatBadge")}
          </TagElement>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t("cms.configurator.launchPanel.targetEnvLabel")}
          </p>
          <div className="inline-flex overflow-hidden rounded-full border border-border/40 bg-surface-2 text-xs">
            {(["stage", "prod"] as const).map((env) => {
              const active = launchEnv === env;
              const disabled = env === "prod" && gateBlocked;
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => onChangeLaunchEnv(env)}
                  className={cn(
                    "px-3 py-1.5 uppercase tracking-wide",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-border/20",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                  disabled={disabled}
                >
                  {env}
                </button>
              );
            })}
          </div>
        </div>
        {smokeSummary && (
          <p className="text-xs text-muted-foreground">
            {smokeSummary}
          </p>
        )}
        {stageSmokeStatus && (
          <TagElement className="w-fit bg-border/40 px-2 py-1 text-xs">
            {t("cms.configurator.launchPanel.stageSmoke.label", {
              status: stageSmokeLabel ?? stageSmokeStatus,
            }) as string}
          </TagElement>
        )}
        {onRerunSmoke && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border/20 bg-surface-2 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {t("cms.configurator.launchPanel.environmentStatusHeading")}
            </p>
            <button
              type="button"
              onClick={() => onRerunSmoke()}
              className={cn(
                "text-xs font-semibold underline underline-offset-4",
                rerunSmokeStatus === "pending" && "opacity-60 cursor-wait",
              )}
              disabled={rerunSmokeStatus === "pending"}
            >
              {rerunSmokeStatus === "pending"
                ? t("cms.configurator.launchPanel.launchStatus.pending")
                : "Re-run smoke tests"}
            </button>
          </div>
        )}
        {(qaAckRequired || qaAckCompleted) && (
          <div className="space-y-2 rounded-xl border border-border/20 bg-surface-1 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {t("cms.configurator.launchPanel.qa.heading") as string}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("cms.configurator.launchPanel.qa.body") as string}
                </p>
                {stageSmokeAt && (
                  <p className="text-xs text-muted-foreground">
                    {t("cms.configurator.launchPanel.qa.lastStageSmoke", {
                      timestamp: new Date(stageSmokeAt).toLocaleString(),
                    }) as string}
                  </p>
                )}
              </div>
              {qaAckCompleted && (
                <TagElement variant="success" className="px-2 py-1 text-xs">
                  {t("cms.configurator.launchPanel.qa.recorded") as string}
                </TagElement>
              )}
            </div>
            {!qaAckCompleted && onQaAcknowledge && (
              <div className="space-y-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="qa-note"
                >
                  {t("cms.configurator.launchPanel.qa.noteLabel") as string}
                </label>
                <input
                  id="qa-note"
                  className="w-full rounded-md border border-border/50 bg-surface-2 px-2 py-1 text-sm"
                  placeholder={
                    t("cms.configurator.launchPanel.qa.notePlaceholder") as string
                  }
                  value={qaNote}
                  onChange={(e) => setQaNote(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <ButtonElement
                    variant="primary"
                    onClick={() => onQaAcknowledge(qaNote)}
                    disabled={qaAckStatus === "pending"}
                  >
                    {qaAckStatus === "pending"
                      ? (t("cms.configurator.launchPanel.qa.saving") as string)
                      : (t("cms.configurator.launchPanel.qa.cta") as string)}
                  </ButtonElement>
                  {qaAckError && (
                    <p className="text-xs text-error">{qaAckError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {launchChecklist && launchChecklist.length > 0 && (
          <CmsLaunchChecklist
            heading={String(t("cms.configurator.launchChecklist.heading"))}
            readyLabel={String(t("cms.configurator.launchChecklist.readyLabel"))}
            showReadyCelebration
            items={launchChecklist.map((item) => ({
              id: item.id,
              label: item.label,
              status: item.status as CmsLaunchStatus,
              statusLabel: item.statusLabel,
              fixLabel: item.fixLabel,
              onFix:
                item.status !== "complete" && item.fixLabel
                  ? () => {
                      if (shopId && item.exitReason) {
                        track("build_flow_exit", {
                          shopId,
                          reason: item.exitReason,
                          surface: "dashboard",
                        });
                      }
                      router.push(item.targetHref);
                    }
                  : undefined,
            }))}
          />
        )}
        <Tooltip text={blockingText}>
          <ButtonElement
            onClick={onLaunch}
            disabled={!ready}
            className={cn(
              "h-11 w-full px-5 text-sm font-semibold",
              !ready && "cursor-not-allowed opacity-60"
            )}
          >
            {t("cms.configurator.launchPanel.launchButton")}
          </ButtonElement>
        </Tooltip>
        {launchEnvSummary && launchEnvSummary.length > 0 && (
          <div className="space-y-2 rounded-xl border border-border/15 bg-surface-2 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("cms.configurator.launchPanel.environmentStatusHeading")}
            </p>
            <Inline wrap gap={2}>
              {launchEnvSummary.map(({ env, status }) => {
                const label =
                  status === "ok"
                    ? t("cms.configurator.launchPanel.environmentStatus.ready")
                    : status === "blocked"
                      ? t("cms.configurator.launchPanel.environmentStatus.blocked")
                      : t("cms.configurator.launchPanel.environmentStatus.warning");
                const variant: TagProps["variant"] =
                  status === "ok"
                    ? "success"
                    : status === "blocked"
                      ? "destructive"
                      : "warning";
                return (
                  <TagElement key={env} variant={variant}>
                    {env.toUpperCase()}: {label}
                  </TagElement>
                );
              })}
            </Inline>
          </div>
        )}
        {/* Removed extra helper text per UX request */}
        {launchStatus ? (
          <div className="space-y-3">
            {Object.entries(launchStatus).map(([key, status]) => (
              <Inline
                key={key}
                alignY="center"
                wrap
                className="justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-3 py-2"
              >
                <span className="min-w-0 text-sm font-medium">
                  {t(`cms.configurator.launchPanel.steps.${key as string}`)}
                </span>
                <TagElement
                  className="shrink-0"
                  variant={
                    status === "success"
                      ? "success"
                      : status === "failure"
                        ? "destructive"
                        : status === "pending"
                          ? "warning"
                          : "default"
                  }
                >
                  {status === "idle" &&
                    t("cms.configurator.launchPanel.launchStatus.idle")}
                  {status === "pending" &&
                    t("cms.configurator.launchPanel.launchStatus.pending")}
                  {status === "success" &&
                    t("cms.configurator.launchPanel.launchStatus.success")}
                  {status === "failure" &&
                    t("cms.configurator.launchPanel.launchStatus.failure")}
                </TagElement>
              </Inline>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border/15 bg-surface-2 px-3 py-2 text-sm text-muted-foreground">
            {t("cms.configurator.launchPanel.launchStatusPlaceholder")}
          </p>
        )}
        {launchError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            <p>{launchError}</p>
            {failedStepLink && (
              <p className="mt-1">
                <Link href={failedStepLink.href} className="underline">
                  {t("cms.configurator.launchPanel.error.reviewLink", {
                    label: failedStepLink.label,
                  })}
                </Link>{" "}
                {t("cms.configurator.launchPanel.error.retrySuffix")}
              </p>
            )}
          </div>
        )}
        {rerunSmokeStatus === "failure" && rerunSmokeMessage && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            <p>{rerunSmokeMessage}</p>
          </div>
        )}
        {rerunSmokeStatus === "success" && rerunSmokeMessage && (
          <div className="rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-success-foreground">
            <p>{rerunSmokeMessage}</p>
          </div>
        )}
      </CardSection>
    </CardRoot>
  );
}

export default LaunchPanel;
