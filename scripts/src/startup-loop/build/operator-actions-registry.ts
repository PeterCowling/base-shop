import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  parseProcessImprovementsOperatorActionDecisionEvent,
  PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH,
  reduceProcessImprovementsOperatorActionDecisionEvents,
} from "../operator-action-decisions-contract.js";
import {
  type CanonicalOperatorActionItem,
  OPERATOR_ACTIONS_RELATIVE_PATH,
  parseCanonicalOperatorActionItemsFromJson,
} from "../operator-actions-contract.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDisplayState(item: CanonicalOperatorActionItem): string {
  if (item.decisionState?.decision === "done") {
    return "Done";
  }

  if (
    item.decisionState?.decision === "snooze" &&
    item.decisionState.snoozeUntil
  ) {
    return `Snoozed until ${item.decisionState.snoozeUntil.slice(0, 10)}`;
  }

  if (item.isOverdue) {
    return `Overdue · ${item.stateLabel}`;
  }

  return item.stateLabel;
}

function renderSourceCell(item: CanonicalOperatorActionItem): string {
  return `<code>${escapeHtml(item.sourcePath)}</code>`;
}

function renderStageGateBlock(items: readonly CanonicalOperatorActionItem[]): string {
  if (items.length === 0) {
    return `
              <section class="operator-block" data-operator-action-block="stage_gates">
                <h4>Stage Gates</h4>
                <p>No canonical stage-gate actions are currently open.</p>
              </section>`;
  }

  const rows = items
    .map(
      (item) => `
                    <tr data-operator-action-id="${escapeHtml(item.actionId)}">
                      <td>${escapeHtml(item.actionId)}</td>
                      <td>${escapeHtml(item.title)}</td>
                      <td>${escapeHtml(item.owner ?? "Unassigned")}</td>
                      <td>${escapeHtml(formatDisplayState(item))}</td>
                      <td>${renderSourceCell(item)}</td>
                    </tr>`
    )
    .join("");

  return `
              <section class="operator-block" data-operator-action-block="stage_gates">
                <h4>Stage Gates</h4>
                <table class="content-table operator-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Stage / gate</th>
                      <th>Owner</th>
                      <th>State</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>${rows}
                  </tbody>
                </table>
              </section>`;
}

function renderBlockerBlock(items: readonly CanonicalOperatorActionItem[]): string {
  if (items.length === 0) {
    return `
              <section class="operator-block" data-operator-action-block="blockers">
                <h4>Top Blockers &amp; Unknowns</h4>
                <p>No canonical blockers are currently open.</p>
              </section>`;
  }

  const rows = items
    .map(
      (item) => `
                    <tr data-operator-action-id="${escapeHtml(item.actionId)}">
                      <td>${escapeHtml(item.actionId)}</td>
                      <td>${escapeHtml(item.title)}</td>
                      <td>${escapeHtml(item.owner ?? "Unassigned")}</td>
                      <td>${escapeHtml(item.dueAt ?? "—")}</td>
                      <td>${escapeHtml(formatDisplayState(item))}</td>
                      <td>${renderSourceCell(item)}</td>
                    </tr>`
    )
    .join("");

  return `
              <section class="operator-block" data-operator-action-block="blockers">
                <h4>Top Blockers &amp; Unknowns</h4>
                <table class="content-table operator-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Question / gap</th>
                      <th>Owner</th>
                      <th>Due</th>
                      <th>State</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>${rows}
                  </tbody>
                </table>
              </section>`;
}

function renderNextStepsBlock(items: readonly CanonicalOperatorActionItem[]): string {
  if (items.length === 0) {
    return `
              <section class="operator-block" data-operator-action-block="next_steps">
                <h4>Next 72h Plan</h4>
                <p>No canonical next-step actions are currently open.</p>
              </section>`;
  }

  const rows = items
    .map(
      (item) => `
                  <li data-operator-action-id="${escapeHtml(item.actionId)}">
                    <strong>${escapeHtml(item.title)}</strong>
                    ${item.body ? ` — ${escapeHtml(item.body)}` : ""}
                  </li>`
    )
    .join("");

  return `
              <section class="operator-block" data-operator-action-block="next_steps">
                <h4>Next 72h Plan</h4>
                <ol>${rows}
                </ol>
              </section>`;
}

