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
} from "@acme/ui/organisms/modals";

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
