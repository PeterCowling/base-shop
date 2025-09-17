import "@testing-library/jest-dom";
import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const updateUpsReturns = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ updateUpsReturns }));
jest.mock("@/components/atoms", () => ({
  Toast: ({ open, message, role = "status" }: any) =>
    open ? (
      <div role={role}>
        <span>{message}</span>
      </div>
    ) : null,
  Switch: ({ onChange, ...props }: any) => (
    <input
      type="checkbox"
      onChange={(event) => onChange?.(event)}
      {...props}
    />
  ),
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));
jest.mock("@/components/atoms/shadcn", () => ({
  Button: (props: any) => <button {...props} />,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

import ReturnsEditor from "../src/app/cms/shop/[shop]/settings/returns/ReturnsEditor";

describe("ReturnsEditor", () => {
  it("submits form and updates state", async () => {
    updateUpsReturns.mockResolvedValue({
      settings: {
        returnService: {
          upsEnabled: true,
          bagEnabled: true,
          homePickupEnabled: false,
        },
      },
    });
    render(
      <ReturnsEditor
        shop="s1"
        initial={{
          upsEnabled: false,
          bagEnabled: false,
          homePickupEnabled: false,
        }}
      />,
    );
    const save = screen.getByRole("button", { name: /save/i });
    const form = save.closest("form")!;
    const returnsToggle = screen.getByLabelText("UPS returns");
    fireEvent.click(returnsToggle);

    await act(async () => {
      fireEvent.submit(form);
    });
    expect(updateUpsReturns).toHaveBeenCalledWith("s1", expect.any(FormData));
    expect(screen.getByLabelText("UPS returns")).toBeChecked();
    expect(screen.getByLabelText("Return bags")).toBeChecked();
  });
});
