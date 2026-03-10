import { findRoomIdBySlug, getRoomSlug, getRoomSlugAliases } from "../roomSlugs";

describe("roomSlugs", () => {
  it("returns localized canonical slugs for targeted non-English locales", () => {
    expect(getRoomSlug("room_10", "ja")).toBe("danjo-kongo-basu-tsuki-domitori");
    expect(getRoomSlug("room_10", "ko")).toBe("honseong-yoksil-poham-domitori");
    expect(getRoomSlug("room_10", "zh")).toBe("hunhe-sushe-duli-weiyu");
    expect(getRoomSlug("room_10", "ar")).toBe("mahja-mukhtalat-hammam-dakhili");
    expect(getRoomSlug("room_10", "hi")).toBe("mishrit-dorm-in-suit-bathroom");
  });

  it("preserves English aliases for non-English room URLs", () => {
    expect(getRoomSlugAliases("room_10", "ja")).toEqual(["mixed-ensuite-dorm"]);
    expect(getRoomSlugAliases("room_10", "en")).toEqual([]);
  });

  it("reverse-resolves both canonical localized slugs and legacy English aliases", () => {
    expect(findRoomIdBySlug("danjo-kongo-basu-tsuki-domitori", "ja")).toBe("room_10");
    expect(findRoomIdBySlug("mixed-ensuite-dorm", "ja")).toBe("room_10");
    expect(findRoomIdBySlug("honseong-yoksil-poham-domitori", "ko")).toBe("room_10");
    expect(findRoomIdBySlug("hunhe-sushe-duli-weiyu", "zh")).toBe("room_10");
    expect(findRoomIdBySlug("mahja-mukhtalat-hammam-dakhili", "ar")).toBe("room_10");
    expect(findRoomIdBySlug("mishrit-dorm-in-suit-bathroom", "hi")).toBe("room_10");
  });
});
