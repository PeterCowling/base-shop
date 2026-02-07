import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import type { TFunction } from "i18next";

import { HeaderSection } from "@/routes/how-to-get-here/components/HeaderSection";

jest.mock("@acme/ui/atoms/CfImage", () => ({
  CfImage: ({ alt }: { alt: string }) => <img data-testid="hero-image" alt={alt} />,
}));
jest.mock("@/routes/how-to-get-here/components/RoutePicker", () => {
  const React = require("react");
  return {
    RoutePicker: ({ t, places, onSubmit }: any) => {
      const [placeId, setPlaceId] = React.useState("");
      const [arrival, setArrival] = React.useState("evening");
      const [preference, setPreference] = React.useState("fastest");
      return (
        <div>
          <label htmlFor="route-place">{t("routePicker.placeLabel")}</label>
          <select
            id="route-place"
            aria-label={t("routePicker.placeLabel")}
            value={placeId}
            onChange={(event) => setPlaceId(event.target.value)}
          >
            <option value="" />
            {places.map((place: { id: string; name: string }) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setArrival("daytime")}>
            {t("routePicker.arrival.daytime")}
          </button>
          <button type="button" onClick={() => setPreference("fastest")}>
            {t("routePicker.preferences.fastest")}
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ placeId, arrival, preference })}
          >
            {t("routePicker.cta")}
          </button>
        </div>
      );
    },
  };
});

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
  const handleRoutePick = jest.fn();

  beforeEach(() => {
    handleRoutePick.mockReset();
  });

  it("renders header content", () => {
    render(
      <HeaderSection
        header={header}
        heroImageAlt={heroImageAlt}
        t={t}
        places={places}
        onRoutePick={handleRoutePick}
      />,
    );

    expect(screen.getByText(header.title)).toBeInTheDocument();
    expect(screen.getByText(header.description)).toBeInTheDocument();
    expect(screen.getByAltText(heroImageAlt)).toBeInTheDocument();
  });

  it("submits the selected route, arrival window, and preference", () => {
    render(
      <HeaderSection
        header={header}
        heroImageAlt={heroImageAlt}
        t={t}
        places={places}
        onRoutePick={handleRoutePick}
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
