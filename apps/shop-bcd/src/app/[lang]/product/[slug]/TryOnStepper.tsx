"use client";
import { useTranslations } from "@acme/i18n";
import type { TryOnPhase } from "@ui/hooks/tryon/state";

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
    <ol className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
      {steps.map((s, i) => (
        <li key={s.key} className={i <= activeIdx ? 'font-medium text-foreground' : ''}>
          {s.label}{i < steps.length - 1 ? ' • ' : ''}
        </li>
      ))}
    </ol>
  );
}

export default TryOnStepper;

