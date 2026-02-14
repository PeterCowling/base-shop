import { randomUUID } from "crypto";

import type { BicAffordance, BicAffordanceConstraints, BicLandmark, BicObservation } from "./bic.js";
import {
  type AxInteractiveCandidate,
  type DomNodeDescriptionFixture,
  extractInteractiveCandidatesFromAxTree,
  resolveBackendDomNodeId,
} from "./cdp.js";
import type { BrowserObservationMode, BrowserObserveScope } from "./driver.js";
import type { BrowserToolErrorEnvelope } from "./errors.js";
import { deriveFormsFromAffordances } from "./forms.js";
import { paginateAffordances, rankAffordances } from "./ranking.js";
import { redactBicValues } from "./redaction.js";
import { classifyAffordanceRisk } from "./risk.js";
import { buildSelectorForNode } from "./selectors.js";
import type { BrowserActionTarget, BrowserSessionResult, BrowserSessionStore } from "./session.js";

type ObserveInput = {
  store: BrowserSessionStore;
  sessionId: string;
  mode: BrowserObservationMode;
  scope: BrowserObserveScope;
  maxAffordances: number;
  includeHidden: boolean;
  includeDisabled: boolean;
  cursor?: string;
};

type ObserveSuccess = { observation: BicObservation };

function makeError(
  code: BrowserToolErrorEnvelope["code"],
  message: string,
  details?: Record<string, unknown>
): BrowserToolErrorEnvelope {
  return {
    code,
    message,
    retryable: false,
    details,
  };
}

function clampMaxAffordances(input: number): number {
  if (!Number.isFinite(input)) {
    return 50;
  }
  return Math.min(200, Math.max(1, Math.floor(input)));
}

function isHidden(attributes: Readonly<Record<string, string>>): boolean {
  if ("hidden" in attributes) {
    return true;
  }
  const ariaHidden = (attributes["aria-hidden"] ?? "").trim().toLowerCase();
  return ariaHidden === "true";
}

function isDisabled(attributes: Readonly<Record<string, string>>): boolean {
  if ("disabled" in attributes) {
    return true;
  }
  const ariaDisabled = (attributes["aria-disabled"] ?? "").trim().toLowerCase();
  return ariaDisabled === "true";
}

function isSensitiveField(input: { role: string; name: string; attributes: Readonly<Record<string, string>> }): boolean {
  const type = (input.attributes.type ?? "").trim().toLowerCase();
  if (type === "password") {
    return true;
  }

  const name = input.name.trim().toLowerCase();
  if (input.role === "textbox" && name.includes("password")) {
    return true;
  }

  return false;
}

function parseLandmark(value: string | undefined): BicLandmark | null {
  const v = (value ?? "").trim();
  if (
    v === "main" ||
    v === "nav" ||
    v === "footer" ||
    v === "modal" ||
    v === "banner" ||
    v === "unknown"
  ) {
    return v;
  }
  return null;
}

function parseConstraints(attributes: Readonly<Record<string, string>>): BicAffordanceConstraints | undefined {
  const type = (attributes.type ?? "").trim();
  const pattern = (attributes.pattern ?? "").trim();
  const minLengthRaw = (attributes.minlength ?? "").trim();
  const maxLengthRaw = (attributes.maxlength ?? "").trim();

  const constraints: BicAffordanceConstraints = {};
  if (type) {
    constraints.type = type;
  }
  if (pattern) {
    constraints.pattern = pattern;
  }

  const minLength = minLengthRaw ? Number.parseInt(minLengthRaw, 10) : Number.NaN;
  if (Number.isFinite(minLength) && minLength >= 0) {
    constraints.minLength = minLength;
  }

  const maxLength = maxLengthRaw ? Number.parseInt(maxLengthRaw, 10) : Number.NaN;
  if (Number.isFinite(maxLength) && maxLength >= 0) {
    constraints.maxLength = maxLength;
  }

  return Object.keys(constraints).length ? constraints : undefined;
}

function getHref(candidate: AxInteractiveCandidate, attributes: Readonly<Record<string, string>>): string | undefined {
  if (candidate.role !== "link") {
    return undefined;
  }
  const href = (attributes.href ?? "").trim();
  return href || undefined;
}

function getRequired(attributes: Readonly<Record<string, string>>): boolean | undefined {
  if ("required" in attributes) {
    return true;
  }
  const ariaRequired = (attributes["aria-required"] ?? "").trim().toLowerCase();
  if (ariaRequired === "true") {
    return true;
  }
  return undefined;
}

function getValue(attributes: Readonly<Record<string, string>>): string | undefined {
  const v = attributes.value;
  if (typeof v !== "string") {
    return undefined;
  }
  return v;
}

