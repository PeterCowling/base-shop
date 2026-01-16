/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- DEV-000 [ttl=2099-12-31] Non-route helper under guides; head tags come from the route meta()/links() exports per src/routes/AGENTS.md §3 */
// src/routes/guides/cheapEatsInPositano/CheapEatsMetaBridge.tsx
import { CheapEatsMeta } from "./CheapEatsMeta";
import { useCheapEatsContent } from "./useCheapEatsContent";

export default function CheapEatsMetaBridge(): JSX.Element {
  const { meta } = useCheapEatsContent();
  return <CheapEatsMeta {...meta} />;
}

export function buildCheapEatsMetaJsonLd(): JSX.Element {
  return <CheapEatsMetaBridge />;
}