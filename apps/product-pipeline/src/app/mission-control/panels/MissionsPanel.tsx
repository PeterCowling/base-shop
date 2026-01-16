"use client";

import { Cluster, Grid, Stack } from "@ui/components/atoms/primitives";
import type { MissionActionResult, MissionLoadout } from "../types";

type MissionId = "triage-blitz" | "promotion-sortie" | "market-sweep";

type MissionsStrings = {
  label: string;
  title: string;
  busyLabel: string;
  readyLabel: string;
  resultSuccessLabel: string;
  resultErrorLabel: string;
  runningLabel: string;
  metaTargets: string;
  metaPromotionLimit: string;
  metaQueue: string;
  triageBlitz: { title: string; description: string; cta: string };
  promotionSortie: { title: string; description: string; cta: string };
  marketSweep: { title: string; description: string; cta: string };
};

function resultTone(ok: boolean): string {
  return ok ? "text-emerald-700" : "text-rose-700";
}

export default function MissionsPanel({
  strings,
  loadout,
  busy,
  result,
  onRunMission,
}: {
  strings: Record<string, unknown>;
  loadout: MissionLoadout;
  busy: boolean;
  result: MissionActionResult | null;
  onRunMission: (mission: MissionId) => Promise<void>;
}) {
  const s = strings as MissionsStrings;
  const triageMeta = s.metaTargets.replace(
    "{count}",
    String(loadout.triageLeadCount),
  );
  const promotionMeta = s.metaPromotionLimit.replace(
    "{count}",
    String(loadout.promotionLimit),
  );
  const sweepMeta = s.metaQueue.replace(
    "{count}",
    String(loadout.marketSweepCandidateCount),
  );

  return (
    <section className="pp-card p-6">
      <Cluster justify="between" alignY="start" className="gap-4">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {s.label}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
        </Stack>
        <span className="pp-chip">{busy ? s.busyLabel : s.readyLabel}</span>
      </Cluster>

      {result?.summary && (
        <div className="mt-4 rounded-2xl border border-border-1 bg-surface-2 p-3 text-sm">
          <span className={`font-semibold ${resultTone(result.ok)}`}>
            {result.ok ? s.resultSuccessLabel : s.resultErrorLabel}
          </span>
          <span className="ms-2 text-foreground/70">{result.summary}</span>
        </div>
      )}

      <Grid cols={1} gap={4} className="mt-6 md:grid-cols-3">
        <MissionCard
          title={s.triageBlitz.title}
          description={s.triageBlitz.description}
          meta={triageMeta}
          cta={s.triageBlitz.cta}
          runningLabel={s.runningLabel}
          busy={busy}
          onClick={() => onRunMission("triage-blitz")}
        />
        <MissionCard
          title={s.promotionSortie.title}
          description={s.promotionSortie.description}
          meta={promotionMeta}
          cta={s.promotionSortie.cta}
          runningLabel={s.runningLabel}
          busy={busy}
          onClick={() => onRunMission("promotion-sortie")}
        />
        <MissionCard
          title={s.marketSweep.title}
          description={s.marketSweep.description}
          meta={sweepMeta}
          cta={s.marketSweep.cta}
          runningLabel={s.runningLabel}
          busy={busy}
          onClick={() => onRunMission("market-sweep")}
        />
      </Grid>
    </section>
  );
}

function MissionCard({
  title,
  description,
  meta,
  cta,
  runningLabel,
  busy,
  onClick,
}: {
  title: string;
  description: string;
  meta: string;
  cta: string;
  runningLabel: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border-1 bg-surface-2 p-5">
      <Stack gap={2}>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-foreground/70">{description}</p>
        <p className="text-xs text-foreground/60">{meta}</p>
        <button
          type="button"
          className="mt-2 min-h-11 min-w-11 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          onClick={onClick}
          disabled={busy}
        >
          {busy ? runningLabel : cta}
        </button>
      </Stack>
    </div>
  );
}
