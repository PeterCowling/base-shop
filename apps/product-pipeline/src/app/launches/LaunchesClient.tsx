"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LaunchActualsIngestCard from "./LaunchActualsIngestCard";
import LaunchDecisionCard from "./LaunchDecisionCard";
import LaunchPlanCreateCard from "./LaunchPlanCreateCard";
import LaunchPlansList from "./LaunchPlansList";
import type {
  CandidateOption,
  LaunchOption,
  LaunchPlan,
  LaunchesStrings,
} from "./types";

export default function LaunchesClient({
  strings,
}: {
  strings: LaunchesStrings;
}) {
  const [plans, setPlans] = useState<LaunchPlan[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansResponse, candidatesResponse] = await Promise.all([
        fetch("/api/launches?limit=50"),
        fetch("/api/candidates?limit=50"),
      ]);
      if (plansResponse.ok) {
        const data = (await plansResponse.json()) as {
          ok?: boolean;
          plans?: LaunchPlan[];
        };
        if (data.ok && Array.isArray(data.plans)) {
          setPlans(data.plans);
        }
      }
      if (candidatesResponse.ok) {
        const data = (await candidatesResponse.json()) as {
          ok?: boolean;
          candidates?: CandidateOption[];
        };
        if (data.ok && Array.isArray(data.candidates)) {
          setCandidates(data.candidates);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const candidateOptions = useMemo<LaunchOption[]>(
    () =>
      candidates.map((candidate) => ({
        id: candidate.id,
        label: candidate.lead?.title
          ? `${candidate.lead.title} · ${candidate.id.slice(0, 8)}`
          : candidate.id,
      })),
    [candidates],
  );

  const launchOptions = useMemo<LaunchOption[]>(
    () =>
      plans.map((plan) => ({
        id: plan.id,
        label: plan.lead?.title ? `${plan.lead.title} · ${plan.id}` : plan.id,
      })),
    [plans],
  );

  return (
    <div className="grid gap-6">
      <LaunchPlanCreateCard
        candidates={candidateOptions}
        loading={loading}
        strings={strings}
        onCreated={loadData}
      />
      <LaunchActualsIngestCard
        launches={launchOptions}
        loading={loading}
        strings={strings}
        onIngested={loadData}
      />
      <LaunchDecisionCard
        launches={launchOptions}
        loading={loading}
        strings={strings}
        onDecided={loadData}
      />
      <LaunchPlansList plans={plans} loading={loading} strings={strings} />
    </div>
  );
}
