"use client";

import { useCallback, useEffect, useState } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";

import LaneActualsCreateCard from "./LaneActualsCreateCard";
import LaneEvidenceUploadCard from "./LaneEvidenceUploadCard";
import LaneVersionCreateCard from "./LaneVersionCreateCard";
import LaneVersionList from "./LaneVersionList";
import type { LaneDetail, LaneDetailStrings, LaneVersion } from "./types";

type LaneDetailResponse = {
  ok?: boolean;
  lane?: LaneDetail;
  versions?: LaneVersion[];
};

export default function LaneDetailClient({
  laneId,
  strings,
}: {
  laneId: string;
  strings: LaneDetailStrings;
}) {
  const [lane, setLane] = useState<LaneDetail | null>(null);
  const [versions, setVersions] = useState<LaneVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLane = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logistics/lanes/${laneId}?limit=50`);
      if (!response.ok) return;
      const data = (await response.json()) as LaneDetailResponse;
      if (data.ok && data.lane) {
        setLane(data.lane);
        setVersions(data.versions ?? []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [laneId]);

  useEffect(() => {
    void loadLane();
  }, [loadLane]);

  return (
    <Stack gap={6}>
      <section className="pp-card p-6">
        <Cluster justify="between" alignY="center" className="gap-4">
          <Stack gap={1}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.detail.label}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {lane?.name ?? strings.notAvailable}
            </h2>
            <span className="text-xs text-foreground/60">
              {strings.fields.model}: {lane?.model ?? strings.notAvailable} /{" "}
              {strings.fields.incoterm}: {lane?.incoterm ?? strings.notAvailable}
            </span>
          </Stack>
          <span className="rounded-full border border-border-2 px-3 py-1 text-xs">
            {lane
              ? lane.active
                ? strings.badges.active
                : strings.badges.inactive
              : strings.notAvailable}
          </span>
        </Cluster>
        <div className="mt-4 grid gap-3 text-xs text-foreground/60 md:grid-cols-2">
          <div>
            {strings.fields.origin}: {lane?.origin ?? strings.notAvailable}
          </div>
          <div>
            {strings.fields.destination}: {lane?.destination ?? strings.notAvailable}
          </div>
          <div>
            {strings.fields.destinationType}:{" "}
            {lane?.destinationType ?? strings.notAvailable}
          </div>
          <div>
            {strings.fields.description}: {lane?.description ?? strings.notAvailable}
          </div>
        </div>
      </section>

      <LaneVersionCreateCard
        laneId={laneId}
        loading={loading}
        strings={strings}
        onCreated={loadLane}
      />

      <LaneEvidenceUploadCard
        versions={versions}
        loading={loading}
        strings={strings}
        onUploaded={loadLane}
      />

      <LaneActualsCreateCard
        versions={versions}
        loading={loading}
        strings={strings}
        onCreated={loadLane}
      />

      <LaneVersionList versions={versions} strings={strings} />
    </Stack>
  );
}
