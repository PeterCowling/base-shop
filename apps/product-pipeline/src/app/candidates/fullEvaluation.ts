"use client";

import { DEFAULT_STAGE_A_FORM, parseStageAForm } from "./[id]/stageAForm";
import { DEFAULT_STAGE_B_FORM, parseStageBForm } from "./[id]/stageBForm";
import { DEFAULT_STAGE_C_FORM, parseStageCForm } from "./[id]/stageCForm";

export type FullEvalStatus = {
  ran: string[];
  queued: string[];
  skipped: string[];
  missing: string[];
};

export type GateContext = {
  eligibilityDecision: string | null;
  complianceRisk: string | null;
  complianceAction: string | null;
};

type StatusMap = {
  M?: string | null;
  A?: string | null;
  B?: string | null;
  C?: string | null;
  K?: string | null;
};

type LeadSnapshot = {
  title: string | null;
  url: string | null;
};

type StageMRequest =
  | {
      kind: "amazon_search";
      marketplace: string;
      query: string;
    }
  | {
      kind: "amazon_listing";
      marketplace: string;
      url: string;
    }
  | {
      kind: "taobao_listing";
      url: string;
    };

function normalizeLower(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function isSucceeded(status: string | null | undefined): boolean {
  return status === "succeeded";
}

function isQueued(status: string | null | undefined): boolean {
  return status === "queued" || status === "running";
}

function resolveGate(context: GateContext): "blocked" | "review" | null {
  const decision = normalizeLower(context.eligibilityDecision);
  if (decision === "blocked") return "blocked";
  if (decision === "needs_review") return "review";
  const risk = normalizeLower(context.complianceRisk);
  const action = normalizeLower(context.complianceAction);
  if (action === "block" || risk === "high") return "blocked";
  return null;
}

function resolveStageMRequest(lead: LeadSnapshot | null): StageMRequest | null {
  const url = lead?.url?.trim() ?? "";
  const title = lead?.title?.trim() ?? "";
  const isTaobao = /taobao\.com|tmall\.com/i.test(url);
  const isAmazon = /amazon\./i.test(url);

  if (isTaobao && url) {
    return { kind: "taobao_listing", url };
  }
  if (isAmazon && url) {
    return { kind: "amazon_listing", url, marketplace: "de" };
  }
  if (title) {
    return { kind: "amazon_search", query: title, marketplace: "de" };
  }
  return null;
}

function stageLabel(code: string, labels: Record<string, string>): string {
  return labels[code] ?? code;
}

export async function runFullEvaluation({
  candidateId,
  lead,
  statuses,
  stageLabels,
  gateContext,
  requestedBy = "full_eval",
}: {
  candidateId: string;
  lead: LeadSnapshot | null;
  statuses: StatusMap;
  stageLabels: Record<string, string>;
  gateContext: GateContext;
  requestedBy?: string;
}): Promise<FullEvalStatus> {
  const status: FullEvalStatus = {
    ran: [],
    queued: [],
    skipped: [],
    missing: [],
  };
  const label = (code: string) => stageLabel(code, stageLabels);
  const gate = resolveGate(gateContext);

  const queueStageM = async () => {
    if (isSucceeded(statuses.M)) {
      status.skipped.push(label("M"));
      return;
    }
    if (isQueued(statuses.M)) {
      status.skipped.push(label("M"));
      return;
    }
    const stageM = resolveStageMRequest(lead);
    if (!stageM) {
      status.missing.push(label("M"));
      return;
    }
    try {
      const response = await fetch("/api/stages/m/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          captureMode: "queue",
          ...stageM,
        }),
      });
      if (response.ok) {
        status.queued.push(label("M"));
      } else {
        status.missing.push(label("M"));
      }
    } catch {
      status.missing.push(label("M"));
    }
  };

  const runStageA = async () => {
    if (isSucceeded(statuses.A)) {
      status.skipped.push(label("A"));
      return true;
    }
    const input = parseStageAForm(DEFAULT_STAGE_A_FORM);
    if (!input) {
      status.missing.push(label("A"));
      return false;
    }
    try {
      const response = await fetch("/api/stages/a/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          ...input,
          requestedBy,
        }),
      });
      if (response.ok) {
        status.ran.push(label("A"));
        return true;
      }
    } catch {
      // fall through
    }
    status.missing.push(label("A"));
    return false;
  };

  const runStageB = async () => {
    if (isSucceeded(statuses.B)) {
      status.skipped.push(label("B"));
      return true;
    }
    if (gate) {
      status.skipped.push(label("B"));
      return false;
    }
    const input = parseStageBForm(DEFAULT_STAGE_B_FORM);
    if (!input) {
      status.missing.push(label("B"));
      return false;
    }
    try {
      const response = await fetch("/api/stages/b/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          ...input,
          requestedBy,
        }),
      });
      if (response.ok) {
        status.ran.push(label("B"));
        return true;
      }
    } catch {
      // fall through
    }
    status.missing.push(label("B"));
    return false;
  };

  const runStageC = async () => {
    if (isSucceeded(statuses.C)) {
      status.skipped.push(label("C"));
      return true;
    }
    if (gate) {
      status.skipped.push(label("C"));
      return false;
    }
    const input = parseStageCForm(DEFAULT_STAGE_C_FORM);
    if (!input) {
      status.missing.push(label("C"));
      return false;
    }
    try {
      const response = await fetch("/api/stages/c/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          ...input,
          requestedBy,
        }),
      });
      if (response.ok) {
        status.ran.push(label("C"));
        return true;
      }
    } catch {
      // fall through
    }
    status.missing.push(label("C"));
    return false;
  };

  const runStageK = async (readyB: boolean, readyC: boolean) => {
    if (isSucceeded(statuses.K)) {
      status.skipped.push(label("K"));
      return;
    }
    if (gate || !readyB || !readyC) {
      status.skipped.push(label("K"));
      return;
    }
    try {
      const composeResponse = await fetch("/api/stages/k/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const composeData = (await composeResponse.json().catch(() => null)) as
        | { ok?: boolean; input?: unknown; scenario?: unknown }
        | null;
      if (!composeResponse.ok || !composeData?.input) {
        status.missing.push(label("K"));
        return;
      }
      const runResponse = await fetch("/api/stages/k/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          input: composeData.input,
          scenario: composeData.scenario,
          requestedBy,
        }),
      });
      if (runResponse.ok) {
        status.ran.push(label("K"));
        return;
      }
    } catch {
      // fall through
    }
    status.missing.push(label("K"));
  };

  await queueStageM();
  await runStageA();
  const stageBReady = await runStageB();
  const stageCReady = await runStageC();
  await runStageK(stageBReady, stageCReady);

  return status;
}
