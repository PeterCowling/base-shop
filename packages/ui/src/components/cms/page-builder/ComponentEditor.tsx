// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";

import type { PageComponent, HistoryState } from "@acme/types";
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
  onUpdateEditor?: (patch: any) => void;
  onUpdateEditorForId?: (id: string, patch: any) => void;
}

function ComponentEditor({ component, onChange, onResize, editor, onUpdateEditor, onUpdateEditorForId }: Props) {
  const { handleInput } = useComponentInputs(onChange);
  const { handleResize, handleFullSize } = useComponentResize(onResize);

  if (!component) return null;

  return (
    <Accordion
      type="multiple"
      // Keep most panels open by default for quicker access, but start
      // Content closed so tests and users can intentionally open it.
      defaultValue={["layout", "style", "interactions", "timeline"]}
      className="space-y-3"
    >
      <AccordionItem value="layout" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
          Layout
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
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="content" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
          Content
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
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
          Style
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <StylePanel component={component} handleInput={handleInput} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="interactions" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
          Interactions
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <InteractionsPanel
            component={component}
            handleInput={handleInput}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="timeline" className="border-none">
        <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
          Timeline
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <TimelinePanel component={component} handleInput={handleInput} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lottie" className="border-none">
        <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
          Lottie
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          <LottieControls component={component} handleInput={handleInput} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default memo(ComponentEditor);
