import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ShopSelector from "../ShopSelector";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/cms/shop/demo/products",
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("../../atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Select: ({ value, onValueChange, children }: any) => (
      <select
        data-cy="shop-select"
        value={value ?? ""}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="" disabled>
          Select shop
        </option>
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => children,
    SelectValue: ({ placeholder }: any) => (
      <option disabled value="">
        {placeholder}
      </option>
    ),
    SelectContent: ({ children }: any) => children,
    SelectItem: ({ value, children }: any) => (
      <option value={value}>{children}</option>
    ),
  };
});

describe("ShopSelector", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("renders shops from API and navigates on selection", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(["demo", "other"]), { status: 200 })
      );

    window.history.pushState(
      {},
      "",
      "/cms/shop/demo/products?lang=en"
    );

    render(<ShopSelector />);

    expect(screen.getByText("Loading shops…")).toBeInTheDocument();
    const select = await screen.findByTestId("shop-select");
    await userEvent.selectOptions(select, "other");

    expect(pushMock).toHaveBeenCalledWith(
      "/cms/shop/other/products?lang=en"
    );
    fetchMock.mockRestore();
  });

  it("shows error message when API fails", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 500 }));

    render(<ShopSelector />);

    expect(await screen.findByText("Error 500")).toBeInTheDocument();
    fetchMock.mockRestore();
  });
});
