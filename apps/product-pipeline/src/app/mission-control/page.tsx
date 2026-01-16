import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Stack } from "@ui/components/atoms/primitives";
import MissionControlClient from "./MissionControlClient";

export default async function MissionControlPage() {
  const t = await getTranslations("en");

  const strings = {
    hud: {
      label: t("pipeline.missionControl.hud.label"),
      title: t("pipeline.missionControl.hud.title"),
      levelLabel: t("pipeline.missionControl.hud.level"),
      streakLabel: t("pipeline.missionControl.hud.streak"),
      stageRunsTodayLabel: t("pipeline.missionControl.hud.stageRunsToday"),
      leadsNewLabel: t("pipeline.missionControl.hud.leadsNew"),
      candidatesLabel: t("pipeline.missionControl.hud.candidates"),
      artifactsLabel: t("pipeline.missionControl.hud.artifacts"),
      xpLabel: t("pipeline.missionControl.hud.xp"),
      nextLevelLabel: t("pipeline.missionControl.hud.nextLevel"),
      statusSyncing: t("pipeline.missionControl.hud.statusSyncing"),
      statusOffline: t("pipeline.missionControl.hud.statusOffline"),
      streakSummary: t("pipeline.missionControl.hud.streakSummary"),
      streakEmpty: t("pipeline.missionControl.hud.streakEmpty"),
      levelUpToast: t("pipeline.missionControl.hud.levelUpToast"),
    },
    missions: {
      label: t("pipeline.missionControl.missions.label"),
      title: t("pipeline.missionControl.missions.title"),
      busyLabel: t("pipeline.missionControl.missions.busy"),
      readyLabel: t("pipeline.missionControl.missions.ready"),
      resultSuccessLabel: t("pipeline.missionControl.missions.success"),
      resultErrorLabel: t("pipeline.missionControl.missions.error"),
      runningLabel: t("pipeline.missionControl.missions.running"),
      metaTargets: t("pipeline.missionControl.missions.meta.targets"),
      metaPromotionLimit: t("pipeline.missionControl.missions.meta.promotionLimit"),
      metaQueue: t("pipeline.missionControl.missions.meta.queue"),
      failureSummary: t("pipeline.missionControl.missions.failureSummary"),
      triageBlitz: {
        title: t("pipeline.missionControl.missions.triageBlitz.title"),
        description: t("pipeline.missionControl.missions.triageBlitz.description"),
        cta: t("pipeline.missionControl.missions.triageBlitz.cta"),
      },
      promotionSortie: {
        title: t("pipeline.missionControl.missions.promotionSortie.title"),
        description: t(
          "pipeline.missionControl.missions.promotionSortie.description",
        ),
        cta: t("pipeline.missionControl.missions.promotionSortie.cta"),
      },
      marketSweep: {
        title: t("pipeline.missionControl.missions.marketSweep.title"),
        description: t("pipeline.missionControl.missions.marketSweep.description"),
        cta: t("pipeline.missionControl.missions.marketSweep.cta"),
      },
    },
    loadout: {
      label: t("pipeline.missionControl.loadout.label"),
      title: t("pipeline.missionControl.loadout.title"),
      triageLeadCountLabel: t("pipeline.missionControl.loadout.triageLeadCount"),
      promotionLimitLabel: t("pipeline.missionControl.loadout.promotionLimit"),
      marketSweepCountLabel: t("pipeline.missionControl.loadout.marketSweepCount"),
      stageMKindLabel: t("pipeline.missionControl.loadout.stageM.kind"),
      stageMCaptureModeLabel: t("pipeline.missionControl.loadout.stageM.captureMode"),
      stageMCaptureProfileLabel: t(
        "pipeline.missionControl.loadout.stageM.captureProfile",
      ),
      stageMMarketplaceLabel: t("pipeline.missionControl.loadout.stageM.marketplace"),
      stageMMaxResultsLabel: t("pipeline.missionControl.loadout.stageM.maxResults"),
      stageMKindAmazonSearch: t("pipeline.candidate.stageM.kind.amazonSearch"),
      stageMKindAmazonListing: t("pipeline.candidate.stageM.kind.amazonListing"),
      stageMKindTaobaoListing: t("pipeline.candidate.stageM.kind.taobaoListing"),
      stageMCaptureModeRunner: t("pipeline.candidate.stageM.captureMode.runner"),
      stageMCaptureModeQueue: t("pipeline.candidate.stageM.captureMode.queue"),
      stageMCaptureProfileHelp: t("pipeline.candidate.stageM.captureProfile.help"),
    },
    map: {
      label: t("pipeline.missionControl.map.label"),
      title: t("pipeline.missionControl.map.title"),
      hint: t("pipeline.missionControl.map.hint"),
      mode2d: t("pipeline.missionControl.map.mode2d"),
      mode3d: t("pipeline.missionControl.map.mode3d"),
      webglUnavailable: t("pipeline.missionControl.map.webglUnavailable"),
      runsLabel: t("pipeline.missionControl.map.runsLabel"),
      nodeLabels: {
        P: t("pipeline.missionControl.map.nodes.P"),
        M: t("pipeline.missionControl.map.nodes.M"),
        S: t("pipeline.missionControl.map.nodes.S"),
        K: t("pipeline.missionControl.map.nodes.K"),
        L: t("pipeline.missionControl.map.nodes.L"),
      },
    },
    achievements: {
      label: t("pipeline.missionControl.achievements.label"),
      title: t("pipeline.missionControl.achievements.title"),
      first_scan: {
        title: t("pipeline.missionControl.achievements.first_scan.title"),
        description: t("pipeline.missionControl.achievements.first_scan.description"),
      },
      triage_trail: {
        title: t("pipeline.missionControl.achievements.triage_trail.title"),
        description: t(
          "pipeline.missionControl.achievements.triage_trail.description",
        ),
      },
      market_probe: {
        title: t("pipeline.missionControl.achievements.market_probe.title"),
        description: t(
          "pipeline.missionControl.achievements.market_probe.description",
        ),
      },
      loot_cache: {
        title: t("pipeline.missionControl.achievements.loot_cache.title"),
        description: t("pipeline.missionControl.achievements.loot_cache.description"),
      },
      streak_3: {
        title: t("pipeline.missionControl.achievements.streak_3.title"),
        description: t("pipeline.missionControl.achievements.streak_3.description"),
      },
    },
    battleLog: {
      label: t("pipeline.missionControl.battleLog.label"),
      title: t("pipeline.missionControl.battleLog.title"),
      empty: t("pipeline.missionControl.battleLog.empty"),
    },
    loot: {
      label: t("pipeline.missionControl.loot.label"),
      title: t("pipeline.missionControl.loot.title"),
      empty: t("pipeline.missionControl.loot.empty"),
      openArtifact: t("pipeline.missionControl.loot.openArtifact"),
    },
    runner: {
      label: t("pipeline.missionControl.runner.label"),
      title: t("pipeline.missionControl.runner.title"),
      statusLabel: t("pipeline.missionControl.runner.status"),
      statusReady: t("pipeline.missionControl.runner.ready"),
      statusStale: t("pipeline.missionControl.runner.stale"),
      statusUnknown: t("pipeline.missionControl.runner.unknown"),
      lastSeenLabel: t("pipeline.missionControl.runner.lastSeen"),
      modeLabel: t("pipeline.missionControl.runner.mode"),
      browserLabel: t("pipeline.missionControl.runner.browser"),
      sessionLabel: t("pipeline.missionControl.runner.session"),
    },
    notAvailable: t("pipeline.common.notAvailable"),
  };

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.missionControl.badge")}
        title={t("pipeline.missionControl.title")}
        subtitle={t("pipeline.missionControl.subtitle")}
      />
      <MissionControlClient strings={strings} />
    </Stack>
  );
}
