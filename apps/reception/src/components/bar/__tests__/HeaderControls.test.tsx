import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

import HeaderControls from "../HeaderControls";

describe("HeaderControls", () => {
  it("triggers screen changes", () => {
    const onScreenChange = vi.fn();
    render(
      <HeaderControls
        currentUser="tester"
        onScreenChange={onScreenChange}
        menuType="food"
        onSelectMenuType={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /sales/i }));
    expect(onScreenChange).toHaveBeenCalledWith("sales");

    fireEvent.click(screen.getByRole("button", { name: /comp/i }));
    expect(onScreenChange).toHaveBeenCalledWith("comp");
  });

  it("changes menu type and switches to order taking", () => {
    const onScreenChange = vi.fn();
    const onSelectMenuType = vi.fn();
    render(
      <HeaderControls
        currentUser="tester"
        onScreenChange={onScreenChange}
        menuType="food"
        onSelectMenuType={onSelectMenuType}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^Alcoholic$/i })
    );
    expect(onScreenChange).toHaveBeenCalledWith("orderTaking");
    expect(onSelectMenuType).toHaveBeenCalledWith("alcoholic");
  });
});

