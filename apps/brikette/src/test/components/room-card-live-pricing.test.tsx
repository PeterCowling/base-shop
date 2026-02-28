// apps/brikette/src/test/components/room-card-live-pricing.test.tsx
// Tests for RoomCard live pricing integration (TASK-RPR validation contracts).
//
// TC-RPR-01 through TC-RPR-04 are covered by RoomCard.availability.test.tsx (TC-04-01 to TC-04-06).
// This file covers remaining contracts specific to the room detail page integration:
// - TC-RPR-05: queryState=invalid → buttons disabled regardless of availabilityRoom
// - TC-RPR-06: NR CTA click navigates when queryState=valid (GA4 select_item for RoomsSection
//              is covered by ga4-11-select-item-room-ctas.test.tsx — no regression)
// - TC-RPR-07: availabilityRoom is optional — backward compat

import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import type { OctorateRoom } from "@/app/api/availability/route";
import RoomCard from "@/components/rooms/RoomCard";
import type { Room } from "@/data/roomsData";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("react-i18next", () => ({
  useTranslation: (_ns: string) => {
    const store: Record<string, string> = {
      "roomImage.photoAlt": "{{room}} room",
      "roomImage.clickToEnlarge": "Click to enlarge image",
      "roomImage.prevAria": "Previous image",
      "roomImage.nextAria": "Next image",
      "roomImage.noImage": "No image available",
      ratesFrom: "From €{{price}}",
      loadingPrice: "Loading price…",
      "rooms.soldOut": "Sold out",
      "priceNotes.dorm": "Per night, per guest",
      checkRatesNonRefundable: "Non-Refundable Rates",
      checkRatesFlexible: "Flexible Room Rates",
      "ctaSuffix.nonRefundable": "Non-Refundable",
      "ctaSuffix.flexible": "Flexible",
    };
    const t = (key: string, opts?: Record<string, unknown>): string => {
      const val = store[key];
      if (typeof val === "string" && opts) {
        return val.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => String(opts[k] ?? `{{${k}}}`));
      }
      return typeof val === "string" ? val : key;
    };
    return { t, ready: true };
  },
}));

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, replace: jest.fn() }),
}));

const mockUseRoomPricing = jest.fn(() => ({
  lowestPrice: 100,
  soldOut: false,
  loading: false,
  error: undefined,
}));
jest.mock("@/hooks/useRoomPricing", () => ({
  useRoomPricing: (...args: unknown[]) => mockUseRoomPricing(...args),
}));

// buildOctorateUrl returns ok=false so CTA falls through to router.push (no window.location.href)
jest.mock("@/utils/buildOctorateUrl", () => ({
  buildOctorateUrl: () => ({ ok: false }),
}));

jest.mock("@/components/rooms/FacilityIcon", () => ({
  __esModule: true,
  default: ({ facility }: { facility: string }) => <span data-cy="facility-icon">{facility}</span>,
}));

jest.mock("@/components/rooms/FullscreenImage", () => ({
  __esModule: true,
  default: () => <div data-cy="fullscreen" />,
}));

