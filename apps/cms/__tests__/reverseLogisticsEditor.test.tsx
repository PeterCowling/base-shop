import "@testing-library/jest-dom";

import React, { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@acme/ui/operations", () => ({
  useToast: () => ({
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock("@cms/actions/shops.server", () => ({
  updateReverseLogistics: jest.fn(),
}));

const { updateReverseLogistics } = jest.requireMock(
  "@cms/actions/shops.server",
) as {
  updateReverseLogistics: jest.Mock;
};

jest.mock("@/components/atoms/shadcn", () => ({
  Card: (props: any) => <div {...props} />,
  CardContent: (props: any) => <div {...props} />,
  Button: (props: any) => <button {...props} />,
  Checkbox: (props: any) => <input type="checkbox" {...props} />,
  Input: (props: any) => <input {...props} />,
}));

async function loadReverseLogisticsEditor() {
  const mod = await import(
    "../src/app/cms/shop/[shop]/settings/reverse-logistics/ReverseLogisticsEditor"
  );
  return mod.default;
}

describe("ReverseLogisticsEditor", () => {
  it("submits form and updates state", async () => {
    updateReverseLogistics.mockResolvedValue({
      settings: {
        reverseLogisticsService: { enabled: true, intervalMinutes: 30 },
      },
    });

    const ReverseLogisticsEditor = await loadReverseLogisticsEditor();

    render(
      <ReverseLogisticsEditor
        shop="s1"
        initial={{ enabled: false, intervalMinutes: 60 }}
      />,
    );

    const intervalInput = screen.getByLabelText(
      "Interval (minutes)",
    ) as HTMLInputElement;
    expect(intervalInput.value).toBe("60");

    const save = screen.getByRole("button", { name: /save/i });
    const form = save.closest("form")!;

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(updateReverseLogistics).toHaveBeenCalledWith(
      "s1",
      expect.any(FormData),
    );
    expect(intervalInput.value).toBe("30");
  });
});
