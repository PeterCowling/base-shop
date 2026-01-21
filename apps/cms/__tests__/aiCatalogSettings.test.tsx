import "@testing-library/jest-dom";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AiCatalogSettings from "../src/app/cms/shop/[shop]/settings/seo/AiCatalogSettings";

const mockUpdateAiCatalog = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ updateAiCatalog: mockUpdateAiCatalog }));

jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}));

jest.mock("@acme/date-utils", () => ({
  formatTimestamp: (value: string) => `formatted-${value}`,
}));

jest.mock("@/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Toast: ({ open, message }: any) =>
      open ? <div role="status" aria-live="polite">{message}</div> : null,
    Tooltip: ({ children }: any) => <span>{children}</span>,
  };
});

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Checkbox: ({ onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        onChange={(e) => onCheckedChange?.((e.target as HTMLInputElement).checked)}
        {...props}
      />
    ),
    Input: (props: any) => <input {...props} />,
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Dialog: ({ open, onOpenChange, children }: any) => (
      open ? <div role="dialog">{children}</div> : null
    ),
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  };
});

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

    await user.click(screen.getByRole("button", { name: /save settings/i }));

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
    expect(screen.getByText(/queue status/i)).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => expect(mockUpdateAiCatalog).toHaveBeenCalled());

    expect(screen.getByText("Select at least one")).toBeInTheDocument();
    expect(screen.getByText("Invalid size")).toBeInTheDocument();
  });

  it("shows quick action state", async () => {
    render(
      <AiCatalogSettings
        shop="s1"
        initial={{ enabled: true, fields: ["id"], pageSize: 10 }}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /queue crawl/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /queue crawl/i })).toBeEnabled(),
    );
  });
});

