#!/usr/bin/env tsx
import {
  createFixtureTranslationProvider,
  runTranslationSpike,
  type TranslationProvider,
  TranslationSpikeError,
} from "./lib/translation-runner-spike";

type Scenario = {
  id: string;
  guideName: string;
  targetLocale: string;
  sourceJson: string;
  provider: TranslationProvider;
  expected: "pass" | "fail";
  expectedErrorCode?: string;
};

const SOURCE_FIXTURE = JSON.stringify({
  title: "Budget plan %LINK:positanoPompeii|Pompeii day trip%",
  highlights: [
    {
      text: "%IMAGE:amalfi-coast.jpg|Amalfi Coast viewpoint%",
    },
  ],
  sectionComponent: "%COMPONENT:ticketBox%",
});

const scenarios: Scenario[] = [
  {
    id: "link-token-preserved",
    guideName: "historyPositano.json",
    targetLocale: "es",
    sourceJson: SOURCE_FIXTURE,
    expected: "pass",
    provider: createFixtureTranslationProvider({
      "es:historyPositano.json": JSON.stringify({
        title: "Plan económico %LINK:positanoPompeii|excursión a Pompeya%",
        highlights: [
          {
            text: "%IMAGE:amalfi-coast.jpg|Mirador de la Costa Amalfitana%",
          },
        ],
        sectionComponent: "%COMPONENT:ticketBox%",
      }),
    }),
  },
  {
    id: "image-component-preserved",
    guideName: "historyPositano.json",
    targetLocale: "fr",
    sourceJson: SOURCE_FIXTURE,
    expected: "pass",
    provider: createFixtureTranslationProvider({
      "fr:historyPositano.json": JSON.stringify({
        title: "Plan malin %LINK:positanoPompeii|excursion à Pompéi%",
        highlights: [
          {
            text: "%IMAGE:amalfi-coast.jpg|Point de vue sur la côte amalfitaine%",
          },
        ],
        sectionComponent: "%COMPONENT:ticketBox%",
      }),
    }),
  },
  {
    id: "malformed-json-output",
    guideName: "historyPositano.json",
    targetLocale: "it",
    sourceJson: SOURCE_FIXTURE,
    expected: "fail",
    expectedErrorCode: "invalid_translated_json",
    provider: createFixtureTranslationProvider({
      "it:historyPositano.json": "{not-json",
    }),
  },
];

async function runScenario(scenario: Scenario): Promise<{
  id: string;
  expected: "pass" | "fail";
  actual: "pass" | "fail";
  code: string;
  ok: boolean;
}> {
  try {
    await runTranslationSpike({
      provider: scenario.provider,
      sourceJson: scenario.sourceJson,
      guideName: scenario.guideName,
      targetLocale: scenario.targetLocale,
    });

    return {
      id: scenario.id,
      expected: scenario.expected,
      actual: "pass",
      code: "ok",
      ok: scenario.expected === "pass",
    };
  } catch (error) {
    const errorCode =
      error instanceof TranslationSpikeError
        ? error.code
        : "unexpected_error";

    const expectedMatches =
      scenario.expected === "fail" &&
      (!scenario.expectedErrorCode || scenario.expectedErrorCode === errorCode);

    return {
      id: scenario.id,
      expected: scenario.expected,
      actual: "fail",
      code: errorCode,
      ok: expectedMatches,
    };
  }
}

async function main(): Promise<void> {
  console.info("S2-10 translation runner spike parity matrix");
  console.info("scenario | expected | actual | code | result");

  const results = await Promise.all(scenarios.map(runScenario));
  for (const result of results) {
    const status = result.ok ? "PASS" : "FAIL";
    console.info(
      `${result.id} | ${result.expected} | ${result.actual} | ${result.code} | ${status}`,
    );
  }

  const hasFailure = results.some((result) => !result.ok);
  if (hasFailure) {
    process.exitCode = 1;
    return;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
