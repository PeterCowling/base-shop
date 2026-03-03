import * as fs from "node:fs";
import * as path from "node:path";

export type RegistryTriggerThreshold = "T1-conservative" | "T2-moderate" | "T3-open";

export type RegistryV1Domain =
  | "MARKET"
  | "SELL"
  | "PRODUCTS"
  | "LOGISTICS"
  | "STRATEGY"
  | "BOS";

export type RegistryV2Domain =
  | "ASSESSMENT"
  | "MARKET"
  | "SELL"
  | "PRODUCTS"
  | "LOGISTICS"
  | "LEGAL"
  | "STRATEGY"
  | "BOS";

export type ArtifactClassV2 =
  | "source_process"
  | "source_reference"
  | "projection_summary"
  | "system_telemetry"
  | "execution_output"
  | "reflection";

export type TriggerPolicyV2 = "eligible" | "manual_override_only" | "never";

export type PropagationModeV2 =
  | "projection_auto"
  | "source_task"
  | "source_mechanical_auto";

export interface RegistryV1ArtifactEntry {
  artifact_id?: string;
  path?: string;
  domain?: RegistryV1Domain | string;
  business?: string;
  last_known_sha?: string | null;
  registered_at?: string;
  active?: boolean;
  notes?: string;
}

export interface StandingRegistryV1 {
  registry_version: "registry.v1";
  trigger_threshold: RegistryTriggerThreshold;
  t1_semantic_sections: string[];
  updated_at?: string;
  artifacts: RegistryV1ArtifactEntry[];
}

export interface RegistryV2ArtifactEntry {
  artifact_id: string;
  path: string;
  domain: RegistryV2Domain;
  business: string;
  artifact_class: ArtifactClassV2;
  trigger_policy: TriggerPolicyV2;
  propagation_mode: PropagationModeV2;
  depends_on: string[];
  produces: string[];
  last_known_sha?: string | null;
  registered_at?: string;
  active: boolean;
  notes?: string;
}

export interface StandingRegistryV2 {
  registry_version: "registry.v2";
  trigger_threshold: RegistryTriggerThreshold;
  t1_semantic_sections: string[];
  unknown_artifact_policy: "fail_closed_never_trigger";
  updated_at?: string;
  artifacts: RegistryV2ArtifactEntry[];
}

export type ClassificationStatus = "classified" | "inferred" | "unknown" | "blocked";

export interface MigrationEntryReport {
  artifact_id: string;
  classification_status: ClassificationStatus;
  reason: string;
  artifact_class?: ArtifactClassV2;
  trigger_policy?: TriggerPolicyV2;
  propagation_mode?: PropagationModeV2;
}

export interface MigrationCounts {
  input_total: number;
  output_total: number;
  classified: number;
  inferred: number;
  unknown: number;
  blocked: number;
}

export interface RegistryMigrationReport {
  generated_at: string;
  counts: MigrationCounts;
  entries: MigrationEntryReport[];
  unknown_artifact_ids: string[];
  blocked_artifact_ids: string[];
  fail_open_detected: boolean;
}

export interface RegistryMigrationResult {
  ok: boolean;
  registry: StandingRegistryV2;
  report: RegistryMigrationReport;
}

interface InferenceResult {
  classification_status: Exclude<ClassificationStatus, "blocked">;
  artifact_class: ArtifactClassV2;
  trigger_policy: TriggerPolicyV2;
  propagation_mode: PropagationModeV2;
  reason: string;
}

export interface PilotClassificationRow {
  artifact_id: string;
  path: string;
  domain: RegistryV2Domain;
  business: string;
  artifact_class: ArtifactClassV2;
  trigger_policy: TriggerPolicyV2;
  propagation_mode: PropagationModeV2;
  classification_status: Exclude<ClassificationStatus, "blocked">;
  reason: string;
}

