/* File: src/componnents/bar/orderTaking/modal/MixerModal.tsx */
import React, { type FC, useCallback } from "react";

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
      <div className="flex flex-col space-y-2 mb-4">
        {mixerOptions.map((m) => (
          <button
            key={m}
            onClick={createMixerClickHandler(m)}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
          >
            {m}
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-300 text-black hover:bg-gray-400 transition-colors duration-200 rounded dark:bg-darkSurface dark:text-darkAccentGreen"
      >
        Cancel
      </button>
    </ModalContainer>
  );
};

MixerModalBase.displayName = "MixerModalBase";
export default withModalBackground(MixerModalBase);
