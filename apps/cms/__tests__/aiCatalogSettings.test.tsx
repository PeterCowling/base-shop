import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUpdateAiCatalog = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ updateAiCatalog: mockUpdateAiCatalog }));
jest.mock("@/components/atoms/shadcn", () => ({
  Button: (props: any) => <button {...props} />,
  Checkbox: ({ onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      onChange={(e) => onCheckedChange?.((e.target as HTMLInputElement).checked)}
      {...props}
    />
  ),
  Input: (props: any) => <input {...props} />,
}));

import AiCatalogSettings from "../src/app/cms/shop/[shop]/settings/seo/AiCatalogSettings";

describe("AiCatalogSettings", () => {
  beforeEach(() => {
    mockUpdateAiCatalog.mockReset();
  });

  it("submits updated settings", async () => {
    mockUpdateAiCatalog.mockResolvedValue({
      settings: {
        seo: {
          aiCatalog: { enabled: true, fields: ["id", "title"], pageSize: 20 },
        },
      },
    });

    render(
      <AiCatalogSettings
        shop="s1"
        initial={{ enabled: true, fields: ["id"], pageSize: 10 }}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("checkbox", { name: "title" }));
    const sizeInput = screen.getByLabelText(/page size/i) as HTMLInputElement;
    await user.clear(sizeInput);
    await user.type(sizeInput, "20");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(mockUpdateAiCatalog).toHaveBeenCalledWith("s1", expect.any(FormData)),
    );
    const fd = mockUpdateAiCatalog.mock.calls[0][1] as FormData;
    expect(fd.getAll("fields")).toEqual(
      expect.arrayContaining(["id", "title"]),
    );
    expect(fd.get("pageSize")).toBe("20");

    expect(screen.getByRole("checkbox", { name: "title" })).toBeChecked();
    expect(sizeInput).toHaveValue(20);
  });

  it("renders server errors", async () => {
    mockUpdateAiCatalog.mockResolvedValue({
      errors: {
        fields: ["Select at least one"],
        pageSize: ["Invalid size"],
      },
    });

    render(
      <AiCatalogSettings
        shop="s1"
        initial={{ enabled: true, fields: [], pageSize: 10 }}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(mockUpdateAiCatalog).toHaveBeenCalled());

    expect(screen.getByText("Select at least one")).toBeInTheDocument();
    expect(screen.getByText("Invalid size")).toBeInTheDocument();
  });
});

