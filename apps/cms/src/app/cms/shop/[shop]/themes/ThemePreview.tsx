import WizardPreview from "../../../wizard/WizardPreview";
import { CSSProperties } from "react";

interface Props {
  style: CSSProperties;
  onTokenSelect: (
    token: string,
    coords?: { x: number; y: number },
  ) => void;
}

export default function ThemePreview({ style, onTokenSelect }: Props) {
  return (
    <WizardPreview style={style} inspectMode onTokenSelect={onTokenSelect} />
  );
}
