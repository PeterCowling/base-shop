import { promises as fs } from "fs";
import path from "path";

export interface SkillRegistryEntry {
  name: string;
  description: string;
  path: string; // repo-relative posix path
}

export interface SkillRegistry {
  schemaVersion: 1;
  skills: SkillRegistryEntry[];
}

function toPosixPath(p: string): string {
  return p.split(path.sep).join(path.posix.sep);
}

function safeJoin(baseDir: string, ...parts: string[]): string {
  const resolvedBase = path.resolve(baseDir);
  const joined = path.resolve(resolvedBase, ...parts);
  const withSep = `${resolvedBase}${path.sep}`;
  if (joined !== resolvedBase && !joined.startsWith(withSep)) {
    throw new Error(`[skill-registry] Path escapes repo root: ${joined}`);
  }
  return joined;
}

function parseFrontmatter(md: string): Record<string, string> {
  if (!md.startsWith("---\n")) return {};
  const end = md.indexOf("\n---\n", 4);
  if (end == -1) return {};
  const block = md.slice(4, end);
  const out: Record<string, string> = {};
  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx == -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
  return out;
}

function inferDescription(md: string): string {
  // Prefer first paragraph after the first H1.
  const lines = md.split("\n");
  let seenH1 = false;
  let inFence = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!seenH1) {
      if (line.startsWith("# ")) {
        seenH1 = true;
      }
      continue;
    }
    if (!line) continue;
    if (line.startsWith("#")) continue;
    return line.replace(/\s+/g, " ").slice(0, 200);
  }

  // Fallback: first non-empty non-heading line.
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;
    return line.replace(/\s+/g, " ").slice(0, 200);
  }

  return "(missing description)";
}

async function listSkillFiles(repoRoot: string): Promise<string[]> {
  const skillsDir = safeJoin(repoRoot, ".claude", "skills");
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const out: string[] = [];

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (ent.name === "_shared") continue;

    const skillMd = safeJoin(skillsDir, ent.name, "SKILL.md");
    try {
      const stat = await fs.stat(skillMd);
      if (stat.isFile()) out.push(skillMd);
    } catch {
      // Ignore directories without SKILL.md.
    }
  }

  return out.sort();
}

export async function buildSkillRegistry(
  repoRoot: string = process.cwd(),
): Promise<SkillRegistry> {
  const resolvedRoot = path.resolve(repoRoot);
  const skillFiles = await listSkillFiles(resolvedRoot);
  const skills: SkillRegistryEntry[] = [];

  for (const abs of skillFiles) {
    const rel = path.relative(resolvedRoot, abs);
    const md = await fs.readFile(abs, "utf8");
    const fm = parseFrontmatter(md);
    const dirName = path.basename(path.dirname(abs));

    const name = (fm.name || dirName).trim();
    const description = (fm.description || inferDescription(md)).trim();

    skills.push({
      name,
      description,
      path: toPosixPath(rel),
    });
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));

  return {
    schemaVersion: 1,
    skills,
  };
}

export function defaultRegistryPath(repoRoot: string = process.cwd()): string {
  return safeJoin(repoRoot, ".agents", "registry", "skills.json");
}

export async function writeSkillRegistry(
  registry: SkillRegistry,
  outPath: string,
): Promise<void> {
  const dir = path.dirname(outPath);
  await fs.mkdir(dir, { recursive: true });
  const body = `${JSON.stringify(registry, null, 2)}\n`;
  await fs.writeFile(outPath, body, "utf8");
}

export async function readSkillRegistry(filePath: string): Promise<SkillRegistry> {
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as unknown;
  if (!data || typeof data !== "object") {
    throw new TypeError(`[skill-registry] Invalid registry JSON: ${filePath}`);
  }
  const typed = data as Partial<SkillRegistry>;
  if (typed.schemaVersion !== 1 || !Array.isArray(typed.skills)) {
    throw new TypeError(`[skill-registry] Invalid registry schema: ${filePath}`);
  }
  return {
    schemaVersion: 1,
    skills: typed.skills.map((entry) => {
      const e = entry as Partial<SkillRegistryEntry>;
      return {
        name: String(e.name ?? ""),
        description: String(e.description ?? ""),
        path: String(e.path ?? ""),
      };
    }),
  };
}
