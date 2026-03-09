"use client";

import CountInputModal from "./CountInputModal";

export interface AddKeycardsModalProps {
  onConfirm: (count: number) => Promise<void>;
  onCancel: () => void;
}

export default function AddKeycardsModal({
  onConfirm,
  onCancel,
}: AddKeycardsModalProps) {
  return (
    <CountInputModal
      title="Add Keycards"
      submitLabel="Confirm add"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
