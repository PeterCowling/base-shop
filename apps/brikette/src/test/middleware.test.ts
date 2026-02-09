// src/test/middleware.test.ts
// Contract tests for middleware deep localization redirects (TASK-SEO-3)
import { NextRequest, NextResponse } from "next/server";

import { middleware } from "../middleware";

// Mock NextResponse.rewrite for Jest environment
// In production, Next.js provides this method, but it's not available in Jest
if (!NextResponse.rewrite) {
  NextResponse.rewrite = (url: URL | string) => {
    const response = new NextResponse(null, { status: 200 });
    // Set a custom header to indicate this is a rewrite (for test assertions)
    response.headers.set("x-middleware-rewrite", url.toString());
    return response;
  };
}

/**
 * Helper to create a NextRequest for testing
 * NextRequest expects a valid URL object with proper structure
 */
function createRequest(pathname: string): NextRequest {
  const baseUrl = "https://hostel-positano.com";
  const url = new URL(pathname, baseUrl);
  return new NextRequest(url);
}

describe("middleware", () => {
  describe("rewrite localized slugs to internal segments (existing behavior)", () => {
    it("processes /de/zimmer without redirecting", () => {
      const request = createRequest("/de/zimmer");
      const response = middleware(request);

      expect(response).toBeDefined();
      // Should rewrite (200), not redirect (301)
      expect(response?.status).not.toBe(301);
    });

    it("processes /fr/chambres without redirecting", () => {
      const request = createRequest("/fr/chambres");
      const response = middleware(request);

      expect(response).toBeDefined();
      // Should rewrite (200), not redirect (301)
      expect(response?.status).not.toBe(301);
    });
  });

  describe("redirect English slugs in wrong locale (TASK-SEO-3)", () => {
    it("redirects /de/rooms → /de/zimmer/ (English slug in German)", () => {
      const request = createRequest("/de/rooms");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/de/zimmer/");
    });

    it("redirects /fr/rooms → /fr/chambres/ (English slug in French)", () => {
      const request = createRequest("/fr/rooms");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/fr/chambres/");
    });

    it("redirects /de/help → /de/hilfe/ (English assistance slug)", () => {
      const request = createRequest("/de/help");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/de/hilfe/");
    });

    it("redirects /fr/help → /fr/aide/ (English assistance slug)", () => {
      const request = createRequest("/fr/help");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/fr/aide/");
    });

    it("redirects /de/deals → /de/angebote/ (English deals slug)", () => {
      const request = createRequest("/de/deals");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/de/angebote/");
    });

    it("redirects /fr/deals → /fr/offres/ (English deals slug)", () => {
      const request = createRequest("/fr/deals");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/fr/offres/");
    });
  });

  describe("redirect internal segments in wrong locale (TASK-SEO-3)", () => {
    it("redirects /fr/assistance → /fr/aide/ (internal segment in French)", () => {
      const request = createRequest("/fr/assistance");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/fr/aide/");
    });

    it("redirects /de/experiences → /de/erlebnisse/ (internal segment in German)", () => {
      const request = createRequest("/de/experiences");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/de/erlebnisse/");
    });
  });

  describe("preserve language-agnostic child segments (no redirect)", () => {
    it("allows /en/rooms/double_room (room ID is language-agnostic)", () => {
      const request = createRequest("/en/rooms/double_room");
      const response = middleware(request);

      // Should rewrite, not redirect
      expect(response?.status).not.toBe(301);
      expect(response?.status).not.toBe(302);
    });

    it("allows /de/zimmer/room_4 (room ID in German context)", () => {
      const request = createRequest("/de/zimmer/room_4");
      const response = middleware(request);

      // Should rewrite, not redirect
      expect(response?.status).not.toBe(301);
      expect(response?.status).not.toBe(302);
    });

    it("allows /en/experiences/hiking (guide slug is language-agnostic)", () => {
      const request = createRequest("/en/experiences/hiking");
      const response = middleware(request);

      // Should rewrite or pass through, not redirect
      expect(response?.status).not.toBe(301);
      expect(response?.status).not.toBe(302);
    });
  });

  describe("preserve query params and trailing segments", () => {
    it("redirects /de/rooms?checkin=2025-05-01 → /de/zimmer/?checkin=2025-05-01", () => {
      const request = createRequest("/de/rooms?checkin=2025-05-01");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      const location = response?.headers.get("location");
      expect(location).toContain("/de/zimmer/");
      expect(location).toContain("checkin=2025-05-01");
    });

    it("redirects /de/rooms/double_room → /de/zimmer/double_room/ (preserve child segment)", () => {
      const request = createRequest("/de/rooms/double_room");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/de/zimmer/double_room/");
    });

    it("redirects /fr/help/ferry-guide → /fr/aide/ferry-guide/ (preserve assistance guide)", () => {
      const request = createRequest("/fr/help/ferry-guide");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/fr/aide/ferry-guide/");
    });

    it("rewrites /en/help.txt → /en/assistance.txt without redirect", () => {
      const request = createRequest("/en/help.txt");
      const response = middleware(request);

      expect(response?.status).not.toBe(301);
      expect(response?.status).not.toBe(302);
      expect(response?.headers.get("x-middleware-rewrite")).toContain("/en/assistance.txt");
    });

    it("redirects /de/help.txt → /de/hilfe.txt (preserve .txt suffix)", () => {
      const request = createRequest("/de/help.txt");
      const response = middleware(request);

      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toContain("/de/hilfe.txt");
    });
  });

  describe("no redirect loops (single hop)", () => {
    it("does not redirect /de/zimmer (already correct)", () => {
      const request = createRequest("/de/zimmer");
      const response = middleware(request);

      // Should rewrite, not redirect
      expect(response?.status).not.toBe(301);
      expect(response?.status).not.toBe(302);
    });

    it("does not redirect /fr/chambres (already correct)", () => {
      const request = createRequest("/fr/chambres");
      const response = middleware(request);

      // Should rewrite, not redirect
      expect(response?.status).not.toBe(301);
      expect(response?.status).not.toBe(302);
    });

    it("does not redirect /en/rooms (English is correct in English locale)", () => {
      const request = createRequest("/en/rooms");
      const response = middleware(request);

      // Should rewrite, not redirect
      expect(response?.status).not.toBe(301);
      expect(response?.status).not.toBe(302);
    });
  });

  describe("edge cases", () => {
    it("ignores Next.js internals (/_next/)", () => {
      const request = createRequest("/_next/static/test.js");
      const response = middleware(request);

      // Should pass through without modification
      expect(response).toBeDefined();
      expect(response?.status).not.toBe(301);
    });

    it("ignores favicon.ico", () => {
      const request = createRequest("/favicon.ico");
      const response = middleware(request);

      // Should pass through
      expect(response).toBeDefined();
      expect(response?.status).not.toBe(301);
    });

    it("ignores paths without language prefix", () => {
      const request = createRequest("/rooms");
      const response = middleware(request);

      // Should pass through
      expect(response).toBeDefined();
      expect(response?.status).not.toBe(301);
    });

    it("ignores unsupported language codes", () => {
      const request = createRequest("/xx/rooms");
      const response = middleware(request);

      // Should pass through
      expect(response).toBeDefined();
      expect(response?.status).not.toBe(301);
    });
  });

  describe("comprehensive slug coverage (parameterized)", () => {
    const testCases: Array<{
      from: string;
      to: string;
      desc: string;
    }> = [
      // German
      { from: "/de/rooms", to: "/de/zimmer/", desc: "rooms → zimmer (DE)" },
      { from: "/de/deals", to: "/de/angebote/", desc: "deals → angebote (DE)" },
      { from: "/de/about", to: "/de/ueber-uns/", desc: "about → ueber-uns (DE)" },
      { from: "/de/help", to: "/de/hilfe/", desc: "help → hilfe (DE)" },
      {
        from: "/de/experiences",
        to: "/de/erlebnisse/",
        desc: "experiences → erlebnisse (DE)",
      },
      { from: "/de/careers", to: "/de/karriere/", desc: "careers → karriere (DE)" },

      // French
      { from: "/fr/rooms", to: "/fr/chambres/", desc: "rooms → chambres (FR)" },
      { from: "/fr/deals", to: "/fr/offres/", desc: "deals → offres (FR)" },
      { from: "/fr/about", to: "/fr/a-propos/", desc: "about → a-propos (FR)" },
      { from: "/fr/help", to: "/fr/aide/", desc: "help → aide (FR)" },
      // Note: /fr/experiences is the same as English, so no redirect expected
      {
        from: "/fr/careers",
        to: "/fr/carrieres/",
        desc: "careers → carrieres (FR)",
      },

      // Spanish
      {
        from: "/es/rooms",
        to: "/es/habitaciones/",
        desc: "rooms → habitaciones (ES)",
      },
      { from: "/es/deals", to: "/es/ofertas/", desc: "deals → ofertas (ES)" },
      {
        from: "/es/about",
        to: "/es/sobre-nosotros/",
        desc: "about → sobre-nosotros (ES)",
      },
      { from: "/es/help", to: "/es/ayuda/", desc: "help → ayuda (ES)" },
      {
        from: "/es/experiences",
        to: "/es/experiencias/",
        desc: "experiences → experiencias (ES)",
      },

      // Italian
      { from: "/it/rooms", to: "/it/camere/", desc: "rooms → camere (IT)" },
      { from: "/it/deals", to: "/it/offerte/", desc: "deals → offerte (IT)" },
      { from: "/it/about", to: "/it/chi-siamo/", desc: "about → chi-siamo (IT)" },
      { from: "/it/help", to: "/it/assistenza/", desc: "help → assistenza (IT)" },
      {
        from: "/it/experiences",
        to: "/it/esperienze/",
        desc: "experiences → esperienze (IT)",
      },

      // Internal segments in wrong locale
      {
        from: "/de/assistance",
        to: "/de/hilfe/",
        desc: "assistance (internal) → hilfe (DE)",
      },
      {
        from: "/fr/assistance",
        to: "/fr/aide/",
        desc: "assistance (internal) → aide (FR)",
      },
    ];

    testCases.forEach(({ from, to, desc }) => {
      it(`redirects ${from} → ${to} (${desc})`, () => {
        const request = createRequest(from);
        const response = middleware(request);

        expect(response?.status).toBe(301);
        expect(response?.headers.get("location")).toContain(to);
      });
    });
  });
});
