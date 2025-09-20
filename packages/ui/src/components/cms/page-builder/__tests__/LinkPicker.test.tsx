import { act, render, screen, within, fireEvent } from "@testing-library/react";
import React from "react";
import LinkPicker from "../LinkPicker";

describe("LinkPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists pages and calls onPick with page href", async () => {
    const onPick = jest.fn();
    // @ts-expect-error
    global.fetch = jest.fn().mockImplementation((input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/cms/api/pages/")) {
        return Promise.resolve({ ok: true, json: async () => ([
          { id: "p1", slug: "about", seo: { title: { en: "About Us" } } },
          { id: "p2", slug: "contact", seo: { title: { en: "Contact" } } },
        ])});
      }
      if (url.includes("/cms/api/products")) {
        return Promise.resolve({ ok: true, json: async () => ([])});
      }
      return Promise.resolve({ ok: true, json: async () => ([])});
    });

    render(<LinkPicker open onClose={() => {}} onPick={onPick} shop="bcd" />);

    const about = await screen.findByText("About Us");
    const item = about.closest("li")!;
    const selectBtn = within(item).getByRole("button", { name: "Select" });
    fireEvent.click(selectBtn);
    expect(onPick).toHaveBeenCalledWith("/about");
  });

  it("searches products by query and selects product href", async () => {
    jest.useFakeTimers();
    const onPick = jest.fn();
    const fetchMock = jest.fn().mockImplementation((input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/cms/api/pages/")) {
        return Promise.resolve({ ok: true, json: async () => ([])});
      }
      if (url.includes("/cms/api/products")) {
        const u = new URL(url, "http://localhost");
        const q = u.searchParams.get("q") || "";
        if (q === "shoe") {
          return Promise.resolve({ ok: true, json: async () => ([
            { slug: "sneaker", title: "Running Shoe" },
          ])});
        }
        return Promise.resolve({ ok: true, json: async () => ([])});
      }
      return Promise.resolve({ ok: true, json: async () => ([])});
    });
    // @ts-expect-error
    global.fetch = fetchMock;

    render(<LinkPicker open onClose={() => {}} onPick={onPick} shop="bcd" />);

    const input = screen.getByPlaceholderText("Search products…");
    fireEvent.change(input, { target: { value: "shoe" } });

    await act(async () => {
      jest.advanceTimersByTime(210);
    });

    const prod = await screen.findByText("Running Shoe");
    const row = prod.closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Select" }));
    expect(onPick).toHaveBeenCalledWith("/products/sneaker");
  });

  it("shows empty states when responses are invalid", async () => {
    jest.useFakeTimers();
    // @ts-expect-error
    global.fetch = jest.fn().mockImplementation((input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/cms/api/pages/")) {
        // non-ok response => pages should remain [] and show empty state
        return Promise.resolve({ ok: false, json: async () => ([]) });
      }
      if (url.includes("/cms/api/products")) {
        // simulate network-style failure by returning non-ok
        return Promise.resolve({ ok: false, json: async () => ([]) });
      }
      return Promise.resolve({ ok: true, json: async () => ([]) });
    });

    render(<LinkPicker open onClose={() => {}} onPick={jest.fn()} shop="bcd" />);

    // Pages appears immediately after fetch
    expect(await screen.findByText("No pages")).toBeInTheDocument();

    // Products list populates after debounce
    await act(async () => {
      jest.advanceTimersByTime(210);
    });
    expect(await screen.findByText("No products")).toBeInTheDocument();

    jest.useRealTimers();
  });
});