const PACK_ARTIFACT_PATTERNS: ReadonlyArray<RegExp> = [
  /-(MARKET|SELL|PRODUCTS|LOGISTICS)-PACK$/,
  /-(MARKET|SELL|PRODUCTS|LOGISTICS)-AGGREGATE-PACK$/,
];

const PACK_PATH_PATTERNS: ReadonlyArray<RegExp> = [
  /\/market-pack\.user\.md$/i,
  /\/sell-pack\.user\.md$/i,
  /\/(product-pack|products-aggregate-pack)\.user\.md$/i,
  /\/logistics-pack\.user\.md$/i,
];

const TELEMETRY_PATH_PATTERNS: ReadonlyArray<RegExp> = [
  /\/ideas\/(trial|live)\/queue-state\.json$/i,
  /\/ideas\/(trial|live)\/dispatch-ledger\.jsonl$/i,
  /\/ideas\/(trial|live)\/telemetry\.jsonl$/i,
  /\/ideas\/(trial|live)\/standing-registry\.json$/i,
];

const REFLECTION_PATH_PATTERN = /\/results-review\.user\.md$/i;

const PRIMARY_SOURCE_FILE_MAP: Readonly<Record<string, ArtifactClassV2>> = {
  "insight-log.user.md": "source_process",
  "customer-interviews.user.md": "source_process",
  "competitor-scan.user.md": "source_process",
  "experiment-backlog.user.md": "source_process",
  "pricing-decisions.user.md": "source_process",
  "channel-policy.user.md": "source_process",
  "capacity-plan.user.md": "source_process",
  "risk-register.user.md": "source_process",
  "kpi-pack.user.md": "source_reference",
  "weekly-demand-plan.user.md": "source_process",
};

function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

function toPosixPath(inputPath: string): string {
  return inputPath.replaceAll("\\", "/").trim();
}

function normalizeArtifactId(value: string | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

function isV2Domain(value: string): value is RegistryV2Domain {
  return [
    "ASSESSMENT",
    "MARKET",
    "SELL",
    "PRODUCTS",
    "LOGISTICS",
    "LEGAL",
    "STRATEGY",
    "BOS",
  ].includes(value);
}

function isAggregatePack(entry: { artifact_id: string; path: string }): boolean {
  if (PACK_ARTIFACT_PATTERNS.some((pattern) => pattern.test(entry.artifact_id))) {
    return true;
  }
  return PACK_PATH_PATTERNS.some((pattern) => pattern.test(entry.path));
}

function inferV2Fields(entry: {
  artifact_id: string;
  path: string;
}): InferenceResult {
  const fileName = path.posix.basename(entry.path);

  if (TELEMETRY_PATH_PATTERNS.some((pattern) => pattern.test(entry.path))) {
    return {
      classification_status: "classified",
      artifact_class: "system_telemetry",
      trigger_policy: "never",
      propagation_mode: "projection_auto",
      reason: "telemetry/runtime artifact detected",
    };
  }

  if (isAggregatePack(entry)) {
    return {
      classification_status: "classified",
      artifact_class: "projection_summary",
      trigger_policy: "manual_override_only",
      propagation_mode: "projection_auto",
      reason: "aggregate-pack cutover default",
    };
  }

  if (REFLECTION_PATH_PATTERN.test(entry.path)) {
    return {
      classification_status: "classified",
      artifact_class: "reflection",
      trigger_policy: "never",
      propagation_mode: "source_task",
      reason: "reflection artifact detected",
    };
  }

  if (fileName in PRIMARY_SOURCE_FILE_MAP) {
    const artifactClass = PRIMARY_SOURCE_FILE_MAP[fileName];
    return {
      classification_status: "classified",
      artifact_class: artifactClass,
      trigger_policy: "eligible",
      propagation_mode: "source_task",
      reason: "primary source-process candidate",
    };
  }

  if (/\.html$/i.test(entry.path) || /\/(index|summary)\.user\.md$/i.test(entry.path)) {
    return {
      classification_status: "inferred",
      artifact_class: "projection_summary",
      trigger_policy: "manual_override_only",
      propagation_mode: "projection_auto",
      reason: "derived view/index heuristic",
    };
  }

  if (/\/ideas\//i.test(entry.path)) {
    return {
      classification_status: "inferred",
      artifact_class: "system_telemetry",
      trigger_policy: "never",
      propagation_mode: "projection_auto",
      reason: "ideas subsystem artifact fallback",
    };
  }

  return {
    classification_status: "unknown",
    artifact_class: "execution_output",
    trigger_policy: "never",
    propagation_mode: "projection_auto",
    reason: "no classification rule matched; fail-closed default",
  };
}

function buildMigrationNotes(
  priorNotes: string | undefined,
  inference: InferenceResult,
): string {
  const cleaned = String(priorNotes ?? "").trim();
  const migrationSuffix = `migration_v1_v2: ${inference.classification_status}; ${inference.reason}`;
  if (!cleaned) {
    return migrationSuffix;
  }
  if (cleaned.includes(migrationSuffix)) {
    return cleaned;
  }
  return `${cleaned} | ${migrationSuffix}`;
}

function asStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0);
}

