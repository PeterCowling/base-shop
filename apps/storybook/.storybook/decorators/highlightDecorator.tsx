import React, { useEffect, useMemo } from "react";
import type { Decorator } from "@storybook/nextjs";
import {
  HIGHLIGHT,
  type HighlightOptions,
  REMOVE_HIGHLIGHT,
  RESET_HIGHLIGHT,
} from "storybook/highlight";
import { useChannel } from "storybook/preview-api";

import type { StoryHighlightParameter } from "../types";

const normalizeHighlightParameter = (
  parameter: StoryHighlightParameter | undefined,
): { options: HighlightOptions; resetOnStoryChange: boolean } | null => {
  if (!parameter || parameter === false) {
    return null;
  }

  if (Array.isArray(parameter)) {
    return parameter.length > 0
      ? { options: { selectors: parameter }, resetOnStoryChange: true }
      : null;
  }

  if (parameter.disable) {
    return null;
  }

  const { resetOnStoryChange = true, disable: _disable, ...options } = parameter;
  if (!options.selectors || options.selectors.length === 0) {
    return null;
  }

  return { options: options as HighlightOptions, resetOnStoryChange };
};

const HighlightDecorator: Decorator = (Story, context) => {
  const highlightParameter = context.parameters.highlight as
    | StoryHighlightParameter
    | undefined;

  const highlightConfig = useMemo(() => {
    if (context.viewMode !== "story") {
      return null;
    }

    return normalizeHighlightParameter(highlightParameter);
  }, [context.viewMode, highlightParameter]);

  const emit = useChannel({}, []);

  useEffect(() => {
    if (!highlightConfig) {
      return;
    }

    const { options, resetOnStoryChange } = highlightConfig;
    emit(HIGHLIGHT, options);

    return () => {
      if (options.id) {
        emit(REMOVE_HIGHLIGHT, options.id);
        return;
      }

      if (resetOnStoryChange) {
        emit(RESET_HIGHLIGHT);
      }
    };
  }, [emit, highlightConfig]);

  return <Story />;
};

export const withHighlight: Decorator = HighlightDecorator;
