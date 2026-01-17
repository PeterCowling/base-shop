import { Stack } from "@acme/ui/components/atoms/primitives";

export default function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Stack gap={2} className="pp-card p-5">
      <span className="text-xs uppercase tracking-widest text-foreground/60">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      <span className="text-xs text-foreground/60">{hint}</span>
    </Stack>
  );
}
