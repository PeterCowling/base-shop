import { promises as fs } from "fs";
import { load as loadYaml } from "js-yaml";
import path from "path";

export type GitSafetyDecision = "deny" | "allow";
export type GitSafetyEffect = "deny" | "allow" | "ask";

export interface GitSafetyPolicyTestCase {
  id: string;
  command: string;
  args: string[];
  expectedDecision: GitSafetyDecision;
  description: string;
  skipGuard?: boolean;
  skipHook?: boolean;
  guardEnv?: Record<string, string>;
}

export interface GitSafetyEvaluationSemantics {
  resolution: "priority_then_first_match" | "first_match_wins";
  defaultEffect: "allow" | "deny";
  askBehavior: "deny_if_noninteractive" | "allow";
}

export interface GitSafetyRule {
  id: string;
  effect: GitSafetyEffect;
  priority: number;
  rationale: string;
  match: Record<string, unknown> & { kind: string };
}

export interface ClaudePermissionsKernel {
  deny: string[];
  ask: string[];
  allow: string[];
}

export interface GitSafetyKernel {
  schemaVersion: 1;
  policyId?: string;
  evaluation?: GitSafetyEvaluationSemantics;
  rules?: GitSafetyRule[];
  claudePermissions: ClaudePermissionsKernel;
  policyTable: GitSafetyPolicyTestCase[];
}

function safeJoin(baseDir: string, ...parts: string[]): string {
  const resolvedBase = path.resolve(baseDir);
  const joined = path.resolve(resolvedBase, ...parts);
  const withSep = `${resolvedBase}${path.sep}`;
  if (joined !== resolvedBase && !joined.startsWith(withSep)) {
    throw new Error(`[git-safety-policy] Path escapes repo root: ${joined}`);
  }
  return joined;
}

export function defaultSafetyDocPath(repoRoot: string = process.cwd()): string {
  return safeJoin(repoRoot, "docs", "git-safety.md");
}

export function defaultClaudeSettingsPath(
  repoRoot: string = process.cwd(),
): string {
  return safeJoin(repoRoot, ".claude", "settings.json");
}

export function defaultGeneratedDir(repoRoot: string = process.cwd()): string {
  return safeJoin(repoRoot, ".agents", "safety", "generated");
}

export function defaultGeneratedJsonPath(
  repoRoot: string = process.cwd(),
): string {
  return safeJoin(defaultGeneratedDir(repoRoot), "git-safety-policy.json");
}

export function defaultGeneratedShellPath(
  repoRoot: string = process.cwd(),
): string {
  return safeJoin(defaultGeneratedDir(repoRoot), "git-safety-policy.sh");
}

export function extractKernelYamlFromDoc(doc: string): string {
  const lines = doc.split("\n");
  const startRe = /^```yaml\s+baseshop-git-safety-policy\s*$/;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (startRe.test(lines[i].trimEnd())) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) {
    throw new Error(
      "[git-safety-policy] Missing kernel fence: ```yaml baseshop-git-safety-policy",
    );
  }

  let end = -1;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].trim() === "```") {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw new Error("[git-safety-policy] Unterminated kernel fence (missing ```)");
  }

  return `${lines.slice(start, end).join("\n")}\n`;
}

function asStringArray(
  value: unknown,
  label: string,
): string[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`[git-safety-policy] ${label} must be an array`);
  }
  return value.map((v, i) => {
    if (typeof v !== "string") {
      throw new TypeError(
        `[git-safety-policy] ${label}[${i}] must be a string`,
      );
    }
    return v;
  });
}

function asOptionalBool(value: unknown, label: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new TypeError(`[git-safety-policy] ${label} must be a boolean`);
  }
  return value;
}

function asOptionalEnv(
  value: unknown,
  label: string,
): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`[git-safety-policy] ${label} must be an object`);
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    out[String(k)] = String(v);
  }
  return out;
}

function asOptionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new TypeError(`[git-safety-policy] ${label} must be a string`);
  }
  return value;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`[git-safety-policy] ${label} must be a finite number`);
  }
  return value;
}

function asEffect(value: unknown, label: string): GitSafetyEffect {
  if (value === "deny" || value === "allow" || value === "ask") return value;
  throw new TypeError(`[git-safety-policy] ${label} must be deny|allow|ask`);
}

function asMatch(value: unknown, label: string): Record<string, unknown> & { kind: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`[git-safety-policy] ${label} must be an object`);
  }
  const kind = (value as any).kind;
  if (typeof kind !== "string" || !kind) {
    throw new TypeError(`[git-safety-policy] ${label}.kind must be a non-empty string`);
  }
  return value as any;
}

function asOptionalEvaluation(
  value: unknown,
  label: string,
): GitSafetyEvaluationSemantics | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`[git-safety-policy] ${label} must be an object`);
  }
  const v = value as any;
  const resolution = String(v.resolution ?? "");
  if (
    resolution !== "priority_then_first_match" &&
    resolution !== "first_match_wins"
  ) {
    throw new TypeError(
      `[git-safety-policy] ${label}.resolution must be priority_then_first_match|first_match_wins`,
    );
  }
  const defaultEffect = String(v.defaultEffect ?? "");
  if (defaultEffect !== "allow" && defaultEffect !== "deny") {
    throw new TypeError(
      `[git-safety-policy] ${label}.defaultEffect must be allow|deny`,
    );
  }
  const askBehavior = String(v.askBehavior ?? "");
  if (askBehavior !== "deny_if_noninteractive" && askBehavior !== "allow") {
    throw new TypeError(
      `[git-safety-policy] ${label}.askBehavior must be deny_if_noninteractive|allow`,
    );
  }
  return {
    resolution,
    defaultEffect,
    askBehavior,
  } as GitSafetyEvaluationSemantics;
}

