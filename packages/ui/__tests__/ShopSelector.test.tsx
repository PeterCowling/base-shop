import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ShopSelector from "../src/components/cms/ShopSelector";

const pushMock = jest.fn();
const onChange = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/cms/shop/demo/products",
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("../src/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Select: ({ value, onValueChange, children }: any) => (
      <select
        data-cy="shop-select"
        value={value ?? ""}
        onChange={(e) => {
          onChange(e.target.value);
          onValueChange(e.target.value);
        }}
      >
        <option value="" disabled>
          Select shop
        </option>
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => (
      <option disabled value="">
        {placeholder}
      </option>
    ),
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => (
      <option value={value}>{children}</option>
    ),
  };
});

describe("ShopSelector", () => {
  beforeEach(() => {
    pushMock.mockReset();
    onChange.mockReset();
  });

  it("emits selected shop via onChange", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(["demo", "other"]), { status: 200 })
      );

    render(<ShopSelector />);

    const select = await screen.findByTestId("shop-select");
    await userEvent.selectOptions(select, "other");

    expect(onChange).toHaveBeenCalledWith("other");
    fetchMock.mockRestore();
  });

  it("shows server error message when fetch not ok", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
        })
      );

    render(<ShopSelector />);

    expect(await screen.findByText("Server error")).toBeInTheDocument();
    fetchMock.mockRestore();
  });

  it("shows invalid response error when JSON is not an array", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ foo: "bar" }), { status: 200 })
      );

    render(<ShopSelector />);

    expect(await screen.findByText("Invalid response")).toBeInTheDocument();
    fetchMock.mockRestore();
  });

  it("shows no shops found message when API returns empty array", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 })
      );

    render(<ShopSelector />);

    expect(await screen.findByText("No shops found.")).toBeInTheDocument();
    fetchMock.mockRestore();
  });

  it("falls back to error text when fetch rejects", async () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockRejectedValueOnce(new Error("Network error"));

    render(<ShopSelector />);

    expect(await screen.findByText("Network error")).toBeInTheDocument();
    expect(screen.queryByTestId("shop-select")).not.toBeInTheDocument();
    fetchMock.mockRestore();
    consoleErrorMock.mockRestore();
  });
});

