import { describe, expect, it, jest } from "@jest/globals";

describe("octorateCustomPage helpers", () => {
  afterEach(() => {
    jest.resetModules();
    jest.unmock("@/config/env");
  });

  it("buildHostelBookingTarget returns the branded secure-booking route when the widget flag is off", () => {
    jest.isolateModules(() => {
      const { buildHostelBookingTarget } =
        require("@/utils/octorateCustomPage") as typeof import("@/utils/octorateCustomPage");

      const result = buildHostelBookingTarget({
        lang: "en",
        bookingCode: "45111",
        checkin: "2026-06-16",
        checkout: "2026-06-18",
        octorateRateCode: "433887",
        pax: 2,
        plan: "nr",
        roomSku: "room_10",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error(`Expected ok result, got ${result.error}`);
      }

      expect(result.mode).toBe("summary_page");
      expect(result.url).toBe(
        "/en/book/secure-booking?checkin=2026-06-16&checkout=2026-06-18&pax=2&plan=nr&room=room_10",
      );
      expect(result.directUrl).toContain("book.octorate.com/octobook/site/reservation/result.xhtml");
    });
  });

  it("buildHostelBookingTarget returns the same-origin secure booking route when the flag is on", () => {
    jest.isolateModules(() => {
      jest.doMock("@/config/env", () => ({
        ...jest.requireActual<typeof import("@/test/__mocks__/config-env")>(
          "@/test/__mocks__/config-env",
        ),
        OCTORATE_CUSTOM_PAGE_ENABLED: true,
      }));

      const { buildHostelBookingTarget } =
        require("@/utils/octorateCustomPage") as typeof import("@/utils/octorateCustomPage");

      const result = buildHostelBookingTarget({
        lang: "en",
        bookingCode: "45111",
        checkin: "2026-06-16",
        checkout: "2026-06-18",
        deal: "SUMMER25",
        octorateRateCode: "433887",
        pax: 2,
        plan: "nr",
        roomSku: "room_10",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error(`Expected ok result, got ${result.error}`);
      }

      expect(result.mode).toBe("custom_page");
      expect(result.url).toBe(
        "/en/book/secure-booking?checkin=2026-06-16&checkout=2026-06-18&pax=2&plan=nr&room=room_10&deal=SUMMER25",
      );
      expect(result.directUrl).toContain("book.octorate.com/octobook/site/reservation/result.xhtml");
    });
  });

  it("parseSecureBookingSearchParams resolves room and plan metadata from the route query", () => {
    jest.isolateModules(() => {
      const { parseSecureBookingSearchParams } =
        require("@/utils/octorateCustomPage") as typeof import("@/utils/octorateCustomPage");

      const query = parseSecureBookingSearchParams(
        new URLSearchParams({
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: "2",
          plan: "flex",
          room: "room_10",
        }),
      );

      expect(query).toEqual(
        expect.objectContaining({
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          plan: "flex",
          room: expect.objectContaining({
            id: "room_10",
            rateCodes: expect.objectContaining({
              direct: expect.objectContaining({ flex: "433898" }),
            }),
          }),
        }),
      );
    });
  });
});