function toSafeDomain(domain: string): RegistryV2Domain | null {
  return isV2Domain(domain) ? domain : null;
}

function isInputShapeValid(input: unknown): input is StandingRegistryV1 {
  if (!input || typeof input !== "object") {
    return false;
  }
  const candidate = input as Partial<StandingRegistryV1>;
  return (
    candidate.registry_version === "registry.v1" &&
    typeof candidate.trigger_threshold === "string" &&
    Array.isArray(candidate.t1_semantic_sections) &&
    Array.isArray(candidate.artifacts)
  );
}

function migrateArtifactEntry(entry: RegistryV1ArtifactEntry):
  | { migrated: RegistryV2ArtifactEntry; report: MigrationEntryReport }
  | { blocked: MigrationEntryReport } {
  const artifact_id = normalizeArtifactId(entry.artifact_id);
  const artifactPath = toPosixPath(String(entry.path ?? ""));
  const business = String(entry.business ?? "").trim().toUpperCase();
  const domainRaw = String(entry.domain ?? "").trim().toUpperCase();

  if (!artifact_id || !artifactPath || !business || typeof entry.active !== "boolean") {
    return {
      blocked: {
        artifact_id: artifact_id || "(missing-artifact-id)",
        classification_status: "blocked",
        reason: "missing required v1 fields (artifact_id/path/business/active)",
      },
    };
  }

  const domain = toSafeDomain(domainRaw);
  if (!domain) {
    return {
      blocked: {
        artifact_id,
        classification_status: "blocked",
        reason: `invalid domain ${domainRaw} for v2 contract`,
      },
    };
  }

  const inference = inferV2Fields({ artifact_id, path: artifactPath });

  const migrated: RegistryV2ArtifactEntry = {
    artifact_id,
    path: artifactPath,
    domain,
    business,
    artifact_class: inference.artifact_class,
    trigger_policy: inference.trigger_policy,
    propagation_mode: inference.propagation_mode,
    depends_on: [],
    produces: [],
    last_known_sha: entry.last_known_sha ?? null,
    registered_at: typeof entry.registered_at === "string" ? entry.registered_at : undefined,
    active: entry.active,
    notes: buildMigrationNotes(entry.notes, inference),
  };

  return {
    migrated,
    report: {
      artifact_id,
      classification_status: inference.classification_status,
      reason: inference.reason,
      artifact_class: inference.artifact_class,
      trigger_policy: inference.trigger_policy,
      propagation_mode: inference.propagation_mode,
    },
  };
}

