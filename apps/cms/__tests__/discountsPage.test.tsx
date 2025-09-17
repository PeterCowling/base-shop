import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiscountsPage from "../src/app/cms/marketing/discounts/page";

describe("DiscountsPage", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    // @ts-expect-error jsdom window
    window.fetch = originalFetch;
  });

  test("handles creating, toggling, deleting, and empty state", async () => {
    let discounts: any[] = [];

    const fetchMock = jest.fn(
      async (url: RequestInfo, options?: RequestInit) => {
        const method = options?.method ?? "GET";
        const u = typeof url === "string" ? url : url.toString();

        if (u.startsWith("/api/marketing/discounts")) {
          if (method === "GET") {
            return { ok: true, json: async () => [...discounts] } as any;
          }
          if (method === "POST") {
            const body = JSON.parse(options!.body as string);
            const entry = {
              code: body.code,
              description: body.description,
              discountPercent: body.discountPercent,
              active: true,
            };
            const idx = discounts.findIndex((d) => d.code === body.code);
            if (idx >= 0) discounts[idx] = entry;
            else discounts.push(entry);
            discounts = [...discounts];
            return { ok: true, json: async () => ({}) } as any;
          }
          if (method === "PUT") {
            const body = JSON.parse(options!.body as string);
            const idx = discounts.findIndex((d) => d.code === body.code);
            if (idx >= 0) {
              discounts[idx] = { ...discounts[idx], active: body.active };
              discounts = [...discounts];
            }
            return { ok: true, json: async () => ({}) } as any;
          }
          if (method === "DELETE") {
            const urlObj = new URL(u, "http://localhost");
            const code = urlObj.searchParams.get("code");
            discounts = discounts.filter((d) => d.code !== code);
            return { ok: true, json: async () => ({}) } as any;
          }
        }

        throw new Error(`Unhandled fetch call: ${u}`);
      },
    );

    global.fetch = fetchMock as any;
    // @ts-expect-error jsdom window
    window.fetch = fetchMock as any;

    const user = userEvent.setup();
    render(<DiscountsPage />);

    // initial empty state
    expect(
      await screen.findByText("No discounts have been configured yet."),
    ).toBeInTheDocument();

    // create a discount
    const codeField = await screen.findByLabelText(/Code/i);
    await user.type(codeField, "SAVE10");
    await user.type(screen.getByLabelText(/Internal note/i), "10% off");
    const percent = screen.getByLabelText(/Discount %/i);
    await user.clear(percent);
    await user.type(percent, "10");
    await user.click(screen.getByRole("button", { name: "Save discount" }));

    expect(await screen.findByText("SAVE10")).toBeInTheDocument();

    // toggle activation
    await user.click(screen.getByRole("button", { name: "Active" }));
    expect(await screen.findByRole("button", { name: "Inactive" })).toBeInTheDocument();

    // delete the discount
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      await screen.findByText("No discounts have been configured yet."),
    ).toBeInTheDocument();
  });
});

