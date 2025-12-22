 
export function MenuRow({
  name,
  price,
  note,
}: {
  name: string;
  price?: string | undefined;
  note?: string | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="text-base text-brand-text dark:text-brand-surface">
        <div className="font-medium">{name}</div>
        {note ? (
          <div className="text-sm text-brand-text/70 dark:text-brand-surface/70">{note}</div>
        ) : null}
      </div>
      {price ? (
        <div className="shrink-0 text-end text-base font-semibold text-brand-heading dark:text-brand-secondary">
          {price}
        </div>
      ) : (
        <div className="shrink-0" />
      )}
    </div>
  );
}
