"use client";

import { useCallback, useEffect, useState } from "react";
import { Grid, Stack } from "@acme/ui/components/atoms/primitives";
import ArtifactsCard from "./ArtifactsCard";
import CandidateArtifactUploadCard from "./CandidateArtifactUploadCard";
import CandidateOverviewCard from "./CandidateOverviewCard";
import CooldownCard from "./CooldownCard";
import LeadDetailCard from "./LeadDetailCard";
import StageARunCard from "./StageARunCard";
import StageBRunCard from "./StageBRunCard";
import StageCRunCard from "./StageCRunCard";
import StageDRunCard from "./StageDRunCard";
import StageKRunCard from "./StageKRunCard";
import StageMQueueCard from "./StageMQueueCard";
import StageNRunCard from "./StageNRunCard";
import StageRRunCard from "./StageRRunCard";
import StageSRunCard from "./StageSRunCard";
import StageRunsCard from "./StageRunsCard";
import type {
  CandidateDetail,
  CandidateDetailResponse,
  CandidateDetailStrings,
  StageRun,
  Artifact,
} from "./types";

export default function CandidateDetailClient({
  candidateId,
  strings,
}: {
  candidateId: string;
  strings: CandidateDetailStrings;
}) {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [stageRuns, setStageRuns] = useState<StageRun[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCandidate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) return;
      const data = (await response.json()) as CandidateDetailResponse;
      if (data.ok && data.candidate) {
        setCandidate(data.candidate);
        setStageRuns(data.stageRuns ?? []);
        setArtifacts(data.artifacts ?? []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    void loadCandidate();
  }, [loadCandidate]);

  return (
    <Stack gap={6}>
      <Grid cols={1} gap={4} className="md:grid-cols-2">
        <CandidateOverviewCard candidate={candidate} strings={strings} />
        <LeadDetailCard candidate={candidate} strings={strings} />
      </Grid>

      <StageMQueueCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onQueued={loadCandidate}
      />

      <StageARunCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onRun={loadCandidate}
      />

      <StageSRunCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onRun={loadCandidate}
      />

      <StageNRunCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onRun={loadCandidate}
      />

      <StageDRunCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onRun={loadCandidate}
      />

      <StageBRunCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onRun={loadCandidate}
      />

      <StageCRunCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onRun={loadCandidate}
      />

      <StageKRunCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onRun={loadCandidate}
      />

      <StageRRunCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onRun={loadCandidate}
      />

      <CooldownCard
        candidateId={candidateId}
        candidate={candidate}
        loading={loading}
        strings={strings}
        onUpdated={loadCandidate}
      />

      <StageRunsCard stageRuns={stageRuns} strings={strings} />
      <CandidateArtifactUploadCard
        candidateId={candidateId}
        stageRuns={stageRuns}
        loading={loading}
        strings={strings}
        onUploaded={loadCandidate}
      />
      <ArtifactsCard artifacts={artifacts} strings={strings} />
    </Stack>
  );
}
