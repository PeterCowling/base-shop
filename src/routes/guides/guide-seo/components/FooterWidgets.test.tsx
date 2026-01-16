// src/routes/guides/guide-seo/components/FooterWidgets.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";

const planChoiceSpy = vi.hoisted(() => vi.fn(() => <div data-testid="plan-choice" />));
const transportNoticeSpy = vi.hoisted(() => vi.fn(() => <div data-testid="transport-notice" />));

vi.mock("@/components/guides/PlanChoice", () => ({
  __esModule: true,
  default: planChoiceSpy,
}));

vi.mock("@/components/guides/TransportNotice", () => ({
  __esModule: true,
  default: transportNoticeSpy,
}));

import FooterWidgets from "./FooterWidgets";

describe("FooterWidgets", () => {
  beforeEach(() => {
    planChoiceSpy.mockClear();
    transportNoticeSpy.mockClear();
  });

  it("passes guide translations to PlanChoice and TransportNotice", () => {
    const guideCopy: Record<string, string> = {
      "components.planChoice.title": "Pick a plan",
      "components.planChoice.selectedLabel": "Chosen:",
      "components.planChoice.options.ferry": "Boats",
      "components.planChoice.options.trainBus": "Rail & bus",
      "components.planChoice.options.transfer": "Transfers",
      "transportNotice.title": "Transport alerts",
      "transportNotice.srLabel": "Transport notice",
      "transportNotice.items.ferries": "Ferries tip",
      "transportNotice.items.buses": "Buses tip",
    };
    const tGuides = (key: string) => guideCopy[key] ?? key;

    render(
      <FooterWidgets
        lang="en"
        guideKey="positanoBeaches"
        hasLocalizedContent={false}
        showPlanChoice
        showTransportNotice
        tGuides={tGuides}
      />,
    );

    expect(planChoiceSpy).toHaveBeenCalled();
    const planProps = planChoiceSpy.mock.calls[0][0];
    expect(planProps.translations).toEqual({
      title: "Pick a plan",
      selectedLabel: "Chosen:",
      options: {
        ferry: "Boats",
        trainBus: "Rail & bus",
        transfer: "Transfers",
      },
    });

    expect(transportNoticeSpy).toHaveBeenCalled();
    const noticeProps = transportNoticeSpy.mock.calls[0][0];
    expect(noticeProps.translations).toEqual({
      title: "Transport alerts",
      srLabel: "Transport notice",
      items: {
        ferries: "Ferries tip",
        buses: "Buses tip",
      },
    });
  });
});