function buildTargetFromDomNode(input: {
  candidate: AxInteractiveCandidate;
  describedNodes: ReadonlyArray<DomNodeDescriptionFixture>;
}): { target: BrowserActionTarget; attributes: Readonly<Record<string, string>> } | null {
  if (input.candidate.backendDOMNodeId === null) {
    return null;
  }

  const resolved = resolveBackendDomNodeId({
    backendDOMNodeId: input.candidate.backendDOMNodeId,
    described: input.describedNodes,
  });

  if (!resolved) {
    return {
      target: { selector: "div", bestEffort: true, frameId: input.candidate.frameId },
      attributes: {},
    };
  }

  const document = {
    root: {
      nodeId: resolved.nodeId,
      localName: resolved.localName,
      nodeType: 1,
      children: [],
    },
  };

  const built = buildSelectorForNode({
    document,
    nodeId: resolved.nodeId,
    localName: resolved.localName,
    attributes: resolved.attributes,
  });

  return {
    target: { selector: built.selector, bestEffort: built.bestEffort, frameId: input.candidate.frameId },
    attributes: resolved.attributes,
  };
}

export async function browserObserve(input: ObserveInput): Promise<BrowserSessionResult<ObserveSuccess>> {
  const session = input.store.getSession(input.sessionId);
  if (!session) {
    return {
      ok: false,
      error: makeError("SESSION_NOT_FOUND", `Unknown sessionId: ${input.sessionId}`),
    };
  }

  const snapshot = await session.driver.snapshot({
    mode: input.mode,
    scope: input.scope,
    includeHidden: input.includeHidden,
    includeDisabled: input.includeDisabled,
  });

  const candidates = extractInteractiveCandidatesFromAxTree({ nodes: snapshot.axNodes });
  const maxAffordances = clampMaxAffordances(input.maxAffordances);

  const affordances: BicAffordance[] = [];
  const targetByFingerprint = new Map<string, BrowserActionTarget>();

  for (const candidate of candidates) {
    if (candidate.backendDOMNodeId === null) {
      continue;
    }

    const built = buildTargetFromDomNode({
      candidate,
      describedNodes: snapshot.describedNodes,
    });

    if (!built) {
      continue;
    }

    const hidden = isHidden(built.attributes);
    const visible = !hidden;
    const disabled = isDisabled(built.attributes);

    if (!input.includeHidden && !visible) {
      continue;
    }
    if (!input.includeDisabled && disabled) {
      continue;
    }

    const landmark = parseLandmark(built.attributes["data-bic-landmark"]) ?? "main";
    const nearText = (built.attributes["data-bic-near-text"] ?? "").trim() || undefined;
    const sensitive = isSensitiveField({ role: candidate.role, name: candidate.name, attributes: built.attributes });

    const fingerprint = `backendNodeId:${candidate.backendDOMNodeId}`;
    targetByFingerprint.set(fingerprint, built.target);

    affordances.push({
      actionId: "pending",
      role: candidate.role,
      name: candidate.name,
      visible,
      disabled,
      landmark,
      nearText,
      href: getHref(candidate, built.attributes),
      required: getRequired(built.attributes),
      constraints: parseConstraints(built.attributes),
      value: getValue(built.attributes),
      sensitive,
      risk: classifyAffordanceRisk({ role: candidate.role, name: candidate.name, nearText }),
      frameId: candidate.frameId,
      fingerprint: { kind: "backendNodeId", value: String(candidate.backendDOMNodeId) },
    });
  }

  const ranked = rankAffordances({ affordances });
  const paged = paginateAffordances({ affordances: ranked, maxAffordances, cursor: input.cursor });

  const observationId = `obs_${randomUUID()}`;

  const actionTargets: Record<string, BrowserActionTarget> = {};
  const itemsWithIds: BicAffordance[] = paged.items.map((a, idx) => {
    const actionId = `a_${idx + 1}`;
    const fingerprintKey = `backendNodeId:${a.fingerprint?.value ?? ""}`;
    const target = targetByFingerprint.get(fingerprintKey);
    if (target) {
      actionTargets[actionId] = target;
    }

    return { ...a, actionId };
  });

  const observation: BicObservation = redactBicValues({
    schemaVersion: "0.1",
    observationId,
    createdAt: new Date().toISOString(),
    page: snapshot.page,
    nextCursor: paged.nextCursor,
    hasMore: paged.hasMore,
    affordances: itemsWithIds,
    forms: deriveFormsFromAffordances({ affordances: itemsWithIds }),
  });

  const updated = input.store.setCurrentObservation({
    sessionId: input.sessionId,
    observationId,
    actionTargets,
  });
  if (!updated.ok) {
    return updated;
  }

  return { ok: true, value: { observation } };
}
