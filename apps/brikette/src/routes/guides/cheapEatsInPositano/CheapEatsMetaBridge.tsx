// src/routes/guides/cheapEatsInPositano/CheapEatsMetaBridge.tsx
import { CheapEatsMeta } from "./CheapEatsMeta";
import { useCheapEatsContent } from "./useCheapEatsContent";

export function CheapEatsMetaBridge(): JSX.Element {
  const { meta } = useCheapEatsContent();
  return <CheapEatsMeta {...meta} />;
}

export function buildCheapEatsMetaJsonLd(): JSX.Element {
  return <CheapEatsMetaBridge />;
}

export default CheapEatsMetaBridge;
