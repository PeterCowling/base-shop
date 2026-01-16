import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { buildGuideContext } from "@tests/guides/context";
import {
  exerciseBuildHowToSteps,
  getGuideTemplateProps,
  resetGuideTemplateSpy,
} from "@tests/guides/template-spy";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import { GUIDE_KEY as AMALFI_KEY } from "../positano-to-amalfi";
import { GUIDE_KEY as POMPEII_KEY } from "../positano-to-pompeii";
import { GUIDE_KEY as RAVELLO_KEY } from "../positano-to-ravello";

type StepsPayload = Array<{ name?: string; text?: unknown }> | unknown;

const buildTranslateGuides = (guideKey: string, value: StepsPayload) =>
  ((key: string, options?: { returnObjects?: boolean }) => {
    if (key === `content.${guideKey}.howTo.steps`) {
      return options?.returnObjects ? value : "";
    }
    return options?.returnObjects ? [] : "";
  }) as GuideSeoTemplateContext["translateGuides"];

const evaluateHowToSteps = (guideKey: string, value: StepsPayload) => {
  const translateGuides = buildTranslateGuides(guideKey, value);
  const context = buildGuideContext({
    guideKey,
    metaKey: guideKey,
    translateGuides,
    translator: translateGuides as unknown as GuideSeoTemplateContext["translator"],
    hasLocalizedContent: true,
  });
  return exerciseBuildHowToSteps(context);
};

describe("positano-to-amalfi route", () => {
  beforeEach(async () => {
    resetGuideTemplateSpy();
    await renderGuideRoute("@/routes/guides/positano-to-amalfi", "/en/guides/positano-to-amalfi");
  });

  it("configures GuideSeoTemplate with transport metadata", () => {
    const props = getGuideTemplateProps<any>();
    expect(props).toMatchObject({
      guideKey: AMALFI_KEY,
      metaKey: AMALFI_KEY,
      includeHowToStructuredData: true,
      relatedGuides: { items: [{ key: "sitaTickets" }, { key: "ferrySchedules" }, { key: "positanoRavello" }] },
      alsoHelpful: {
        tags: ["transport", "amalfi", "bus", "ferry", "positano"],
        excludeGuide: ["sitaTickets", "ferrySchedules", "positanoRavello"],
        includeRooms: true,
      },
    });
  });

  it("normalises steps with trimmed names and joined text", () => {
    const result = evaluateHowToSteps(AMALFI_KEY, [
      { name: "  Step 1  ", text: ["  Board the bus", "arrive at Amalfi "] },
      { name: "Step 2", text: ["   ", " "] },
      { name: "", text: ["ignored"] },
      { text: ["missing name"] },
    ]);

    expect(result).toEqual([
      { name: "Step 1", text: "Board the bus arrive at Amalfi" },
      { name: "Step 2" },
    ]);
  });

  it("returns null when no valid steps remain", () => {
    const result = evaluateHowToSteps(AMALFI_KEY, [
      { name: "   ", text: [" "] },
      { text: [] },
    ]);
    expect(result).toBeNull();
  });
});

describe("positano-to-pompeii route", () => {
  beforeEach(async () => {
    resetGuideTemplateSpy();
    await renderGuideRoute("@/routes/guides/positano-to-pompeii", "/en/guides/positano-to-pompeii");
  });

  it("configures GuideSeoTemplate for structured how-to data", () => {
    const props = getGuideTemplateProps<any>();
    expect(props).toMatchObject({
      guideKey: POMPEII_KEY,
      metaKey: POMPEII_KEY,
      includeHowToStructuredData: true,
      relatedGuides: { items: [{ key: "sitaTickets" }, { key: "ferrySchedules" }, { key: "whatToPack" }] },
      alsoHelpful: {
        tags: ["transport", "pompeii", "train", "bus", "positano"],
        excludeGuide: ["sitaTickets", "ferrySchedules", "whatToPack"],
        includeRooms: true,
      },
    });
  });

  it("builds a structured steps payload with extras", () => {
    const result = evaluateHowToSteps(POMPEII_KEY, [
      { name: "  Step 1  ", text: ["  Take the SITA bus", "transfer to train"] },
      { name: "Step 2", text: ["Walk to the ruins", ""] },
      { name: "  ", text: ["ignored"] },
    ]);

    expect(result).toEqual({
      steps: [
        { name: "Step 1", text: "Take the SITA bus transfer to train" },
        { name: "Step 2", text: "Walk to the ruins" },
      ],
      extras: { totalTime: "PT2H" },
    });
  });

  it("returns null when translations yield no usable steps", () => {
    const result = evaluateHowToSteps(POMPEII_KEY, [{ name: "", text: [] }]);
    expect(result).toBeNull();
  });
});

describe("positano-to-ravello route", () => {
  beforeEach(async () => {
    resetGuideTemplateSpy();
    await renderGuideRoute("@/routes/guides/positano-to-ravello", "/en/guides/positano-to-ravello");
  });

  it("configures template props for Ravello transfers", () => {
    const props = getGuideTemplateProps<any>();
    expect(props).toMatchObject({
      guideKey: RAVELLO_KEY,
      metaKey: RAVELLO_KEY,
      includeHowToStructuredData: true,
      relatedGuides: { items: [{ key: "positanoAmalfi" }, { key: "sitaTickets" }, { key: "sunsetViewpoints" }] },
      alsoHelpful: {
        tags: ["transport", "ravello", "bus", "ferry", "positano"],
        excludeGuide: ["positanoAmalfi", "sitaTickets", "sunsetViewpoints"],
        includeRooms: true,
      },
    });
  });

  it("normalises trimmed step names and optional text", () => {
    const result = evaluateHowToSteps(RAVELLO_KEY, [
      { name: "  Step 1  ", text: ["  Catch the bus", "enjoy the views  "] },
      { name: "Step 2", text: ["   "] },
      { name: "" },
    ]);

    expect(result).toEqual([
      { name: "Step 1", text: "Catch the bus enjoy the views" },
      { name: "Step 2" },
    ]);
  });

  it("returns null when every step is filtered out", () => {
    const result = evaluateHowToSteps(RAVELLO_KEY, [{ name: "   " }, { text: ["no name"] }]);
    expect(result).toBeNull();
  });
});