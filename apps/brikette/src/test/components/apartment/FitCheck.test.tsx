import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import FitCheck from "@/components/apartment/FitCheck";

// Provide i18n translations directly via mock
const TRANSLATIONS: Record<string, string> = {
  "fitCheck.heading": "Is this apartment right for you?",
  "fitCheck.arrival.label": "Arrival",
  "fitCheck.arrival.text":
    "No street stairs from the road to the apartment entrance.",
  "fitCheck.inside.label": "Inside",
  "fitCheck.inside.text":
    "Split-level interior with internal stairs between living area and bedroom.",
  "fitCheck.sleeping.label": "Sleeping",
  "fitCheck.sleeping.text": "Sofa bed downstairs; double bed upstairs.",
  "fitCheck.sound.label": "Sound",
  "fitCheck.sound.text":
    "Some road and terrace ambience; terrace quiet hours from midnight.",
  "fitCheck.bestFit.label": "Best fit",
  "fitCheck.bestFit.text":
    "Ideal for couples. If anyone in your group prefers to avoid stairs, the downstairs sofa bed is a comfortable alternative. Not recommended for very light sleepers.",
};

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => TRANSLATIONS[key] ?? key,
  }),
}));

describe("FitCheck component", () => {
  beforeEach(() => {
    render(<FitCheck />);
  });

  // TC-01: FitCheck renders all 5 disclosure topics with correct content
  it("renders the heading", () => {
    expect(
      screen.getByText("Is this apartment right for you?"),
    ).toBeInTheDocument();
  });

  it.each([
    ["Arrival", "No street stairs from the road to the apartment entrance."],
    [
      "Inside",
      "Split-level interior with internal stairs between living area and bedroom.",
    ],
    ["Sleeping", "Sofa bed downstairs; double bed upstairs."],
    [
      "Sound",
      "Some road and terrace ambience; terrace quiet hours from midnight.",
    ],
    [
      "Best fit",
      "Ideal for couples. If anyone in your group prefers to avoid stairs, the downstairs sofa bed is a comfortable alternative. Not recommended for very light sleepers.",
    ],
  ])("renders %s disclosure row with correct content", (label, text) => {
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  // TC-02: uses semantic HTML (dl/dt/dd for disclosure list)
  it("uses a definition list for semantic structure", () => {
    const dl = document.querySelector("dl");
    expect(dl).toBeInTheDocument();

    const terms = document.querySelectorAll("dt");
    expect(terms).toHaveLength(5);

    const definitions = document.querySelectorAll("dd");
    expect(definitions).toHaveLength(5);
  });
});
