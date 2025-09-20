import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import ContextMenu from "../ContextMenu";

describe("ContextMenu", () => {
  it("navigates with keys and activates item", () => {
    const a = jest.fn();
    const b = jest.fn();
    render(
      <ContextMenu
        x={10}
        y={20}
        open
        onClose={jest.fn()}
        items={[
          { label: "Disabled", onClick: jest.fn(), disabled: true },
          { label: "Action A", onClick: a },
          { label: "Action B", onClick: b },
        ]}
      />
    );
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    fireEvent.keyDown(menu, { key: "Enter" });
    expect(b).toHaveBeenCalledTimes(1);
  });
});
