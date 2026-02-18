import { act } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  BookingModal2,
  type BookingModal2Copy,
  ContactModal,
  type ContactModalCopy,
  FacilitiesModal,
  type FacilitiesModalCategory,
  LanguageModal,
  type LanguageOption,
  LocationModal,
  type LocationModalCopy,
  OffersModal,
} from "..";
import { ModalScrollArea,ModalScrollPanel } from "../primitives";

const categories: FacilitiesModalCategory[] = [
  { title: "General", items: ["Wi-Fi", "Breakfast"] },
];

const languageOptions: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
];

const booking2Copy: BookingModal2Copy = {
  title: "Select",
  checkInLabel: "Check in",
  checkOutLabel: "Check out",
  adultsLabel: "Adults",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  overlayLabel: "Cancel",
};

const locationCopy: LocationModalCopy = {
  title: "Find us",
  closeLabel: "Close",
  inputLabel: "Your location",
  inputPlaceholder: "City",
  getDirections: "Get directions",
  justShowMap: "Show map",
};

const contactCopy: ContactModalCopy = {
  title: "Contact",
  description: "Reach us",
  revealEmail: "Reveal",
  closeLabel: "Close",
  footerButton: "Done",
};

describe("Modal primitives integration", () => {
  it("closes FacilitiesModal via footer button", async () => {
    const handleClose = jest.fn();
    render(
      <FacilitiesModal
        isOpen
        onClose={handleClose}
        categories={categories}
        copy={{ title: "Facilities", closeButton: "Close" }}
        testId="facilities"
      />,
    );

    const closeBtn = await screen.findByRole("button", { name: "Close" });
    await userEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("facilities")).toBeInTheDocument();
  });

  it("invokes reserve handler in OffersModal", async () => {
    const handleReserve = jest.fn();
    const handleClose = jest.fn();
    render(
      <OffersModal
        isOpen
        onClose={handleClose}
        onReserve={handleReserve}
        copy={{
          title: "Special Offer",
          description: "Save", 
          perks: ["Breakfast"],
          closeLabel: "Close",
          ctaLabel: "Book",
        }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Book" }));
    expect(handleReserve).toHaveBeenCalledTimes(1);
  });

  it("selects a language option", async () => {
    const handleSelect = jest.fn();
    const handleClose = jest.fn();
    render(
      <LanguageModal
        isOpen
        onClose={handleClose}
        options={languageOptions}
        currentCode="en"
        onSelect={handleSelect}
        copy={{ title: "Choose language", closeLabel: "Done" }}
        theme="light"
        testId="language"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Italiano" }));
    expect(handleSelect).toHaveBeenCalledWith("it");

    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
  it("confirms secondary booking modal", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <BookingModal2
        isOpen
        copy={booking2Copy}
        checkIn="2025-05-01"
        checkOut="2025-05-03"
        adults={2}
        onCheckInChange={jest.fn()}
        onCheckOutChange={jest.fn()}
        onAdultsChange={jest.fn()}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    await userEvent.click(cancelButtons[cancelButtons.length - 1]);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders location iframe when open", async () => {
    const handleClose = jest.fn();
    render(
      <LocationModal
        isOpen
        onClose={handleClose}
        copy={locationCopy}
        hostelAddress="Via Roma"
      />,
    );

    expect(await screen.findByTitle("Find us")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(handleClose).toHaveBeenCalled();
  });

  it("reveals contact email", async () => {
    const handleClose = jest.fn();
    render(
      <ContactModal
        isOpen
        onClose={handleClose}
        copy={contactCopy}
        email="team@example.com"
      />,
    );

    expect(screen.getByText("team@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

});

// ---------------------------------------------------------------------------
// TC-07: TASK-07 layout contract invariants
// ---------------------------------------------------------------------------
describe("TASK-07: modal layout contract (TC-07)", () => {
  // TC-01: FacilitiesModal panel is viewport-bounded and content is scrollable
  it("TC-01: FacilitiesModal ModalScrollArea is present for scrollable content", () => {
    render(
      <FacilitiesModal
        isOpen
        onClose={jest.fn()}
        categories={categories}
        copy={{ title: "Amenities", closeButton: "Close" }}
      />,
    );
    // Radix Dialog renders through a portal into document.body — query from there.
    // ModalScrollArea renders with overflow-y-auto (scroll in single container).
    const scrollArea = document.body.querySelector("[class*='overflow-y-auto']");
    expect(scrollArea).toBeTruthy();
  });

  // TC-02: BookingModal2 uses ModalScrollPanel (standardized, not ad-hoc max-h)
  it("TC-02: BookingModal2 renders with ModalScrollPanel scroll contract", () => {
    render(
      <BookingModal2
        isOpen
        copy={booking2Copy}
        checkIn="2025-05-01"
        checkOut="2025-05-03"
        adults={2}
        onCheckInChange={jest.fn()}
        onCheckOutChange={jest.fn()}
        onAdultsChange={jest.fn()}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    // Radix Dialog renders through a portal into document.body — query from there.
    // ModalScrollPanel applies max-h-[90dvh] via SCROLL_PANEL_BASE.
    const scrollPanel = document.body.querySelector("[class*='max-h-\\[90dvh\\]']");
    expect(scrollPanel).toBeTruthy();
  });

  // TC-03: Close affordance not regressed — FacilitiesModal and LanguageModal still have close buttons
  it("TC-03: FacilitiesModal close button is present", () => {
    render(
      <FacilitiesModal
        isOpen
        onClose={jest.fn()}
        categories={categories}
        copy={{ title: "Amenities", closeButton: "Close" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("TC-03: LanguageModal close button is present", () => {
    render(
      <LanguageModal
        isOpen
        onClose={jest.fn()}
        options={languageOptions}
        currentCode="en"
        onSelect={jest.fn()}
        copy={{ title: "Language", closeLabel: "Done" }}
        theme="light"
      />,
    );
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  // Smoke tests for ModalScrollPanel and ModalScrollArea primitives
  it("ModalScrollPanel renders with scroll contract classes", () => {
    const { container } = render(<ModalScrollPanel>content</ModalScrollPanel>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/overflow-y-auto/);
    expect(el.className).toMatch(/overscroll-contain/);
    expect(el.className).toMatch(/max-h-\[90dvh\]/);
  });

  it("ModalScrollArea renders with scroll contract classes", () => {
    const { container } = render(<ModalScrollArea>content</ModalScrollArea>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/overflow-y-auto/);
    expect(el.className).toMatch(/overscroll-contain/);
  });
});

// ---------------------------------------------------------------------------
// TC-04: TASK-09 — tab-trap / keyboard accessibility
// ---------------------------------------------------------------------------
describe("TASK-09: TC-04 — modal tab-trap and keyboard accessibility", () => {
  // TC-04a: single-element modal — Tab wraps focus within the dialog
  it("TC-04a: Tab key keeps focus within FacilitiesModal (Radix FocusScope)", async () => {
    const user = userEvent.setup();
    render(
      <FacilitiesModal
        isOpen
        onClose={jest.fn()}
        categories={categories}
        copy={{ title: "Facilities", closeButton: "Close" }}
      />,
    );

    const closeBtn = await screen.findByRole("button", { name: "Close" });
    await act(async () => { closeBtn.focus(); });
    expect(document.activeElement).toBe(closeBtn);

    // Tab within a modal that has one focusable element — wraps back.
    await user.tab();
    const dialog = document.body.querySelector("[role='dialog']");
    expect(dialog).toBeTruthy();
    expect(dialog?.contains(document.activeElement)).toBe(true);
  });

  // TC-04b: multi-element modal — Tab cycles through modal elements only
  it("TC-04b: Tab cycles focus through BookingModal2 interactive elements", async () => {
    const user = userEvent.setup();
    render(
      <BookingModal2
        isOpen
        copy={booking2Copy}
        checkIn="2025-05-01"
        checkOut="2025-05-03"
        adults={2}
        onCheckInChange={jest.fn()}
        onCheckOutChange={jest.fn()}
        onAdultsChange={jest.fn()}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    const dialog = document.body.querySelector("[role='dialog']");
    expect(dialog).toBeTruthy();

    // Focus the Confirm button and Tab forward — focus must stay in dialog.
    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    await act(async () => { confirmBtn.focus(); });

    await user.tab();
    expect(dialog?.contains(document.activeElement)).toBe(true);

    // Tab again — still in dialog.
    await user.tab();
    expect(dialog?.contains(document.activeElement)).toBe(true);

    // Shift-Tab backward — also stays in dialog.
    await user.tab({ shift: true });
    expect(dialog?.contains(document.activeElement)).toBe(true);
  });
});
