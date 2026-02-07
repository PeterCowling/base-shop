import { Stack } from "@acme/design-system/primitives";

export default function PageHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <Stack gap={3} className="pp-card p-6 md:p-8">
      {badge ? <span className="pp-chip">{badge}</span> : null}
      <Stack gap={2}>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-foreground/70 md:text-base">{subtitle}</p>
      </Stack>
    </Stack>
  );
}
