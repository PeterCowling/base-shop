/**
 * ArrivalDateChip displays a read-only date value in a fixed-width chip.
 */
interface ArrivalDateChipProps {
  arrivalDate?: string;
}

export default function ArrivalDateChip({ arrivalDate }: ArrivalDateChipProps) {
  return (
    <div className="w-175px bg-surface-2 text-foreground px-2 py-1 rounded text-sm text-center dark:bg-darkSurface dark:text-darkAccentGreen">
      {arrivalDate || "—"}
    </div>
  );
}
