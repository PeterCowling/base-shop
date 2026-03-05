"use client";

import Image, { type StaticImageData } from "next/image";

import type { UploaderLocale, UploaderMessageKey } from "../../lib/uploaderI18n";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";
import UploaderShell from "../UploaderShell.client";

import addProductScreenEn from "./assets/add-product-screen-en.png";
import addProductScreenZh from "./assets/add-product-screen-zh.png";
import currencyScreenEn from "./assets/currency-screen-en.png";
import currencyScreenZh from "./assets/currency-screen-zh.png";
import editScreenEn from "./assets/edit-screen-en.png";
import editScreenZh from "./assets/edit-screen-zh.png";
import loginScreenEn from "./assets/login-screen-en.png";
import loginScreenZh from "./assets/login-screen-zh.png";

type InstructionSection = {
  titleKey: UploaderMessageKey;
  stepKeys: readonly UploaderMessageKey[];
  expectationKeys?: readonly UploaderMessageKey[];
  screenshot?: {
    srcByLocale: Record<UploaderLocale, StaticImageData>;
    captionKey: UploaderMessageKey;
  };
};

const INSTRUCTION_SECTIONS: readonly InstructionSection[] = [
  {
    titleKey: "instructionsSection1Title",
    stepKeys: [
      "instructionsSection1Step1",
      "instructionsSection1Step2",
      "instructionsSection1Step3",
      "instructionsSection1Step4",
    ],
    expectationKeys: ["instructionsSection1Expectation1"],
    screenshot: {
      srcByLocale: { en: loginScreenEn, zh: loginScreenZh },
      captionKey: "instructionsSection1ScreenshotCaption",
    },
  },
  {
    titleKey: "instructionsSection2Title",
    stepKeys: [
      "instructionsSection2Step1",
      "instructionsSection2Step2",
      "instructionsSection2Step3",
      "instructionsSection2Step4",
    ],
    expectationKeys: ["instructionsSection2Expectation1"],
    screenshot: {
      srcByLocale: { en: addProductScreenEn, zh: addProductScreenZh },
      captionKey: "instructionsSection2ScreenshotCaption",
    },
  },
  {
    titleKey: "instructionsSection3Title",
    stepKeys: [
      "instructionsSection3Step1",
      "instructionsSection3Step2",
      "instructionsSection3Step3",
      "instructionsSection3Step4",
    ],
    expectationKeys: ["instructionsSection3Expectation1"],
  },
  {
    titleKey: "instructionsSection4Title",
    stepKeys: [
      "instructionsSection4Step1",
      "instructionsSection4Step2",
      "instructionsSection4Step3",
      "instructionsSection4Step4",
    ],
    expectationKeys: ["instructionsSection4Expectation1"],
  },
  {
    titleKey: "instructionsSection5Title",
    stepKeys: [
      "instructionsSection5Step1",
      "instructionsSection5Step2",
      "instructionsSection5Step3",
      "instructionsSection5Step4",
    ],
    expectationKeys: ["instructionsSection5Expectation1"],
    screenshot: {
      srcByLocale: { en: editScreenEn, zh: editScreenZh },
      captionKey: "instructionsSection5ScreenshotCaption",
    },
  },
  {
    titleKey: "instructionsSection6Title",
    stepKeys: [
      "instructionsSection6Step1",
      "instructionsSection6Step2",
      "instructionsSection6Step3",
      "instructionsSection6Step4",
    ],
    expectationKeys: ["instructionsSection6Expectation1"],
    screenshot: {
      srcByLocale: { en: currencyScreenEn, zh: currencyScreenZh },
      captionKey: "instructionsSection6ScreenshotCaption",
    },
  },
  {
    titleKey: "instructionsSection7Title",
    stepKeys: [
      "instructionsSection7Step1",
      "instructionsSection7Step2",
      "instructionsSection7Step3",
      "instructionsSection7Step4",
    ],
    expectationKeys: ["instructionsSection7Expectation1"],
  },
  {
    titleKey: "instructionsSection8Title",
    stepKeys: [
      "instructionsSection8Step1",
      "instructionsSection8Step2",
      "instructionsSection8Step3",
      "instructionsSection8Step4",
    ],
    expectationKeys: ["instructionsSection8Expectation1"],
  },
  {
    titleKey: "instructionsSection9Title",
    stepKeys: [
      "instructionsSection9Step1",
      "instructionsSection9Step2",
      "instructionsSection9Step3",
      "instructionsSection9Step4",
    ],
    expectationKeys: ["instructionsSection9Expectation1"],
  },
  {
    titleKey: "instructionsSection10Title",
    stepKeys: [
      "instructionsSection10Step1",
      "instructionsSection10Step2",
      "instructionsSection10Step3",
      "instructionsSection10Step4",
    ],
    expectationKeys: ["instructionsSection10Expectation1"],
  },
];

export default function UploaderInstructionsClient({
  displayClassName,
  monoClassName,
}: {
  displayClassName: string;
  monoClassName: string;
}) {
  return (
    <UploaderShell displayClassName={displayClassName} monoClassName={monoClassName} page="instructions">
      <InstructionsContent />
    </UploaderShell>
  );
}

function InstructionsContent() {
  const { t, locale } = useUploaderI18n();
  const getScreenshotSrc = (section: InstructionSection): StaticImageData | null => {
    if (!section.screenshot) return null;
    return section.screenshot.srcByLocale[locale] ?? section.screenshot.srcByLocale.en;
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gate-border bg-gate-surface p-6 shadow-elevation-1">
        <p className="text-2xs uppercase tracking-label-lg text-gate-muted">
          {t("instructionsPageKicker")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-gate-ink">{t("instructionsPageTitle")}</h1>
        <p className="mt-3 text-sm text-gate-muted">{t("instructionsPageIntro")}</p>
      </section>

      {INSTRUCTION_SECTIONS.map((section, index) => {
        const screenshotSrc = getScreenshotSrc(section);
        return (
          <section
            key={section.titleKey}
            className="rounded-xl border border-gate-border bg-gate-bg p-6 shadow-elevation-1"
          >
            <div className="flex items-start gap-3">
              <span className="inline-block h-7 w-7 shrink-0 rounded-full bg-gate-accent text-center text-sm font-semibold leading-7 text-gate-on-accent">
                {index + 1}
              </span>
              <h2 className="pt-0.5 text-lg font-semibold text-gate-ink">{t(section.titleKey)}</h2>
            </div>

            <ol className="mt-4 list-decimal space-y-2 ps-12 text-sm text-gate-ink">
              {section.stepKeys.map((stepKey) => (
                <li key={stepKey}>{t(stepKey)}</li>
              ))}
            </ol>

            {section.expectationKeys?.length ? (
              <div className="mt-4 rounded-lg border border-gate-accent/30 bg-gate-accent-soft px-4 py-3">
                <p className="text-2xs uppercase tracking-label-lg text-gate-accent">
                  {t("instructionsExpectedResult")}
                </p>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-gate-ink">
                  {section.expectationKeys.map((expectationKey) => (
                    <li key={expectationKey}>{t(expectationKey)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {section.screenshot && screenshotSrc ? (
              <figure className="mt-5 overflow-hidden rounded-lg border border-gate-border bg-gate-surface p-3">
                <Image
                  src={screenshotSrc}
                  alt={t(section.screenshot.captionKey)}
                  className="mx-auto h-auto w-full rounded-md border border-gate-border"
                  priority={index < 2}
                />
                <figcaption className="mt-2 text-xs text-gate-muted">
                  {t(section.screenshot.captionKey)}
                </figcaption>
              </figure>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
