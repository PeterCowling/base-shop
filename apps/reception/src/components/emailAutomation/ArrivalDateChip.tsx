/**
 * ArrivalDateChip displays a read-only date value in a fixed-width chip.
 */
interface ArrivalDateChipProps {
  arrivalDate?: string;
}

export default function ArrivalDateChip({ arrivalDate }: ArrivalDateChipProps) {
  return (
    <div className="w-44 bg-surface-2 border border-border-strong text-foreground px-2 py-1 rounded-lg text-sm text-center">
      {arrivalDate || "—"}
    </div>
  );
}
