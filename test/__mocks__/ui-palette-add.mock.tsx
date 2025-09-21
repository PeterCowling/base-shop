import React from "react";

export default function PaletteMock({ onAdd }: { onAdd: (t: string) => void }) {
  return <button onClick={() => onAdd("Text")}>Add Block</button>;
}
