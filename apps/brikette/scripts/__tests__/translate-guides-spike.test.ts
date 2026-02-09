import {
  createFixtureTranslationProvider,
  runTranslationSpike,
  type TranslationSpikeError,
} from "../lib/translation-runner-spike";

const SOURCE_GUIDE_JSON = JSON.stringify({
  title: "Budget plan %LINK:positanoPompeii|Pompeii day trip%",
  highlights: [
    {
      text: "%IMAGE:amalfi-coast.jpg|Amalfi Coast viewpoint%",
    },
  ],
  sectionComponent: "%COMPONENT:ticketBox%",
});

describe("translate-guides spike runner", () => {
  it("preserves LINK guide ids while allowing anchor text translation", async () => {
    const provider = createFixtureTranslationProvider({
      "es:historyPositano.json": JSON.stringify({
        title: "Plan económico %LINK:positanoPompeii|excursión a Pompeya%",
        highlights: [
          {
            text: "%IMAGE:amalfi-coast.jpg|Mirador de la Costa Amalfitana%",
          },
        ],
        sectionComponent: "%COMPONENT:ticketBox%",
      }),
    });

    const result = await runTranslationSpike({
      provider,
      sourceJson: SOURCE_GUIDE_JSON,
      guideName: "historyPositano.json",
      targetLocale: "es",
    });

    expect(result.providerId).toBe("fixture-provider");
    expect(result.tokenSignatures).toEqual([
      "COMPONENT:ticketBox",
      "IMAGE:amalfi-coast.jpg",
      "LINK:positanoPompeii",
    ]);
  });

  it("preserves IMAGE/COMPONENT invariant segments across translation output", async () => {
    const provider = createFixtureTranslationProvider({
      "fr:historyPositano.json": JSON.stringify({
        title: "Plan malin %LINK:positanoPompeii|excursion à Pompéi%",
        highlights: [
          {
            text: "%IMAGE:amalfi-coast.jpg|Point de vue sur la côte amalfitaine%",
          },
        ],
        sectionComponent: "%COMPONENT:ticketBox%",
      }),
    });

    const result = await runTranslationSpike({
      provider,
      sourceJson: SOURCE_GUIDE_JSON,
      guideName: "historyPositano.json",
      targetLocale: "fr",
    });

    expect(result.tokenSignatures).toContain("IMAGE:amalfi-coast.jpg");
    expect(result.tokenSignatures).toContain("COMPONENT:ticketBox");
  });

  it("fails with invalid_translated_json when provider emits malformed JSON", async () => {
    const provider = createFixtureTranslationProvider({
      "it:historyPositano.json": "{not-json",
    });

    await expect(
      runTranslationSpike({
        provider,
        sourceJson: SOURCE_GUIDE_JSON,
        guideName: "historyPositano.json",
        targetLocale: "it",
      }),
    ).rejects.toMatchObject({
      code: "invalid_translated_json",
    } satisfies Partial<TranslationSpikeError>);
  });

  it("fails with token_invariant_mismatch when LINK ids are mutated", async () => {
    const provider = createFixtureTranslationProvider({
      "de:historyPositano.json": JSON.stringify({
        title: "Sparplan %LINK:mutatedGuideKey|Pompeji Tagesausflug%",
        highlights: [
          {
            text: "%IMAGE:amalfi-coast.jpg|Aussicht auf die Amalfiküste%",
          },
        ],
        sectionComponent: "%COMPONENT:ticketBox%",
      }),
    });

    await expect(
      runTranslationSpike({
        provider,
        sourceJson: SOURCE_GUIDE_JSON,
        guideName: "historyPositano.json",
        targetLocale: "de",
      }),
    ).rejects.toMatchObject({
      code: "token_invariant_mismatch",
      details: expect.objectContaining({
        missing: ["LINK:positanoPompeii (-1)"],
        extra: ["LINK:mutatedGuideKey (+1)"],
      }),
    } satisfies Partial<TranslationSpikeError>);
  });
});
