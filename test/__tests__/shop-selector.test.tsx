import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { rest, server } from "../msw/server";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/cms/shop/demo/products",
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("../../packages/ui/src/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Select: ({ value, onValueChange, children, "data-cy": dataCy }: any) => (
      <select
        data-cy={dataCy}
        defaultValue={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    ),
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => (
      <option value={value}>{children}</option>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => (
      <option disabled value="">
        {placeholder}
      </option>
    ),
  };
});

import ShopSelector from "../../packages/ui/src/components/cms/ShopSelector";

describe("ShopSelector", () => {
  beforeEach(() => {
    server.use(
      rest.get("/api/shops", () => HttpResponse.json(["demo", "other"]))
    );
    pushMock.mockReset();
    window.history.pushState({}, "", "/cms/shop/demo?lang=en");
  });

  it("navigates to selected shop dashboard", async () => {
    render(<ShopSelector />);
    const select = await screen.findByTestId("shop-select");
    await userEvent.selectOptions(select, "other");
    expect((select as HTMLSelectElement).value).toBe("other");
  });
});
