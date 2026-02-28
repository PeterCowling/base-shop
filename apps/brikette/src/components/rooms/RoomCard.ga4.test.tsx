// apps/brikette/src/components/rooms/RoomCard.ga4.test.tsx
// GA4 select_item event tests for RoomCard CTA callbacks (TASK-01 contract).
// Uses a separate @acme/ui/molecules mock that renders action buttons — this is
// intentionally different from RoomCard.availability.test.tsx (which only renders
// price/sold-out state and cannot test click events).

import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

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
      "rooms.double_room.title": "Double Room",
      "rooms.double_room.facilities": "[]",
      ratesFrom: "From €{{price}}",
      loadingPrice: "Loading price…",
      "rooms.soldOut": "Sold out",
      checkRatesNonRefundable: "Non-Refundable",
      checkRatesFlexible: "Flexible",
    };
    const t = (key: string, opts?: Record<string, unknown>): unknown => {
      const val = store[key];
      if (typeof val === "string" && opts) {
        return val.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => String(opts[k] ?? `{{${k}}}`));
      }
      if (typeof val === "string") return val;
      if (opts?.returnObjects) return [];
      return key;
    };
    return { t, ready: true, i18n: {} };
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/hooks/useRoomPricing", () => ({
  useRoomPricing: () => ({
    lowestPrice: 100,
    soldOut: false,
    loading: false,
    error: undefined,
  }),
}));

// buildOctorateUrl: default returns ok=false (queryState="absent" branch).
// Individual tests override this for queryState="valid" scenarios.
const mockBuildOctorateUrl = jest.fn(() => ({ ok: false as const }));
jest.mock("@/utils/buildOctorateUrl", () => ({
  buildOctorateUrl: (...args: unknown[]) => mockBuildOctorateUrl(...args),
}));

jest.mock("@/components/rooms/FacilityIcon", () => ({
  __esModule: true,
  default: ({ facility }: { facility: string }) => <span>{facility}</span>,
}));

jest.mock("@/components/rooms/FullscreenImage", () => ({
  __esModule: true,
  default: () => <div />,
}));

