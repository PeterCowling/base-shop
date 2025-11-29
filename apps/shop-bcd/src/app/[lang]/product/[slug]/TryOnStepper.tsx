/* i18n-exempt file -- I18N-123 try-on stepper; labels use i18n keys, className tokens are design-system utilities [ttl=2026-01-31] */
"use client";
import { useTranslations } from "@acme/i18n";
import type { TryOnPhase } from "@ui/hooks/tryon/state";
import { Inline } from "@ui/components/atoms/primitives/Inline";

export function TryOnStepper({ phase }: { phase: TryOnPhase }) {
  const t = useTranslations();
  const steps = [
    { key: 'upload', label: t('tryon.step.upload') },
    { key: 'preparing', label: t('tryon.step.preparing') },
    { key: 'preview', label: t('tryon.step.preview') },
    { key: 'enhancing', label: t('tryon.step.enhancing') },
    { key: 'done', label: t('tryon.step.done') },
  ];
  const activeIdx = phase === 'idle' ? 0 : phase === 'uploading' ? 0 : phase === 'preprocessed' ? 1 : phase === 'preview' ? 2 : phase === 'enhancing' ? 3 : phase === 'done' ? 4 : 0;
  return (
    <Inline asChild gap={2} alignY="center" className="mb-2 text-xs text-muted-foreground">
      <ol>
        {steps.map((s, i) => (
          <li
            key={s.key}
            className={i <= activeIdx ? "tryon-step-active" : ""}
          >
            {s.label}
            {i < steps.length - 1 ? ` ${t("tryon.step.separator")} ` : ""}
          </li>
        ))}
      </ol>
    </Inline>
  );
}

export default TryOnStepper;
