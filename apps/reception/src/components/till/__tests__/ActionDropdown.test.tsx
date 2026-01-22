import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ActionButtons from "../ActionButtons";

const noop = jest.fn();

function renderButtons(
  name = "Pete",
  {
    handleKeycardCountClick = noop,
    shiftOpenTime = new Date(),
  }: { handleKeycardCountClick?: () => void; shiftOpenTime?: Date | null } = {}
) {
  render(
    <ActionButtons
      shiftOpenTime={shiftOpenTime}
      isTillOverMax={false}
      isDrawerOverLimit={false}
      userName={name}
      drawerLimitInput=""
      setDrawerLimitInput={noop}
      updateLimit={noop}
      handleOpenShiftClick={noop}
      handleKeycardCountClick={handleKeycardCountClick}
      handleCloseShiftClick={noop}
      handleAddChangeClick={noop}
      handleExchangeClick={noop}
      handleAddKeycard={noop}
      handleLiftClick={noop}
      handleReturnKeycard={noop}
    />
  );
}

describe("ActionDropdown", () => {
  it("closes other dropdowns when one is opened", async () => {
    const user = userEvent.setup();
    renderButtons();

    await user.click(screen.getByRole("button", { name: "Shift" }));
    expect(
      screen.getByRole("button", { name: "Open Shift" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cash" }));
    expect(
      screen.queryByRole("button", { name: "Open Shift" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("shows only the shift dropdown for unauthorized users", () => {
    renderButtons("Bob");
    expect(screen.getByRole("button", { name: "Shift" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cash" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Keycards" })).toBeNull();
  });

  it("allows case-insensitive matching for authorized users", () => {
    renderButtons("serena");
    expect(screen.getByRole("button", { name: "Cash" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keycards" })
    ).toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    renderButtons();

    await user.click(screen.getByRole("button", { name: "Shift" }));
    expect(
      screen.getByRole("button", { name: "Open Shift" })
    ).toBeInTheDocument();

    await user.click(document.body);
    expect(
      screen.queryByRole("button", { name: "Open Shift" })
    ).not.toBeInTheDocument();
  });

  it("triggers keycard count when selected", async () => {
    const user = userEvent.setup();
    const onCount = jest.fn();
    renderButtons("Pete", { handleKeycardCountClick: onCount });

    await user.click(screen.getByRole("button", { name: "Keycards" }));
    await user.click(screen.getByRole("button", { name: "Count Keycards" }));
    expect(onCount).toHaveBeenCalled();
  });

  it("disables keycard count when shift is closed", async () => {
    const user = userEvent.setup();
    renderButtons("Pete", { shiftOpenTime: null });

    await user.click(screen.getByRole("button", { name: "Keycards" }));
    expect(
      screen.getByRole("button", { name: "Count Keycards" })
    ).toBeDisabled();
  });
});
