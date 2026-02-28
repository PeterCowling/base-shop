
import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import { FeatureSection } from "@/app/[lang]/dorms/[id]/RoomDetailContent";
import type { RoomFeatures } from "@/data/roomsData";

// FacilityIcon renders an SVG icon — mock to a testable label so assertions stay stable.
jest.mock("@/components/rooms/FacilityIcon", () => ({
  __esModule: true,
  default: ({ facility }: { facility: string }) => <span data-cy={`facility-icon-${facility}`} aria-hidden />,
}));

describe("FeatureSection", () => {
  it("TC-01: renders bed, bathroom, view, and terrace rows when all present; omits locker row when absent", () => {
    const features: RoomFeatures = {
      bedSpec: "1 double bed",
      bathroomSpec: "Ensuite bathroom",
      viewSpec: "Sea view",
      terracePresent: true,
      inRoomLockers: false,
    };
    render(<FeatureSection features={features} />);
    expect(screen.getByText("1 double bed")).toBeInTheDocument();
    expect(screen.getByText("Ensuite bathroom")).toBeInTheDocument();
    expect(screen.getByText("Sea view")).toBeInTheDocument();
    expect(screen.getByText("Private terrace")).toBeInTheDocument();
    expect(screen.queryByText("In-room lockers")).not.toBeInTheDocument();
  });

  it("TC-02: renders only bed and bathroom rows when optional fields absent", () => {
    const features: RoomFeatures = {
      bedSpec: "3 bunk beds",
      bathroomSpec: "Shared bathroom",
    };
    render(<FeatureSection features={features} />);
    expect(screen.getByText("3 bunk beds")).toBeInTheDocument();
    expect(screen.getByText("Shared bathroom")).toBeInTheDocument();
    expect(screen.queryByText("Sea view")).not.toBeInTheDocument();
    expect(screen.queryByText("Private terrace")).not.toBeInTheDocument();
    expect(screen.queryByText("In-room lockers")).not.toBeInTheDocument();
  });

  it("TC-03: renders null when features is undefined", () => {
    const { container } = render(<FeatureSection features={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("TC-04: renders locker row with icon when inRoomLockers is true", () => {
    const features: RoomFeatures = {
      bedSpec: "1 double bed",
      bathroomSpec: "Ensuite",
      inRoomLockers: true,
    };
    render(<FeatureSection features={features} />);
    expect(screen.getByText("In-room lockers")).toBeInTheDocument();
    // Icon present (mocked as data-cy span)
    expect(document.querySelector("[data-cy='facility-icon-locker']")).toBeTruthy();
  });

  it("TC-05: renders correct rows for double_room real data (bed, bathroom, view, terrace; no locker)", () => {
    // double_room: bedSpec='1 double bed', bathroomSpec='Ensuite bathroom', viewSpec='Sea view', terracePresent=true
    const features: RoomFeatures = {
      bedSpec: "1 double bed",
      bathroomSpec: "Ensuite bathroom",
      viewSpec: "Sea view",
      terracePresent: true,
    };
    render(<FeatureSection features={features} />);
    expect(screen.getByText("1 double bed")).toBeInTheDocument();
    expect(screen.getByText("Ensuite bathroom")).toBeInTheDocument();
    expect(screen.getByText("Sea view")).toBeInTheDocument();
    expect(screen.getByText("Private terrace")).toBeInTheDocument();
    expect(screen.queryByText("In-room lockers")).not.toBeInTheDocument();
  });
});
