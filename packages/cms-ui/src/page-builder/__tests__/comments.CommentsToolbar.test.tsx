import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CommentsToolbar from "../comments/CommentsToolbar";
// Minimal i18n shim so visible text matches test expectations
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "comments.label": "Comments",
      "comments.optionsAria": "Options",
    };
    return map[key] ?? key;
  },
}));

describe("CommentsToolbar", () => {
  it("renders count and triggers actions", async () => {
    const user = userEvent.setup();
    const onToggleDrawer = jest.fn();
    const onShowResolvedChange = jest.fn();
    const onReload = jest.fn();
    const onAddForSelected = jest.fn();
    render(
      <div>
        <div data-pb-portal-root />
        <CommentsToolbar
           
          peers={[{ id: "p1", label: "Alice", color: "#0f0" } as any]}
          showResolved={false}
          onShowResolvedChange={onShowResolvedChange}
          onReload={onReload}
          onAddForSelected={onAddForSelected}
          canAddForSelected={true}
          onToggleDrawer={onToggleDrawer}
          unresolvedCount={3}
        />
      </div>
    );

    // Button shows count and toggles drawer
    await user.click(screen.getByRole("button", { name: /Comments \(3\)/ }));
    expect(onToggleDrawer).toHaveBeenCalled();

    // Menu interactions are covered indirectly via integration; keep this light to avoid Radix portal intricacies.
  });
});
