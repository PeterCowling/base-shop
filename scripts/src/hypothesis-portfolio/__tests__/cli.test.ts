import { describe, expect, it } from "@jest/globals";

import {
  type RunCliOptions,
  runHypothesisPortfolioCli,
} from "../cli";
import type {
  CreateIdeaInput,
  HypothesisStorageBackend,
  IdeaRecord,
  StageDocRecord,
  UpdateIdeaInput,
  UpsertStageDocInput,
} from "../storage";
import { parseHypothesisMarkdown } from "../storage";

class InMemoryCliBackend implements HypothesisStorageBackend {
  private ideas = new Map<string, IdeaRecord>();
  private stageDocs = new Map<string, StageDocRecord>();
  private sequence = 0;
  private conflictIdeaIds = new Set<string>();

  async createIdea(input: CreateIdeaInput): Promise<IdeaRecord> {
    this.sequence += 1;
    const id = `HYP-IDEA-${this.sequence}`;
    const record: IdeaRecord = {
      id,
      business: input.business,
      tags: [...input.tags],
      content: input.content,
      entitySha: `sha-${this.sequence}`,
    };
    this.ideas.set(id, record);
    return record;
  }

  async updateIdea(input: UpdateIdeaInput): Promise<IdeaRecord> {
    const current = this.ideas.get(input.id);
    if (!current) {
      throw new Error(`idea_not_found:${input.id}`);
    }
    if (
      (input.entitySha && current.entitySha && input.entitySha !== current.entitySha) ||
      this.conflictIdeaIds.has(input.id)
    ) {
      throw new Error("409 conflict: entity sha mismatch");
    }

    this.sequence += 1;
    const updated: IdeaRecord = {
      ...current,
      content: input.content,
      entitySha: `sha-${this.sequence}`,
    };
    this.ideas.set(input.id, updated);
    return updated;
  }

  async getIdea(id: string): Promise<IdeaRecord | null> {
    return this.ideas.get(id) ?? null;
  }

  async listIdeas(business: string, tag: string): Promise<IdeaRecord[]> {
    return [...this.ideas.values()].filter(
      (idea) => idea.business === business && idea.tags.includes(tag),
    );
  }

  async getStageDoc(cardId: string, stage: string): Promise<StageDocRecord | null> {
    return this.stageDocs.get(`${cardId}:${stage}`) ?? null;
  }

  async upsertStageDoc(input: UpsertStageDocInput): Promise<StageDocRecord> {
    this.sequence += 1;
    const key = `${input.cardId}:${input.stage}`;
    const record: StageDocRecord = {
      cardId: input.cardId,
      stage: input.stage,
      content: input.content,
      entitySha: `stage-sha-${this.sequence}`,
    };
    this.stageDocs.set(key, record);
    return record;
  }

  seedIdea(idea: IdeaRecord): void {
    this.ideas.set(idea.id, idea);
  }

  markConflictOnUpdate(id: string): void {
    this.conflictIdeaIds.add(id);
  }
}

interface CliExecutionResult {
  exitCode: number;
  stdout: string[];
  stderr: string[];
  payload: { command: string; result: unknown } | null;
}

function baseCreateArgs(overrides?: {
  title?: string;
  upside?: number;
  downside?: number;
  requiredSpend?: number;
  dependencyHypothesisIds?: string;
  dependencyCardIds?: string;
}): string[] {
  const args: string[] = [
    "create",
    "--business",
    "BRIK",
    "--title",
    overrides?.title ?? "Hypothesis",
    "--type",
    "offer",
    "--prior-confidence",
    "60",
    "--value-unit",
    "USD_GROSS_PROFIT",
    "--value-horizon-days",
    "90",
    "--upside",
    String(overrides?.upside ?? 12000),
    "--downside",
    String(overrides?.downside ?? 2000),
    "--required-spend",
    String(overrides?.requiredSpend ?? 500),
    "--required-effort-days",
    "2",
    "--stopping-rule",
    "Stop after 7 days if attach rate below 2%",
  ];

  if (overrides?.dependencyHypothesisIds !== undefined) {
    args.push("--dependency-hypothesis-ids", overrides.dependencyHypothesisIds);
  }
  if (overrides?.dependencyCardIds !== undefined) {
    args.push("--dependency-card-ids", overrides.dependencyCardIds);
  }

  return args;
}