export function migrateRegistryV1ToV2(input: unknown): RegistryMigrationResult {
  if (!isInputShapeValid(input)) {
    return {
      ok: false,
      registry: {
        registry_version: "registry.v2",
        trigger_threshold: "T1-conservative",
        t1_semantic_sections: [],
        unknown_artifact_policy: "fail_closed_never_trigger",
        updated_at: nowIsoTimestamp(),
        artifacts: [],
      },
      report: {
        generated_at: nowIsoTimestamp(),
        counts: {
          input_total: 0,
          output_total: 0,
          classified: 0,
          inferred: 0,
          unknown: 0,
          blocked: 1,
        },
        entries: [
          {
            artifact_id: "(registry)",
            classification_status: "blocked",
            reason: "input is not a valid registry.v1 object",
          },
        ],
        unknown_artifact_ids: [],
        blocked_artifact_ids: ["(registry)"],
        fail_open_detected: false,
      },
    };
  }

  const migratedArtifacts: RegistryV2ArtifactEntry[] = [];
  const entries: MigrationEntryReport[] = [];

  for (const artifactEntry of input.artifacts) {
    const migrated = migrateArtifactEntry(artifactEntry);
    if ("blocked" in migrated) {
      entries.push(migrated.blocked);
      continue;
    }
    migratedArtifacts.push(migrated.migrated);
    entries.push(migrated.report);
  }

  migratedArtifacts.sort((left, right) => left.artifact_id.localeCompare(right.artifact_id));

  const counts: MigrationCounts = {
    input_total: input.artifacts.length,
    output_total: migratedArtifacts.length,
    classified: entries.filter((entry) => entry.classification_status === "classified").length,
    inferred: entries.filter((entry) => entry.classification_status === "inferred").length,
    unknown: entries.filter((entry) => entry.classification_status === "unknown").length,
    blocked: entries.filter((entry) => entry.classification_status === "blocked").length,
  };

  const unknownArtifactIds = entries
    .filter((entry) => entry.classification_status === "unknown")
    .map((entry) => entry.artifact_id)
    .sort((left, right) => left.localeCompare(right));

  const blockedArtifactIds = entries
    .filter((entry) => entry.classification_status === "blocked")
    .map((entry) => entry.artifact_id)
    .sort((left, right) => left.localeCompare(right));

  const failOpenDetected = entries.some(
    (entry) =>
      entry.classification_status === "unknown" &&
      entry.trigger_policy === "eligible",
  );

  const registry: StandingRegistryV2 = {
    registry_version: "registry.v2",
    trigger_threshold: input.trigger_threshold,
    t1_semantic_sections: asStringArray(input.t1_semantic_sections),
    unknown_artifact_policy: "fail_closed_never_trigger",
    updated_at: typeof input.updated_at === "string" ? input.updated_at : nowIsoTimestamp(),
    artifacts: migratedArtifacts,
  };

  return {
    ok: !failOpenDetected,
    registry,
    report: {
      generated_at: nowIsoTimestamp(),
      counts,
      entries,
      unknown_artifact_ids: unknownArtifactIds,
      blocked_artifact_ids: blockedArtifactIds,
      fail_open_detected: failOpenDetected,
    },
  };
}

