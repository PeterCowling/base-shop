import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DocumentType, KeycardPayType } from "../../../types/keycards";
import KeycardDepositMenu from "../keycardButton/KeycardDepositMenu";

describe("KeycardDepositMenu", () => {
  it("renders and handles confirm & mouse leave", async () => {
    const handleConfirm = jest.fn().mockResolvedValue(undefined);
    const closeMenu = jest.fn();
    const { container } = render(
      <KeycardDepositMenu
        menuOpen
        menuPosition={{ top: 0, left: 0 }}
        payType={KeycardPayType.CASH}
        docType={DocumentType.PASSPORT}
        buttonDisabled={false}
        setPayType={jest.fn()}
        setDocType={jest.fn()}
        handleConfirm={handleConfirm}
        closeMenu={closeMenu}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(handleConfirm).toHaveBeenCalled();

    fireEvent.mouseLeave(container.firstChild as Element);
    expect(closeMenu).toHaveBeenCalled();
  });

  it("shows document selector when pay type is DOCUMENT", () => {
    render(
      <KeycardDepositMenu
        menuOpen
        menuPosition={{ top: 0, left: 0 }}
        payType={KeycardPayType.DOCUMENT}
        docType={DocumentType.PASSPORT}
        buttonDisabled={false}
        setPayType={jest.fn()}
        setDocType={jest.fn()}
        handleConfirm={jest.fn()}
        closeMenu={jest.fn()}
      />
    );

    expect(screen.getByText(/Document Type/i)).toBeInTheDocument();
  });
});
