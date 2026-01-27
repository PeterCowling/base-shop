/**
 * Golden tests for transport route → guide content transformation.
 *
 * Tests cover:
 * - linkBindings.placeholder pattern (template-based)
 * - linkBindings.linkObject pattern (split text)
 * - galleries with zoomable option
 * - callouts with link tokens
 * - sections object → array transformation
 */

import { describe, expect, it } from "@jest/globals";
import { transformRouteToGuide } from "@/routes/how-to-get-here/transformRouteToGuide";
import type { RouteDefinition } from "@/lib/how-to-get-here/definitions";
import type { RouteContent } from "@/lib/how-to-get-here/schema";

describe("transportMigration", () => {
  describe("linkBindings.placeholder pattern", () => {
    it("should transform capri-positano-ferry with placeholder link tags", () => {
      const routeDefinition: Partial<RouteDefinition> = {
        contentKey: "capriPositanoFerry",
        linkBindings: [
          {
            key: "tip.copy",
            placeholders: {
              link: {
                type: "external",
                href: "https://forum.amalfi.com/t/mobility-amalfi-coast-bus/26",
              },
            },
          },
          {
            key: "sections.capriPort.link",
            placeholders: {
              capriLink: {
                type: "external",
                href: "https://www.capri.net/en/t/capri/positano",
              },
              positanoLink: {
                type: "external",
                href: "https://www.positano.com/en/ferry-schedule",
              },
            },
          },
        ],
      };

      const routeContent: RouteContent = {
        slug: "capri-positano-ferry",
        meta: {
          title: "Capri to Positano by Ferry | Hostel Brikette",
          description: "How to travel from Capri to Positano by ferry...",
        },
        header: {
          eyebrow: "Hostel Brikette Travel Guide",
          title: "Capri to Positano – Ferry",
          description: "Use this guide to travel from Capri to Positano...",
        },
        tip: {
          eyebrow: "Tip",
          copy: "Need other options? Open the <link>How to Get Here overview</link>.",
          linkLabel: "How to Get Here overview",
        },
        sections: {
          capriPort: {
            title: "At Capri port",
            list: ["Check times and prices"],
            link: "Compare ferry times: <capriLink>Capri.net</capriLink> · <positanoLink>Positano.com</positanoLink>.",
            linkLabelCapri: "Capri.net – Capri ↔ Positano",
            linkLabelPositano: "Positano.com (aggregated schedule)",
          },
        },
      };

      const result = transformRouteToGuide(routeDefinition as any, routeContent, "capriPositanoFerry");

      const expected = {
        seo: {
          title: "Capri to Positano by Ferry | Hostel Brikette",
          description: "How to travel from Capri to Positano by ferry...",
        },
        intro: {
          title: "Capri to Positano – Ferry",
          body: "Use this guide to travel from Capri to Positano...",
        },
        callouts: {
          tip: "Need other options? Open the %URL:https://forum.amalfi.com/t/mobility-amalfi-coast-bus/26|How to Get Here overview%.",
        },
        sections: [
          {
            id: "capriPort",
            title: "At Capri port",
            list: ["Check times and prices"],
            body: "Compare ferry times: %URL:https://www.capri.net/en/t/capri/positano|Capri.net% · %URL:https://www.positano.com/en/ferry-schedule|Positano.com%.",
          },
        ],
      };

      expect(result).toEqual(expected);
    });
  });

  describe("linkBindings.linkObject pattern", () => {
    it("should transform amalfi-positano-ferry with linkObject split text", () => {
      const routeDefinition: Partial<RouteDefinition> = {
        contentKey: "howToGetHereAmalfiPositanoFerry",
        linkBindings: [
          {
            key: "tip.body",
            linkObject: { type: "howToOverview" },
          },
          {
            key: "sections.positanoArrival.cta",
            linkObject: { type: "guide", guideKey: "ferryDockToBrikette" as any },
          },
        ],
      };

      const routeContent: RouteContent = {
        slug: "amalfi-positano-ferry",
        meta: {
          title: "Amalfi to Positano by Ferry | Hostel Brikette",
          description: "Amalfi to Positano by ferry: times, tickets...",
        },
        header: {
          eyebrow: "Hostel Brikette Travel Guide",
          title: "Amalfi to Positano — Ferry",
          description: "Follow these steps to travel from Amalfi...",
        },
        tip: {
          label: "Tip",
          body: {
            before: "Need other transport options? Open the ",
            linkLabel: "How to Get Here overview",
            after: " for buses.",
          },
        },
        sections: {
          positanoArrival: {
            title: "Arriving in Positano",
            points: ["Boats arrive at Positano's main dock."],
            cta: {
              before: "Read the ",
              linkLabel: "Ferry dock → Hostel Brikette guide",
              after: ".",
            },
          },
        },
      };

      const result = transformRouteToGuide(routeDefinition as any, routeContent, "amalfiPositanoFerry");

      const expected = {
        seo: {
          title: "Amalfi to Positano by Ferry | Hostel Brikette",
          description: "Amalfi to Positano by ferry: times, tickets...",
        },
        intro: {
          title: "Amalfi to Positano — Ferry",
          body: "Follow these steps to travel from Amalfi...",
        },
        callouts: {
          tip: "Need other transport options? Open the %HOWTO:how-to-get-here|How to Get Here overview% for buses.",
        },
        sections: [
          {
            id: "positanoArrival",
            title: "Arriving in Positano",
            list: ["Boats arrive at Positano's main dock."],
            body: "Read the %LINK:ferryDockToBrikette|Ferry dock → Hostel Brikette guide%.",
          },
        ],
      };

      expect(result).toEqual(expected);
    });
  });

  describe("galleries", () => {
    it("should merge gallery metadata with content", () => {
      const routeDefinition: Partial<RouteDefinition> = {
        contentKey: "capriPositanoFerry",
        galleries: [
          {
            key: "photoGuide.items",
            items: [
              {
                id: "internoYellow",
                src: "/img/directions/capri-positano-interno-yellow.jpg",
                aspectRatio: "4/3",
                preset: "gallery",
              },
            ],
          },
        ],
      };

      const routeContent: RouteContent = {
        slug: "capri-positano-ferry",
        meta: { title: "Test", description: "Test" },
        header: { title: "Test", description: "Test" },
        photoGuide: {
          heading: "Photo guide",
          items: [{ caption: "Yellow Interno bus approaching" }],
        },
      };

      const result = transformRouteToGuide(routeDefinition as any, routeContent, "capriPositanoFerry");

      expect(result.galleries).toEqual([
        {
          heading: "Photo guide",
          items: [
            {
              src: "/img/directions/capri-positano-interno-yellow.jpg",
              caption: "Yellow Interno bus approaching",
              alt: undefined,
              aspectRatio: "4/3",
              preset: "gallery",
            },
          ],
        },
      ]);
    });
  });

  describe("sections transformation", () => {
    it("should convert sections object to array with stable IDs", () => {
      const routeContent: RouteContent = {
        slug: "test-route",
        meta: { title: "Test", description: "Test" },
        header: { title: "Test", description: "Test" },
        sections: {
          overview: {
            title: "Journey overview",
            body: "Ferries run frequently.",
          },
          tickets: {
            title: "Tickets",
            points: ["Buy online", "Arrive early"],
          },
        },
      };

      const result = transformRouteToGuide({} as any, routeContent, "testRoute");

      expect(result.sections).toEqual([
        {
          id: "overview",
          title: "Journey overview",
          body: "Ferries run frequently.",
        },
        {
          id: "tickets",
          title: "Tickets",
          list: ["Buy online", "Arrive early"],
        },
      ]);
    });
  });

  describe("callout variants", () => {
    it("should detect tip variant", () => {
      const routeContent: RouteContent = {
        slug: "test",
        meta: { title: "Test", description: "Test" },
        header: { title: "Test", description: "Test" },
        tip: {
          eyebrow: "Tip",
          copy: "This is a tip.",
        },
      };

      const result = transformRouteToGuide({} as any, routeContent, "test");

      expect(result.callouts?.tip).toBe("This is a tip.");
    });

    it("should detect aside variant", () => {
      const routeContent: RouteContent = {
        slug: "test",
        meta: { title: "Test", description: "Test" },
        header: { title: "Test", description: "Test" },
        aside: {
          label: "Note",
          body: "This is an aside.",
        },
      };

      const result = transformRouteToGuide({} as any, routeContent, "test");

      expect(result.callouts?.aside).toBe("This is an aside.");
    });

    it("should detect cta variant", () => {
      const routeContent: RouteContent = {
        slug: "test",
        meta: { title: "Test", description: "Test" },
        header: { title: "Test", description: "Test" },
        cta: {
          label: "Action",
          body: "This is a CTA.",
        },
      };

      const result = transformRouteToGuide({} as any, routeContent, "test");

      expect(result.callouts?.cta).toBe("This is a CTA.");
    });
  });
});
