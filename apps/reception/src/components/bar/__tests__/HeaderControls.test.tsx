import "@testing-library/jest-dom";

import { fireEvent,render, screen } from "@testing-library/react";

import HeaderControls from "../HeaderControls";

describe("HeaderControls", () => {
  it("triggers screen changes", () => {
    const onScreenChange = jest.fn();
    render(
      <HeaderControls
        currentUser="tester"
        onScreenChange={onScreenChange}
        menuType="food"
        onSelectMenuType={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /sales/i }));
    expect(onScreenChange).toHaveBeenCalledWith("sales");

    fireEvent.click(screen.getByRole("button", { name: /comp/i }));
    expect(onScreenChange).toHaveBeenCalledWith("comp");
  });

  it("changes menu type and switches to order taking", () => {
    const onScreenChange = jest.fn();
    const onSelectMenuType = jest.fn();
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

