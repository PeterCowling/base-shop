"use client";

import Image, { type StaticImageData } from "next/image";

import type { UploaderLocale, UploaderMessageKey } from "../../lib/uploaderI18n";
import { getUploaderMessage } from "../../lib/uploaderI18n";
import UploaderShell from "../UploaderShell.client";

import addProductScreen from "./assets/add-product-screen.png";
import currencyScreen from "./assets/currency-screen.png";
import editScreen from "./assets/edit-screen.png";
import loginScreen from "./assets/login-screen.png";

type InstructionSection = {
  titleKey: UploaderMessageKey;
  stepKeys: readonly UploaderMessageKey[];
  screenshot?: {
    src: StaticImageData;
    captionKey: UploaderMessageKey;
  };
};

const INSTRUCTION_LOCALES: readonly UploaderLocale[] = ["en", "zh"];

const INSTRUCTION_SECTIONS: readonly InstructionSection[] = [
  {
    titleKey: "instructionsSection1Title",
    stepKeys: [
      "instructionsSection1Step1",
      "instructionsSection1Step2",
      "instructionsSection1Step3",
      "instructionsSection1Step4",
    ],
    screenshot: {
      src: loginScreen,
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
    screenshot: {
      src: addProductScreen,
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
  },
  {
    titleKey: "instructionsSection4Title",
    stepKeys: [
      "instructionsSection4Step1",
      "instructionsSection4Step2",
      "instructionsSection4Step3",
      "instructionsSection4Step4",
    ],
  },
  {
    titleKey: "instructionsSection5Title",
    stepKeys: [
      "instructionsSection5Step1",
      "instructionsSection5Step2",
      "instructionsSection5Step3",
      "instructionsSection5Step4",
    ],
    screenshot: {
      src: editScreen,
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
    screenshot: {
      src: currencyScreen,
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
  },
  {
    titleKey: "instructionsSection8Title",
    stepKeys: [
      "instructionsSection8Step1",
      "instructionsSection8Step2",
      "instructionsSection8Step3",
      "instructionsSection8Step4",
    ],
  },
];

function text(locale: UploaderLocale, key: UploaderMessageKey): string {
  return getUploaderMessage(locale, key);
}

function LanguagePanel({
  locale,
  titleKey,
  stepKeys,
}: {
  locale: UploaderLocale;
  titleKey: UploaderMessageKey;
  stepKeys: readonly UploaderMessageKey[];
}) {
  const labelKey =
    locale === "en" ? "instructionsLanguageEnglish" : "instructionsLanguageChinese";

  return (
    <section className="rounded-lg border border-gate-border bg-gate-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-label text-gate-muted">
        {text(locale, labelKey)}
      </h3>
      <p className="mt-2 text-sm font-semibold text-gate-ink">{text(locale, titleKey)}</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gate-ink">
        {stepKeys.map((stepKey) => (
          <li key={stepKey}>{text(locale, stepKey)}</li>
        ))}
      </ol>
    </section>
  );
}

export default function UploaderInstructionsClient({
  displayClassName,
  monoClassName,
}: {
  displayClassName: string;
  monoClassName: string;
}) {
  return (
    <UploaderShell displayClassName={displayClassName} monoClassName={monoClassName} page="instructions">
      <div className="space-y-6">
        <section className="rounded-xl border border-gate-border bg-gate-surface p-6 shadow-elevation-1">
          <p className="text-2xs uppercase tracking-label-lg text-gate-muted">
            {text("en", "instructionsPageKicker")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gate-ink">
            {text("en", "instructionsPageTitle")} / {text("zh", "instructionsPageTitle")}
          </h1>
          <p className="mt-3 text-sm text-gate-muted">{text("en", "instructionsPageIntro")}</p>
          <p className="mt-2 text-sm text-gate-muted">{text("zh", "instructionsPageIntro")}</p>
        </section>

        {INSTRUCTION_SECTIONS.map((section, index) => (
          <section
            key={section.titleKey}
            className="rounded-xl border border-gate-border bg-gate-bg p-6 shadow-elevation-1"
          >
            <h2 className="text-lg font-semibold text-gate-ink">
              {index + 1}. {text("en", section.titleKey)}
            </h2>
            <p className="mt-1 text-sm text-gate-muted">{text("zh", section.titleKey)}</p>

            <div className="mt-4 space-y-4">
              {INSTRUCTION_LOCALES.map((locale) => (
                <LanguagePanel
                  key={`${section.titleKey}-${locale}`}
                  locale={locale}
                  titleKey={section.titleKey}
                  stepKeys={section.stepKeys}
                />
              ))}
            </div>

            {section.screenshot ? (
              <figure className="mt-5 overflow-hidden rounded-lg border border-gate-border bg-gate-surface p-3">
                <Image
                  src={section.screenshot.src}
                  alt={`${text("en", section.screenshot.captionKey)} ${text("zh", section.screenshot.captionKey)}`}
                  className="h-auto w-full rounded-md border border-gate-border"
                  priority={index < 2}
                />
                <figcaption className="mt-2 text-xs text-gate-muted">
                  {text("en", section.screenshot.captionKey)} {text("zh", section.screenshot.captionKey)}
                </figcaption>
              </figure>
            ) : null}
          </section>
        ))}
      </div>
    </UploaderShell>
  );
}
