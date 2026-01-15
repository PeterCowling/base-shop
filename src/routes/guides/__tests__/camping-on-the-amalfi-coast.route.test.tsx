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

describe("camping-on-the-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("configures the guide template with camping extras", async () => {
    const { props, unmount } = await renderRoute(
      "@/routes/guides/camping-on-the-amalfi-coast",
      "/en/guides/camping-on-the-amalfi-coast",
    );

    expect(props.guideKey).toBe("campingAmalfi");
    expect(props.metaKey).toBe("campingAmalfi");
    expect(props.preferGenericWhenFallback).toBe(true);
    expect(props.preferGenericWhenUnlocalized).toBe(false);
    expect(props.relatedGuides?.items).toEqual([
      { key: "transportBudget" },
      { key: "positanoTravelGuide" },
    ]);

    unmount();
  });
});
