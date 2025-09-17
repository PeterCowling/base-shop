import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import React from "react";

jest.mock("@acme/lib", () => ({
  checkShopExists: jest.fn(),
}));

jest.mock("@platform-core/repositories/pricing.server", () => ({
  readPricing: jest.fn(),
}));

jest.mock(
  "@ui/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Checkbox: ({ onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        {...props}
      />
    ),
    Input: (props: any) => <input {...props} />,
    Textarea: (props: any) => <textarea {...props} />,
  }),
  { virtual: true },
);

import { checkShopExists } from "@acme/lib";
import { readPricing } from "@platform-core/repositories/pricing.server";

const mockCheckShopExists = checkShopExists as jest.Mock;
const mockReadPricing = readPricing as jest.Mock;

const initial = {
  baseDailyRate: 10,
  durationDiscounts: [],
  damageFees: {},
  coverage: {},
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("PricingForm", () => {
  it("posts valid JSON and shows success", async () => {
    mockCheckShopExists.mockResolvedValueOnce(true);
    mockReadPricing.mockResolvedValueOnce(initial);
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    // @ts-expect-error assign global fetch for jsdom
    global.fetch = fetchMock;
    // @ts-expect-error assign window fetch
    window.fetch = fetchMock;

    const { default: Page } = await import(
      "../src/app/cms/shop/[shop]/data/rental/pricing/page"
    );
    render(await Page({ params: Promise.resolve({ shop: "s1" }) }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/data/s1/rental/pricing",
      expect.objectContaining({ method: "POST" })
    );
    expect(await screen.findByText("Pricing saved")).toBeInTheDocument();
  });

  it("shows error for invalid JSON", async () => {
    mockCheckShopExists.mockResolvedValueOnce(true);
    mockReadPricing.mockResolvedValueOnce(initial);
    const fetchMock = jest.fn();
    // @ts-expect-error assign global fetch for jsdom
    global.fetch = fetchMock;
    // @ts-expect-error assign window fetch
    window.fetch = fetchMock;

    const { default: Page } = await import(
      "../src/app/cms/shop/[shop]/data/rental/pricing/page"
    );
    render(await Page({ params: Promise.resolve({ shop: "s1" }) }));

    fireEvent.click(screen.getByRole("tab", { name: /advanced json/i }));

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "{invalid" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText(/expected/i, { selector: "p" })).toBeInTheDocument();
  });

  it("shows error for schema violation", async () => {
    mockCheckShopExists.mockResolvedValueOnce(true);
    mockReadPricing.mockResolvedValueOnce(initial);
    const fetchMock = jest.fn();
    // @ts-expect-error assign global fetch for jsdom
    global.fetch = fetchMock;
    // @ts-expect-error assign window fetch
    window.fetch = fetchMock;

    const { default: Page } = await import(
      "../src/app/cms/shop/[shop]/data/rental/pricing/page"
    );
    render(await Page({ params: Promise.resolve({ shop: "s1" }) }));

    fireEvent.click(screen.getByRole("tab", { name: /advanced json/i }));

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: JSON.stringify({ baseDailyRate: "ten" }) },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText(/expected number/i, { selector: "p" })).toBeInTheDocument();
  });
});