async function runCli(
  backend: InMemoryCliBackend,
  argv: string[],
): Promise<CliExecutionResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];

  const options: RunCliOptions = {
    backend,
    actor: "test-operator",
    now: () => new Date("2026-02-13T12:00:00.000Z"),
    io: {
      stdout: (line: string) => stdout.push(line),
      stderr: (line: string) => stderr.push(line),
    },
  };

  const exitCode = await runHypothesisPortfolioCli(argv, options);
  const payload = stdout.length > 0
    ? (JSON.parse(stdout[stdout.length - 1]) as { command: string; result: unknown })
    : null;

  return { exitCode, stdout, stderr, payload };
}

function expectSuccessPayload(
  result: CliExecutionResult,
): { command: string; result: unknown } {
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toHaveLength(0);
  expect(result.payload).not.toBeNull();
  return result.payload as { command: string; result: unknown };
}

describe("hypothesis portfolio CLI", () => {
  it("TC-01: create/list/update/archive flow works for a valid hypothesis", async () => {
    const backend = new InMemoryCliBackend();

    const create = expectSuccessPayload(
      await runCli(
        backend,
        baseCreateArgs({
          title: "Terrace upsell",
          dependencyHypothesisIds: "BRIK-HYP-001,BRIK-HYP-002",
          dependencyCardIds: "BRIK-ENG-0123",
        }),
      ),
    );

    const createdId = (create.result as { id: string }).id;

    await runCli(backend, ["update", "--id", createdId, "--title", "Updated terrace upsell"]);

    const listed = expectSuccessPayload(await runCli(backend, ["list", "--business", "BRIK"]));
    const rows = (listed.result as { rows: Array<{ title: string; dependency_hypothesis_ids: string[]; dependency_card_ids: string[] }> }).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Updated terrace upsell");
    expect(rows[0].dependency_hypothesis_ids).toEqual(["BRIK-HYP-001", "BRIK-HYP-002"]);
    expect(rows[0].dependency_card_ids).toEqual(["BRIK-ENG-0123"]);

    expectSuccessPayload(await runCli(backend, ["archive", "--id", createdId]));

    const archived = expectSuccessPayload(
      await runCli(backend, ["list", "--business", "BRIK", "--status", "archived"]),
    );
    const archivedRows = (archived.result as { rows: Array<{ status: string }> }).rows;
    expect(archivedRows).toHaveLength(1);
    expect(archivedRows[0].status).toBe("archived");
  });

  it("TC-02: set-status active blocks when constraints fail", async () => {
    const backend = new InMemoryCliBackend();

    expectSuccessPayload(
      await runCli(backend, [
        "portfolio-set",
        "--portfolio-card-id",
        "BRIK-PORT-1",
        "--max-concurrent",
        "1",
      ]),
    );

    const first = expectSuccessPayload(await runCli(backend, baseCreateArgs({ title: "First" })));
    const second = expectSuccessPayload(await runCli(backend, baseCreateArgs({ title: "Second" })));
    const firstId = (first.result as { id: string }).id;
    const secondId = (second.result as { id: string }).id;

    expectSuccessPayload(
      await runCli(backend, [
        "set-status",
        "--id",
        firstId,
        "--status",
        "active",
        "--portfolio-card-id",
        "BRIK-PORT-1",
      ]),
    );

    const blocked = await runCli(backend, [
      "set-status",
      "--id",
      secondId,
      "--status",
      "active",
      "--portfolio-card-id",
      "BRIK-PORT-1",
    ]);

    expect(blocked.exitCode).toBe(2);
    expect(blocked.stderr.join(" ")).toContain("activation_blocked");
    expect(blocked.stderr.join(" ")).toContain("max concurrent capacity");
  });

  it("TC-03: --force with --force-reason activates and writes override audit metadata", async () => {
    const backend = new InMemoryCliBackend();

    expectSuccessPayload(
      await runCli(backend, [
        "portfolio-set",
        "--portfolio-card-id",
        "BRIK-PORT-2",
        "--max-concurrent",
        "1",
      ]),
    );

    const first = expectSuccessPayload(await runCli(backend, baseCreateArgs({ title: "First" })));
    const second = expectSuccessPayload(await runCli(backend, baseCreateArgs({ title: "Second" })));
    const firstId = (first.result as { id: string }).id;
    const secondId = (second.result as { id: string }).id;

    expectSuccessPayload(
      await runCli(backend, [
        "set-status",
        "--id",
        firstId,
        "--status",
        "active",
        "--portfolio-card-id",
        "BRIK-PORT-2",
      ]),
    );

    const forced = expectSuccessPayload(
      await runCli(backend, [
        "set-status",
        "--id",
        secondId,
        "--status",
        "active",
        "--portfolio-card-id",
        "BRIK-PORT-2",
        "--force",
        "--force-reason",
        "manual incident override",
      ]),
    );

    expect((forced.result as { forceUsed: boolean }).forceUsed).toBe(true);

    const updated = await backend.getIdea(secondId);
    expect(updated).not.toBeNull();

    const parsed = parseHypothesisMarkdown(updated?.content ?? "", {
      portfolioDefaults: { default_detection_window_days: 45 },
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.hypothesis.activation_override).toBe(true);
      expect(parsed.hypothesis.activation_override_reason).toBe("manual incident override");
      expect(parsed.hypothesis.activation_override_by).toBe("test-operator");
      expect(parsed.hypothesis.activation_override_at).toBe("2026-02-13T12:00:00.000Z");
    }
  });

  it("TC-04: rank output includes admitted and blocked entries with reasons", async () => {
    const backend = new InMemoryCliBackend();

    expectSuccessPayload(
      await runCli(backend, [
        "portfolio-set",
        "--portfolio-card-id",
        "BRIK-PORT-3",
        "--max-concurrent",
        "5",
      ]),
    );

    expectSuccessPayload(await runCli(backend, baseCreateArgs({ title: "Positive EV" })));
    expectSuccessPayload(
      await runCli(
        backend,
        baseCreateArgs({
          title: "Negative EV",
          upside: 300,
          downside: 15000,
          requiredSpend: 4000,
        }),
      ),
    );

    backend.seedIdea({
      id: "BROKEN-IDEA-1",
      business: "BRIK",
      tags: ["hypothesis"],
      content: "not-frontmatter",
      entitySha: "sha-broken",
    });

    const ranked = expectSuccessPayload(
      await runCli(backend, [
        "rank",
        "--business",
        "BRIK",
        "--portfolio-card-id",
        "BRIK-PORT-3",
        "--show-blocked",
      ]),
    );

    const admissible = (ranked.result as { admissible: Array<{ id: string }> }).admissible;
    const blocked = (ranked.result as { blocked: Array<{ id: string; reason: string }> }).blocked;

    expect(admissible.length).toBeGreaterThan(0);
    const reasons = new Set(blocked.map((entry) => entry.reason));
    expect(reasons.has("invalid_frontmatter")).toBe(true);
    expect(reasons.has("negative_ev")).toBe(true);
  });

  it("TC-05: backend conflict returns actionable retry guidance", async () => {
    const backend = new InMemoryCliBackend();
    const created = expectSuccessPayload(await runCli(backend, baseCreateArgs({ title: "Conflict target" })));
    const id = (created.result as { id: string }).id;

    backend.markConflictOnUpdate(id);

    const conflict = await runCli(backend, [
      "update",
      "--id",
      id,
      "--title",
      "Updated title",
    ]);

    expect(conflict.exitCode).toBe(3);
    expect(conflict.stderr.join(" ")).toContain("conflict detected");
    expect(conflict.stderr.join(" ").toLowerCase()).toContain("retry");
  });
});