function asOptionalRules(value: unknown, label: string): GitSafetyRule[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new TypeError(`[git-safety-policy] ${label} must be an array`);
  }
  return value.map((v, i) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      throw new TypeError(`[git-safety-policy] ${label}[${i}] must be an object`);
    }
    const r = v as any;
    const id = String(r.id ?? "");
    if (!id) throw new TypeError(`[git-safety-policy] ${label}[${i}].id required`);
    return {
      id,
      effect: asEffect(r.effect, `${label}[${i}].effect`),
      priority: asNumber(r.priority, `${label}[${i}].priority`),
      rationale: String(r.rationale ?? ""),
      match: asMatch(r.match, `${label}[${i}].match`),
    };
  });
}

export function parseKernelYaml(yamlText: string): GitSafetyKernel {
  const data = loadYaml(yamlText) as unknown;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("[git-safety-policy] Kernel YAML must be a mapping");
  }
  const obj = data as Partial<GitSafetyKernel>;
  if (obj.schemaVersion !== 1) {
    throw new TypeError("[git-safety-policy] schemaVersion must be 1");
  }
  const policyId = asOptionalString((obj as any).policyId, "policyId");
  const evaluation = asOptionalEvaluation((obj as any).evaluation, "evaluation");
  const rules = asOptionalRules((obj as any).rules, "rules");
  const cp = (obj as any).claudePermissions as Partial<ClaudePermissionsKernel>;
  if (!cp || typeof cp !== "object") {
    throw new TypeError("[git-safety-policy] claudePermissions is required");
  }

  const claudePermissions: ClaudePermissionsKernel = {
    deny: asStringArray((cp as any).deny, "claudePermissions.deny"),
    ask: asStringArray((cp as any).ask, "claudePermissions.ask"),
    allow: asStringArray((cp as any).allow, "claudePermissions.allow"),
  };

  const policyTableRaw = (obj as any).policyTable;
  if (!Array.isArray(policyTableRaw)) {
    throw new TypeError("[git-safety-policy] policyTable must be an array");
  }

  const policyTable: GitSafetyPolicyTestCase[] = policyTableRaw.map((v, i) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      throw new TypeError(
        `[git-safety-policy] policyTable[${i}] must be an object`,
      );
    }
    const tc = v as Partial<GitSafetyPolicyTestCase>;
    const id = String(tc.id ?? "");
    const command = String(tc.command ?? "");
    const description = String(tc.description ?? "");
    const expectedDecision = String(tc.expectedDecision ?? "") as GitSafetyDecision;
    if (!id) throw new TypeError(`[git-safety-policy] policyTable[${i}].id required`);
    if (!command) {
      throw new TypeError(`[git-safety-policy] policyTable[${i}].command required`);
    }
    if (!description) {
      throw new TypeError(
        `[git-safety-policy] policyTable[${i}].description required`,
      );
    }
    if (expectedDecision !== "deny" && expectedDecision !== "allow") {
      throw new TypeError(
        `[git-safety-policy] policyTable[${i}].expectedDecision must be deny|allow`,
      );
    }
    const args = asStringArray((tc as any).args, `policyTable[${i}].args`);
    return {
      id,
      command,
      args,
      expectedDecision,
      description,
      skipGuard: asOptionalBool((tc as any).skipGuard, `policyTable[${i}].skipGuard`),
      skipHook: asOptionalBool((tc as any).skipHook, `policyTable[${i}].skipHook`),
      guardEnv: asOptionalEnv((tc as any).guardEnv, `policyTable[${i}].guardEnv`),
    };
  });

  const ids = policyTable.map((t) => t.id);
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    throw new Error("[git-safety-policy] policyTable IDs must be unique");
  }

  return {
    schemaVersion: 1,
    policyId,
    evaluation,
    rules,
    claudePermissions,
    policyTable,
  };
}

export async function readKernelFromDocs(
  repoRoot: string = process.cwd(),
): Promise<GitSafetyKernel> {
  const docPath = defaultSafetyDocPath(repoRoot);
  const doc = await fs.readFile(docPath, "utf8");
  const yamlText = extractKernelYamlFromDoc(doc);
  return parseKernelYaml(yamlText);
}

function shellQuoteSingle(s: string): string {
  // Safe single-quote for POSIX shells: close, escape, reopen.
  return `'${s.replace(/'/g, `'\"'\"'`)}'`;
}

export function renderShellInclude(kernel: GitSafetyKernel): string {
  const deny = kernel.claudePermissions.deny.map(shellQuoteSingle).join(" ");
  const ask = kernel.claudePermissions.ask.map(shellQuoteSingle).join(" ");
  const allow = kernel.claudePermissions.allow.map(shellQuoteSingle).join(" ");

  return [
    "#!/usr/bin/env bash",
    "#",
    "# Generated by scripts/agents/generate-git-safety-policy. DO NOT EDIT.",
    "# Source: docs/git-safety.md (```yaml baseshop-git-safety-policy)",
    "",
    "set -euo pipefail",
    "",
    `BASESHOP_CLAUDE_PERMISSIONS_DENY=(${deny})`,
    `BASESHOP_CLAUDE_PERMISSIONS_ASK=(${ask})`,
    `BASESHOP_CLAUDE_PERMISSIONS_ALLOW=(${allow})`,
    "",
    "",
  ].join("\n");
}
