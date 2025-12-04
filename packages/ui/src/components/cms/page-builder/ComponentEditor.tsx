// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";

import type { PageComponent, HistoryState } from "@acme/types";
import type { EditorFlags } from "./panels/layout/types";
import { memo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../atoms/shadcn";
import LayoutPanel from "./panels/LayoutPanel";
import ContentPanel from "./panels/ContentPanel";
import InteractionsPanel from "./panels/InteractionsPanel";
import TimelinePanel from "./panels/TimelinePanel";
import LottieControls from "./panels/LottieControls";
import StylePanel from "./StylePanel";
import useComponentInputs from "./useComponentInputs";
import useComponentResize from "./useComponentResize";
import { resolveIssueLabel } from "./utils/issuePath";
import { useTranslations } from "@acme/i18n";

interface Issue {
  path: Array<string | number>;
  message: string;
}

interface Props {
  component: PageComponent | null;
  onChange: (patch: Partial<PageComponent>) => void;
  onResize: (patch: {
    width?: string;
    height?: string;
    top?: string;
    left?: string;
    widthDesktop?: string;
    widthTablet?: string;
    widthMobile?: string;
    heightDesktop?: string;
    heightTablet?: string;
    heightMobile?: string;
    marginDesktop?: string;
    marginTablet?: string;
    marginMobile?: string;
    paddingDesktop?: string;
    paddingTablet?: string;
    paddingMobile?: string;
  }) => void;
  editor?: HistoryState["editor"];
  onUpdateEditor?: (patch: Partial<EditorFlags>) => void;
  onUpdateEditorForId?: (id: string, patch: Partial<EditorFlags>) => void;
  issues?: Issue[];
}

function ComponentEditor({ component, onChange, onResize, editor, onUpdateEditor, onUpdateEditorForId, issues }: Props) {
  const { handleInput } = useComponentInputs(onChange);
  const { handleResize, handleFullSize } = useComponentResize(onResize);
  const t = useTranslations();

  if (!component) return null;

  // Build a set of top-level error keys to highlight inputs in panels
  const errorKeys = (() => {
    const s = new Set<string>();
    if (!issues) return s;
    for (const i of issues) {
      const path = Array.isArray(i.path) ? i.path : [];
      // Top-level keys we can highlight directly (ignore nested children for now)
      const hasChildren = path.includes("children");
      if (!hasChildren && typeof path[path.length - 1] === "string") s.add(String(path[path.length - 1]));
    }
    return s;
  })();

  return (
    <>
      {Array.isArray(issues) && issues.length > 0 && (
        <div className="mb-3 rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="mb-1 font-semibold">{t("cms.builder.validation.issues")}</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {issues.map((i) => {
              const resolved = resolveIssueLabel(i, t);
              const key = `${Array.isArray(i.path) ? i.path.join(".") : ""}:${i.message}`;
              return (
                <li key={key}>
                  <span className="font-medium">{resolved.panel}:</span> {i.message}
                  <span className="ms-1 text-xs text-destructive/80">{t("cms.builder.validation.fieldLabel", { field: resolved.field })}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Accordion
      type="multiple"
      // Keep most panels open by default for quicker access, but start
      // Content closed so tests and users can intentionally open it.
      defaultValue={["layout", "style", "interactions", "timeline"]}
      className="space-y-3"
    >
      <AccordionItem value="layout" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
          {t("cms.builder.panel.layout")}
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <LayoutPanel
            component={component}
            handleInput={handleInput}
            handleResize={handleResize}
            handleFullSize={handleFullSize}
            editorFlags={editor?.[component.id]}
            onUpdateEditor={onUpdateEditor}
            editorMap={editor}
            updateEditorForId={onUpdateEditorForId}
            errorKeys={errorKeys}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="content" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
          {t("cms.builder.panel.content")}
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <ContentPanel
            component={component}
            onChange={onChange}
            handleInput={handleInput}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="style" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
          {t("cms.builder.panel.style")}
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <StylePanel component={component} handleInput={handleInput} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="interactions" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
          {t("cms.builder.interactions")}
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <InteractionsPanel
            component={component}
            handleInput={handleInput}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="timeline" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
          {t("cms.builder.timeline")}
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <TimelinePanel component={component} handleInput={handleInput} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lottie" className="border-none">
        <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
          {t("cms.builder.panel.lottie")}
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <LottieControls component={component} handleInput={handleInput} />
        </AccordionContent>
      </AccordionItem>
      </Accordion>
    </>
  );
}

export default memo(ComponentEditor);
