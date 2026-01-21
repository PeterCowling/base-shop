import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import HistoryControls from "../HistoryControls";

const baseProps = {
  canUndo: false,
  canRedo: false,
  onUndo: jest.fn(),
  onRedo: jest.fn(),
  onSave: jest.fn(),
  onPublish: jest.fn(),
  saving: false,
  publishing: false,
  autoSaveState: "idle" as const,
  showVersions: true,
  showSavePublish: false,
  showUndoRedo: false,
  shop: "shop",
  pageId: "page",
  currentComponents: [],
  editor: {},
  onRestoreVersion: jest.fn(),
};

describe("HistoryControls revert", () => {
  it("confirms and reverts to last published snapshot", async () => {
    const user = userEvent.setup();
    const handleRevert = jest.fn();
    const components = [{ id: "1", type: "Section", props: {} }] as any;

    render(
      <HistoryControls
        {...baseProps}
        lastPublishedComponents={components}
        onRevertToPublished={handleRevert}
      />,
    );

    // Open Save Version dialog where revert lives
    const saveVersionButton = screen.getByRole("button", { name: /save version/i });
    await user.click(saveVersionButton);

    const revertButton = await screen.findByRole("button", { name: /revert to last published/i });
    await user.click(revertButton);

    const confirm = await screen.findByRole("button", { name: /^revert$/i });
    await user.click(confirm);

    expect(handleRevert).toHaveBeenCalledWith(components);
  });
});
