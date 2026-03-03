/* File: src/componnents/bar/orderTaking/modal/MixerModal.tsx */
import React, { type FC, useCallback } from "react";

import { Button } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives";

import { withModalBackground } from "../../../../hoc/withModalBackground";

import ModalContainer from "./ModalContainer";

interface MixerModalProps {
  onSelect: (mixer: string) => void;
  onCancel: () => void;
}

/**
 * MixerModal:
 * - Lists mixer options (including 'nothing').
 */
const MixerModalBase: FC<MixerModalProps> = ({ onSelect, onCancel }) => {
  const mixerOptions = [
    "Mixer Tonic Water",
    "Mixer Soda Water",
    "Mixer OJ Mix",
    "Mixer Coke",
    "Mixer Coke Zero",
    "Mixer Sprite",
    "Mixer Espresso",
    "nothing",
  ];

  const createMixerClickHandler = useCallback(
    (m: string) => () => {
      onSelect(m);
    },
    [onSelect]
  );

  return (
    <ModalContainer widthClasses="w-80">
      <h2 className="text-lg font-semibold mb-4">Select a Mixer</h2>
      <Stack gap={2} className="mb-4">
        {mixerOptions.map((m) => (
          <Button
            key={m}
            onClick={createMixerClickHandler(m)}
            color="primary"
            tone="solid"
          >
            {m}
          </Button>
        ))}
      </Stack>
      <Button
        onClick={onCancel}
        color="default"
        tone="soft"
      >
        Cancel
      </Button>
    </ModalContainer>
  );
};

MixerModalBase.displayName = "MixerModalBase";
export default withModalBackground(MixerModalBase);
