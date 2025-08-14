// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { memo } from "react";
import { Accordion } from "../../atoms/shadcn";
import LayoutPanel from "./panels/LayoutPanel";
import ContentPanel from "./panels/ContentPanel";
import InteractionsPanel from "./panels/InteractionsPanel";
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
}

function ComponentEditor({ component, onChange, onResize }: Props) {
  if (!component) return null;

  const { handleInput } = useComponentInputs(onChange);
  const { handleResize, handleFullSize } = useComponentResize(onResize);

  return (
    <Accordion
      items={[
        {
          title: "Layout",
          content: (
            <LayoutPanel
              component={component}
              handleInput={handleInput}
              handleResize={handleResize}
              handleFullSize={handleFullSize}
            />
          ),
        },
        {
          title: "Content",
          content: (
            <ContentPanel
              component={component}
              onChange={onChange}
              handleInput={handleInput}
            />
          ),
        },
        {
          title: "Interactions",
          content: (
            <InteractionsPanel
              component={component}
              handleInput={handleInput}
            />
          ),
        },
      ]}
    />
  );
}

export default memo(ComponentEditor);

