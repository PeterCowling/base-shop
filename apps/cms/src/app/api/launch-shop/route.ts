import { TransformStream } from "node:stream/web";
import * as fsSync from "fs";
import path from "path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";
import { getRequiredSteps } from "../../cms/configurator/steps";
import {
  runRequiredConfigChecks,
  getConfiguratorProgressForShop,
} from "@platform-core/configurator";
import { verifyShopAfterDeploy } from "@cms/actions/verifyShopAfterDeploy.server";
import { enqueueDeploy } from "@cms/lib/deployQueue";
import type { Environment } from "@acme/types";
import {
  configuratorStateSchema,
  type ConfiguratorState,
  type StepStatus,
} from "../../cms/wizard/schema";
import {
  evaluateProdGate,
  getLaunchGate,
  recordFirstProdLaunch,
  recordStageTests,
} from "@/lib/server/launchGate";

export type LaunchStepStatus = "pending" | "success" | "failure";

interface LaunchRequest {
  shopId: string;
  state: ConfiguratorState;
  seed?: boolean;
  env?: Environment;
}

interface StreamMessage {
  step?: keyof LaunchStatuses;
  status?: LaunchStepStatus;
  error?: string;
  done?: boolean;
}

interface LaunchStatuses {
  create: LaunchStepStatus;
  init: LaunchStepStatus;
  deploy: LaunchStepStatus;
  tests?: LaunchStepStatus;
  seed?: LaunchStepStatus;
}

type PersistedConfiguratorState = {
  state: ConfiguratorState;
  completed: Record<string, StepStatus>;
};

const resolveConfiguratorProgressFile = (): string => {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "cms", "configurator-progress.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3106: derived from cwd walk; no user input
    if (fsSync.existsSync(path.dirname(candidate))) {
      // Migrate legacy filename if present
      const legacy = path.join(dir, "data", "cms", "wizard-progress.json");
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3106: fixed filenames in controlled dir
      if (!fsSync.existsSync(candidate) && fsSync.existsSync(legacy)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3106: migrate validated repo-local files
        fsSync.renameSync(legacy, candidate);
      }
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "cms", "configurator-progress.json");
};

const CONFIGURATOR_PROGRESS_FILE = resolveConfiguratorProgressFile();
const CONFIGURATOR_PROGRESS_BACKUP = `${CONFIGURATOR_PROGRESS_FILE}.bak`;

function readConfiguratorProgress(): Record<
  string,
  { state?: unknown; completed?: Record<string, StepStatus> }
> {
  const read = (file: string) => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3106: repo-local path derived from validated location
    const raw = fsSync.readFileSync(file, "utf8");
    return JSON.parse(raw) as Record<string, { state?: unknown; completed?: Record<string, StepStatus> }>;
  };
  try {
    return read(CONFIGURATOR_PROGRESS_FILE);
  } catch {
    try {
      return read(CONFIGURATOR_PROGRESS_BACKUP);
    } catch {
      return {};
    }
  }
}

async function readPersistedConfiguratorState(
  userId: string | undefined,
): Promise<PersistedConfiguratorState | null> {
  if (!userId) return null;
  try {
    const parsed = readConfiguratorProgress();
    const entry = parsed[userId];
    if (!entry || typeof entry !== "object") return null;
    const safeState = configuratorStateSchema.safeParse({
      ...(entry.state ?? {}),
      completed: entry.completed ?? {},
    });
    if (!safeState.success) return null;
    return {
      state: safeState.data as ConfiguratorState,
      completed: (safeState.data.completed ?? {}) as Record<string, StepStatus>,
    };
  } catch {
    return null;
  }
}

async function requireCsrf(req: Request): Promise<void> {
  const header = req.headers.get("x-csrf-token");
  const cookieStore = await cookies();
  const cookie = cookieStore.get("csrf_token")?.value || null;
  if (!header || !cookie || header !== cookie) {
    throw new Error("Forbidden");
  }
}

