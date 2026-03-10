import CountInputModal from "./CountInputModal";

export interface ReturnKeycardsModalProps {
  onConfirm: (count: number) => Promise<void>;
  onCancel: () => void;
}

export default function ReturnKeycardsModal({
  onConfirm,
  onCancel,
}: ReturnKeycardsModalProps) {
  return (
    <CountInputModal
      title="Return Keycards"
      submitLabel="Confirm return"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
