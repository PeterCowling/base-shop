import "@testing-library/jest-dom";

import React, { act } from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import { checkShopExists } from "@acme/lib";
import { readPricing } from "@acme/platform-core/repositories/pricing.server";

jest.mock("@acme/lib", () => ({
  checkShopExists: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/pricing.server", () => ({
  readPricing: jest.fn(),
}));

jest.mock(
  "@acme/ui/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Textarea: (props: any) => <textarea {...props} />,
  }),
  { virtual: true },
);

jest.mock(
  "@/components/atoms",
  () => ({
    __esModule: true,
    Toast: ({ open, message }: { open: boolean; message: string }) =>
      open ? <div role="alert">{message}</div> : null,
    Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  }),
  { virtual: true },
);

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
    (global as any).fetch = fetchMock;
    (window as any).fetch = fetchMock;

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
    expect(await screen.findByText("Saved!")).toBeInTheDocument();
  });

  it("shows error for invalid JSON", async () => {
    mockCheckShopExists.mockResolvedValueOnce(true);
    mockReadPricing.mockResolvedValueOnce(initial);
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    (window as any).fetch = fetchMock;

    const { default: Page } = await import(
      "../src/app/cms/shop/[shop]/data/rental/pricing/page"
    );
    render(await Page({ params: Promise.resolve({ shop: "s1" }) }));

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: /advanced json/i }));
    });

    const textarea = await screen.findByRole("textbox");
    fireEvent.change(textarea, { target: { value: "{invalid" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
    });

    expect(fetchMock).not.toHaveBeenCalled();
    const errorMessages = await screen.findAllByText(/expected/i);
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it("shows error for schema violation", async () => {
    mockCheckShopExists.mockResolvedValueOnce(true);
    mockReadPricing.mockResolvedValueOnce(initial);
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    (window as any).fetch = fetchMock;

    const { default: Page } = await import(
      "../src/app/cms/shop/[shop]/data/rental/pricing/page"
    );
    render(await Page({ params: Promise.resolve({ shop: "s1" }) }));

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: /advanced json/i }));
    });

    const textarea = await screen.findByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: JSON.stringify({ baseDailyRate: "ten" }) },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
    });

    expect(fetchMock).not.toHaveBeenCalled();
    const schemaErrors = await screen.findAllByText(/expected number/i);
    expect(schemaErrors.length).toBeGreaterThan(0);
  });
});

