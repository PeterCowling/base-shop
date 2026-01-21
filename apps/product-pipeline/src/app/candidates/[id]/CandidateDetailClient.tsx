/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, Grid, Stack } from "@acme/ui/components/atoms/primitives";

import ArtifactsCard from "./ArtifactsCard";
import CandidateArtifactUploadCard from "./CandidateArtifactUploadCard";
import CandidateOverviewCard from "./CandidateOverviewCard";
import CooldownCard from "./CooldownCard";
import DecisionFrameworkCard from "./DecisionFrameworkCard";
import DecisionScorecard from "./DecisionScorecard";
import FullEvaluationCard from "./FullEvaluationCard";
import LeadDetailCard from "./LeadDetailCard";
import NextStepPanel from "./NextStepPanel";
import StageARunCard from "./StageARunCard";
import StageBRunCard from "./StageBRunCard";
import StageCRunCard from "./StageCRunCard";
import StageDRunCard from "./StageDRunCard";
import { resolveStageTSGate } from "./stageGate";
import StageKRunCard from "./StageKRunCard";
import StageMQueueCard from "./StageMQueueCard";
import StageNRunCard from "./StageNRunCard";
import StageRRunCard from "./StageRRunCard";
import StageRunsCard from "./StageRunsCard";
import StageSRunCard from "./StageSRunCard";
import StageTRunCard from "./StageTRunCard";
import type {
  Artifact,
  CandidateDetail,
  CandidateDetailResponse,
  CandidateDetailStrings,
  StageRun,
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

  const stageGate = resolveStageTSGate(stageRuns);
  const cooldownActive = Boolean(candidate?.cooldown?.active);
  const requiredStage = useMemo(() => {
    if (cooldownActive) return "cooldown";
    if (stageGate === "stage_t_blocked" || stageGate === "stage_t_needs_review") {
      return "T";
    }
    if (stageGate === "stage_s_blocked") return "S";
    return null;
  }, [cooldownActive, stageGate]);
  const blocked = Boolean(requiredStage);
  const [showLater, setShowLater] = useState(false);

  return (
    <Stack gap={6}>
      <Grid cols={1} gap={4} className="md:grid-cols-2">
        <CandidateOverviewCard candidate={candidate} strings={strings} />
        <LeadDetailCard candidate={candidate} strings={strings} />
      </Grid>

      <DecisionFrameworkCard
        candidate={candidate}
        stageRuns={stageRuns}
        strings={strings}
      />

      <DecisionScorecard
        candidate={candidate}
        stageRuns={stageRuns}
        strings={strings}
        onUpdated={loadCandidate}
      />

      <NextStepPanel
        candidate={candidate}
        stageRuns={stageRuns}
        strings={strings}
      />

      <FullEvaluationCard
        candidateId={candidateId}
        candidate={candidate}
        stageRuns={stageRuns}
        strings={strings}
        onRun={loadCandidate}
      />

      {requiredStage === "T" ? (
        <StageTRunCard
          candidateId={candidateId}
          candidate={candidate}
          stageRuns={stageRuns}
          loading={loading}
          strings={strings}
          onRun={loadCandidate}
        />
      ) : requiredStage === "S" ? (
        <StageSRunCard
          candidateId={candidateId}
          candidate={candidate}
          stageRuns={stageRuns}
          loading={loading}
          strings={strings}
          onRun={loadCandidate}
        />
      ) : requiredStage === "cooldown" ? (
        <CooldownCard
          candidateId={candidateId}
          candidate={candidate}
          loading={loading}
          strings={strings}
          onUpdated={loadCandidate}
        />
      ) : null}

      {blocked ? (
        <section className="pp-card p-4">
          <Cluster justify="between" alignY="center" className="gap-3">
            <span className="text-sm font-semibold text-foreground">
              {strings.common.laterStepsLabel}
            </span>
            <button
              type="button"
              className="min-h-10 min-w-10 px-2 text-sm font-semibold text-primary hover:underline"
              onClick={() => setShowLater((current) => !current)}
            >
              {showLater
                ? strings.common.laterStepsHide
                : strings.common.laterStepsShow}
            </button>
          </Cluster>
          {showLater ? (
            <Stack gap={6} className="mt-4">
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
              {requiredStage !== "T" ? (
                <StageTRunCard
                  candidateId={candidateId}
                  candidate={candidate}
                  stageRuns={stageRuns}
                  loading={loading}
                  strings={strings}
                  onRun={loadCandidate}
                />
              ) : null}
              {requiredStage !== "S" ? (
                <StageSRunCard
                  candidateId={candidateId}
                  candidate={candidate}
                  stageRuns={stageRuns}
                  loading={loading}
                  strings={strings}
                  onRun={loadCandidate}
                />
              ) : null}
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
              {requiredStage !== "cooldown" ? (
                <CooldownCard
                  candidateId={candidateId}
                  candidate={candidate}
                  loading={loading}
                  strings={strings}
                  onUpdated={loadCandidate}
                />
              ) : null}
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
          ) : null}
        </section>
      ) : (
        <>
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
          <StageTRunCard
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
        </>
      )}
    </Stack>
  );
}