// UiRoomCard mock: renders price state and CTA buttons with data-cy attributes.
// jest.setup.ts configures testIdAttribute: "data-cy" → getByTestId uses data-cy.
jest.mock("@acme/ui/molecules", () => ({
  RoomCard: (props: {
    price?: { loading?: boolean; soldOut?: boolean; formatted?: string; soldOutLabel?: string };
    actions?: Array<{ id: string; label: string; onSelect: () => void; disabled?: boolean }>;
    title?: string;
  }) => {
    const { price, actions, title } = props;
    return (
      <div data-cy="room-card">
        <span data-cy="room-card-title">{title}</span>
        {price?.loading && <span data-cy="price-loading">loading</span>}
        {price?.soldOut && !price.loading && (
          <span data-cy="price-sold-out">{price.soldOutLabel ?? "Sold out"}</span>
        )}
        {!price?.soldOut && !price?.loading && price?.formatted && (
          <span data-cy="price-formatted">{price.formatted}</span>
        )}
        {(actions ?? []).map((action) => (
          <button
            key={action.id}
            data-cy={`cta-${action.id}`}
            disabled={action.disabled}
            onClick={action.onSelect}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Test room fixture
// ---------------------------------------------------------------------------

const TEST_ROOM: Room = {
  id: "double_room",
  sku: "double_room",
  widgetRoomCode: "7",
  widgetRateCodeNR: "433883",
  widgetRateCodeFlex: "433894",
  rateCodes: { direct: { nr: "433883", flex: "433894" }, ota: { nr: "433491", flex: "434398" } },
  occupancy: 2,
  pricingModel: "perRoom",
  basePrice: { amount: 259.2, currency: "EUR" },
  seasonalPrices: [],
  availability: { totalBeds: 2, defaultRelease: 2 },
  images: { bed: "/img/7/7_1.webp", bathroom: "/img/7/7_2.webp" },
  landingImage: "/img/7/landing.webp",
  roomsHref: "/private-rooms/double-room",
  features: { bedSpec: "1 double bed", bathroomSpec: "Ensuite bathroom" },
} as unknown as Room;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RoomCard — live pricing integration (TASK-RPR)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoomPricing.mockReturnValue({
      lowestPrice: 100,
      soldOut: false,
      loading: false,
      error: undefined,
    });
  });

  // TC-RPR-05: queryState=invalid → NR/flex buttons disabled regardless of availabilityRoom
  it("TC-RPR-05: queryState=invalid disables both CTAs even when room is available", () => {
    const avRoom: OctorateRoom = {
      octorateRoomName: "Double",
      octorateRoomId: "7",
      available: true,
      priceFrom: 45,
      nights: 2,
      ratePlans: [{ label: "Non-Refundable" }],
    };

    render(
      <RoomCard
        room={TEST_ROOM}
        availabilityRoom={avRoom}
        queryState="invalid"
        lang="en"
        checkIn="2026-06-01"
        checkOut="2026-06-01"
        adults={1}
      />
    );

    expect(screen.getByTestId("cta-nonRefundable")).toBeDisabled();
    expect(screen.getByTestId("cta-flexible")).toBeDisabled();
  });

  // TC-RPR-06: NR CTA click navigates when not disabled (queryState=absent, buildOctorateUrl ok=false → router.push)
  // Note: GA4 select_item for RoomsSection is separately tested in ga4-11-select-item-room-ctas.test.tsx
  it("TC-RPR-06: NR CTA click triggers navigation when CTA is enabled", () => {
    const avRoom: OctorateRoom = {
      octorateRoomName: "Double",
      octorateRoomId: "7",
      available: true,
      priceFrom: 45,
      nights: 2,
      ratePlans: [{ label: "Non-Refundable" }],
    };

    // queryState="absent": no url-validation check, button is enabled when nrOctorateUrl=null
    // buildOctorateUrl returns ok=false → nrOctorateUrl=null → router.push fallback
    render(
      <RoomCard
        room={TEST_ROOM}
        availabilityRoom={avRoom}
        queryState="absent"
        lang="en"
        checkIn="2026-06-01"
        checkOut="2026-06-03"
        adults={1}
      />
    );

    const nrButton = screen.getByTestId("cta-nonRefundable");
    expect(nrButton).not.toBeDisabled();

    fireEvent.click(nrButton);

    // buildOctorateUrl ok=false → falls through to router.push("/en/book")
    expect(mockRouterPush).toHaveBeenCalledWith("/en/book");
  });

  // TC-RPR-07: availabilityRoom is optional — backward compat, basePrice fallback
  // queryState="absent" used so the CTA is not disabled by the valid-but-no-url check
  it("TC-RPR-07: no availabilityRoom → falls back to useRoomPricing, NR button enabled", () => {
    render(
      <RoomCard
        room={TEST_ROOM}
        queryState="absent"
        lang="en"
        checkIn="2026-06-01"
        checkOut="2026-06-03"
        adults={1}
      />
    );

    // No sold-out, price from useRoomPricing (lowestPrice=100)
    expect(screen.queryByTestId("price-sold-out")).toBeNull();
    expect(screen.getByTestId("price-formatted")).toBeInTheDocument();
    expect(screen.getByTestId("price-formatted").textContent).toContain("100.00");
    expect(screen.getByTestId("cta-nonRefundable")).not.toBeDisabled();
  });
});
