// apps/brikette/src/components/rooms/RoomCard.availability.test.tsx
// Tests for the availabilityRoom prop on RoomCard.
// Mocks i18n, router, useRoomPricing, and @acme/ui to isolate availability logic.

import "@testing-library/jest-dom";

import type { ComponentPropsWithoutRef } from "react";
import { render, screen } from "@testing-library/react";

import type { OctorateRoom } from "@/app/api/availability/route";
import type { Room } from "@/data/roomsData";

// ---------------------------------------------------------------------------
// Static import — must come AFTER all jest.mock declarations
// ---------------------------------------------------------------------------
import RoomCard from "./RoomCard";

// ---------------------------------------------------------------------------
// Module mocks — all declared before imports, hoisted by jest
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
      bestPriceGuaranteed: "Best price guaranteed",
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// useRoomPricing: default returns non-sold-out with lowestPrice=100
const mockUseRoomPricing = jest.fn(() => ({
  lowestPrice: 100,
  soldOut: false,
  loading: false,
  error: undefined,
}));
jest.mock("@/hooks/useRoomPricing", () => ({
  useRoomPricing: (...args: unknown[]) => mockUseRoomPricing(...args),
}));

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

// UiRoomCard: render price + sold-out state so tests can assert on them.
// Use data-cy for testIdAttribute compatibility (jest.setup.ts configures data-cy).
jest.mock("@acme/ui/molecules", () => ({
  RoomCard: (props: {
    price?: {
      loading?: boolean;
      soldOut?: boolean;
      formatted?: string;
      soldOutLabel?: string;
    };
    title?: string;
  }) => {
    const { price, title } = props;
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
  roomsHref: "/rooms/double_room",
  features: { bedSpec: "1 double bed", bathroomSpec: "Ensuite bathroom" },
} as unknown as Room;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RoomCard — availability prop", () => {
  beforeEach(() => {
    // Reset to default: not sold out, lowestPrice=100
    mockUseRoomPricing.mockReturnValue({
      lowestPrice: 100,
      soldOut: false,
      loading: false,
      error: undefined,
    });
  });

  // TC-04-01: availabilityRoom present with priceFrom → renders live price
  it("TC-04-01: shows live priceFrom when availabilityRoom is available with a price", () => {
    const avRoom: OctorateRoom = {
      octorateRoomName: "Double",
      available: true,
      priceFrom: 94.99,
      nights: 2,
      ratePlans: [{ label: "Non-Refundable" }],
    };

    render(<RoomCard room={TEST_ROOM} availabilityRoom={avRoom} lang="en" />);

    const priceEl = screen.getByTestId("price-formatted");
    expect(priceEl).toBeInTheDocument();
    // ratesFrom mock: "From €{{price}}" with price=94.99.toFixed(2) = "From €94.99"
    expect(priceEl.textContent).toContain("94.99");
    expect(screen.queryByTestId("price-sold-out")).toBeNull();
  });

  // TC-04-02: availabilityRoom present with available=false → sold-out state
  it("TC-04-02: shows sold-out label when availabilityRoom.available=false", () => {
    const avRoom: OctorateRoom = {
      octorateRoomName: "Double",
      available: false,
      priceFrom: null,
      nights: 2,
      ratePlans: [],
    };

    render(<RoomCard room={TEST_ROOM} availabilityRoom={avRoom} lang="en" />);

    expect(screen.getByTestId("price-sold-out")).toBeInTheDocument();
    expect(screen.queryByTestId("price-formatted")).toBeNull();
  });

  // TC-04-03: availabilityRoom absent → falls back to useRoomPricing (shows lowestPrice=100)
  it("TC-04-03: falls back to useRoomPricing when availabilityRoom is undefined", () => {
    render(<RoomCard room={TEST_ROOM} lang="en" />);

    // useRoomPricing returns lowestPrice=100, soldOut=false
    expect(screen.queryByTestId("price-sold-out")).toBeNull();
    expect(screen.getByTestId("price-formatted")).toBeInTheDocument();
    expect(screen.getByTestId("price-formatted").textContent).toContain("100.00");
  });

  // TC-04-04: availabilityRoom.priceFrom=null, available=true → falls back to useRoomPricing basePrice
  // The component uses availabilityRoom.priceFrom only when !== null; otherwise falls back to baseLowestPrice.
  it("TC-04-04: falls back to baseLowestPrice when availabilityRoom.available=true but priceFrom=null", () => {
    const avRoom: OctorateRoom = {
      octorateRoomName: "Double",
      available: true,
      priceFrom: null,
      nights: 2,
      ratePlans: [],
    };

    render(<RoomCard room={TEST_ROOM} availabilityRoom={avRoom} lang="en" />);

    // Not sold out
    expect(screen.queryByTestId("price-sold-out")).toBeNull();
    // Falls back to useRoomPricing.lowestPrice=100 via baseLowestPrice
    expect(screen.getByTestId("price-formatted")).toBeInTheDocument();
    expect(screen.getByTestId("price-formatted").textContent).toContain("100.00");
  });

  // TC-04-05: availabilityRoom.available=false overrides useRoomPricing.soldOut=false
  it("TC-04-05: availabilityRoom.available=false overrides useRoomPricing soldOut=false", () => {
    // useRoomPricing says NOT sold out, but availabilityRoom says sold out
    mockUseRoomPricing.mockReturnValue({
      lowestPrice: 100,
      soldOut: false,
      loading: false,
      error: undefined,
    });

    const avRoom: OctorateRoom = {
      octorateRoomName: "Double",
      available: false,
      priceFrom: null,
      nights: 2,
      ratePlans: [],
    };

    render(<RoomCard room={TEST_ROOM} availabilityRoom={avRoom} lang="en" />);

    expect(screen.getByTestId("price-sold-out")).toBeInTheDocument();
  });

  // TC-04-06: availabilityRoom.available=true overrides useRoomPricing.soldOut=true
  it("TC-04-06: availabilityRoom.available=true suppresses sold-out even if base is sold-out", () => {
    // useRoomPricing says sold out, but availabilityRoom says available
    mockUseRoomPricing.mockReturnValue({
      lowestPrice: undefined,
      soldOut: true,
      loading: false,
      error: undefined,
    });

    const avRoom: OctorateRoom = {
      octorateRoomName: "Double",
      available: true,
      priceFrom: 80,
      nights: 1,
      ratePlans: [],
    };

    render(<RoomCard room={TEST_ROOM} availabilityRoom={avRoom} lang="en" />);

    expect(screen.queryByTestId("price-sold-out")).toBeNull();
    expect(screen.getByTestId("price-formatted")).toBeInTheDocument();
    expect(screen.getByTestId("price-formatted").textContent).toContain("80.00");
  });
});
