import { NextResponse } from "next/server";
import type { WizardState } from "../../cms/wizard/schema";

export type StepStatus = "pending" | "success" | "failure";

interface LaunchRequest {
  shopId: string;
  state: WizardState;
  seed?: boolean;
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

  const statuses: LaunchStatuses = {
    create: "pending",
    init: "pending",
    deploy: "pending",
    ...(seed ? { seed: "pending" as StepStatus } : {}),
  };

  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const base = `${protocol}://${host}`;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: any, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/")) {
      input = base + input;
    } else if (input instanceof URL && input.pathname.startsWith("/")) {
      input = new URL(input, base).toString();
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  try {
    const { createShop } = await import("../../cms/wizard/services/createShop");
    const createRes = await createShop(shopId, state);
    statuses.create = createRes.ok ? "success" : "failure";
    if (!createRes.ok) {
      return NextResponse.json(
        { statuses, error: createRes.error },
        { status: 400 }
      );
    }

    const { initShop } = await import("../../cms/wizard/services/initShop");
    const initRes = await initShop(shopId, undefined, state.categoriesText);
    statuses.init = initRes.ok ? "success" : "failure";
    if (!initRes.ok) {
      return NextResponse.json(
        { statuses, error: initRes.error },
        { status: 400 }
      );
    }

    const { deployShop } = await import("../../cms/wizard/services/deployShop");
    const deployRes = await deployShop(shopId, state.domain ?? "");
    statuses.deploy = deployRes.ok ? "success" : "failure";
    if (!deployRes.ok) {
      return NextResponse.json(
        { statuses, error: deployRes.error },
        { status: 400 }
      );
    }

    if (seed) {
      const { seedShop } = await import("../../cms/wizard/services/seedShop");
      const seedRes = await seedShop(shopId, undefined, state.categoriesText);
      statuses.seed = seedRes.ok ? "success" : "failure";
      if (!seedRes.ok) {
        return NextResponse.json(
          { statuses, error: seedRes.error },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ statuses });
  } catch (err) {
    return NextResponse.json(
      { statuses, error: (err as Error).message },
      { status: 500 }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

