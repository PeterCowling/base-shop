// packages/ui/src/components/cms/page-builder/__tests__/PresetsModal.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PresetsModal from "../PresetsModal";

jest.mock("next/navigation", () => ({ usePathname: () => "/cms/shop/s1/pages" }));
jest.mock("@acme/shared-utils", () => ({ getShopFromPath: () => "s1" }));

describe("PresetsModal", () => {
  test("renders presets and inserts on click", () => {
    const onInsert = jest.fn();
    render(<PresetsModal onInsert={onInsert} open hideTrigger />);
    const buttons = screen.getAllByRole("button", { name: /Add Section|Built-in Sections|./i });
    // Find a card button by role=button within grids
    const card = screen.getAllByRole("button").find((b) => /rounded border/i.test(b.className)) || screen.getAllByRole("button")[0];
    fireEvent.click(card!);
    expect(onInsert).toHaveBeenCalled();
  });

  test("search with no matches shows empty state", () => {
    render(<PresetsModal onInsert={jest.fn()} open hideTrigger />);
    const input = screen.getByLabelText(/Search presets/i);
    fireEvent.change(input, { target: { value: "__this_query_will_not_match__" } });
    expect(screen.getByText(/No matching sections/i)).toBeInTheDocument();
  });
});
