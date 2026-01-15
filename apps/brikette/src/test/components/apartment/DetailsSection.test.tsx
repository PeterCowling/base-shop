// src/components/apartment/DetailsSection.test.tsx
import { ModalContext, type ModalContextValue, type ModalType } from "@/context/ModalContext";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DetailsSection from "@/components/apartment/DetailsSection";

const { openModalMock } = vi.hoisted(() => ({
  openModalMock: vi.fn<(type: Exclude<ModalType, null>, data?: unknown) => void>(),
}));
const closeModalMock = vi.fn();


const modalContextValue: ModalContextValue = {
  activeModal: null,
  modalData: null,
  openModal: openModalMock,
  closeModal: closeModalMock,
};

const renderDetailsSection = (props?: { bookingUrl?: string }) =>
  render(
    <ModalContext.Provider value={modalContextValue}>
      <DetailsSection {...props} />
    </ModalContext.Provider>
  );


vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "detailsList") return ["a", "b"];
      return key;
    },
  }),
}));

describe("Apartment DetailsSection", () => {
  beforeEach(() => {
    openModalMock.mockReset();
    closeModalMock.mockReset();
  });

  it("opens the modal when no bookingUrl is provided", async () => {
    renderDetailsSection();
    await userEvent.click(screen.getByRole("button"));
    expect(openModalMock).toHaveBeenCalledWith("booking");
  });

  it("renders a link when bookingUrl is provided", () => {
    renderDetailsSection({ bookingUrl: "#test" });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "#test");
  });
});