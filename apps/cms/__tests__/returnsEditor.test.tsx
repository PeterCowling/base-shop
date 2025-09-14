import "@testing-library/jest-dom";
import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const updateUpsReturns = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ updateUpsReturns }));
jest.mock("@/components/atoms/shadcn", () => ({
  Button: (props: any) => <button {...props} />,
  Checkbox: ({ onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      onChange={(e) => onCheckedChange?.((e.target as HTMLInputElement).checked)}
      {...props}
    />
  ),
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
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(updateUpsReturns).toHaveBeenCalledWith("s1", expect.any(FormData));
    expect(screen.getByLabelText("Enable UPS returns")).toBeChecked();
    expect(screen.getByLabelText("Provide return bags")).toBeChecked();
  });
});
