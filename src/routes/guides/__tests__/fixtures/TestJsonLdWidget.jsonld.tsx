import type { GuideSeoTemplateContext } from "../../guide-seo/types";

export default function TestJsonLdWidget(): JSX.Element {
  return <script type="application/ld+json" data-testid="test-jsonld">{"{}"}</script>;
}

export function buildJsonLd(context: GuideSeoTemplateContext): JSX.Element {
  return (
    <script type="application/ld+json" data-testid="context-jsonld">
      {JSON.stringify({ guide: context.guideKey })}
    </script>
  );
}