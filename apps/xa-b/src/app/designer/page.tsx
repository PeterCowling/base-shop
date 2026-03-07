"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

import { xaI18n } from "../../lib/xaI18n";

import { DesignerPageClient } from "./[slug]/DesignerPageClient";

function DesignerRuntimePageContent() {
  const searchParams = useSearchParams();
  const handle = searchParams.get("handle")?.trim() ?? "";

  if (!handle) {
    return (
      <main className="sf-content">
        <Section padding="default">
          <EmptyState
            className="rounded-sm border border-border-1"
            title={xaI18n.t("xaB.src.app.designer.page.emptyTitle")}
            description={xaI18n.t("xaB.src.app.designer.page.emptyDescription")}
          />
        </Section>
      </main>
    );
  }

  return <DesignerPageClient designerHandle={handle} />;
}

export default function DesignerRuntimePage() {
  return (
    <Suspense fallback={null}>
      <DesignerRuntimePageContent />
    </Suspense>
  );
}
