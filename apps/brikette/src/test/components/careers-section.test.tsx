import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CareersSection from "@/components/careers/CareersSection";

const openModal = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string | string[]> = {
        "careersSection.title": "Be Part of Something Unique",
        "careersSection.section1Title": "Who We Hire",
        "careersSection.section1Paragraph1": "We value drive.",
        "careersSection.section1Paragraph2": "We love curiosity.",
        "careersSection.section2Paragraph1": "Comfortable spaces.",
        "careersSection.section2Paragraph2": "Staff-only perks.",
        "careersSection.section3Paragraph1": "Professional development matters.",
        "careersSection.section4Paragraph1": "We started small.",
        "careersSection.section5Paragraph1": "Now we're growing.",
        "careersSection.altAmenities": "Staff lounge",
        "careersSection.altProfessional": "Team in uniform",
        "careersSection.altVintage": "Vintage photo",
        "careersSection.altPanorama": "Panorama view",
        "careersSection.requirementsHeading": "You Should Apply If...",
        "careersSection.requirementsList": ["Hardworking", "Friendly"],
        "careersSection.notGoodFitHeading": "This Might Not Be For You If...",
        "careersSection.notGoodFitList": ["You dislike teamwork", "You're chronically late"],
        "careersSection.forCustomerFacingHeading": "Customer-Facing Roles",
        "careersSection.forCustomerFacingParagraph1": "You'll meet travelers daily.",
        "careersSection.rolesParagraph": "Front desk, guides, service staff.",
        "careersSection.closingParagraph": "Ready to join us?",
        "careersSection.apply": "Apply Now",
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock("@/context/ModalContext", () => ({
  useModal: () => ({ openModal }),
}));

describe("<CareersSection />", () => {
  it("renders the main title and CTA", () => {
    render(<CareersSection />);
    expect(
      screen.getByRole("heading", { level: 2, name: /be part of something unique/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply now/i })).toBeInTheDocument();
  });

  it("renders all section headings", () => {
    render(<CareersSection />);

    expect(screen.getByRole("heading", { level: 3, name: /who we hire/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /you should apply if/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /this might not be for you if/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /customer-facing roles/i }),
    ).toBeInTheDocument();
  });

  it("renders all paragraph content", () => {
    render(<CareersSection />);
    expect(screen.getByText(/we value drive/i)).toBeInTheDocument();
    expect(screen.getByText(/comfortable spaces/i)).toBeInTheDocument();
    expect(screen.getByText(/professional development matters/i)).toBeInTheDocument();
    expect(screen.getByText(/we started small/i)).toBeInTheDocument();
    expect(screen.getByText(/now we're growing/i)).toBeInTheDocument();
    expect(screen.getByText(/ready to join us/i)).toBeInTheDocument();
  });

  it("renders list items for requirements and disqualifiers", () => {
    render(<CareersSection />);
    expect(screen.getByText(/hardworking/i)).toBeInTheDocument();
    expect(screen.getByText(/friendly/i)).toBeInTheDocument();
    expect(screen.getByText(/you dislike teamwork/i)).toBeInTheDocument();
    expect(screen.getByText(/you're chronically late/i)).toBeInTheDocument();
  });

  it("renders alt text on images", () => {
    render(<CareersSection />);
    expect(screen.getByAltText(/staff lounge/i)).toBeInTheDocument();
    expect(screen.getByAltText(/team in uniform/i)).toBeInTheDocument();
    expect(screen.getByAltText(/vintage photo/i)).toBeInTheDocument();
    expect(screen.getByAltText(/panorama view/i)).toBeInTheDocument();
  });

  it("calls openModal when CTA is clicked", async () => {
    const user = userEvent.setup();
    render(<CareersSection />);

    const button = screen.getByRole("button", { name: /apply now/i });
    await user.click(button);

    expect(openModal).toHaveBeenCalledWith("contact");
  });
});