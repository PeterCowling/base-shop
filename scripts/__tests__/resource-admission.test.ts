import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const ADMISSION_SCRIPT = path.join(REPO_ROOT, "scripts/tests/resource-admission.sh");
const HISTORY_SCRIPT = path.join(REPO_ROOT, "scripts/tests/history-store.sh");

interface ScriptResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "admission-test-"));
  execSync("git init", { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: "ignore" });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: "ignore" });
  execSync('git commit --allow-empty -m "init"', {
    cwd: tmpDir,
    stdio: "ignore",
  });
  return tmpDir;
}

function cleanupTempRepo(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best effort
  }
}

function runScript(
  script: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  cwd: string,
): ScriptResult {
  const result = spawnSync("bash", [script, ...args], {
    cwd,
    env,
    timeout: 15_000,
  });
  return {
    status: result.status,
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
  };
}

function parseKeyValueOutput(stdout: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of stdout.split("\n")) {
    const idx = line.indexOf("=");
    if (idx <= 0) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

describe("Resource admission", () => {
  const repos: string[] = [];

  function newRepo(): string {
    const repo = createTempGitRepo();
    repos.push(repo);
    return repo;
  }

  beforeAll(() => {
    expect(fs.existsSync(ADMISSION_SCRIPT)).toBe(true);
    expect(fs.existsSync(HISTORY_SCRIPT)).toBe(true);
    fs.chmodSync(ADMISSION_SCRIPT, 0o755);
    fs.chmodSync(HISTORY_SCRIPT, 0o755);
  });

  afterEach(() => {
    for (const repo of repos) {
      cleanupTempRepo(repo);
    }
    repos.length = 0;
  });

  test("TC-01: below-threshold run is admitted", () => {
    const repo = newRepo();
    const env = {
      ...process.env,
      BASESHOP_GUARD_REPO_ROOT: repo,
      BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB: "16000",
      BASESHOP_ADMISSION_MOCK_LOGICAL_CPU: "10",
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "2000",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "1",
      BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL: "normal",
    };

    const result = runScript(
      ADMISSION_SCRIPT,
      ["decide", "--class", "governed-jest", "--normalized-sig", "governed-jest", "--workers", "2"],
      env,
      repo,
    );
    expect(result.status).toBe(0);
    const kv = parseKeyValueOutput(result.stdout);
    expect(kv.allow).toBe("true");
    expect(kv.reason).toBe("admitted");
  });

  test("TC-02: above-threshold run queues instead of admitting", () => {
    const repo = newRepo();
    const env = {
      ...process.env,
      BASESHOP_GUARD_REPO_ROOT: repo,
      BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB: "16000",
      BASESHOP_ADMISSION_MOCK_LOGICAL_CPU: "10",
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "9000",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "1",
      BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL: "normal",
    };

    const result = runScript(
      ADMISSION_SCRIPT,
      ["decide", "--class", "governed-jest", "--normalized-sig", "governed-jest", "--workers", "2"],
      env,
      repo,
    );
    expect(result.status).toBe(0);
    const kv = parseKeyValueOutput(result.stdout);
    expect(kv.allow).toBe("false");
    expect(kv.reason).toBe("memory-budget");
  });

  test("TC-03: CPU slot saturation queues even when memory permits", () => {
    const repo = newRepo();
    const env = {
      ...process.env,
      BASESHOP_GUARD_REPO_ROOT: repo,
      BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB: "16000",
      BASESHOP_ADMISSION_MOCK_LOGICAL_CPU: "10",
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "1000",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "7",
      BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL: "normal",
    };

    const result = runScript(
      ADMISSION_SCRIPT,
      ["decide", "--class", "governed-jest", "--normalized-sig", "governed-jest", "--workers", "2"],
      env,
      repo,
    );
    expect(result.status).toBe(0);
    const kv = parseKeyValueOutput(result.stdout);
    expect(kv.allow).toBe("false");
    expect(kv.reason).toBe("cpu-slots");
  });

  test("TC-04: corrupted history falls back to seed budgets safely", () => {
    const repo = newRepo();
    const historyPath = path.join(repo, ".cache/test-governor/history.json");
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.writeFileSync(historyPath, "{not-json}");

    const env = {
      ...process.env,
      BASESHOP_GUARD_REPO_ROOT: repo,
      BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB: "16000",
      BASESHOP_ADMISSION_MOCK_LOGICAL_CPU: "10",
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "1000",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "1",
      BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL: "normal",
    };

    const result = runScript(
      ADMISSION_SCRIPT,
      ["decide", "--class", "governed-jest", "--normalized-sig", "governed-jest", "--workers", "2"],
      env,
      repo,
    );
    expect(result.status).toBe(0);
    const kv = parseKeyValueOutput(result.stdout);
    expect(kv.allow).toBe("true");
    expect(kv.class_budget_source).toBe("seed");
  });

  test("TC-05: concurrent history writes remain valid JSON and preserve samples", () => {
    const repo = newRepo();
    const script = `
      pids=()
      for i in $(seq 1 20); do
        BASESHOP_GUARD_REPO_ROOT=${repo} bash ${HISTORY_SCRIPT} record --normalized-sig governed-jest --peak-rss-mb $((1000 + i)) &
        pids+=($!)
      done
      status=0
      for pid in "\${pids[@]}"; do
        wait "$pid" || status=1
      done
      exit "$status"
    `;
    const result = spawnSync("bash", ["-lc", script], {
      cwd: repo,
      env: process.env,
      timeout: 20_000,
    });
    expect(result.status).toBe(0);

    const historyPath = path.join(repo, ".cache/test-governor/history.json");
    const parsed = JSON.parse(fs.readFileSync(historyPath, "utf8")) as {
      signatures: Record<string, { sample_count: number }>;
    };
    expect(parsed.signatures["governed-jest"].sample_count).toBeGreaterThanOrEqual(20);
  });

  test("TC-07: formula conformance uses 60% memory and 70% CPU slots", () => {
    const repo = newRepo();
    const env = {
      ...process.env,
      BASESHOP_GUARD_REPO_ROOT: repo,
      BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB: "16000",
      BASESHOP_ADMISSION_MOCK_LOGICAL_CPU: "10",
      BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB: "1000",
      BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS: "1",
      BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL: "normal",
    };

    const result = runScript(
      ADMISSION_SCRIPT,
      ["decide", "--class", "governed-jest", "--normalized-sig", "governed-jest", "--workers", "2"],
      env,
      repo,
    );
    expect(result.status).toBe(0);
    const kv = parseKeyValueOutput(result.stdout);
    expect(kv.memory_budget_mb).toBe("9600");
    expect(kv.cpu_slots_total).toBe("7");
  });
});