export async function POST(req: Request) {
  try {
    await requireCsrf(req);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let session: Awaited<ReturnType<typeof ensureAuthorized>>;
  try {
    session = await ensureAuthorized();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as LaunchRequest;
  const { shopId: bodyShopId, state: incomingState, seed, env: requestedEnv } = body;

  const persisted = await readPersistedConfiguratorState(session.user?.id);
  const mergedState = configuratorStateSchema.safeParse({
    ...(persisted?.state ?? {}),
    ...(incomingState ?? {}),
    completed: {
      ...(persisted?.completed ?? {}),
      ...(incomingState?.completed ?? {}),
    },
  });
  if (!mergedState.success) {
    return NextResponse.json({ error: "Invalid configurator state" }, { status: 400 });
  }

  const state = mergedState.data as ConfiguratorState;
  const shopId = state.shopId || bodyShopId;

  const missingSteps = getRequiredSteps()
    .filter((s) => state.completed?.[s.id] !== "complete")
    .map((s) => s.id);

  if (!shopId) {
    return NextResponse.json({ error: "Missing shop id" }, { status: 400 });
  }

  // Always re-evaluate server-side configurator checks to avoid stale client state.
  try {
    const progress = await getConfiguratorProgressForShop(shopId);
    const blocking = getRequiredSteps()
      .map((s) => s.id)
      .filter((id) => progress.steps[id as keyof typeof progress.steps] !== "complete");
    if (blocking.length > 0) {
      return NextResponse.json(
        { error: "Missing required steps", missingSteps: blocking },
        { status: 400 },
      );
    }
  } catch {
    // If progress cannot be loaded, fall back to local validation.
  }

  if (missingSteps.length > 0) {
    return NextResponse.json(
      { error: "Missing required steps", missingSteps },
      { status: 400 }
    );
  }

  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const base = `${protocol}://${host}`;
  const env: Environment = requestedEnv ?? "stage";
  const smokeEnabled = process.env.SHOP_SMOKE_ENABLED === "1";

  if (env === "prod") {
    try {
      const gate = await getLaunchGate(shopId);
      const evaluation = evaluateProdGate(gate, { smokeEnabled });
      if (!evaluation.allowed) {
        return NextResponse.json(
          { error: "stage-gate", missing: evaluation.missing, env: "stage" },
          { status: 400 },
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message ?? "Stage gate blocked" },
        { status: 400 },
      );
    }
  }

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array>();
  const writer = writable.getWriter();

  (async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string" && input.startsWith("/")) {
        input = base + input;
      } else if (input instanceof URL && input.pathname.startsWith("/")) {
        input = new URL(input, base).toString();
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    const send = (msg: StreamMessage) => {
      writer.write(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
    };

    const update = async (
      step: keyof LaunchStatuses,
      fn: () => Promise<{ ok: boolean; error?: string }>
    ) => {
      send({ step, status: "pending" });
      const res = await fn();
      send({ step, status: res.ok ? "success" : "failure", error: res.error });
      return res.ok;
    };

    try {
      const { createShop } = await import(
        "../../cms/wizard/services/createShop"
      );
      const okCreate = await update("create", () => createShop(shopId, state));
      if (!okCreate) return;

      const { initShop } = await import(
        "../../cms/wizard/services/initShop"
      );
      const okInit = await update("init", () =>
        initShop(shopId, undefined, state.categoriesText)
      );
      if (!okInit) return;

      const { deployShop } = await import(
        "../../cms/wizard/services/deployShop"
      );
      const okDeploy = await update("deploy", async () => {
        const checks = await runRequiredConfigChecks(shopId);
        if (!checks.ok) {
          return checks;
        }
        const deployResult = await enqueueDeploy(shopId, () =>
          deployShop(shopId, state.domain ?? "", env),
        );
        if (!deployResult.ok) {
          return { ok: false, error: deployResult.error };
        }
        return deployResult.result ?? { ok: true };
      });
      if (!okDeploy) return;

      const testsTimestamp = new Date().toISOString();
      const okTests = await update("tests", async () => {
        const verification = await verifyShopAfterDeploy(shopId, env);
        if (env === "stage") {
          try {
            await recordStageTests(shopId, {
              status: verification.status,
              error: verification.error,
              at: testsTimestamp,
              version: testsTimestamp,
              smokeEnabled,
            });
          } catch {
            /* best-effort gate persistence */
          }
        }
        return {
          // Treat "not-run" as a neutral status so environments that
          // have not enabled the smoke suite can still launch.
          ok:
            verification.status === "passed" ||
            verification.status === "not-run",
          error: verification.error,
        };
      });
      if (!okTests) return;

      if (seed) {
        const { seedShop } = await import(
          "../../cms/wizard/services/seedShop"
        );
        const okSeed = await update("seed", () =>
          seedShop(shopId, undefined, state.categoriesText)
        );
        if (!okSeed) return;
      }

      if (env === "prod") {
        try {
          await recordFirstProdLaunch(shopId);
        } catch {
          /* best-effort gate persistence */
        }
      }

      send({ done: true });
    } catch (err) {
      send({ step: undefined, status: "failure", error: (err as Error).message });
    } finally {
      globalThis.fetch = originalFetch;
      await writer.close();
    }
  })();

  const stream = readable as unknown as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
