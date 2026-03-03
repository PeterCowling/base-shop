import "@testing-library/jest-dom";

import React from "react";
import { render } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams("checkin=2026-06-10&checkout=2026-06-12&pax=2"),
  usePathname: () => "/en/dorms/room_10",
}));

jest.mock("next/link", () => {
  function MockLink({ children, href, prefetch: _p, ...props }: { children: React.ReactNode; href: string; prefetch?: boolean }) {
    return <a href={href} {...props}>{children}</a>;
  }
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/hooks/usePagePreload", () => ({ usePagePreload: () => {} }));
jest.mock("@/components/seo/RoomStructuredData", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/rooms/RoomCard", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/booking/LocationInline", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/molecules", () => ({ DirectBookingPerks: () => null }));
jest.mock("@/i18n", () => ({ __esModule: true, default: { getResource: () => "", getFixedT: () => (k: string) => k } }));
jest.mock("@/routes.guides-helpers", () => ({ guideHref: () => "/" }));
jest.mock("@/utils/translationFallbacks", () => ({ getGuideLinkLabel: () => "Guide" }));

let capturedOctorateUrl: string | undefined;

jest.mock("@acme/ui/organisms/StickyBookNow", () => ({
  __esModule: true,
  default: ({ octorateUrl }: { octorateUrl?: string }) => {
    capturedOctorateUrl = octorateUrl;
    return <div data-cy="sticky-book-now" />;
  },
}));

const RoomDetailContent = require("@/app/[lang]/dorms/[id]/RoomDetailContent")
  .default as typeof import("@/app/[lang]/dorms/[id]/RoomDetailContent").default;

describe("RoomDetailContent sticky CTA URL matrix", () => {
  beforeEach(() => {
    capturedOctorateUrl = undefined;
  });

  it.each([
    { roomId: "room_10", expectedRateCode: "433887" },
    { roomId: "room_11", expectedRateCode: "433888" },
    { roomId: "room_12", expectedRateCode: "433889" },
  ])("wires result URL for $roomId", ({ roomId, expectedRateCode }) => {
    render(<RoomDetailContent lang="en" id={roomId as "room_10" | "room_11" | "room_12"} />);

    expect(capturedOctorateUrl).toBeDefined();
    expect(capturedOctorateUrl).toContain("result.xhtml");
    expect(capturedOctorateUrl).toContain(`room=${expectedRateCode}`);
    expect(capturedOctorateUrl).toContain("checkin=2026-06-10");
    expect(capturedOctorateUrl).toContain("checkout=2026-06-12");
  });
});
