import { act } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
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
  it("renders location fallback link when open (no mapsEmbedKey)", async () => {
    const handleClose = jest.fn();
    render(
      <LocationModal
        isOpen
        onClose={handleClose}
        copy={locationCopy}
        hostelAddress="Via Roma"
      />,
    );

    // No key → fallback link, no iframe
    expect(screen.queryByTitle("Find us")).not.toBeInTheDocument();
    const fallbackLink = await screen.findByRole("link", { name: "Find us" });
    expect(fallbackLink).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
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
// TASK-03: LocationModal Maps Embed API v1 (TC-01–TC-04)
// ---------------------------------------------------------------------------
describe("TASK-03: LocationModal Maps Embed API v1 (TC-01–TC-04)", () => {
  it("TC-01: renders v1 place embed when mapsEmbedKey provided", async () => {
    render(
      <LocationModal
        isOpen
        onClose={jest.fn()}
        copy={locationCopy}
        hostelAddress="Via Roma"
        mapsEmbedKey="test-key"
      />,
    );
    const iframe = await screen.findByTitle("Find us");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringMatching(/^https:\/\/www\.google\.com\/maps\/embed\/v1\/place\?key=test-key&q=Via%20Roma/),
    );
  });

  it("TC-02: renders v1 directions embed when directions active and key provided", async () => {
    render(
      <LocationModal
        isOpen
        onClose={jest.fn()}
        copy={locationCopy}
        hostelAddress="Via Roma"
        mapsEmbedKey="test-key"
      />,
    );
    const input = screen.getByPlaceholderText("City");
    await userEvent.type(input, "Naples");
    await userEvent.click(screen.getByRole("button", { name: "Get directions" }));
    const iframe = await screen.findByTitle("Find us");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringMatching(/^https:\/\/www\.google\.com\/maps\/embed\/v1\/directions\?key=test-key/),
    );
  });

  it("TC-03: renders fallback link when no mapsEmbedKey provided", async () => {
    render(
      <LocationModal
        isOpen
        onClose={jest.fn()}
        copy={locationCopy}
        hostelAddress="Via Roma"
      />,
    );
    expect(screen.queryByTitle("Find us")).not.toBeInTheDocument();
    const fallbackLink = await screen.findByRole("link", { name: "Find us" });
    expect(fallbackLink).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
  });

  it("TC-04: encodes special characters in hostelAddress", async () => {
    render(
      <LocationModal
        isOpen
        onClose={jest.fn()}
        copy={locationCopy}
        hostelAddress="Via Roma & Co., 42"
        mapsEmbedKey="test-key"
      />,
    );
    const iframe = await screen.findByTitle("Find us");
    const src = iframe.getAttribute("src") ?? "";
    expect(src).toContain("%26"); // & was URI-encoded
    expect(src).not.toContain("Via Roma & Co"); // raw address not in URL
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

});
