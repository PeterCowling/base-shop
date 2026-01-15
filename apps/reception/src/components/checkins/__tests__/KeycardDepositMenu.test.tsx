/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import KeycardDepositMenu from "../keycardButton/KeycardDepositMenu";
import { DocumentType, KeycardPayType } from "../../../types/keycards";

describe("KeycardDepositMenu", () => {
  it("renders and handles confirm & mouse leave", async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);
    const closeMenu = vi.fn();
    const { container } = render(
      <KeycardDepositMenu
        menuOpen
        menuPosition={{ top: 0, left: 0 }}
        payType={KeycardPayType.CASH}
        docType={DocumentType.PASSPORT}
        buttonDisabled={false}
        setPayType={vi.fn()}
        setDocType={vi.fn()}
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
        setPayType={vi.fn()}
        setDocType={vi.fn()}
        handleConfirm={vi.fn()}
        closeMenu={vi.fn()}
      />
    );

    expect(screen.getByText(/Document Type/i)).toBeInTheDocument();
  });
});
