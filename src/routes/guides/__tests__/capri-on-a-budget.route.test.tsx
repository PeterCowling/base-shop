import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@tests/renderers";
import { resetGuideTemplateSpy, getGuideTemplateProps } from "@tests/guides/template-spy";

async function renderRoute(modulePath: string, route: string) {
  const { default: Route } = await import(/* @vite-ignore */ modulePath);
  const utils = renderWithProviders(<Route />, { route });
  const props = getGuideTemplateProps<Record<string, unknown>>();
  if (!props) throw new Error("GuideSeoTemplate props were not captured – is the template mocked?");
  return { ...utils, props };
}

describe("capri-on-a-budget route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("configures fallback behaviour and helper metadata", async () => {
    const { props, unmount } = await renderRoute(
      "@/routes/guides/capri-on-a-budget",
      "/en/guides/capri-on-a-budget",
    );

    expect(props.guideKey).toBe("capriOnABudget");
    expect(props.metaKey).toBe("capriOnABudget");
    expect(props.preferGenericWhenFallback).toBe(true);
    expect(props.preferGenericWhenUnlocalized).toBe(false);
    expect(props.relatedGuides?.items).toEqual([
      { key: "capriDayTrip" },
      { key: "transportBudget" },
      { key: "cheapEats" },
    ]);
    expect(props.alsoHelpful).toEqual({
      tags: ["budgeting", "capri", "day-trip", "ferry", "positano"],
      excludeGuide: ["capriDayTrip", "transportBudget", "cheapEats"],
      includeRooms: true,
    });

    unmount();
  });
});
