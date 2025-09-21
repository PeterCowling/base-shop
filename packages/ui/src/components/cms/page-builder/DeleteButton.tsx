"use client";

type Props = {
  locked: boolean;
  onRemove: () => void;
};

export default function DeleteButton({ locked, onRemove }: Props) {
  return (
    <button
      type="button"
      onClick={() => { if (!locked) onRemove(); }}
      className="bg-danger absolute top-1 right-1 rounded px-2 text-xs disabled:opacity-50"
      data-token="--color-danger"
      disabled={!!locked}
      aria-disabled={!!locked}
      aria-label={locked ? "Delete disabled while locked" : "Delete"}
      title={locked ? "Unlock to delete" : "Delete"}
    >
      <span className="text-danger-foreground" data-token="--color-danger-fg">
        ×
      </span>
    </button>
  );
}

