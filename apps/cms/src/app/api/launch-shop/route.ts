import type { WizardState } from "../../cms/wizard/schema";

export type StepStatus = "pending" | "success" | "failure";

interface LaunchRequest {
  shopId: string;
  state: WizardState;
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

export async function POST(req: Request) {
  const body = (await req.json()) as LaunchRequest;
  const { shopId, state, seed } = body;

  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const base = `${protocol}://${host}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = ((input: any, init?: RequestInit) => {
        if (typeof input === "string" && input.startsWith("/")) {
          input = base + input;
        } else if (input instanceof URL && input.pathname.startsWith("/")) {
          input = new URL(input, base).toString();
        }
        return originalFetch(input, init);
      }) as typeof fetch;

      const send = (msg: StreamMessage) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
        );
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
        const okDeploy = await update("deploy", () =>
          deployShop(shopId, state.domain ?? "")
        );
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
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

