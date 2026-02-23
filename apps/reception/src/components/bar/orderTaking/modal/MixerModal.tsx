/* File: src/componnents/bar/orderTaking/modal/MixerModal.tsx */
import React, { type FC, useCallback } from "react";

import { Stack } from "@acme/design-system/primitives";
import { ReceptionButton as Button } from "@acme/ui/operations";

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
            className="px-4 py-2 bg-info-main text-primary-fg hover:bg-info-main transition-colors duration-200 rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
          >
            {m}
          </Button>
        ))}
      </Stack>
      <Button
        onClick={onCancel}
        className="px-4 py-2 bg-surface-3 text-foreground hover:bg-surface-3 transition-colors duration-200 rounded dark:bg-darkSurface dark:text-darkAccentGreen"
      >
        Cancel
      </Button>
    </ModalContainer>
  );
};

MixerModalBase.displayName = "MixerModalBase";
export default withModalBackground(MixerModalBase);