export function renderRegistryMigrationReportMarkdown(
  result: RegistryMigrationResult,
): string {
  const lines: string[] = [
    "---",
    "Type: Registry-Migration-Report",
    `Status: ${result.ok ? "Draft" : "Blocked"}`,
    "Schema: registry.v1-to-v2",
    `Generated: ${result.report.generated_at}`,
    "---",
    "",
    "# Registry Migration Report",
    "",
    "## Counts",
    "",
    `- Input entries: ${result.report.counts.input_total}`,
    `- Output entries: ${result.report.counts.output_total}`,
    `- Classified: ${result.report.counts.classified}`,
    `- Inferred: ${result.report.counts.inferred}`,
    `- Unknown: ${result.report.counts.unknown}`,
    `- Blocked: ${result.report.counts.blocked}`,
    `- Fail-open detected: ${result.report.fail_open_detected ? "Yes" : "No"}`,
    "",
    "## Entry Classification",
    "",
    "| Artifact ID | Status | Class | Trigger | Propagation | Reason |",
    "|---|---|---|---|---|---|",
  ];

  for (const entry of result.report.entries) {
    lines.push(
      `| ${entry.artifact_id} | ${entry.classification_status} | ${entry.artifact_class ?? "-"} | ${entry.trigger_policy ?? "-"} | ${entry.propagation_mode ?? "-"} | ${entry.reason} |`,
    );
  }

  lines.push("", "## Unknown Artifact IDs", "");
  if (result.report.unknown_artifact_ids.length === 0) {
    lines.push("- None");
  } else {
    for (const artifactId of result.report.unknown_artifact_ids) {
      lines.push(`- ${artifactId}`);
    }
  }

  lines.push("", "## Blocked Artifact IDs", "");
  if (result.report.blocked_artifact_ids.length === 0) {
    lines.push("- None");
  } else {
    for (const artifactId of result.report.blocked_artifact_ids) {
      lines.push(`- ${artifactId}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function buildPilotClassificationRows(business: string): PilotClassificationRow[] {
  const normalizedBusiness = business.trim().toUpperCase();

  const packRows: PilotClassificationRow[] = [
    {
      artifact_id: `${normalizedBusiness}-MARKET-PACK`,
      path: `docs/business-os/strategy/${normalizedBusiness}/market-pack.user.md`,
      domain: "MARKET",
      business: normalizedBusiness,
      artifact_class: "projection_summary",
      trigger_policy: "manual_override_only",
      propagation_mode: "projection_auto",
      classification_status: "classified",
      reason: "aggregate-pack cutover default",
    },
    {
      artifact_id: `${normalizedBusiness}-SELL-PACK`,
      path: `docs/business-os/strategy/${normalizedBusiness}/sell-pack.user.md`,
      domain: "SELL",
      business: normalizedBusiness,
      artifact_class: "projection_summary",
      trigger_policy: "manual_override_only",
      propagation_mode: "projection_auto",
      classification_status: "classified",
      reason: "aggregate-pack cutover default",
    },
    {
      artifact_id: `${normalizedBusiness}-PRODUCTS-PACK`,
      path: `docs/business-os/strategy/${normalizedBusiness}/product-pack.user.md`,
      domain: "PRODUCTS",
      business: normalizedBusiness,
      artifact_class: "projection_summary",
      trigger_policy: "manual_override_only",
      propagation_mode: "projection_auto",
      classification_status: "classified",
      reason: "aggregate-pack cutover default",
    },
    {
      artifact_id: `${normalizedBusiness}-LOGISTICS-PACK`,
      path: `docs/business-os/strategy/${normalizedBusiness}/logistics-pack.user.md`,
      domain: "LOGISTICS",
      business: normalizedBusiness,
      artifact_class: "projection_summary",
      trigger_policy: "manual_override_only",
      propagation_mode: "projection_auto",
      classification_status: "classified",
      reason: "aggregate-pack cutover default",
    },
  ];

  const sourceRows: PilotClassificationRow[] = Object.entries(PRIMARY_SOURCE_FILE_MAP).map(
    ([fileName, artifactClass]) => {
      const suffix = fileName.replace(/\.user\.md$/i, "").replaceAll("-", "_").toUpperCase();
      return {
        artifact_id: `${normalizedBusiness}-STRATEGY-${suffix}`,
        path: `docs/business-os/strategy/${normalizedBusiness}/${fileName}`,
        domain: "STRATEGY" as const,
        business: normalizedBusiness,
        artifact_class: artifactClass,
        trigger_policy: "eligible" as const,
        propagation_mode: "source_task" as const,
        classification_status: "classified" as const,
        reason: "primary source-process candidate",
      };
    },
  );

  return [...packRows, ...sourceRows].sort((left, right) =>
    left.artifact_id.localeCompare(right.artifact_id),
  );
}

export function renderPilotClassificationMarkdown(
  business: string,
  rows: PilotClassificationRow[],
  generatedAt: string,
): string {
  const lines: string[] = [
    "---",
    "Type: Registry-Classification-Pilot",
    "Status: Draft",
    `Business: ${business.trim().toUpperCase()}`,
    `Generated: ${generatedAt}`,
    "---",
    "",
    "# Registry v2 Classification Pilot",
    "",
    "## Scope",
    "",
    "- Includes all aggregate pack trigger artifacts and primary source-process artifacts for pilot scope.",
    "- Enforces cutover-safe defaults for pack artifacts.",
    "- Uses fail-closed defaults for unknown artifacts (none in this pilot seed).",
    "",
    "## Classification Table",
    "",
    "| Artifact ID | Path | Class | Trigger | Propagation | Status | Reason |",
    "|---|---|---|---|---|---|---|",
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.artifact_id} | ${row.path} | ${row.artifact_class} | ${row.trigger_policy} | ${row.propagation_mode} | ${row.classification_status} | ${row.reason} |`,
    );
  }

  lines.push(
    "",
    "## Validation Notes",
    "",
    "- No trigger-eligible row is unclassified.",
    "- Aggregate packs are `projection_summary + manual_override_only` per cutover contract.",
    "- Unknown artifacts remain fail-closed by policy (`trigger_policy: never`).",
  );

  return `${lines.join("\n")}\n`;
}

type CliOptions = {
  inputPath: string;
  outputPath: string;
  reportPath?: string;
  pilotBusiness?: string;
  pilotOutputPath?: string;
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    inputPath: "",
    outputPath: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--input":
        options.inputPath = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--output":
        options.outputPath = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--report":
        options.reportPath = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--pilot-business":
        options.pilotBusiness = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      case "--pilot-output":
        options.pilotOutputPath = String(argv[index + 1] ?? "").trim();
        index += 1;
        continue;
      default:
        break;
    }
  }

  return options;
}

function ensureParentDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function runCli(): void {
  const args = parseCliArgs(process.argv.slice(2));
  if (!args.inputPath || !args.outputPath) {
    console.error(
      "[lp-do-ideas-registry-migrate-v1-v2] Usage: pnpm --filter scripts exec tsx src/startup-loop/lp-do-ideas-registry-migrate-v1-v2.ts -- --input <registry.v1.json> --output <registry.v2.json> [--report <report.md>] [--pilot-business <BIZ> --pilot-output <pilot.md>]",
    );
    process.exitCode = 2;
    return;
  }

  const inputRaw = fs.readFileSync(args.inputPath, "utf8");
  const input = JSON.parse(inputRaw) as unknown;
  const result = migrateRegistryV1ToV2(input);

  ensureParentDir(args.outputPath);
  fs.writeFileSync(args.outputPath, `${JSON.stringify(result.registry, null, 2)}\n`, "utf8");

  if (args.reportPath) {
    ensureParentDir(args.reportPath);
    fs.writeFileSync(args.reportPath, renderRegistryMigrationReportMarkdown(result), "utf8");
  }

  if (args.pilotBusiness && args.pilotOutputPath) {
    const pilotRows = buildPilotClassificationRows(args.pilotBusiness);
    ensureParentDir(args.pilotOutputPath);
    fs.writeFileSync(
      args.pilotOutputPath,
      renderPilotClassificationMarkdown(args.pilotBusiness, pilotRows, nowIsoTimestamp()),
      "utf8",
    );
  }

  if (!result.ok) {
    console.error(
      `[lp-do-ideas-registry-migrate-v1-v2] migration completed with blocking conditions (fail_open_detected=${result.report.fail_open_detected})`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `[lp-do-ideas-registry-migrate-v1-v2] OK input=${result.report.counts.input_total} output=${result.report.counts.output_total} classified=${result.report.counts.classified} inferred=${result.report.counts.inferred} unknown=${result.report.counts.unknown} blocked=${result.report.counts.blocked}`,
  );
}

if (process.argv[1]?.includes("lp-do-ideas-registry-migrate-v1-v2")) {
  runCli();
}
