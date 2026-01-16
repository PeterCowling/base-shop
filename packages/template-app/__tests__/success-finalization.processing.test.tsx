/** @jest-environment jsdom */

jest.mock("next/navigation", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const actual = jest.requireActual("next/navigation");
  const params = new URLSearchParams("orderId=cs_test_123");
  return {
    ...actual,
    useSearchParams: () => params,
  };
});

import { render, screen } from "@testing-library/react";
import SuccessFinalization from "../src/app/success/SuccessFinalization.client";

describe("SuccessFinalization", () => {
  it("shows processing label while the order is pending", () => {
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true, state: "processing" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    render(
      <SuccessFinalization
        processingLabel="Processing…"
        thanksLabel="Thanks for your order!"
        paymentReceivedLabel="Your payment was received."
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Processing…/i }),
    ).toBeInTheDocument();

    fetchSpy.mockRestore();
  });
});
