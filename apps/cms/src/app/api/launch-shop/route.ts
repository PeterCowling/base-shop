import { TransformStream } from "node:stream/web";
import type { ConfiguratorState } from "../../cms/wizard/schema";
import { getRequiredSteps } from "../../cms/configurator/steps";
import { configuratorChecks, type ConfigCheckResult } from "@platform-core/configurator";
import type { ConfiguratorStepId } from "@acme/types";

export type StepStatus = "pending" | "success" | "failure";

interface LaunchRequest {
  shopId: string;
  state: ConfiguratorState;
  seed?: boolean;
}

interface StreamMessage {
  step?: keyof LaunchStatuses;
  status?: StepStatus;
  error?: string;
  done?: boolean;
}

interface LaunchStatuses {
  create: StepStatus;
  init: StepStatus;
  deploy: StepStatus;
  seed?: StepStatus;
}

const REQUIRED_CONFIG_CHECK_STEPS: ConfiguratorStepId[] = [
  "shop-basics",
  "theme",
  "payments",
  "shipping-tax",
  "checkout",
  "products-inventory",
  "navigation-home",
];

async function runRequiredConfigChecks(
  shopId: string
): Promise<{ ok: boolean; error?: string }> {
  const failures: string[] = [];
  for (const stepId of REQUIRED_CONFIG_CHECK_STEPS) {
    const check = configuratorChecks[stepId];
    if (!check) continue;
    let result: ConfigCheckResult;
    try {
      result = await check(shopId);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "unknown-error";
      failures.push(`${stepId}:${message}`);
      continue;
    }
    if (!result.ok) {
      const reason = result.reason || "failed";
      failures.push(`${stepId}:${reason}`);
    }
  }

  if (failures.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    // i18n-exempt: service-level fallback string; surfaced in UI as-is
    error: `Configuration checks failed for steps: ${failures.join(", ")}`,
  };
}

export async function POST(req: Request) {
  const body = (await req.json()) as LaunchRequest;
  const { shopId, state, seed } = body;

  const missingSteps = getRequiredSteps()
    .filter((s) => state.completed?.[s.id] !== "complete")
    .map((s) => s.id);

  if (missingSteps.length > 0) {
    return Response.json(
      { error: "Missing required steps", missingSteps },
      { status: 400 }
    );
  }

  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const base = `${protocol}://${host}`;

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
        return deployShop(shopId, state.domain ?? "");
      });
      if (!okDeploy) return;

      if (seed) {
        const { seedShop } = await import(
          "../../cms/wizard/services/seedShop"
        );
        const okSeed = await update("seed", () =>
          seedShop(shopId, undefined, state.categoriesText)
        );
        if (!okSeed) return;
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
