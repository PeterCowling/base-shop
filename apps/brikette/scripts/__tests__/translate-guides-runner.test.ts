/* eslint-disable security/detect-non-literal-fs-filename -- Test creates temporary paths per-case. */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { runGuideTranslationBatch } from "../lib/translate-guides-runner";
import {
  createFixtureTranslationProvider,
  type TranslationProvider,
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

const writeSourceGuide = (
  rootDir: string,
  sourceLocale: string,
  guideName: string,
  sourceJson: string = SOURCE_GUIDE_JSON,
): string => {
  const sourceDir = path.join(rootDir, sourceLocale, "guides", "content");
  mkdirSync(sourceDir, { recursive: true });
  const sourcePath = path.join(sourceDir, guideName);
  writeFileSync(sourcePath, `${JSON.stringify(JSON.parse(sourceJson), null, 2)}\n`, "utf8");
  return sourcePath;
};

describe("runGuideTranslationBatch", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(path.join(tmpdir(), "translate-guides-runner-"));
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("translates deterministic fixture content and writes valid JSON", async () => {
    const guideName = "historyPositano.json";
    writeSourceGuide(rootDir, "en", guideName);

    const provider = createFixtureTranslationProvider({
      "it:historyPositano.json": JSON.stringify({
        title: "Piano economico %LINK:positanoPompeii|gita di un giorno a Pompei%",
        highlights: [
          {
            text: "%IMAGE:amalfi-coast.jpg|Belvedere della Costiera Amalfitana%",
          },
        ],
        sectionComponent: "%COMPONENT:ticketBox%",
      }),
    });

    const result = await runGuideTranslationBatch({
      provider,
      sourceRoot: rootDir,
      outputRoot: rootDir,
      guides: [guideName],
      targetLocales: ["it"],
      dryRun: false,
    });

    const outputPath = path.join(rootDir, "it", "guides", "content", guideName);
    const written = JSON.parse(readFileSync(outputPath, "utf8")) as Record<string, unknown>;

    expect(result.failed).toBe(0);
    expect(result.written).toBe(1);
    expect(written.title).toBe("Piano economico %LINK:positanoPompeii|gita di un giorno a Pompei%");
  });

  it("fails token invariants when provider mutates LINK ids", async () => {
    const guideName = "historyPositano.json";
    writeSourceGuide(rootDir, "en", guideName);

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

    const result = await runGuideTranslationBatch({
      provider,
      sourceRoot: rootDir,
      outputRoot: rootDir,
      guides: [guideName],
      targetLocales: ["de"],
      dryRun: false,
    });

    expect(result.failed).toBe(1);
    expect(result.entries[0]?.failureCode).toBe("token_invariant_mismatch");
  });

  it("is idempotent for unchanged output and reports unchanged on rerun", async () => {
    const guideName = "historyPositano.json";
    writeSourceGuide(rootDir, "en", guideName);

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

    await runGuideTranslationBatch({
      provider,
      sourceRoot: rootDir,
      outputRoot: rootDir,
      guides: [guideName],
      targetLocales: ["fr"],
      dryRun: false,
    });

    const outputPath = path.join(rootDir, "fr", "guides", "content", guideName);
    const firstMtime = statSync(outputPath).mtimeMs;

    const secondResult = await runGuideTranslationBatch({
      provider,
      sourceRoot: rootDir,
      outputRoot: rootDir,
      guides: [guideName],
      targetLocales: ["fr"],
      dryRun: false,
    });

    const secondMtime = statSync(outputPath).mtimeMs;
    expect(secondResult.unchanged).toBe(1);
    expect(secondResult.written).toBe(0);
    expect(secondMtime).toBe(firstMtime);
  });

  it("continues processing when one locale provider request fails", async () => {
    const guideName = "historyPositano.json";
    writeSourceGuide(rootDir, "en", guideName);

    const provider: TranslationProvider = {
      id: "mixed-provider",
      async translate({ locale }) {
        if (locale === "it") {
          throw new Error("provider down for it");
        }

        return JSON.stringify({
          title: "Plan malin %LINK:positanoPompeii|excursion à Pompéi%",
          highlights: [
            {
              text: "%IMAGE:amalfi-coast.jpg|Point de vue sur la côte amalfitaine%",
            },
          ],
          sectionComponent: "%COMPONENT:ticketBox%",
        });
      },
    };

    const result = await runGuideTranslationBatch({
      provider,
      sourceRoot: rootDir,
      outputRoot: rootDir,
      guides: [guideName],
      targetLocales: ["it", "fr"],
      dryRun: false,
    });

    expect(result.failed).toBe(1);
    expect(result.written).toBe(1);
    expect(
      result.entries.find((entry) => entry.locale === "it")?.failureCode,
    ).toBe("provider_error");
    expect(
      result.entries.find((entry) => entry.locale === "fr")?.status,
    ).toBe("written");
  });

  it("supports dry-run mode with planned writes and no file mutation", async () => {
    const guideName = "historyPositano.json";
    writeSourceGuide(rootDir, "en", guideName);

    const provider = createFixtureTranslationProvider({
      "pt:historyPositano.json": JSON.stringify({
        title: "Plano econômico %LINK:positanoPompeii|passeio de um dia em Pompeia%",
        highlights: [
          {
            text: "%IMAGE:amalfi-coast.jpg|Mirante da Costa Amalfitana%",
          },
        ],
        sectionComponent: "%COMPONENT:ticketBox%",
      }),
    });

    const result = await runGuideTranslationBatch({
      provider,
      sourceRoot: rootDir,
      outputRoot: rootDir,
      guides: [guideName],
      targetLocales: ["pt"],
      dryRun: true,
    });

    const outputPath = path.join(rootDir, "pt", "guides", "content", guideName);
    expect(result.failed).toBe(0);
    expect(result.plannedWrites).toBe(1);
    expect(result.written).toBe(0);
    expect(() => statSync(outputPath)).toThrow();
  });
});
