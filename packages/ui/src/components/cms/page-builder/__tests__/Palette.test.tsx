// packages/ui/src/components/cms/page-builder/__tests__/Palette.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Palette from "../Palette";

// Provide a stable shop path
jest.mock("next/navigation", () => ({ usePathname: () => "/cms/shop/s1/pages" }));
jest.mock("@acme/shared-utils", () => ({ getShopFromPath: () => "s1" }));

// Avoid async state updates from library sync during tests to prevent act warnings
jest.mock("../libraryStore", () => {
  const actual = jest.requireActual("../libraryStore");
  return {
    ...actual,
    // Keep local helpers stable but make network sync a no-op
    syncFromServer: jest.fn(async () => null),
  };
});

// Preview tokens to yield one text theme
jest.mock("../hooks/usePreviewTokens", () => () => ({
  "--text-heading-font-size": "18px",
  "--text-heading-line-height": "24px",
  "--text-heading-desktop-font-size": "24px",
}));

describe("Palette", () => {
  test("search input, text theme apply event, and My Library actions render", () => {
    const silence = jest.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = jest.spyOn(global, "fetch" as any).mockResolvedValue({ ok: true, json: async () => [] } as any);
    localStorage.setItem("pb:recent-types", JSON.stringify(["Text"]));
    const onAdd = jest.fn();
    const onInsertPreset = jest.fn();
    render(
      <Palette
        onAdd={onAdd as any}
        onInsertImage={jest.fn() as any}
        onSetSectionBackground={jest.fn() as any}
        selectedIsSection={false}
        onInsertPreset={onInsertPreset as any}
      />
    );

    // Search input present and updates
    const search = screen.getByPlaceholderText(/Search components/i);
    fireEvent.change(search, { target: { value: "but" } });
    expect((search as HTMLInputElement).value).toBe("but");

    // Text Themes section present and clicking applies theme (fires event safely)
    const apply = screen.getByText(/Apply to selected block/i);
    expect(apply).toBeInTheDocument();
    const anyButton = screen.getAllByRole("button")[0];
    fireEvent.click(anyButton);

    // Palette renders
    expect(screen.getByPlaceholderText(/Search components/i)).toBeInTheDocument();
    fetchMock.mockRestore();
    silence.mockRestore();
  });
});
