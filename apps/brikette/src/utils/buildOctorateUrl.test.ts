// src/utils/buildOctorateUrl.test.ts
import { buildOctorateUrl } from "./buildOctorateUrl";

// Shared base params used across tests
const BASE_PARAMS = {
  checkin: "2025-07-01",
  checkout: "2025-07-05",
  pax: 2,
  bookingCode: "45111",
};

// TC-01: NR plan for double_room (widgetRateCodeNR: "433883")
describe("buildOctorateUrl — NR plan", () => {
  it("returns ok:true and calendar URL containing checkin/checkout/codice/date/room for NR rate code (double_room)", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "433883",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.url).toContain("book.octorate.com/octobook/site/reservation/calendar.xhtml");
    expect(result.url).toContain("checkin=2025-07-01");
    expect(result.url).toContain("checkout=2025-07-05");
    expect(result.url).toContain("date=2025-07-01");
    expect(result.url).toContain("codice=45111");
    expect(result.url).toContain("room=433883");
  });

  it("returns ok:true and URL containing NR rate code for room_10 (widgetRateCodeNR: \"433887\")", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "nr",
      roomSku: "room_10",
      octorateRateCode: "433887",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.url).toContain("room=433887");
    expect(result.url).toContain("date=2025-07-01");
    expect(result.url).toContain("codice=45111");
    expect(result.url).toContain("checkin=2025-07-01");
    expect(result.url).toContain("checkout=2025-07-05");
  });
});

// TC-02: Flex plan
describe("buildOctorateUrl — Flex plan", () => {
  it("returns ok:true and URL containing flex rate code for double_room", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "flex",
      roomSku: "double_room",
      octorateRateCode: "433894",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.url).toContain("room=433894");
    expect(result.url).toContain("date=2025-07-01");
    expect(result.url).toContain("codice=45111");
    expect(result.url).toContain("checkin=2025-07-01");
    expect(result.url).toContain("checkout=2025-07-05");
  });

  it("returns ok:true and URL containing flex rate code for room_10", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "flex",
      roomSku: "room_10",
      octorateRateCode: "433898",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.url).toContain("room=433898");
    expect(result.url).toContain("codice=45111");
  });
});

// TC-03: deal param present
describe("buildOctorateUrl — with deal code", () => {
  it("appends deal + UTM params when deal is provided", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "433883",
      deal: "SUMMER25",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.url).toContain("deal=SUMMER25");
    expect(result.url).toContain("utm_source=site");
    expect(result.url).toContain("utm_medium=deal");
    expect(result.url).toContain("utm_campaign=SUMMER25");
  });
});

// TC-04: deal param absent
describe("buildOctorateUrl — without deal code", () => {
  it("does not append deal or UTM params when deal is undefined", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "433883",
      deal: undefined,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.url).not.toContain("deal=");
    expect(result.url).not.toContain("utm_source");
    expect(result.url).not.toContain("utm_medium");
    expect(result.url).not.toContain("utm_campaign");
  });

  it("does not append deal params when deal is an empty string", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "flex",
      roomSku: "room_10",
      octorateRateCode: "433898",
      deal: "",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    expect(result.url).not.toContain("deal=");
  });
});

// TC-05: validation guards
describe("buildOctorateUrl — validation guards", () => {
  it("returns ok:false with error missing_rate_code when octorateRateCode is undefined", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: undefined,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.error).toBe("missing_rate_code");
  });

  it("returns ok:false with error missing_rate_code when octorateRateCode is empty string", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.error).toBe("missing_rate_code");
  });

  it("returns ok:false with error missing_booking_code when bookingCode is empty", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      bookingCode: "",
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "433883",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.error).toBe("missing_booking_code");
  });

  it("returns ok:false with error invalid_dates when checkin is malformed", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      checkin: "not-a-date",
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "433883",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.error).toBe("invalid_dates");
  });

  it("returns ok:false with error invalid_dates when checkout is malformed", () => {
    const result = buildOctorateUrl({
      ...BASE_PARAMS,
      checkout: "",
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "433883",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected ok:false");
    expect(result.error).toBe("invalid_dates");
  });
});

// Exact URL structure assertions
describe("buildOctorateUrl — exact URL structure", () => {
  it("NR double_room: URL starts with correct calendar.xhtml base and has all required params", () => {
    const result = buildOctorateUrl({
      checkin: "2025-07-01",
      checkout: "2025-07-05",
      pax: 2,
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "433883",
      bookingCode: "45111",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    const url = new URL(result.url);
    expect(url.origin + url.pathname).toBe(
      "https://book.octorate.com/octobook/site/reservation/calendar.xhtml"
    );
    expect(url.searchParams.get("codice")).toBe("45111");
    expect(url.searchParams.get("date")).toBe("2025-07-01");
    expect(url.searchParams.get("checkin")).toBe("2025-07-01");
    expect(url.searchParams.get("checkout")).toBe("2025-07-05");
    expect(url.searchParams.get("room")).toBe("433883");
    expect(url.searchParams.get("pax")).toBe("2");
  });

  it("Flex double_room: URL has correct flex rate code and date", () => {
    const result = buildOctorateUrl({
      checkin: "2025-08-10",
      checkout: "2025-08-14",
      pax: 1,
      plan: "flex",
      roomSku: "double_room",
      octorateRateCode: "433894",
      bookingCode: "45111",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    const url = new URL(result.url);
    expect(url.searchParams.get("room")).toBe("433894");
    expect(url.searchParams.get("date")).toBe("2025-08-10");
    expect(url.searchParams.get("pax")).toBe("1");
  });

  it("deal=SUMMER25: URL has deal + UTM params appended correctly", () => {
    const result = buildOctorateUrl({
      checkin: "2025-07-01",
      checkout: "2025-07-05",
      pax: 2,
      plan: "nr",
      roomSku: "double_room",
      octorateRateCode: "433883",
      bookingCode: "45111",
      deal: "SUMMER25",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");

    const url = new URL(result.url);
    expect(url.searchParams.get("deal")).toBe("SUMMER25");
    expect(url.searchParams.get("utm_source")).toBe("site");
    expect(url.searchParams.get("utm_medium")).toBe("deal");
    expect(url.searchParams.get("utm_campaign")).toBe("SUMMER25");
  });
});