function renderDecisionBlock(items: readonly CanonicalOperatorActionItem[]): string {
  if (items.length === 0) {
    return `
              <section class="operator-block" data-operator-action-block="decisions">
                <h4>Decision Register Summary</h4>
                <p>No canonical decision-waiting actions are currently open.</p>
              </section>`;
  }

  const rows = items
    .map(
      (item) => `
                    <tr data-operator-action-id="${escapeHtml(item.actionId)}">
                      <td><code>${escapeHtml(item.actionId)}</code></td>
                      <td>${escapeHtml(item.title)}</td>
                      <td>${escapeHtml(formatDisplayState(item))}</td>
                      <td>${escapeHtml(item.body)}</td>
                      <td>${renderSourceCell(item)}</td>
                    </tr>`
    )
    .join("");

  return `
              <section class="operator-block" data-operator-action-block="decisions">
                <h4>Decision Register Summary</h4>
                <table class="content-table operator-table">
                  <thead>
                    <tr>
                      <th>Decision ID</th>
                      <th>What</th>
                      <th>State</th>
                      <th>Next evidence / summary</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>${rows}
                  </tbody>
                </table>
              </section>`;
}

function loadOperatorActionDecisionStates(repoRoot: string) {
  const absolutePath = path.join(
    repoRoot,
    PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH
  );

  if (!existsSync(absolutePath)) {
    return new Map();
  }

  const raw = readFileSync(absolutePath, "utf8");
  const events = raw
    .split(/\r?\n/)
    .map((line) => parseProcessImprovementsOperatorActionDecisionEvent(line))
    .filter((event): event is NonNullable<typeof event> => event !== null);

  return reduceProcessImprovementsOperatorActionDecisionEvents(events);
}

export function loadOperatorActionRegistryItems(
  repoRoot: string,
  business?: string
): CanonicalOperatorActionItem[] {
  const absolutePath = path.join(repoRoot, OPERATOR_ACTIONS_RELATIVE_PATH);
  if (!existsSync(absolutePath)) {
    return [];
  }

  const raw = readFileSync(absolutePath, "utf8");
  const decisionStates = loadOperatorActionDecisionStates(repoRoot);
  const items = parseCanonicalOperatorActionItemsFromJson(
    raw,
    OPERATOR_ACTIONS_RELATIVE_PATH,
    decisionStates
  );

  return business ? items.filter((item) => item.business === business) : items;
}

export function renderOperatorActionRegistrySections(
  items: readonly CanonicalOperatorActionItem[]
): string {
  const stageGates = items.filter((item) => item.actionKind === "stage_gate");
  const blockers = items.filter((item) => item.actionKind === "blocker");
  const nextSteps = items.filter((item) => item.actionKind === "next_step");
  const decisions = items.filter((item) => item.actionKind === "decision_waiting");

  return [
    renderStageGateBlock(stageGates),
    renderBlockerBlock(blockers),
    renderNextStepsBlock(nextSteps),
    renderDecisionBlock(decisions),
  ].join("\n\n");
}

export function extractOperatorActionIdsFromRegistryHtml(html: string): string[] {
  return [...html.matchAll(/data-operator-action-id="([^"]+)"/g)]
    .map((match) => match[1] ?? "")
    .filter((value) => value.length > 0);
}

export function computeOperatorActionRegistryParity(
  items: readonly CanonicalOperatorActionItem[],
  registryHtml: string
): {
  ok: boolean;
  expectedIds: string[];
  renderedIds: string[];
  missingIds: string[];
  extraIds: string[];
} {
  const expectedIds = [...new Set(items.map((item) => item.actionId))].sort();
  const renderedIds = [...new Set(extractOperatorActionIdsFromRegistryHtml(registryHtml))].sort();
  const renderedSet = new Set(renderedIds);
  const expectedSet = new Set(expectedIds);

  const missingIds = expectedIds.filter((id) => !renderedSet.has(id));
  const extraIds = renderedIds.filter((id) => !expectedSet.has(id));

  return {
    ok: missingIds.length === 0 && extraIds.length === 0,
    expectedIds,
    renderedIds,
    missingIds,
    extraIds,
  };
}
