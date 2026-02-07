"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Cluster, Stack } from "@acme/design-system/primitives";

import type { StageBQuoteBasketMeta } from "./stageBHelpers";
import type { CandidateDetailStrings } from "./types";

type QuoteBasketProfile = {
  id: string;
  name: string;
  profileType: string | null;
  origin: string | null;
  destination: string | null;
  destinationType: string | null;
  incoterm: string | null;
  cartonCount: number | null;
  unitsPerCarton: number | null;
  weightKg: number | null;
  cbm: number | null;
  dimensionsCm: string | null;
  hazmatFlag: boolean;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function formatProfileLabel(profile: QuoteBasketProfile): string {
  const route = [profile.origin, profile.destination].filter(Boolean).join(" → ");
  const cartons =
    profile.cartonCount !== null && profile.cartonCount !== undefined
      ? `${profile.cartonCount} cartons`
      : null;
  const units =
    profile.unitsPerCarton !== null && profile.unitsPerCarton !== undefined
      ? `${profile.unitsPerCarton}/carton`
      : null;
  const parts = [profile.name, route, cartons, units].filter(Boolean);
  return parts.length > 0 ? parts.join(" | ") : profile.name;
}

function formatDecimal(value: number): string {
  const rounded = Number(value.toFixed(4));
  return Number.isFinite(rounded) ? String(rounded) : String(value);
}

function buildQuoteBasketMeta(profile: QuoteBasketProfile): StageBQuoteBasketMeta {
  return {
    profileId: profile.id,
    name: profile.name,
    profileType: profile.profileType,
    origin: profile.origin,
    destination: profile.destination,
    destinationType: profile.destinationType,
    incoterm: profile.incoterm,
    cartonCount: profile.cartonCount,
    unitsPerCarton: profile.unitsPerCarton,
    weightKg: profile.weightKg,
    cbm: profile.cbm,
    dimensionsCm: profile.dimensionsCm,
    hazmatFlag: profile.hazmatFlag,
    notes: profile.notes,
  };
}

function buildPrefill(profile: QuoteBasketProfile): {
  unitsPerCarton?: string;
  weightPerUnitKg?: string;
  volumePerUnitCbm?: string;
  incoterms?: string;
} {
  const cartonCount = profile.cartonCount ?? null;
  const unitsPerCarton = profile.unitsPerCarton ?? null;
  const totalUnits =
    cartonCount !== null &&
    unitsPerCarton !== null &&
    cartonCount > 0 &&
    unitsPerCarton > 0
      ? cartonCount * unitsPerCarton
      : null;

  const weightPerUnit =
    totalUnits && profile.weightKg
      ? profile.weightKg / totalUnits
      : null;
  const volumePerUnit =
    totalUnits && profile.cbm ? profile.cbm / totalUnits : null;

  return {
    ...(unitsPerCarton ? { unitsPerCarton: String(unitsPerCarton) } : {}),
    ...(weightPerUnit ? { weightPerUnitKg: formatDecimal(weightPerUnit) } : {}),
    ...(volumePerUnit ? { volumePerUnitCbm: formatDecimal(volumePerUnit) } : {}),
    ...(profile.incoterm ? { incoterms: profile.incoterm } : {}),
  };
}

export default function StageBQuoteBasketApplyCard({
  quoteBasket,
  disabled,
  strings,
  notAvailable,
  onApplied,
}: {
  quoteBasket: StageBQuoteBasketMeta | null;
  disabled: boolean;
  strings: CandidateDetailStrings["stageB"];
  notAvailable: string;
  onApplied: (
    meta: StageBQuoteBasketMeta,
    prefill: {
      unitsPerCarton?: string;
      weightPerUnitKg?: string;
      volumePerUnitCbm?: string;
      incoterms?: string;
    },
  ) => void;
}) {
  const [profiles, setProfiles] = useState<QuoteBasketProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [applying, setApplying] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/logistics/quote-baskets?limit=200");
      if (!response.ok) {
        setMessage({ tone: "error", text: strings.quoteBasket.errorLoad });
        return;
      }
      const data = (await response.json()) as {
        ok?: boolean;
        profiles?: QuoteBasketProfile[];
      };
      if (data.ok && Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      } else {
        setMessage({ tone: "error", text: strings.quoteBasket.errorLoad });
      }
    } catch (error) {
      console.error(error);
      setMessage({ tone: "error", text: strings.quoteBasket.errorLoad });
    } finally {
      setLoading(false);
    }
  }, [strings.quoteBasket.errorLoad]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) ?? null,
    [profiles, selectedId],
  );

  const applyProfile = useCallback(() => {
    if (!selectedProfile) {
      setMessage({ tone: "error", text: strings.quoteBasket.errorApply });
      return;
    }
    setApplying(true);
    setMessage(null);
    const meta = buildQuoteBasketMeta(selectedProfile);
    const prefill = buildPrefill(selectedProfile);
    onApplied(meta, prefill);
    setMessage({ tone: "success", text: strings.quoteBasket.successApply });
    setApplying(false);
  }, [onApplied, selectedProfile, strings.quoteBasket.errorApply, strings.quoteBasket.successApply]);

  const appliedSummary = quoteBasket
    ? `${quoteBasket.name ?? notAvailable} | ${
        quoteBasket.origin ?? notAvailable
      } → ${quoteBasket.destination ?? notAvailable}`
    : strings.quoteBasket.appliedEmpty;

  const appliedUnits =
    quoteBasket?.unitsPerCarton !== null && quoteBasket?.unitsPerCarton !== undefined
      ? String(quoteBasket.unitsPerCarton)
      : notAvailable;
  const appliedWeight =
    quoteBasket?.weightKg !== null && quoteBasket?.weightKg !== undefined
      ? String(quoteBasket.weightKg)
      : notAvailable;
  const appliedVolume =
    quoteBasket?.cbm !== null && quoteBasket?.cbm !== undefined
      ? String(quoteBasket.cbm)
      : notAvailable;
  const appliedIncoterms = quoteBasket?.incoterm ?? notAvailable;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.quoteBasket.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.quoteBasket.title}
        </h2>
      </Stack>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.quoteBasket.selectLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            disabled={disabled || loading || applying}
          >
            <option value="">{strings.quoteBasket.selectPlaceholder}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {formatProfileLabel(profile)}
              </option>
            ))}
          </select>
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {message ? message.text : strings.quoteBasket.help}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={applyProfile}
            disabled={disabled || loading || applying || profiles.length === 0}
          >
            {strings.quoteBasket.applyLabel}
          </button>
        </Cluster>
      </div>

      <div className="mt-4 rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-xs text-foreground/70">
        <div className="text-foreground/60">{strings.quoteBasket.appliedLabel}</div>
        <div className="mt-1 font-semibold">{appliedSummary}</div>
        <div className="mt-2 grid gap-2 text-foreground/60 md:grid-cols-2">
          <div>
            {strings.quoteBasket.summaryUnits}:{" "}
            <span className="text-foreground">{appliedUnits}</span>
          </div>
          <div>
            {strings.quoteBasket.summaryWeight}:{" "}
            <span className="text-foreground">{appliedWeight}</span>
          </div>
          <div>
            {strings.quoteBasket.summaryVolume}:{" "}
            <span className="text-foreground">{appliedVolume}</span>
          </div>
          <div>
            {strings.quoteBasket.summaryIncoterms}:{" "}
            <span className="text-foreground">{appliedIncoterms}</span>
          </div>
        </div>
        {loading && profiles.length === 0 ? (
          <div className="mt-2 text-foreground/60">{strings.quoteBasket.loading}</div>
        ) : null}
        {!loading && profiles.length === 0 ? (
          <div className="mt-2 text-foreground/60">{strings.quoteBasket.empty}</div>
        ) : null}
      </div>
    </section>
  );
}