// @acme/ui/molecules mock: renders action buttons so click events can be tested.
// This is DIFFERENT from RoomCard.availability.test.tsx (price-rendering mock).
jest.mock("@acme/ui/molecules", () => ({
  RoomCard: (props: {
    actions?: Array<{ id: string; label: string; onSelect: () => void; disabled?: boolean }>;
  }) => (
    <div data-testid="room-card-mock">
      {props.actions?.map((a) => (
        <button key={a.id} onClick={a.onSelect} disabled={a.disabled ?? false} data-action-id={a.id}>
          {a.label}
        </button>
      )) ?? null}
    </div>
  ),
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

describe("RoomCard — GA4 select_item events (room_detail surface)", () => {
  let gtagMock: jest.Mock;
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
    mockBuildOctorateUrl.mockReturnValue({ ok: false as const });
  });

  afterEach(() => {
    window.gtag = originalGtag;
    jest.useRealTimers();
  });

  // TC-01: queryState="valid", NR CTA click → select_item fires with item_list_id: "room_detail",
  // items[0].item_variant: "nr" before navigation.
  it("TC-01: fires select_item with item_list_id=room_detail and item_variant=nr on NR click (valid state + octorate URL)", () => {
    mockBuildOctorateUrl.mockReturnValue({ ok: true as const, url: "https://octorate.com/nr" });

    render(
      <RoomCard
        room={TEST_ROOM}
        queryState="valid"
        checkIn="2026-06-10"
        checkOut="2026-06-12"
        adults={2}
        lang="en"
      />,
    );

    const nrButton = screen.getByRole("button", { name: /Non-Refundable/i });
    fireEvent.click(nrButton);

    const selectItemCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "select_item",
    );
    expect(selectItemCall).toBeTruthy();
    const payload = selectItemCall?.[2] as Record<string, unknown>;

    expect(payload).toMatchObject({
      item_list_id: "room_detail",
      item_list_name: "Room detail",
    });
    const items = payload.items as Array<Record<string, unknown>>;
    expect(items[0]).toMatchObject({
      item_id: "double_room",
      item_variant: "nr",
      item_category: "hostel",
      affiliation: "Hostel Brikette",
      currency: "EUR",
    });
  });

  // TC-02: queryState="absent", NR CTA click (no Octorate URL) → select_item fires before
  // router.push navigation.
  it("TC-02: fires select_item with item_variant=nr on NR click (absent state, no octorate URL)", () => {
    render(
      <RoomCard
        room={TEST_ROOM}
        queryState="absent"
        checkIn="2026-06-10"
        checkOut="2026-06-12"
        adults={2}
        lang="en"
      />,
    );

    const nrButton = screen.getByRole("button", { name: /Non-Refundable/i });
    fireEvent.click(nrButton);

    const selectItemCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "select_item",
    );
    expect(selectItemCall).toBeTruthy();
    const payload = selectItemCall?.[2] as Record<string, unknown>;
    expect(payload).toMatchObject({ item_list_id: "room_detail" });
    const items = payload.items as Array<Record<string, unknown>>;
    expect(items[0]).toMatchObject({ item_variant: "nr" });
  });

  // TC-03: queryState="valid", Flex CTA click → select_item fires with item_variant: "flex".
  it("TC-03: fires select_item with item_list_id=room_detail and item_variant=flex on Flex click", () => {
    mockBuildOctorateUrl.mockReturnValue({ ok: true as const, url: "https://octorate.com/flex" });

    render(
      <RoomCard
        room={TEST_ROOM}
        queryState="valid"
        checkIn="2026-06-10"
        checkOut="2026-06-12"
        adults={2}
        lang="en"
      />,
    );

    const flexButton = screen.getByRole("button", { name: /Flexible/i });
    fireEvent.click(flexButton);

    const selectItemCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "select_item",
    );
    expect(selectItemCall).toBeTruthy();
    const payload = selectItemCall?.[2] as Record<string, unknown>;
    expect(payload).toMatchObject({ item_list_id: "room_detail" });
    const items = payload.items as Array<Record<string, unknown>>;
    expect(items[0]).toMatchObject({ item_variant: "flex" });
  });

  // TC-04: queryState="invalid", NR CTA click → select_item does NOT fire (scroll path).
  it("TC-04: does NOT fire select_item on NR click when queryState=invalid", () => {
    render(
      <RoomCard
        room={TEST_ROOM}
        queryState="invalid"
        checkIn="2026-06-10"
        checkOut="2026-06-12"
        adults={2}
        lang="en"
      />,
    );

    const nrButton = screen.getByRole("button", { name: /Non-Refundable/i });
    fireEvent.click(nrButton);

    const selectItemCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "select_item",
    );
    expect(selectItemCall).toBeUndefined();
  });

  // TC-05: queryState="invalid", Flex CTA click → select_item does NOT fire.
  it("TC-05: does NOT fire select_item on Flex click when queryState=invalid", () => {
    render(
      <RoomCard
        room={TEST_ROOM}
        queryState="invalid"
        checkIn="2026-06-10"
        checkOut="2026-06-12"
        adults={2}
        lang="en"
      />,
    );

    const flexButton = screen.getByRole("button", { name: /Flexible/i });
    fireEvent.click(flexButton);

    const selectItemCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "select_item",
    );
    expect(selectItemCall).toBeUndefined();
  });

  // TC-06: select_item payload includes canonical item_list_name, item_category, currency.
  it("TC-06: select_item payload includes item_list_name=Room detail, item_category=hostel, currency=EUR", () => {
    render(
      <RoomCard
        room={TEST_ROOM}
        queryState="absent"
        checkIn="2026-06-10"
        checkOut="2026-06-12"
        adults={2}
        lang="en"
      />,
    );

    const nrButton = screen.getByRole("button", { name: /Non-Refundable/i });
    fireEvent.click(nrButton);

    const selectItemCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "select_item",
    );
    expect(selectItemCall).toBeTruthy();
    const payload = selectItemCall?.[2] as Record<string, unknown>;
    expect(payload.item_list_name).toBe("Room detail");
    const items = payload.items as Array<Record<string, unknown>>;
    expect(items[0]).toMatchObject({
      item_category: "hostel",
      affiliation: "Hostel Brikette",
      currency: "EUR",
    });
  });
});
