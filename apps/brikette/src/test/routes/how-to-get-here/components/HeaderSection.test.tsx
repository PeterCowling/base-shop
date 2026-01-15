import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@acme/ui/atoms/Grid", () => ({
  Grid: ({ as: Component = "div", children, ...props }: any) => {
    const { columns: _columns, gap: _gap, ...rest } = props;
    return <Component data-testid="grid" {...rest}>{children}</Component>;
  },
}));

vi.mock("@acme/ui/atoms/CfImage", () => ({
  CfImage: ({ alt }: { alt: string }) => <img data-testid="hero-image" alt={alt} />,
}));

vi.mock("@/routes/how-to-get-here/transport", () => ({
  TRANSPORT_MODE_ICONS: {
    bus: (props: any) => <svg data-testid="icon-bus" {...props} />,
    ferry: (props: any) => <svg data-testid="icon-ferry" {...props} />,
  },
}));

import type { TFunction } from "i18next";

import { HeaderSection } from "@/routes/how-to-get-here/components/HeaderSection";

const t = ((key: string) => key) as unknown as TFunction<"howToGetHere">;

const header = {
  eyebrow: "Eyebrow",
  title: "Guide title",
  description: "Guide description",
};
const heroImageAlt = "Steps to the hostel";

const places = [
  { id: "ferryDock", name: "Ferry dock" },
  { id: "airport", name: "Airport" },
];

describe("HeaderSection", () => {
  const handleRoutePick = vi.fn();
  const handleOpenFilters = vi.fn();

  beforeEach(() => {
    handleRoutePick.mockReset();
    handleOpenFilters.mockReset();
  });

  it("renders header content and opens the filters panel", () => {
    render(
      <HeaderSection
        header={header}
        heroImageAlt={heroImageAlt}
        t={t}
        places={places}
        onRoutePick={handleRoutePick}
        onOpenFilters={handleOpenFilters}
      />,
    );

    expect(screen.getByText(header.title)).toBeInTheDocument();
    expect(screen.getByText(header.description)).toBeInTheDocument();
    expect(screen.getByAltText(heroImageAlt)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "filters.editLabel" }));
    expect(handleOpenFilters).toHaveBeenCalledTimes(1);
  });

  it("submits the selected route, arrival window, and preference", () => {
    render(
      <HeaderSection
        header={header}
        heroImageAlt={heroImageAlt}
        t={t}
        places={places}
        onRoutePick={handleRoutePick}
        onOpenFilters={handleOpenFilters}
      />,
    );

    fireEvent.change(screen.getByLabelText("routePicker.placeLabel"), { target: { value: "airport" } });
    fireEvent.click(screen.getByRole("button", { name: "routePicker.arrival.daytime" }));
    fireEvent.click(screen.getByRole("button", { name: "routePicker.preferences.fastest" }));
    fireEvent.click(screen.getByRole("button", { name: "routePicker.cta" }));

    expect(handleRoutePick).toHaveBeenCalledWith({
      placeId: "airport",
      arrival: "daytime",
      preference: "fastest",
    });
  });
});