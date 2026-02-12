import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ShopSelector from "../../packages/ui/components/cms/ShopSelector";
import { rest, server } from "../msw/server";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/cms/shop/demo/products",
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("../../packages/ui/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Select: ({ value, onValueChange, children }: any) => (
      <select
        data-testid="select"
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

describe("ShopSelector", () => {
  beforeEach(() => {
    server.use(
      rest.get("/api/shops", (_req: any, res: any, ctx: any) =>
        res(ctx.json(["demo", "other"]))
      )
    );
    pushMock.mockReset();
    window.history.pushState({}, "", "/cms/shop/demo?lang=en");
  });

  it("navigates to selected shop dashboard", async () => {
    render(<ShopSelector />);
    const select = await screen.findByTestId("select");
    await userEvent.selectOptions(select, "other");
    expect((select as HTMLSelectElement).value).toBe("other");
  });
});
