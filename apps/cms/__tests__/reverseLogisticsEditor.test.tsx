import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";

const updateReverseLogistics = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ updateReverseLogistics }));
jest.mock("@/components/atoms/shadcn", () => ({
  Button: (props: any) => <button {...props} />,
  Checkbox: (props: any) => <input type="checkbox" {...props} />,
  Input: (props: any) => <input {...props} />,
}));

import ReverseLogisticsEditor from "../src/app/cms/shop/[shop]/settings/reverse-logistics/ReverseLogisticsEditor";

describe("ReverseLogisticsEditor", () => {
  it("submits form and updates state", async () => {
    updateReverseLogistics.mockResolvedValue({
      settings: {
        reverseLogisticsService: { enabled: true, intervalMinutes: 30 },
      },
    });
    render(
      <ReverseLogisticsEditor
        shop="s1"
        initial={{ enabled: false, intervalMinutes: 60 }}
      />,
    );
    const intervalInput = screen.getByLabelText("Interval (minutes)") as HTMLInputElement;
    expect(intervalInput.value).toBe("60");
    const save = screen.getByRole("button", { name: /save/i });
    const form = save.closest("form")!;
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(updateReverseLogistics).toHaveBeenCalledWith("s1", expect.any(FormData));
    expect(intervalInput.value).toBe("30");
  });
});
