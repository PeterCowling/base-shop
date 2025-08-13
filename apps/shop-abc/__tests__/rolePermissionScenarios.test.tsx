import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

function PermissionButton() {
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const res = await fetch("/api/cart");
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    } else {
      setError(null);
    }
  }

  return (
    <>
      <button onClick={handleClick}>Add</button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}

describe("permission scenarios", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("viewer cannot add to cart", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

    render(<PermissionButton />);

    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Unauthorized")
    );
  });

  test("customer can add to cart", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<PermissionButton />);

    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    );
  });
});

jest.mock("@auth", () => ({ requirePermission: jest.fn() }));
jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: jest.fn(async () => ({ metadata: {}, payment_intent: { id: "pi" } })) } },
    refunds: { create: jest.fn() },
  },
}));
jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  markReturned: jest.fn(async () => ({})),
  markRefunded: jest.fn(),
}));
jest.mock("@shared-utils", () => ({
  parseJsonBody: jest.fn(async () => ({ success: true, data: { sessionId: "sess" } })),
}));
import { requirePermission } from "@auth";
import { POST as returnPost } from "../src/app/api/return/route";

function returnRequest(body: any): Parameters<typeof returnPost>[0] {
  return {} as any;
}

describe("manage orders permission", () => {
  afterEach(() => jest.clearAllMocks());

  test("customer cannot manage orders", async () => {
    (requirePermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
    const res = await returnPost(returnRequest({ sessionId: "sess" }));
    expect(res.status).toBe(401);
  });

  test("admin can manage orders", async () => {
    (requirePermission as jest.Mock).mockResolvedValue({});
    const res = await returnPost(returnRequest({ sessionId: "sess" }));
    expect(res.status).toBe(200);
  });
});
